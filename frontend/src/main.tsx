import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Application entry point
 *
 * Creates the React 18 root and renders the app with StrictMode enabled.
 * StrictMode helps identify potential problems in development by:
 * - Detecting unsafe lifecycles
 * - Warning about legacy API usage
 * - Detecting unexpected side effects
 * - Detecting legacy context API
 * - Ensuring reusable state
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
