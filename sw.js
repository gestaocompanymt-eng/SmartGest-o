
const CACHE_NAME = 'smart-gestao-v24';
const OFFLINE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://img.icons8.com/fluency/192/maintenance.png',
  'https://img.icons8.com/fluency/512/maintenance.png'
];

// Instalação: Cacheia arquivos fundamentais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch: Estratégia Network First com Fallback para Cache
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Permitir cache de recursos essenciais, incluindo dependências do ESM.sh e ícones
  const isCacheable = 
    url.startsWith(self.location.origin) || 
    url.includes('esm.sh') || 
    url.includes('icons8') || 
    url.includes('tailwindcss.com') ||
    url.includes('googleapis.com') ||
    url.includes('gstatic.com');

  if (!isCacheable || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a rede responder, atualiza o cache e retorna
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Se a rede falhar, tenta o cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Se for uma navegação e não tiver cache, retorna a página inicial
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return null;
        });
      })
  );
});
