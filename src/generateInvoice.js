import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { JOB_TYPES, JOB_EQUIPMENT_BY_TYPE } from "./constants.js";
import ipsLogoColor from "./assets/ips-logo-color.png";

/**
 * Calculate end time from start time + hours
 * e.g. "08:00" + 6 => "14:00"
 */
function addHours(startTime, hours) {
  if (!startTime) return "";
  const [h, m] = startTime.split(":").map(Number);
  const totalMin = h * 60 + m + hours * 60;
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

/**
 * Build table rows from a completed job's hoursWorked data.
 * Returns [{ resource, amount, startTime, endTime, timeUnit, unitPrice, total }]
 */
function buildRows(job) {
  const typeEquip = JOB_EQUIPMENT_BY_TYPE[job.type] || JOB_EQUIPMENT_BY_TYPE.provisions;
  const rows = [];

  if (Array.isArray(job.hoursWorked)) {
    // New per-shift format
    job.hoursWorked.forEach((sh) => {
      Object.entries(sh.equipment || {}).forEach(([k, groups]) => {
        const label = typeEquip[k]?.label || k;
        groups.forEach((g) => {
          rows.push({
            resource: label,
            amount: g.qty,
            startTime: sh.startTime || "",
            endTime: addHours(sh.startTime, g.hours),
            timeUnit: g.hours,
            nextDay: !!sh.nextDay,
            unitPrice: "",
            total: "",
          });
        });
      });
    });
  } else if (job.hoursWorked) {
    // Legacy flat format
    const startTime = (job.shifts && job.shifts[0]?.startTime) || job.startTime || "";
    Object.entries(job.hoursWorked).forEach(([k, v]) => {
      const label = typeEquip[k]?.label || k;
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === "object") {
        v.forEach((g) => {
          rows.push({
            resource: label,
            amount: g.qty,
            startTime,
            endTime: addHours(startTime, g.hours),
            timeUnit: g.hours,
            unitPrice: "",
            total: "",
          });
        });
      }
    });
  }

  return rows;
}

/**
 * Load an image as a base64 data URL.
 */
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

export default async function generateInvoice(job) {
  try {
  const jt = JOB_TYPES[job.type] || JOB_TYPES.provisions;
  const rows = buildRows(job);
  if (rows.length === 0) { alert("No hours data found for this job."); return; }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // ── Logo header ──
  const logoData = await loadImage(ipsLogoColor);
  if (logoData) {
    const logoW = 60;
    const logoH = 24;
    doc.addImage(logoData, "PNG", 14, 10, logoW, logoH);
  }

  // ── Invoice title ──
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice", pageW - 14, 24, { align: "right" });

  // ── Job info line ──
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const hasNextDay = rows.some((r) => r.nextDay);
  const fmtDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  let dateStr = "";
  if (job.date) {
    if (hasNextDay) {
      const next = new Date(job.date + "T12:00:00");
      next.setDate(next.getDate() + 1);
      const nextIso = next.toISOString().slice(0, 10);
      dateStr = `${fmtDate(job.date)} – ${fmtDate(nextIso)}`;
    } else {
      dateStr = fmtDate(job.date);
    }
  }
  doc.setTextColor(100);
  doc.text(`${jt.label}  |  ${dateStr}`, 14, 44);
  doc.text(`Date: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`, pageW - 14, 44, { align: "right" });

  // ── Separator ──
  doc.setDrawColor(12, 44, 64); // IPS_BLUE
  doc.setLineWidth(0.5);
  doc.line(14, 48, pageW - 14, 48);

  // ── Table ──
  const tableBody = rows.map((r) => [
    r.resource,
    r.amount,
    r.nextDay ? `${r.startTime} (+1d)` : r.startTime,
    r.nextDay ? `${r.endTime} (+1d)` : r.endTime,
    `${r.timeUnit}h`,
    r.unitPrice,
    r.total,
  ]);

  autoTable(doc, {
    startY: 52,
    head: [["Resource", "Amount", "Start Time", "End Time", "Time Unit", "Unit Price", "Total"]],
    body: tableBody,
    margin: { left: 14, right: 14 },
    theme: "grid",
    headStyles: {
      fillColor: [12, 44, 64],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 30, 30],
      halign: "center",
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 40 },
      1: { cellWidth: 20 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 22 },
      5: { cellWidth: 25 },
      6: { cellWidth: 25 },
    },
    alternateRowStyles: {
      fillColor: [240, 247, 250],
    },
  });

  const finalY = doc.lastAutoTable?.finalY || 100;

  // ── Total row placeholder ──
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(12, 44, 64);
  doc.text("Total:", pageW - 60, finalY + 10);
  doc.setDrawColor(12, 44, 64);
  doc.line(pageW - 45, finalY + 11, pageW - 14, finalY + 11);

  // ── Footer: Ship & Berth ──
  const footerY = Math.max(finalY + 28, 240);
  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.line(14, footerY - 4, pageW - 14, footerY - 4);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  if (job.ship) {
    doc.text(`Ship: ${job.ship}`, 14, footerY + 2);
  }
  doc.text("Reykjavik, Iceland", 14, footerY + 9);

  // ── IPS footer ──
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Iceland Port Services", pageW / 2, 288, { align: "center" });

  // ── Save ──
  const shipName = (job.ship || "job").replace(/[^a-zA-Z0-9]/g, "_");
  const dateSlug = job.date || "undated";
  doc.save(`IPS_Invoice_${jt.label.replace(/\s/g, "_")}_${shipName}_${dateSlug}.pdf`);

  } catch (err) {
    console.error("Invoice generation failed:", err);
    alert("Failed to generate invoice: " + err.message);
  }
}
