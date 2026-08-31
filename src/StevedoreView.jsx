import { useEffect, useMemo, useState } from "react";
import { supabase, SUPABASE_CONFIGURED } from "./supabase.js";
import {
  JOB_TYPES, JOB_EQUIPMENT_BY_TYPE, PORTS,
  IPS_ACCENT, SURFACE, BORDER, TEXT, TEXT_DIM,
  extractShipName, getBerthForShip,
} from "./constants.js";
import ipsLogo from "./assets/ips-logo-white.png";

// ─── STEVEDORE OVERVIEW ──────────────────────────────────────────────────────
// Read-only phone view for the stevedore: a week of big day squares (jobs +
// bindingar counts), tap a day to see every job with times, ship, berth and
// resources. Reached via "?view=stevedore" with no PIN — keep it read-only
// and free of rates, agents or anything billing-related.

const BG = "#081E2C";
const BINDINGAR_COLOR = JOB_TYPES.bindingar.color;
const FONT = "'Satoshi', 'Inter', sans-serif";

// Merged equipment label map (job's own type map wins, others fill gaps) so a
// legacy key logged under a different type still renders with a real name.
const ALL_EQUIPMENT = Object.values(JOB_EQUIPMENT_BY_TYPE).reduce(
  (acc, typeMap) => ({ ...typeMap, ...acc }), {}
);
// The whole view is in Romanian for the stevedore — this map renames the
// resources; anything not listed falls back to the app's English label.
// Endamaður is a person, so flag him human to land under the Oameni header.
const RO_EQUIPMENT = {
  forklift:             { label: "Stivuitor", plural: "Stivuitoare" },
  forklift_op:          { label: "Operator stivuitor" },
  telescopic:           { label: "Stivuitor telescopic" },
  telescopic_op:        { label: "Operator stivuitor" },
  foreman:              { label: "Șef de echipă" },
  stevedore:            { label: "Docher", plural: "Docheri" },
  porter:               { label: "Bagajist", plural: "Bagajiști" },
  ramp:                 { label: "Rampă de container" },
  crane:                { label: "Macara" },
  crane_op:             { label: "Operator macara" },
  conveyor_belt:        { label: "Bandă transportoare" },
  conveyor_op:          { label: "Operator bandă" },
  luggage_van:          { label: "Dubă de bagaje" },
  luggage_cage:         { label: "Cușcă pentru bagaje" },
  pallet_cage:          { label: "Cușcă pentru paleți" },
  pallet_jack_manual:   { label: "Transpalet manual" },
  pallet_jack_electric: { label: "Transpalet electric" },
  cherry_picker_22m:    { label: "Nacelă 22m" },
  cherry_picker_25m:    { label: "Nacelă 25m" },
  cherry_picker_40m:    { label: "Nacelă 40m" },
  cherry_picker_60m:    { label: "Nacelă 60m" },
  cherry_picker_op:     { label: "Operator nacelă" },
  endamadur:            { label: "Om", plural: "Oameni", human: true },
  lyftari:              { label: "Platformă" },
};

// Job type names in Romanian ("bindingar" is his "parking").
const RO_TYPES = {
  provisions:    "Provizii",
  waste:         "Deșeuri",
  turnaround:    "Bagaje",
  cherry_picker: "Nacelă",
  special:       "Special",
  bindingar:     "Parcare",
};

const equipDef = (jobType, key) => {
  const def = JOB_EQUIPMENT_BY_TYPE[jobType]?.[key] || ALL_EQUIPMENT[key] || { label: key };
  return RO_EQUIPMENT[key] ? { ...def, ...RO_EQUIPMENT[key] } : def;
};

const toIso = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const addDays = (iso, n) => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return toIso(d);
};
// Romanian locale gives lowercase day/month names — capitalize for display.
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const weekdayName = (iso) => cap(new Date(iso + "T12:00:00").toLocaleDateString("ro-RO", { weekday: "long" }));
const shortDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("ro-RO", { day: "numeric", month: "short" });

// Earliest shift start time, for sorting jobs within a day. Jobs without a
// time sort last.
const firstStart = (job) => {
  const times = (job.shifts || []).map((s) => s.startTime).filter(Boolean);
  return times.length ? times.sort()[0] : "99:99";
};

const isBindingar = (j) => j.type === "bindingar";
// Work the stevedore cares about: real resource jobs. Agency is boarding-agent
// paperwork and no_job is a calendar marker — neither is stevedore work.
const isStevedoreJob = (j) => !isBindingar(j) && j.type !== "agency" && j.type !== "no_job";

export default function StevedoreView() {
  const todayIso = toIso(new Date());
  const [jobs, setJobs] = useState([]);
  const [loadState, setLoadState] = useState("loading"); // loading | ok | error
  const [weekOffset, setWeekOffset] = useState(0); // 0 = next 7 days, 1 = the 7 after
  const [openDay, setOpenDay] = useState(null);

  const loadJobs = async () => {
    if (!SUPABASE_CONFIGURED) { setLoadState("error"); return; }
    try {
      const { data, error } = await supabase
        .from("jobs").select("*")
        .gte("date", todayIso)
        .lte("date", addDays(todayIso, 13))
        .order("date", { ascending: true });
      if (error || !Array.isArray(data)) { setLoadState("error"); return; }
      setJobs(data.filter((r) => !r.deleted_at).map((r) => {
        const safe = (v, fb) => {
          if (typeof v !== "string") return v ?? fb;
          try { return JSON.parse(v); } catch { return fb; }
        };
        return { ...r, shifts: safe(r.shifts, []) || [] };
      }));
      setLoadState("ok");
    } catch {
      setLoadState("error");
    }
  };

  useEffect(() => {
    loadJobs();
    // Refresh whenever he re-opens the phone / switches back to the tab, so
    // the plan is never stale without him having to know about reloading.
    const onVisible = () => { if (document.visibilityState === "visible") loadJobs(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const jobsByDate = useMemo(() => {
    const map = {};
    for (const j of jobs) {
      if (!j.date) continue;
      (map[j.date] = map[j.date] || []).push(j);
    }
    for (const d of Object.keys(map)) map[d].sort((a, b) => firstStart(a).localeCompare(firstStart(b)));
    return map;
  }, [jobs]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(todayIso, weekOffset * 7 + i)),
    [todayIso, weekOffset]
  );

  // "Finish" button: write the reported end time onto the job row so the
  // office completion flows can suggest it. Returns true when the DB took it.
  const reportFinish = async (jobId, time) => {
    try {
      const { data, error } = await supabase
        .from("jobs").update({ stevedore_end: time }).eq("id", jobId);
      if (error || !data?.length) return false;
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, stevedore_end: time } : j)));
      return true;
    } catch {
      return false;
    }
  };

  if (openDay) {
    return (
      <DayScreen
        date={openDay}
        isToday={openDay === todayIso}
        dayJobs={jobsByDate[openDay] || []}
        onBack={() => setOpenDay(null)}
        onFinish={reportFinish}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: FONT, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 4px 14px" }}>
        <img src={ipsLogo} alt="IPS" style={{ height: 30 }} />
        <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_DIM }}>
          {weekOffset === 0 ? "Următoarele 7 zile" : "Săptămâna viitoare"}
        </div>
      </div>

      {loadState === "error" && (
        <div style={{ background: "#7F1D1D", borderRadius: 12, padding: 16, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
          Planul nu s-a putut încărca. Verifică internetul și încearcă din nou.
          <button onClick={loadJobs} style={{ ...bigBtn, marginTop: 12, background: "rgba(255,255,255,0.15)", border: "none" }}>
            Încearcă din nou
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {days.map((d) => (
          <DaySquare
            key={d}
            date={d}
            isToday={d === todayIso}
            dayJobs={jobsByDate[d] || []}
            loading={loadState === "loading"}
            onClick={() => setOpenDay(d)}
          />
        ))}
        <button
          onClick={() => setWeekOffset(weekOffset === 0 ? 1 : 0)}
          style={{
            ...squareBase, cursor: "pointer", border: `2px dashed ${BORDER}`,
            background: "transparent", color: IPS_ACCENT, fontFamily: FONT,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <div style={{ fontSize: 30, lineHeight: 1 }}>{weekOffset === 0 ? "→" : "←"}</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>
            {weekOffset === 0 ? "Săptămâna viitoare" : "Înapoi la această săptămână"}
          </div>
        </button>
      </div>
    </div>
  );
}

const squareBase = {
  borderRadius: 14, padding: 14, minHeight: 128,
  border: `1px solid ${BORDER}`, background: SURFACE,
  textAlign: "left",
};

const bigBtn = {
  width: "100%", padding: "14px 16px", borderRadius: 12, cursor: "pointer",
  color: TEXT, fontSize: 17, fontWeight: 800, fontFamily: FONT,
};

function CountRow({ color, count, label }) {
  const off = count === 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: off ? 0.35 : 1 }}>
      <div style={{ width: 12, height: 12, borderRadius: 4, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 19, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{count}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_DIM }}>{label}</span>
    </div>
  );
}

function DaySquare({ date, isToday, dayJobs, loading, onClick }) {
  const nJobs = dayJobs.filter(isStevedoreJob).length;
  const nBind = dayJobs.filter(isBindingar).length;
  const empty = nJobs === 0 && nBind === 0;
  return (
    <button
      onClick={onClick}
      style={{
        ...squareBase, cursor: "pointer", fontFamily: FONT, color: TEXT,
        border: isToday ? `2px solid ${IPS_ACCENT}` : squareBase.border,
        display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 10,
      }}
    >
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.15 }}>
          {isToday ? "Azi" : weekdayName(date)}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: isToday ? IPS_ACCENT : TEXT_DIM }}>
          {isToday ? weekdayName(date) + " " : ""}{shortDate(date)}
        </div>
      </div>
      {loading ? (
        <div style={{ fontSize: 14, color: TEXT_DIM }}>Se încarcă…</div>
      ) : empty ? (
        <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_DIM, opacity: 0.6 }}>Zi liberă</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <CountRow color={IPS_ACCENT} count={nJobs} label={nJobs === 1 ? "lucrare" : "lucrări"} />
          <CountRow color={BINDINGAR_COLOR} count={nBind} label={nBind === 1 ? "parcare" : "parcări"} />
        </div>
      )}
    </button>
  );
}

// ─── DAY DETAIL ──────────────────────────────────────────────────────────────

function DayScreen({ date, isToday, dayJobs, onBack, onFinish }) {
  const work = dayJobs.filter(isStevedoreJob);
  const bindingar = dayJobs.filter(isBindingar);
  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: FONT, paddingBottom: 30 }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 5, background: BG,
        borderBottom: `1px solid ${BORDER}`, padding: "12px 14px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button onClick={onBack} style={{
          ...bigBtn, width: "auto", padding: "10px 16px",
          background: SURFACE, border: `1px solid ${BORDER}`,
        }}>
          ← Înapoi
        </button>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1 }}>
            {isToday ? "Azi" : weekdayName(date)}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_DIM }}>
            {isToday ? weekdayName(date) + ", " : ""}{shortDate(date)}
          </div>
        </div>
      </div>

      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        {work.length === 0 && bindingar.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: TEXT_DIM, fontSize: 20, fontWeight: 700 }}>
            Nicio lucrare planificată în această zi.
          </div>
        )}

        {work.map((j) => <JobCard key={j.id} job={j} onFinish={onFinish} />)}

        {bindingar.length > 0 && (
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: BINDINGAR_COLOR, marginTop: work.length ? 8 : 0 }}>
            Parcări
          </div>
        )}
        {bindingar.map((j) => <JobCard key={j.id} job={j} />)}
      </div>
    </div>
  );
}

function fmtTime(shift) {
  if (!shift.startTime) return "Ora nestabilită";
  return shift.startTime + (shift.nextDay ? " (+1 zi)" : "");
}

// One shift's resources split into people and equipment lines.
function shiftLines(jobType, shift) {
  const people = [], equipment = [];
  let peopleTotal = 0;
  for (const [key, qty] of Object.entries(shift.equipment || {})) {
    const n = Number(qty) || 0;
    if (n <= 0) continue;
    const def = equipDef(jobType, key);
    if (def.hidden) continue;
    const label = n > 1 && def.plural ? def.plural : def.label;
    (def.human ? people : equipment).push(`${n} × ${label}`);
    if (def.human) peopleTotal += n;
  }
  return { people, equipment, peopleTotal };
}

function ResourceBlock({ title, items, color, total }) {
  if (!items.length) return null;
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
        <span>{title}</span>
        {total != null && (
          <span style={{ background: `${color}22`, borderRadius: 6, padding: "2px 8px", letterSpacing: 0.5 }}>
            {total} în total
          </span>
        )}
      </div>
      {items.map((line, i) => (
        <div key={i} style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.5 }}>{line}</div>
      ))}
    </div>
  );
}

// Finish flow on a job card: tap Finish → big time picker (prefilled with
// the time right now) → Send. The time goes to the office as a suggestion
// for the job's end time; the office still confirms the hours in the app.
function FinishSection({ job, onFinish }) {
  const [picking, setPicking] = useState(false);
  const [time, setTime] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  if (job.completed) return null;

  const openPicker = () => {
    setTime(job.stevedore_end || new Date().toTimeString().slice(0, 5));
    setFailed(false);
    setPicking(true);
  };

  const send = async () => {
    if (!time || sending) return;
    setSending(true);
    setFailed(false);
    const ok = await onFinish(job.id, time);
    setSending(false);
    if (ok) setPicking(false);
    else setFailed(true);
  };

  if (!picking) {
    return (
      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
        {job.stevedore_end ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, fontSize: 17, fontWeight: 800, color: "#22C55E" }}>
              ✓ Terminat la {job.stevedore_end}
            </div>
            <button onClick={openPicker} style={{ ...bigBtn, width: "auto", padding: "10px 16px", background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_DIM, fontSize: 15 }}>
              Schimbă
            </button>
          </div>
        ) : (
          <button onClick={openPicker} style={{ ...bigBtn, background: "#166534", border: "1px solid #22C55E" }}>
            Termină lucrarea
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "#22C55E" }}>
        La ce oră s-a terminat lucrarea?
      </div>
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        style={{
          width: "100%", padding: "12px 14px", borderRadius: 12, boxSizing: "border-box",
          background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, colorScheme: "dark",
          color: TEXT, fontSize: 26, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
        }}
      />
      {failed && (
        <div style={{ fontSize: 15, fontWeight: 700, color: "#FCA5A5" }}>
          Nu s-a trimis. Verifică internetul și încearcă din nou.
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setPicking(false)} style={{ ...bigBtn, flex: 1, background: "transparent", border: `1px solid ${BORDER}`, color: TEXT_DIM }}>
          Anulează
        </button>
        <button onClick={send} disabled={sending} style={{ ...bigBtn, flex: 2, background: "#166534", border: "1px solid #22C55E", opacity: sending ? 0.6 : 1 }}>
          {sending ? "Se trimite…" : "Trimite ora"}
        </button>
      </div>
    </div>
  );
}

function JobCard({ job, onFinish }) {
  const baseType = JOB_TYPES[job.type] || { label: job.type, color: TEXT_DIM };
  const type = { ...baseType, label: RO_TYPES[job.type] || baseType.label };
  const ship = extractShipName(job.ship);
  const berth = getBerthForShip(job.ship, job.date);
  const port = PORTS[job.port]?.longLabel || job.port;
  const shifts = job.shifts?.length ? job.shifts : [{}];

  return (
    <div style={{
      background: SURFACE, borderRadius: 14, border: `1px solid ${BORDER}`,
      borderLeft: `6px solid ${type.color}`, padding: 16,
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase",
            color: type.color, background: `${type.color}22`, borderRadius: 6, padding: "3px 8px",
          }}>
            {type.label}
          </span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginTop: 6 }}>
          {ship || "Fără navă"}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: IPS_ACCENT, marginTop: 2 }}>
          {berth ? `${berth} · ${port}` : port}
        </div>
      </div>

      {shifts.map((s, i) => {
        const { people, equipment, peopleTotal } = shiftLines(job.type, s);
        return (
          <div key={i} style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontSize: 26, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
                {fmtTime(s)}
              </span>
              {shifts.length > 1 && (
                <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_DIM }}>Tura {i + 1}</span>
              )}
            </div>
            <ResourceBlock title="Oameni" items={people} color={IPS_ACCENT} total={peopleTotal} />
            <ResourceBlock title="Echipament" items={equipment} color={TEXT_DIM} />
            {!people.length && !equipment.length && (
              <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_DIM }}>Nicio resursă listată.</div>
            )}
          </div>
        );
      })}

      {job.notes && (
        <div style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "#F59E0B", marginBottom: 3 }}>
            Notă
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.45 }}>{job.notes}</div>
        </div>
      )}

      {onFinish && <FinishSection job={job} onFinish={onFinish} />}
    </div>
  );
}
