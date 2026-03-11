import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase, SUPABASE_URL, SUPABASE_CONFIGURED, supabaseHeaders } from "./supabase.js";
import {
  IPS_ACCENT, IPS_WARN, IPS_DANGER, IPS_SUCCESS, IPS_BLUE,
  SURFACE, BORDER, TEXT, TEXT_DIM, PROSPECT_COLOR,
  WS_TEAM, WS_PROJECTS, WS_PRIORITIES, generateId,
} from "./constants.js";
import { Card, SL, FilterPill, inputStyle, fmtDate } from "./shared.jsx";

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
