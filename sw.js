
const CACHE_NAME = 'smart-gestao-v23';
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
  // Ignorar requisições de terceiros (Supabase, Google Fonts, etc) para evitar erros de opacidade
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.includes('icons8')) {
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
