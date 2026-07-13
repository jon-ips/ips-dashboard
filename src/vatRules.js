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
//   • Viking (any ship except Viking Mars) — always 0%
//   • Viking Mars — 24% by default, EXCEPT the last call of the season,
//                   which ends in a foreign port → 0%
//   • Everyone else — 24%
//
// The "last call of the season" is computed at call-site by passing
// lastVikingMarsDate (the MAX(port_calls.date) where ship_name = 'Viking Mars').
// That keeps this helper pure and easy to test.

const ZERO_RATE_LINES = new Set(["seabourn", "holland america", "princess cruises"]);

/**
 * @param {string} cruiseLineName  e.g. "Viking", "Seabourn", "TUI"
 * @param {string} shipName        e.g. "Viking Mars", "Mein Schiff 2"
 * @param {string} callDate        ISO date string "YYYY-MM-DD"
 * @param {string|null} lastVikingMarsDate  ISO date of Viking Mars's final
 *   call of the season. When null/undefined, every Viking Mars call is
 *   treated as 24% (safe default — never accidentally zero-rates).
 * @returns {0 | 24}
 */
export function vatRateFor(cruiseLineName, shipName, callDate, lastVikingMarsDate) {
  const line = (cruiseLineName || "").toLowerCase().trim();
  if (ZERO_RATE_LINES.has(line)) return 0;

  if (line === "viking") {
    if (shipName === "Viking Mars") {
      // 24% by default; 0% only for the season's final call.
      return lastVikingMarsDate && callDate === lastVikingMarsDate ? 0 : 24;
    }
    return 0; // every other Viking ship
  }

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
