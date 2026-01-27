
const CACHE_NAME = 'smart-gestao-v25';
const OFFLINE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalação: Cacheia arquivos fundamentais
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Ativação: Limpa caches antigos imediatamente
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

// Fetch: Prioridade total para a Rede
self.addEventListener('fetch', (event) => {
  // Ignora solicitações que não sejam GET ou de domínios externos problemáticos
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
