
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// O registro do Service Worker foi movido para o index.html 
// para garantir que a URL do script seja resolvida contra o domínio de hospedagem
// e evitar erros de "Origin Mismatch" comuns em ambientes de preview.

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
