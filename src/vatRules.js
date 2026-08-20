// ─── VAT rules for Payday invoices ──────────────────────────────────────────
//
// Default Icelandic VAT for IPS services is 24%. Some calls are zero-rated
// because the vessel's voyage is international (services to ships in
// international transit). The rules below were defined for the 2026 season:
//
//   • Seabourn — always 0% (all calls international)
//   • Holland America — always 0% (all calls international)
//   • Princess Cruises — always 0% (same treatment as SBN/HAL: shares
//                                   their rate sheet and payment terms)
//   • Viking — always 0% (every Viking ship, every call — the earlier
//              Viking Mars 24%-except-season-finale carve-out was dropped
//              at Jón's request 2026-08)
//   • Everyone else — 24%
//
// lastVikingMarsDate is accepted but currently unused; kept in the signature
// so callers don't need touching. Remove it and findLastVikingMarsDate below
// once the rate-card / invoice call-sites are cleaned up.

const ZERO_RATE_LINES = new Set(["seabourn", "holland america", "princess cruises", "viking"]);

/**
 * @param {string} cruiseLineName  e.g. "Viking", "Seabourn", "TUI"
 * @param {string} shipName        e.g. "Viking Mars", "Mein Schiff 2"
 * @param {string} callDate        ISO date string "YYYY-MM-DD"
 * @param {string|null} lastVikingMarsDate  historical param, no longer read.
 * @returns {0 | 24}
 */
export function vatRateFor(cruiseLineName, shipName, callDate, lastVikingMarsDate) {
  const line = (cruiseLineName || "").toLowerCase().trim();
  if (ZERO_RATE_LINES.has(line)) return 0;
  return 24;
}

/**
 * Pick the season-final Viking Mars call date from a list of port calls.
 * Accepts either raw rows ({ date, ship: "Viking Mars" }) or rows where the
 * ship lives on a joined `ships` object — handles both shapes used in the app.
 *
 * @param {Array} portCalls
 * @returns {string|null} ISO date "YYYY-MM-DD" or null if none found
 */
export function findLastVikingMarsDate(portCalls) {
  if (!Array.isArray(portCalls) || portCalls.length === 0) return null;
  let latest = null;
  for (const pc of portCalls) {
    const ship = pc.ship || pc.ships?.name || pc.ship_name;
    if (ship !== "Viking Mars") continue;
    const d = pc.date || pc.call_date;
    if (!d) continue;
    if (!latest || d > latest) latest = d;
  }
  return latest;
}
