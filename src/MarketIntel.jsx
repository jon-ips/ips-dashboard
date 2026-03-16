import { useState, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";
import {
  SIMPLE_TURNAROUND_WEIGHT, TRANSIT_WEIGHT, getTieredWeight, getTierLabel,
  MONTHS, MONTH_NUMS,
  PALLETS_PER_PAX_TRANSIT, PALLETS_PER_PAX_TURNAROUND,
  LUGGAGE_PER_PAX_TURNAROUND, CREW_PER_1000_PAX_TRANSIT, CREW_PER_1000_PAX_TURNAROUND,
  IPS_BLUE, IPS_ACCENT, IPS_ACCENT2, IPS_WARN, IPS_DANGER, IPS_SUCCESS,
  SURFACE, BORDER, TEXT, TEXT_DIM, OTHER_COLOR,
  SAMSKIP_COLOR, PROSPECT_GROUPS,
} from "./constants.js";
import { Card, SL, CTip, PieCard, FilterPill, fmtDate, fmtDateRange } from "./shared.jsx";

export default function MarketIntel({ portCalls, activeView }) {
  // ─── MARKET INTEL STATE ───────────────────────────────────────────────────
  const [wonLines, setWonLines] = useState(new Set());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [portCalFilter, setPortCalFilter] = useState(new Set());
  const [portCalDropOpen, setPortCalDropOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [calMonth, setCalMonth] = useState(5); // May=5
  const [calFilter, setCalFilter] = useState(new Set()); // extra lines toggled visible on calendar
  const [calDropOpen, setCalDropOpen] = useState(false);
  const [showNonTurnaround, setShowNonTurnaround] = useState(false);

  // ─── COMPUTED DATA ────────────────────────────────────────────────────────
  const toggleLine = useCallback((line) => {
    setWonLines((prev) => {
      const next = new Set(prev);
      if (next.has(line)) next.delete(line); else next.add(line);
      return next;
    });
  }, []);

  const toggleGroup = useCallback((groupKey) => {
    const group = PROSPECT_GROUPS[groupKey];
    if (!group) return;
    setWonLines((prev) => {
      const next = new Set(prev);
      const allSelected = group.lines.every((l) => next.has(l));
      if (allSelected) {
        group.lines.forEach((l) => next.delete(l));
      } else {
        group.lines.forEach((l) => next.add(l));
      }
      return next;
    });
  }, []);

  const isIPS = useCallback((ship) => {
    if (ship.status === "contracted") return true;
    if (wonLines.has(ship.line)) return true;
    return false;
  }, [wonLines]);

  // Build sorted list of all non-contracted lines for the dropdown
  const allNonContractedLines = useMemo(() => {
    const lines = {};
    portCalls.forEach((s) => {
      if (s.status !== "contracted" && !lines[s.line]) {
        lines[s.line] = { status: s.status, calls: 0, turnarounds: 0, pax: 0 };
      }
      if (lines[s.line]) {
        lines[s.line].calls++;
        lines[s.line].pax += s.pax;
        if (s.turnaround) lines[s.line].turnarounds++;
      }
    });
    return Object.entries(lines).sort((a, b) => a[0].localeCompare(b[0]));
  }, [portCalls]);

  const isOvernight = (s) => s.endDate !== null;

  // Get the actual turnaround operations day for a ship
  // Viking rule: 2-night stays = ops on middle day, 1-night = ops on first day
  // General: single day = that day, multi-day = same logic applied universally
  const getTurnaroundOpsDate = (s) => {
    if (!s.turnaround) return null;
    if (!s.endDate) return s.date; // single day
    const start = new Date(s.date + "T12:00:00");
    const end = new Date(s.endDate + "T12:00:00");
    const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (nights >= 2) {
      // Middle day (day after arrival)
      const mid = new Date(start);
      mid.setDate(mid.getDate() + 1);
      return mid.toISOString().split("T")[0];
    }
    // 1 night: ops on arrival day
    return s.date;
  };

  // Non-turnaround ops date: double-day calls = ops on first day, single-day = that day
  const getNonTurnaroundOpsDate = (s) => {
    if (s.turnaround) return null;
    return s.date; // always first day for non-turnaround
  };

  // ─── STATS ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let ipsCalls = 0, otherCalls = 0;
    let ipsSimpleW = 0, otherSimpleW = 0;
    let ipsTieredW = 0, otherTieredW = 0;
    let ipsTurnarounds = 0, ipsTransits = 0, ipsTurnaroundPax = 0;

    portCalls.forEach((s) => {
      const sw = s.turnaround ? SIMPLE_TURNAROUND_WEIGHT : TRANSIT_WEIGHT;
      const tw = getTieredWeight(s);
      if (isIPS(s)) {
        ipsCalls++; ipsSimpleW += sw; ipsTieredW += tw;
        if (s.turnaround) { ipsTurnarounds++; ipsTurnaroundPax += s.pax; } else ipsTransits++;
      } else { otherCalls++; otherSimpleW += sw; otherTieredW += tw; }
    });

    const totalCalls = ipsCalls + otherCalls;
    const totalSimpleW = ipsSimpleW + otherSimpleW;
    const totalTieredW = ipsTieredW + otherTieredW;
    const callShare = totalCalls > 0 ? ((ipsCalls / totalCalls) * 100).toFixed(1) : 0;
    const simpleWShare = totalSimpleW > 0 ? ((ipsSimpleW / totalSimpleW) * 100).toFixed(1) : 0;
    const tieredShare = totalTieredW > 0 ? ((ipsTieredW / totalTieredW) * 100).toFixed(1) : 0;

    const monthly = MONTH_NUMS.map((m, i) => {
      const ms = portCalls.filter((s) => new Date(s.date).getMonth() + 1 === m);
      let mIC = 0, mOC = 0, mISW = 0, mOSW = 0, mITW = 0, mOTW = 0, pallets = 0, luggage = 0, crew = 0;
      ms.forEach((s) => {
        const sw = s.turnaround ? SIMPLE_TURNAROUND_WEIGHT : TRANSIT_WEIGHT;
        const tw = getTieredWeight(s);
        if (isIPS(s)) {
          mIC++; mISW += sw; mITW += tw;
          pallets += s.pax * (s.turnaround ? PALLETS_PER_PAX_TURNAROUND : PALLETS_PER_PAX_TRANSIT);
          luggage += s.turnaround ? s.pax * LUGGAGE_PER_PAX_TURNAROUND : 0;
          crew += (s.pax / 1000) * (s.turnaround ? CREW_PER_1000_PAX_TURNAROUND : CREW_PER_1000_PAX_TRANSIT);
        } else { mOC++; mOSW += sw; mOTW += tw; }
      });
      return { month: MONTHS[i], monthNum: m, ipsCalls: mIC, otherCalls: mOC, ipsSimpleW: mISW, otherSimpleW: mOSW, ipsTieredW: mITW, otherTieredW: mOTW, totalCalls: mIC + mOC, pallets: Math.round(pallets), luggage: Math.round(luggage), crew: Math.ceil(crew) };
    });

    const lineBreakdown = {};
    portCalls.forEach((s) => {
      if (!lineBreakdown[s.line]) lineBreakdown[s.line] = { calls: 0, turnarounds: 0, transits: 0, pax: 0, simpleW: 0, tieredW: 0, turnaroundPax: 0, status: (s.status !== "contracted" && wonLines.has(s.line)) ? "contracted" : s.status, baseStatus: s.status, overnights: 0 };
      lineBreakdown[s.line].calls++;
      lineBreakdown[s.line].pax += s.pax;
      lineBreakdown[s.line].simpleW += s.turnaround ? SIMPLE_TURNAROUND_WEIGHT : TRANSIT_WEIGHT;
      lineBreakdown[s.line].tieredW += getTieredWeight(s);
      if (s.turnaround) { lineBreakdown[s.line].turnarounds++; lineBreakdown[s.line].turnaroundPax += s.pax; } else lineBreakdown[s.line].transits++;
      if (isOvernight(s)) lineBreakdown[s.line].overnights++;
    });

    return { ipsCalls, otherCalls, totalCalls, callShare, simpleWShare, tieredShare, ipsSimpleW, otherSimpleW, totalSimpleW, ipsTieredW, otherTieredW, totalTieredW, ipsTurnarounds, ipsTransits, ipsTurnaroundPax, monthly, lineBreakdown };
  }, [isIPS, wonLines, portCalls]);

  // ─── CRUNCH ─────────────────────────────────────────────────────────────────
  const crunchData = useMemo(() => {
    const allDates = {};
    portCalls.forEach((s) => {
      if (!isIPS(s)) return;
      if (s.turnaround) {
        const opsDate = getTurnaroundOpsDate(s);
        if (!opsDate) return;
        if (!allDates[opsDate]) allDates[opsDate] = { date: opsDate, ipsTurnarounds: 0, ipsNonTurnarounds: 0, ipsShips: [] };
        allDates[opsDate].ipsTurnarounds++;
        allDates[opsDate].ipsShips.push({ ship: s.ship, line: s.line, pax: s.pax, overnight: isOvernight(s), arrivalDate: s.date, endDate: s.endDate, turnaround: true });
      } else if (showNonTurnaround) {
        const opsDate = getNonTurnaroundOpsDate(s);
        if (!opsDate) return;
        if (!allDates[opsDate]) allDates[opsDate] = { date: opsDate, ipsTurnarounds: 0, ipsNonTurnarounds: 0, ipsShips: [] };
        allDates[opsDate].ipsNonTurnarounds++;
        allDates[opsDate].ipsShips.push({ ship: s.ship, line: s.line, pax: s.pax, overnight: isOvernight(s), arrivalDate: s.date, endDate: s.endDate, turnaround: false });
      }
    });
    return Object.values(allDates).filter((d) => (d.ipsTurnarounds + d.ipsNonTurnarounds) > 0).sort((a, b) => a.date.localeCompare(b.date));
  }, [isIPS, showNonTurnaround]);

  const callPie = [{ name: "IPS", value: stats.ipsCalls, color: IPS_ACCENT }, { name: "Other", value: stats.otherCalls, color: "#334155" }];
  const simpleWPie = [{ name: "IPS", value: stats.ipsSimpleW, color: IPS_ACCENT }, { name: "Other", value: stats.otherSimpleW, color: "#334155" }];
  const tieredPie = [{ name: "IPS", value: stats.ipsTieredW, color: IPS_ACCENT }, { name: "Other", value: stats.otherTieredW, color: "#334155" }];

  const sortedLines = Object.entries(stats.lineBreakdown).sort((a, b) => {
    const order = { contracted: 0, sdk: 1, prospect: 2, other: 3 };
    const diff = order[a[1].status] - order[b[1].status];
    return diff !== 0 ? diff : b[1].tieredW - a[1].tieredW;
  });

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (<>
        {/* WHAT-IF */}
        <Card style={{ marginBottom: 20, background: `linear-gradient(90deg, rgba(249,115,22,0.05) 0%, ${SURFACE} 100%)`, border: `1px solid rgba(249,115,22,0.2)` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setWhatIfOpen(o => !o)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: SAMSKIP_COLOR, fontFamily: "JetBrains Mono", fontWeight: 500 }}>What-If Scenario</div>
              {!whatIfOpen && wonLines.size > 0 && <span style={{ fontSize: 11, color: TEXT_DIM }}>· {wonLines.size} line{wonLines.size > 1 ? "s" : ""} selected</span>}
            </div>
            <span style={{ color: TEXT_DIM, fontSize: 14, transform: whatIfOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
          </div>
          {whatIfOpen && (<div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            {/* Left: dropdown */}
            <div style={{ flex: "1 1 400px", minWidth: 300 }}>
              <div style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 10 }}>Select cruise lines to model as IPS contracts</div>

              {/* Dropdown trigger */}
              <div style={{ position: "relative" }}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "rgba(255,255,255,0.03)", border: `1px solid ${dropdownOpen ? SAMSKIP_COLOR : BORDER}`,
                  borderRadius: 8, padding: "10px 14px", cursor: "pointer", transition: "all 0.2s", color: TEXT,
                  fontFamily: "'Satoshi', 'Inter', sans-serif", fontSize: 13,
                }}>
                  <span style={{ color: wonLines.size > 0 ? TEXT : TEXT_DIM }}>
                    {wonLines.size === 0 ? "Select cruise lines to add..." : `${wonLines.size} line${wonLines.size > 1 ? "s" : ""} added to IPS portfolio`}
                  </span>
                  <span style={{ color: TEXT_DIM, fontSize: 18, transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                </button>

                {/* Dropdown panel */}
                {dropdownOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
                    background: SURFACE, border: `1px solid ${SAMSKIP_COLOR}`, borderRadius: 8,
                    maxHeight: 320, overflowY: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                  }}>
                    {/* Prospect Groups */}
                    <div style={{ padding: "8px 12px 4px", fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: SAMSKIP_COLOR, fontFamily: "JetBrains Mono", borderBottom: `1px solid ${BORDER}` }}>
                      Prospect Groups
                    </div>
                    {Object.entries(PROSPECT_GROUPS).map(([key, group]) => {
                      const groupLinesInPort = group.lines.filter((l) => allNonContractedLines.some(([nl]) => nl === l));
                      const allChecked = groupLinesInPort.length > 0 && groupLinesInPort.every((l) => wonLines.has(l));
                      const someChecked = groupLinesInPort.some((l) => wonLines.has(l));
                      const totalCalls = groupLinesInPort.reduce((sum, l) => {
                        const found = allNonContractedLines.find(([nl]) => nl === l);
                        return sum + (found ? found[1].calls : 0);
                      }, 0);
                      const totalTurnarounds = groupLinesInPort.reduce((sum, l) => {
                        const found = allNonContractedLines.find(([nl]) => nl === l);
                        return sum + (found ? found[1].turnarounds : 0);
                      }, 0);
                      return (
                        <button key={key} onClick={() => toggleGroup(key)} style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 10,
                          padding: "8px 12px", border: "none", cursor: "pointer", transition: "all 0.15s",
                          background: allChecked ? "rgba(249,115,22,0.1)" : someChecked ? "rgba(249,115,22,0.05)" : "transparent",
                          borderLeft: `3px solid ${allChecked ? group.color : someChecked ? "rgba(249,115,22,0.4)" : "transparent"}`,
                        }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${allChecked ? group.color : someChecked ? "rgba(249,115,22,0.6)" : BORDER}`, background: allChecked ? group.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}>
                            {allChecked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                            {someChecked && !allChecked && <span style={{ color: group.color, fontSize: 12, fontWeight: 700 }}>–</span>}
                          </div>
                          <span style={{ color: allChecked || someChecked ? TEXT : TEXT_DIM, fontWeight: 600, fontSize: 13, flex: 1, textAlign: "left" }}>{group.label}</span>
                          <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: TEXT_DIM }}>{groupLinesInPort.length} lines · {totalCalls} calls · {totalTurnarounds}(T)</span>
                        </button>
                      );
                    })}
                    {/* Other lines section */}
                    <div style={{ padding: "8px 12px 4px", fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: OTHER_COLOR, fontFamily: "JetBrains Mono", borderBottom: `1px solid ${BORDER}`, borderTop: `1px solid ${BORDER}` }}>
                      Other Lines in Port
                    </div>
                    {allNonContractedLines.map(([line, data]) => {
                      const checked = wonLines.has(line);
                      const inGroup = Object.values(PROSPECT_GROUPS).find((g) => g.lines.includes(line));
                      return (
                        <button key={line} onClick={() => toggleLine(line)} style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 10,
                          padding: "8px 12px", border: "none", cursor: "pointer", transition: "all 0.15s",
                          background: checked ? "rgba(87,181,200,0.08)" : "transparent",
                          borderLeft: `3px solid ${checked ? IPS_ACCENT : "transparent"}`,
                        }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? IPS_ACCENT : BORDER}`, background: checked ? IPS_ACCENT : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}>
                            {checked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                          </div>
                          <span style={{ color: checked ? TEXT : TEXT_DIM, fontWeight: 500, fontSize: 13, flex: 1, textAlign: "left", display: "flex", alignItems: "center", gap: 6 }}>
                            {line}
                            {inGroup && <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: "rgba(249,115,22,0.15)", color: SAMSKIP_COLOR, fontFamily: "JetBrains Mono", fontWeight: 600, letterSpacing: 0.5 }}>{inGroup.label}</span>}
                          </span>
                          <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: TEXT_DIM }}>{data.calls} calls · {data.turnarounds}(T)</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected chips */}
              {wonLines.size > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {[...wonLines].map((line) => {
                    const inGroup = Object.values(PROSPECT_GROUPS).find((g) => g.lines.includes(line));
                    const chipColor = inGroup ? SAMSKIP_COLOR : IPS_ACCENT;
                    return (
                      <button key={line} onClick={() => toggleLine(line)} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: inGroup ? "rgba(249,115,22,0.15)" : "rgba(87,181,200,0.1)",
                        border: `1px solid ${chipColor}`,
                        borderRadius: 6, padding: "4px 10px", cursor: "pointer", transition: "all 0.15s",
                      }}>
                        <span style={{ color: chipColor, fontSize: 12, fontWeight: 500 }}>{line}</span>
                        <span style={{ color: chipColor, fontSize: 14, lineHeight: 1 }}>×</span>
                      </button>
                    );
                  })}
                  <button onClick={() => setWonLines(new Set())} style={{
                    background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.3)`,
                    borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: IPS_DANGER, fontSize: 11,
                    fontFamily: "JetBrains Mono",
                  }}>Clear all</button>
                </div>
              )}
            </div>

            {/* Right: share metrics */}
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <div style={{ textAlign: "center", padding: "8px 14px", background: "rgba(87,181,200,0.08)", borderRadius: 8, border: `1px solid rgba(87,181,200,0.15)` }}>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>Calls</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: IPS_ACCENT, fontFamily: "JetBrains Mono" }}>{stats.callShare}%</div>
                <div style={{ fontSize: 9, color: TEXT_DIM }}>{stats.ipsCalls}/{stats.totalCalls}</div>
              </div>
              <div style={{ textAlign: "center", padding: "8px 14px", background: "rgba(245,158,11,0.08)", borderRadius: 8, border: `1px solid rgba(245,158,11,0.15)` }}>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>Simple Wtd</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: IPS_WARN, fontFamily: "JetBrains Mono" }}>{stats.simpleWShare}%</div>
                <div style={{ fontSize: 9, color: TEXT_DIM }}>(T)=3×</div>
              </div>
              <div style={{ textAlign: "center", padding: "8px 14px", background: "rgba(34,197,94,0.08)", borderRadius: 8, border: `1px solid rgba(34,197,94,0.15)` }}>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>Tiered Wtd</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: IPS_SUCCESS, fontFamily: "JetBrains Mono" }}>{stats.tieredShare}%</div>
                <div style={{ fontSize: 9, color: TEXT_DIM }}>by pax tier</div>
              </div>
            </div>
          </div>
          </div>)}
        </Card>

        {/* ═══ OVERVIEW ═══ */}
        {activeView === "overview" && (<>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
            {[
              { l: "Port Total", v: stats.totalCalls, s: "all calls", bc: TEXT_DIM },
              { l: "IPS Calls", v: stats.ipsCalls, c: IPS_ACCENT, bc: IPS_ACCENT },
              { l: "IPS (T)", v: stats.ipsTurnarounds, c: IPS_WARN, s: "turnarounds", bc: IPS_WARN },
              { l: "IPS Transit", v: stats.ipsTransits, s: "transit", bc: IPS_ACCENT },
              { l: "(T) Pax Vol", v: (stats.ipsTurnaroundPax / 1000).toFixed(1) + "K", c: IPS_WARN, s: "turnaround pax", bc: IPS_WARN },
              { l: "Tiered Pts", v: stats.ipsTieredW, c: IPS_SUCCESS, s: `of ${stats.totalTieredW}`, bc: IPS_SUCCESS },
            ].map((x, i) => (<Card key={i} style={{ borderTop: `2px solid ${x.bc || BORDER}`, padding: "16px 12px" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>{x.l}</div><div style={{ fontSize: 26, fontWeight: 700, color: x.c || TEXT, fontFamily: "JetBrains Mono", lineHeight: 1.1 }}>{x.v}</div>{x.s && <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 4 }}>{x.s}</div>}</div></Card>))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 20 }}>
            <PieCard data={callPie} sharePercent={stats.callShare} title="Call Count Share" />
            <PieCard data={tieredPie} sharePercent={stats.tieredShare} title="Tiered Weighted (by pax)" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 20 }}>
            <Card><SL>Monthly Call Volume</SL><ResponsiveContainer width="100%" height={220}><BarChart data={stats.monthly} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="month" tick={{ fill: TEXT_DIM, fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: TEXT_DIM, fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<CTip />} /><Bar dataKey="ipsCalls" name="IPS" fill={IPS_ACCENT} radius={[4, 4, 0, 0]} /><Bar dataKey="otherCalls" name="Other" fill="#334155" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></Card>
            <Card><SL>Monthly Tiered Weighted Points</SL><ResponsiveContainer width="100%" height={220}><BarChart data={stats.monthly} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="month" tick={{ fill: TEXT_DIM, fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: TEXT_DIM, fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<CTip />} /><Bar dataKey="ipsTieredW" name="IPS Tiered" fill={IPS_SUCCESS} radius={[4, 4, 0, 0]} /><Bar dataKey="otherTieredW" name="Other Tiered" fill="#334155" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></Card>
          </div>
          <Card><SL>Projected IPS Operations Volume</SL><ResponsiveContainer width="100%" height={250}><LineChart data={stats.monthly}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="month" tick={{ fill: TEXT_DIM, fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: TEXT_DIM, fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 12, color: TEXT_DIM }} /><Line type="monotone" dataKey="pallets" name="Pallets" stroke={IPS_ACCENT} strokeWidth={2.5} dot={{ r: 4, fill: IPS_ACCENT }} /><Line type="monotone" dataKey="luggage" name="Luggage" stroke={IPS_WARN} strokeWidth={2.5} dot={{ r: 4, fill: IPS_WARN }} /><Line type="monotone" dataKey="crew" name="Crew" stroke={IPS_SUCCESS} strokeWidth={2.5} dot={{ r: 4, fill: IPS_SUCCESS }} /></LineChart></ResponsiveContainer></Card>
        </>)}

        {/* ═══ CALENDAR ═══ */}
        {activeView === "calendar" && (() => {
          // Build daily port activity map including multi-day stays
          const dailyMap = {};
          portCalls.forEach((s) => {
            const start = new Date(s.date + "T12:00:00");
            const end = s.endDate ? new Date(s.endDate + "T12:00:00") : start;
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              const key = d.toISOString().split("T")[0];
              if (!dailyMap[key]) dailyMap[key] = [];
              dailyMap[key].push(s);
            }
          });

          // Calendar only shows IPS + manually toggled lines
          const calVisible = (s) => isIPS(s) || calFilter.has(s.line);

          // All non-contracted lines for the toggle dropdown
          const nonIPSLines = {};
          portCalls.forEach((s) => {
            if (s.status !== "contracted" && !wonLines.has(s.line)) {
              if (!nonIPSLines[s.line]) nonIPSLines[s.line] = { status: s.status, calls: 0, turnarounds: 0 };
              nonIPSLines[s.line].calls++;
              if (s.turnaround) nonIPSLines[s.line].turnarounds++;
            }
          });
          const sortedCalLines = Object.entries(nonIPSLines).sort((a, b) => a[0].localeCompare(b[0]));

          const toggleCalLine = (line) => {
            setCalFilter((prev) => {
              const next = new Set(prev);
              if (next.has(line)) next.delete(line); else next.add(line);
              return next;
            });
          };

          const year = 2026;
          const monthIdx = calMonth - 1;
          const firstDay = new Date(year, monthIdx, 1);
          const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
          const startDow = (firstDay.getDay() + 6) % 7;
          const weeks = [];
          let week = new Array(startDow).fill(null);
          for (let d = 1; d <= daysInMonth; d++) {
            week.push(d);
            if (week.length === 7) { weeks.push(week); week = []; }
          }
          if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }

          const monthNames = { 5: "May", 6: "June", 7: "July", 8: "August", 9: "September" };
          const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

          // Count IPS calls this month for summary
          const monthShips = portCalls.filter(s => new Date(s.date).getMonth() + 1 === calMonth);
          const ipsThisMonth = monthShips.filter(s => isIPS(s));
          const ipsT = ipsThisMonth.filter(s => s.turnaround).length;

          return (
            <>
              {/* Month selector + filter */}
              <Card style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
                  {/* Left: month tabs + filter dropdown */}
                  <div style={{ flex: "1 1 400px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <SL>Season Calendar — {monthNames[calMonth]} 2026</SL>
                      <div style={{ display: "flex", gap: 4 }}>
                        {MONTH_NUMS.map((m, i) => (
                          <button key={m} onClick={() => setCalMonth(m)} style={{
                            background: calMonth === m ? "rgba(87,181,200,0.15)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${calMonth === m ? IPS_ACCENT : BORDER}`,
                            borderRadius: 6, padding: "6px 14px", cursor: "pointer",
                            color: calMonth === m ? IPS_ACCENT : TEXT_DIM, fontSize: 12, fontWeight: 600,
                            fontFamily: "'Satoshi', 'Inter', sans-serif", transition: "all 0.2s",
                          }}>{MONTHS[i]}</button>
                        ))}
                      </div>
                    </div>

                    {/* Filter dropdown */}
                    <div style={{ position: "relative" }}>
                      <button onClick={() => setCalDropOpen(!calDropOpen)} style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "rgba(255,255,255,0.03)", border: `1px solid ${calDropOpen ? IPS_ACCENT : BORDER}`,
                        borderRadius: 8, padding: "10px 14px", cursor: "pointer", transition: "all 0.2s", color: TEXT,
                        fontFamily: "'Satoshi', 'Inter', sans-serif", fontSize: 13,
                      }}>
                        <span style={{ color: calFilter.size > 0 ? TEXT : TEXT_DIM }}>
                          {calFilter.size === 0 ? "Showing IPS contracted only — add other lines..." : `IPS + ${calFilter.size} additional line${calFilter.size > 1 ? "s" : ""}`}
                        </span>
                        <span style={{ color: TEXT_DIM, fontSize: 18, transform: calDropOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                      </button>

                      {calDropOpen && (
                        <div style={{
                          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
                          background: SURFACE, border: `1px solid ${IPS_ACCENT}`, borderRadius: 8,
                          maxHeight: 320, overflowY: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                        }}>
                          {/* Quick actions */}
                          <div style={{ display: "flex", gap: 6, padding: "8px 12px", borderBottom: `1px solid ${BORDER}` }}>
                            <button onClick={() => setCalFilter(new Set(sortedCalLines.map(([l]) => l)))} style={{ background: "rgba(87,181,200,0.1)", border: `1px solid rgba(87,181,200,0.2)`, borderRadius: 4, padding: "3px 10px", cursor: "pointer", color: IPS_ACCENT, fontSize: 10, fontFamily: "JetBrains Mono" }}>Show all</button>
                            <button onClick={() => setCalFilter(new Set())} style={{ background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 4, padding: "3px 10px", cursor: "pointer", color: IPS_DANGER, fontSize: 10, fontFamily: "JetBrains Mono" }}>IPS only</button>
                          </div>
                          {/* Other Lines */}
                          <div style={{ padding: "8px 12px 4px", fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: OTHER_COLOR, fontFamily: "JetBrains Mono", borderBottom: `1px solid ${BORDER}` }}>Other Lines</div>
                          {sortedCalLines.map(([line, data]) => {
                            const checked = calFilter.has(line);
                            return (
                              <button key={line} onClick={() => toggleCalLine(line)} style={{
                                width: "100%", display: "flex", alignItems: "center", gap: 10,
                                padding: "8px 12px", border: "none", cursor: "pointer", transition: "all 0.15s",
                                background: checked ? "rgba(87,181,200,0.08)" : "transparent",
                                borderLeft: `3px solid ${checked ? OTHER_COLOR : "transparent"}`,
                              }}>
                                <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? OTHER_COLOR : BORDER}`, background: checked ? OTHER_COLOR : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}>
                                  {checked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                                </div>
                                <span style={{ color: checked ? TEXT : TEXT_DIM, fontWeight: 500, fontSize: 13, flex: 1, textAlign: "left" }}>{line}</span>
                                <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: TEXT_DIM }}>{data.calls} calls · {data.turnarounds}(T)</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Selected chips */}
                    {calFilter.size > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                        {[...calFilter].sort().map((line) => {
                          return (
                            <button key={line} onClick={() => toggleCalLine(line)} style={{
                              display: "flex", alignItems: "center", gap: 6,
                              background: "rgba(71,85,105,0.15)",
                              border: `1px solid ${OTHER_COLOR}`,
                              borderRadius: 6, padding: "4px 10px", cursor: "pointer", transition: "all 0.15s",
                            }}>
                              <span style={{ color: TEXT_DIM, fontSize: 12, fontWeight: 500 }}>{line}</span>
                              <span style={{ color: TEXT_DIM, fontSize: 14, lineHeight: 1 }}>×</span>
                            </button>
                          );
                        })}
                        <button onClick={() => setCalFilter(new Set())} style={{
                          background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.3)`,
                          borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: IPS_DANGER, fontSize: 11,
                          fontFamily: "JetBrains Mono",
                        }}>Clear all</button>
                      </div>
                    )}
                  </div>

                  {/* Right: summary stats */}
                  <div style={{ display: "flex", gap: 10, flexShrink: 0, paddingTop: 20 }}>
                    <div style={{ textAlign: "center", padding: "8px 14px", background: "rgba(87,181,200,0.08)", borderRadius: 8, border: `1px solid rgba(87,181,200,0.15)` }}>
                      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>IPS Calls</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: IPS_ACCENT, fontFamily: "JetBrains Mono" }}>{ipsThisMonth.length}</div>
                      <div style={{ fontSize: 9, color: TEXT_DIM }}>{monthNames[calMonth]}</div>
                    </div>
                    <div style={{ textAlign: "center", padding: "8px 14px", background: "rgba(245,158,11,0.08)", borderRadius: 8, border: `1px solid rgba(245,158,11,0.15)` }}>
                      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>IPS (T)</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: IPS_WARN, fontFamily: "JetBrains Mono" }}>{ipsT}</div>
                      <div style={{ fontSize: 9, color: TEXT_DIM }}>turnarounds</div>
                    </div>
                    <div style={{ textAlign: "center", padding: "8px 14px", background: "rgba(71,85,105,0.08)", borderRadius: 8, border: `1px solid rgba(71,85,105,0.15)` }}>
                      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono" }}>Showing</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: TEXT, fontFamily: "JetBrains Mono" }}>{calFilter.size > 0 ? `+${calFilter.size}` : "IPS"}</div>
                      <div style={{ fontSize: 9, color: TEXT_DIM }}>{calFilter.size > 0 ? "extra lines" : "only"}</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Calendar grid */}
              <Card style={{ padding: 12, overflow: "auto" }}>
                {/* Day headers */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                  {dayLabels.map((d) => (
                    <div key={d} style={{
                      textAlign: "center", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5,
                      color: TEXT_DIM, fontFamily: "JetBrains Mono", padding: "6px 0",
                    }}>{d}</div>
                  ))}
                </div>

                {/* Weeks */}
                {weeks.map((week, wi) => (
                  <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                    {week.map((day, di) => {
                      if (day === null) return <div key={di} style={{ minHeight: 90 }} />;
                      const dateStr = `${year}-${String(calMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const allShips = dailyMap[dateStr] || [];
                      const ships = allShips.filter(calVisible);
                      const isWeekend = di >= 5;
                      const hasActivity = ships.length > 0;
                      const ipsTCount = ships.filter(s => isIPS(s) && s.turnaround).length;

                      return (
                        <div key={di} style={{
                          minHeight: 90,
                          background: hasActivity
                            ? ships.length >= 5 ? "rgba(239,68,68,0.06)" : ships.length >= 3 ? "rgba(245,158,11,0.04)" : "rgba(87,181,200,0.03)"
                            : isWeekend ? "rgba(255,255,255,0.008)" : "rgba(255,255,255,0.015)",
                          border: `1px solid ${hasActivity && ships.length >= 4 ? "rgba(245,158,11,0.25)" : BORDER}`,
                          borderRadius: 8, padding: 6, position: "relative", overflow: "hidden",
                        }}>
                          {/* Day number header */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{
                              fontFamily: "JetBrains Mono", fontSize: 12, fontWeight: 700,
                              color: hasActivity ? TEXT : TEXT_DIM,
                              width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                              borderRadius: 5,
                              background: ipsTCount > 0 ? "rgba(87,181,200,0.15)" : "transparent",
                            }}>{day}</span>
                            {ships.length > 0 && (
                              <span style={{
                                fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 600,
                                color: ships.length >= 5 ? IPS_DANGER : ships.length >= 3 ? IPS_WARN : TEXT_DIM,
                                background: ships.length >= 5 ? "rgba(239,68,68,0.12)" : ships.length >= 3 ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.05)",
                                padding: "1px 5px", borderRadius: 3,
                              }}>{ships.length}</span>
                            )}
                          </div>

                          {/* Ship pills */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {ships.map((s, si) => {
                              const ips = isIPS(s);
                              const inSamskip = !ips && Object.values(PROSPECT_GROUPS).some((g) => g.lines.includes(s.line));
                              const chipColor = ips ? IPS_ACCENT : inSamskip ? SAMSKIP_COLOR : OTHER_COLOR;
                              const opsDate = getTurnaroundOpsDate(s);
                              const isOpsDay = opsDate === dateStr;
                              const isArrival = s.date === dateStr;
                              const isDeparture = s.endDate === dateStr;
                              const isMidStay = !isArrival && !isDeparture && s.endDate !== null;

                              return (
                                <div key={si} style={{
                                  display: "flex", alignItems: "center", gap: 3,
                                  background: `${chipColor}${ips ? "18" : "0D"}`,
                                  border: `1px solid ${isOpsDay && s.turnaround ? IPS_WARN + "60" : chipColor + "25"}`,
                                  borderRadius: 4, padding: "2px 5px",
                                  borderLeft: `3px solid ${chipColor}`,
                                }}>
                                  <div style={{ display: "flex", gap: 1, flexShrink: 0 }}>
                                    {s.turnaround && <span style={{ fontSize: 7, color: IPS_WARN, fontWeight: 800, fontFamily: "JetBrains Mono" }}>T</span>}
                                    {isOpsDay && s.turnaround && <span style={{ fontSize: 8 }}>⚙</span>}
                                    {isArrival && s.endDate && <span style={{ fontSize: 7, color: IPS_SUCCESS, fontFamily: "JetBrains Mono", fontWeight: 700 }}>▶</span>}
                                    {isDeparture && <span style={{ fontSize: 7, color: IPS_DANGER, fontFamily: "JetBrains Mono", fontWeight: 700 }}>◀</span>}
                                    {isMidStay && <span style={{ fontSize: 7, color: SAMSKIP_COLOR, fontFamily: "JetBrains Mono" }}>◆</span>}
                                  </div>
                                  <span style={{
                                    fontSize: 9, color: chipColor, fontWeight: ips ? 600 : 400,
                                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1,
                                    opacity: isMidStay ? 0.6 : 1,
                                  }}>{s.ship}</span>
                                  <span style={{
                                    fontSize: 8, color: TEXT_DIM, fontFamily: "JetBrains Mono", flexShrink: 0,
                                    opacity: isMidStay ? 0.5 : 0.7,
                                  }}>{s.pax >= 1000 ? (s.pax / 1000).toFixed(1) + "k" : s.pax}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Legend */}
                <div style={{
                  marginTop: 12, padding: "10px 14px", borderRadius: 8,
                  background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}`,
                  display: "flex", flexWrap: "wrap", gap: 16, fontSize: 10, color: TEXT_DIM,
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: IPS_ACCENT, display: "inline-block" }} /> IPS Contracted
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: SAMSKIP_COLOR, display: "inline-block" }} /> Samskip
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: OTHER_COLOR, display: "inline-block" }} /> Other
                  </span>
                  <span><strong style={{ color: IPS_WARN, fontFamily: "JetBrains Mono" }}>T</strong> = Turnaround</span>
                  <span>⚙ = Ops Day</span>
                  <span><span style={{ color: IPS_SUCCESS, fontFamily: "JetBrains Mono", fontWeight: 700 }}>▶</span> Arrival</span>
                  <span><span style={{ color: IPS_DANGER, fontFamily: "JetBrains Mono", fontWeight: 700 }}>◀</span> Departure</span>
                  <span><span style={{ color: SAMSKIP_COLOR, fontFamily: "JetBrains Mono" }}>◆</span> Mid-stay</span>
                </div>
              </Card>
            </>
          );
        })()}

        {/* ═══ CRUNCH ═══ */}
        {activeView === "crunch" && (
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div><SL>Crunch Calendar — IPS Ops Days{showNonTurnaround ? " (T + Transit)" : " (T)"}</SL><div style={{ fontSize: 12, color: TEXT_DIM, marginTop: -8 }}>Ops day: 2-night stays = middle day · 1-night = arrival day{showNonTurnaround ? " · Transit ops = arrival day" : ""} · Red = 2+ simultaneous</div></div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div
                  onClick={() => setShowNonTurnaround(v => !v)}
                  style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontFamily: "JetBrains Mono", background: showNonTurnaround ? "rgba(87,181,200,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${showNonTurnaround ? IPS_ACCENT : BORDER}`, color: showNonTurnaround ? IPS_ACCENT : TEXT_DIM, transition: "all 0.15s", userSelect: "none" }}
                >
                  <div style={{ width: 24, height: 14, borderRadius: 7, background: showNonTurnaround ? IPS_ACCENT : "#334155", position: "relative", transition: "background 0.15s" }}>
                    <div style={{ width: 10, height: 10, borderRadius: 5, background: "#fff", position: "absolute", top: 2, left: showNonTurnaround ? 12 : 2, transition: "left 0.15s" }} />
                  </div>
                  Non-T ops
                </div>
                {[{ color: IPS_SUCCESS, label: "1 (T)" }, { color: IPS_WARN, label: "2 (T)" }, { color: IPS_DANGER, label: "3+ (T)" }].map((l, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: TEXT_DIM }}><div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />{l.label}</div>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 8 }}>
              {crunchData.map((d) => {
                const totalOps = d.ipsTurnarounds + d.ipsNonTurnarounds;
                const color = d.ipsTurnarounds >= 3 ? IPS_DANGER : d.ipsTurnarounds >= 2 ? IPS_WARN : IPS_SUCCESS;
                const isAlert = d.ipsTurnarounds >= 2;
                const dateObj = new Date(d.date + "T12:00:00");
                const totalCrew = d.ipsShips.reduce((sum, s) => sum + (s.pax / 1000) * (s.turnaround ? CREW_PER_1000_PAX_TURNAROUND : CREW_PER_1000_PAX_TRANSIT), 0);
                return (
                  <div key={d.date} style={{ background: isAlert ? `rgba(${color === IPS_DANGER ? "239,68,68" : "245,158,11"},0.08)` : "rgba(255,255,255,0.02)", border: `1px solid ${isAlert ? color : BORDER}`, borderRadius: 8, padding: 12, position: "relative" }}>
                    {isAlert && <div style={{ position: "absolute", top: 8, right: 8, fontSize: 9, background: `${color}20`, color, padding: "2px 6px", borderRadius: 3, fontFamily: "JetBrains Mono", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{d.ipsTurnarounds >= 3 ? "Critical" : "Alert"}</div>}
                    <div style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: TEXT_DIM, marginBottom: 4 }}>{dateObj.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color, fontFamily: "JetBrains Mono" }}>{d.ipsTurnarounds}</div>
                        {showNonTurnaround && d.ipsNonTurnarounds > 0 && <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(87,181,200,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: IPS_ACCENT2, fontFamily: "JetBrains Mono" }}>{d.ipsNonTurnarounds}</div>}
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: TEXT_DIM }}>{showNonTurnaround && d.ipsNonTurnarounds > 0 ? <><span style={{ color }}>(T)</span> + <span style={{ color: IPS_ACCENT2 }}>transit</span></> : "(T) calls"}</span>
                        <div style={{ fontSize: 10, color: TEXT_DIM }}>~{Math.ceil(totalCrew)} crew · {totalOps} total</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, lineHeight: 1.7 }}>
                      {d.ipsShips.map((s, i) => {
                        const isMultiDay = s.endDate !== null;
                        const opsNote = isMultiDay && s.turnaround ? (s.arrivalDate !== d.date ? `arr. ${new Date(s.arrivalDate + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "") : "";
                        return (
                          <div key={i} style={{ color: s.turnaround ? TEXT : TEXT_DIM, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: s.turnaround ? 1 : 0.75 }}>
                            <span>{s.turnaround ? "⛴" : "↔"} {s.ship} {s.overnight ? "🌙" : ""}{!s.turnaround ? <span style={{ fontSize: 9, color: IPS_ACCENT2, marginLeft: 4 }}>(transit)</span> : ""}{opsNote ? <span style={{ fontSize: 9, color: TEXT_DIM, marginLeft: 4 }}>({opsNote})</span> : ""}</span>
                            <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: TEXT_DIM }}>{s.pax}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 16, padding: "10px 16px", borderRadius: 8, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", display: "flex", gap: 24, fontSize: 12, color: TEXT_DIM, flexWrap: "wrap" }}>
              <span>IPS ops days: <strong style={{ color: IPS_ACCENT }}>{crunchData.length}</strong></span>
              <span>Alert (2+ T): <strong style={{ color: IPS_WARN }}>{crunchData.filter(d => d.ipsTurnarounds >= 2).length}</strong></span>
              <span>Critical (3+ T): <strong style={{ color: IPS_DANGER }}>{crunchData.filter(d => d.ipsTurnarounds >= 3).length}</strong></span>
              {showNonTurnaround && <span>Transit ops: <strong style={{ color: IPS_ACCENT2 }}>{crunchData.reduce((sum, d) => sum + d.ipsNonTurnarounds, 0)}</strong></span>}
            </div>
          </Card>
        )}

        {/* ═══ SIMPLE CALENDAR ═══ */}
        {activeView === "simple" && (
          <Card>
            <div style={{ marginBottom: 20 }}>
              <SL>Simple Ops Calendar — Summer 2026</SL>
              <div style={{ fontSize: 13, color: TEXT_DIM, marginTop: -8 }}>One card per ops day. Big ship name. Big operation type.</div>
              <div style={{ display: "flex", gap: 12, marginTop: 12, alignItems: "center" }}>
                <div
                  onClick={() => setShowNonTurnaround(v => !v)}
                  style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontFamily: "JetBrains Mono", background: showNonTurnaround ? "rgba(87,181,200,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${showNonTurnaround ? IPS_ACCENT : BORDER}`, color: showNonTurnaround ? IPS_ACCENT : TEXT_DIM, transition: "all 0.15s", userSelect: "none" }}
                >
                  <div style={{ width: 24, height: 14, borderRadius: 7, background: showNonTurnaround ? IPS_ACCENT : "#334155", position: "relative", transition: "background 0.15s" }}>
                    <div style={{ width: 10, height: 10, borderRadius: 5, background: "#fff", position: "absolute", top: 2, left: showNonTurnaround ? 12 : 2, transition: "left 0.15s" }} />
                  </div>
                  Show transit ops
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {crunchData.map((d) => {
                const dateObj = new Date(d.date + "T12:00:00");
                return (
                  <div key={d.date} style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${BORDER}`,
                    borderRadius: 12,
                    padding: 20,
                  }}>
                    {/* Date header */}
                    <div style={{
                      fontFamily: "JetBrains Mono",
                      fontSize: 14,
                      fontWeight: 700,
                      color: IPS_ACCENT,
                      marginBottom: 16,
                      paddingBottom: 10,
                      borderBottom: `1px solid ${BORDER}`,
                    }}>
                      {dateObj.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                    </div>

                    {/* Ships */}
                    {d.ipsShips.map((s, i) => {
                      const isTurnaround = s.turnaround;
                      return (
                        <div key={i} style={{
                          marginBottom: i < d.ipsShips.length - 1 ? 16 : 0,
                          padding: 16,
                          borderRadius: 10,
                          background: isTurnaround ? "rgba(245,158,11,0.08)" : "rgba(87,181,200,0.08)",
                          border: `2px solid ${isTurnaround ? IPS_WARN : IPS_ACCENT2}`,
                        }}>
                          {/* Ship name - BIG */}
                          <div style={{
                            fontSize: 28,
                            fontWeight: 900,
                            color: TEXT,
                            lineHeight: 1.2,
                            marginBottom: 8,
                          }}>
                            {s.ship}
                          </div>

                          {/* Operation type - VERY BIG */}
                          <div style={{
                            fontSize: 36,
                            fontWeight: 900,
                            fontFamily: "JetBrains Mono",
                            color: isTurnaround ? IPS_WARN : IPS_ACCENT2,
                            letterSpacing: 2,
                            textTransform: "uppercase",
                            lineHeight: 1.1,
                          }}>
                            {isTurnaround ? "TURNAROUND" : "GARBAGE"}
                          </div>

                          {/* Pax count */}
                          <div style={{
                            fontSize: 14,
                            color: TEXT_DIM,
                            marginTop: 8,
                            fontFamily: "JetBrains Mono",
                          }}>
                            {s.pax} pax
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ═══ EQUIPMENT ═══ */}
        {activeView === "equipment" && (() => {
          // Build daily equipment needs from IPS ops
          // Ship-specific equipment configs: { telescopics, regulars, conveyors }
          const SHIP_EQUIP = {
            "Rotterdam": { turnaround: { telescopics: 2, regulars: 2, conveyors: 0 } },
            "Zuiderdam": { transit: { telescopics: 1, regulars: 3, conveyors: 0 } },
            "Volendam": { transit: { telescopics: 1, regulars: 3, conveyors: 0 } },
            "Seabourn Venture": { turnaround: { telescopics: 1, regulars: 1, conveyors: 1 } },
            "Seabourn Ovation": { turnaround: { telescopics: 1, regulars: 2, conveyors: 1 } },
          };
          const equipDays = {};
          portCalls.forEach((s) => {
            if (!isIPS(s)) return;
            let opsDate = null;
            if (s.turnaround) {
              opsDate = getTurnaroundOpsDate(s);
            } else {
              opsDate = getNonTurnaroundOpsDate(s);
            }
            if (!opsDate) return;
            if (!equipDays[opsDate]) equipDays[opsDate] = { date: opsDate, ships: [], telescopics: 0, conveyors: 0, regulars: 0 };
            // Ship-specific equipment lookup
            const opType = s.turnaround ? "turnaround" : "transit";
            const shipConfig = SHIP_EQUIP[s.ship] && SHIP_EQUIP[s.ship][opType];
            if (shipConfig) {
              equipDays[opsDate].telescopics += shipConfig.telescopics;
              equipDays[opsDate].regulars += shipConfig.regulars;
              equipDays[opsDate].conveyors += shipConfig.conveyors;
            } else {
              // Default: 1 telescopic for all, 1 conveyor + 1 regular for turnarounds
              equipDays[opsDate].telescopics += 1;
              if (s.turnaround) {
                equipDays[opsDate].conveyors += 1;
                equipDays[opsDate].regulars += 1;
              }
            }
            equipDays[opsDate].ships.push({ ship: s.ship, line: s.line, pax: s.pax, turnaround: s.turnaround, overnight: isOvernight(s) });
          });
          const sortedEquipDays = Object.values(equipDays).sort((a, b) => a.date.localeCompare(b.date));

          const peakTelescopic = sortedEquipDays.reduce((max, d) => Math.max(max, d.telescopics), 0);
          const peakConveyor = sortedEquipDays.reduce((max, d) => Math.max(max, d.conveyors), 0);
          const peakRegular = sortedEquipDays.reduce((max, d) => Math.max(max, d.regulars), 0);
          const heavyDays = sortedEquipDays.filter(d => d.telescopics >= 3 || d.conveyors >= 2).length;

          return (
            <>
              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
                {[
                  { l: "Ops Days", v: sortedEquipDays.length, c: IPS_ACCENT, s: "total" },
                  { l: "Peak Telescopic", v: peakTelescopic, c: IPS_WARN, s: "forklifts/day" },
                  { l: "Peak Conveyor", v: peakConveyor, c: IPS_DANGER, s: "belts/day" },
                  { l: "Peak Regular", v: peakRegular, c: IPS_SUCCESS, s: "gangways/day" },
                  { l: "Heavy Days", v: heavyDays, c: IPS_DANGER, s: "3+ telescopic or 2+ conveyor" },
                ].map((x, i) => (
                  <Card key={i} style={{ borderTop: `2px solid ${x.c}`, padding: "16px 12px" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 6 }}>{x.l}</div>
                      <div style={{ fontSize: 26, fontWeight: 700, color: x.c, fontFamily: "JetBrains Mono", lineHeight: 1.1 }}>{x.v}</div>
                      {x.s && <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 4 }}>{x.s}</div>}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Equipment grid */}
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <SL>Equipment Calendar — Daily Requirements</SL>
                    <div style={{ fontSize: 12, color: TEXT_DIM, marginTop: -8 }}>Equipment per ship varies — see ship-specific configs</div>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    {[{ color: IPS_WARN, label: "Telescopic" }, { color: IPS_DANGER, label: "Conveyor" }, { color: IPS_SUCCESS, label: "Regular" }].map((l, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: TEXT_DIM }}><div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />{l.label}</div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
                  {sortedEquipDays.map((d) => {
                    const isHeavy = d.telescopics >= 3 || d.conveyors >= 2;
                    const dateObj = new Date(d.date + "T12:00:00");
                    const turnaroundCount = d.ships.filter(s => s.turnaround).length;
                    const transitCount = d.ships.filter(s => !s.turnaround).length;
                    return (
                      <div key={d.date} style={{
                        background: isHeavy ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isHeavy ? IPS_DANGER : BORDER}`,
                        borderRadius: 8, padding: 12, position: "relative",
                      }}>
                        {isHeavy && <div style={{ position: "absolute", top: 8, right: 8, fontSize: 9, background: "rgba(239,68,68,0.15)", color: IPS_DANGER, padding: "2px 6px", borderRadius: 3, fontFamily: "JetBrains Mono", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Heavy</div>}
                        <div style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: TEXT_DIM, marginBottom: 6 }}>
                          {dateObj.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                        </div>

                        {/* Equipment counts */}
                        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                          {[
                            { v: d.telescopics, label: "Telescopic", color: IPS_WARN },
                            { v: d.conveyors, label: "Conveyor", color: IPS_DANGER },
                            { v: d.regulars, label: "Regular", color: IPS_SUCCESS },
                          ].filter(e => e.v > 0).map((e, i) => (
                            <div key={i} style={{
                              display: "flex", alignItems: "center", gap: 4,
                              background: `${e.color}15`, border: `1px solid ${e.color}30`,
                              borderRadius: 5, padding: "3px 8px",
                            }}>
                              <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "JetBrains Mono", color: e.color }}>{e.v}</span>
                              <span style={{ fontSize: 9, color: TEXT_DIM }}>{e.label}</span>
                            </div>
                          ))}
                        </div>

                        {/* Ops breakdown */}
                        <div style={{ fontSize: 10, color: TEXT_DIM, marginBottom: 6, fontFamily: "JetBrains Mono" }}>
                          {turnaroundCount > 0 && <span style={{ color: IPS_WARN }}>{turnaroundCount}(T)</span>}
                          {turnaroundCount > 0 && transitCount > 0 && " + "}
                          {transitCount > 0 && <span style={{ color: IPS_ACCENT2 }}>{transitCount} transit</span>}
                        </div>

                        {/* Ship list */}
                        <div style={{ fontSize: 11, lineHeight: 1.7 }}>
                          {d.ships.map((s, i) => (
                            <div key={i} style={{ color: s.turnaround ? TEXT : TEXT_DIM, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: s.turnaround ? 1 : 0.75 }}>
                              <span>{s.turnaround ? "⛴" : "↔"} {s.ship}{!s.turnaround ? <span style={{ fontSize: 9, color: IPS_ACCENT2, marginLeft: 4 }}>(transit)</span> : ""}</span>
                              <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: TEXT_DIM }}>{s.pax}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary bar */}
                <div style={{ marginTop: 16, padding: "10px 16px", borderRadius: 8, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", display: "flex", gap: 24, fontSize: 12, color: TEXT_DIM, flexWrap: "wrap" }}>
                  <span>Ops days: <strong style={{ color: IPS_ACCENT }}>{sortedEquipDays.length}</strong></span>
                  <span>Peak telescopic: <strong style={{ color: IPS_WARN }}>{peakTelescopic}</strong></span>
                  <span>Peak conveyor: <strong style={{ color: IPS_DANGER }}>{peakConveyor}</strong></span>
                  <span>Peak regular: <strong style={{ color: IPS_SUCCESS }}>{peakRegular}</strong></span>
                  <span>Heavy days: <strong style={{ color: IPS_DANGER }}>{heavyDays}</strong></span>
                </div>
              </Card>
            </>
          );
        })()}

        {/* ═══ OPERATIONS ═══ */}
        {activeView === "operations" && (<>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
            {stats.monthly.map((m) => (
              <Card key={m.month} onClick={() => setSelectedMonth(selectedMonth === m.month ? null : m.month)} style={{ cursor: "pointer", border: selectedMonth === m.month ? `1px solid ${IPS_ACCENT}` : `1px solid ${BORDER}`, background: selectedMonth === m.month ? "rgba(87,181,200,0.05)" : SURFACE }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: TEXT_DIM, fontFamily: "JetBrains Mono", marginBottom: 8 }}>{m.month} 2026</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[{ v: m.ipsCalls, l: "IPS Calls", c: IPS_ACCENT }, { v: m.pallets, l: "Pallets", c: IPS_WARN }, { v: m.crew, l: "Peak Crew", c: IPS_SUCCESS }, { v: m.luggage, l: "Luggage", c: SAMSKIP_COLOR }].map((x, i) => (
                    <div key={i}><div style={{ fontSize: 20, fontWeight: 700, fontFamily: "JetBrains Mono", color: x.c }}>{x.v}</div><div style={{ fontSize: 10, color: TEXT_DIM }}>{x.l}</div></div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          {selectedMonth && (
            <Card style={{ marginBottom: 20 }}>
              <SL>{selectedMonth} 2026 — IPS Ship Schedule</SL>
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr 70px 80px 50px 50px 80px", gap: 10, padding: "8px 12px", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: TEXT_DIM, fontFamily: "JetBrains Mono", borderBottom: `1px solid ${BORDER}` }}>
                  <span>Dates</span><span>Line</span><span>Ship</span><span style={{ textAlign: "right" }}>Pax</span><span style={{ textAlign: "center" }}>Type</span><span style={{ textAlign: "center" }}>O/N</span><span style={{ textAlign: "center" }}>Tier</span><span style={{ textAlign: "right" }}>Pallets</span>
                </div>
                {portCalls.filter((s) => MONTHS[MONTH_NUMS.indexOf(new Date(s.date).getMonth() + 1)] === selectedMonth && isIPS(s)).sort((a, b) => a.date.localeCompare(b.date)).map((s, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr 70px 80px 50px 50px 80px", gap: 10, padding: "9px 12px", fontSize: 13, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", borderRadius: 4 }}>
                    <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: TEXT_DIM }}>{fmtDateRange(s)}</span>
                    <span style={{ fontWeight: 500 }}>{s.line}</span>
                    <span style={{ color: TEXT_DIM }}>{s.ship}</span>
                    <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{s.pax.toLocaleString()}</span>
                    <span style={{ textAlign: "center" }}>{s.turnaround ? <span style={{ background: "rgba(245,158,11,0.15)", color: IPS_WARN, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontFamily: "JetBrains Mono", fontWeight: 600 }}>(T)</span> : <span style={{ color: TEXT_DIM, fontSize: 11 }}>Transit</span>}</span>
                    <span style={{ textAlign: "center" }}>{isOvernight(s) ? <span style={{ fontSize: 13 }}>🌙</span> : <span style={{ color: TEXT_DIM }}>—</span>}</span>
                    <span style={{ textAlign: "center", fontFamily: "JetBrains Mono", fontSize: 10, color: s.turnaround ? IPS_SUCCESS : TEXT_DIM }}>{s.turnaround ? getTierLabel(s.pax) : "1×"}</span>
                    <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 12 }}>{Math.round(s.pax * (s.turnaround ? PALLETS_PER_PAX_TURNAROUND : PALLETS_PER_PAX_TRANSIT))}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          <Card><SL>Monthly Labor & Logistics Forecast</SL><ResponsiveContainer width="100%" height={250}><BarChart data={stats.monthly}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="month" tick={{ fill: TEXT_DIM, fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: TEXT_DIM, fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 12, color: TEXT_DIM }} /><Bar dataKey="pallets" name="Pallets" fill={IPS_ACCENT} radius={[4, 4, 0, 0]} /><Bar dataKey="luggage" name="Luggage" fill={IPS_WARN} radius={[4, 4, 0, 0]} /><Bar dataKey="crew" name="Peak Crew" fill={IPS_SUCCESS} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></Card>
        </>)}

        {/* ═══ FLEET INTEL ═══ */}
        {activeView === "fleet" && (
          <Card>
            <SL>Cruise Line Intelligence — Reykjavík 2026 · {portCalls.length} Port Calls</SL>
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 90px 55px 55px 55px 55px 70px 70px 70px", gap: 8, padding: "8px 12px", fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", borderBottom: `1px solid ${BORDER}` }}>
                <span>Line</span><span>Status</span><span style={{ textAlign: "right" }}>Calls</span><span style={{ textAlign: "right" }}>(T)</span><span style={{ textAlign: "right" }}>Trn</span><span style={{ textAlign: "right" }}>O/N</span><span style={{ textAlign: "right" }}>Tiered</span><span style={{ textAlign: "right" }}>Call%</span><span style={{ textAlign: "right" }}>Tier%</span>
              </div>
              {sortedLines.map(([line, data], i) => {
                const inGroup = Object.values(PROSPECT_GROUPS).some((g) => g.lines.includes(line));
                const sc = data.status === "contracted" ? IPS_ACCENT : inGroup ? SAMSKIP_COLOR : OTHER_COLOR;
                const sl = data.status === "contracted" && data.baseStatus !== "contracted" ? "What-If" : data.status === "contracted" ? "Contract" : inGroup ? "Samskip" : "—";
                return (
                  <div key={line} style={{ display: "grid", gridTemplateColumns: "1.4fr 90px 55px 55px 55px 55px 70px 70px 70px", gap: 8, padding: "8px 12px", fontSize: 12, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", borderRadius: 4, borderLeft: `3px solid ${sc}` }}>
                    <span style={{ fontWeight: 600, fontSize: 11 }}>{line}</span>
                    <span><span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${sc}15`, color: sc, fontFamily: "JetBrains Mono", fontWeight: 600, textTransform: "uppercase" }}>{sl}</span></span>
                    <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{data.calls}</span>
                    <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", color: data.turnarounds > 0 ? IPS_WARN : TEXT_DIM }}>{data.turnarounds || "—"}</span>
                    <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", color: TEXT_DIM }}>{data.transits || "—"}</span>
                    <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", color: TEXT_DIM }}>{data.overnights || "—"}</span>
                    <span style={{ textAlign: "right", fontFamily: "JetBrains Mono", fontWeight: 600 }}>{data.tieredW}</span>
                    <span style={{ textAlign: "right", fontFamily: "JetBrains Mono" }}>{((data.calls / stats.totalCalls) * 100).toFixed(1)}%</span>
                    <span style={{ textAlign: "right", fontFamily: "JetBrains Mono" }}>{((data.tieredW / stats.totalTieredW) * 100).toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 8, background: "rgba(87,181,200,0.05)", border: `1px solid rgba(87,181,200,0.15)`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontSize: 12, color: TEXT_DIM }}>
                <strong style={{ color: IPS_ACCENT }}>{Object.values(stats.lineBreakdown).filter(d => d.status === "contracted").length}</strong> contracted · <strong style={{ color: SAMSKIP_COLOR }}>{wonLines.size}</strong> what-if · <strong style={{ color: OTHER_COLOR }}>{Object.values(stats.lineBreakdown).filter(d => d.status === "other").length}</strong> other
              </div>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 12 }}>IPS: <strong style={{ color: IPS_ACCENT }}>{stats.callShare}%</strong> calls · <strong style={{ color: IPS_WARN }}>{stats.simpleWShare}%</strong> simple · <strong style={{ color: IPS_SUCCESS }}>{stats.tieredShare}%</strong> tiered</div>
            </div>
          </Card>
        )}

        {/* ═══ PORT CALENDAR ═══ */}
        {activeView === "portcal" && (() => {
          // Build daily port activity map including multi-day stays
          const dailyMap = {};
          portCalls.forEach((s) => {
            const start = new Date(s.date + "T12:00:00");
            const end = s.endDate ? new Date(s.endDate + "T12:00:00") : start;
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              const key = d.toISOString().split("T")[0];
              if (!dailyMap[key]) dailyMap[key] = [];
              dailyMap[key].push(s);
            }
          });
          // Filter by selected lines
          const filterActive = portCalFilter.size > 0;
          const filteredDaily = {};
          Object.entries(dailyMap).forEach(([date, ships]) => {
            const filtered = filterActive ? ships.filter((s) => portCalFilter.has(s.line)) : ships;
            if (filtered.length > 0) filteredDaily[date] = filtered;
          });
          // Sort by number of calls descending
          const sortedDays = Object.entries(filteredDaily).sort((a, b) => b[1].length - a[1].length);
          // All unique lines for the filter
          const allLines = [...new Set(portCalls.map((s) => s.line))].sort((a, b) => a.localeCompare(b));
          const togglePortCalLine = (line) => {
            setPortCalFilter((prev) => {
              const next = new Set(prev);
              if (next.has(line)) next.delete(line); else next.add(line);
              return next;
            });
          };
          const maxCalls = sortedDays.length > 0 ? sortedDays[0][1].length : 1;

          return (
            <>
              {/* Filter bar */}
              <Card style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ flex: "1 1 400px", position: "relative" }}>
                    <SL>Filter by Cruise Line</SL>
                    <button onClick={() => setPortCalDropOpen(!portCalDropOpen)} style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "rgba(255,255,255,0.03)", border: `1px solid ${portCalDropOpen ? IPS_ACCENT : BORDER}`,
                      borderRadius: 8, padding: "10px 14px", cursor: "pointer", color: TEXT, fontSize: 13,
                      fontFamily: "'Satoshi', 'Inter', sans-serif",
                    }}>
                      <span style={{ color: portCalFilter.size > 0 ? TEXT : TEXT_DIM }}>
                        {portCalFilter.size === 0 ? "All lines (click to filter)" : `${portCalFilter.size} line${portCalFilter.size > 1 ? "s" : ""} selected`}
                      </span>
                      <span style={{ color: TEXT_DIM, fontSize: 18, transform: portCalDropOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                    </button>
                    {portCalDropOpen && (
                      <div style={{
                        position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
                        background: SURFACE, border: `1px solid ${IPS_ACCENT}`, borderRadius: 8,
                        maxHeight: 320, overflowY: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                      }}>
                        {/* Quick actions */}
                        <div style={{ display: "flex", gap: 6, padding: "8px 12px", borderBottom: `1px solid ${BORDER}` }}>
                          <button onClick={() => setPortCalFilter(new Set(allLines))} style={{ background: "rgba(87,181,200,0.1)", border: `1px solid rgba(87,181,200,0.2)`, borderRadius: 4, padding: "3px 10px", cursor: "pointer", color: IPS_ACCENT, fontSize: 10, fontFamily: "JetBrains Mono" }}>Select all</button>
                          <button onClick={() => setPortCalFilter(new Set())} style={{ background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 4, padding: "3px 10px", cursor: "pointer", color: IPS_DANGER, fontSize: 10, fontFamily: "JetBrains Mono" }}>Clear all</button>
                          <button onClick={() => { const ipsLines = [...new Set(portCalls.filter(s => s.status === "contracted").map(s => s.line))]; setPortCalFilter(prev => { const next = new Set(prev); ipsLines.forEach(l => next.add(l)); return next; }); }} style={{ background: "rgba(87,181,200,0.1)", border: `1px solid rgba(87,181,200,0.2)`, borderRadius: 4, padding: "3px 10px", cursor: "pointer", color: IPS_ACCENT, fontSize: 10, fontFamily: "JetBrains Mono" }}>+ IPS</button>
                          <button onClick={() => { const pLines = PROSPECT_GROUPS.samskip.lines.filter(l => allLines.includes(l)); setPortCalFilter(prev => { const next = new Set(prev); pLines.forEach(l => next.add(l)); return next; }); }} style={{ background: "rgba(249,115,22,0.1)", border: `1px solid rgba(249,115,22,0.2)`, borderRadius: 4, padding: "3px 10px", cursor: "pointer", color: SAMSKIP_COLOR, fontSize: 10, fontFamily: "JetBrains Mono" }}>+ Samskip</button>
                        </div>
                        {allLines.map((line) => {
                          const checked = portCalFilter.has(line);
                          const lineStatus = portCalls.find(s => s.line === line)?.status || "other";
                          const inSamskip = PROSPECT_GROUPS.samskip.lines.includes(line);
                          const sc = lineStatus === "contracted" ? IPS_ACCENT : inSamskip ? SAMSKIP_COLOR : TEXT_DIM;
                          return (
                            <button key={line} onClick={() => togglePortCalLine(line)} style={{
                              width: "100%", display: "flex", alignItems: "center", gap: 10,
                              padding: "7px 12px", border: "none", cursor: "pointer",
                              background: checked ? "rgba(87,181,200,0.06)" : "transparent",
                              borderLeft: `3px solid ${checked ? sc : "transparent"}`,
                            }}>
                              <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${checked ? sc : BORDER}`, background: checked ? sc : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {checked && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
                              </div>
                              <span style={{ color: checked ? TEXT : TEXT_DIM, fontSize: 12, fontWeight: 500, flex: 1, textAlign: "left" }}>{line}</span>
                              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: `${sc}15`, color: sc, fontFamily: "JetBrains Mono" }}>
                                {lineStatus === "contracted" ? "IPS" : inSamskip ? "SMSK" : ""}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {/* Chips */}
                    {portCalFilter.size > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                        {[...portCalFilter].sort().map((line) => {
                          const lineStatus = portCalls.find(s => s.line === line)?.status || "other";
                          const inSamskip = PROSPECT_GROUPS.samskip.lines.includes(line);
                          const sc = lineStatus === "contracted" ? IPS_ACCENT : inSamskip ? SAMSKIP_COLOR : OTHER_COLOR;
                          return (
                            <button key={line} onClick={() => togglePortCalLine(line)} style={{
                              display: "flex", alignItems: "center", gap: 4,
                              background: `${sc}15`, border: `1px solid ${sc}40`, borderRadius: 4, padding: "2px 8px", cursor: "pointer",
                            }}>
                              <span style={{ color: sc, fontSize: 11 }}>{line}</span>
                              <span style={{ color: sc, fontSize: 12 }}>×</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, paddingTop: 24 }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: IPS_ACCENT, fontFamily: "JetBrains Mono" }}>{sortedDays.length}</div>
                    <div style={{ fontSize: 10, color: TEXT_DIM }}>active days</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: IPS_WARN, fontFamily: "JetBrains Mono", marginTop: 4 }}>{maxCalls}</div>
                    <div style={{ fontSize: 10, color: TEXT_DIM }}>peak calls/day</div>
                  </div>
                </div>
              </Card>

              {/* Day list */}
              <Card>
                <SL>All Port Days — Sorted by Activity ({filterActive ? `filtered: ${portCalFilter.size} lines` : "all lines"}) · ⚙ = turnaround ops day</SL>
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "90px 50px 1fr 60px 60px", gap: 10, padding: "8px 12px", fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: TEXT_DIM, fontFamily: "JetBrains Mono", borderBottom: `1px solid ${BORDER}` }}>
                    <span>Date</span><span style={{ textAlign: "center" }}>Ships</span><span>Vessels in Port</span><span style={{ textAlign: "center" }}>(T)</span><span style={{ textAlign: "center" }}>O/N</span>
                  </div>
                  {sortedDays.map(([date, ships], i) => {
                    const turnarounds = ships.filter(s => s.turnaround).length;
                    const overnights = ships.filter(s => s.endDate !== null).length;
                    const dateObj = new Date(date + "T12:00:00");
                    const barWidth = Math.max(8, (ships.length / maxCalls) * 100);
                    const hasIPS = ships.some(s => isIPS(s));
                    return (
                      <div key={date} style={{
                        borderBottom: `1px solid rgba(255,255,255,0.03)`,
                        background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                      }}>
                        <div style={{ display: "grid", gridTemplateColumns: "90px 50px 1fr 60px 60px", gap: 10, padding: "8px 12px", alignItems: "center" }}>
                          <span style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: TEXT_DIM }}>
                            {dateObj.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                          </span>
                          <div style={{ textAlign: "center" }}>
                            <div style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: 28, height: 28, borderRadius: 6, fontFamily: "JetBrains Mono", fontWeight: 800, fontSize: 14,
                              background: ships.length >= 6 ? "rgba(239,68,68,0.15)" : ships.length >= 4 ? "rgba(245,158,11,0.15)" : "rgba(87,181,200,0.1)",
                              color: ships.length >= 6 ? IPS_DANGER : ships.length >= 4 ? IPS_WARN : IPS_ACCENT,
                            }}>
                              {ships.length}
                            </div>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {ships.map((s, j) => {
                              const ips = isIPS(s);
                              const inSamskip = !ips && Object.values(PROSPECT_GROUPS).some((g) => g.lines.includes(s.line));
                              const chipColor = ips ? IPS_ACCENT : inSamskip ? SAMSKIP_COLOR : OTHER_COLOR;
                              const opsDate = getTurnaroundOpsDate(s);
                              const isOpsDay = opsDate === date;
                              return (
                                <span key={j} style={{
                                  fontSize: 10, padding: "2px 6px", borderRadius: 3,
                                  background: `${chipColor}15`, color: chipColor, fontWeight: 500,
                                  border: `1px solid ${isOpsDay ? IPS_WARN : chipColor + "30"}`,
                                  whiteSpace: "nowrap",
                                }}>
                                  {s.ship}{s.turnaround ? " (T)" : ""}{isOpsDay && s.turnaround ? " ⚙" : ""}{s.endDate ? " 🌙" : ""}
                                </span>
                              );
                            })}
                          </div>
                          <span style={{ textAlign: "center", fontFamily: "JetBrains Mono", fontSize: 12, color: turnarounds > 0 ? IPS_WARN : TEXT_DIM }}>
                            {turnarounds > 0 ? turnarounds : "—"}
                          </span>
                          <span style={{ textAlign: "center", fontFamily: "JetBrains Mono", fontSize: 12, color: overnights > 0 ? SAMSKIP_COLOR : TEXT_DIM }}>
                            {overnights > 0 ? overnights : "—"}
                          </span>
                        </div>
                        {/* Activity bar */}
                        <div style={{ padding: "0 12px 6px", display: "flex", gap: 2 }}>
                          {ships.map((s, j) => {
                            const ips = isIPS(s);
                            const inSamskip = !ips && Object.values(PROSPECT_GROUPS).some((g) => g.lines.includes(s.line));
                            return (
                              <div key={j} style={{
                                height: 3, borderRadius: 2, flex: 1,
                                background: ips ? IPS_ACCENT : inSamskip ? SAMSKIP_COLOR : "rgba(255,255,255,0.08)",
                              }} />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {sortedDays.length === 0 && <div style={{ textAlign: "center", padding: 40, color: TEXT_DIM }}>No port days match the current filter.</div>}
              </Card>
            </>
          );
        })()}

        </>);
}
