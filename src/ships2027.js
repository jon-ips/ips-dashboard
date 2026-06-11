// ═══════════════════════════════════════════════════════════════════════════════
// 2027 REYKJAVÍK / AKUREYRI SEASON — SHIP ARRIVALS
// Same row shape as the 2026 SHIPS array in constants.js (port omitted = REY).
// Loaded in month batches from Tristan's schedule; no app view reads this yet —
// access goes through SHIPS_BY_YEAR so a future year toggle is a small change.
// ═══════════════════════════════════════════════════════════════════════════════
import { SHIPS } from "./constants.js";

export const SHIPS_2027 = [
  // ─── APRIL ──────────────────────────────────────────────────────────────────
  { date: "2027-04-08", endDate: "2027-04-09", line: "AIDA Cruises", ship: "AIDAsol", turnaround: false, pax: 2194, status: "other", berth: "Skarfabakki" },
];

export const SHIPS_BY_YEAR = {
  2026: SHIPS,
  2027: SHIPS_2027,
};
