import { useState, useEffect } from "react";
import { supabase, SUPABASE_CONFIGURED } from "./supabase.js";
import {
  SHIPS, IPS_BLUE, IPS_ACCENT, IPS_DANGER, IPS_SUCCESS,
  SURFACE, BORDER, TEXT, TEXT_DIM,
} from "./constants.js";
import {
  IconChart, IconClipboard, IconLogout, IconMenu, IconX, IconFinance,
} from "./shared.jsx";
import ipsLogoWhite from "./assets/ips-logo-white.png";
import MarketIntel from "./MarketIntel.jsx";
import Workspace from "./Workspace.jsx";
import CFOWorkspace from "./CFOWorkspace.jsx";

// ═══════════════════════════════════════════════════════════════════════════════
// IPS DASHBOARD — THIN SHELL
// ═══════════════════════════════════════════════════════════════════════════════

export default function IPSDashboard({ accessLevel = "team", onLogout }) {
  // ─── SUPABASE DATA LOADING ────────────────────────────────────────────────
  const [dbPortCalls, setDbPortCalls] = useState(null); // null = not loaded yet
  const [dbLoading, setDbLoading]     = useState(true);

  // Load port calls from Supabase on mount, fall back to hardcoded SHIPS
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) { setDbLoading(false); return; }
    (async () => {
      try {
        const { data, error } = await supabase
          .from("port_calls")
          .select("id,date,end_date,turnaround,pax,status,ships(name,cruise_lines(name))")
          .order("date", { ascending: true });
        if (!error && data && data.length > 0) {
          const mapped = data.map(pc => ({
            id: pc.id,
            date: pc.date,
            endDate: pc.end_date,
            line: pc.ships?.cruise_lines?.name || "Unknown",
            ship: pc.ships?.name || "Unknown",
            turnaround: pc.turnaround,
            pax: pc.pax,
            status: ["Holland America", "Seabourn", "Viking"].includes(pc.ships?.cruise_lines?.name) ? "contracted" : "other",
          }));
          setDbPortCalls(mapped);
        }
      } catch (e) { console.warn("Failed to load port calls from Supabase:", e); }
      finally { setDbLoading(false); }
    })();
  }, []);

  // Use DB data if loaded, otherwise fall back to hardcoded SHIPS
  const portCalls = dbPortCalls || SHIPS;

  // ─── NAVIGATION STATE ──────────────────────────────────────────────────────
  const [activeModule, setActiveModule] = useState("market");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState("overview");
  const [wsView, setWsView] = useState("tasks");
  const [cfoView, setCfoView] = useState("dashboard");

  // ─── CHILD → PARENT CALLBACKS ──────────────────────────────────────────────
  const [draftCount, setDraftCount] = useState(0);
  const [cfoStats, setCfoStats] = useState({ activeContracts: 0, paydayConnected: null });

  // ─── SIDEBAR COMPONENTS ────────────────────────────────────────────────────
  const SidebarNav = ({ label, active, onClick, badge }) => (
    <button onClick={() => { onClick(); setSidebarOpen(false); }} className="sidebar-nav" style={{
      background: active ? "rgba(87,181,200,0.1)" : "transparent",
      borderTop: "none", borderRight: "none", borderBottom: "none",
      borderLeft: active ? `3px solid ${IPS_ACCENT}` : "3px solid transparent",
      borderRadius: "0 6px 6px 0", padding: "9px 14px", cursor: "pointer",
      color: active ? TEXT : TEXT_DIM, fontSize: 13, fontWeight: active ? 600 : 400,
      transition: "all 0.15s", fontFamily: "'Satoshi', 'Inter', sans-serif",
      width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 8, marginBottom: 1,
    }}>{label}{badge}</button>
  );

  const ModuleTab = ({ label, mod, icon }) => (
    <button onClick={() => { setActiveModule(mod); setSidebarOpen(false); }} className="sidebar-nav" style={{
      background: activeModule === mod ? "rgba(87,181,200,0.1)" : "transparent",
      borderTop: "none", borderRight: "none", borderBottom: "none",
      borderLeft: activeModule === mod ? `3px solid ${IPS_ACCENT}` : "3px solid transparent",
      borderRadius: "0 6px 6px 0", padding: "10px 14px", cursor: "pointer",
      color: activeModule === mod ? TEXT : TEXT_DIM,
      fontSize: 13, fontWeight: activeModule === mod ? 700 : 500, transition: "all 0.15s",
      fontFamily: "'Satoshi', 'Inter', sans-serif", display: "flex", alignItems: "center", gap: 8,
      width: "100%", textAlign: "left", marginBottom: 2,
    }}>{icon}{label}</button>
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Satoshi', 'Inter', sans-serif", background: IPS_BLUE, color: TEXT, minHeight: "100vh", display: "flex" }}>
      <style>{`@import url('https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700,800,900&display=swap');@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:${IPS_BLUE}}::-webkit-scrollbar-thumb{background:${BORDER};border-radius:3px}*{box-sizing:border-box;margin:0;padding:0}.sidebar-nav:hover{background:rgba(87,181,200,0.06)!important}.card:hover{border-color:rgba(87,181,200,0.25)!important;box-shadow:0 4px 16px rgba(0,0,0,0.2)!important}button:active{transform:scale(0.98)}@media(max-width:768px){aside{position:fixed!important;left:-240px;transition:left 0.25s ease!important;z-index:200!important}aside.open{left:0!important}main{margin-left:0!important}.mobile-hamburger{display:flex!important}.mobile-close{display:flex!important}.mobile-overlay{display:block!important}.page-header{padding:16px 16px 12px!important}.page-content{padding:12px 16px!important}h1{font-size:18px!important}}`}</style>

      {/* Mobile overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 199, display: "none" }} className="mobile-overlay" />}

      {/* SIDEBAR */}
      <aside className={sidebarOpen ? "open" : ""} style={{ width: 240, minWidth: 240, background: SURFACE, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0, zIndex: 200 }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <img src={ipsLogoWhite} alt="Iceland Port Services" style={{ height: 28 }} />
          <button onClick={() => setSidebarOpen(false)} className="mobile-close" style={{ display: "none", background: "none", border: "none", color: TEXT_DIM, cursor: "pointer", padding: 4 }}><IconX /></button>
        </div>

        {/* Module selector */}
        <div style={{ padding: "0 0 0 0", marginBottom: 4 }}>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, color: TEXT_DIM, fontFamily: "JetBrains Mono", padding: "4px 16px 6px", fontWeight: 500 }}>Modules</div>
          <ModuleTab label="Market Intel" mod="market" icon={<IconChart />} />
          <ModuleTab label="Workspace" mod="workspace" icon={<IconClipboard />} />
          {accessLevel === "ceo" && <ModuleTab label="CFO Workspace" mod="cfo" icon={<IconFinance />} />}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: BORDER, margin: "8px 16px" }} />

        {/* Sub navigation */}
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, color: TEXT_DIM, fontFamily: "JetBrains Mono", padding: "8px 16px 6px", fontWeight: 500 }}>
            {activeModule === "market" ? "Views" : activeModule === "cfo" ? "Financial" : "Workspace"}
          </div>
          {activeModule === "market" ? (<>
            <SidebarNav label="Overview" active={activeView === "overview"} onClick={() => setActiveView("overview")} />
            <SidebarNav label="Calendar" active={activeView === "calendar"} onClick={() => setActiveView("calendar")} />
            <SidebarNav label="Crunch Calendar" active={activeView === "crunch"} onClick={() => setActiveView("crunch")} />
            <SidebarNav label="Simple Calendar" active={activeView === "simple"} onClick={() => setActiveView("simple")} />
            <SidebarNav label="Port Calendar" active={activeView === "portcal"} onClick={() => setActiveView("portcal")} />
            <SidebarNav label="Equipment" active={activeView === "equipment"} onClick={() => setActiveView("equipment")} />
            <SidebarNav label="Operations" active={activeView === "operations"} onClick={() => setActiveView("operations")} />
            <SidebarNav label="Fleet Intel" active={activeView === "fleet"} onClick={() => setActiveView("fleet")} />
          </>) : activeModule === "cfo" ? (<>
            <SidebarNav label="Dashboard" active={cfoView === "dashboard"} onClick={() => setCfoView("dashboard")} />
            <SidebarNav label="Contracts" active={cfoView === "contracts"} onClick={() => setCfoView("contracts")} badge={cfoStats.activeContracts > 0 ? (<span style={{ background: IPS_SUCCESS, color: "#000", fontSize: 9, fontWeight: 700, borderRadius: 10, padding: "1px 6px", minWidth: 16, textAlign: "center", lineHeight: "14px", fontFamily: "JetBrains Mono" }}>{cfoStats.activeContracts}</span>) : null} />
            <SidebarNav label="Invoices" active={cfoView === "invoices"} onClick={() => setCfoView("invoices")} />
            <SidebarNav label="Expenses" active={cfoView === "expenses"} onClick={() => setCfoView("expenses")} />
            <SidebarNav label="Staff" active={cfoView === "staff"} onClick={() => setCfoView("staff")} />
            <SidebarNav label="Settings" active={cfoView === "payday"} onClick={() => setCfoView("payday")} badge={cfoStats.paydayConnected === true ? (<span style={{ width: 6, height: 6, borderRadius: "50%", background: IPS_SUCCESS, display: "inline-block" }} />) : cfoStats.paydayConnected === false ? (<span style={{ width: 6, height: 6, borderRadius: "50%", background: IPS_DANGER, display: "inline-block" }} />) : null} />
          </>) : (<>
            <SidebarNav label="Tasks" active={wsView === "tasks"} onClick={() => setWsView("tasks")} badge={draftCount > 0 ? (<span style={{ background: "#F59E0B", color: "#000", fontSize: 9, fontWeight: 700, borderRadius: 10, padding: "1px 6px", minWidth: 16, textAlign: "center", lineHeight: "14px", fontFamily: "JetBrains Mono" }}>{draftCount}</span>) : null} />
            <SidebarNav label="Calendar" active={wsView === "calendar"} onClick={() => setWsView("calendar")} />
            <SidebarNav label="Dashboard" active={wsView === "dashboard"} onClick={() => setWsView("dashboard")} />
          </>)}
        </div>

        {/* Bottom: badge + sign out */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: onLogout ? 10 : 0 }}>
            <div style={{ fontSize: 9, padding: "3px 8px", borderRadius: 4, background: accessLevel === "ceo" ? "rgba(239,68,68,0.15)" : "rgba(87,181,200,0.1)", color: accessLevel === "ceo" ? IPS_DANGER : IPS_ACCENT, fontFamily: "JetBrains Mono", fontWeight: 600, textTransform: "uppercase" }}>
              {accessLevel === "ceo" ? "CEO Access" : "Team Access"}
            </div>
          </div>
          {onLogout && (
            <button onClick={onLogout} className="sidebar-nav" style={{ background: "rgba(255,255,255,0.03)", borderTop: "none", borderRight: "none", borderBottom: "none", borderLeft: "3px solid transparent", borderRadius: "0 6px 6px 0", padding: "8px 14px", cursor: "pointer", color: TEXT_DIM, fontSize: 12, fontFamily: "'Satoshi', 'Inter', sans-serif", width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
              <IconLogout /> Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, overflowY: "auto", height: "100vh" }}>
        {/* Page header */}
        <div className="page-header" style={{ padding: "20px 28px 16px", marginBottom: 4, display: "flex", alignItems: "flex-start", gap: 12, borderBottom: `1px solid ${BORDER}` }}>
          <button onClick={() => setSidebarOpen(true)} className="mobile-hamburger" style={{ display: "none", background: "none", border: "none", color: TEXT, cursor: "pointer", padding: 4, marginTop: 2 }}><IconMenu /></button>
          <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{activeModule === "market" ? "MARKET INTELLIGENCE" : activeModule === "cfo" ? "CFO Workspace" : "Workspace"}</h1>
          <div style={{ fontSize: 12, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>{activeModule === "market" ? `Reykjavík · 2026 Season · ${portCalls.length} port calls` : activeModule === "cfo" ? "Financial Management & Analysis" : "Task & Project Management"}</div>
          </div>
        </div>

        <div className="page-content" style={{ padding: "20px 28px", maxWidth: 1440 }}>

        {/* MODULE RENDERING */}
        {activeModule === "market" && (
          <MarketIntel portCalls={portCalls} activeView={activeView} />
        )}

        {activeModule === "workspace" && (
          <Workspace wsView={wsView} activeModule={activeModule} onDraftCountChange={setDraftCount} />
        )}

        {activeModule === "cfo" && (
          <CFOWorkspace cfoView={cfoView} activeModule={activeModule} portCalls={portCalls} onStatsChange={setCfoStats} />
        )}

        {/* FOOTER */}
        <div style={{ marginTop: 24, padding: "16px 0", borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", fontSize: 11, color: TEXT_DIM }}>
          <span>{activeModule === "market" ? "Source: DOKK portal · Corrected Feb 2026 · Tiered (T): <300p=1× · 300–600p=3× · 600–1200p=6× · 1200+p=11× · 🌙 = overnight" : activeModule === "cfo" ? "CEO-only · Financial data is confidential" : "IPS Workspace · Shared task management for Jón & Tristan"}</span>
          <span style={{ fontFamily: "JetBrains Mono" }}>{activeModule === "market" ? "IPS Market Intelligence v3.0" : activeModule === "cfo" ? "IPS CFO Workspace v1.0" : "IPS Workspace v1.0"}</span>
        </div>
        </div>
      </main>
    </div>
  );
}
