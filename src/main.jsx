import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import AuthGate from './AuthGate.jsx';
import IPSDashboard from './App.jsx';

function App() {
  const [accessLevel, setAccessLevel] = useState(null); // null | "team" | "ceo"

  if (!accessLevel) {
    return <AuthGate onAuth={setAccessLevel} />;
  }

  return <IPSDashboard accessLevel={accessLevel} onLogout={() => setAccessLevel(null)} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
