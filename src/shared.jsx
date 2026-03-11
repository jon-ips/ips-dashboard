import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { IPS_ACCENT, SURFACE, BORDER, TEXT, TEXT_DIM } from "./constants.js";

// ─── SVG ICONS (used across multiple modules) ────────────────────────────────
export const IconPlus = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
export const IconUpload = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>);
export const IconChevron = ({ down }) => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: down ? "rotate(0)" : "rotate(-90deg)", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>);
export const IconSync = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>);

// ─── SIDEBAR ICONS ───────────────────────────────────────────────────────────
export const IconChart = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>);
export const IconClipboard = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>);
export const IconLogout = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
export const IconMenu = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>);
export const IconX = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
export const IconFinance = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);

// ─── SHARED UI COMPONENTS ───────────────────────────────────────────────────
export const Card = ({ children, style, onClick }) => (<div onClick={onClick} className="card" style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", transition: "border-color 0.2s, box-shadow 0.2s", ...style }}>{children}</div>);
export const SL = ({ children }) => (<div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 16, fontWeight: 500 }}>{children}</div>);

export const CTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (<div style={{ background: "#0C2C40", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: TEXT }}><div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>{payload.map((p, i) => (<div key={i} style={{ color: p.color, display: "flex", gap: 8 }}><span>{p.name}:</span><span style={{ fontFamily: "JetBrains Mono", fontWeight: 600 }}>{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span></div>))}</div>);
};

export const PieCard = ({ data, sharePercent, title }) => (
  <Card>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 8 }}>{title}</div>
      <div style={{ position: "relative" }}>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart><Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">{data.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie></PieChart>
        </ResponsiveContainer>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: IPS_ACCENT, fontFamily: "JetBrains Mono" }}>{sharePercent}%</div>
          <div style={{ fontSize: 9, color: TEXT_DIM }}>IPS</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 4 }}>
        {data.map((d, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: TEXT_DIM }}><div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />{d.name}: <span style={{ fontFamily: "JetBrains Mono", color: d.color === IPS_ACCENT ? IPS_ACCENT : TEXT_DIM, fontWeight: 600 }}>{d.value}</span></div>))}
      </div>
    </div>
  </Card>
);

export const FilterPill = ({ label, active, color, onClick }) => (
  <button onClick={onClick} style={{
    background: active ? `${color || IPS_ACCENT}18` : "rgba(255,255,255,0.03)",
    border: `1px solid ${active ? (color || IPS_ACCENT) : BORDER}`,
    borderRadius: 6, padding: "5px 12px", cursor: "pointer",
    color: active ? (color || IPS_ACCENT) : TEXT_DIM,
    fontSize: 11, fontWeight: 600, fontFamily: "'Satoshi', 'Inter', sans-serif", transition: "all 0.2s",
  }}>{label}</button>
);

export const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 8,
  background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`,
  color: TEXT, fontSize: 13, fontFamily: "'Satoshi', 'Inter', sans-serif", outline: "none",
};

// ─── UTILITY FUNCTIONS ──────────────────────────────────────────────────────
export const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
export const fmtDateRange = (s) => {
  const start = fmtDate(s.date);
  if (!s.endDate) return start;
  const end = new Date(s.endDate + "T12:00:00").toLocaleDateString("en-GB", { day: "2-digit" });
  return `${start}–${end}`;
};
