import { useState, useMemo, useCallback, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { supabase, SUPABASE_CONFIGURED } from "./supabase.js";
import { payday } from "./payday.js";
import {
  IPS_ACCENT, IPS_WARN, IPS_DANGER, IPS_SUCCESS, IPS_BLUE,
  SURFACE, BORDER, TEXT, TEXT_DIM, PROSPECT_COLOR,
  CFO_SERVICE_TYPES, CFO_UNITS, CFO_EXPENSE_CATS, CFO_STAFF_TYPES, CFO_INV_STATUS, fmtISK,
} from "./constants.js";
import { Card, SL, CTip, FilterPill, IconPlus, IconUpload, IconChevron, IconSync } from "./shared.jsx";

export default function CFOWorkspace({ cfoView, activeModule, portCalls, onStatsChange }) {
  // ─── CFO MODULE STATE ──────────────────────────────────────────────────────
  const [cfoCruiseLines, setCfoCruiseLines] = useState([]);
  // Contracts
  const [cfoContracts, setCfoContracts] = useState([]);
  const [cfoContractsLoaded, setCfoContractsLoaded] = useState(false);
  const [cfoContractModal, setCfoContractModal] = useState(null);
  const [cfoContractForm, setCfoContractForm] = useState({ cruise_line_id: "", season: "2026", status: "draft", start_date: "2026-05-01", end_date: "2026-09-30", payment_terms: "Net 30", notes: "" });
  const [cfoExpandedContract, setCfoExpandedContract] = useState(null);
  const [cfoRateCards, setCfoRateCards] = useState([]);
  const [cfoRateForm, setCfoRateForm] = useState({ service_type: "luggage_handling", description: "", unit: "per_pax", rate_isk: "", min_charge_isk: "0" });
  const [cfoShowRateForm, setCfoShowRateForm] = useState(false);
  // Invoices (live from Payday)
  const [pdInvoices, setPdInvoices] = useState([]);
  const [pdInvoicesLoading, setPdInvoicesLoading] = useState(false);
  const [pdInvoicesError, setPdInvoicesError] = useState(null);
  const [pdInvoicesLoaded, setPdInvoicesLoaded] = useState(false);
  const [cfoInvoiceFilter, setCfoInvoiceFilter] = useState("all");
  // Expenses (live from Payday)
  const [pdExpenses, setPdExpenses] = useState([]);
  const [pdExpensesLoading, setPdExpensesLoading] = useState(false);
  const [pdExpensesError, setPdExpensesError] = useState(null);
  const [pdExpensesLoaded, setPdExpensesLoaded] = useState(false);
  const [cfoExpenseCatFilter, setCfoExpenseCatFilter] = useState("all");
  // Payday data date range
  const [pdDateFrom, setPdDateFrom] = useState("2025-01-01");
  const [pdDateTo, setPdDateTo] = useState("2026-12-31");
  // Staff & Payroll
  const [cfoStaff, setCfoStaff] = useState([]);
  const [cfoStaffLoaded, setCfoStaffLoaded] = useState(false);
  const [cfoStaffModal, setCfoStaffModal] = useState(null);
  const [cfoStaffForm, setCfoStaffForm] = useState({ name: "", role: "", type: "employee", hourly_rate_isk: "", monthly_salary_isk: "", phone: "", email: "", notes: "" });
  const [cfoPayroll, setCfoPayroll] = useState([]);

  // ─── PAYDAY INTEGRATION STATE ─────────────────────────────────────────────
  const [paydayConnected, setPaydayConnected] = useState(null);
  const [paydayCompanyName, setPaydayCompanyName] = useState("");
  const [paydayCustomers, setPaydayCustomers] = useState([]);
  const [paydayCustomersLoading, setPaydayCustomersLoading] = useState(false);
  // Invoice generation
  const [cfoGenModal, setCfoGenModal] = useState(null);
  const [cfoGenLoading, setCfoGenLoading] = useState(false);
  const [cfoGenError, setCfoGenError] = useState(null);

  // ─── CFO DATA LOADING ──────────────────────────────────────────────────────
  useEffect(() => {
    if (activeModule !== "cfo" || !SUPABASE_CONFIGURED) return;
    (async () => {
      const { data } = await supabase.from("cruise_lines").select("id,name,status").order("name", { ascending: true });
      if (data) setCfoCruiseLines(data);
    })();
  }, [activeModule]);

  useEffect(() => {
    if (activeModule !== "cfo" || !SUPABASE_CONFIGURED || cfoContractsLoaded) return;
    (async () => {
      const { data } = await supabase.from("contracts").select("*,cruise_lines(name)").order("created_at", { ascending: false });
      if (data) setCfoContracts(data.map(c => ({ ...c, cruise_line_name: c.cruise_lines?.name || "Unknown" })));
      setCfoContractsLoaded(true);
    })();
  }, [activeModule, cfoContractsLoaded]);

  // Load invoices LIVE from Payday API
  useEffect(() => {
    if (activeModule !== "cfo" || !paydayConnected || pdInvoicesLoaded || pdInvoicesLoading) return;
    (async () => {
      setPdInvoicesLoading(true);
      setPdInvoicesError(null);
      try {
        const result = await payday.invoices.list({ dateFrom: pdDateFrom, dateTo: pdDateTo });
        if (!result.ok) throw new Error(result.error?.message || "Failed to load invoices");
        const custMap = {};
        cfoCruiseLines.forEach(cl => { if (cl.payday_customer_id) custMap[cl.payday_customer_id] = cl.name; });
        const normalized = (result.data || []).map(inv => {
          const custId = String(inv.customer?.id || inv.customerId || "");
          return {
            id: inv.id,
            invoice_number: inv.number ? `${inv.number}` : `PD-${inv.id}`,
            cruise_line_name: custMap[custId] || inv.customer?.name || inv.customerName || "Unknown",
            customer_id: custId,
            status: mapPaydayInvoiceStatus(inv.status),
            issue_date: (inv.invoiceDate || inv.created || "").slice(0, 10),
            due_date: (inv.dueDate || inv.finalDueDate || "").slice(0, 10),
            subtotal_isk: Math.abs(parseFloat(inv.amountExcludingVat || 0)),
            tax_isk: Math.abs(parseFloat(inv.amountVat || 0)),
            total_isk: Math.abs(parseFloat(inv.amountIncludingVat || 0)),
            raw: inv,
          };
        });
        setPdInvoices(normalized);
        setPdInvoicesLoaded(true);
      } catch (err) {
        setPdInvoicesError(err.message);
      } finally {
        setPdInvoicesLoading(false);
      }
    })();
  }, [activeModule, paydayConnected, pdInvoicesLoaded, pdInvoicesLoading, pdDateFrom, pdDateTo, cfoCruiseLines]);

  // Load expenses LIVE from Payday API
  useEffect(() => {
    if (activeModule !== "cfo" || !paydayConnected || pdExpensesLoaded || pdExpensesLoading) return;
    (async () => {
      setPdExpensesLoading(true);
      setPdExpensesError(null);
      try {
        const result = await payday.expenses.list({ from: pdDateFrom, to: pdDateTo });
        if (!result.ok) throw new Error(result.error?.message || "Failed to load expenses");
        const normalized = (result.data || []).map(exp => ({
          id: exp.id,
          category: "other",
          description: ((exp.comments || exp.reference || `Expense #${exp.id}`).split("\n").find(l => l.trim()) || "").trim().slice(0, 120),
          amount_isk: Math.abs(parseFloat(exp.amountIncludingVat || exp.amountExcludingVat || 0)),
          subtotal_isk: Math.abs(parseFloat(exp.amountExcludingVat || 0)),
          tax_isk: Math.abs(parseFloat(exp.amountVat || 0)),
          expense_date: (exp.date || exp.created || "").slice(0, 10),
          vendor: exp.creditor?.name || null,
          status: exp.status || null,
          recurring: false,
          raw: exp,
        }));
        setPdExpenses(normalized);
        setPdExpensesLoaded(true);
      } catch (err) {
        setPdExpensesError(err.message);
      } finally {
        setPdExpensesLoading(false);
      }
    })();
  }, [activeModule, paydayConnected, pdExpensesLoaded, pdExpensesLoading, pdDateFrom, pdDateTo]);

  useEffect(() => {
    if (activeModule !== "cfo" || !SUPABASE_CONFIGURED || cfoStaffLoaded) return;
    (async () => {
      const { data } = await supabase.from("staff").select("*").order("name", { ascending: true });
      if (data) setCfoStaff(data);
      setCfoStaffLoaded(true);
    })();
  }, [activeModule, cfoStaffLoaded]);

  // Load rate cards when expanding a contract
  useEffect(() => {
    if (!cfoExpandedContract || !SUPABASE_CONFIGURED) return;
    (async () => {
      const { data } = await supabase.from("rate_cards").select("*").eq("contract_id", cfoExpandedContract).order("service_type", { ascending: true });
      if (data) setCfoRateCards(data);
    })();
  }, [cfoExpandedContract]);

  // ─── PAYDAY CONNECTION TEST ─────────────────────────────────────────────────
  useEffect(() => {
    if (activeModule !== "cfo") return;
    if (!payday.connected()) {
      console.warn("Payday: env vars missing — VITE_PAYDAY_CLIENT_ID or VITE_PAYDAY_CLIENT_SECRET is empty");
      setPaydayConnected(false);
      return;
    }
    (async () => {
      console.log("Payday: testing connection...");
      const result = await payday.company.get();
      console.log("Payday: connection result", result.ok, result.error);
      setPaydayConnected(result.ok);
      if (result.ok && result.data) {
        setPaydayCompanyName(result.data.name || result.data.companyName || "Payday.is");
      }
    })();
  }, [activeModule]);

  // ─── PAYDAY HELPER FUNCTIONS ───────────────────────────────────────────────

  const paydayLoadCustomers = useCallback(async () => {
    setPaydayCustomersLoading(true);
    try {
      const result = await payday.customers.list();
      if (result.ok) setPaydayCustomers(result.data || []);
    } finally {
      setPaydayCustomersLoading(false);
    }
  }, []);

  const paydayMapCustomer = useCallback(async (cruiseLineId, paydayCustomerId) => {
    await supabase.from("cruise_lines").update({ payday_customer_id: paydayCustomerId || null }).eq("id", cruiseLineId);
    setCfoCruiseLines(prev => prev.map(c => c.id === cruiseLineId ? { ...c, payday_customer_id: paydayCustomerId || null } : c));
  }, []);

  const mapPaydayInvoiceStatus = (s) => {
    const map = { draft: "draft", open: "sent", sent: "sent", paid: "paid", overdue: "overdue", voided: "cancelled", cancelled: "cancelled", credit: "paid", unpaid: "sent" };
    return map[(s || "").toLowerCase()] || "draft";
  };

  const refreshPaydayData = useCallback(() => {
    setPdInvoicesLoaded(false);
    setPdExpensesLoaded(false);
  }, []);

  // ─── INVOICE GENERATION ──────────────────────────────────────────────────
  const calculateInvoiceLines = useCallback((portCall, rateCards) => {
    return rateCards.map(rc => {
      let quantity = 1;
      let desc = rc.description || CFO_SERVICE_TYPES[rc.service_type]?.label || rc.service_type;
      switch (rc.unit) {
        case "per_pax": quantity = portCall.pax || 0; desc += ` (${quantity} pax)`; break;
        case "per_hour": {
          const days = portCall.end_date ? Math.max(1, Math.ceil((new Date(portCall.end_date) - new Date(portCall.date)) / 86400000)) : 1;
          quantity = days * 8; desc += ` (${quantity} hrs)`; break;
        }
        case "per_call": case "flat": default: quantity = 1; break;
      }
      const lineTotal = Math.max(quantity * parseFloat(rc.rate_isk || 0), parseFloat(rc.min_charge_isk || 0));
      return { rate_card_id: rc.id, service_type: rc.service_type, description: desc, quantity, unit_price_isk: parseFloat(rc.rate_isk || 0), line_total_isk: lineTotal };
    });
  }, []);

  const calculateDueDate = (dateStr, paymentTerms) => {
    const d = new Date(dateStr);
    const match = (paymentTerms || "Net 30").match(/(\d+)/);
    d.setDate(d.getDate() + (match ? parseInt(match[1]) : 30));
    return d.toISOString().slice(0, 10);
  };

  const generatePaydayInvoice = useCallback(async (portCall, contract, rateCards) => {
    setCfoGenLoading(true);
    setCfoGenError(null);
    try {
      const cl = cfoCruiseLines.find(c => c.id === contract.cruise_line_id);
      if (!cl?.payday_customer_id) throw new Error(`"${cl?.name}" is not mapped to a Payday customer. Map it in Settings first.`);
      const lines = calculateInvoiceLines(portCall, rateCards);
      const payload = {
        customerId: cl.payday_customer_id,
        invoiceDate: portCall.date,
        dueDate: calculateDueDate(portCall.date, contract.payment_terms),
        reference: `IPS-${portCall.date}-${(cl.name || "").replace(/\s+/g, "").slice(0, 10)}`,
        lines: lines.map(l => ({ description: l.description, quantity: l.quantity, unitPrice: l.unit_price_isk, amount: l.line_total_isk })),
      };
      const result = await payday.invoices.create(payload);
      if (!result.ok) throw new Error(result.error?.message || "Payday rejected the invoice");
      refreshPaydayData();
      setCfoGenModal(null);
      return result.data;
    } catch (err) {
      setCfoGenError(err.message);
    } finally {
      setCfoGenLoading(false);
    }
  }, [cfoCruiseLines, calculateInvoiceLines, refreshPaydayData]);

  const openInvoiceGenerator = useCallback(async (contract) => {
    const { data: rates } = await supabase.from("rate_cards").select("*").eq("contract_id", contract.id);
    if (!rates || rates.length === 0) { alert("No rate cards defined for this contract. Add rate cards first."); return; }
    const cl = cfoCruiseLines.find(c => c.id === contract.cruise_line_id);
    const eligibleCalls = portCalls.filter(pc => pc.line === cl?.name).filter(pc => {
      return !pdInvoices.some(inv => inv.customer_id === cl?.payday_customer_id && inv.issue_date === pc.date);
    });
    setCfoGenError(null);
    setCfoGenModal({ contract, rateCards: rates, eligibleCalls, cruiseLine: cl });
  }, [cfoCruiseLines, portCalls, pdInvoices]);

  // ─── CFO CRUD OPERATIONS ────────────────────────────────────────────────────
  const cfoSaveContract = useCallback(async () => {
    if (!cfoContractForm.cruise_line_id) return;
    const payload = {
      cruise_line_id: cfoContractForm.cruise_line_id,
      season: cfoContractForm.season,
      status: cfoContractForm.status,
      start_date: cfoContractForm.start_date,
      end_date: cfoContractForm.end_date,
      payment_terms: cfoContractForm.payment_terms || null,
      notes: cfoContractForm.notes || null,
    };
    if (cfoContractModal === "new") {
      const { data } = await supabase.from("contracts").insert(payload);
      if (data?.[0]) {
        const cl = cfoCruiseLines.find(c => c.id === payload.cruise_line_id);
        setCfoContracts(prev => [{ ...data[0], cruise_line_name: cl?.name || "Unknown" }, ...prev]);
      }
    } else {
      await supabase.from("contracts").update(payload).eq("id", cfoContractModal);
      const cl = cfoCruiseLines.find(c => c.id === payload.cruise_line_id);
      setCfoContracts(prev => prev.map(c => c.id === cfoContractModal ? { ...c, ...payload, cruise_line_name: cl?.name || c.cruise_line_name } : c));
    }
    setCfoContractModal(null);
  }, [cfoContractModal, cfoContractForm, cfoCruiseLines]);

  const cfoDeleteContract = useCallback(async (id) => {
    await supabase.from("contracts").delete().eq("id", id);
    setCfoContracts(prev => prev.filter(c => c.id !== id));
    if (cfoExpandedContract === id) setCfoExpandedContract(null);
  }, [cfoExpandedContract]);

  const cfoSaveRateCard = useCallback(async () => {
    if (!cfoRateForm.rate_isk || !cfoExpandedContract) return;
    const payload = {
      contract_id: cfoExpandedContract,
      service_type: cfoRateForm.service_type,
      description: cfoRateForm.description || null,
      unit: cfoRateForm.unit,
      rate_isk: parseFloat(cfoRateForm.rate_isk),
      min_charge_isk: parseFloat(cfoRateForm.min_charge_isk) || 0,
    };
    const { data } = await supabase.from("rate_cards").insert(payload);
    if (data?.[0]) setCfoRateCards(prev => [...prev, data[0]]);
    setCfoRateForm({ service_type: "luggage_handling", description: "", unit: "per_pax", rate_isk: "", min_charge_isk: "0" });
    setCfoShowRateForm(false);
  }, [cfoRateForm, cfoExpandedContract]);

  const cfoDeleteRateCard = useCallback(async (id) => {
    await supabase.from("rate_cards").delete().eq("id", id);
    setCfoRateCards(prev => prev.filter(r => r.id !== id));
  }, []);

  const cfoSaveStaff = useCallback(async () => {
    if (!cfoStaffForm.name || !cfoStaffForm.role) return;
    const payload = {
      name: cfoStaffForm.name,
      role: cfoStaffForm.role,
      type: cfoStaffForm.type,
      hourly_rate_isk: cfoStaffForm.hourly_rate_isk ? parseFloat(cfoStaffForm.hourly_rate_isk) : null,
      monthly_salary_isk: cfoStaffForm.monthly_salary_isk ? parseFloat(cfoStaffForm.monthly_salary_isk) : null,
      phone: cfoStaffForm.phone || null,
      email: cfoStaffForm.email || null,
      notes: cfoStaffForm.notes || null,
    };
    if (cfoStaffModal === "new") {
      const { data } = await supabase.from("staff").insert(payload);
      if (data?.[0]) setCfoStaff(prev => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      await supabase.from("staff").update(payload).eq("id", cfoStaffModal);
      setCfoStaff(prev => prev.map(s => s.id === cfoStaffModal ? { ...s, ...payload } : s));
    }
    setCfoStaffModal(null);
  }, [cfoStaffModal, cfoStaffForm]);

  const cfoToggleStaffActive = useCallback(async (id, active) => {
    await supabase.from("staff").update({ active: !active }).eq("id", id);
    setCfoStaff(prev => prev.map(s => s.id === id ? { ...s, active: !active } : s));
  }, []);

  // CSV Import for rate cards
  const cfoImportCSV = useCallback(async (text) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return { imported: 0, errors: ["File has no data rows"] };
    const header = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
    const clMap = {};
    cfoCruiseLines.forEach(cl => { clMap[cl.name.toLowerCase()] = cl.id; });
    const errors = [];
    const byLine = {};
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(",").map(v => v.trim());
      const row = {};
      header.forEach((h, j) => { row[h] = vals[j]; });
      const clName = (row.cruise_line || "").toLowerCase();
      const clId = clMap[clName];
      if (!clId) { errors.push(`Row ${i + 1}: cruise line "${row.cruise_line}" not found`); continue; }
      if (!byLine[clId]) byLine[clId] = [];
      byLine[clId].push({
        service_type: row.service_type || "other",
        description: row.description || "",
        unit: row.unit || "per_call",
        rate_isk: parseFloat(row.rate_isk) || 0,
        min_charge_isk: parseFloat(row.min_charge_isk) || 0,
      });
    }
    let imported = 0;
    for (const [clId, rates] of Object.entries(byLine)) {
      let contract = cfoContracts.find(c => c.cruise_line_id === clId && c.season === "2026");
      if (!contract) {
        const { data } = await supabase.from("contracts").insert({ cruise_line_id: clId, season: "2026", status: "draft", start_date: "2026-05-01", end_date: "2026-09-30", payment_terms: "Net 30" });
        if (data?.[0]) {
          const cl = cfoCruiseLines.find(c => c.id === clId);
          contract = { ...data[0], cruise_line_name: cl?.name || "Unknown" };
          setCfoContracts(prev => [contract, ...prev]);
        }
      }
      if (contract) {
        const ratePayloads = rates.map(r => ({ ...r, contract_id: contract.id }));
        const { data } = await supabase.from("rate_cards").insert(ratePayloads);
        if (data) imported += data.length;
      }
    }
    return { imported, errors };
  }, [cfoCruiseLines, cfoContracts]);

  // ─── CFO COMPUTED DATA ──────────────────────────────────────────────────────
  const cfoStats = useMemo(() => {
    const activeContracts = cfoContracts.filter(c => c.status === "active").length;
    const draftContracts = cfoContracts.filter(c => c.status === "draft").length;
    const totalInvoiced = pdInvoices.reduce((s, i) => s + (parseFloat(i.total_isk) || 0), 0);
    const paidInvoiced = pdInvoices.filter(i => i.status === "paid").reduce((s, i) => s + (parseFloat(i.total_isk) || 0), 0);
    const outstandingInvoiced = pdInvoices.filter(i => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + (parseFloat(i.total_isk) || 0), 0);
    const overdueInvoiced = pdInvoices.filter(i => i.status === "overdue").reduce((s, i) => s + (parseFloat(i.total_isk) || 0), 0);
    const totalExpenses = pdExpenses.reduce((s, e) => s + (parseFloat(e.amount_isk) || 0), 0);
    const revenue = paidInvoiced;
    const profit = revenue - totalExpenses;
    const margin = revenue > 0 ? (profit / revenue * 100) : 0;
    const revenueByMonth = {};
    const expenseByMonth = {};
    pdInvoices.filter(i => i.status === "paid" || i.status === "sent").forEach(i => {
      const m = (i.issue_date || "").slice(0, 7);
      revenueByMonth[m] = (revenueByMonth[m] || 0) + (parseFloat(i.total_isk) || 0);
    });
    pdExpenses.forEach(e => {
      const m = (e.expense_date || "").slice(0, 7);
      expenseByMonth[m] = (expenseByMonth[m] || 0) + (parseFloat(e.amount_isk) || 0);
    });
    const months = [...new Set([...Object.keys(revenueByMonth), ...Object.keys(expenseByMonth)])].sort();
    const monthlyData = months.map(m => ({ month: m, revenue: revenueByMonth[m] || 0, expenses: expenseByMonth[m] || 0, profit: (revenueByMonth[m] || 0) - (expenseByMonth[m] || 0) }));
    const expByCat = {};
    pdExpenses.forEach(e => { expByCat[e.category] = (expByCat[e.category] || 0) + (parseFloat(e.amount_isk) || 0); });
    const expensePie = Object.entries(expByCat).map(([k, v]) => ({ name: CFO_EXPENSE_CATS[k]?.label || k, value: v, color: CFO_EXPENSE_CATS[k]?.color || "#64748B" }));
    const revByLine = {};
    pdInvoices.filter(i => i.status === "paid" || i.status === "sent").forEach(i => { revByLine[i.cruise_line_name] = (revByLine[i.cruise_line_name] || 0) + (parseFloat(i.total_isk) || 0); });
    const revByLineSorted = Object.entries(revByLine).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));
    return { activeContracts, draftContracts, totalInvoiced, paidInvoiced, outstandingInvoiced, overdueInvoiced, totalExpenses, revenue, profit, margin, monthlyData, expensePie, revByLineSorted };
  }, [cfoContracts, pdInvoices, pdExpenses]);

  // Report stats to parent for sidebar badges
  useEffect(() => {
    if (onStatsChange) onStatsChange({ activeContracts: cfoStats.activeContracts, paydayConnected });
  }, [cfoStats.activeContracts, paydayConnected, onStatsChange]);

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (<>

    {/* ═══ CONTRACT MODAL ═══ */}
    {cfoContractModal && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{cfoContractModal === "new" ? "New Contract" : "Edit Contract"}</h3>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "JetBrains Mono", display: "block", marginBottom: 4 }}>Cruise Line</label>
              <select value={cfoContractForm.cruise_line_id} onChange={e => setCfoContractForm(f => ({ ...f, cruise_line_id: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${BORDER}`, background: IPS_BLUE, color: TEXT, fontSize: 13 }}>
                <option value="">Select cruise line...</option>
                {cfoCruiseLines.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "JetBrains Mono", display: "block", marginBottom: 4 }}>Season</label>
                <input value={cfoContractForm.season} onChange={e => setCfoContractForm(f => ({ ...f, season: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${BORDER}`, background: IPS_BLUE, color: TEXT, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "JetBrains Mono", display: "block", marginBottom: 4 }}>Status</label>
                <select value={cfoContractForm.status} onChange={e => setCfoContractForm(f => ({ ...f, status: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${BORDER}`, background: IPS_BLUE, color: TEXT, fontSize: 13 }}>
                  <option value="draft">Draft</option><option value="active">Active</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "JetBrains Mono", display: "block", marginBottom: 4 }}>Start Date</label>
                <input type="date" value={cfoContractForm.start_date} onChange={e => setCfoContractForm(f => ({ ...f, start_date: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${BORDER}`, background: IPS_BLUE, color: TEXT, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "JetBrains Mono", display: "block", marginBottom: 4 }}>End Date</label>
                <input type="date" value={cfoContractForm.end_date} onChange={e => setCfoContractForm(f => ({ ...f, end_date: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${BORDER}`, background: IPS_BLUE, color: TEXT, fontSize: 13 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "JetBrains Mono", display: "block", marginBottom: 4 }}>Payment Terms</label>
              <input value={cfoContractForm.payment_terms} onChange={e => setCfoContractForm(f => ({ ...f, payment_terms: e.target.value }))} placeholder="e.g. Net 30" style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${BORDER}`, background: IPS_BLUE, color: TEXT, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "JetBrains Mono", display: "block", marginBottom: 4 }}>Notes</label>
              <textarea value={cfoContractForm.notes} onChange={e => setCfoContractForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${BORDER}`, background: IPS_BLUE, color: TEXT, fontSize: 13, resize: "vertical" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
            <button onClick={() => setCfoContractModal(null)} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT_DIM, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={cfoSaveContract} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: IPS_ACCENT, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save</button>
          </div>
        </div>
      </div>
    )}

    {/* ═══ INVOICE GENERATION MODAL ═══ */}
    {cfoGenModal && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24, width: "100%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Generate Invoice for {cfoGenModal.cruiseLine?.name}</h3>
          <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 16 }}>
            Contract: {cfoGenModal.contract.season} · Payment: {cfoGenModal.contract.payment_terms} · Rate cards: {cfoGenModal.rateCards.length}
          </div>
          {cfoGenModal.eligibleCalls.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: TEXT_DIM }}>No uninvoiced port calls found for this cruise line.</div>
          ) : (
            cfoGenModal.eligibleCalls.map(pc => {
              const lines = calculateInvoiceLines(pc, cfoGenModal.rateCards);
              const subtotal = lines.reduce((s, l) => s + l.line_total_isk, 0);
              return (
                <Card key={pc.date + pc.ship} style={{ marginBottom: 8, padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{pc.ship} — {pc.date}</div>
                      <div style={{ fontSize: 11, color: TEXT_DIM }}>{pc.pax} pax · {pc.turnaround ? "Turnaround" : "Transit"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, fontFamily: "JetBrains Mono", fontSize: 14 }}>{fmtISK(subtotal)}</div>
                      <button onClick={() => generatePaydayInvoice(pc, cfoGenModal.contract, cfoGenModal.rateCards)} disabled={cfoGenLoading} style={{ padding: "4px 12px", borderRadius: 4, border: "none", background: IPS_ACCENT, color: "#fff", fontSize: 11, fontWeight: 600, cursor: cfoGenLoading ? "not-allowed" : "pointer", marginTop: 4 }}>
                        {cfoGenLoading ? "Generating..." : "Generate"}
                      </button>
                    </div>
                  </div>
                  <table style={{ width: "100%", fontSize: 11, marginTop: 8, borderCollapse: "collapse" }}>
                    <tbody>
                      {lines.map((l, i) => (
                        <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                          <td style={{ padding: 4 }}>{l.description}</td>
                          <td style={{ padding: 4, textAlign: "right", color: TEXT_DIM }}>{l.quantity} x {fmtISK(l.unit_price_isk)}</td>
                          <td style={{ padding: 4, textAlign: "right", fontWeight: 600 }}>{fmtISK(l.line_total_isk)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              );
            })
          )}
          {cfoGenError && <div style={{ color: IPS_DANGER, fontSize: 12, marginTop: 8 }}>{cfoGenError}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button onClick={() => setCfoGenModal(null)} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT_DIM, fontSize: 13, cursor: "pointer" }}>Close</button>
          </div>
        </div>
      </div>
    )}

    {/* ═══ STAFF MODAL ═══ */}
    {cfoStaffModal && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{cfoStaffModal === "new" ? "Add Staff" : "Edit Staff"}</h3>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "JetBrains Mono", display: "block", marginBottom: 4 }}>Name</label>
                <input value={cfoStaffForm.name} onChange={e => setCfoStaffForm(f => ({ ...f, name: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${BORDER}`, background: IPS_BLUE, color: TEXT, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "JetBrains Mono", display: "block", marginBottom: 4 }}>Role</label>
                <input value={cfoStaffForm.role} onChange={e => setCfoStaffForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. stevedore, manager" style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${BORDER}`, background: IPS_BLUE, color: TEXT, fontSize: 13 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "JetBrains Mono", display: "block", marginBottom: 4 }}>Type</label>
              <select value={cfoStaffForm.type} onChange={e => setCfoStaffForm(f => ({ ...f, type: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${BORDER}`, background: IPS_BLUE, color: TEXT, fontSize: 13 }}>
                <option value="employee">Employee</option><option value="contractor">Contractor</option><option value="seasonal">Seasonal</option>
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "JetBrains Mono", display: "block", marginBottom: 4 }}>Hourly Rate (ISK)</label>
                <input type="number" value={cfoStaffForm.hourly_rate_isk} onChange={e => setCfoStaffForm(f => ({ ...f, hourly_rate_isk: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${BORDER}`, background: IPS_BLUE, color: TEXT, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "JetBrains Mono", display: "block", marginBottom: 4 }}>Monthly Salary (ISK)</label>
                <input type="number" value={cfoStaffForm.monthly_salary_isk} onChange={e => setCfoStaffForm(f => ({ ...f, monthly_salary_isk: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${BORDER}`, background: IPS_BLUE, color: TEXT, fontSize: 13 }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "JetBrains Mono", display: "block", marginBottom: 4 }}>Phone</label>
                <input value={cfoStaffForm.phone} onChange={e => setCfoStaffForm(f => ({ ...f, phone: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${BORDER}`, background: IPS_BLUE, color: TEXT, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "JetBrains Mono", display: "block", marginBottom: 4 }}>Email</label>
                <input value={cfoStaffForm.email} onChange={e => setCfoStaffForm(f => ({ ...f, email: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${BORDER}`, background: IPS_BLUE, color: TEXT, fontSize: 13 }} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
            <button onClick={() => setCfoStaffModal(null)} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT_DIM, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={cfoSaveStaff} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: IPS_ACCENT, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save</button>
          </div>
        </div>
      </div>
    )}

    {/* ═══ CFO DASHBOARD VIEW ═══ */}
    {cfoView === "dashboard" && (<>
      {(pdInvoicesLoading || pdExpensesLoading) && (
        <div style={{ textAlign: "center", padding: 8, marginBottom: 12, fontSize: 11, color: TEXT_DIM, background: "rgba(87,181,200,0.08)", borderRadius: 6 }}>Loading financial data from Payday...</div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { l: "Revenue", v: fmtISK(cfoStats.revenue), c: IPS_SUCCESS, bc: IPS_SUCCESS },
          { l: "Expenses", v: fmtISK(cfoStats.totalExpenses), c: IPS_DANGER, bc: IPS_DANGER },
          { l: "Net Profit", v: fmtISK(cfoStats.profit), c: cfoStats.profit >= 0 ? IPS_SUCCESS : IPS_DANGER, bc: cfoStats.profit >= 0 ? IPS_SUCCESS : IPS_DANGER },
          { l: "Margin", v: cfoStats.margin.toFixed(1) + "%", c: cfoStats.margin >= 20 ? IPS_SUCCESS : IPS_WARN, bc: IPS_ACCENT },
          { l: "Outstanding", v: fmtISK(cfoStats.outstandingInvoiced), c: IPS_WARN, bc: IPS_WARN },
          { l: "Contracts", v: cfoStats.activeContracts, s: `${cfoStats.draftContracts} draft`, c: IPS_ACCENT, bc: IPS_ACCENT },
        ].map((x, i) => (<Card key={i} style={{ borderTop: `2px solid ${x.bc || BORDER}`, padding: "16px 12px" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>{x.l}</div><div style={{ fontSize: 22, fontWeight: 700, color: x.c || TEXT, fontFamily: "JetBrains Mono", lineHeight: 1.1 }}>{x.v}</div>{x.s && <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 4 }}>{x.s}</div>}</div></Card>))}
      </div>

      {cfoStats.monthlyData.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 20 }}>
          <Card>
            <SL>Revenue vs Expenses</SL>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cfoStats.monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: TEXT_DIM, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: TEXT_DIM, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => (v / 1000).toFixed(0) + "K"} />
                <Tooltip content={<CTip />} />
                <Bar dataKey="revenue" name="Revenue" fill={IPS_SUCCESS} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill={IPS_DANGER} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          {cfoStats.expensePie.length > 0 && (
            <Card>
              <SL>Expense Breakdown</SL>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={cfoStats.expensePie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {cfoStats.expensePie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmtISK(v)} />
                  <Legend formatter={(v) => <span style={{ color: TEXT_DIM, fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      ) : (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>$</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No Financial Data Yet</div>
          <div style={{ fontSize: 13, color: TEXT_DIM }}>{paydayConnected ? "Financial data loads live from Payday.is. Your invoices and expenses will appear here automatically." : "Connect to Payday.is in Settings to see live financial data."}</div>
        </Card>
      )}

      {cfoStats.revByLineSorted.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <SL>Revenue by Cruise Line</SL>
          <ResponsiveContainer width="100%" height={Math.max(200, cfoStats.revByLineSorted.length * 36)}>
            <BarChart data={cfoStats.revByLineSorted} layout="vertical" barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: TEXT_DIM, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => (v / 1000).toFixed(0) + "K"} />
              <YAxis type="category" dataKey="name" tick={{ fill: TEXT_DIM, fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip formatter={(v) => fmtISK(v)} />
              <Bar dataKey="value" name="Revenue" fill={IPS_ACCENT} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </>)}

    {/* ═══ CONTRACTS VIEW ═══ */}
    {cfoView === "contracts" && (<>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => { setCfoContractForm({ cruise_line_id: "", season: "2026", status: "draft", start_date: "2026-05-01", end_date: "2026-09-30", payment_terms: "Net 30", notes: "" }); setCfoContractModal("new"); }} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: IPS_ACCENT, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><IconPlus /> New Contract</button>
        <label style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT_DIM, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <IconUpload /> Import CSV
          <input type="file" accept=".csv" style={{ display: "none" }} onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const text = await file.text();
            const result = await cfoImportCSV(text);
            alert(`Imported ${result.imported} rate cards.${result.errors.length > 0 ? "\n\nWarnings:\n" + result.errors.join("\n") : ""}`);
            e.target.value = "";
          }} />
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { l: "Total", v: cfoContracts.length, bc: TEXT_DIM },
          { l: "Active", v: cfoStats.activeContracts, c: IPS_SUCCESS, bc: IPS_SUCCESS },
          { l: "Draft", v: cfoStats.draftContracts, c: IPS_WARN, bc: IPS_WARN },
          { l: "Expired", v: cfoContracts.filter(c => c.status === "expired").length, bc: TEXT_DIM },
        ].map((x, i) => (<Card key={i} style={{ borderTop: `2px solid ${x.bc || BORDER}`, padding: "12px 10px" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 4 }}>{x.l}</div><div style={{ fontSize: 22, fontWeight: 700, color: x.c || TEXT, fontFamily: "JetBrains Mono" }}>{x.v}</div></div></Card>))}
      </div>

      {cfoContracts.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 14, color: TEXT_DIM }}>No contracts yet. Create one or import from CSV.</div>
        </Card>
      ) : cfoContracts.map(c => (
        <Card key={c.id} style={{ marginBottom: 8, cursor: "pointer", borderLeft: c.status === "active" ? `3px solid ${IPS_SUCCESS}` : c.status === "draft" ? `3px solid ${IPS_WARN}` : `3px solid ${BORDER}` }} onClick={() => setCfoExpandedContract(cfoExpandedContract === c.id ? null : c.id)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <IconChevron down={cfoExpandedContract === c.id} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{c.cruise_line_name}</div>
                <div style={{ fontSize: 11, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>{c.season} · {c.start_date} → {c.end_date} · {c.payment_terms || "—"}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 600, fontFamily: "JetBrains Mono", background: c.status === "active" ? "rgba(34,197,94,0.15)" : c.status === "draft" ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)", color: c.status === "active" ? IPS_SUCCESS : c.status === "draft" ? IPS_WARN : TEXT_DIM }}>{c.status.toUpperCase()}</span>
              <button onClick={(e) => { e.stopPropagation(); setCfoContractForm({ cruise_line_id: c.cruise_line_id, season: c.season, status: c.status, start_date: c.start_date, end_date: c.end_date, payment_terms: c.payment_terms || "", notes: c.notes || "" }); setCfoContractModal(c.id); }} style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT_DIM, fontSize: 11, cursor: "pointer" }}>Edit</button>
              <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete this contract and all its rate cards?")) cfoDeleteContract(c.id); }} style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid rgba(239,68,68,0.3)`, background: "transparent", color: IPS_DANGER, fontSize: 11, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
          {/* Expanded: Rate cards */}
          {cfoExpandedContract === c.id && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${BORDER}` }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <SL>Rate Cards</SL>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { setCfoRateForm({ service_type: "luggage_handling", description: "", unit: "per_pax", rate_isk: "", min_charge_isk: "0" }); setCfoShowRateForm(!cfoShowRateForm); }} style={{ padding: "4px 12px", borderRadius: 4, border: "none", background: "rgba(87,181,200,0.15)", color: IPS_ACCENT, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{cfoShowRateForm ? "Cancel" : "+ Add Rate"}</button>
                  {paydayConnected && <button onClick={() => openInvoiceGenerator(c)} style={{ padding: "4px 12px", borderRadius: 4, border: "none", background: "rgba(34,197,94,0.15)", color: IPS_SUCCESS, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Generate Invoice</button>}
                </div>
              </div>
              {cfoShowRateForm && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 120px 120px auto", gap: 8, marginBottom: 12, alignItems: "end" }}>
                  <div>
                    <label style={{ fontSize: 10, color: TEXT_DIM, display: "block", marginBottom: 2 }}>Service</label>
                    <select value={cfoRateForm.service_type} onChange={e => setCfoRateForm(f => ({ ...f, service_type: e.target.value }))} style={{ width: "100%", padding: "6px 8px", borderRadius: 4, border: `1px solid ${BORDER}`, background: IPS_BLUE, color: TEXT, fontSize: 12 }}>
                      {Object.entries(CFO_SERVICE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: TEXT_DIM, display: "block", marginBottom: 2 }}>Description</label>
                    <input value={cfoRateForm.description} onChange={e => setCfoRateForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Per pax handling" style={{ width: "100%", padding: "6px 8px", borderRadius: 4, border: `1px solid ${BORDER}`, background: IPS_BLUE, color: TEXT, fontSize: 12 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: TEXT_DIM, display: "block", marginBottom: 2 }}>Unit</label>
                    <select value={cfoRateForm.unit} onChange={e => setCfoRateForm(f => ({ ...f, unit: e.target.value }))} style={{ width: "100%", padding: "6px 8px", borderRadius: 4, border: `1px solid ${BORDER}`, background: IPS_BLUE, color: TEXT, fontSize: 12 }}>
                      {Object.entries(CFO_UNITS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: TEXT_DIM, display: "block", marginBottom: 2 }}>Rate (ISK)</label>
                    <input type="number" value={cfoRateForm.rate_isk} onChange={e => setCfoRateForm(f => ({ ...f, rate_isk: e.target.value }))} style={{ width: "100%", padding: "6px 8px", borderRadius: 4, border: `1px solid ${BORDER}`, background: IPS_BLUE, color: TEXT, fontSize: 12 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: TEXT_DIM, display: "block", marginBottom: 2 }}>Min Charge</label>
                    <input type="number" value={cfoRateForm.min_charge_isk} onChange={e => setCfoRateForm(f => ({ ...f, min_charge_isk: e.target.value }))} style={{ width: "100%", padding: "6px 8px", borderRadius: 4, border: `1px solid ${BORDER}`, background: IPS_BLUE, color: TEXT, fontSize: 12 }} />
                  </div>
                  <button onClick={cfoSaveRateCard} style={{ padding: "6px 12px", borderRadius: 4, border: "none", background: IPS_ACCENT, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save</button>
                </div>
              )}
              {cfoRateCards.length === 0 ? (
                <div style={{ fontSize: 12, color: TEXT_DIM, padding: 8 }}>No rate cards yet. Add one above.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <th style={{ textAlign: "left", padding: "6px 8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Service</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Description</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Unit</th>
                        <th style={{ textAlign: "right", padding: "6px 8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Rate (ISK)</th>
                        <th style={{ textAlign: "right", padding: "6px 8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Min Charge</th>
                        <th style={{ width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cfoRateCards.map(r => (
                        <tr key={r.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                          <td style={{ padding: "6px 8px" }}><span style={{ padding: "2px 6px", borderRadius: 3, fontSize: 10, background: `${CFO_SERVICE_TYPES[r.service_type]?.color || "#64748B"}22`, color: CFO_SERVICE_TYPES[r.service_type]?.color || TEXT_DIM }}>{CFO_SERVICE_TYPES[r.service_type]?.label || r.service_type}</span></td>
                          <td style={{ padding: "6px 8px", color: TEXT_DIM }}>{r.description || "—"}</td>
                          <td style={{ padding: "6px 8px", color: TEXT_DIM }}>{CFO_UNITS[r.unit] || r.unit}</td>
                          <td style={{ padding: "6px 8px", textAlign: "right", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{fmtISK(r.rate_isk)}</td>
                          <td style={{ padding: "6px 8px", textAlign: "right", fontFamily: "JetBrains Mono", color: TEXT_DIM }}>{fmtISK(r.min_charge_isk)}</td>
                          <td style={{ padding: "6px 4px", textAlign: "center" }}><button onClick={() => cfoDeleteRateCard(r.id)} style={{ background: "none", border: "none", color: IPS_DANGER, cursor: "pointer", fontSize: 11 }}>x</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </>)}

    {/* ═══ INVOICES VIEW ═══ */}
    {cfoView === "invoices" && (<>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", "draft", "sent", "paid", "overdue"].map(s => (
          <FilterPill key={s} label={s === "all" ? "All" : CFO_INV_STATUS[s]?.label || s} active={cfoInvoiceFilter === s} color={s === "all" ? IPS_ACCENT : CFO_INV_STATUS[s]?.color} onClick={() => setCfoInvoiceFilter(s)} />
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={refreshPaydayData} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "rgba(87,181,200,0.15)", color: IPS_ACCENT, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><IconSync /> Refresh</button>
      </div>
      {pdInvoicesLoading && (
        <Card style={{ textAlign: "center", padding: 16, marginBottom: 12 }}><div style={{ fontSize: 12, color: TEXT_DIM }}>Loading invoices from Payday...</div></Card>
      )}
      {pdInvoicesError && (
        <Card style={{ textAlign: "center", padding: 16, marginBottom: 12, borderTop: `2px solid ${IPS_DANGER}` }}><div style={{ fontSize: 12, color: IPS_DANGER }}>Error: {pdInvoicesError}</div><button onClick={refreshPaydayData} style={{ marginTop: 8, padding: "4px 12px", borderRadius: 4, border: "none", background: IPS_ACCENT, color: "#fff", fontSize: 11, cursor: "pointer" }}>Retry</button></Card>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { l: "Total Invoiced", v: fmtISK(cfoStats.totalInvoiced), bc: IPS_ACCENT },
          { l: "Paid", v: fmtISK(cfoStats.paidInvoiced), c: IPS_SUCCESS, bc: IPS_SUCCESS },
          { l: "Outstanding", v: fmtISK(cfoStats.outstandingInvoiced), c: IPS_WARN, bc: IPS_WARN },
          { l: "Overdue", v: fmtISK(cfoStats.overdueInvoiced), c: IPS_DANGER, bc: IPS_DANGER },
        ].map((x, i) => (<Card key={i} style={{ borderTop: `2px solid ${x.bc || BORDER}`, padding: "12px 10px" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 4 }}>{x.l}</div><div style={{ fontSize: 18, fontWeight: 700, color: x.c || TEXT, fontFamily: "JetBrains Mono" }}>{x.v}</div></div></Card>))}
      </div>
      {pdInvoices.filter(i => cfoInvoiceFilter === "all" || i.status === cfoInvoiceFilter).length === 0 && !pdInvoicesLoading ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 14, color: TEXT_DIM }}>{paydayConnected ? "No invoices found for this period." : "Connect to Payday.is in Settings to see invoices."}</div>
        </Card>
      ) : !pdInvoicesLoading && (
        <Card>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ textAlign: "left", padding: "8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Invoice #</th>
                  <th style={{ textAlign: "left", padding: "8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Cruise Line</th>
                  <th style={{ textAlign: "left", padding: "8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Issue Date</th>
                  <th style={{ textAlign: "left", padding: "8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Due Date</th>
                  <th style={{ textAlign: "right", padding: "8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Total</th>
                  <th style={{ textAlign: "center", padding: "8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pdInvoices.filter(i => cfoInvoiceFilter === "all" || i.status === cfoInvoiceFilter).map(inv => (
                  <tr key={inv.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                    <td style={{ padding: "8px", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{inv.invoice_number}</td>
                    <td style={{ padding: "8px" }}>{inv.cruise_line_name}</td>
                    <td style={{ padding: "8px", color: TEXT_DIM }}>{inv.issue_date}</td>
                    <td style={{ padding: "8px", color: TEXT_DIM }}>{inv.due_date}</td>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{fmtISK(inv.total_isk)}</td>
                    <td style={{ padding: "8px", textAlign: "center" }}><span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 600, fontFamily: "JetBrains Mono", background: `${CFO_INV_STATUS[inv.status]?.color || "#64748B"}22`, color: CFO_INV_STATUS[inv.status]?.color || TEXT_DIM }}>{(inv.status || "").toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>)}

    {/* ═══ EXPENSES VIEW ═══ */}
    {cfoView === "expenses" && (<>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", ...Object.keys(CFO_EXPENSE_CATS)].map(k => (
          <FilterPill key={k} label={k === "all" ? "All" : CFO_EXPENSE_CATS[k]?.label} active={cfoExpenseCatFilter === k} color={k === "all" ? IPS_ACCENT : CFO_EXPENSE_CATS[k]?.color} onClick={() => setCfoExpenseCatFilter(k)} />
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={refreshPaydayData} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "rgba(87,181,200,0.15)", color: IPS_ACCENT, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><IconSync /> Refresh</button>
      </div>
      {pdExpensesLoading && (
        <Card style={{ textAlign: "center", padding: 16, marginBottom: 12 }}><div style={{ fontSize: 12, color: TEXT_DIM }}>Loading expenses from Payday...</div></Card>
      )}
      {pdExpensesError && (
        <Card style={{ textAlign: "center", padding: 16, marginBottom: 12, borderTop: `2px solid ${IPS_DANGER}` }}><div style={{ fontSize: 12, color: IPS_DANGER }}>Error: {pdExpensesError}</div><button onClick={refreshPaydayData} style={{ marginTop: 8, padding: "4px 12px", borderRadius: 4, border: "none", background: IPS_ACCENT, color: "#fff", fontSize: 11, cursor: "pointer" }}>Retry</button></Card>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { l: "Total", v: fmtISK(cfoStats.totalExpenses), bc: IPS_DANGER },
          { l: "Monthly Avg", v: fmtISK(pdExpenses.length > 0 ? cfoStats.totalExpenses / Math.max(1, new Set(pdExpenses.map(e => (e.expense_date || "").slice(0, 7))).size) : 0), bc: IPS_WARN },
          { l: "Count", v: pdExpenses.length, bc: IPS_ACCENT },
        ].map((x, i) => (<Card key={i} style={{ borderTop: `2px solid ${x.bc || BORDER}`, padding: "12px 10px" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 4 }}>{x.l}</div><div style={{ fontSize: 18, fontWeight: 700, color: x.c || TEXT, fontFamily: "JetBrains Mono" }}>{x.v}</div>{x.s && <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 2 }}>{x.s}</div>}</div></Card>))}
      </div>
      {pdExpenses.filter(e => cfoExpenseCatFilter === "all" || e.category === cfoExpenseCatFilter).length === 0 && !pdExpensesLoading ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 14, color: TEXT_DIM }}>{paydayConnected ? "No expenses found for this period." : "Connect to Payday.is in Settings to see expenses."}</div>
        </Card>
      ) : !pdExpensesLoading && (
        <Card>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ textAlign: "left", padding: "8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Date</th>
                  <th style={{ textAlign: "left", padding: "8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Description</th>
                  <th style={{ textAlign: "left", padding: "8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Vendor</th>
                  <th style={{ textAlign: "right", padding: "8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {pdExpenses.filter(e => cfoExpenseCatFilter === "all" || e.category === cfoExpenseCatFilter).map(exp => (
                  <tr key={exp.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                    <td style={{ padding: "8px", color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>{exp.expense_date}</td>
                    <td style={{ padding: "8px" }}>{exp.description}</td>
                    <td style={{ padding: "8px", color: TEXT_DIM }}>{exp.vendor || "—"}</td>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{fmtISK(exp.amount_isk)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>)}

    {/* ═══ STAFF VIEW ═══ */}
    {cfoView === "staff" && (<>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <button onClick={() => { setCfoStaffForm({ name: "", role: "", type: "employee", hourly_rate_isk: "", monthly_salary_isk: "", phone: "", email: "", notes: "" }); setCfoStaffModal("new"); }} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: IPS_ACCENT, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><IconPlus /> Add Staff</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { l: "Total Staff", v: cfoStaff.length, bc: IPS_ACCENT },
          { l: "Active", v: cfoStaff.filter(s => s.active).length, c: IPS_SUCCESS, bc: IPS_SUCCESS },
          { l: "Employees", v: cfoStaff.filter(s => s.type === "employee").length, bc: TEXT_DIM },
          { l: "Contractors", v: cfoStaff.filter(s => s.type === "contractor").length, bc: IPS_WARN },
        ].map((x, i) => (<Card key={i} style={{ borderTop: `2px solid ${x.bc || BORDER}`, padding: "12px 10px" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 4 }}>{x.l}</div><div style={{ fontSize: 22, fontWeight: 700, color: x.c || TEXT, fontFamily: "JetBrains Mono" }}>{x.v}</div></div></Card>))}
      </div>
      {cfoStaff.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 14, color: TEXT_DIM }}>No staff members yet.</div>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ textAlign: "left", padding: "8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Name</th>
                  <th style={{ textAlign: "left", padding: "8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Role</th>
                  <th style={{ textAlign: "left", padding: "8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Type</th>
                  <th style={{ textAlign: "right", padding: "8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Rate</th>
                  <th style={{ textAlign: "center", padding: "8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Status</th>
                  <th style={{ textAlign: "center", padding: "8px", width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {cfoStaff.map(s => (
                  <tr key={s.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)`, opacity: s.active ? 1 : 0.5 }}>
                    <td style={{ padding: "8px", fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: "8px", color: TEXT_DIM }}>{s.role}</td>
                    <td style={{ padding: "8px" }}><span style={{ padding: "2px 6px", borderRadius: 3, fontSize: 10, background: s.type === "employee" ? "rgba(87,181,200,0.15)" : s.type === "contractor" ? "rgba(245,158,11,0.15)" : "rgba(167,139,250,0.15)", color: s.type === "employee" ? IPS_ACCENT : s.type === "contractor" ? IPS_WARN : PROSPECT_COLOR }}>{CFO_STAFF_TYPES[s.type] || s.type}</span></td>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "JetBrains Mono" }}>{s.hourly_rate_isk ? fmtISK(s.hourly_rate_isk) + "/hr" : s.monthly_salary_isk ? fmtISK(s.monthly_salary_isk) + "/mo" : "—"}</td>
                    <td style={{ padding: "8px", textAlign: "center" }}><button onClick={() => cfoToggleStaffActive(s.id, s.active)} style={{ background: "none", border: `1px solid ${s.active ? IPS_SUCCESS : TEXT_DIM}`, color: s.active ? IPS_SUCCESS : TEXT_DIM, borderRadius: 4, padding: "2px 8px", fontSize: 10, cursor: "pointer", fontFamily: "JetBrains Mono" }}>{s.active ? "Active" : "Inactive"}</button></td>
                    <td style={{ padding: "8px", textAlign: "center" }}>
                      <button onClick={() => { setCfoStaffForm({ name: s.name, role: s.role, type: s.type, hourly_rate_isk: s.hourly_rate_isk || "", monthly_salary_isk: s.monthly_salary_isk || "", phone: s.phone || "", email: s.email || "", notes: s.notes || "" }); setCfoStaffModal(s.id); }} style={{ background: "none", border: "none", color: TEXT_DIM, cursor: "pointer", fontSize: 11 }}>edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>)}

    {/* ═══ PAYDAY SYNC VIEW ═══ */}
    {cfoView === "payday" && (<>
      {/* Connection Status */}
      <Card style={{ marginBottom: 16, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: paydayConnected === true ? IPS_SUCCESS : paydayConnected === false ? IPS_DANGER : TEXT_DIM }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{paydayConnected === true ? `Connected to ${paydayCompanyName}` : paydayConnected === false ? "Not connected" : "Checking connection..."}</div>
            <div style={{ fontSize: 11, color: TEXT_DIM }}>Payday.is accounting integration</div>
          </div>
        </div>
        {paydayConnected === false && (
          <div style={{ fontSize: 11, color: TEXT_DIM, maxWidth: 300, textAlign: "right" }}>Check your VITE_PAYDAY_CLIENT_ID and VITE_PAYDAY_CLIENT_SECRET in .env</div>
        )}
      </Card>

      {/* Customer Mapping */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>Customer Mapping</div>
          <button disabled={paydayCustomersLoading || !paydayConnected} onClick={paydayLoadCustomers} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: paydayCustomersLoading ? TEXT_DIM : IPS_ACCENT, color: "#fff", fontSize: 12, fontWeight: 600, cursor: paydayCustomersLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, opacity: !paydayConnected ? 0.4 : 1 }}>
            <IconSync /> {paydayCustomersLoading ? "Loading..." : "Load Payday Customers"}
          </button>
        </div>
        <Card>
          {cfoCruiseLines.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: TEXT_DIM, fontSize: 13 }}>No cruise lines in database.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <th style={{ textAlign: "left", padding: "8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Cruise Line</th>
                    <th style={{ textAlign: "left", padding: "8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Payday Customer</th>
                    <th style={{ textAlign: "center", padding: "8px", color: TEXT_DIM, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 500 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cfoCruiseLines.map(cl => (
                    <tr key={cl.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                      <td style={{ padding: "8px", fontWeight: 600 }}>{cl.name}</td>
                      <td style={{ padding: "8px" }}>
                        {paydayCustomers.length > 0 ? (
                          <select value={cl.payday_customer_id || ""} onChange={e => paydayMapCustomer(cl.id, e.target.value)} style={{ background: IPS_BLUE, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "4px 8px", fontSize: 12, width: "100%", maxWidth: 300 }}>
                            <option value="">— Not mapped —</option>
                            {paydayCustomers.map(pc => (
                              <option key={pc.id} value={String(pc.id)}>{pc.name || pc.companyName || `Customer #${pc.id}`}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ color: TEXT_DIM, fontSize: 11 }}>{cl.payday_customer_id ? `ID: ${cl.payday_customer_id}` : "Not mapped"}</span>
                        )}
                      </td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        {cl.payday_customer_id ? (
                          <span style={{ padding: "2px 6px", borderRadius: 3, fontSize: 10, background: "rgba(34,197,94,0.15)", color: IPS_SUCCESS }}>Mapped</span>
                        ) : (
                          <span style={{ padding: "2px 6px", borderRadius: 3, fontSize: 10, background: "rgba(255,255,255,0.05)", color: TEXT_DIM }}>Unmapped</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Data Range */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 10 }}>Payday Data Range</div>
        <Card style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <label style={{ fontSize: 11, color: TEXT_DIM, display: "block", marginBottom: 2 }}>From:</label>
              <input type="date" value={pdDateFrom} onChange={e => { setPdDateFrom(e.target.value); refreshPaydayData(); }} style={{ background: IPS_BLUE, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "6px 8px", fontSize: 12, fontFamily: "JetBrains Mono" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: TEXT_DIM, display: "block", marginBottom: 2 }}>To:</label>
              <input type="date" value={pdDateTo} onChange={e => { setPdDateTo(e.target.value); refreshPaydayData(); }} style={{ background: IPS_BLUE, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "6px 8px", fontSize: 12, fontFamily: "JetBrains Mono" }} />
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 11, color: TEXT_DIM }}>
              {pdInvoicesLoaded ? `${pdInvoices.length} invoices` : "..."} · {pdExpensesLoaded ? `${pdExpenses.length} expenses` : "..."} loaded
            </div>
          </div>
        </Card>
      </div>
    </>)}

  </>);
}
