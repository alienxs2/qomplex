import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Placeholder App component - will be replaced in Phase 4
function App() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="card p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Qomplex</h1>
        <p className="text-gray-600">Web interface for Claude Code CLI</p>
        <p className="text-sm text-gray-400 mt-4">Phase 1 Setup Complete</p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
