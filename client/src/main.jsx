import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Deployment: 2026-02-03T14:52:00Z - Server-side call storage
console.log('🚀 ACCESS PAL Client v1.0.1 - Deployed:', new Date().toISOString());

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
