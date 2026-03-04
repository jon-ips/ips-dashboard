import { useState, useCallback } from "react";
import ipsLogoWhite from "./assets/ips-logo-white.png";

// ─── PIN Auth Gate ──────────────────────────────────────────────────────────
// Two access levels:
//   • Team mode (TEAM_PIN) — Market Intel, Workspace
//   • CEO  mode (CEO_PIN)  — Everything, including Financials
//
// PINs are set via environment variables (VITE_TEAM_PIN, VITE_CEO_PIN).
// Falls back to hardcoded defaults for local development.

const TEAM_PIN = import.meta.env.VITE_TEAM_PIN || "ips2026";
const CEO_PIN  = import.meta.env.VITE_CEO_PIN  || "ceo2026";

const IPS_BLUE   = "#0C2C40";
const IPS_ACCENT = "#57B5C8";
const IPS_ACCENT2 = "#458CA7";
const SURFACE    = "#112F45";
const BORDER     = "#1A4A60";
const TEXT       = "#F6F7F7";
const TEXT_DIM   = "#B5BACB";
const IPS_DANGER = "#EF4444";

export default function AuthGate({ onAuth }) {
  const [pin, setPin]       = useState("");
  const [error, setError]   = useState("");
  const [shake, setShake]   = useState(false);

  const submit = useCallback(() => {
    if (pin === CEO_PIN) {
      onAuth("ceo");
    } else if (pin === TEAM_PIN) {
      onAuth("team");
    } else {
      setError("Invalid PIN");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }, [pin, onAuth]);

  const handleKey = (e) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div style={{
      fontFamily: "'Satoshi', 'Inter', sans-serif",
      background: IPS_BLUE,
      color: TEXT,
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <style>{`@import url('https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700,800,900&display=swap');@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
      `}</style>

      <div style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: "48px 40px",
        width: 380,
        maxWidth: "90vw",
        textAlign: "center",
        animation: shake ? "shake 0.3s ease-in-out" : "none",
      }}>
        {/* Logo */}
        <img src={ipsLogoWhite} alt="Iceland Port Services" style={{
          height: 48, margin: "0 auto 24px", display: "block",
        }} />

        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
          IPS Workspace
        </div>
        <div style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 32 }}>
          Enter your access PIN to continue
        </div>

        <input
          type="password"
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError(""); }}
          onKeyDown={handleKey}
          autoFocus
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${error ? IPS_DANGER : BORDER}`,
            color: TEXT,
            fontSize: 16,
            fontFamily: "JetBrains Mono",
            textAlign: "center",
            letterSpacing: 4,
            outline: "none",
            transition: "border-color 0.2s",
          }}
        />

        {error && (
          <div style={{ color: IPS_DANGER, fontSize: 12, marginTop: 10 }}>
            {error}
          </div>
        )}

        <button
          onClick={submit}
          style={{
            width: "100%",
            marginTop: 20,
            padding: "12px 0",
            borderRadius: 10,
            background: `linear-gradient(135deg, ${IPS_ACCENT}, ${IPS_ACCENT2})`,
            border: "none",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Satoshi', 'Inter', sans-serif",
            transition: "opacity 0.2s",
          }}
        >
          Sign In
        </button>

        <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 24 }}>
          Icelandic Port Services · Reykjavík
        </div>
      </div>
    </div>
  );
}
