
const CACHE_NAME = 'smartgestao-pwa-final-v1';
const OFFLINE_URL = 'index.html';

const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Instalação: Cacheia arquivos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Cacheando recursos estáticos');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação: Remove caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('SW: Removendo cache obsoleto:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interceptação de Requisições: Estratégia Cache First com Network Fallback
self.addEventListener('fetch', (event) => {
  // Ignorar requisições para Supabase ou APIs externas para evitar erros de CORS no cache
  if (event.request.url.includes('supabase.co') || event.request.url.includes('google')) {
    return;
  }

  // Fallback Offline para navegação
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // Cache para outros recursos
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Opcional: Cache dinâmico para novos recursos encontrados
        // Se for uma imagem ou script confiável, você poderia adicionar ao cache aqui
        return fetchResponse;
      }).catch(() => {
        // Se falhar tudo
        return null;
      });
    })
  );
});
