import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { extractShipName, getBerthForShip, AGENCY_BOARDING_AGENT } from "./constants.js";
import { fmtISK } from "./rates.js";
import ipsLogoColor from "./assets/ips-logo-color.png";

// Agency invoice (Akureyri boarding agent). Mirrors the standard IPS
// invoice look but the line items are flat agency fees rather than
// resource/hours rows. Footer carries ship / date / berth and the
// boarding agent name.

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

/**
 * Render the agency invoice PDF for a completed agency job.
 * @param {object} job   completed agency job (date, ship, berth, agency items)
 * @param {Array}  items [{ label, isk }] line items
 * @param {object} [opts] { skipDownload }
 * @returns {{ total }} on success, null on failure
 */
export default async function generateAgencyInvoice(job, items, opts = {}) {
  const skipDownload = !!opts.skipDownload;
  try {
    const lines = (items || []).filter(it => it && it.label);
    if (lines.length === 0) { alert("No agency line items to invoice."); return null; }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    const logoData = await loadImage(ipsLogoColor);
    if (logoData) doc.addImage(logoData, "PNG", 14, 10, 60, 24);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice", pageW - 14, 24, { align: "right" });

    const fmtDate = (iso) => iso ? new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "";

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Agency", 14, 44);
    if (job.date) doc.text(fmtDate(job.date), pageW - 14, 44, { align: "right" });

    doc.setDrawColor(12, 44, 64);
    doc.setLineWidth(0.5);
    doc.line(14, 48, pageW - 14, 48);

    autoTable(doc, {
      startY: 52,
      margin: { left: 14, right: 14 },
      theme: "grid",
      headStyles: { fillColor: [12, 44, 64], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, halign: "left" },
      bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
      columnStyles: { 0: { halign: "left" }, 1: { halign: "right", cellWidth: 40 } },
      alternateRowStyles: { fillColor: [240, 247, 250] },
      head: [["Service", "Amount"]],
      body: lines.map(it => [it.label, fmtISK(it.isk)]),
    });

    const finalY = doc.lastAutoTable?.finalY || 60;

    const grandTotal = lines.reduce((acc, it) => acc + (Number(it.isk) || 0), 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(12, 44, 64);
    doc.text("Total:", pageW - 60, finalY + 10);
    doc.text(fmtISK(grandTotal), pageW - 14, finalY + 10, { align: "right" });
    doc.setDrawColor(12, 44, 64);
    doc.line(pageW - 60, finalY + 12, pageW - 14, finalY + 12);

    // Footer — ship / location / boarding agent
    const footerY = Math.max(finalY + 28, 240);
    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.line(14, footerY - 4, pageW - 14, footerY - 4);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    const shipDisplay = extractShipName(job.ship);
    let y = footerY + 2;
    if (shipDisplay) { doc.text(`Ship: ${shipDisplay}`, 14, y); y += 7; }
    if (job.date) { doc.text(`Date: ${fmtDate(job.date)}`, 14, y); y += 7; }
    const berth = job.berth || getBerthForShip(job.ship, job.date);
    doc.text(berth ? `${berth}, Akureyri, Iceland` : "Akureyri, Iceland", 14, y); y += 7;
    doc.setFont("helvetica", "bold");
    doc.text(`Boarding agent: ${AGENCY_BOARDING_AGENT}`, 14, y);

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Iceland Port Services", pageW / 2, 288, { align: "center" });

    const shipName = (job.ship || "agency").replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `IPS_Agency_Invoice_${shipName}_${job.date || "undated"}.pdf`;
    if (!skipDownload) doc.save(filename);

    return { total: grandTotal };
  } catch (err) {
    console.error("Agency invoice generation failed:", err);
    alert("Failed to generate agency invoice: " + err.message);
    return null;
  }
}
