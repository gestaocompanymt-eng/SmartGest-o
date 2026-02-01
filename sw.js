
const CACHE_NAME = 'smart-gestao-v31';

// Instalação: Cacheia arquivos fundamentais
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Ativação: Limpa caches antigos e assume controle imediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch: Prioridade para rede para evitar dados defasados
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.hostname.includes('supabase.co')) return; 
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
