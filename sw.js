const CACHE = 'ecgnow-plantoes-v1'
const ASSETS = [
  '/plantaoecgnow/',
  '/plantaoecgnow/index.html',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
]

// Instala e faz cache dos assets principais
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  )
  self.skipWaiting()
})

// Ativa e limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Estratégia: network first, fallback para cache
self.addEventListener('fetch', e => {
  // Deixa requisições do Supabase sempre ir para a rede
  if (e.request.url.includes('supabase.co')) return

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Atualiza cache com resposta fresca
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request))
  )
})

// Notificações push (preparado para futuro)
self.addEventListener('push', e => {
  if (!e.data) return
  const data = e.data.json()
  e.waitUntil(
    self.registration.showNotification(data.title || 'ECGNow Plantões', {
      body: data.body || '',
      icon: '/plantaoecgnow/icon-192.png',
      badge: '/plantaoecgnow/icon-192.png',
      tag: data.tag || 'ecgnow',
      data: { url: data.url || '/plantaoecgnow/' },
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/plantaoecgnow/'))
})
