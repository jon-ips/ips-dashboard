import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { JOB_EQUIPMENT_BY_TYPE, getBerthForShip, extractShipName } from "./constants.js";
import { RATE_SHEETS, fmtISK } from "./rates.js";
import ipsLogoColor from "./assets/ips-logo-color.png";

const MONTH_NAMES = [
  "Janúar", "Febrúar", "Mars", "Apríl", "Maí", "Júní",
  "Júlí", "Ágúst", "September", "Október", "Nóvember", "Desember",
];

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

function fmtDDMMYYYY(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

// Walk a job's shifts and yield one row per (resource, qty) entry.
function rowsForJob(job) {
  const eqList = JOB_EQUIPMENT_BY_TYPE.bindingar;
  const rates = RATE_SHEETS.bindingar.resources;
  const berth = getBerthForShip(job.ship, job.date) || "";
  const ship = extractShipName(job.ship);
  const out = [];
  const shifts = job.shifts || [];
  shifts.forEach((sh) => {
    Object.entries(sh.equipment || {}).forEach(([k, qty]) => {
      if (!qty || qty <= 0) return;
      const label = eqList[k]?.label || k;
      const unitPrice = rates[k]?.perJob || 0;
      out.push({
        ship,
        date: job.date,
        service: label,
        qty,
        location: berth,
        unitPrice,
        total: qty * unitPrice,
      });
    });
  });
  return out;
}

/**
 * Generate the monthly Bindingar invoice PDF for all jobs in the given month.
 *
 * @param {Array}  bindingarJobs all jobs of type "bindingar"
 * @param {number} year          e.g. 2026
 * @param {number} monthIdx      0-based month index (0=Jan, 5=Jun)
 */
export default async function generateBindingarInvoice(bindingarJobs, year, monthIdx) {
  try {
    // Filter to the requested month
    const monthPrefix = `${year}-${String(monthIdx + 1).padStart(2, "0")}-`;
    const jobs = (bindingarJobs || [])
      .filter((j) => j.date && j.date.startsWith(monthPrefix))
      .sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.ship || "").localeCompare(b.ship || ""));

    if (jobs.length === 0) {
      alert(`No Bindingar jobs found for ${MONTH_NAMES[monthIdx]} ${year}.`);
      return;
    }

    // Flatten into rows
    const rows = jobs.flatMap(rowsForJob);
    const grandTotal = rows.reduce((acc, r) => acc + r.total, 0);

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    // Header
    const logoData = await loadImage(ipsLogoColor);
    if (logoData) doc.addImage(logoData, "PNG", 14, 10, 60, 24);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Reikningur", pageW - 14, 24, { align: "right" });

    // Subtitle
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Bindingar — ${MONTH_NAMES[monthIdx]} ${year}`, 14, 44);
    doc.text(`Faxaflóahafnir`, pageW - 14, 44, { align: "right" });

    // Separator
    doc.setDrawColor(12, 44, 64);
    doc.setLineWidth(0.5);
    doc.line(14, 48, pageW - 14, 48);

    // Table
    autoTable(doc, {
      startY: 52,
      head: [["Skip", "Dagsetning", "Þjónusta", "Fjöldi", "Staðsetning", "Upphæð", "Samtals"]],
      body: rows.map((r) => [
        r.ship,
        fmtDDMMYYYY(r.date),
        r.service,
        String(r.qty),
        r.location,
        fmtISK(r.unitPrice),
        fmtISK(r.total),
      ]),
      margin: { left: 14, right: 14 },
      theme: "grid",
      headStyles: { fillColor: [12, 44, 64], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, halign: "center" },
      bodyStyles: { fontSize: 9, textColor: [30, 30, 30], halign: "center" },
      columnStyles: {
        0: { halign: "left", cellWidth: 36 },
        1: { cellWidth: 24 },
        2: { halign: "left", cellWidth: 28 },
        3: { cellWidth: 14 },
        4: { halign: "left", cellWidth: 30 },
        5: { cellWidth: 24, halign: "right" },
        6: { cellWidth: 26, halign: "right" },
      },
      alternateRowStyles: { fillColor: [240, 247, 250] },
    });

    const finalY = doc.lastAutoTable?.finalY || 100;

    // Grand total
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(12, 44, 64);
    doc.text("Samtals:", pageW - 60, finalY + 10);
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
    doc.text("Reykjavík, Ísland", 14, footerY + 2);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Iceland Port Services", pageW / 2, 288, { align: "center" });

    doc.save(`IPS_Bindingar_${MONTH_NAMES[monthIdx]}_${year}.pdf`);
  } catch (err) {
    console.error("Bindingar invoice generation failed:", err);
    alert("Failed to generate Bindingar invoice: " + err.message);
  }
}

export { MONTH_NAMES };
