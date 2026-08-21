import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Register Service Worker for PWA support
if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[SETU PWA] Service Worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.error('[SETU PWA] Service Worker registration failed:', err);
      });
  });
} else if ('serviceWorker' in navigator) {
  // In dev mode, register as well so install prompt & offline caching are testable
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('[SETU PWA Dev] Service worker active'))
      .catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
