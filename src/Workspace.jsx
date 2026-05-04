import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase, SUPABASE_URL, SUPABASE_CONFIGURED, supabaseHeaders } from "./supabase.js";
import { payday } from "./payday.js";
import {
  IPS_ACCENT, IPS_WARN, IPS_DANGER, IPS_SUCCESS, IPS_BLUE,
  SURFACE, BORDER, TEXT, TEXT_DIM,
  WS_TEAM, WS_PROJECTS, WS_PRIORITIES, generateId,
  JOB_STATUSES, CFO_SERVICE_TYPES, fmtISK,
  RESOURCE_CATALOG, RESOURCE_CATEGORIES,
} from "./constants.js";
import { Card, SL, FilterPill, inputStyle, fmtDate } from "./shared.jsx";

// 15-minute time slots for the resource time-picker datalist (00:00 → 23:45).
const TIME_SLOTS_15 = (() => {
  const out = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

// Loosely normalize a time string typed by the user. Accepts "9:00", "09:0",
// "9", "0930"; returns "HH:MM" if parseable, otherwise the original string.
const normalizeHhmm = (raw) => {
  if (!raw) return raw;
  const s = String(raw).trim();
  let m = s.match(/^(\d{1,2}):(\d{1,2})$/);
  if (m) {
    const h = Math.min(23, Number(m[1]));
    const mm = Math.min(59, Number(m[2]));
    return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }
  m = s.match(/^(\d{3,4})$/);
  if (m) {
    const padded = m[1].padStart(4, "0");
    const h = Math.min(23, Number(padded.slice(0, 2)));
    const mm = Math.min(59, Number(padded.slice(2)));
    return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }
  return s;
};

export default function Workspace({ wsView, activeModule, onDraftCountChange, portCalls = [], jobs = [], setJobs, accessLevel = "team" }) {
  // ─── WORKSPACE STATE ─────────────────────────────────────────────────────────
  const [wsTasks, setWsTasks] = useState([]);
  const [wsLoaded, setWsLoaded] = useState(false);
  const [wsTaskModal, setWsTaskModal] = useState(null); // null | "new" | taskId
  const [wsTaskForm, setWsTaskForm] = useState({ title: "", description: "", assignee: "jon", project: "operations", priority: "medium", dueDate: "" });
  const [wsFilter, setWsFilter] = useState({ assignee: "all", project: "all", priority: "all", status: "all" });
  const [wsSortBy, setWsSortBy] = useState("dueDate");
  const [wsSortDir, setWsSortDir] = useState("asc");
  const [wsCalMonth, setWsCalMonth] = useState(new Date().getMonth());
  const [wsCalYear, setWsCalYear] = useState(new Date().getFullYear());
  const [wsExpandedTask, setWsExpandedTask] = useState(null);
  const [wsNewNote, setWsNewNote] = useState("");
  const [wsNoteAuthor, setWsNoteAuthor] = useState("jon");
  const [wsDrafts, setWsDrafts] = useState([]);
  const [wsDraftsLoading, setWsDraftsLoading] = useState(false);
  const [wsDraftsCollapsed, setWsDraftsCollapsed] = useState(false);

  // ─── JOBS STATE ──────────────────────────────────────────────────────────────
  const emptyJobForm = { port_call_id: null, cruise_line_id: "", ship_name: "", call_date: "", end_date: "", planned_pax: "", turnaround: false, contract_id: "", notes: "", requested_resources: [] };
  const [jobFilter, setJobFilter] = useState("all");
  const [jobModal, setJobModal] = useState(null); // null | "new" | <jobId>
  const [jobForm, setJobForm] = useState(emptyJobForm);
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [jobFromSchedule, setJobFromSchedule] = useState(true);
  const [jobScheduleSearch, setJobScheduleSearch] = useState("");
  const [jobSaving, setJobSaving] = useState(false);
  const [jobError, setJobError] = useState(null);
  const [jobCruiseLines, setJobCruiseLines] = useState([]);
  const [jobContracts, setJobContracts] = useState([]);

  const [completeJob, setCompleteJob] = useState(null);
  const [completeHours, setCompleteHours] = useState("");
  const [completeNotes, setCompleteNotes] = useState("");
  const [completeSaving, setCompleteSaving] = useState(false);

  const [invoiceJob, setInvoiceJob] = useState(null);
  const [invoiceLines, setInvoiceLines] = useState([]);
  const [invoiceContext, setInvoiceContext] = useState(null); // {contract, cruiseLine, rateCards}
  const [invoiceSending, setInvoiceSending] = useState(false);
  const [invoiceError, setInvoiceError] = useState(null);

  // Lazy-load cruise_lines and contracts when the user opens the Jobs view
  useEffect(() => {
    if (wsView !== "jobs" || !SUPABASE_CONFIGURED) return;
    if (jobCruiseLines.length && jobContracts.length) return;
    (async () => {
      try {
        const [{ data: cls }, { data: cs }] = await Promise.all([
          supabase.from("cruise_lines").select("id,name,payday_customer_id").order("name", { ascending: true }),
          supabase.from("contracts").select("*").order("created_at", { ascending: false }),
        ]);
        if (Array.isArray(cls)) setJobCruiseLines(cls);
        if (Array.isArray(cs)) setJobContracts(cs);
      } catch (e) { console.warn("Failed to load cruise_lines / contracts:", e); }
    })();
  }, [wsView, jobCruiseLines.length, jobContracts.length]);

  // ─── WORKSPACE STORAGE (Supabase with localStorage fallback) ───────────────
  const loadTasksFromDb = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) return null;
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return null;
      // Also fetch notes for all tasks
      const { data: notes } = await supabase
        .from("task_notes")
        .select("*")
        .order("created_at", { ascending: true });
      const notesByTask = {};
      (notes || []).forEach(n => {
        if (!notesByTask[n.task_id]) notesByTask[n.task_id] = [];
        notesByTask[n.task_id].push({ id: n.id, author: n.author, text: n.text, createdAt: n.created_at });
      });
      return (data || []).map(t => ({
        id: t.id,
        title: t.title,
        description: t.description || "",
        assignee: t.assignee || "jon",
        project: t.project || "operations",
        priority: t.priority || "medium",
        dueDate: t.due_date || null,
        completed: t.completed || false,
        completedAt: t.completed_at || null,
        createdAt: t.created_at,
        notes: notesByTask[t.id] || [],
      }));
    } catch (e) { console.warn("Failed to load tasks from Supabase:", e); return null; }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // Try Supabase first
        const dbTasks = await loadTasksFromDb();
        if (dbTasks !== null) {
          setWsTasks(dbTasks);
        } else if (window.storage) {
          // Fall back to localStorage
          const raw = await window.storage.getItem("ws:tasks");
          if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) setWsTasks(p); }
        }
      } catch (e) { console.warn("Failed to load workspace tasks:", e); }
      finally { setWsLoaded(true); }
    })();
  }, [loadTasksFromDb]);

  const saveTasks = useCallback(async (tasks) => {
    setWsTasks(tasks);
    // Also keep localStorage as backup
    try { if (window.storage) await window.storage.setItem("ws:tasks", JSON.stringify(tasks), { shared: true }); }
    catch (e) { console.warn("Failed to save workspace tasks:", e); }
  }, []);

  const openNewTask = useCallback(() => {
    setWsTaskForm({ title: "", description: "", assignee: "jon", project: "operations", priority: "medium", dueDate: "" });
    setWsTaskModal("new");
  }, []);

  const openEditTask = useCallback((task) => {
    setWsTaskForm({ title: task.title, description: task.description, assignee: task.assignee, project: task.project, priority: task.priority, dueDate: task.dueDate || "" });
    setWsTaskModal(task.id);
  }, []);

  const saveTaskForm = useCallback(async () => {
    if (!wsTaskForm.title.trim()) return;
    if (wsTaskModal === "new") {
      const newTask = { id: generateId(), ...wsTaskForm, dueDate: wsTaskForm.dueDate || null, completed: false, createdAt: new Date().toISOString(), completedAt: null, notes: [] };
      saveTasks([...wsTasks, newTask]);
      // Persist to Supabase
      if (SUPABASE_CONFIGURED) {
        const { data } = await supabase.from("tasks").insert({
          title: wsTaskForm.title, description: wsTaskForm.description, assignee: wsTaskForm.assignee,
          project: wsTaskForm.project, priority: wsTaskForm.priority, due_date: wsTaskForm.dueDate || null,
        });
        // Update local ID to match DB UUID
        if (data && data[0]) {
          setWsTasks(prev => prev.map(t => t.id === newTask.id ? { ...t, id: data[0].id } : t));
        }
      }
    } else {
      saveTasks(wsTasks.map(t => t.id === wsTaskModal ? { ...t, ...wsTaskForm, dueDate: wsTaskForm.dueDate || null } : t));
      if (SUPABASE_CONFIGURED) {
        supabase.from("tasks").update({
          title: wsTaskForm.title, description: wsTaskForm.description, assignee: wsTaskForm.assignee,
          project: wsTaskForm.project, priority: wsTaskForm.priority, due_date: wsTaskForm.dueDate || null,
        }).eq("id", wsTaskModal).then(() => {});
      }
    }
    setWsTaskModal(null);
  }, [wsTaskModal, wsTaskForm, wsTasks, saveTasks]);

  const toggleComplete = useCallback((id) => {
    const task = wsTasks.find(t => t.id === id);
    const nowCompleted = !task?.completed;
    const completedAt = nowCompleted ? new Date().toISOString() : null;
    saveTasks(wsTasks.map(t => t.id === id ? { ...t, completed: nowCompleted, completedAt } : t));
    if (SUPABASE_CONFIGURED) {
      supabase.from("tasks").update({ completed: nowCompleted, completed_at: completedAt }).eq("id", id).then(() => {});
    }
  }, [wsTasks, saveTasks]);

  const deleteTask = useCallback((id) => {
    saveTasks(wsTasks.filter(t => t.id !== id));
    if (wsExpandedTask === id) setWsExpandedTask(null);
    if (SUPABASE_CONFIGURED) {
      supabase.from("tasks").delete().eq("id", id).then(() => {});
    }
  }, [wsTasks, saveTasks, wsExpandedTask]);

  const addNote = useCallback(async (taskId) => {
    if (!wsNewNote.trim()) return;
    const newNote = { id: generateId(), author: wsNoteAuthor, text: wsNewNote.trim(), createdAt: new Date().toISOString() };
    saveTasks(wsTasks.map(t => t.id === taskId ? { ...t, notes: [...(t.notes || []), newNote] } : t));
    if (SUPABASE_CONFIGURED) {
      const { data } = await supabase.from("task_notes").insert({ task_id: taskId, author: wsNoteAuthor, text: wsNewNote.trim() });
      if (data && data[0]) {
        setWsTasks(prev => prev.map(t => t.id === taskId ? { ...t, notes: (t.notes || []).map(n => n.id === newNote.id ? { ...n, id: data[0].id } : n) } : t));
      }
    }
    setWsNewNote("");
  }, [wsTasks, wsNewNote, wsNoteAuthor, saveTasks]);

  // ─── TELEGRAM DRAFTS — FETCH / ACCEPT / DISMISS ────────────────────────────
  const fetchDrafts = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) return;
    setWsDraftsLoading(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/task_drafts?status=eq.pending&order=created_at.desc`,
        { headers: supabaseHeaders }
      );
      if (res.ok) setWsDrafts(await res.json());
    } catch (e) { console.warn("Failed to fetch drafts:", e); }
    finally { setWsDraftsLoading(false); }
  }, []);

  useEffect(() => {
    if (SUPABASE_CONFIGURED && activeModule === "workspace") fetchDrafts();
  }, [activeModule, fetchDrafts]);

  // Notify parent of draft count changes
  useEffect(() => {
    if (onDraftCountChange) onDraftCountChange(wsDrafts.length);
  }, [wsDrafts, onDraftCountChange]);

  const acceptDraft = useCallback((draft) => {
    setWsTaskForm({
      title: draft.text,
      description: `Drafted via Telegram by ${draft.author}`,
      assignee: Object.keys(WS_TEAM).includes(draft.author) ? draft.author : "jon",
      project: "general",
      priority: "medium",
      dueDate: "",
    });
    setWsTaskModal("new");
    // Delete draft from Supabase after opening modal
    if (SUPABASE_CONFIGURED) {
      fetch(`${SUPABASE_URL}/rest/v1/task_drafts?id=eq.${draft.id}`, {
        method: "DELETE", headers: supabaseHeaders,
      }).then(() => setWsDrafts(d => d.filter(x => x.id !== draft.id)))
        .catch(e => console.warn("Failed to delete draft:", e));
    }
  }, []);

  const dismissDraft = useCallback(async (draftId) => {
    if (!SUPABASE_CONFIGURED) return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/task_drafts?id=eq.${draftId}`, {
        method: "PATCH",
        headers: supabaseHeaders,
        body: JSON.stringify({ status: "dismissed" }),
      });
      setWsDrafts(d => d.filter(x => x.id !== draftId));
    } catch (e) { console.warn("Failed to dismiss draft:", e); }
  }, []);

  // ─── JOBS — CRUD AND LIFECYCLE ───────────────────────────────────────────────
  const openNewJob = useCallback(() => {
    setJobForm(emptyJobForm);
    setJobError(null);
    setJobFromSchedule(true);
    setJobScheduleSearch("");
    setJobModal("new");
  }, []);

  const openEditJob = useCallback((job) => {
    setJobForm({
      port_call_id: job.port_call_id || null,
      cruise_line_id: job.cruise_line_id || "",
      ship_name: job.ship_name || "",
      call_date: job.call_date || "",
      end_date: job.end_date || "",
      planned_pax: job.planned_pax ?? "",
      turnaround: !!job.turnaround,
      contract_id: job.contract_id || "",
      notes: job.notes || "",
      requested_resources: Array.isArray(job.requested_resources) ? job.requested_resources : [],
    });
    setJobError(null);
    setJobFromSchedule(false); // editing — show ad-hoc form fields, no schedule picker
    setJobScheduleSearch("");
    setJobModal(job.id);
  }, []);

  const pickPortCall = useCallback((s) => {
    const cl = jobCruiseLines.find(c => c.name === s.line);
    setJobForm(f => ({
      ...f,
      port_call_id: s.id || null,
      cruise_line_id: cl?.id || "",
      ship_name: s.ship,
      call_date: s.date,
      end_date: s.endDate || "",
      planned_pax: s.pax ?? "",
      turnaround: !!s.turnaround,
      contract_id: "",
    }));
  }, [jobCruiseLines]);

  // ── Resource line items ─────────────────────────────────────────────────────
  // Sync helper: given a line and the field that was just edited, recompute the
  // dependent field. start_time + duration_hours → end_time, start_time + end_time → duration_hours.
  const syncTimeFields = (line, changed) => {
    const hhmmToMin = (t) => {
      if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return null;
      const [h, m] = t.split(":").map(Number);
      if (h > 23 || m > 59) return null;
      return h * 60 + m;
    };
    const minToHhmm = (mins) => {
      const m = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
      return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    };
    const start = hhmmToMin(line.start_time);
    const end = hhmmToMin(line.end_time);
    const dur = line.duration_hours === "" || line.duration_hours == null ? null : Number(line.duration_hours);

    if (changed === "duration_hours" && start != null && Number.isFinite(dur)) {
      return { ...line, end_time: minToHhmm(start + dur * 60) };
    }
    if (changed === "end_time" && start != null && end != null) {
      const minutes = end - start;
      return { ...line, duration_hours: minutes >= 0 ? +(minutes / 60).toFixed(2) : line.duration_hours };
    }
    if (changed === "start_time") {
      if (Number.isFinite(dur) && start != null) {
        return { ...line, end_time: minToHhmm(start + dur * 60) };
      }
      if (start != null && end != null) {
        const minutes = end - start;
        return { ...line, duration_hours: minutes >= 0 ? +(minutes / 60).toFixed(2) : line.duration_hours };
      }
    }
    return line;
  };

  const addResourceLine = useCallback(() => {
    setJobForm(f => ({
      ...f,
      requested_resources: [
        ...(f.requested_resources || []),
        { item_code: "", quantity: 1, start_time: "", end_time: "", duration_hours: "", notes: "" },
      ],
    }));
  }, []);

  const updateResourceLine = useCallback((idx, field, value) => {
    setJobForm(f => {
      const lines = [...(f.requested_resources || [])];
      const updated = { ...lines[idx], [field]: value };
      lines[idx] = (field === "start_time" || field === "end_time" || field === "duration_hours")
        ? syncTimeFields(updated, field)
        : updated;
      return { ...f, requested_resources: lines };
    });
  }, []);

  const removeResourceLine = useCallback((idx) => {
    setJobForm(f => ({
      ...f,
      requested_resources: (f.requested_resources || []).filter((_, i) => i !== idx),
    }));
  }, []);

  const saveJobForm = useCallback(async () => {
    if (!jobForm.ship_name?.trim() || !jobForm.call_date) {
      setJobError("Ship name and date are required.");
      return;
    }
    setJobSaving(true);
    setJobError(null);
    // Sanitize line items — drop empty rows, coerce numeric fields
    const cleanedResources = (jobForm.requested_resources || [])
      .filter(l => l.item_code)
      .map(l => ({
        item_code: l.item_code,
        quantity: Number(l.quantity) || 1,
        start_time: l.start_time || null,
        end_time: l.end_time || null,
        duration_hours: l.duration_hours === "" || l.duration_hours == null ? null : Number(l.duration_hours),
        notes: l.notes?.trim() || null,
      }));
    const isNew = jobModal === "new";
    const payload = {
      port_call_id: jobForm.port_call_id || null,
      contract_id: jobForm.contract_id || null,
      cruise_line_id: jobForm.cruise_line_id || null,
      ship_name: jobForm.ship_name.trim(),
      call_date: jobForm.call_date,
      end_date: jobForm.end_date || null,
      planned_pax: jobForm.planned_pax === "" ? null : Number(jobForm.planned_pax),
      turnaround: !!jobForm.turnaround,
      notes: jobForm.notes?.trim() || null,
      requested_resources: cleanedResources,
    };
    if (isNew) payload.status = "pending";
    try {
      if (SUPABASE_CONFIGURED) {
        if (isNew) {
          const { data, error } = await supabase.from("jobs").insert(payload);
          if (error) throw new Error(error.message || "Insert failed");
          const inserted = (Array.isArray(data) && data[0]) || { ...payload, id: generateId(), created_at: new Date().toISOString() };
          setJobs(prev => [...prev, inserted]);
        } else {
          const { error } = await supabase.from("jobs").update(payload).eq("id", jobModal);
          if (error) throw new Error(error.message || "Update failed");
          setJobs(prev => prev.map(j => j.id === jobModal ? { ...j, ...payload } : j));
        }
      } else {
        if (isNew) {
          setJobs(prev => [...prev, { ...payload, id: generateId(), status: "pending", created_at: new Date().toISOString() }]);
        } else {
          setJobs(prev => prev.map(j => j.id === jobModal ? { ...j, ...payload } : j));
        }
      }
      setJobModal(null);
    } catch (e) {
      setJobError(e.message || "Failed to save job");
    } finally {
      setJobSaving(false);
    }
  }, [jobForm, jobModal, setJobs]);

  const advanceJobStatus = useCallback(async (jobId, nextStatus, extraFields = {}) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: nextStatus, ...extraFields } : j));
    if (SUPABASE_CONFIGURED) {
      try {
        await supabase.from("jobs").update({ status: nextStatus, ...extraFields }).eq("id", jobId);
      } catch (e) { console.warn("Failed to update job status:", e); }
    }
  }, [setJobs]);

  const openCompleteModal = useCallback((job) => {
    setCompleteJob(job);
    setCompleteHours(job.confirmed_hours != null ? String(job.confirmed_hours) : "");
    setCompleteNotes(job.notes || "");
  }, []);

  const saveCompleteJob = useCallback(async () => {
    if (!completeJob) return;
    const hours = parseFloat(completeHours);
    if (!Number.isFinite(hours) || hours < 0) return;
    setCompleteSaving(true);
    await advanceJobStatus(completeJob.id, "completed", {
      confirmed_hours: hours,
      notes: completeNotes?.trim() || null,
    });
    setCompleteSaving(false);
    setCompleteJob(null);
    setCompleteHours("");
    setCompleteNotes("");
  }, [completeJob, completeHours, completeNotes, advanceJobStatus]);

  // Calculates invoice line items for a completed job. Mirrors CFOWorkspace.calculateInvoiceLines,
  // except per_hour uses the manager-confirmed hours instead of a date-range estimate.
  const buildInvoiceLines = useCallback((job, rateCards) => {
    return rateCards.map(rc => {
      let quantity = 1;
      let desc = rc.description || CFO_SERVICE_TYPES[rc.service_type]?.label || rc.service_type;
      switch (rc.unit) {
        case "per_pax":
          quantity = job.planned_pax || 0;
          desc += ` (${quantity} pax)`;
          break;
        case "per_hour":
          quantity = Number(job.confirmed_hours) || 0;
          desc += ` (${quantity} hrs)`;
          break;
        case "per_pallet":
        case "per_call":
        case "flat":
        default:
          quantity = 1;
          break;
      }
      const lineTotal = Math.max(quantity * parseFloat(rc.rate_isk || 0), parseFloat(rc.min_charge_isk || 0));
      return {
        rate_card_id: rc.id,
        service_type: rc.service_type,
        description: desc,
        quantity,
        unit_price_isk: parseFloat(rc.rate_isk || 0),
        line_total_isk: lineTotal,
      };
    });
  }, []);

  const calculateDueDate = (dateStr, paymentTerms) => {
    const d = new Date(dateStr);
    const match = (paymentTerms || "Net 30").match(/(\d+)/);
    d.setDate(d.getDate() + (match ? parseInt(match[1]) : 30));
    return d.toISOString().slice(0, 10);
  };

  const openInvoiceModal = useCallback(async (job) => {
    setInvoiceError(null);
    setInvoiceLines([]);
    setInvoiceContext(null);
    setInvoiceJob(job);
    if (!job.contract_id) {
      setInvoiceError("This job has no contract attached. Edit the job (or pick a contract) before invoicing.");
      return;
    }
    if (!SUPABASE_CONFIGURED) {
      setInvoiceError("Supabase is not configured in this environment.");
      return;
    }
    try {
      const { data: rateCards } = await supabase.from("rate_cards").select("*").eq("contract_id", job.contract_id);
      if (!rateCards || rateCards.length === 0) {
        setInvoiceError("No rate cards defined for this contract. Add rate cards in CFO Workspace first.");
        return;
      }
      const contract = jobContracts.find(c => c.id === job.contract_id) || null;
      const cruiseLine = jobCruiseLines.find(c => c.id === job.cruise_line_id) || null;
      setInvoiceContext({ contract, cruiseLine, rateCards });
      setInvoiceLines(buildInvoiceLines(job, rateCards));
    } catch (e) {
      setInvoiceError(e.message || "Failed to load rate cards");
    }
  }, [jobContracts, jobCruiseLines, buildInvoiceLines]);

  const sendInvoice = useCallback(async () => {
    if (!invoiceJob || !invoiceContext) return;
    const { contract, cruiseLine } = invoiceContext;
    if (!cruiseLine?.payday_customer_id) {
      setInvoiceError(`"${cruiseLine?.name || "This cruise line"}" is not mapped to a Payday customer. Map it in CFO Workspace → Settings.`);
      return;
    }
    setInvoiceSending(true);
    setInvoiceError(null);
    try {
      const payload = {
        customerId: cruiseLine.payday_customer_id,
        invoiceDate: invoiceJob.call_date,
        dueDate: calculateDueDate(invoiceJob.call_date, contract?.payment_terms),
        reference: `IPS-${invoiceJob.call_date}-${(cruiseLine.name || "").replace(/\s+/g, "").slice(0, 10)}`,
        lines: invoiceLines.map(l => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unit_price_isk,
          amount: l.line_total_isk,
        })),
      };
      const result = await payday.invoices.create(payload);
      if (!result.ok) throw new Error(result.error?.message || "Payday rejected the invoice");
      await advanceJobStatus(invoiceJob.id, "invoiced");
      setInvoiceJob(null);
      setInvoiceLines([]);
      setInvoiceContext(null);
    } catch (e) {
      setInvoiceError(e.message || "Failed to send invoice");
    } finally {
      setInvoiceSending(false);
    }
  }, [invoiceJob, invoiceContext, invoiceLines, advanceJobStatus]);

  // ─── COMPUTED ──────────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    let result = [...wsTasks];
    if (wsFilter.assignee !== "all") result = result.filter(t => t.assignee === wsFilter.assignee);
    if (wsFilter.project !== "all") result = result.filter(t => t.project === wsFilter.project);
    if (wsFilter.priority !== "all") result = result.filter(t => t.priority === wsFilter.priority);
    if (wsFilter.status === "active") result = result.filter(t => !t.completed);
    if (wsFilter.status === "completed") result = result.filter(t => t.completed);
    const po = { high: 0, medium: 1, low: 2 };
    result.sort((a, b) => {
      let c = 0;
      if (wsSortBy === "dueDate") c = (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
      else if (wsSortBy === "priority") c = po[a.priority] - po[b.priority];
      else if (wsSortBy === "createdAt") c = a.createdAt.localeCompare(b.createdAt);
      else if (wsSortBy === "title") c = a.title.localeCompare(b.title);
      return wsSortDir === "desc" ? -c : c;
    });
    return result;
  }, [wsTasks, wsFilter, wsSortBy, wsSortDir]);

  const wsStats = useMemo(() => {
    const total = wsTasks.length, active = wsTasks.filter(t => !t.completed).length, done = wsTasks.filter(t => t.completed).length;
    const overdue = wsTasks.filter(t => !t.completed && t.dueDate && t.dueDate < new Date().toISOString().split("T")[0]).length;
    const byProject = {}, byAssignee = { jon: { total: 0, done: 0 }, tristan: { total: 0, done: 0 } };
    Object.keys(WS_PROJECTS).forEach(k => { byProject[k] = { total: 0, done: 0 }; });
    wsTasks.forEach(t => {
      if (byProject[t.project]) { byProject[t.project].total++; if (t.completed) byProject[t.project].done++; }
      if (byAssignee[t.assignee]) { byAssignee[t.assignee].total++; if (t.completed) byAssignee[t.assignee].done++; }
    });
    return { total, active, done, overdue, byProject, byAssignee };
  }, [wsTasks]);

  // ─── RENDERING ─────────────────────────────────────────────────────────────
  return (<>

          {/* TASK FORM MODAL */}
          {wsTaskModal !== null && (
            <div onClick={() => setWsTaskModal(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div onClick={e => e.stopPropagation()} style={{ width: 480, maxHeight: "90vh", overflowY: "auto", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{wsTaskModal === "new" ? "New Task" : "Edit Task"}</div>
                  <button onClick={() => setWsTaskModal(null)} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Title</div>
                    <input value={wsTaskForm.title} onChange={e => setWsTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title..." style={inputStyle} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Description</div>
                    <textarea value={wsTaskForm.description} onChange={e => setWsTaskForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Assignee</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {Object.entries(WS_TEAM).map(([k, v]) => (
                        <button key={k} onClick={() => setWsTaskForm(f => ({ ...f, assignee: k }))} style={{
                          flex: 1, padding: "8px 12px", borderRadius: 8, cursor: "pointer", transition: "all 0.2s",
                          background: wsTaskForm.assignee === k ? `${v.color}18` : "rgba(255,255,255,0.03)",
                          border: `1px solid ${wsTaskForm.assignee === k ? v.color : BORDER}`,
                          color: wsTaskForm.assignee === k ? v.color : TEXT_DIM, fontWeight: 600, fontSize: 13,
                          fontFamily: "'Satoshi', 'Inter', sans-serif", display: "flex", alignItems: "center", gap: 8,
                        }}>
                          <span style={{ width: 24, height: 24, borderRadius: 12, background: `${v.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontFamily: "JetBrains Mono", fontWeight: 700, color: v.color }}>{v.initials}</span>
                          {v.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Project</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {Object.entries(WS_PROJECTS).map(([k, v]) => (
                        <button key={k} onClick={() => setWsTaskForm(f => ({ ...f, project: k }))} style={{
                          padding: "6px 14px", borderRadius: 6, cursor: "pointer", transition: "all 0.2s",
                          background: wsTaskForm.project === k ? `${v.color}18` : "rgba(255,255,255,0.03)",
                          border: `1px solid ${wsTaskForm.project === k ? v.color : BORDER}`,
                          color: wsTaskForm.project === k ? v.color : TEXT_DIM, fontWeight: 500, fontSize: 12,
                          fontFamily: "'Satoshi', 'Inter', sans-serif", display: "flex", alignItems: "center", gap: 6,
                        }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: v.color }} />
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Priority</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {Object.entries(WS_PRIORITIES).map(([k, v]) => (
                        <button key={k} onClick={() => setWsTaskForm(f => ({ ...f, priority: k }))} style={{
                          flex: 1, padding: "8px 12px", borderRadius: 6, cursor: "pointer", transition: "all 0.2s",
                          background: wsTaskForm.priority === k ? `${v.color}18` : "rgba(255,255,255,0.03)",
                          border: `1px solid ${wsTaskForm.priority === k ? v.color : BORDER}`,
                          color: wsTaskForm.priority === k ? v.color : TEXT_DIM, fontWeight: 600, fontSize: 12,
                          fontFamily: "'Satoshi', 'Inter', sans-serif",
                        }}>{v.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Due Date</div>
                    <input type="date" value={wsTaskForm.dueDate} onChange={e => setWsTaskForm(f => ({ ...f, dueDate: e.target.value }))} style={{ ...inputStyle, colorScheme: "dark" }} />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
                  <button onClick={() => setWsTaskModal(null)} style={{ padding: "10px 20px", borderRadius: 8, cursor: "pointer", background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, color: TEXT_DIM, fontSize: 13, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>Cancel</button>
                  <button onClick={saveTaskForm} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", background: IPS_ACCENT, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>{wsTaskModal === "new" ? "Create Task" : "Save Changes"}</button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TASKS VIEW ═══ */}
          {wsView === "tasks" && (<>
            {/* Telegram Drafts Inbox */}
            {wsDrafts.length > 0 && (
              <Card style={{ marginBottom: 16, border: `1px solid rgba(245,158,11,0.3)`, background: `linear-gradient(90deg, rgba(245,158,11,0.06) 0%, ${SURFACE} 100%)` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: wsDraftsCollapsed ? 0 : 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16 }}>📨</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#F59E0B" }}>{wsDrafts.length} draft{wsDrafts.length !== 1 ? "s" : ""} from Telegram</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={fetchDrafts} style={{ background: "none", border: "none", color: TEXT_DIM, cursor: "pointer", fontSize: 12, padding: "4px 8px", opacity: wsDraftsLoading ? 0.5 : 1 }}>{wsDraftsLoading ? "↻ Loading…" : "↻ Refresh"}</button>
                    <button onClick={() => setWsDraftsCollapsed(c => !c)} style={{ background: "none", border: "none", color: TEXT_DIM, cursor: "pointer", fontSize: 14, padding: "4px 8px" }}>{wsDraftsCollapsed ? "▸" : "▾"}</button>
                  </div>
                </div>
                {!wsDraftsCollapsed && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {wsDrafts.map(draft => (
                      <div key={draft.id} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "10px 14px",
                        border: `1px solid ${BORDER}`,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 3 }}>{draft.text}</div>
                          <div style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>
                            {draft.author} · {new Date(draft.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, marginLeft: 12, flexShrink: 0 }}>
                          <button onClick={() => acceptDraft(draft)} style={{
                            padding: "5px 12px", borderRadius: 6, cursor: "pointer",
                            background: "rgba(34,197,94,0.08)", border: `1px solid rgba(34,197,94,0.2)`,
                            color: "rgba(34,197,94,0.8)", fontSize: 11, fontWeight: 500, fontFamily: "'Satoshi', 'Inter', sans-serif",
                          }}>Accept</button>
                          <button onClick={() => dismissDraft(draft.id)} style={{
                            padding: "5px 12px", borderRadius: 6, cursor: "pointer",
                            background: "transparent", border: `1px solid ${BORDER}`,
                            color: TEXT_DIM, fontSize: 11, fontWeight: 500, fontFamily: "'Satoshi', 'Inter', sans-serif",
                          }}>Dismiss</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Action bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <button onClick={openNewTask} style={{
                padding: "10px 20px", borderRadius: 8, cursor: "pointer",
                background: `linear-gradient(135deg, ${IPS_ACCENT}, #458CA7)`,
                border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
                fontFamily: "'Satoshi', 'Inter', sans-serif", display: "flex", alignItems: "center", gap: 8,
              }}>+ New Task</button>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: 1 }}>Sort:</span>
                {[["dueDate", "Due Date"], ["priority", "Priority"], ["createdAt", "Created"], ["title", "Title"]].map(([k, l]) => (
                  <FilterPill key={k} label={l} active={wsSortBy === k} onClick={() => { if (wsSortBy === k) setWsSortDir(d => d === "asc" ? "desc" : "asc"); else { setWsSortBy(k); setWsSortDir("asc"); } }} />
                ))}
                <button onClick={() => setWsSortDir(d => d === "asc" ? "desc" : "asc")} style={{ background: "none", border: "none", color: TEXT_DIM, cursor: "pointer", fontSize: 14, padding: "4px 6px" }}>{wsSortDir === "asc" ? "↑" : "↓"}</button>
              </div>
            </div>

            {/* Filter bar */}
            <Card style={{ marginBottom: 16, padding: 14 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: 1 }}>Status:</span>
                  {[["all", "All"], ["active", "Active"], ["completed", "Done"]].map(([k, l]) => (
                    <FilterPill key={k} label={l} active={wsFilter.status === k} onClick={() => setWsFilter(f => ({ ...f, status: k }))} />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: 1 }}>Assignee:</span>
                  <FilterPill label="All" active={wsFilter.assignee === "all"} onClick={() => setWsFilter(f => ({ ...f, assignee: "all" }))} />
                  {Object.entries(WS_TEAM).map(([k, v]) => (
                    <FilterPill key={k} label={v.name} active={wsFilter.assignee === k} color={v.color} onClick={() => setWsFilter(f => ({ ...f, assignee: k }))} />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: 1 }}>Project:</span>
                  <FilterPill label="All" active={wsFilter.project === "all"} onClick={() => setWsFilter(f => ({ ...f, project: "all" }))} />
                  {Object.entries(WS_PROJECTS).map(([k, v]) => (
                    <FilterPill key={k} label={v.label} active={wsFilter.project === k} color={v.color} onClick={() => setWsFilter(f => ({ ...f, project: k }))} />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: 1 }}>Priority:</span>
                  <FilterPill label="All" active={wsFilter.priority === "all"} onClick={() => setWsFilter(f => ({ ...f, priority: "all" }))} />
                  {Object.entries(WS_PRIORITIES).map(([k, v]) => (
                    <FilterPill key={k} label={v.label} active={wsFilter.priority === k} color={v.color} onClick={() => setWsFilter(f => ({ ...f, priority: k }))} />
                  ))}
                </div>
              </div>
            </Card>

            {/* Task list */}
            {filteredTasks.length === 0 && (
              <Card style={{ textAlign: "center", padding: 48 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 14, color: TEXT_DIM }}>{wsTasks.length === 0 ? "No tasks yet. Create your first task to get started." : "No tasks match the current filters."}</div>
              </Card>
            )}
            {filteredTasks.map(task => {
              const proj = WS_PROJECTS[task.project] || WS_PROJECTS.general;
              const pri = WS_PRIORITIES[task.priority] || WS_PRIORITIES.medium;
              const assignee = WS_TEAM[task.assignee] || WS_TEAM.jon;
              const isExpanded = wsExpandedTask === task.id;
              const isOverdue = !task.completed && task.dueDate && task.dueDate < new Date().toISOString().split("T")[0];
              return (
                <div key={task.id} style={{ marginBottom: 6 }}>
                  <div style={{
                    display: "grid", gridTemplateColumns: "32px 1fr auto auto auto auto auto",
                    gap: 10, alignItems: "center", padding: "10px 14px",
                    background: task.completed ? "rgba(255,255,255,0.01)" : SURFACE,
                    border: `1px solid ${isOverdue ? "rgba(239,68,68,0.4)" : BORDER}`,
                    borderRadius: isExpanded ? "8px 8px 0 0" : 8,
                    borderLeft: `3px solid ${pri.color}`,
                    opacity: task.completed ? 0.55 : 1, transition: "all 0.2s",
                  }}>
                    {/* Checkbox */}
                    <button onClick={() => toggleComplete(task.id)} style={{
                      width: 24, height: 24, borderRadius: 6, cursor: "pointer",
                      background: task.completed ? `${IPS_SUCCESS}25` : "rgba(255,255,255,0.03)",
                      border: `2px solid ${task.completed ? IPS_SUCCESS : BORDER}`,
                      display: "flex", alignItems: "center", justifyContent: "center", color: IPS_SUCCESS, fontSize: 14,
                    }}>{task.completed ? "✓" : ""}</button>

                    {/* Title + description */}
                    <div onClick={() => setWsExpandedTask(isExpanded ? null : task.id)} style={{ cursor: "pointer", minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, textDecoration: task.completed ? "line-through" : "none", color: task.completed ? TEXT_DIM : TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</div>
                      {task.description && <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.description}</div>}
                    </div>

                    {/* Project tag */}
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: `${proj.color}15`, color: proj.color, fontFamily: "JetBrains Mono", fontWeight: 600, whiteSpace: "nowrap" }}>{proj.label}</span>

                    {/* Assignee */}
                    <span style={{ width: 26, height: 26, borderRadius: 13, background: `${assignee.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontFamily: "JetBrains Mono", fontWeight: 700, color: assignee.color, flexShrink: 0 }}>{assignee.initials}</span>

                    {/* Due date */}
                    <span style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: isOverdue ? IPS_DANGER : task.dueDate ? TEXT_DIM : "transparent", whiteSpace: "nowrap" }}>
                      {task.dueDate ? new Date(task.dueDate + "T12:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—"}
                    </span>

                    {/* Notes count */}
                    <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "JetBrains Mono", textAlign: "center" }}>
                      {(task.notes?.length || 0) > 0 ? `💬${task.notes.length}` : ""}
                    </span>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => openEditTask(task)} style={{ background: "rgba(87,181,200,0.1)", border: `1px solid rgba(87,181,200,0.2)`, borderRadius: 4, padding: "3px 8px", cursor: "pointer", color: IPS_ACCENT, fontSize: 10, fontFamily: "JetBrains Mono" }}>Edit</button>
                      <button onClick={() => deleteTask(task.id)} style={{ background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 4, padding: "3px 8px", cursor: "pointer", color: IPS_DANGER, fontSize: 10, fontFamily: "JetBrains Mono" }}>Del</button>
                    </div>
                  </div>

                  {/* Expanded notes panel */}
                  {isExpanded && (
                    <div style={{ background: "rgba(255,255,255,0.015)", border: `1px solid ${BORDER}`, borderTop: "none", borderRadius: "0 0 8px 8px", padding: 16 }}>
                      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 12 }}>Notes & Comments</div>
                      {(task.notes || []).length === 0 && <div style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 12 }}>No notes yet.</div>}
                      {(task.notes || []).map(note => (
                        <div key={note.id} style={{ marginBottom: 10, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, borderLeft: `3px solid ${(WS_TEAM[note.author] || WS_TEAM.jon).color}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: (WS_TEAM[note.author] || WS_TEAM.jon).color }}>{(WS_TEAM[note.author] || WS_TEAM.jon).name}</span>
                            <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>{new Date(note.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <div style={{ fontSize: 12, color: TEXT, lineHeight: 1.5 }}>{note.text}</div>
                        </div>
                      ))}
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          {Object.entries(WS_TEAM).map(([k, v]) => (
                            <button key={k} onClick={() => setWsNoteAuthor(k)} style={{
                              width: 28, height: 28, borderRadius: 14, cursor: "pointer",
                              background: wsNoteAuthor === k ? `${v.color}30` : "rgba(255,255,255,0.03)",
                              border: `2px solid ${wsNoteAuthor === k ? v.color : BORDER}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 9, fontFamily: "JetBrains Mono", fontWeight: 700, color: v.color,
                            }}>{v.initials}</button>
                          ))}
                        </div>
                        <input value={wsNewNote} onChange={e => setWsNewNote(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addNote(task.id); }} placeholder="Add a note..." style={{ ...inputStyle, flex: 1, padding: "6px 12px" }} />
                        <button onClick={() => addNote(task.id)} style={{ padding: "6px 14px", borderRadius: 6, cursor: "pointer", background: IPS_ACCENT, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>Add</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>)}

          {/* ═══ WORKSPACE CALENDAR ═══ */}
          {wsView === "calendar" && (() => {
            const year = wsCalYear;
            const monthIdx = wsCalMonth;
            const firstDay = new Date(year, monthIdx, 1);
            const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
            const startDow = (firstDay.getDay() + 6) % 7; // Monday=0
            const weeks = [];
            let week = new Array(startDow).fill(null);
            for (let d = 1; d <= daysInMonth; d++) {
              week.push(d);
              if (week.length === 7) { weeks.push(week); week = []; }
            }
            if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }
            const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            const monthName = firstDay.toLocaleDateString("en-GB", { month: "long" });

            // Build task map by date
            const tasksByDate = {};
            wsTasks.forEach(t => {
              if (t.dueDate) {
                if (!tasksByDate[t.dueDate]) tasksByDate[t.dueDate] = [];
                tasksByDate[t.dueDate].push(t);
              }
            });

            const prevMonth = () => {
              if (wsCalMonth === 0) { setWsCalMonth(11); setWsCalYear(y => y - 1); }
              else setWsCalMonth(m => m - 1);
            };
            const nextMonth = () => {
              if (wsCalMonth === 11) { setWsCalMonth(0); setWsCalYear(y => y + 1); }
              else setWsCalMonth(m => m + 1);
            };

            return (
              <>
                <Card style={{ marginBottom: 16, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button onClick={prevMonth} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 14px", cursor: "pointer", color: TEXT_DIM, fontSize: 16, fontFamily: "JetBrains Mono" }}>◀</button>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{monthName} {year}</div>
                    <button onClick={nextMonth} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 14px", cursor: "pointer", color: TEXT_DIM, fontSize: 16, fontFamily: "JetBrains Mono" }}>▶</button>
                  </div>
                </Card>
                <Card style={{ padding: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                    {dayLabels.map(d => (
                      <div key={d} style={{ textAlign: "center", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", padding: "6px 0" }}>{d}</div>
                    ))}
                  </div>
                  {weeks.map((wk, wi) => (
                    <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                      {wk.map((day, di) => {
                        if (day === null) return <div key={di} style={{ minHeight: 90 }} />;
                        const dateStr = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const dayTasks = tasksByDate[dateStr] || [];
                        const today = new Date().toISOString().split("T")[0];
                        const isToday = dateStr === today;
                        const isWeekend = di >= 5;
                        return (
                          <div key={di} style={{
                            minHeight: 90, borderRadius: 8, padding: 6, position: "relative",
                            background: isToday ? "rgba(87,181,200,0.06)" : dayTasks.length >= 3 ? "rgba(245,158,11,0.04)" : isWeekend ? "rgba(255,255,255,0.008)" : "rgba(255,255,255,0.015)",
                            border: `1px solid ${isToday ? IPS_ACCENT + "50" : BORDER}`,
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <span style={{
                                fontFamily: "JetBrains Mono", fontSize: 12, fontWeight: 700,
                                color: isToday ? IPS_ACCENT : dayTasks.length > 0 ? TEXT : TEXT_DIM,
                                width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                                borderRadius: 5, background: isToday ? "rgba(87,181,200,0.15)" : "transparent",
                              }}>{day}</span>
                              {dayTasks.length > 0 && (
                                <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 600, color: dayTasks.length >= 3 ? IPS_WARN : TEXT_DIM, background: dayTasks.length >= 3 ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.05)", padding: "1px 5px", borderRadius: 3 }}>{dayTasks.length}</span>
                              )}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              {dayTasks.slice(0, 4).map(t => {
                                const p = WS_PROJECTS[t.project] || WS_PROJECTS.general;
                                const a = WS_TEAM[t.assignee] || WS_TEAM.jon;
                                return (
                                  <div key={t.id} onClick={() => openEditTask(t)} style={{
                                    display: "flex", alignItems: "center", gap: 3, cursor: "pointer",
                                    background: t.completed ? "rgba(255,255,255,0.02)" : `${p.color}0D`,
                                    border: `1px solid ${p.color}25`, borderRadius: 4, padding: "2px 5px",
                                    borderLeft: `3px solid ${p.color}`, opacity: t.completed ? 0.5 : 1,
                                  }}>
                                    <span style={{ width: 14, height: 14, borderRadius: 7, background: `${a.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontFamily: "JetBrains Mono", fontWeight: 700, color: a.color, flexShrink: 0 }}>{a.initials}</span>
                                    <span style={{ fontSize: 9, color: t.completed ? TEXT_DIM : TEXT, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, textDecoration: t.completed ? "line-through" : "none" }}>{t.title}</span>
                                  </div>
                                );
                              })}
                              {dayTasks.length > 4 && <div style={{ fontSize: 9, color: TEXT_DIM, textAlign: "center" }}>+{dayTasks.length - 4} more</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </Card>
              </>
            );
          })()}

          {/* ═══ JOBS VIEW ═══ */}
          {wsView === "jobs" && (() => {
            const filtered = jobs
              .filter(j => jobFilter === "all" ? true : j.status === jobFilter)
              .sort((a, b) => (a.call_date || "").localeCompare(b.call_date || ""));
            const counts = jobs.reduce((acc, j) => { acc[j.status] = (acc[j.status] || 0) + 1; return acc; }, {});
            return (
              <>
                {/* Action bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <FilterPill label={`All (${jobs.length})`} active={jobFilter === "all"} onClick={() => setJobFilter("all")} />
                    {Object.entries(JOB_STATUSES).map(([k, v]) => (
                      <FilterPill key={k} label={`${v.label} (${counts[k] || 0})`} active={jobFilter === k} onClick={() => setJobFilter(k)} color={v.color} />
                    ))}
                  </div>
                  <button onClick={openNewJob} style={{
                    padding: "10px 20px", borderRadius: 8, cursor: "pointer",
                    background: `linear-gradient(135deg, ${IPS_ACCENT}, #458CA7)`,
                    border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
                    fontFamily: "'Satoshi', 'Inter', sans-serif",
                  }}>+ New Job</button>
                </div>

                {/* Job rows */}
                {filtered.length === 0 ? (
                  <Card style={{ textAlign: "center", padding: 40 }}>
                    <div style={{ fontSize: 14, color: TEXT_DIM }}>
                      {jobs.length === 0
                        ? "No jobs yet. Click “+ New Job” to log a request."
                        : `No ${jobFilter} jobs.`}
                    </div>
                  </Card>
                ) : (
                  <Card>
                    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 1fr 70px 90px 110px 180px", gap: 10, padding: "8px 12px", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: TEXT_DIM, fontFamily: "JetBrains Mono", borderBottom: `1px solid ${BORDER}` }}>
                      <span>Date</span><span>Ship</span><span>Cruise Line</span><span style={{ textAlign: "right" }}>Pax</span><span style={{ textAlign: "center" }}>Type</span><span style={{ textAlign: "center" }}>Status</span><span style={{ textAlign: "right" }}>Action</span>
                    </div>
                    {filtered.map((j, i) => {
                      const cl = jobCruiseLines.find(c => c.id === j.cruise_line_id);
                      const status = JOB_STATUSES[j.status] || { label: j.status, color: TEXT_DIM };
                      const resources = Array.isArray(j.requested_resources) ? j.requested_resources : [];
                      const isExpanded = expandedJobId === j.id;
                      const summary = resources.length === 0
                        ? "—"
                        : resources.map(r => {
                            const def = RESOURCE_CATALOG[r.item_code];
                            const label = def?.label || r.item_code || "?";
                            const qty = Number(r.quantity) || 1;
                            return `${qty}× ${label}`;
                          }).join(", ");
                      return (
                        <div key={j.id} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", borderRadius: 4 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 1fr 70px 90px 110px 180px", gap: 10, padding: "10px 12px", fontSize: 13, alignItems: "center" }}>
                            <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: TEXT_DIM }}>{j.call_date}</span>
                            <span style={{ fontWeight: 500 }}>{j.ship_name}</span>
                            <span style={{ color: TEXT_DIM }}>{cl?.name || "—"}</span>
                            <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{j.planned_pax?.toLocaleString() || "—"}</span>
                            <span style={{ textAlign: "center" }}>
                              {j.turnaround
                                ? <span style={{ background: "rgba(245,158,11,0.15)", color: IPS_WARN, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontFamily: "JetBrains Mono", fontWeight: 600 }}>(T)</span>
                                : <span style={{ color: TEXT_DIM, fontSize: 11 }}>Transit</span>}
                            </span>
                            <span style={{ textAlign: "center" }}>
                              <span style={{ background: `${status.color}22`, color: status.color, padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>{status.label}</span>
                            </span>
                            <span style={{ display: "flex", justifyContent: "flex-end", gap: 6, alignItems: "center" }}>
                              {j.status !== "invoiced" && (
                                <button onClick={() => openEditJob(j)} title="Edit job" style={{ padding: "5px 9px", borderRadius: 6, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, color: TEXT_DIM, fontSize: 11, lineHeight: 1, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>✎</button>
                              )}
                              {j.status === "pending" && (
                                <button onClick={() => advanceJobStatus(j.id, "confirmed")} style={{ padding: "5px 12px", borderRadius: 6, cursor: "pointer", background: "rgba(87,181,200,0.1)", border: `1px solid rgba(87,181,200,0.3)`, color: IPS_ACCENT, fontSize: 11, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>Confirm</button>
                              )}
                              {j.status === "confirmed" && (
                                <button onClick={() => openCompleteModal(j)} style={{ padding: "5px 12px", borderRadius: 6, cursor: "pointer", background: "rgba(34,197,94,0.1)", border: `1px solid rgba(34,197,94,0.3)`, color: IPS_SUCCESS, fontSize: 11, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>Mark Done</button>
                              )}
                              {j.status === "completed" && accessLevel === "ceo" && (
                                <button onClick={() => openInvoiceModal(j)} style={{ padding: "5px 12px", borderRadius: 6, cursor: "pointer", background: `linear-gradient(135deg, ${IPS_ACCENT}, #458CA7)`, border: "none", color: "#fff", fontSize: 11, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>Invoice</button>
                              )}
                              {j.status === "completed" && accessLevel !== "ceo" && (
                                <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>awaiting CEO</span>
                              )}
                              {j.status === "invoiced" && (
                                <span style={{ fontSize: 10, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>sent to Payday</span>
                              )}
                            </span>
                          </div>
                          {/* Resource summary line — clickable to expand */}
                          <div
                            onClick={() => resources.length > 0 && setExpandedJobId(prev => prev === j.id ? null : j.id)}
                            style={{ padding: "0 12px 10px", fontSize: 11, color: TEXT_DIM, fontFamily: "JetBrains Mono", cursor: resources.length > 0 ? "pointer" : "default", display: "flex", gap: 6, alignItems: "center" }}
                          >
                            <span>Resources:</span>
                            <span style={{ color: resources.length > 0 ? TEXT : TEXT_DIM }}>{summary}</span>
                            {resources.length > 0 && <span style={{ color: TEXT_DIM, fontSize: 10 }}>{isExpanded ? "▾" : "▸"}</span>}
                          </div>
                          {/* Expanded detail table */}
                          {isExpanded && resources.length > 0 && (
                            <div style={{ margin: "0 12px 12px", padding: 10, background: "rgba(0,0,0,0.15)", borderRadius: 6, border: `1px solid ${BORDER}` }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 70px 70px 70px 1fr", gap: 8, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: TEXT_DIM, fontFamily: "JetBrains Mono", paddingBottom: 6, borderBottom: `1px solid ${BORDER}` }}>
                                <span>Resource</span><span style={{ textAlign: "center" }}>Qty</span><span>Start</span><span>End</span><span style={{ textAlign: "right" }}>Hours</span><span>Notes</span>
                              </div>
                              {resources.map((r, ri) => {
                                const def = RESOURCE_CATALOG[r.item_code];
                                return (
                                  <div key={ri} style={{ display: "grid", gridTemplateColumns: "1fr 50px 70px 70px 70px 1fr", gap: 8, padding: "6px 0", fontSize: 12 }}>
                                    <span>{def?.label || r.item_code}</span>
                                    <span style={{ textAlign: "center", fontFamily: "JetBrains Mono" }}>{r.quantity || 1}</span>
                                    <span style={{ fontFamily: "JetBrains Mono", color: TEXT_DIM }}>{r.start_time || "—"}</span>
                                    <span style={{ fontFamily: "JetBrains Mono", color: TEXT_DIM }}>{r.end_time || "—"}</span>
                                    <span style={{ textAlign: "right", fontFamily: "JetBrains Mono" }}>{r.duration_hours != null ? r.duration_hours : "—"}</span>
                                    <span style={{ color: TEXT_DIM }}>{r.notes || ""}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </Card>
                )}
              </>
            );
          })()}

          {/* ═══ JOB MODALS ═══ */}
          {jobModal && (
            <div onClick={() => setJobModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div onClick={e => e.stopPropagation()} style={{ width: 640, maxHeight: "90vh", overflowY: "auto", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{jobModal === "new" ? "New Job" : "Edit Job"}</div>
                  <button onClick={() => setJobModal(null)} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
                </div>

                {/* Source toggle */}
                <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                  {[{ k: true, l: "From Schedule" }, { k: false, l: "Ad-hoc" }].map(opt => (
                    <button key={String(opt.k)} onClick={() => setJobFromSchedule(opt.k)} style={{
                      flex: 1, padding: "8px 12px", borderRadius: 8, cursor: "pointer", transition: "all 0.2s",
                      background: jobFromSchedule === opt.k ? `${IPS_ACCENT}18` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${jobFromSchedule === opt.k ? IPS_ACCENT : BORDER}`,
                      color: jobFromSchedule === opt.k ? IPS_ACCENT : TEXT_DIM,
                      fontWeight: 600, fontSize: 13, fontFamily: "'Satoshi', 'Inter', sans-serif",
                    }}>{opt.l}</button>
                  ))}
                </div>

                {jobFromSchedule ? (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Pick port call</div>
                    <input value={jobScheduleSearch} onChange={e => setJobScheduleSearch(e.target.value)} placeholder="Search by ship, line, or date..." style={{ ...inputStyle, marginBottom: 8 }} />
                    <div style={{ maxHeight: 200, overflowY: "auto", border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                      {portCalls
                        .filter(s => {
                          const q = jobScheduleSearch.trim().toLowerCase();
                          if (!q) return true;
                          return (s.ship || "").toLowerCase().includes(q) || (s.line || "").toLowerCase().includes(q) || (s.date || "").includes(q);
                        })
                        .slice(0, 100)
                        .map((s, idx) => {
                          const selected = jobForm.call_date === s.date && jobForm.ship_name === s.ship;
                          return (
                            <button key={idx} onClick={() => pickPortCall(s)} style={{
                              display: "grid", gridTemplateColumns: "100px 1fr 1fr 60px", gap: 8, padding: "8px 12px", width: "100%",
                              background: selected ? `${IPS_ACCENT}18` : "transparent",
                              border: "none", borderBottom: `1px solid ${BORDER}`, color: TEXT,
                              fontSize: 12, cursor: "pointer", textAlign: "left", fontFamily: "'Satoshi', 'Inter', sans-serif",
                            }}>
                              <span style={{ fontFamily: "JetBrains Mono", color: TEXT_DIM }}>{s.date}</span>
                              <span style={{ fontWeight: 500 }}>{s.ship}</span>
                              <span style={{ color: TEXT_DIM }}>{s.line}</span>
                              <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 11 }}>{s.pax?.toLocaleString()}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div style={{ gridColumn: "1 / 3" }}>
                      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Cruise Line</div>
                      <select value={jobForm.cruise_line_id} onChange={e => setJobForm(f => ({ ...f, cruise_line_id: e.target.value }))} style={{ ...inputStyle, colorScheme: "dark" }}>
                        <option value="">— select —</option>
                        {jobCruiseLines.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Ship Name</div>
                      <input value={jobForm.ship_name} onChange={e => setJobForm(f => ({ ...f, ship_name: e.target.value }))} placeholder="e.g. Norwegian Star" style={inputStyle} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Planned Pax</div>
                      <input type="number" value={jobForm.planned_pax} onChange={e => setJobForm(f => ({ ...f, planned_pax: e.target.value }))} placeholder="0" style={inputStyle} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Call Date</div>
                      <input type="date" value={jobForm.call_date} onChange={e => setJobForm(f => ({ ...f, call_date: e.target.value }))} style={{ ...inputStyle, colorScheme: "dark" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>End Date (optional)</div>
                      <input type="date" value={jobForm.end_date} onChange={e => setJobForm(f => ({ ...f, end_date: e.target.value }))} style={{ ...inputStyle, colorScheme: "dark" }} />
                    </div>
                    <label style={{ gridColumn: "1 / 3", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: TEXT_DIM, cursor: "pointer" }}>
                      <input type="checkbox" checked={jobForm.turnaround} onChange={e => setJobForm(f => ({ ...f, turnaround: e.target.checked }))} />
                      Turnaround call
                    </label>
                  </div>
                )}

                {/* Common: cruise line readout (from schedule), contract, notes */}
                {jobFromSchedule && jobForm.call_date && (
                  <div style={{ marginBottom: 16, padding: 12, background: "rgba(255,255,255,0.02)", borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 12 }}>
                    <div style={{ color: TEXT_DIM, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "JetBrains Mono", marginBottom: 4 }}>Selected</div>
                    <div><strong>{jobForm.ship_name}</strong> · {jobForm.call_date}{jobForm.end_date ? ` → ${jobForm.end_date}` : ""} · {jobForm.planned_pax || "?"} pax {jobForm.turnaround ? " · Turnaround" : ""}</div>
                    {!jobForm.cruise_line_id && (
                      <div style={{ color: IPS_WARN, fontSize: 11, marginTop: 6 }}>
                        ⚠ Cruise line could not be auto-matched — pick one below.
                      </div>
                    )}
                  </div>
                )}
                {jobFromSchedule && !jobForm.cruise_line_id && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Cruise Line</div>
                    <select value={jobForm.cruise_line_id} onChange={e => setJobForm(f => ({ ...f, cruise_line_id: e.target.value }))} style={{ ...inputStyle, colorScheme: "dark" }}>
                      <option value="">— select —</option>
                      {jobCruiseLines.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Contract</div>
                  <select value={jobForm.contract_id} onChange={e => setJobForm(f => ({ ...f, contract_id: e.target.value }))} style={{ ...inputStyle, colorScheme: "dark" }} disabled={!jobForm.cruise_line_id}>
                    <option value="">{jobForm.cruise_line_id ? "— select contract —" : "— pick a cruise line first —"}</option>
                    {jobContracts
                      .filter(c => c.cruise_line_id === jobForm.cruise_line_id)
                      .map(c => (<option key={c.id} value={c.id}>{c.season} · {c.status} · {c.start_date} → {c.end_date}</option>))}
                  </select>
                  {jobForm.cruise_line_id && jobContracts.filter(c => c.cruise_line_id === jobForm.cruise_line_id).length === 0 && (
                    <div style={{ color: TEXT_DIM, fontSize: 11, marginTop: 6 }}>No contracts for this cruise line — you can save the job without one and attach it before invoicing.</div>
                  )}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Notes</div>
                  <textarea value={jobForm.notes} onChange={e => setJobForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Optional context..." style={{ ...inputStyle, resize: "vertical" }} />
                </div>

                {/* Shared time-slot datalist for all resource time inputs */}
                <datalist id="hhmm-15min">
                  {TIME_SLOTS_15.map(t => <option key={t} value={t} />)}
                </datalist>

                {/* ─── Requested Resources ─────────────────────────────────────── */}
                <div style={{ marginBottom: 16, padding: 14, background: "rgba(87,181,200,0.04)", borderRadius: 10, border: `1px solid ${BORDER}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: IPS_ACCENT, fontFamily: "JetBrains Mono", fontWeight: 600 }}>Requested Resources</div>
                      <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>What resources does this job need, and when?</div>
                    </div>
                  </div>

                  {(jobForm.requested_resources || []).length === 0 && (
                    <div style={{ fontSize: 11, color: TEXT_DIM, fontStyle: "italic", padding: "10px 0" }}>No resources yet. Click "+ Add resource" to start.</div>
                  )}

                  {(jobForm.requested_resources || []).map((line, idx) => {
                    const def = RESOURCE_CATALOG[line.item_code];
                    const isFullDay = def?.default_unit === "full_day";
                    return (
                      <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 60px 90px 90px 80px 30px", gap: 6, marginBottom: 8, alignItems: "center" }}>
                        <select
                          value={line.item_code}
                          onChange={e => updateResourceLine(idx, "item_code", e.target.value)}
                          style={{ ...inputStyle, padding: "8px 10px", colorScheme: "dark" }}
                        >
                          <option value="">— pick resource —</option>
                          {Object.entries(RESOURCE_CATEGORIES).map(([catKey, cat]) => (
                            <optgroup key={catKey} label={cat.label}>
                              {Object.entries(RESOURCE_CATALOG)
                                .filter(([, r]) => r.category === catKey)
                                .map(([code, r]) => (
                                  <option key={code} value={code}>{r.label}{r.default_unit === "full_day" ? " (full day)" : ""}</option>
                                ))}
                            </optgroup>
                          ))}
                        </select>
                        <input
                          type="number" min="1" step="1"
                          value={line.quantity}
                          onChange={e => updateResourceLine(idx, "quantity", e.target.value)}
                          title="Quantity"
                          style={{ ...inputStyle, padding: "8px 10px", textAlign: "center" }}
                        />
                        <input
                          type="text"
                          list="hhmm-15min"
                          value={line.start_time || ""}
                          onChange={e => updateResourceLine(idx, "start_time", e.target.value)}
                          onBlur={e => {
                            const normalized = normalizeHhmm(e.target.value);
                            if (normalized !== line.start_time) updateResourceLine(idx, "start_time", normalized);
                          }}
                          placeholder="HH:MM"
                          title="Start time — pick from list or type any time"
                          style={{ ...inputStyle, padding: "8px 10px", opacity: isFullDay ? 0.6 : 1 }}
                        />
                        <input
                          type="text"
                          list="hhmm-15min"
                          value={line.end_time || ""}
                          onChange={e => updateResourceLine(idx, "end_time", e.target.value)}
                          onBlur={e => {
                            const normalized = normalizeHhmm(e.target.value);
                            if (normalized !== line.end_time) updateResourceLine(idx, "end_time", normalized);
                          }}
                          placeholder="HH:MM"
                          title="End time — pick from list or type any time"
                          style={{ ...inputStyle, padding: "8px 10px", opacity: isFullDay ? 0.6 : 1 }}
                        />
                        <input
                          type="number" min="0" step="0.25"
                          value={line.duration_hours ?? ""}
                          onChange={e => updateResourceLine(idx, "duration_hours", e.target.value)}
                          placeholder="hrs"
                          title="Duration (hours)"
                          style={{ ...inputStyle, padding: "8px 10px", textAlign: "right", opacity: isFullDay ? 0.6 : 1 }}
                        />
                        <button
                          onClick={() => removeResourceLine(idx)}
                          title="Remove"
                          style={{ background: "rgba(239,68,68,0.08)", border: `1px solid rgba(239,68,68,0.2)`, color: IPS_DANGER, borderRadius: 6, padding: "8px 0", cursor: "pointer", fontSize: 14, lineHeight: 1 }}
                        >×</button>
                      </div>
                    );
                  })}

                  {/* Tiny header row above lines, only when there are lines */}
                  {(jobForm.requested_resources || []).length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 90px 90px 80px 30px", gap: 6, marginBottom: 4, fontSize: 9, textTransform: "uppercase", letterSpacing: 1.2, color: TEXT_DIM, fontFamily: "JetBrains Mono", order: -1 }}>
                      <span>Resource</span><span style={{ textAlign: "center" }}>Qty</span><span>Start</span><span>End</span><span style={{ textAlign: "right" }}>Hours</span><span></span>
                    </div>
                  )}

                  <button
                    onClick={addResourceLine}
                    style={{ marginTop: 8, padding: "7px 14px", borderRadius: 6, cursor: "pointer", background: "rgba(87,181,200,0.1)", border: `1px solid rgba(87,181,200,0.3)`, color: IPS_ACCENT, fontSize: 12, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', sans-serif" }}
                  >+ Add resource</button>
                </div>

                {jobError && <div style={{ color: IPS_DANGER, fontSize: 12, marginBottom: 12 }}>{jobError}</div>}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button onClick={() => setJobModal(null)} style={{ padding: "10px 20px", borderRadius: 8, cursor: "pointer", background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, color: TEXT_DIM, fontSize: 13, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>Cancel</button>
                  <button onClick={saveJobForm} disabled={jobSaving} style={{ padding: "10px 24px", borderRadius: 8, cursor: jobSaving ? "wait" : "pointer", background: IPS_ACCENT, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', sans-serif", opacity: jobSaving ? 0.6 : 1 }}>{jobSaving ? "Saving..." : (jobModal === "new" ? "Create Job" : "Save Changes")}</button>
                </div>
              </div>
            </div>
          )}

          {/* Mark Done modal */}
          {completeJob && (
            <div onClick={() => setCompleteJob(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div onClick={e => e.stopPropagation()} style={{ width: 420, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Mark Job Complete</div>
                  <button onClick={() => setCompleteJob(null)} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
                </div>
                <div style={{ marginBottom: 16, padding: 12, background: "rgba(255,255,255,0.02)", borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 12 }}>
                  <strong>{completeJob.ship_name}</strong> · {completeJob.call_date} · {completeJob.planned_pax || "?"} pax
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Actual Hours Worked</div>
                  <input type="number" step="0.25" min="0" value={completeHours} onChange={e => setCompleteHours(e.target.value)} placeholder="e.g. 6.5" autoFocus style={inputStyle} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Notes (optional)</div>
                  <textarea value={completeNotes} onChange={e => setCompleteNotes(e.target.value)} rows={2} placeholder="What happened on the day..." style={{ ...inputStyle, resize: "vertical" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button onClick={() => setCompleteJob(null)} style={{ padding: "10px 20px", borderRadius: 8, cursor: "pointer", background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, color: TEXT_DIM, fontSize: 13, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>Cancel</button>
                  <button onClick={saveCompleteJob} disabled={completeSaving || !completeHours} style={{ padding: "10px 24px", borderRadius: 8, cursor: completeSaving ? "wait" : "pointer", background: IPS_SUCCESS, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', sans-serif", opacity: (completeSaving || !completeHours) ? 0.6 : 1 }}>{completeSaving ? "Saving..." : "Mark Complete"}</button>
                </div>
              </div>
            </div>
          )}

          {/* Invoice preview modal */}
          {invoiceJob && (
            <div onClick={() => { if (!invoiceSending) { setInvoiceJob(null); setInvoiceLines([]); setInvoiceContext(null); } }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div onClick={e => e.stopPropagation()} style={{ width: 640, maxHeight: "90vh", overflowY: "auto", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Generate Invoice</div>
                  <button onClick={() => { setInvoiceJob(null); setInvoiceLines([]); setInvoiceContext(null); }} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
                </div>
                <div style={{ marginBottom: 14, padding: 12, background: "rgba(255,255,255,0.02)", borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 12 }}>
                  <strong>{invoiceJob.ship_name}</strong> · {invoiceJob.call_date} · {invoiceJob.planned_pax || "?"} pax · {invoiceJob.confirmed_hours ?? "?"} hrs confirmed
                  {invoiceContext?.cruiseLine && <div style={{ color: TEXT_DIM, marginTop: 4 }}>Customer: {invoiceContext.cruiseLine.name}{invoiceContext.cruiseLine.payday_customer_id ? "" : " (not yet mapped to Payday)"}</div>}
                </div>

                {invoiceError && <div style={{ color: IPS_DANGER, fontSize: 12, marginBottom: 12, padding: 10, background: "rgba(239,68,68,0.08)", borderRadius: 6, border: `1px solid rgba(239,68,68,0.3)` }}>{invoiceError}</div>}

                {invoiceLines.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 8 }}>Line Items</div>
                    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 100px 110px", gap: 10, padding: "8px 12px", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: TEXT_DIM, fontFamily: "JetBrains Mono", borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)" }}>
                        <span>Description</span><span style={{ textAlign: "right" }}>Qty</span><span style={{ textAlign: "right" }}>Unit Price</span><span style={{ textAlign: "right" }}>Line Total</span>
                      </div>
                      {invoiceLines.map((line, idx) => (
                        <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 70px 100px 110px", gap: 10, padding: "9px 12px", fontSize: 12, borderBottom: idx < invoiceLines.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                          <span>{line.description}</span>
                          <span style={{ textAlign: "right", fontFamily: "JetBrains Mono" }}>{line.quantity}</span>
                          <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", color: TEXT_DIM }}>{fmtISK(line.unit_price_isk)}</span>
                          <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{fmtISK(line.line_total_isk)}</span>
                        </div>
                      ))}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 10, padding: "10px 12px", background: "rgba(87,181,200,0.06)", borderTop: `1px solid ${BORDER}` }}>
                        <span style={{ fontSize: 12, fontWeight: 600, textAlign: "right" }}>Total</span>
                        <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", fontWeight: 700, color: IPS_ACCENT, fontSize: 14 }}>{fmtISK(invoiceLines.reduce((s, l) => s + (l.line_total_isk || 0), 0))}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button onClick={() => { setInvoiceJob(null); setInvoiceLines([]); setInvoiceContext(null); }} disabled={invoiceSending} style={{ padding: "10px 20px", borderRadius: 8, cursor: invoiceSending ? "wait" : "pointer", background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, color: TEXT_DIM, fontSize: 13, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>Cancel</button>
                  <button onClick={sendInvoice} disabled={invoiceSending || invoiceLines.length === 0 || !invoiceContext?.cruiseLine?.payday_customer_id} style={{ padding: "10px 24px", borderRadius: 8, cursor: invoiceSending ? "wait" : "pointer", background: `linear-gradient(135deg, ${IPS_ACCENT}, #458CA7)`, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', sans-serif", opacity: (invoiceSending || invoiceLines.length === 0 || !invoiceContext?.cruiseLine?.payday_customer_id) ? 0.6 : 1 }}>{invoiceSending ? "Sending..." : "Send to Payday"}</button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ WORKSPACE DASHBOARD ═══ */}
          {wsView === "dashboard" && (<>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { l: "Total Tasks", v: wsStats.total, c: TEXT },
                { l: "Active", v: wsStats.active, c: IPS_ACCENT },
                { l: "Completed", v: wsStats.done, c: IPS_SUCCESS },
                { l: "Overdue", v: wsStats.overdue, c: IPS_DANGER },
              ].map((x, i) => (
                <Card key={i}><div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 4 }}>{x.l}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: x.c, fontFamily: "JetBrains Mono", lineHeight: 1.1 }}>{x.v}</div>
                </div></Card>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 20 }}>
              {/* Tasks by Project */}
              <Card>
                <SL>Tasks by Project</SL>
                {Object.entries(WS_PROJECTS).map(([k, v]) => {
                  const d = wsStats.byProject[k] || { total: 0, done: 0 };
                  const pct = d.total > 0 ? (d.done / d.total * 100) : 0;
                  return (
                    <div key={k} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: v.color }} />
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{v.label}</span>
                        </div>
                        <span style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: TEXT_DIM }}>{d.done}/{d.total}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)" }}>
                        <div style={{ height: "100%", borderRadius: 3, background: v.color, width: `${pct}%`, transition: "width 0.3s" }} />
                      </div>
                    </div>
                  );
                })}
              </Card>

              {/* Tasks by Assignee */}
              <Card>
                <SL>Tasks by Assignee</SL>
                {Object.entries(WS_TEAM).map(([k, v]) => {
                  const d = wsStats.byAssignee[k] || { total: 0, done: 0 };
                  const pct = d.total > 0 ? (d.done / d.total * 100) : 0;
                  return (
                    <div key={k} style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 32, height: 32, borderRadius: 16, background: `${v.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: "JetBrains Mono", fontWeight: 700, color: v.color }}>{v.initials}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{v.name}</div>
                            <div style={{ fontSize: 10, color: TEXT_DIM }}>{d.done} done · {d.total - d.done} remaining</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "JetBrains Mono", color: v.color }}>{d.total}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)" }}>
                        <div style={{ height: "100%", borderRadius: 3, background: v.color, width: `${pct}%`, transition: "width 0.3s" }} />
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>

            {wsTasks.length === 0 && (
              <Card style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 14, color: TEXT_DIM }}>Create some tasks to see your dashboard stats here.</div>
              </Card>
            )}
          </>)}

  </>);
}
