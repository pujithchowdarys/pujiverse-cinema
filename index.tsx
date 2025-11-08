
// Add this global shim for `process` object if it doesn't exist in the browser environment.
// This allows `process.env.API_KEY` to be referenced without a `ReferenceError`,
// even if its value remains `undefined` without a build-time injection.
if (typeof process === 'undefined') {
  (window as any).process = { env: {} };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);