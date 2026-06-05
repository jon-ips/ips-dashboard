import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase, SUPABASE_URL, SUPABASE_CONFIGURED, supabaseHeaders } from "./supabase.js";
import {
  SHIPS, IPS_ACCENT, IPS_WARN, IPS_DANGER, IPS_SUCCESS, IPS_BLUE,
  SURFACE, BORDER, TEXT, TEXT_DIM,
  WS_TEAM, WS_PROJECTS, WS_PRIORITIES, generateId,
  JOB_TYPES, JOB_EQUIPMENT_BY_TYPE, PORTS,
  SDK_LINES, DIRECT_CONTRACT_LINES,
} from "./constants.js";
import { Card, SL, FilterPill, inputStyle, fmtDate } from "./shared.jsx";
import generateInvoice from "./generateInvoice.js";
import generateBindingarInvoice, { MONTH_NAMES as BINDINGAR_MONTH_NAMES } from "./generateBindingarInvoice.js";
import { RATE_SHEETS, resolveRateSheet } from "./rates.js";
import { extractShipName, getCruiseLineForShip, getBerthForShip } from "./constants.js";
import { computeAutoPONumber } from "./sdkCallNumbers.js";
import { createDraftInvoice, buildDraftInvoicePayload } from "./paydayInvoice.js";
import { findLastVikingMarsDate } from "./vatRules.js";

export default function Workspace({ wsView, activeModule, onDraftCountChange }) {
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

  // ─── JOBS STATE ─────────────────────────────────────────────────────────────
  const [jobs, setJobs] = useState([]);
  const [jobsLoaded, setJobsLoaded] = useState(false);
  const [jobModal, setJobModal] = useState(null); // null | "new" | jobId
  const emptyEquip = (type) => Object.fromEntries(Object.keys(JOB_EQUIPMENT_BY_TYPE[type] || {}).map(k => [k, 0]));
  const emptyShift = (type) => ({ startTime: "", nextDay: false, equipment: emptyEquip(type) });
  const defaultJobForm = { port: "REY", type: "provisions", date: "", ship: "", po_number: "", notes: "", shifts: [emptyShift("provisions")] };
  const [jobForm, setJobForm] = useState(defaultJobForm);
  const [timePickerOpen, setTimePickerOpen] = useState(-1); // -1 closed, or shift index
  const [completeModal, setCompleteModal] = useState(null); // null or job object
  const [completeHours, setCompleteHours] = useState([]); // [{ startTime, equipment: { key: [{ qty, hours }] } }]
  const [completeAllHours, setCompleteAllHours] = useState("");
  const [deletedJobs, setDeletedJobs] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [jobSyncError, setJobSyncError] = useState(null);
  const [rateSheetPicker, setRateSheetPicker] = useState(null); // job awaiting rate-sheet choice
  // PO auto-fill: enabled by default for new jobs, disabled once the user
  // edits the field (or for edits, where we never overwrite). Re-enables if
  // the user clears the field, so they can fall back to the computed value.
  const [poAutoFilled, setPoAutoFilled] = useState(true);
  // Selected month for the Bindingar monthly invoice generator (YYYY-MM).
  // Defaults to the current calendar month.
  const [bindingarMonth, setBindingarMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  // Collapsable sections in the Jobs view.
  const [jobsCollapsed, setJobsCollapsed] = useState(false);
  const [bindingarCollapsed, setBindingarCollapsed] = useState(false);
  // cruise_lines cache (id, name, payday_customer_id, payment_terms_days)
  // used to map job → Payday customer and pre-fill payment terms. Empty
  // until DB load completes; the Payday submitter surfaces a clear error
  // if the resolved cruise line has no payday_customer_id.
  const [cruiseLines, setCruiseLines] = useState([]);
  // Per-job invoice flow feedback: { jobId, status: "working"|"success"|"error", msg }
  const [invoiceStatus, setInvoiceStatus] = useState(null);
  // Preview-modal state. Holds everything we need to render the preview AND
  // submit when the user confirms — so we don't recompute rows / payload
  // between Preview and Confirm. Shape:
  //   { job, rateSheetKey, rows, total, cruiseLine, payload,
  //     submitting: bool, error: string|null }
  const [invoicePreview, setInvoicePreview] = useState(null);

  // Pre-compute Viking Mars's final 2026 call date. Used by vatRules to grant
  // 0% VAT to that one call (voyage ends in a foreign port).
  const lastVikingMarsDate = useMemo(() => findLastVikingMarsDate(SHIPS), []);

  // ─── INVOICE FLOW ────────────────────────────────────────────────────────
  // Two stages, because Payday's public API only creates *finalized*
  // invoices (no API-side draft state). We make the human review happen
  // in the dashboard before any data hits Payday's books.
  //
  //   Stage 1 — openPreview(job, rateSheetKey):
  //     Compute rows + total + resolved cruise line + exact Payday payload.
  //     No PDF download yet, no API call. Renders the preview modal.
  //
  //   Stage 2 — confirmInvoice() (modal's Confirm button):
  //     Download the PDF, then POST to Payday. Modal dismisses on success
  //     and shows the success banner under the row. On error the modal
  //     stays open with an error pinned inside, so the user can retry or
  //     cancel cleanly.
  const openPreview = useCallback(async (job, rateSheetKey) => {
    setInvoiceStatus({ jobId: job.id, status: "working", msg: "Preparing preview…" });
    const result = await generateInvoice(job, rateSheetKey, { skipDownload: true });
    if (!result) { setInvoiceStatus(null); return; }

    // Resolve cruise line via the colleague's SHIPS-derived lookup. Akureyri
    // is intentionally not special-cased here — getCruiseLineForShip resolves
    // the named SDK line (TUI, Aida, …) and we trust the rate-sheet routing
    // (resolveRateSheet / job.port === "AK") to pick the right rate sheet.
    const clName = getCruiseLineForShip(job.ship, job.date);
    const cruiseLine = cruiseLines.find(c => c.name === clName) || null;
    const payload = buildDraftInvoicePayload(job, cruiseLine, result.rows, lastVikingMarsDate);

    setInvoiceStatus(null);
    setInvoicePreview({
      job, rateSheetKey,
      rows: result.rows,
      total: result.total,
      cruiseLine, payload,
      submitting: false,
      error: null,
    });
  }, [cruiseLines, lastVikingMarsDate]);

  const confirmInvoice = useCallback(async () => {
    if (!invoicePreview) return;
    const { job, rateSheetKey, rows, cruiseLine } = invoicePreview;
    setInvoicePreview(p => p && ({ ...p, submitting: true, error: null }));

    // Download the cost-breakdown PDF to the user's disk. The auto-attach
    // path (multipart upload at create time) is documented but currently
    // 500s server-side at Payday — see the header in paydayInvoice.js.
    // The workaround is: create the invoice as DRAFT in Payday, save the
    // PDF locally, and the user manually attaches it in Payday's UI
    // before clicking Send.
    const pdfResult = await generateInvoice(job, rateSheetKey);
    if (!pdfResult) {
      setInvoicePreview(p => p && ({ ...p, submitting: false, error: "Failed to render the PDF." }));
      return;
    }

    const createRes = await createDraftInvoice(job, cruiseLine, rows, lastVikingMarsDate);
    if (!createRes.ok) {
      setInvoicePreview(p => p && ({ ...p, submitting: false, error: createRes.error }));
      return;
    }

    setInvoicePreview(null);
    setInvoiceStatus({
      jobId: job.id,
      status: "success",
      msg: "Draft invoice created in Payday. The cost-breakdown PDF was saved to your Downloads — attach it to the draft in Payday, review, then click \"Send invoice\".",
    });
  }, [invoicePreview, lastVikingMarsDate]);

  const startInvoice = useCallback((job) => {
    // Akureyri has its own rate sheet, regardless of cruise line.
    if (job.port === "AK") { openPreview(job, "akureyri"); return; }
    const cl = getCruiseLineForShip(job.ship, job.date);
    const key = resolveRateSheet(cl);
    if (key) openPreview(job, key);
    else setRateSheetPicker(job);
  }, [openPreview]);

  const recordSyncError = useCallback((context, err) => {
    let detail = "";
    if (err) {
      if (typeof err === "string") detail = err;
      else if (err.message) detail = err.message;
      else if (err.code || err.details || err.hint) detail = [err.code, err.message, err.details, err.hint].filter(Boolean).join(" — ");
      else { try { detail = JSON.stringify(err); } catch { detail = String(err); } }
    }
    setJobSyncError({ context, detail: detail || "Unknown error", at: new Date().toISOString() });
  }, []);

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

  // ─── JOBS STORAGE (Supabase with localStorage fallback) ──────────────────
  const rowToJob = (r) => ({
    id: r.id, port: r.port || "REY", type: r.type || "provisions", date: r.date, ship: r.ship || "",
    po_number: r.po_number || "",
    notes: r.notes || "", shifts: typeof r.shifts === "string" ? JSON.parse(r.shifts) : (r.shifts || []),
    completed: r.completed || false, hoursWorked: r.hours_worked ? (typeof r.hours_worked === "string" ? JSON.parse(r.hours_worked) : r.hours_worked) : undefined,
    createdAt: r.created_at, deletedAt: r.deleted_at || undefined,
  });

  const loadJobsFromDb = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) return null;
    try {
      const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
      if (error) { console.warn("Supabase jobs error:", error); return null; }
      return (data || []).map(rowToJob);
    } catch (e) { console.warn("Failed to load jobs from Supabase:", e); return null; }
  }, []);

  useEffect(() => {
    (async () => {
      const readLocal = (key) => {
        try { const raw = localStorage.getItem(key); if (!raw) return []; const p = JSON.parse(raw); return Array.isArray(p) ? p : []; }
        catch { return []; }
      };
      const localJobs = readLocal("ws:jobs");
      const localDeleted = readLocal("ws:jobs:deleted");

      let dbJobs = null;
      try { dbJobs = await loadJobsFromDb(); }
      catch (e) { console.warn("Failed to load jobs:", e); }

      if (dbJobs === null) {
        setJobs(localJobs);
        setDeletedJobs(localDeleted);
        setJobsLoaded(true);
        return;
      }

      // Merge DB rows with any local rows that never reached Supabase, so a
      // silently-failed write isn't shadowed by an empty/partial DB response.
      const dbIds = new Set(dbJobs.map(j => j.id));
      const unsynced = [...localJobs, ...localDeleted].filter(j => j && j.id && !dbIds.has(j.id));
      setJobs([...dbJobs.filter(j => !j.deletedAt), ...unsynced.filter(j => !j.deletedAt)]);
      setDeletedJobs([...dbJobs.filter(j => j.deletedAt), ...unsynced.filter(j => j.deletedAt)]);
      setJobsLoaded(true);

      // Background: push unsynced rows up so coworkers see them too.
      if (!SUPABASE_CONFIGURED) return;
      for (const j of unsynced) {
        if (!j.date) continue;
        try {
          const { data, error } = await supabase.from("jobs").insert({
            port: j.port || "REY",
            type: j.type || "provisions",
            date: j.date,
            ship: j.ship || null,
            po_number: j.po_number || null,
            notes: j.notes || null,
            shifts: j.shifts || [],
            completed: !!j.completed,
            hours_worked: j.hoursWorked || null,
            deleted_at: j.deletedAt || null,
          });
          if (error) { recordSyncError("background-sync", error); continue; }
          if (data && data[0]) {
            const synced = rowToJob(data[0]);
            setJobs(prev => {
              const next = prev.map(x => x.id === j.id ? synced : x);
              try { localStorage.setItem("ws:jobs", JSON.stringify(next)); } catch {}
              return next;
            });
            setDeletedJobs(prev => {
              const next = prev.map(x => x.id === j.id ? synced : x);
              try { localStorage.setItem("ws:jobs:deleted", JSON.stringify(next)); } catch {}
              return next;
            });
          }
        } catch (e) { console.warn("Failed to sync local job:", e); }
      }
    })();
  }, [loadJobsFromDb, recordSyncError]);

  const saveJobs = useCallback((j) => {
    setJobs(j);
    try { localStorage.setItem("ws:jobs", JSON.stringify(j)); } catch (e) {}
  }, []);

  // Load cruise_lines (id, name, payday_customer_id, payment_terms_days) so
  // the invoice flow can map job → Payday customer + due-date. Fails silently;
  // createDraftInvoice surfaces a clear error at click time if a required
  // cruise line is missing or lacks a Payday mapping.
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("cruise_lines")
          .select("id,name,payday_customer_id,payment_terms_days")
          .order("name", { ascending: true });
        if (Array.isArray(data)) setCruiseLines(data);
      } catch (e) { console.warn("Failed to load cruise_lines:", e); }
    })();
  }, []);

  const saveDeletedJobs = useCallback((d) => {
    setDeletedJobs(d);
    try { localStorage.setItem("ws:jobs:deleted", JSON.stringify(d)); } catch (e) {}
  }, []);

  const openNewJob = useCallback(() => {
    setJobForm({ ...defaultJobForm, shifts: [emptyShift("provisions")] });
    setTimePickerOpen(-1);
    setJobModal("new");
    setPoAutoFilled(true);
  }, []);

  const openNewBindingarJob = useCallback(() => {
    setJobForm({ ...defaultJobForm, type: "bindingar", port: "REY", shifts: [emptyShift("bindingar")] });
    setTimePickerOpen(-1);
    setJobModal("new");
    setPoAutoFilled(true);
  }, []);

  // Open the new-job form with date/ship/port pre-filled (used by the
  // calendar's "ORDER missing" pills for contracted/SDK ships).
  const openNewJobForShip = useCallback((shipName, dateStr, port) => {
    setJobForm({ ...defaultJobForm, date: dateStr, ship: shipName, port: port || "REY", shifts: [emptyShift("provisions")] });
    setTimePickerOpen(-1);
    setJobModal("new");
    setPoAutoFilled(true);
  }, []);

  const openEditJob = useCallback((job) => {
    const type = job.type || "provisions";
    // Backward compat: old jobs have startTime/equipment at top level
    const shifts = job.shifts
      ? job.shifts.map(s => ({ startTime: s.startTime || "", nextDay: !!s.nextDay, equipment: { ...emptyEquip(type), ...s.equipment } }))
      : [{ startTime: job.startTime || "", nextDay: false, equipment: { ...emptyEquip(type), ...job.equipment } }];
    setJobForm({ port: job.port || "REY", type, date: job.date, ship: extractShipName(job.ship) || "", po_number: job.po_number || "", notes: job.notes || "", shifts });
    setTimePickerOpen(-1);
    setJobModal(job.id);
    setPoAutoFilled(false);
  }, []);

  // Auto-fill PO Number — produces the full reference string (call number or
  // DD.MM, plus service code, plus " AKU" when applicable). The Payday
  // composer takes the field verbatim. Stops once the user types a value;
  // re-enables if they clear the field.
  useEffect(() => {
    if (jobModal !== "new" || !poAutoFilled) return;
    const auto = computeAutoPONumber({ ship: jobForm.ship, date: jobForm.date, port: jobForm.port, type: jobForm.type });
    if (auto && auto !== jobForm.po_number) {
      setJobForm(f => ({ ...f, po_number: auto }));
    }
  }, [jobForm.ship, jobForm.date, jobForm.port, jobForm.type, jobModal, poAutoFilled, jobForm.po_number]);

  const saveJobForm = useCallback(async () => {
    if (!jobForm.date) return;
    const isBindingar = jobForm.type === "bindingar";
    const cleanShifts = jobForm.shifts
      .map(s => ({ startTime: s.startTime, nextDay: !!s.nextDay, equipment: Object.fromEntries(Object.entries(s.equipment).filter(([, qty]) => qty > 0)) }))
      .filter(s => Object.keys(s.equipment).length > 0);
    if (cleanShifts.length === 0) return;

    // Bindingar jobs auto-complete on save with synthesized hoursWorked
    // (hours: 0 placeholder per group; quantity carries the billing weight).
    const port = isBindingar ? "REY" : (jobForm.port || "REY");
    const po_number = isBindingar ? null : (jobForm.po_number?.trim() || null);
    const completed = isBindingar ? true : undefined;
    const hoursWorked = isBindingar ? cleanShifts.map(sh => ({
      startTime: sh.startTime,
      nextDay: !!sh.nextDay,
      equipment: Object.fromEntries(Object.entries(sh.equipment).map(([k, qty]) => [k, [{ qty, hours: 0 }]])),
    })) : undefined;

    if (jobModal === "new") {
      const insertPayload = { port, type: jobForm.type, date: jobForm.date, ship: jobForm.ship || null, po_number, notes: jobForm.notes || null, shifts: cleanShifts };
      if (isBindingar) { insertPayload.completed = true; insertPayload.hours_worked = hoursWorked; }
      const localBase = { id: generateId(), port, type: jobForm.type, date: jobForm.date, ship: jobForm.ship, po_number: po_number || "", notes: jobForm.notes, shifts: cleanShifts, completed: !!completed, createdAt: new Date().toISOString() };
      if (isBindingar) localBase.hoursWorked = hoursWorked;
      if (SUPABASE_CONFIGURED) {
        let data = null, error = null;
        try { ({ data, error } = await supabase.from("jobs").insert(insertPayload)); }
        catch (e) { error = e; }
        if (error) { console.error("Failed to create job:", error); recordSyncError("create", error); }
        if (data && data[0]) {
          const newJob = rowToJob(data[0]);
          saveJobs([...jobs, newJob]);
        } else {
          if (!error) recordSyncError("create", "Supabase returned no row");
          saveJobs([...jobs, localBase]);
        }
      } else {
        saveJobs([...jobs, localBase]);
      }
    } else {
      const updatePatch = { port, type: jobForm.type, date: jobForm.date, ship: jobForm.ship, po_number: po_number || "", notes: jobForm.notes, shifts: cleanShifts };
      if (isBindingar) { updatePatch.completed = true; updatePatch.hoursWorked = hoursWorked; }
      saveJobs(jobs.map(j => j.id === jobModal ? { ...j, ...updatePatch } : j));
      if (SUPABASE_CONFIGURED) {
        const dbPatch = { port, type: jobForm.type, date: jobForm.date, ship: jobForm.ship || null, po_number, notes: jobForm.notes || null, shifts: cleanShifts };
        if (isBindingar) { dbPatch.completed = true; dbPatch.hours_worked = hoursWorked; }
        supabase.from("jobs").update(dbPatch).eq("id", jobModal).then(() => {});
      }
    }
    setJobModal(null);
  }, [jobForm, jobModal, jobs, saveJobs, recordSyncError]);

  // Get all equipment merged across shifts (for completion + display)
  const getJobEquipment = (job) => {
    if (job.shifts) {
      const merged = {};
      job.shifts.forEach(s => Object.entries(s.equipment).forEach(([k, qty]) => { merged[k] = (merged[k] || 0) + qty; }));
      return merged;
    }
    return job.equipment || {};
  };
  const getJobStartTime = (job) => {
    if (job.shifts && job.shifts.length > 0) return job.shifts.map(s => s.startTime ? (s.nextDay ? `${s.startTime} (+1d)` : s.startTime) : "").filter(Boolean).join(", ");
    return job.startTime || "";
  };

  const toggleJobComplete = useCallback((id) => {
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    if (job.completed) {
      saveJobs(jobs.map(j => j.id === id ? { ...j, completed: false, hoursWorked: undefined } : j));
      if (SUPABASE_CONFIGURED) supabase.from("jobs").update({ completed: false, hours_worked: null }).eq("id", id).then(() => {});
    } else {
      const shifts = job.shifts || [{ startTime: job.startTime || "", equipment: job.equipment || {} }];
      const cpEquip = JOB_EQUIPMENT_BY_TYPE[job.type] || {};
      const isDaysKey = (k) => job.type === "cherry_picker" && !!cpEquip[k]?.flatDay;
      const hrs = shifts.map(s => ({
        startTime: s.startTime || "",
        nextDay: !!s.nextDay,
        equipment: Object.fromEntries(Object.entries(s.equipment).filter(([, qty]) => qty > 0).map(([k, qty]) => [k, [{ qty, hours: isDaysKey(k) ? "1" : "4" }]])),
      }));
      setCompleteHours(hrs);
      setCompleteAllHours("");
      setCompleteModal(job);
    }
  }, [jobs, saveJobs]);

  const applyAllHours = useCallback((val) => {
    setCompleteAllHours(val);
    if (completeModal) {
      const clamped = String(Math.max(4, parseInt(val) || 4));
      const cpEquip = JOB_EQUIPMENT_BY_TYPE[completeModal.type] || {};
      const isDaysKey = (k) => completeModal.type === "cherry_picker" && !!cpEquip[k]?.flatDay;
      setCompleteHours(prev => prev.map(sh => ({
        ...sh,
        equipment: Object.fromEntries(Object.entries(sh.equipment).map(([k, groups]) => (
          isDaysKey(k) ? [k, groups] : [k, groups.map(g => ({ ...g, hours: clamped }))]
        ))),
      })));
    }
  }, [completeModal]);

  const splitGroup = useCallback((shiftIdx, key, groupIdx, splitQty) => {
    setCompleteHours(prev => prev.map((sh, si) => {
      if (si !== shiftIdx) return sh;
      const groups = [...sh.equipment[key]];
      const g = groups[groupIdx];
      if (splitQty >= g.qty) return sh;
      groups.splice(groupIdx, 1, { qty: g.qty - splitQty, hours: g.hours }, { qty: splitQty, hours: g.hours });
      return { ...sh, equipment: { ...sh.equipment, [key]: groups } };
    }));
  }, []);

  const confirmComplete = useCallback(() => {
    if (!completeModal) return;
    const cpEquip = JOB_EQUIPMENT_BY_TYPE[completeModal.type] || {};
    const isDaysKey = (k) => completeModal.type === "cherry_picker" && !!cpEquip[k]?.flatDay;
    const hoursWorked = completeHours.map(sh => ({
      startTime: sh.startTime,
      nextDay: !!sh.nextDay,
      equipment: Object.fromEntries(Object.entries(sh.equipment).map(([k, groups]) => [k, groups.map(g => ({ qty: g.qty, hours: parseInt(g.hours) || (isDaysKey(k) ? 1 : 4) }))])),
    }));
    saveJobs(jobs.map(j => j.id === completeModal.id ? { ...j, completed: true, hoursWorked } : j));
    if (SUPABASE_CONFIGURED) supabase.from("jobs").update({ completed: true, hours_worked: hoursWorked }).eq("id", completeModal.id).then(() => {});
    setCompleteModal(null);
  }, [completeModal, completeHours, jobs, saveJobs]);

  const deleteJob = useCallback((id) => {
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    const now = new Date().toISOString();
    saveJobs(jobs.filter(j => j.id !== id));
    saveDeletedJobs([{ ...job, deletedAt: now }, ...deletedJobs]);
    if (SUPABASE_CONFIGURED) supabase.from("jobs").update({ deleted_at: now }).eq("id", id).then(() => {});
  }, [jobs, saveJobs, deletedJobs, saveDeletedJobs]);

  const restoreJob = useCallback((id) => {
    const job = deletedJobs.find(j => j.id === id);
    if (!job) return;
    const { deletedAt, ...restored } = job;
    saveJobs([...jobs, restored]);
    saveDeletedJobs(deletedJobs.filter(j => j.id !== id));
    if (SUPABASE_CONFIGURED) supabase.from("jobs").update({ deleted_at: null }).eq("id", id).then(() => {});
  }, [jobs, saveJobs, deletedJobs, saveDeletedJobs]);

  const permanentDeleteJob = useCallback((id) => {
    saveDeletedJobs(deletedJobs.filter(j => j.id !== id));
    if (SUPABASE_CONFIGURED) supabase.from("jobs").delete().eq("id", id).then(() => {});
  }, [deletedJobs, saveDeletedJobs]);

  const shipsOnDate = useMemo(() => {
    if (!jobForm.date) return [];
    const d = jobForm.date;
    const formPort = jobForm.port || "REY";
    return SHIPS.filter(s => (s.port || "REY") === formPort && d >= s.date && d <= (s.endDate || s.date))
      .map(s => s.ship)
      .filter((v, i, a) => a.indexOf(v) === i);
  }, [jobForm.date, jobForm.port]);

  const fmtEquipment = (eq, type) => {
    const typeEquip = JOB_EQUIPMENT_BY_TYPE[type] || JOB_EQUIPMENT_BY_TYPE.provisions;
    return Object.entries(eq).filter(([, qty]) => qty > 0).map(([k, qty]) => `${qty}× ${typeEquip[k]?.label || k}`).join(", ");
  };
  const fmtJobEquipment = (job) => fmtEquipment(getJobEquipment(job), job.type);

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

          {/* JOB FORM MODAL */}
          {jobModal !== null && (
            <div onClick={() => setJobModal(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div onClick={e => e.stopPropagation()} style={{ width: 520, maxHeight: "90vh", overflowY: "auto", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{jobModal === "new" ? "New Job Order" : "Edit Job Order"}</div>
                  <button onClick={() => setJobModal(null)} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
                </div>

                {(() => { const jt = JOB_TYPES[jobForm.type] || JOB_TYPES.provisions; const equipList = JOB_EQUIPMENT_BY_TYPE[jobForm.type] || {}; const isBindingar = jobForm.type === "bindingar"; return (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {!isBindingar && (
                  <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Port *</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {Object.entries(PORTS).map(([k, v]) => (
                        <button key={k} onClick={() => setJobForm(f => ({ ...f, port: k, ship: "" }))} title={v.longLabel} style={{
                          flex: 1, padding: "6px 12px", borderRadius: 8, cursor: "pointer", transition: "all 0.2s",
                          background: jobForm.port === k ? `${v.color}18` : "rgba(255,255,255,0.03)",
                          border: `1px solid ${jobForm.port === k ? v.color : BORDER}`,
                          color: jobForm.port === k ? v.color : TEXT_DIM, fontWeight: 600, fontSize: 12,
                          fontFamily: "JetBrains Mono", letterSpacing: 1,
                        }}>{v.label}</button>
                      ))}
                    </div>
                  </div>
                  )}
                  {!isBindingar && (
                  <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Job Type *</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {Object.entries(JOB_TYPES).filter(([k]) => k !== "bindingar").map(([k, v]) => (
                        <button key={k} onClick={() => setJobForm(f => ({
                          ...f,
                          type: k,
                          port: JOB_TYPES[k]?.reyOnly ? "REY" : f.port,
                          shifts: f.shifts.map(s => ({ ...s, equipment: emptyEquip(k) })),
                        }))} style={{
                          flex: 1, minWidth: 70, padding: "8px 12px", borderRadius: 8, cursor: "pointer", transition: "all 0.2s",
                          background: jobForm.type === k ? `${v.color}18` : "rgba(255,255,255,0.03)",
                          border: `1px solid ${jobForm.type === k ? v.color : BORDER}`,
                          color: jobForm.type === k ? v.color : TEXT_DIM, fontWeight: 600, fontSize: 12,
                          fontFamily: "'Satoshi', 'Inter', sans-serif",
                        }}>{v.label}</button>
                      ))}
                    </div>
                  </div>
                  )}
                  <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Date *</div>
                    <input type="date" value={jobForm.date} onChange={e => setJobForm(f => ({ ...f, date: e.target.value, ship: "" }))} style={{ ...inputStyle, colorScheme: "dark", width: "100%", cursor: "pointer" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Ship {shipsOnDate.length > 0 ? `(${shipsOnDate.length} in port)` : "(optional)"}</div>
                    {shipsOnDate.length > 0 ? (
                      <select value={jobForm.ship} onChange={e => setJobForm(f => ({ ...f, ship: e.target.value }))} style={{ ...inputStyle, colorScheme: "dark", width: "100%", cursor: "pointer", backgroundColor: "#112F45" }}>
                        <option value="" style={{ background: "#112F45", color: TEXT }}>— Select ship —</option>
                        {shipsOnDate.map(s => <option key={s} value={s} style={{ background: "#112F45", color: TEXT }}>{s}</option>)}
                      </select>
                    ) : (
                      <input value={jobForm.ship} onChange={e => setJobForm(f => ({ ...f, ship: e.target.value }))} placeholder={jobForm.date ? "No ships in port this day" : "Pick a date first..."} style={inputStyle} />
                    )}
                  </div>

                  {isBindingar && (<>
                    <div>
                      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Start time</div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <div style={{ position: "relative", width: 160 }}>
                          <button onClick={() => setTimePickerOpen(timePickerOpen === 0 ? -1 : 0)} style={{ ...inputStyle, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", width: "100%" }}>
                            <span style={{ color: jobForm.shifts[0]?.startTime ? TEXT : TEXT_DIM }}>{jobForm.shifts[0]?.startTime || "— Start time —"}</span>
                            <span style={{ marginLeft: "auto", color: TEXT_DIM, fontSize: 10 }}>▼</span>
                          </button>
                          {timePickerOpen === 0 && (<>
                            <div onClick={() => setTimePickerOpen(-1)} style={{ position: "fixed", inset: 0, zIndex: 299 }} />
                            <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 300, background: "#112F45", border: `1px solid ${BORDER}`, borderRadius: 8, marginTop: 4, padding: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, width: 200, maxHeight: 280, overflowY: "auto" }}>
                              {Array.from({ length: 48 }, (_, i) => { const idx = (i + 12) % 48; const h = String(Math.floor(idx / 2)).padStart(2, "0"); const m = idx % 2 === 0 ? "00" : "30"; return `${h}:${m}`; }).map(t => (
                                <button key={t} onClick={() => { setJobForm(f => ({ ...f, shifts: [{ startTime: t, nextDay: false, equipment: f.shifts[0]?.equipment || {} }] })); setTimePickerOpen(-1); }} style={{
                                  padding: "6px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontFamily: "JetBrains Mono", fontWeight: jobForm.shifts[0]?.startTime === t ? 700 : 400, textAlign: "center",
                                  background: jobForm.shifts[0]?.startTime === t ? `${jt.color}25` : "transparent",
                                  border: jobForm.shifts[0]?.startTime === t ? `1px solid ${jt.color}` : "1px solid transparent",
                                  color: jobForm.shifts[0]?.startTime === t ? jt.color : TEXT,
                                }}>{t}</button>
                              ))}
                            </div>
                          </>)}
                        </div>
                        {(() => {
                          const cur = jobForm.shifts[0]?.startTime;
                          const adjust = (delta) => {
                            if (!cur) return;
                            const [h, m] = cur.split(":").map(Number);
                            const total = ((h * 60 + m + delta) % 1440 + 1440) % 1440;
                            const nh = String(Math.floor(total / 60)).padStart(2, "0");
                            const nm = String(total % 60).padStart(2, "0");
                            setJobForm(f => ({ ...f, shifts: [{ ...f.shifts[0], startTime: `${nh}:${nm}` }] }));
                          };
                          const btn = (delta, label) => (
                            <button onClick={() => adjust(delta)} disabled={!cur} style={{
                              padding: "6px 10px", borderRadius: 6, cursor: cur ? "pointer" : "not-allowed",
                              background: cur ? `${jt.color}15` : "rgba(255,255,255,0.03)",
                              border: `1px solid ${cur ? jt.color + "40" : BORDER}`,
                              color: cur ? jt.color : TEXT_DIM,
                              fontSize: 11, fontWeight: 700, fontFamily: "JetBrains Mono",
                              opacity: cur ? 1 : 0.5,
                            }}>{label}</button>
                          );
                          return (<>{btn(-15, "−15")}{btn(15, "+15")}</>);
                        })()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 8 }}>Resources *</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                        {Object.entries(equipList).map(([k, v]) => {
                          const qty = jobForm.shifts[0]?.equipment[k] || 0;
                          const setQty = (newQty) => setJobForm(f => ({
                            ...f,
                            shifts: [{ startTime: f.shifts[0]?.startTime || "", nextDay: false, equipment: { ...(f.shifts[0]?.equipment || {}), [k]: newQty } }],
                          }));
                          return (
                            <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, background: qty > 0 ? `${jt.color}12` : "rgba(255,255,255,0.03)", border: `1px solid ${qty > 0 ? jt.color : BORDER}`, borderRadius: 8, padding: "6px 10px" }}>
                              <span style={{ fontSize: 12, flex: 1, color: qty > 0 ? TEXT : TEXT_DIM, fontWeight: 500 }}>{v.label}</span>
                              <button onClick={() => setQty(Math.max(0, qty - 1))} style={{ width: 26, height: 26, borderRadius: 6, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: TEXT_DIM, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JetBrains Mono" }}>−</button>
                              <span style={{ width: 24, textAlign: "center", fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: qty > 0 ? jt.color : TEXT_DIM }}>{qty}</span>
                              <button onClick={() => setQty(qty + 1)} style={{ width: 26, height: 26, borderRadius: 6, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: TEXT_DIM, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JetBrains Mono" }}>+</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>)}

                  {/* ── SHIFTS (start time + equipment per shift) ── */}
                  {!isBindingar && jobForm.shifts.map((shift, si) => (
                    <div key={si} style={{ border: `1px solid ${jobForm.shifts.length > 1 ? jt.color + "40" : BORDER}`, borderRadius: 10, padding: 12, background: jobForm.shifts.length > 1 ? `${jt.color}06` : "transparent" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {jobForm.shifts.length > 1 && <span style={{ fontSize: 10, fontWeight: 700, color: jt.color, fontFamily: "JetBrains Mono" }}>SHIFT {si + 1}</span>}
                          <div style={{ position: "relative" }}>
                            <button onClick={() => setTimePickerOpen(timePickerOpen === si ? -1 : si)} style={{ ...inputStyle, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", minWidth: 140 }}>
                              <span style={{ color: shift.startTime ? TEXT : TEXT_DIM }}>{shift.startTime || "— Start time —"}</span>
                              <span style={{ color: TEXT_DIM, fontSize: 10 }}>▼</span>
                            </button>
                            {timePickerOpen === si && (<>
                              <div onClick={() => setTimePickerOpen(-1)} style={{ position: "fixed", inset: 0, zIndex: 299 }} />
                              <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 300, background: "#112F45", border: `1px solid ${BORDER}`, borderRadius: 8, marginTop: 4, padding: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, width: 200, maxHeight: 280, overflowY: "auto" }}>
                                {Array.from({ length: 48 }, (_, i) => { const idx = (i + 12) % 48; const h = String(Math.floor(idx / 2)).padStart(2, "0"); const m = idx % 2 === 0 ? "00" : "30"; return `${h}:${m}`; }).map(t => (
                                  <button key={t} onClick={() => { setJobForm(f => ({ ...f, shifts: f.shifts.map((s, i) => i === si ? { ...s, startTime: t } : s) })); setTimePickerOpen(-1); }} style={{
                                    padding: "6px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontFamily: "JetBrains Mono", fontWeight: shift.startTime === t ? 700 : 400, textAlign: "center",
                                    background: shift.startTime === t ? `${jt.color}25` : "transparent",
                                    border: shift.startTime === t ? `1px solid ${jt.color}` : "1px solid transparent",
                                    color: shift.startTime === t ? jt.color : TEXT,
                                  }}>{t}</button>
                                ))}
                              </div>
                            </>)}
                          </div>
                          {si > 0 && (
                            <button onClick={() => setJobForm(f => ({ ...f, shifts: f.shifts.map((s, i) => i === si ? { ...s, nextDay: !s.nextDay } : s) }))} title={shift.nextDay ? "Click to put this shift on the job date" : "Click to put this shift on the day after the job date"} style={{
                              padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "JetBrains Mono",
                              background: shift.nextDay ? `${jt.color}25` : "rgba(255,255,255,0.03)",
                              border: `1px solid ${shift.nextDay ? jt.color : BORDER}`,
                              color: shift.nextDay ? jt.color : TEXT_DIM,
                            }}>{shift.nextDay ? "Next day ✓" : "+1 day"}</button>
                          )}
                        </div>
                        {jobForm.shifts.length > 1 && (
                          <button onClick={() => setJobForm(f => ({ ...f, shifts: f.shifts.filter((_, i) => i !== si) }))} style={{ background: "rgba(239,68,68,0.08)", border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: IPS_DANGER, fontSize: 10, fontFamily: "JetBrains Mono" }}>Remove</button>
                        )}
                      </div>
                      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 8 }}>Equipment *</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                        {Object.entries(equipList).filter(([, v]) => !v.auto).map(([k, v]) => {
                          const qty = shift.equipment[k] || 0;
                          const opKey = v.autoOperator;
                          const opQty = opKey ? (shift.equipment[opKey] || 0) : null;
                          const setEquip = (newQty) => {
                            const upd = { [k]: newQty };
                            if (opKey) upd[opKey] = newQty;
                            setJobForm(f => ({ ...f, shifts: f.shifts.map((s, i) => i === si ? { ...s, equipment: { ...s.equipment, ...upd } } : s) }));
                          };
                          return (
                          <div key={k}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, background: qty > 0 ? `${jt.color}12` : "rgba(255,255,255,0.03)", border: `1px solid ${qty > 0 ? jt.color : BORDER}`, borderRadius: 8, padding: "6px 10px" }}>
                              <span style={{ fontSize: 12, flex: 1, color: qty > 0 ? TEXT : TEXT_DIM, fontWeight: 500 }}>{v.label}</span>
                              <button onClick={() => setEquip(Math.max(0, qty - 1))} style={{ width: 26, height: 26, borderRadius: 6, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: TEXT_DIM, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JetBrains Mono" }}>−</button>
                              <span style={{ width: 24, textAlign: "center", fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: qty > 0 ? jt.color : TEXT_DIM }}>{qty}</span>
                              <button onClick={() => setEquip(qty + 1)} style={{ width: 26, height: 26, borderRadius: 6, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: TEXT_DIM, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JetBrains Mono" }}>+</button>
                            </div>
                            {opKey && qty > 0 && (
                              <div style={{ fontSize: 10, color: jt.color, fontFamily: "JetBrains Mono", marginTop: 3, paddingLeft: 10, opacity: 0.8 }}>+ {opQty}× {equipList[opKey]?.label || "Operator"}</div>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {!isBindingar && (
                  <button onClick={() => setJobForm(f => ({ ...f, shifts: [...f.shifts, emptyShift(f.type)] }))} style={{
                    width: "100%", padding: "8px 0", borderRadius: 8, cursor: "pointer",
                    background: "rgba(255,255,255,0.03)", border: `1px dashed ${BORDER}`,
                    color: IPS_ACCENT, fontSize: 12, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', sans-serif",
                  }}>+ Add another start time</button>
                  )}
                  <div>
                    {!isBindingar && (<>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>
                      PO Number <span style={{ color: TEXT_DIM, textTransform: "none", letterSpacing: 0 }}>(required to invoice)</span>
                    </div>
                    <input
                      value={jobForm.po_number}
                      onChange={e => { const v = e.target.value; setPoAutoFilled(v === ""); setJobForm(f => ({ ...f, po_number: v })); }}
                      placeholder="e.g. 85231"
                      style={{ ...inputStyle, marginBottom: 16 }}
                    />
                    </>)}
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Notes</div>
                    <textarea value={jobForm.notes} onChange={e => setJobForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional details..." rows={2} style={{ ...inputStyle, resize: "vertical" }} />
                  </div>
                </div>); })()}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
                  <button onClick={() => setJobModal(null)} style={{ padding: "10px 20px", borderRadius: 8, cursor: "pointer", background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, color: TEXT_DIM, fontSize: 13, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>Cancel</button>
                  <button onClick={saveJobForm} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", background: (JOB_TYPES[jobForm.type] || JOB_TYPES.provisions).color, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>{jobModal === "new" ? "Create Job" : "Save Changes"}</button>
                </div>
              </div>
            </div>
          )}

          {/* JOB COMPLETION MODAL */}
          {completeModal !== null && (() => {
            const cjt = JOB_TYPES[completeModal.type] || JOB_TYPES.provisions;
            const cEquipList = JOB_EQUIPMENT_BY_TYPE[completeModal.type] || {};
            return (
            <div onClick={() => setCompleteModal(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div onClick={e => e.stopPropagation()} style={{ width: 440, maxHeight: "90vh", overflowY: "auto", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Complete Job</div>
                  <button onClick={() => setCompleteModal(null)} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
                </div>

                <div style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: cjt.color, background: `${cjt.color}15`, padding: "1px 8px", borderRadius: 4, textTransform: "uppercase", fontFamily: "JetBrains Mono" }}>{cjt.label}</span>
                  {" "}{fmtDate(completeModal.date)}{getJobStartTime(completeModal) ? ` at ${getJobStartTime(completeModal)}` : ""}{completeModal.ship ? ` · ${completeModal.ship}` : ""}
                </div>

                <div style={{ margin: "16px 0 12px" }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 8 }}>Hours worked</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "8px 12px", background: `${cjt.color}08`, border: `1px solid ${cjt.color}30`, borderRadius: 8 }}>
                    <span style={{ fontSize: 12, color: TEXT, fontWeight: 500, whiteSpace: "nowrap" }}>Set all to:</span>
                    <input type="number" min="4" step="1" value={completeAllHours} onChange={e => applyAllHours(e.target.value)} placeholder="4" style={{ ...inputStyle, width: 80, padding: "6px 10px", textAlign: "center", fontFamily: "JetBrains Mono" }} />
                    <span style={{ fontSize: 11, color: TEXT_DIM }}>hours</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {completeHours.map((sh, si) => (
                      <div key={si} style={{ border: completeHours.length > 1 ? `1px solid ${cjt.color}30` : "none", borderRadius: 8, padding: completeHours.length > 1 ? 10 : 0, background: completeHours.length > 1 ? `${cjt.color}06` : "transparent" }}>
                        {completeHours.length > 1 && (
                          <div style={{ fontSize: 10, fontWeight: 700, color: cjt.color, fontFamily: "JetBrains Mono", marginBottom: 8 }}>
                            {sh.startTime ? `START ${sh.startTime}${sh.nextDay ? " (+1d)" : ""}` : `SHIFT ${si + 1}`}
                          </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {Object.entries(sh.equipment).map(([k, groups]) => {
                            const eq = cEquipList[k];
                            const label = eq?.label || k;
                            const isDays = completeModal.type === "cherry_picker" && !!eq?.flatDay;
                            const minVal = isDays ? 1 : 4;
                            return groups.map((g, gi) => (
                              <div key={`${k}-${gi}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 12, color: TEXT, flex: 1, fontWeight: 500 }}>{g.qty}× {label}</span>
                                <input type="number" min={minVal} step="1" value={g.hours} onChange={e => { const v = Math.max(minVal, parseInt(e.target.value) || minVal); setCompleteHours(prev => prev.map((s, i) => i !== si ? s : { ...s, equipment: { ...s.equipment, [k]: s.equipment[k].map((x, j) => j === gi ? { ...x, hours: String(v) } : x) } })); setCompleteAllHours(""); }} style={{ ...inputStyle, width: 70, padding: "6px 8px", textAlign: "center", fontFamily: "JetBrains Mono" }} />
                                <span style={{ fontSize: 11, color: TEXT_DIM }}>{isDays ? "d" : "h"}</span>
                                {g.qty > 1 && (
                                  <div style={{ position: "relative" }}>
                                    <select onChange={e => { const v = parseInt(e.target.value); if (v > 0) splitGroup(si, k, gi, v); e.target.value = ""; }} defaultValue="" style={{ padding: "4px 6px", borderRadius: 4, cursor: "pointer", fontSize: 10, fontFamily: "JetBrains Mono", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: IPS_ACCENT, appearance: "auto", colorScheme: "dark" }}>
                                      <option value="" disabled>Split</option>
                                      {Array.from({ length: g.qty - 1 }, (_, i) => i + 1).map(n => (
                                        <option key={n} value={n} style={{ background: "#112F45", color: TEXT }}>Split {n} off</option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            ));
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                  <button onClick={() => setCompleteModal(null)} style={{ padding: "10px 20px", borderRadius: 8, cursor: "pointer", background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, color: TEXT_DIM, fontSize: 13, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>Cancel</button>
                  <button onClick={confirmComplete} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", background: IPS_SUCCESS, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>Complete Job</button>
                </div>
              </div>
            </div>
            );
          })()}

          {/* RATE SHEET PICKER MODAL */}
          {rateSheetPicker && (
            <div onClick={() => setRateSheetPicker(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div onClick={e => e.stopPropagation()} style={{ width: 420, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Choose rate sheet</div>
                  <button onClick={() => setRateSheetPicker(null)} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
                </div>
                <div style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 16, lineHeight: 1.5 }}>
                  Couldn't determine a rate sheet automatically{rateSheetPicker.ship ? ` for ${rateSheetPicker.ship}` : ""}. Pick one to use for this invoice:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(RATE_SHEETS).map(([key, sheet]) => (
                    <button key={key} onClick={() => { const j = rateSheetPicker; setRateSheetPicker(null); openPreview(j, key); }} style={{
                      padding: "12px 16px", borderRadius: 8, cursor: "pointer", textAlign: "left",
                      background: "rgba(87,181,200,0.08)", border: `1px solid rgba(87,181,200,0.3)`,
                      color: TEXT, fontSize: 13, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', sans-serif",
                    }}>{sheet.label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* INVOICE PREVIEW MODAL — review before pushing to Payday */}
          {invoicePreview && (() => {
            const { job, rows, total, cruiseLine, payload, submitting, error } = invoicePreview;
            const sheet = RATE_SHEETS[invoicePreview.rateSheetKey];
            const close = () => { if (!submitting) setInvoicePreview(null); };
            const fmtIsk = (n) =>
              Number.isFinite(n) ? Math.round(n).toLocaleString("is-IS") + " ISK" : "—";
            return (
              <div onClick={close} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div onClick={e => e.stopPropagation()} style={{ width: 760, maxWidth: "calc(100vw - 40px)", maxHeight: "90vh", overflowY: "auto", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Review invoice before creating in Payday</div>
                    <button onClick={close} disabled={submitting} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 20, cursor: submitting ? "not-allowed" : "pointer", lineHeight: 1, opacity: submitting ? 0.5 : 1 }}>×</button>
                  </div>
                  <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 16, fontFamily: "JetBrains Mono", lineHeight: 1.5 }}>
                    Payday's API only creates finalized invoices — clicking Confirm will put this on Payday's books.
                    Nothing's been sent to Payday yet.
                  </div>

                  {/* Job + customer summary */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, background: "rgba(0,0,0,0.15)", padding: 12, borderRadius: 8, marginBottom: 16 }}>
                    <div><span style={{ color: TEXT_DIM }}>Customer:</span> <strong>{cruiseLine?.name || <span style={{ color: IPS_DANGER }}>not resolved</span>}</strong></div>
                    <div><span style={{ color: TEXT_DIM }}>Rate sheet:</span> {sheet?.label || invoicePreview.rateSheetKey}</div>
                    <div><span style={{ color: TEXT_DIM }}>Ship:</span> {job.ship || "—"}</div>
                    <div><span style={{ color: TEXT_DIM }}>Job date:</span> {job.date}{job.port === "AK" ? " · AK" : ""}</div>
                    <div><span style={{ color: TEXT_DIM }}>Invoice date:</span> {payload.invoiceDate}</div>
                    <div><span style={{ color: TEXT_DIM }}>Due / Final:</span> {payload.dueDate}</div>
                    <div><span style={{ color: TEXT_DIM }}>Reference:</span> {payload.reference || <span style={{ color: TEXT_DIM, fontStyle: "italic" }}>(empty)</span>}</div>
                    <div><span style={{ color: TEXT_DIM }}>Currency:</span> {payload.currencyCode}</div>
                  </div>

                  {/* Line items */}
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Lines ({rows.length})</div>
                  <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 60px 110px 60px 120px", gap: 8, padding: "8px 12px", fontSize: 10, color: TEXT_DIM, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: 1, background: "rgba(0,0,0,0.2)" }}>
                      <span>Description</span><span style={{ textAlign: "right" }}>Qty</span><span style={{ textAlign: "right" }}>Unit</span><span style={{ textAlign: "right" }}>Excl. VAT</span><span style={{ textAlign: "center" }}>VAT %</span><span style={{ textAlign: "right" }}>Total</span>
                    </div>
                    {rows.map((r, i) => {
                      const line = payload.lines[i] || {};
                      return (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 50px 60px 110px 60px 120px", gap: 8, padding: "8px 12px", fontSize: 12, borderTop: `1px solid ${BORDER}`, alignItems: "center" }}>
                          <span>{r.resource}</span>
                          <span style={{ textAlign: "right", fontFamily: "JetBrains Mono" }}>{r.amount}</span>
                          <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", color: TEXT_DIM, fontSize: 11 }}>{r.timeUnit}</span>
                          <span style={{ textAlign: "right", fontFamily: "JetBrains Mono" }}>{r.unitPrice}</span>
                          <span style={{ textAlign: "center", fontFamily: "JetBrains Mono", fontSize: 11, color: line.vatPercentage === 0 ? IPS_WARN : TEXT_DIM }}>{line.vatPercentage}%</span>
                          <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{r.total}</span>
                        </div>
                      );
                    })}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "10px 12px", borderTop: `2px solid ${BORDER}`, background: "rgba(0,0,0,0.15)", fontSize: 13, fontWeight: 700 }}>
                      <span>Total (excl. VAT)</span>
                      <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", color: IPS_ACCENT }}>{fmtIsk(total)}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Description</div>
                  <pre style={{ margin: 0, marginBottom: 16, padding: 10, background: "rgba(0,0,0,0.2)", border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 11, fontFamily: "JetBrains Mono", color: TEXT, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{payload.description || "(empty)"}</pre>

                  {error && (
                    <div style={{ padding: "10px 14px", background: `${IPS_DANGER}15`, border: `1px solid ${IPS_DANGER}`, borderRadius: 8, marginBottom: 12, fontSize: 12, color: IPS_DANGER, fontFamily: "JetBrains Mono" }}>{error}</div>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button onClick={close} disabled={submitting} style={{ padding: "10px 20px", borderRadius: 8, cursor: submitting ? "not-allowed" : "pointer", background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, color: TEXT_DIM, fontSize: 13, fontFamily: "'Satoshi', 'Inter', sans-serif", opacity: submitting ? 0.5 : 1 }}>Cancel</button>
                    <button onClick={confirmInvoice} disabled={submitting} style={{ padding: "10px 24px", borderRadius: 8, cursor: submitting ? "wait" : "pointer", background: submitting ? "rgba(87,181,200,0.4)" : IPS_ACCENT, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>
                      {submitting ? "Creating in Payday…" : "Confirm — download PDF & create"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ═══ JOBS VIEW ═══ */}
          {wsView === "jobs" && (<>
            {jobSyncError && (
              <div style={{ marginBottom: 12, padding: "10px 14px", background: `${IPS_DANGER}15`, border: `1px solid ${IPS_DANGER}`, borderRadius: 8, display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ color: IPS_DANGER, fontSize: 16, lineHeight: 1, marginTop: 1 }}>⚠</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: IPS_DANGER, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                    Sync failed ({jobSyncError.context}) — Jon may not see this job
                  </div>
                  <div style={{ fontSize: 12, color: TEXT, fontFamily: "JetBrains Mono", wordBreak: "break-word" }}>{jobSyncError.detail}</div>
                </div>
                <button onClick={() => setJobSyncError(null)} style={{ background: "none", border: "none", color: TEXT_DIM, fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <button onClick={() => setJobsCollapsed(c => !c)} style={{
                background: "none", border: "none", cursor: "pointer", padding: 0,
                display: "flex", alignItems: "center", gap: 10, color: TEXT,
              }}>
                <span style={{ fontSize: 12, color: TEXT_DIM, fontFamily: "JetBrains Mono", display: "inline-block", width: 12, textAlign: "center" }}>{jobsCollapsed ? "▶" : "▼"}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: "'Satoshi', 'Inter', sans-serif", letterSpacing: 0.5 }}>Jobs</span>
                <span style={{ fontSize: 13, color: TEXT_DIM }}>{jobs.filter(j => !j.completed && j.type !== "bindingar").length} active</span>
              </button>
              <button onClick={openNewJob} style={{ padding: "8px 18px", borderRadius: 8, cursor: "pointer", background: IPS_ACCENT, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>+ New Job</button>
            </div>

            {!jobsCollapsed && (jobs.length === 0 ? (
              <Card style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 14, color: TEXT_DIM, marginBottom: 12 }}>No job orders yet.</div>
                <button onClick={openNewJob} style={{ padding: "8px 18px", borderRadius: 8, cursor: "pointer", background: IPS_ACCENT, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>Log your first job</button>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...jobs].filter(j => j.type !== "bindingar").sort((a, b) => (a.date || "").localeCompare(b.date || "") || (getJobStartTime(a) || "").localeCompare(getJobStartTime(b) || "")).map(job => {
                  const jt = JOB_TYPES[job.type] || JOB_TYPES.provisions;
                  return (
                  <Card key={job.id} style={{ padding: "12px 16px", borderLeft: `4px solid ${jt.color}` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <button onClick={() => toggleJobComplete(job.id)} style={{
                        width: 22, height: 22, borderRadius: 6, cursor: "pointer", flexShrink: 0, marginTop: 2,
                        background: job.completed ? IPS_SUCCESS : "transparent",
                        border: `2px solid ${job.completed ? IPS_SUCCESS : BORDER}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 12, fontWeight: 700, opacity: job.completed ? 0.5 : 1,
                      }}>{job.completed ? "✓" : ""}</button>
                      <div style={{ flex: 1, opacity: job.completed ? 0.5 : 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: jt.color, background: `${jt.color}15`, padding: "1px 8px", borderRadius: 4, textTransform: "uppercase", fontFamily: "JetBrains Mono", letterSpacing: 0.5 }}>{jt.label}</span>
                          <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 700, color: TEXT }}>{fmtDate(job.date)}</span>
                          {getJobStartTime(job) && <span style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: TEXT_DIM }}>{getJobStartTime(job)}</span>}
                          {job.ship && <span style={{ fontSize: 12, fontWeight: 600, color: IPS_ACCENT, background: `${IPS_ACCENT}15`, padding: "1px 8px", borderRadius: 4 }}>{job.ship}</span>}
                          {(() => { const berth = getBerthForShip(job.ship, job.date); return berth ? <span style={{ fontSize: 12, fontWeight: 600, color: jt.color, background: `${jt.color}15`, padding: "1px 8px", borderRadius: 4 }}>{berth}</span> : null; })()}
                        </div>
                        <div style={{ fontSize: 13, color: TEXT, fontWeight: 500 }}>{fmtJobEquipment(job)}</div>
                        {job.completed && job.hoursWorked && (
                          <div style={{ fontSize: 11, color: IPS_SUCCESS, marginTop: 4, fontFamily: "JetBrains Mono" }}>
                            {(() => { const unitFor = (k) => (job.type === "cherry_picker" && JOB_EQUIPMENT_BY_TYPE[job.type]?.[k]?.flatDay) ? "d" : "h"; return Array.isArray(job.hoursWorked) ? (
                              // New per-shift format
                              job.hoursWorked.map((sh, si) => {
                                const prefix = job.hoursWorked.length > 1 && sh.startTime ? `[${sh.startTime}] ` : "";
                                const items = Object.entries(sh.equipment || {}).flatMap(([k, groups]) => {
                                  const label = JOB_EQUIPMENT_BY_TYPE[job.type]?.[k]?.label || k;
                                  const u = unitFor(k);
                                  return groups.map(g => `${g.qty}× ${label}: ${g.hours}${u}`);
                                });
                                return <div key={si}>{prefix}{items.join(" · ")}</div>;
                              })
                            ) : (
                              // Legacy flat format
                              Object.entries(job.hoursWorked).map(([k, v]) => {
                                const label = JOB_EQUIPMENT_BY_TYPE[job.type]?.[k]?.label || k;
                                const u = unitFor(k);
                                if (Array.isArray(v) && v.length > 0 && typeof v[0] === "object") {
                                  return v.map(g => `${g.qty}× ${label}: ${g.hours}${u}`).join(" · ");
                                }
                                if (Array.isArray(v)) return v.map((h, i) => `${label}${v.length > 1 ? ` #${i+1}` : ""}: ${h}${u}`).join(" · ");
                                return `${label}: ${v}${u}`;
                              }).join(" · ")
                            ); })()}
                          </div>
                        )}
                        {job.notes && <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 4 }}>{job.notes}</div>}
                        {invoiceStatus?.jobId === job.id && (
                          <div style={{
                            marginTop: 6, fontSize: 11, fontFamily: "JetBrains Mono",
                            padding: "6px 10px", borderRadius: 6,
                            color: invoiceStatus.status === "error"   ? IPS_DANGER
                                 : invoiceStatus.status === "success" ? IPS_SUCCESS
                                 : IPS_ACCENT,
                            background: invoiceStatus.status === "error"   ? `${IPS_DANGER}12`
                                       : invoiceStatus.status === "success" ? `${IPS_SUCCESS}12`
                                       : `${IPS_ACCENT}12`,
                            border: `1px solid ${
                              invoiceStatus.status === "error"   ? IPS_DANGER
                              : invoiceStatus.status === "success" ? IPS_SUCCESS
                              : IPS_ACCENT}33`,
                          }}>{invoiceStatus.msg}</div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 4, position: "relative", zIndex: 2 }}>
                        {job.completed && job.hoursWorked && (() => {
                          // Block when prerequisites are missing — show the reason as a tooltip.
                          const missing = [];
                          if (!job.po_number) missing.push("PO number");
                          const blocked = missing.length > 0;
                          const isWorking = invoiceStatus?.jobId === job.id && invoiceStatus.status === "working";
                          return (
                            <button
                              onClick={(e) => { e.stopPropagation(); if (!blocked && !isWorking) startInvoice(job); }}
                              disabled={blocked || isWorking}
                              title={blocked ? `Edit job to set: ${missing.join(", ")}` : ""}
                              style={{
                                background: blocked ? "rgba(255,255,255,0.04)" : "rgba(87,181,200,0.12)",
                                border: `1px solid ${blocked ? BORDER : "rgba(87,181,200,0.35)"}`,
                                borderRadius: 6, padding: "4px 10px",
                                cursor: blocked || isWorking ? "not-allowed" : "pointer",
                                color: blocked ? TEXT_DIM : IPS_ACCENT,
                                fontSize: 11, fontWeight: 600,
                                fontFamily: "'Satoshi', 'Inter', sans-serif",
                                opacity: isWorking ? 0.6 : 1,
                              }}
                            >{isWorking ? "Working…" : "Invoice"}</button>
                          );
                        })()}
                        <button onClick={() => openEditJob(job)} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: TEXT_DIM, fontSize: 11, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>Edit</button>
                        <button onClick={() => deleteJob(job.id)} style={{ background: "rgba(239,68,68,0.08)", border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: IPS_DANGER, fontSize: 11, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>Del</button>
                      </div>
                    </div>
                  </Card>
                  );
                })}
              </div>
            ))}

            {/* ═══ BINDINGAR SECTION ═══ */}
            {(() => {
              const bindingarJobs = jobs.filter(j => j.type === "bindingar");
              const bjt = JOB_TYPES.bindingar;
              const [bYear, bMonthNum] = bindingarMonth.split("-").map(Number);
              const monthLabel = `${BINDINGAR_MONTH_NAMES[bMonthNum - 1]} ${bYear}`;
              return (
                <div style={{ marginTop: 32 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                    <button onClick={() => setBindingarCollapsed(c => !c)} style={{
                      background: "none", border: "none", cursor: "pointer", padding: 0,
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <span style={{ fontSize: 12, color: TEXT_DIM, fontFamily: "JetBrains Mono", display: "inline-block", width: 12, textAlign: "center" }}>{bindingarCollapsed ? "▶" : "▼"}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: bjt.color, fontFamily: "'Satoshi', 'Inter', sans-serif", letterSpacing: 0.5 }}>Bindingar</span>
                      <span style={{ fontSize: 12, color: TEXT_DIM }}>{bindingarJobs.length} job{bindingarJobs.length !== 1 ? "s" : ""}</span>
                    </button>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <button onClick={openNewBindingarJob} style={{
                        padding: "6px 14px", borderRadius: 8, cursor: "pointer", background: bjt.color, border: "none", color: "#fff",
                        fontSize: 12, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', sans-serif",
                      }}>+ New Bindingar</button>
                      <select value={bindingarMonth} onChange={e => setBindingarMonth(e.target.value)} style={{ ...inputStyle, padding: "6px 10px", width: "auto", cursor: "pointer", colorScheme: "dark", backgroundColor: "#112F45" }}>
                        {[5, 6, 7, 8, 9, 10].map(m => {
                          const val = `2026-${String(m).padStart(2, "0")}`;
                          return <option key={val} value={val} style={{ background: "#112F45", color: TEXT }}>{BINDINGAR_MONTH_NAMES[m - 1]} 2026</option>;
                        })}
                      </select>
                      <button onClick={() => generateBindingarInvoice(bindingarJobs, bYear, bMonthNum - 1)} style={{
                        padding: "6px 14px", borderRadius: 8, cursor: "pointer", background: "rgba(20,184,166,0.12)", border: `1px solid ${bjt.color}`, color: bjt.color,
                        fontSize: 12, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', sans-serif",
                      }}>Generate {monthLabel} invoice</button>
                    </div>
                  </div>
                  {!bindingarCollapsed && (bindingarJobs.length === 0 ? (
                    <div style={{ padding: 20, textAlign: "center", fontSize: 13, color: TEXT_DIM, background: "rgba(255,255,255,0.02)", border: `1px dashed ${BORDER}`, borderRadius: 8 }}>
                      No Bindingar jobs yet.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {[...bindingarJobs].sort((a, b) => (a.date || "").localeCompare(b.date || "")).map(job => (
                        <Card key={job.id} style={{ padding: "10px 14px", borderLeft: `4px solid ${bjt.color}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2, flexWrap: "wrap" }}>
                                <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 700, color: TEXT }}>{fmtDate(job.date)}</span>
                                {getJobStartTime(job) && <span style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: TEXT_DIM }}>{getJobStartTime(job)}</span>}
                                {job.ship && <span style={{ fontSize: 12, fontWeight: 600, color: IPS_ACCENT, background: `${IPS_ACCENT}15`, padding: "1px 8px", borderRadius: 4 }}>{job.ship}</span>}
                                {(() => { const berth = getBerthForShip(job.ship, job.date); return berth ? <span style={{ fontSize: 12, fontWeight: 600, color: bjt.color, background: `${bjt.color}15`, padding: "1px 8px", borderRadius: 4 }}>{berth}</span> : null; })()}
                              </div>
                              <div style={{ fontSize: 12, color: TEXT, fontFamily: "JetBrains Mono" }}>{fmtJobEquipment(job)}</div>
                            </div>
                            <button onClick={() => openEditJob(job)} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: TEXT_DIM, fontSize: 11, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>Edit</button>
                            <button onClick={() => deleteJob(job.id)} style={{ background: "rgba(239,68,68,0.08)", border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: IPS_DANGER, fontSize: 11, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>Del</button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Recently Deleted */}
            {deletedJobs.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <button onClick={() => setShowDeleted(d => !d)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "6px 0", color: TEXT_DIM, fontSize: 12, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>
                  <span style={{ fontSize: 10 }}>{showDeleted ? "▾" : "▸"}</span>
                  Recently Deleted ({deletedJobs.length})
                </button>
                {showDeleted && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                    {deletedJobs.map(job => {
                      const jt = JOB_TYPES[job.type] || JOB_TYPES.provisions;
                      return (
                        <Card key={job.id} style={{ padding: "10px 14px", opacity: 0.6, borderLeft: `4px solid ${BORDER}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: jt.color, background: `${jt.color}15`, padding: "1px 8px", borderRadius: 4, textTransform: "uppercase", fontFamily: "JetBrains Mono" }}>{jt.label}</span>
                                <span style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: TEXT_DIM }}>{fmtDate(job.date)}</span>
                                {job.ship && <span style={{ fontSize: 11, color: TEXT_DIM }}>{job.ship}</span>}
                              </div>
                              <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>{fmtJobEquipment(job)}</div>
                              <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 2, fontFamily: "JetBrains Mono", opacity: 0.6 }}>Deleted {new Date(job.deletedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                            </div>
                            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                              <button onClick={() => restoreJob(job.id)} style={{ background: "rgba(34,197,94,0.08)", border: `1px solid rgba(34,197,94,0.2)`, borderRadius: 6, padding: "4px 12px", cursor: "pointer", color: IPS_SUCCESS, fontSize: 11, fontWeight: 500, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>Restore</button>
                              <button onClick={() => permanentDeleteJob(job.id)} style={{ background: "rgba(239,68,68,0.08)", border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: IPS_DANGER, fontSize: 11, fontFamily: "'Satoshi', 'Inter', sans-serif" }}>Permanent</button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>)}

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

            // Build jobs map by date
            const jobsByDate = {};
            jobs.forEach(j => {
              if (j.date) {
                if (!jobsByDate[j.date]) jobsByDate[j.date] = [];
                jobsByDate[j.date].push(j);
              }
            });

            // Build pending-order map. Rules:
            //   - Reykjavík: SDK lines OR directly-contracted lines.
            //   - Akureyri: SDK lines only (direct contracts don't cover AK work).
            //   - Bindingar jobs do NOT count as ordering the ship — Bindingar
            //     is mooring (a service to the port), not to the ship — so a
            //     ship with only a Bindingar job logged still shows as pending.
            const sdkSet = new Set(SDK_LINES);
            const directSet = new Set(DIRECT_CONTRACT_LINES);
            const jobDatesByShip = new Map();
            jobs.forEach(j => {
              if (j.type === "bindingar") return;
              const sn = extractShipName(j.ship);
              if (!sn || !j.date) return;
              if (!jobDatesByShip.has(sn)) jobDatesByShip.set(sn, new Set());
              jobDatesByShip.get(sn).add(j.date);
            });
            const monthStart = `${year}-${String(monthIdx + 1).padStart(2, "0")}-01`;
            const monthEnd = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
            const pendingByDate = {};
            SHIPS.forEach(s => {
              const isAK = s.port === "AK";
              const orderable = isAK ? sdkSet.has(s.line) : (sdkSet.has(s.line) || directSet.has(s.line));
              if (!orderable) return;
              const start = s.date;
              const end = s.endDate || s.date;
              if (end < monthStart || start > monthEnd) return; // visit not in this month
              const shipJobDates = jobDatesByShip.get(s.ship);
              let alreadyOrdered = false;
              if (shipJobDates) {
                for (const d of shipJobDates) {
                  if (d >= start && d <= end) { alreadyOrdered = true; break; }
                }
              }
              if (alreadyOrdered) return;
              const cursor = new Date(start + "T00:00:00");
              const endDt = new Date(end + "T00:00:00");
              while (cursor <= endDt) {
                const dateStr = cursor.toISOString().slice(0, 10);
                if (dateStr >= monthStart && dateStr <= monthEnd) {
                  if (!pendingByDate[dateStr]) pendingByDate[dateStr] = [];
                  pendingByDate[dateStr].push({ ship: s.ship, port: s.port || "REY", line: s.line });
                }
                cursor.setDate(cursor.getDate() + 1);
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
                      <div key={d} style={{ textAlign: "center", fontSize: "clamp(10px, 0.9vw, 13px)", textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", padding: "6px 0" }}>{d}</div>
                    ))}
                  </div>
                  {weeks.map((wk, wi) => (
                    <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                      {wk.map((day, di) => {
                        if (day === null) return <div key={di} style={{ minHeight: "clamp(90px, 14vh, 180px)" }} />;
                        const dateStr = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const dayTasks = tasksByDate[dateStr] || [];
                        const dayJobs = jobsByDate[dateStr] || [];
                        const dayPending = pendingByDate[dateStr] || [];
                        const totalItems = dayTasks.length + dayJobs.length + dayPending.length;
                        const today = new Date().toISOString().split("T")[0];
                        const isToday = dateStr === today;
                        const isWeekend = di >= 5;
                        return (
                          <div key={di} style={{
                            minHeight: "clamp(90px, 14vh, 180px)", borderRadius: 8, padding: 8, position: "relative",
                            background: isToday ? "rgba(87,181,200,0.06)" : totalItems >= 3 ? "rgba(245,158,11,0.04)" : isWeekend ? "rgba(255,255,255,0.008)" : "rgba(255,255,255,0.015)",
                            border: `1px solid ${isToday ? IPS_ACCENT + "50" : BORDER}`,
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <span style={{
                                fontFamily: "JetBrains Mono", fontSize: "clamp(12px, 1.1vw, 17px)", fontWeight: 700,
                                color: isToday ? IPS_ACCENT : totalItems > 0 ? TEXT : TEXT_DIM,
                                minWidth: 22, height: 24, padding: "0 6px", display: "flex", alignItems: "center", justifyContent: "center",
                                borderRadius: 5, background: isToday ? "rgba(87,181,200,0.15)" : "transparent",
                              }}>{day}</span>
                              {totalItems > 0 && (
                                <span style={{ fontFamily: "JetBrains Mono", fontSize: "clamp(9px, 0.85vw, 12px)", fontWeight: 600, color: totalItems >= 3 ? IPS_WARN : TEXT_DIM, background: totalItems >= 3 ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.05)", padding: "1px 5px", borderRadius: 3 }}>{totalItems}</span>
                              )}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              {dayJobs.slice(0, 2).map(j => {
                                const isAK = j.port === "AK";
                                const isBindingar = j.type === "bindingar";
                                const jc = isAK ? PORTS.AK.color : (JOB_TYPES[j.type] || JOB_TYPES.provisions).color;
                                const badge = isAK ? "AK" : isBindingar ? "BIND" : (JOB_TYPES[j.type] || JOB_TYPES.provisions).label.split(" ")[0].toUpperCase();
                                return (
                                <div key={j.id} onClick={() => openEditJob(j)} style={{
                                  display: "flex", alignItems: "center", gap: 4, cursor: "pointer",
                                  background: j.completed ? "rgba(255,255,255,0.02)" : `${jc}0D`,
                                  border: `1px solid ${jc}25`, borderRadius: 4, padding: "3px 6px",
                                  borderLeft: `3px solid ${jc}`, opacity: j.completed ? 0.5 : 1,
                                }}>
                                  <span style={{ fontSize: "clamp(8px, 0.75vw, 11px)", fontFamily: "JetBrains Mono", fontWeight: 700, color: jc, flexShrink: 0 }}>{badge}</span>
                                  <span style={{ fontSize: "clamp(9px, 0.85vw, 13px)", color: j.completed ? TEXT_DIM : TEXT, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{getJobStartTime(j) ? getJobStartTime(j) + " " : ""}{j.ship || ""}</span>
                                  {j.ship && (
                                    <button onClick={(e) => { e.stopPropagation(); openNewJobForShip(extractShipName(j.ship), j.date, j.port || "REY"); }} title={`Add another order for ${extractShipName(j.ship)}`} style={{
                                      flexShrink: 0, background: "rgba(255,255,255,0.06)", border: `1px solid ${jc}40`, borderRadius: 3,
                                      color: jc, cursor: "pointer", padding: "0 5px", fontSize: "clamp(10px, 0.9vw, 13px)", fontWeight: 700,
                                      lineHeight: 1.2, fontFamily: "JetBrains Mono",
                                    }}>+</button>
                                  )}
                                </div>
                                );
                              })}
                              {dayPending.slice(0, Math.max(0, 4 - dayJobs.slice(0, 2).length)).map((p, pi) => (
                                <div key={`pending-${pi}`} onClick={() => openNewJobForShip(p.ship, dateStr, p.port)} title={`Order missing for ${p.ship} — click to create`} style={{
                                  display: "flex", alignItems: "center", gap: 4, cursor: "pointer",
                                  background: "rgba(245,158,11,0.06)",
                                  border: `1px dashed ${IPS_WARN}80`, borderRadius: 4, padding: "3px 6px",
                                }}>
                                  <span style={{ fontSize: "clamp(8px, 0.75vw, 11px)", fontFamily: "JetBrains Mono", fontWeight: 700, color: IPS_WARN, flexShrink: 0 }}>ORDER</span>
                                  <span style={{ fontSize: "clamp(9px, 0.85vw, 13px)", color: TEXT, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{p.ship}</span>
                                </div>
                              ))}
                              {dayTasks.slice(0, Math.max(1, 4 - dayJobs.length - dayPending.length)).map(t => {
                                const p = WS_PROJECTS[t.project] || WS_PROJECTS.general;
                                const a = WS_TEAM[t.assignee] || WS_TEAM.jon;
                                return (
                                  <div key={t.id} onClick={() => openEditTask(t)} style={{
                                    display: "flex", alignItems: "center", gap: 4, cursor: "pointer",
                                    background: t.completed ? "rgba(255,255,255,0.02)" : `${p.color}0D`,
                                    border: `1px solid ${p.color}25`, borderRadius: 4, padding: "3px 6px",
                                    borderLeft: `3px solid ${p.color}`, opacity: t.completed ? 0.5 : 1,
                                  }}>
                                    <span style={{ width: 16, height: 16, borderRadius: 8, background: `${a.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "clamp(8px, 0.7vw, 10px)", fontFamily: "JetBrains Mono", fontWeight: 700, color: a.color, flexShrink: 0 }}>{a.initials}</span>
                                    <span style={{ fontSize: "clamp(9px, 0.85vw, 13px)", color: t.completed ? TEXT_DIM : TEXT, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, textDecoration: t.completed ? "line-through" : "none" }}>{t.title}</span>
                                  </div>
                                );
                              })}
                              {totalItems > 4 && <div style={{ fontSize: "clamp(9px, 0.8vw, 12px)", color: TEXT_DIM, textAlign: "center" }}>+{totalItems - 4} more</div>}
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
