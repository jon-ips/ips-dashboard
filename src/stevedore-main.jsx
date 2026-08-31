import React from 'react';
import ReactDOM from 'react-dom/client';
import StevedoreView from './StevedoreView.jsx';

// Entry for /stevedore.html — the stevedore's standalone page. No auth gate,
// no main app; see stevedore.webmanifest for why it's a separate entry.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StevedoreView />
  </React.StrictMode>
);
