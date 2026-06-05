// SDK call numbers — sourced from the harbour authority spreadsheet
// (Call_Numbers_REY_AKU.xlsx in the rate-sheet folder). Used to auto-fill
// the PO number on new SDK-billed jobs. Match is by ship name + port +
// date in [date, endDate] range.

import { SDK_LINES, extractShipName, getCruiseLineForShip, SERVICE_CODES } from "./constants.js";

export const SDK_CALL_NUMBERS = [
  { callNumber: "99772", ship: "AIDAsol", date: "2026-04-16", endDate: "2026-04-17", port: "REY" },
  { callNumber: "99786", ship: "AIDAsol", date: "2026-04-19", endDate: null, port: "AK" },
  { callNumber: "85020", ship: "EUROPA 2", date: "2026-05-21", endDate: null, port: "AK" },
  { callNumber: "85022", ship: "EUROPA 2", date: "2026-05-23", endDate: null, port: "REY" },
  { callNumber: "85231", ship: "MEIN SCHIFF 2", date: "2026-05-28", endDate: "2026-05-30", port: "REY" },
  { callNumber: "85215", ship: "MEIN SCHIFF 2", date: "2026-05-31", endDate: null, port: "AK" },
  { callNumber: "99585", ship: "AMBITION", date: "2026-06-08", endDate: null, port: "REY" },
  { callNumber: "99800", ship: "AIDAluna", date: "2026-06-08", endDate: "2026-06-09", port: "REY" },
  { callNumber: "99587", ship: "AMBITION", date: "2026-06-10", endDate: null, port: "AK" },
  { callNumber: "83505", ship: "HANSEATIC NATURE", date: "2026-06-16", endDate: null, port: "REY" },
  { callNumber: "93749", ship: "AMBIENCE", date: "2026-06-17", endDate: "2026-06-18", port: "REY" },
  { callNumber: "99792", ship: "AIDAsol", date: "2026-06-18", endDate: "2026-06-19", port: "REY" },
  { callNumber: "99592", ship: "HANSEATIC NATURE", date: "2026-06-19", endDate: null, port: "AK" },
  { callNumber: "94049", ship: "AMBIENCE", date: "2026-06-20", endDate: null, port: "AK" },
  { callNumber: "99794", ship: "AIDAsol", date: "2026-06-21", endDate: null, port: "AK" },
  { callNumber: "85232", ship: "MEIN SCHIFF 2", date: "2026-06-21", endDate: "2026-06-22", port: "REY" },
  { callNumber: "10627", ship: "AURORA", date: "2026-06-22", endDate: null, port: "AK" },
  { callNumber: "85228", ship: "MEIN SCHIFF 2", date: "2026-06-24", endDate: null, port: "AK" },
  { callNumber: "10632", ship: "AURORA", date: "2026-06-25", endDate: "2026-06-26", port: "REY" },
  { callNumber: "99574", ship: "ARTANIA", date: "2026-06-26", endDate: null, port: "REY" },
  { callNumber: "99576", ship: "ARTANIA", date: "2026-06-28", endDate: null, port: "AK" },
  { callNumber: "99603", ship: "HANSEATIC SPIRIT", date: "2026-07-02", endDate: null, port: "REY" },
  { callNumber: "10633", ship: "BRITANNIA", date: "2026-07-08", endDate: null, port: "REY" },
  { callNumber: "99796", ship: "AIDAsol", date: "2026-07-09", endDate: "2026-07-10", port: "REY" },
  { callNumber: "10636", ship: "BRITANNIA", date: "2026-07-10", endDate: "2026-07-11", port: "AK" },
  { callNumber: "99798", ship: "AIDAsol", date: "2026-07-12", endDate: null, port: "AK" },
  { callNumber: "99803", ship: "AIDAluna", date: "2026-07-12", endDate: null, port: "REY" },
  { callNumber: "88686", ship: "Mein Schiff 3", date: "2026-07-13", endDate: null, port: "AK" },
  { callNumber: "99806", ship: "AIDAluna", date: "2026-07-14", endDate: null, port: "AK" },
  { callNumber: "99777", ship: "COSTA FAVOLOSA", date: "2026-07-14", endDate: "2026-07-15", port: "AK" },
  { callNumber: "88684", ship: "Mein Schiff 3", date: "2026-07-15", endDate: null, port: "REY" },
  { callNumber: "99780", ship: "COSTA FAVOLOSA", date: "2026-07-17", endDate: null, port: "REY" },
  { callNumber: "98537", ship: "RENAISSANCE", date: "2026-07-23", endDate: null, port: "AK" },
  { callNumber: "98539", ship: "RENAISSANCE", date: "2026-07-25", endDate: null, port: "REY" },
  { callNumber: "85229", ship: "MEIN SCHIFF 2", date: "2026-07-26", endDate: null, port: "AK" },
  { callNumber: "85233", ship: "MEIN SCHIFF 2", date: "2026-07-27", endDate: "2026-07-29", port: "REY" },
  { callNumber: "99606", ship: "YAMAGIRI", date: "2026-07-28", endDate: "2026-07-31", port: "REY" },
  { callNumber: "83901", ship: "KASHIMA", date: "2026-07-28", endDate: "2026-07-31", port: "REY" },
  { callNumber: "99808", ship: "AIDAluna", date: "2026-07-30", endDate: null, port: "AK" },
  { callNumber: "10637", ship: "QUEEN ANNE", date: "2026-07-31", endDate: null, port: "AK" },
  { callNumber: "10639", ship: "QUEEN ANNE", date: "2026-08-02", endDate: "2026-08-03", port: "REY" },
  { callNumber: "83572", ship: "MEIN SCHIFF 7", date: "2026-08-06", endDate: null, port: "AK" },
  { callNumber: "99583", ship: "DEUTSCHLAND", date: "2026-08-06", endDate: "2026-08-07", port: "AK" },
  { callNumber: "99781", ship: "COSTA FAVOLOSA", date: "2026-08-07", endDate: null, port: "REY" },
  { callNumber: "86163", ship: "MEIN SCHIFF 7", date: "2026-08-07", endDate: "2026-08-08", port: "REY" },
  { callNumber: "10640", ship: "ARCADIA", date: "2026-08-09", endDate: "2026-08-10", port: "REY" },
  { callNumber: "99815", ship: "AIDAbella", date: "2026-08-10", endDate: null, port: "AK" },
  { callNumber: "99817", ship: "AIDAbella", date: "2026-08-11", endDate: "2026-08-12", port: "REY" },
  { callNumber: "10644", ship: "QUEEN MARY 2", date: "2026-08-12", endDate: "2026-08-13", port: "REY" },
  { callNumber: "99810", ship: "AIDAluna", date: "2026-08-12", endDate: null, port: "REY" },
  { callNumber: "10645", ship: "ARCADIA", date: "2026-08-13", endDate: null, port: "AK" },
  { callNumber: "90066", ship: "AMBITION", date: "2026-08-14", endDate: null, port: "REY" },
  { callNumber: "83504", ship: "HANSEATIC NATURE", date: "2026-08-15", endDate: null, port: "REY" },
  { callNumber: "85234", ship: "MEIN SCHIFF 2", date: "2026-08-18", endDate: "2026-08-20", port: "REY" },
  { callNumber: "85230", ship: "MEIN SCHIFF 2", date: "2026-08-21", endDate: null, port: "AK" },
  { callNumber: "99571", ship: "AMERA", date: "2026-08-26", endDate: null, port: "REY" },
  { callNumber: "11037", ship: "AIDAluna", date: "2026-08-27", endDate: null, port: "AK" },
  { callNumber: "91165", ship: "Mein Schiff 1", date: "2026-08-28", endDate: null, port: "AK" },
  { callNumber: "99818", ship: "AIDAdiva", date: "2026-08-29", endDate: null, port: "REY" },
  { callNumber: "91167", ship: "Mein Schiff 1", date: "2026-08-29", endDate: "2026-08-30", port: "REY" },
  { callNumber: "99577", ship: "ARTANIA", date: "2026-08-31", endDate: "2026-09-01", port: "REY" },
  { callNumber: "11038", ship: "AIDAluna", date: "2026-09-07", endDate: "2026-09-08", port: "REY" },
  { callNumber: "93750", ship: "AMBIENCE", date: "2026-09-15", endDate: null, port: "REY" },
  { callNumber: "88865", ship: "AMBIENCE", date: "2026-09-17", endDate: null, port: "AK" },
  { callNumber: "84549", ship: "HANSEATIC SPIRIT", date: "2026-09-24", endDate: null, port: "REY" },
];

// Case-insensitive lookup of a call number by ship + date + port.
export function getCallNumberForShip(shipName, dateIso, port) {
  if (!shipName || !dateIso) return null;
  const name = shipName.trim().toLowerCase();
  const portKey = port === "AK" ? "AK" : "REY";
  const entry = SDK_CALL_NUMBERS.find(c =>
    c.ship.toLowerCase() === name &&
    c.port === portKey &&
    dateIso >= c.date && dateIso <= (c.endDate || c.date),
  );
  return entry?.callNumber || null;
}

// Compute the full auto-filled PO number for a job-in-progress, including
// the trailing service code and " AKU" suffix for Akureyri jobs. The Payday
// composer takes the field verbatim, so the field IS the final invoice
// reference (e.g. "82450 CP AKU", "28.06 L").
export function computeAutoPONumber({ ship, date, port, type }) {
  if (!ship || !date) return "";
  const shipName = extractShipName(ship);
  const cruiseLine = getCruiseLineForShip(ship, date);
  const isSDK = cruiseLine && SDK_LINES.some(l => l.toLowerCase() === cruiseLine.toLowerCase());

  let base = "";
  if (isSDK) {
    const callNumber = getCallNumberForShip(shipName, date, port);
    if (callNumber) base = callNumber;
  }
  if (!base) {
    const [, m, d] = date.split("-");
    base = `${d}${m}`;
  }

  const code = SERVICE_CODES[type] || "";
  const akuSuffix = port === "AK" ? "AKU" : "";
  return [base, code, akuSuffix].filter(Boolean).join(" ");
}
