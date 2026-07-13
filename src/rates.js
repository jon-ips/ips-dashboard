// ─── 2026 Rate Sheets ───────────────────────────────────────────────────────
//
// One sheet per billing party (SDK, Samskip, Viking, HAL). Each entry under
// `resources` is keyed by the equipment_key used in JOB_EQUIPMENT_BY_TYPE
// (src/constants.js), so the invoice generator can look up rates directly
// from a completed job's hours_worked data.
//
// Rate shapes:
//   { day, ot } — hourly human (split into Regular/Overtime by hours)
//   { hourly }  — hourly equipment, no Day/OT distinction
//   { flat }    — full-day flat rate (charged once per quantity per day)
//
// Universal rules (apply to all sheets):
//   - Morning OT before 08:00, evening OT after `overtimeAfter`
//   - All hours on Saturdays and Sundays are OT
//   - 4-hour minimum for hourly resources (enforced at completion time,
//     not here)
//   - "Forklift Driver" rate covers every operator (forklift_op,
//     telescopic_op, conveyor_op) since the user has confirmed
//     operator == driver
//
// Viking turnaround: a flat per-call rate replaces all the line items
// when job.type === "turnaround". Weekday vs weekend by job.date.
//
// Transports are auto-appended to the invoice when triggering equipment
// is present in the job (one line per transport key, regardless of qty).
//
// Cherry Picker rentals are SDK-only. Four sizes (22m / 25m / 40m / 60m),
// each a flat per-day rate that already includes transfer, fuel, and other
// rental overheads. Same prices in Reykjavík and Akureyri — rates appear on
// both the `sdk` and `akureyri` sheets below.
// ===========================================================================

import { SDK_LINES, PROSPECT_GROUPS } from "./constants.js";

export const RATE_SHEETS = {
  sdk: {
    label: "SDK",
    overtimeAfter: 16,
    resources: {
      stevedore:            { day: 8150,  ot: 9450 },
      foreman:              { day: 8460,  ot: 10065 },
      forklift_op:          { day: 8750,  ot: 10750 },
      telescopic_op:        { day: 8750,  ot: 10750 },
      conveyor_op:          { day: 8750,  ot: 10750 },
      crane_op:             { day: 12480, ot: 15930 },
      cherry_picker_op:     { day: 12480, ot: 15930 },
      porter:               { day: 6850,  ot: 8450 },
      forklift:             { hourly: 9560 },
      telescopic:           { hourly: 11940 },
      crane:                { hourly: 49820 },
      conveyor_belt:        { hourly: 23450 },
      pallet_cage:          { flat: 14500 },
      luggage_cage:         { flat: 12500 },
      ramp:                 { flat: 12500 },
      pallet_jack_manual:   { flat: 8500 },
      pallet_jack_electric: { flat: 11500 },
      // Cherry Picker rentals (SDK only). Flat day rate, all-inclusive.
      cherry_picker_22m:    { flat: 133789 },
      cherry_picker_25m:    { flat: 139146 },
      cherry_picker_40m:    { flat: 169760 },
      cherry_picker_60m:    { flat: 208720 },
    },
    transports: [
      { label: "Forklift Transport", rate: 45850, triggeredBy: ["forklift", "telescopic"] },
      { label: "Conveyor Transport", rate: 29000, triggeredBy: ["conveyor_belt"] },
    ],
  },

  samskip: {
    label: "Samskip",
    overtimeAfter: 16,
    resources: {
      stevedore:            { day: 8640,  ot: 9860 },
      foreman:              { day: 8970,  ot: 10670 },
      forklift_op:          { day: 10275, ot: 12040 },
      telescopic_op:        { day: 10275, ot: 12040 },
      conveyor_op:          { day: 10275, ot: 12040 },
      crane_op:             { day: 13230, ot: 16890 },
      porter:               { day: 7265,  ot: 8960 },
      forklift:             { hourly: 10710 },
      telescopic:           { hourly: 13375 },
      crane:                { hourly: 52820 },
      conveyor_belt:        { hourly: 23450 },
      pallet_cage:          { flat: 22370 },
      luggage_cage:         { flat: 25500 },
      ramp:                 { flat: 15560 },
      pallet_jack_manual:   { flat: 11500 },
      pallet_jack_electric: { flat: 16400 },
    },
    transports: [
      { label: "Forklift Transport", rate: 48605, triggeredBy: ["forklift", "telescopic"] },
      { label: "Conveyor Transport", rate: 28400, triggeredBy: ["conveyor_belt"] },
    ],
  },

  viking: {
    label: "Viking",
    overtimeAfter: 18,
    // Viking turnaround jobs bill a flat per-call rate that replaces all line items.
    turnaroundFlat: { weekday: 1750000, weekend: 1950000 },
    resources: {
      stevedore:            { day: 7460,  ot: 9015 },
      foreman:              { day: 8460,  ot: 10065 },
      forklift_op:          { day: 8460,  ot: 10065 },
      telescopic_op:        { day: 8460,  ot: 10065 },
      conveyor_op:          { day: 8460,  ot: 10065 },
      crane_op:             { day: 10850, ot: 13850 },
      porter:               { day: 6450,  ot: 7950 },
      forklift:             { hourly: 8038 },
      telescopic:           { hourly: 9470 },
      crane:                { hourly: 45450 },
      conveyor_belt:        { hourly: 23450 },
      pallet_cage:          { flat: 12700 },
      ramp:                 { flat: 9550 },
      pallet_jack_manual:   { flat: 7700 },
      pallet_jack_electric: { flat: 11500 },
    },
    transports: [
      { label: "Forklift Transport",   rate: 32850, triggeredBy: ["forklift"] },
      { label: "Telescopic Transport", rate: 32850, triggeredBy: ["telescopic"] },
    ],
  },

  akureyri: {
    label: "Akureyri",
    overtimeAfter: 16,
    resources: {
      stevedore:            { day: 10885, ot: 13062 },
      forklift_op:          { day: 16060, ot: 19272 },
      telescopic_op:        { day: 16060, ot: 19272 },
      conveyor_op:          { day: 16060, ot: 19272 },
      crane_op:             { day: 16060, ot: 19272 },
      cherry_picker_op:     { day: 16060, ot: 19272 },
      forklift:             { hourly: 14560 },
      telescopic:           { hourly: 19790 },
      crane:                { hourly: 49820 },
      pallet_jack_manual:   { flat: 8500 },
      pallet_jack_electric: { flat: 11500 },
      ramp:                 { flat: 12500 },
      // Cherry Picker rentals — same prices in Akureyri and Reykjavík.
      cherry_picker_22m:    { flat: 133789 },
      cherry_picker_25m:    { flat: 139146 },
      cherry_picker_40m:    { flat: 169760 },
      cherry_picker_60m:    { flat: 208720 },
      // Sheet has no Foreman, Porter, Conveyor Belt, Pallet/Luggage Cage —
      // those line items will render unpriced if selected on an AK job.
    },
    transports: [
      { label: "Forklift Transport", rate: 45850, triggeredBy: ["forklift", "telescopic"] },
    ],
  },

  // Bindingar (mooring) — fixed flat rates per resource per job. Billed
  // monthly in bulk to Faxaflóahafnir, generated by generateBindingarInvoice.
  bindingar: {
    label: "Bindingar",
    resources: {
      endamadur: { perJob: 13500 },
      lyftari:   { perJob: 15000 },
    },
  },

  hal: {
    label: "HAL/Seabourn",
    overtimeAfter: 18,
    resources: {
      stevedore:            { day: 7498, ot: 8694 },
      foreman:              { day: 7783, ot: 9260 },
      forklift_op:          { day: 8050, ot: 9890 },
      telescopic_op:        { day: 8050, ot: 9890 },
      conveyor_op:          { day: 8050, ot: 9890 },
      // Crane and Crane Operator intentionally omitted: HAL does not bill cranes.
      porter:               { day: 6302, ot: 7774 },
      forklift:             { hourly: 7596 },
      telescopic:           { hourly: 8946 },
      conveyor_belt:        { flat: 276250 },   // HAL bills the belt as a flat day rate
      pallet_cage:          { flat: 12325 },
      luggage_cage:         { flat: 31025 },
      ramp:                 { flat: 10626 },
      pallet_jack_manual:   { flat: 7225 },     // HAL has a single "Pallet Jack" line
      pallet_jack_electric: { flat: 7225 },
    },
    transports: [
      { label: "Forklift Transport", rate: 38850, triggeredBy: ["forklift", "telescopic"] },
    ],
  },
};

// ─── Cruise line → rate sheet key ────────────────────────────────────────────

const CRUISE_LINE_TO_SHEET = {};
SDK_LINES.forEach((l) => { CRUISE_LINE_TO_SHEET[l.toLowerCase()] = "sdk"; });
(PROSPECT_GROUPS?.samskip?.lines || []).forEach((l) => { CRUISE_LINE_TO_SHEET[l.toLowerCase()] = "samskip"; });
CRUISE_LINE_TO_SHEET["viking"] = "viking";
CRUISE_LINE_TO_SHEET["holland america"] = "hal";
CRUISE_LINE_TO_SHEET["seabourn"] = "hal";
// The schedule now says "Princess Cruises", but older jobs / other datasets
// may still carry bare "Princess" — keep both spellings routing to hal so
// neither falls through to the manual rate-sheet picker.
CRUISE_LINE_TO_SHEET["princess"] = "hal";
CRUISE_LINE_TO_SHEET["princess cruises"] = "hal";

export function resolveRateSheet(cruiseLine) {
  if (!cruiseLine) return null;
  return CRUISE_LINE_TO_SHEET[cruiseLine.toLowerCase()] || null;
}

// Format ISK with Icelandic thousands separator: 12480 → "12.480 ISK"
export function fmtISK(n) {
  if (n == null || isNaN(n)) return "";
  return Math.round(n).toLocaleString("is-IS") + " ISK";
}

// Saturday or Sunday for a YYYY-MM-DD string
export function isWeekend(isoDate) {
  if (!isoDate) return false;
  const d = new Date(isoDate + "T12:00:00");
  const wd = d.getDay();
  return wd === 0 || wd === 6;
}
