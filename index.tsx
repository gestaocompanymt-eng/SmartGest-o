
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Registrar Service Worker de forma explícita para o diretório raiz
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('SmartGestão: PWA Ativo - Escopo:', reg.scope);
      })
      .catch(err => {
        console.error('SmartGestão: Erro ao registrar PWA:', err);
      });
  });
}

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
