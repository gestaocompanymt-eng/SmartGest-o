
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Registro do Service Worker para suporte a PWA (Progressive Web App).
 * 
 * NOTA DE SEGURANÇA: Utilizamos o caminho relativo './sw.js'. 
 * Isso instrui o navegador a resolver o script na mesma origem em que o site está sendo servido,
 * prevenindo erros de "Origin Mismatch" (DOMException) que ocorrem quando se tenta
 * registrar um worker de um domínio diferente (ex: cross-origin do editor vs preview).
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('SmartGestão: PWA Ativado com sucesso. Escopo:', registration.scope);
      })
      .catch(error => {
        // Logamos o erro detalhado para fins de diagnóstico
        console.warn('SmartGestão: O registro do PWA falhou ou foi bloqueado pelo ambiente:', error);
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
