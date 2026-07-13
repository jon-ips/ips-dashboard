import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import AuthGate from './AuthGate.jsx';
import IPSDashboard from './App.jsx';

function App() {
  // Persisted so a page refresh (or every launch of the phone quick-log PWA)
  // doesn't demand the PIN again. Sign Out clears it.
  const [accessLevel, setAccessLevel] = useState(() => {
    try {
      const v = localStorage.getItem("ips:access");
      return v === "team" || v === "ceo" ? v : null;
    } catch { return null; }
  });

  const authAs = (level) => {
    try { localStorage.setItem("ips:access", level); } catch {}
    setAccessLevel(level);
  };
  const logout = () => {
    try { localStorage.removeItem("ips:access"); } catch {}
    setAccessLevel(null);
  };

  if (!accessLevel) {
    return <AuthGate onAuth={authAs} />;
  }

  return <IPSDashboard accessLevel={accessLevel} onLogout={logout} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
