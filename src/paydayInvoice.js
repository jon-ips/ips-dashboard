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
import { SERVICE_CODES, SERVICE_FULL_NAMES, JOB_TYPES } from "./constants.js";
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
  const code = SERVICE_CODES[job.type] || "";
  const fullName = SERVICE_FULL_NAMES[job.type] || JOB_TYPES[job.type]?.label || job.type;
  const ship = shipDisplayName(job.ship);
  const berth = (job.berth || "").trim();
  const po = (job.po_number || "").trim();

  const termsDays = Number.isFinite(cruiseLine?.payment_terms_days) ? cruiseLine.payment_terms_days : 30;
  const dueDate = addDays(job.date, termsDays);

  // Reference: "{PO} {ServiceCode}". PO is required upstream; we still trim
  // to defend against accidental whitespace.
  const reference = [po, code].filter(Boolean).join(" ");

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
  const lines = rows.map(r => ({
    description: r.resource,
    quantity:    Number(r.amount) || 0,
    unitPrice:   Number(r.unitPriceIsk) || 0,
    amount:      Number(r._totalNum) || 0,
    // per-line VAT — uses cruise line + ship + call date + last-Mars-call lookup
    vatRate:     vatRateFor(cruiseLine?.name, ship, job.date, lastVikingMarsDate),
  }));

  return {
    customerId:  cruiseLine?.payday_customer_id,
    invoiceDate: job.date,
    dueDate:     dueDate,
    finalDate:   dueDate, // Eindagi — same as Gjalddagi for our use case
    reference,
    comment,
    lines,
    status:      "draft",
  };
}

/**
 * Validate prerequisites then POST a draft invoice to Payday.
 *
 * @returns {{ok: true, data: any} | {ok: false, error: string}}
 */
export async function createDraftInvoice(job, cruiseLine, rows, lastVikingMarsDate) {
  // ── Preflight ───────────────────────────────────────────────────────────
  const missing = [];
  if (!job?.cruise_line_id)  missing.push("cruise line / customer");
  if (!cruiseLine)           missing.push("cruise line record (not found)");
  if (!cruiseLine?.payday_customer_id) missing.push("Payday customer mapping for this cruise line");
  if (!job?.po_number)       missing.push("PO number");
  if (!job?.date)            missing.push("job date");
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
    const msg = res.error?.message || res.error?.error || JSON.stringify(res.error || {});
    return { ok: false, error: `Payday rejected the invoice: ${msg}` };
  }
  return { ok: true, data: res.data };
}
