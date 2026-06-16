import { SHIPS, SDK_LINES, DIRECT_CONTRACT_LINES } from "./src/constants.js";

// "IPS/SDK ships" = lines IPS services directly + lines via the SDK agent.
const IPS_SDK = new Set([...DIRECT_CONTRACT_LINES, ...SDK_LINES]);

// Summer 2026 window (incl. September).
const SUMMER_START = "2026-06-01";
const SUMMER_END = "2026-09-30";

const MS_DAY = 86400000;
const addDays = (iso, n) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const daysBetween = (a, b) => Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / MS_DAY);

// Turnaround day rule:
//   in port 1 day  -> that day
//   in port 2 days -> day one  (arrival)
//   in port 3 days -> day two  (middle)
//   i.e. the last full day before departure = endDate - 1 (or the date itself).
const turnaroundDay = (s) => (s.endDate && s.endDate !== s.date) ? addDays(s.endDate, -1) : s.date;
const daysInPort = (s) => (s.endDate && s.endDate !== s.date) ? daysBetween(s.date, s.endDate) + 1 : 1;

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDay = (iso) => {
  const d = new Date(iso + "T00:00:00Z");
  return `${WD[d.getUTCDay()]} ${String(d.getUTCDate()).padStart(2, " ")} ${MONTHS[d.getUTCMonth()]}`;
};

const rows = SHIPS
  .filter((s) => s.turnaround === true && IPS_SDK.has(s.line))
  .map((s) => ({
    tday: turnaroundDay(s),
    days: daysInPort(s),
    ship: s.ship,
    line: s.line,
    pax: s.pax,
    port: s.port === "AK" ? "Akureyri" : "Reykjavík",
    berth: s.berth || "",
    arrival: s.date,
    departure: s.endDate || s.date,
  }))
  .filter((r) => r.tday >= SUMMER_START && r.tday <= SUMMER_END)
  .sort((a, b) => a.tday.localeCompare(b.tday) || a.ship.localeCompare(b.ship));

// Group by month.
const byMonth = {};
for (const r of rows) {
  const key = r.tday.slice(0, 7);
  (byMonth[key] ||= []).push(r);
}

const lineCount = {};
for (const r of rows) lineCount[r.line] = (lineCount[r.line] || 0) + 1;

let out = "";
out += "# IPS / SDK Turnaround Calendar — Summer 2026\n\n";
out += "Turnaround days for ships IPS services directly or via SDK, June–September 2026.\n\n";
out += "**Turnaround day rule:** 1 day in port = that day · 2 days = day one (arrival) · 3 days = day two (the middle day). In general, the turnaround day is the last full day before departure.\n\n";
out += `**Total turnaround days:** ${rows.length}\n\n`;
out += "---\n\n";

for (const key of Object.keys(byMonth).sort()) {
  const [y, m] = key.split("-");
  out += `## ${MONTHS[Number(m) - 1]} ${y}\n\n`;
  out += "| Turnaround day | Ship | Line | Pax | Port / Berth | In port |\n";
  out += "|---|---|---|---:|---|---|\n";
  for (const r of byMonth[key]) {
    const span = r.days > 1 ? `${r.days} days (${r.arrival.slice(8)}–${r.departure.slice(8)})` : "1 day";
    const portBerth = r.berth ? `${r.port} · ${r.berth}` : r.port;
    out += `| **${fmtDay(r.tday)}** | ${r.ship} | ${r.line} | ${r.pax ?? "—"} | ${portBerth} | ${span} |\n`;
  }
  out += "\n";
}

out += "---\n\n";
out += "### Count by line\n\n";
for (const [line, n] of Object.entries(lineCount).sort((a, b) => b[1] - a[1])) {
  out += `- **${line}:** ${n}\n`;
}
out += "\n";
out += "_Generated from src/constants.js (SHIPS). IPS/SDK lines = " + [...IPS_SDK].join(", ") + "._\n";

process.stdout.write(out);
