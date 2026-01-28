
const CACHE_NAME = 'smart-gestao-v26';

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

// Fetch: Prioridade total para a Rede em chamadas de API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NUNCA cacheia chamadas ao Supabase para evitar disparidade entre celular e desktop
  if (url.hostname.includes('supabase.co')) {
    return; 
  }

  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
