// ─── Payday draft-invoice submitter ─────────────────────────────────────────
//
// Takes a completed job + its cruise line + the computed invoice rows (from
// rateCard.buildInvoiceRows) and POSTs a draft invoice to Payday. Never auto-
// sends — the user reviews + sends manually from Payday's UI, where they also
// attach the local PDF.
//
// Status note: we set status: "DRAFT" on the payload — the all-caps value
// the docs status table uses (DRAFT, SENT, PAID, CANCELLED, CREDIT,
// DELETED). Lower-case "draft", title-case "Draft", and isDraft: true
// were all silently finalized in earlier attempts; uppercase matches the
// canonical case in the docs.
//
// Why we need DRAFT specifically (and not just SENT-but-unsent): Payday
// won't accept manual PDF attachments on finalized invoices through the
// UI. The cost-breakdown PDF is critical for our review workflow, so
// the invoice has to land in editable DRAFT state where the user can
// upload the PDF that downloaded locally before clicking Send.
//
// (The multipart create-with-attachment code path in payday.js is the
// "correct" solution per Payday's docs, but is currently 500ing on
// Payday's server — under investigation with their support. When they
// fix it we can drop the DRAFT workaround and pass the attachment
// inline.)

import { payday } from "./payday.js";
import { SERVICE_FULL_NAMES, SERVICE_CODES, JOB_TYPES } from "./constants.js";
import { vatRateFor } from "./vatRules.js";

/**
 * Format a date as "DD.MM.YYYY" for the Payday invoice comment.
 */
function fmtDDMMYYYY(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/**
 * Add N days to an ISO date "YYYY-MM-DD". Returns ISO.
 */
function addDays(iso, days) {
  const dt = new Date(iso + "T12:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + (days | 0));
  return dt.toISOString().slice(0, 10);
}

/**
 * Strip the " (Cruise Line)" suffix some job.ship values carry. Falls back
 * to the raw string when no parens are present.
 */
function shipDisplayName(rawShip) {
  if (!rawShip) return "";
  const i = rawShip.lastIndexOf(" (");
  return i > 0 ? rawShip.slice(0, i).trim() : rawShip.trim();
}

/**
 * Extract the bare reference number from job.po_number — i.e. strip any
 * trailing service code and/or "AKU" suffix the user may have already
 * appended (the new-job form auto-fills the full string, but some jobs
 * are entered with just the raw number). We re-derive the suffix from
 * job.type and job.port at invoice time so the reference is always
 * consistent regardless of what's in the po_number field.
 */
function bareReferenceNumber(po) {
  if (!po) return "";
  const tokens = po.trim().split(/\s+/);
  const codes = new Set(Object.values(SERVICE_CODES));
  if (tokens.length > 1 && tokens[tokens.length - 1].toUpperCase() === "AKU") tokens.pop();
  if (tokens.length > 1 && codes.has(tokens[tokens.length - 1])) tokens.pop();
  return tokens.join(" ");
}

/**
 * Build the Payday create-invoice payload from a job + context.
 *
 * @param {object} job              the completed job (with cruise_line_id, po_number, berth, type, date)
 * @param {object} cruiseLine       cruise_lines row (payday_customer_id, payment_terms_days, name)
 * @param {Array}  rows             output of rateCard.buildInvoiceRows
 * @param {string|null} lastVikingMarsDate  for per-line VAT lookup
 * @returns {object} payload ready for payday.invoices.create
 */
export function buildDraftInvoicePayload(job, cruiseLine, rows, lastVikingMarsDate) {
  const fullName = SERVICE_FULL_NAMES[job.type] || JOB_TYPES[job.type]?.label || job.type;
  const ship = shipDisplayName(job.ship);

  const termsDays = Number.isFinite(cruiseLine?.payment_terms_days) ? cruiseLine.payment_terms_days : 30;
  const dueDate = addDays(job.date, termsDays);

  // Reference (Payday's "Tilvísun"): always "<refNumber> <ServiceCode> [AKU]".
  // The new-job form auto-fills po_number with the composed string, but
  // some jobs are saved with just the raw number — and the colleague
  // sometimes edits the field directly. Re-compose from the job's
  // canonical type and port so the reference is invariant regardless of
  // what's stored. bareReferenceNumber strips any trailing code/AKU
  // already on po_number so we don't double-append.
  const refNumber = bareReferenceNumber(job.po_number);
  const code = SERVICE_CODES[job.type] || "";
  const akuSuffix = job.port === "AK" ? "AKU" : "";
  const reference = [refNumber, code, akuSuffix].filter(Boolean).join(" ");

  // Description block (Payday's "Athugasemdir"): four lines, blank in
  // the middle.
  //   <ship> - <location>
  //   <date dd.mm.yyyy>
  //   <blank>
  //   <full service name>
  //
  // Location convention:
  //   - Akureyri jobs (port === "AK") → "Akureyri" (the city name).
  //     There's effectively one cruise berth in Akureyri, so the berth
  //     name adds no information for the customer.
  //   - Reykjavík jobs → the berth name (e.g. "Skarfabakki",
  //     "Miðbakki"). Reykjavík has multiple cruise berths and the
  //     specific one matters for billing context.
  //   - If a Reykjavík job is missing a berth, the dash is dropped and
  //     only the ship name appears on the header line.
  //
  // Field name: `description` per the invoice attribute table — top
  // level. We previously sent this as `comment`, which Payday's JSON
  // create silently ignored (it's a line-level field, not an invoice-
  // level one). The multipart endpoint isn't as forgiving and 500s on
  // the unknown field, so we use the documented name.
  const location = job.port === "AK" ? "Akureyri" : (job.berth || "").trim();
  const headerLine = [ship, location].filter(Boolean).join(" - ");

  // Viking invoices use a bespoke notes block: a USD-conversion summary
  // (left as XX placeholders for the user to fill in by hand, since the
  // FX rate is looked up at send time) followed by the ship / berth /
  // service-date / service block. Berth shortens "VÖR Cruise Terminal"
  // to "VÖR"; everything is upper-cased to match the house style.
  const isViking = (cruiseLine?.name || "").trim().toLowerCase() === "viking";
  let description;
  if (isViking) {
    let berth = (job.berth || "").trim();
    if (/vör/i.test(berth)) berth = "VÖR";
    const berthLine = berth ? `${berth.toUpperCase()}, REYKJAVIK` : "REYKJAVIK";
    description = [
      "Total amount in USD: $XX,XXX.XX",
      "USD/ISK rate: XXX,XX",
      "Calculated on XX.XX.2026)",
      "",
      ship.toUpperCase(),
      berthLine,
      fmtDDMMYYYY(job.date),
      "",
      fullName.toUpperCase(),
    ].join("\n");
  } else {
    description = [headerLine, fmtDDMMYYYY(job.date), "", fullName]
      .filter(part => part !== undefined)
      .join("\n");
  }

  // generateInvoice emits rows with `amount`, `unitPriceIsk`, and
  // `_totalNum` (the full line total). The shape doesn't map 1:1 to
  // Payday because the PDF and Payday count quantities differently:
  //
  //   - PDF: amount = resource count (e.g. 1 forklift), unit = label
  //          like "4h" / "Per call", total = amount × hours × rate
  //   - Payday: quantity × unitPriceExcludingVat = line total. There's
  //             no "hours" dimension on a line — hours have to be
  //             folded into quantity.
  //
  // So for Payday we send quantity = _totalNum / unitPriceIsk. That
  // gives Payday's qty × unitPrice math the same result as our PDF
  // total. Example: 1 telescopic forklift at 19,790 ISK/hr for 4 hours
  // → _totalNum 79,160, unitPriceIsk 19,790 → Payday quantity 4. Two
  // forklifts at the same rate for 4 hours → _totalNum 158,320 →
  // quantity 8.
  //
  // Unpriced rows (e.g. resources missing from the rate sheet) come
  // through with unitPriceIsk 0 and _totalNum 0. Falling back to
  // r.amount keeps the line visible with a sensible qty so the user
  // can type the missing rate in Payday's UI without re-entering the
  // resource count too.
  //
  // The Math.round/100 protects against floating-point dust on the
  // division (e.g. 4.000000000001 → 4).
  //
  // Line payload (the shape Payday's docs example uses): fill in the
  // ex-VAT unit price and the VAT percentage, and Payday computes the
  // inc-VAT total itself. We deliberately do NOT send
  // `unitPriceIncludingVat` — earlier experiments where we sent both
  // fields tripped Payday's VAT inference and silently zeroed VSK %.
  //
  // Field-name notes (learned from Payday error responses):
  //   - Unit price must be sent as `unitPriceExcludingVat`. The plain
  //     `unitPrice` field is silently dropped, then Payday 400s with
  //     "unit price excluding VAT or unit price including VAT must be
  //     specified".
  //   - VAT field is `vatPercentage` (docs invoice line object table).
  //     We previously sent `vatRate` which Payday silently dropped and
  //     defaulted every line to 0%.
  //   - Our rate sheets are stored ex-VAT, so unitPriceIsk maps
  //     directly to unitPriceExcludingVat with no conversion.
  //
  // Unpriced rows (no rate sheet match) come through with
  // unitPriceIsk = 0; the line stays visible at qty = r.amount and the
  // user types the missing rate in Payday's UI.
  const lines = rows.map(r => {
    const unitExc  = Number(r.unitPriceIsk) || 0;
    const total    = Number(r._totalNum)    || 0;
    const quantity = unitExc > 0
      ? Math.round((total / unitExc) * 100) / 100
      : (Number(r.amount) || 0);
    return {
      description:           r.resource,
      quantity,
      unitPriceExcludingVat: unitExc,
      vatPercentage:         vatRateFor(cruiseLine?.name, ship, job.date, lastVikingMarsDate),
    };
  });

  return {
    // Field-name notes (learned from Payday error responses):
    //   - "Customer is required" → field name is `customer` (not `customerId`).
    //   - Passing a raw UUID string triggered "Invalid JSON data" — Payday
    //     wants the relation as a nested object with an `id`. Same pattern
    //     likely applies to any other entity references we add later.
    customer:     { id: cruiseLine?.payday_customer_id },
    invoiceDate:  job.date,
    dueDate:      dueDate,
    // Gjalddagi = dueDate, Eindagi = finalDueDate. Payday named this
    // field after the Icelandic concept; "Final due date is required"
    // was the next 400 after we fixed the customer shape.
    finalDueDate: dueDate,
    // "Currency code is required" was the next 400. IPS bills exclusively
    // in ISK; hardcoded until we have a reason to vary it.
    currencyCode: "ISK",
    reference,
    description,
    // Uppercase to match the canonical status values from the docs.
    // See the file header for the full reasoning.
    status: "DRAFT",
    lines,
  };
}

/**
 * Validate prerequisites then POST an invoice (optionally with a PDF
 * attachment) to Payday in a single multipart call. The Payday API has
 * no separate "upload attachment" endpoint — file attachment piggybacks
 * on the create call as an `attachment1` multipart field. See
 * payday.invoices.create for the request shape.
 *
 * @param {object} job
 * @param {object} cruiseLine
 * @param {Array}  rows
 * @param {string|null} lastVikingMarsDate
 * @param {{ blob: Blob, filename: string } | null} [attachment]
 * @returns {{ok: true, data: any} | {ok: false, error: string}}
 */
export async function createDraftInvoice(job, cruiseLine, rows, lastVikingMarsDate, attachment = null) {
  // ── Preflight ───────────────────────────────────────────────────────────
  // Cruise line is resolved upstream from job.ship + job.date (no
  // cruise_line_id stored on the job). Report a missing lookup distinctly
  // from a missing Payday mapping so the user knows where to fix it.
  if (!cruiseLine) {
    return {
      ok: false,
      error: `Cannot create invoice — couldn't identify a cruise line for ship "${job?.ship || "—"}" on ${job?.date || "?"}. Check that the ship is in the schedule.`,
    };
  }
  if (!cruiseLine.payday_customer_id) {
    return {
      ok: false,
      error: `${cruiseLine.name} has no Payday customer mapping. Set it in CFO Workspace → Settings (CEO access required).`,
    };
  }

  const missing = [];
  if (!job?.po_number)            missing.push("PO number");
  if (!job?.date)                 missing.push("job date");
  if (!rows || rows.length === 0) missing.push("invoice line items (no hours recorded?)");
  if (missing.length) {
    return { ok: false, error: `Cannot create invoice — missing: ${missing.join(", ")}.` };
  }
  if (!payday.connected()) {
    return { ok: false, error: "Payday API credentials are not configured (VITE_PAYDAY_CLIENT_ID / VITE_PAYDAY_CLIENT_SECRET)." };
  }

  const payload = buildDraftInvoicePayload(job, cruiseLine, rows, lastVikingMarsDate);
  const res = await payday.invoices.create(payload, attachment);
  if (!res.ok) {
    const e = res.error || {};
    // Build a human-readable message that always includes the HTTP status
    // when we have one — bare error bodies were getting reported as "{}"
    // which told the user nothing. Full diagnostic is also logged to the
    // browser console (see payday.js).
    const statusBit = e.status ? `HTTP ${e.status}${e.statusText ? ` ${e.statusText}` : ""}` : "";
    const msgBit = e.message || (typeof e === "string" ? e : JSON.stringify(e));
    const combined = [statusBit, msgBit].filter(Boolean).join(" — ");
    return {
      ok: false,
      error: `Payday rejected the invoice: ${combined || "no detail returned"}. Full response in the browser console.`,
    };
  }
  return { ok: true, data: res.data };
}
