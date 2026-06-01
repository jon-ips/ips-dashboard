import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { JOB_TYPES, JOB_EQUIPMENT_BY_TYPE } from "./constants.js";
import { RATE_SHEETS, fmtISK, isWeekend } from "./rates.js";
import ipsLogoColor from "./assets/ips-logo-color.png";

// ─── Time helpers ───────────────────────────────────────────────────────────

function addHours(startTime, hours) {
  if (!startTime) return "";
  const [h, m] = startTime.split(":").map(Number);
  const totalMin = h * 60 + m + hours * 60;
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

function formatClock(totalSec) {
  const minOfDay = Math.floor(totalSec / 60) % (24 * 60);
  const h = Math.floor(minOfDay / 60);
  const m = minOfDay % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Walk [startTime, +hours] and emit Regular / Overtime segments. Boundaries:
//   weekdays: 08:00–otAfter:00 is Regular, otherwise Overtime
//   weekends (Sat/Sun): entire day is Overtime
// Handles shifts that cross midnight; nextDay shifts use jobDate + 1.
function splitShiftIntoSegments(startTime, hours, otAfter, jobDateIso, shiftIsNextDay) {
  if (!startTime || !hours) return [];
  const baseDate = new Date((jobDateIso || "2026-01-01") + "T00:00:00");
  if (shiftIsNextDay) baseDate.setDate(baseDate.getDate() + 1);
  const [sh, sm] = startTime.split(":").map(Number);
  const startSec = sh * 3600 + sm * 60;
  const endSec = startSec + hours * 3600;

  const raw = [];
  let cursor = startSec;
  while (cursor < endSec) {
    const dayOffset = Math.floor(cursor / 86400);
    const tod = cursor - dayOffset * 86400;
    const segDate = new Date(baseDate);
    segDate.setDate(segDate.getDate() + dayOffset);
    const wd = segDate.getDay();
    const weekend = (wd === 0 || wd === 6);

    let nextBoundary, type;
    if (weekend) {
      type = "Overtime";
      nextBoundary = (dayOffset + 1) * 86400;
    } else if (tod < 8 * 3600) {
      type = "Overtime";
      nextBoundary = dayOffset * 86400 + 8 * 3600;
    } else if (tod < otAfter * 3600) {
      type = "Regular";
      nextBoundary = dayOffset * 86400 + otAfter * 3600;
    } else {
      type = "Overtime";
      nextBoundary = (dayOffset + 1) * 86400;
    }
    const segEnd = Math.min(nextBoundary, endSec);
    raw.push({
      type,
      startTime: formatClock(cursor),
      endTime: formatClock(segEnd),
      hours: (segEnd - cursor) / 3600,
    });
    cursor = segEnd;
  }

  // Coalesce adjacent same-type segments (covers the "after-otAfter → next-day-weekday-pre-08" case)
  const merged = [];
  for (const s of raw) {
    const prev = merged[merged.length - 1];
    if (prev && prev.type === s.type) {
      prev.endTime = s.endTime;
      prev.hours += s.hours;
    } else {
      merged.push({ ...s });
    }
  }
  return merged;
}

// Legacy `cage` key (pre-split): map to pallet_cage on cargo jobs, luggage_cage on turnaround.
function resolveEquipmentKey(k, jobType) {
  if (k === "cage") return jobType === "turnaround" ? "luggage_cage" : "pallet_cage";
  return k;
}

// ─── Row builder ────────────────────────────────────────────────────────────

function buildRows(job, sheet) {
  const typeEquip = JOB_EQUIPMENT_BY_TYPE[job.type] || JOB_EQUIPMENT_BY_TYPE.provisions;
  const rates = sheet.resources;
  const otAfter = sheet.overtimeAfter;
  const rows = [];
  const usedKeys = new Set();

  const pushUnpriced = (label, qty, startTime, hours, nextDay) => rows.push({
    resource: label,
    amount: qty,
    startTime: startTime || "",
    endTime: hours ? addHours(startTime, hours) : "",
    timeUnit: hours ? `${hours}h` : "",
    nextDay: !!nextDay,
    unitPrice: "—",
    total: "—",
    _totalNum: 0,
  });

  if (Array.isArray(job.hoursWorked)) {
    job.hoursWorked.forEach((sh) => {
      Object.entries(sh.equipment || {}).forEach(([rawKey, groups]) => {
        const k = resolveEquipmentKey(rawKey, job.type);
        usedKeys.add(k);
        const eq = typeEquip[k];
        const label = eq?.label || rawKey;
        const isHuman = !!eq?.human;
        const isFlatDay = !!eq?.flatDay;
        const rate = rates[k];

        groups.forEach((g) => {
          if (isHuman && rate && rate.day != null && sh.startTime && g.hours) {
            const segments = splitShiftIntoSegments(sh.startTime, g.hours, otAfter, job.date, !!sh.nextDay);
            segments.forEach((seg) => {
              const unitPrice = seg.type === "Overtime" ? rate.ot : rate.day;
              const total = g.qty * seg.hours * unitPrice;
              rows.push({
                resource: seg.type === "Overtime" ? `${label} (OT)` : label,
                amount: g.qty,
                startTime: seg.startTime,
                endTime: seg.endTime,
                timeUnit: `${seg.hours}h`,
                nextDay: !!sh.nextDay,
                unitPrice: fmtISK(unitPrice),
                total: fmtISK(total),
                _totalNum: total,
              });
            });
          } else if (isFlatDay && rate && rate.flat != null) {
            rows.push({
              resource: label,
              amount: g.qty,
              startTime: "",
              endTime: "",
              timeUnit: "1 day",
              nextDay: !!sh.nextDay,
              unitPrice: fmtISK(rate.flat),
              total: fmtISK(g.qty * rate.flat),
              _totalNum: g.qty * rate.flat,
            });
          } else if (rate && rate.flat != null && g.hours) {
            // HAL special case: Conveyor Belt billed as a flat day rate even though
            // the equipment definition isn't marked flatDay (it's normally hourly).
            rows.push({
              resource: label,
              amount: g.qty,
              startTime: "",
              endTime: "",
              timeUnit: "1 day",
              nextDay: !!sh.nextDay,
              unitPrice: fmtISK(rate.flat),
              total: fmtISK(g.qty * rate.flat),
              _totalNum: g.qty * rate.flat,
            });
          } else if (rate && rate.hourly != null && g.hours) {
            const total = g.qty * g.hours * rate.hourly;
            rows.push({
              resource: label,
              amount: g.qty,
              startTime: sh.startTime || "",
              endTime: addHours(sh.startTime, g.hours),
              timeUnit: `${g.hours}h`,
              nextDay: !!sh.nextDay,
              unitPrice: fmtISK(rate.hourly),
              total: fmtISK(total),
              _totalNum: total,
            });
          } else {
            pushUnpriced(label, g.qty, sh.startTime, g.hours, sh.nextDay);
          }
        });
      });
    });
  } else if (job.hoursWorked) {
    // Legacy flat format (no per-equipment startTime). Emit unpriced rows.
    const startTime = (job.shifts && job.shifts[0]?.startTime) || job.startTime || "";
    Object.entries(job.hoursWorked).forEach(([k, v]) => {
      usedKeys.add(resolveEquipmentKey(k, job.type));
      const label = typeEquip[k]?.label || k;
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === "object") {
        v.forEach((g) => pushUnpriced(label, g.qty, startTime, g.hours, false));
      }
    });
  }

  // Auto-append transports (one line per matching transport, once per job)
  (sheet.transports || []).forEach((tr) => {
    if (tr.triggeredBy.some((k) => usedKeys.has(k))) {
      rows.push({
        resource: tr.label,
        amount: 1,
        startTime: "",
        endTime: "",
        timeUnit: "Per call",
        nextDay: false,
        unitPrice: fmtISK(tr.rate),
        total: fmtISK(tr.rate),
        _totalNum: tr.rate,
      });
    }
  });

  return rows;
}

// Viking turnaround: a single flat-rate line replaces all line items.
function buildVikingTurnaroundRows(job, sheet) {
  if (!sheet.turnaroundFlat) return [];
  const weekend = isWeekend(job.date);
  const rate = weekend ? sheet.turnaroundFlat.weekend : sheet.turnaroundFlat.weekday;
  return [{
    resource: `Turnaround Operation (${weekend ? "Weekend" : "Weekday"})`,
    amount: 1,
    startTime: "",
    endTime: "",
    timeUnit: "Per call",
    nextDay: false,
    unitPrice: fmtISK(rate),
    total: fmtISK(rate),
    _totalNum: rate,
  }];
}

// ─── PDF rendering ──────────────────────────────────────────────────────────

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export default async function generateInvoice(job, rateSheetKey) {
  try {
    const jt = JOB_TYPES[job.type] || JOB_TYPES.provisions;
    const sheet = RATE_SHEETS[rateSheetKey];
    if (!sheet) {
      alert("No rate sheet selected — cannot generate invoice.");
      return;
    }

    const useVikingFlat = rateSheetKey === "viking" && job.type === "turnaround" && sheet.turnaroundFlat;
    const rows = useVikingFlat ? buildVikingTurnaroundRows(job, sheet) : buildRows(job, sheet);
    if (rows.length === 0) { alert("No hours data found for this job."); return; }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    // Header
    const logoData = await loadImage(ipsLogoColor);
    if (logoData) doc.addImage(logoData, "PNG", 14, 10, 60, 24);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice", pageW - 14, 24, { align: "right" });

    // Job info line
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const fmtDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

    const day1Rows = rows.filter((r) => !r.nextDay);
    const day2Rows = rows.filter((r) => r.nextDay);
    const day1DateStr = job.date ? fmtDate(job.date) : "";
    let day2DateStr = "";
    if (day2Rows.length > 0 && job.date) {
      const next = new Date(job.date + "T12:00:00");
      next.setDate(next.getDate() + 1);
      day2DateStr = fmtDate(next.toISOString().slice(0, 10));
    }
    const dateStr = (day1Rows.length > 0 && day2Rows.length > 0)
      ? `${day1DateStr} – ${day2DateStr}`
      : (day1DateStr || day2DateStr || "");

    doc.setTextColor(100);
    doc.text(`${jt.label}  |  ${dateStr}  |  ${sheet.label} rate sheet`, 14, 44);
    doc.text(`Date: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`, pageW - 14, 44, { align: "right" });

    // Separator
    doc.setDrawColor(12, 44, 64);
    doc.setLineWidth(0.5);
    doc.line(14, 48, pageW - 14, 48);

    // Per-day tables
    const groups = [];
    if (day1Rows.length > 0) groups.push({ date: day1DateStr, rows: day1Rows });
    if (day2Rows.length > 0) groups.push({ date: day2DateStr, rows: day2Rows });
    const showSubheadings = groups.length > 1;

    const tableOptions = {
      margin: { left: 14, right: 14 },
      theme: "grid",
      headStyles: { fillColor: [12, 44, 64], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, halign: "center" },
      bodyStyles: { fontSize: 9, textColor: [30, 30, 30], halign: "center" },
      columnStyles: {
        0: { halign: "left", cellWidth: 40 },
        1: { cellWidth: 18 },
        2: { cellWidth: 22 },
        3: { cellWidth: 22 },
        4: { cellWidth: 22 },
        5: { cellWidth: 30, halign: "right" },
        6: { cellWidth: 28, halign: "right" },
      },
      alternateRowStyles: { fillColor: [240, 247, 250] },
    };

    let cursorY = 52;
    groups.forEach((g, gi) => {
      if (showSubheadings) {
        if (gi > 0) cursorY += 12;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(12, 44, 64);
        doc.text(g.date, 14, cursorY);
        cursorY += 3;
      }
      autoTable(doc, {
        ...tableOptions,
        startY: cursorY,
        head: [["Resource", "Amount", "Start Time", "End Time", "Time Unit", "Unit Price", "Total"]],
        body: g.rows.map((r) => [r.resource, r.amount, r.startTime, r.endTime, r.timeUnit, r.unitPrice, r.total]),
      });
      cursorY = doc.lastAutoTable?.finalY || cursorY + 20;
    });

    const finalY = cursorY;

    // Grand total
    const grandTotal = rows.reduce((acc, r) => acc + (r._totalNum || 0), 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(12, 44, 64);
    doc.text("Total:", pageW - 60, finalY + 10);
    doc.text(fmtISK(grandTotal), pageW - 14, finalY + 10, { align: "right" });
    doc.setDrawColor(12, 44, 64);
    doc.line(pageW - 60, finalY + 12, pageW - 14, finalY + 12);

    // Footer
    const footerY = Math.max(finalY + 28, 240);
    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.line(14, footerY - 4, pageW - 14, footerY - 4);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    if (job.ship) doc.text(`Ship: ${job.ship}`, 14, footerY + 2);
    doc.text("Reykjavik, Iceland", 14, footerY + 9);

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Iceland Port Services", pageW / 2, 288, { align: "center" });

    // Save
    const shipName = (job.ship || "job").replace(/[^a-zA-Z0-9]/g, "_");
    const dateSlug = job.date || "undated";
    doc.save(`IPS_Invoice_${jt.label.replace(/\s/g, "_")}_${shipName}_${dateSlug}.pdf`);
  } catch (err) {
    console.error("Invoice generation failed:", err);
    alert("Failed to generate invoice: " + err.message);
  }
}
