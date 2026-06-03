// ─── Payday draft-invoice submitter ─────────────────────────────────────────
//
// Takes a completed job + its cruise line + the computed invoice rows (from
// rateCard.buildInvoiceRows) and POSTs a draft invoice to Payday. Never auto-
// sends — the user reviews + sends manually from Payday's UI, where they also
// attach the local PDF.
//
// Status note: we set status: "draft" on the payload. The Payday alpha API
// docs we have describe this as the field that controls whether the invoice
// is created in draft vs. sent state. If their API uses a different shape in
// the future, this is the single place to update.

import { payday } from "./payday.js";
import { SERVICE_FULL_NAMES, JOB_TYPES } from "./constants.js";
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
  const berth = (job.berth || "").trim();
  const po = (job.po_number || "").trim();

  const termsDays = Number.isFinite(cruiseLine?.payment_terms_days) ? cruiseLine.payment_terms_days : 30;
  const dueDate = addDays(job.date, termsDays);

  // Reference: use the PO field verbatim. The new-job form auto-fills it
  // with the full "{base} {ServiceCode} [AKU]" string, so no further
  // composition is required here.
  const reference = po;

  // Comment block (Athugasemdir): three blocks separated by blank lines.
  //   <ship> - <berth>
  //   <date dd.mm.yyyy>
  //
  //   <full service name>
  const headerLine = [ship, berth].filter(Boolean).join(" - ");
  const comment = [headerLine, fmtDDMMYYYY(job.date), "", fullName]
    .filter(part => part !== undefined)
    .join("\n");

  // generateInvoice (origin/main) emits rows with `amount`, `unitPriceIsk`,
  // and `_totalNum` (numeric line total). We mirror those into the Payday
  // shape; unpriced lines come through as 0/0 — Payday accepts the draft
  // and the user types in the missing rate in the UI when reviewing.
  //
  // Field-name notes (learned from Payday error responses):
  //   - Unit price must be sent as `unitPriceExcludingVat`. The plain
  //     `unitPrice` field is silently dropped, then Payday 400s with
  //     "unit price excluding VAT or unit price including VAT must be
  //     specified".
  //   - Our rate sheets are all stored ex-VAT (VAT is added on top per
  //     line via `vatRate`), so unitPriceIsk maps directly to
  //     unitPriceExcludingVat with no conversion.
  const lines = rows.map(r => ({
    description:           r.resource,
    quantity:              Number(r.amount) || 0,
    unitPriceExcludingVat: Number(r.unitPriceIsk) || 0,
    // per-line VAT — uses cruise line + ship + call date + last-Mars-call lookup
    vatRate:               vatRateFor(cruiseLine?.name, ship, job.date, lastVikingMarsDate),
  }));

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
    comment,
    lines,
    // No draft flag.
    //
    // Payday's "Drög" (Draft) tab is a UI affordance for work-in-progress
    // that hasn't reached the server yet — it's NOT an API state. Any
    // invoice POSTed through /invoices is created on the server in a
    // ready-to-send state but is NOT auto-sent to the customer. The user
    // reviews it in Payday and clicks the green "Send invoice" button to
    // dispatch (or doesn't, if they want to cancel / edit further).
    //
    // We tried status: "draft" / status: "Draft" / isDraft: true on
    // earlier iterations — all silently ignored, all created normal
    // unsent invoices. The unsent state IS the draft workflow.
  };
}

/**
 * Validate prerequisites then POST a draft invoice to Payday.
 *
 * @returns {{ok: true, data: any} | {ok: false, error: string}}
 */
export async function createDraftInvoice(job, cruiseLine, rows, lastVikingMarsDate) {
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
  const res = await payday.invoices.create(payload);
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

/**
 * Read-only probe: verify the /invoices/{id}/attachments endpoint actually
 * exists before we create a new invoice. Uses the most recent existing
 * invoice as the probe target so we don't have to create anything to
 * discover whether our URL guess is right.
 *
 * Three possible outcomes:
 *   { ok: true }                  — endpoint resolved, safe to proceed
 *   { ok: true, skipped: "..." }  — no existing invoice to probe with;
 *                                   caller should proceed best-effort
 *   { ok: false, error: "..." }   — endpoint 404'd; caller should abort
 *                                   BEFORE creating a new invoice
 */
export async function probeAttachmentsEndpoint() {
  const list = await payday.invoices.list({ perpage: 1 });
  if (!list.ok) {
    // List itself failed — can't probe. Don't block the create on this.
    return { ok: true, skipped: "Couldn't list existing invoices for probe." };
  }
  const probeId = list.data?.[0]?.id;
  if (!probeId) {
    return { ok: true, skipped: "No existing invoices on file to probe against." };
  }
  const probe = await payday.invoices.listAttachments(probeId);
  if (probe.ok) return { ok: true };

  const status = probe.error?.status;
  if (status === 404) {
    return {
      ok: false,
      error: `Attachment endpoint /invoices/{id}/attachments returned 404. The URL guess is wrong — aborting before we create a new invoice. Next guess to try: POST /attachments with invoiceId in the body, or POST /files.`,
    };
  }
  // 401 / 403 / 5xx — surface the message but don't treat as a hard fail.
  // Most likely a transient issue or permissions; let the user proceed and
  // see if the actual upload still works.
  const msg = probe.error?.message || `HTTP ${status || "?"}`;
  return { ok: true, skipped: `Probe returned ${msg}; proceeding without strong confidence.` };
}

/**
 * Upload a file (typically the cost-breakdown PDF) as an attachment on
 * an already-created Payday invoice. Best-effort — the invoice itself
 * still stands even if the attachment fails, so callers should treat a
 * failure here as a warning, not a fatal error.
 *
 * @param {string} invoiceId   Payday's invoice ID (from createDraftInvoice's response)
 * @param {Blob}   blob        The PDF Blob (e.g. from generateInvoice with returnBlob: true)
 * @param {string} filename    Suggested filename in Payday
 * @returns {{ok: true, data: any} | {ok: false, error: string}}
 */
export async function uploadInvoiceAttachment(invoiceId, blob, filename) {
  if (!invoiceId)  return { ok: false, error: "Missing invoice ID — can't attach the PDF." };
  if (!blob)       return { ok: false, error: "Missing PDF blob — can't attach." };

  const res = await payday.invoices.attachFile(invoiceId, blob, filename || "cost-breakdown.pdf");
  if (!res.ok) {
    const e = res.error || {};
    const statusBit = e.status ? `HTTP ${e.status}${e.statusText ? ` ${e.statusText}` : ""}` : "";
    const msgBit    = e.message || (typeof e === "string" ? e : JSON.stringify(e));
    const combined  = [statusBit, msgBit].filter(Boolean).join(" — ");
    return {
      ok: false,
      error: `Couldn't attach PDF to invoice: ${combined || "no detail returned"}. Full response in the browser console.`,
    };
  }
  return { ok: true, data: res.data };
}
