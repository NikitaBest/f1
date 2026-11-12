const CACHE = 'boxbox-v8'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
      await self.clients.claim()
      const clients = await self.clients.matchAll({ type: 'window' })
      for (const client of clients) {
        client.postMessage({ type: 'BB_SW_UPDATED', cache: CACHE })
      }
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Всегда сначала сеть — PWA подхватывает новый деплой без ручной очистки
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && (request.mode === 'navigate' || url.pathname.startsWith('/icons/'))) {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(request.mode === 'navigate' ? '/' : request, copy))
        }
        return res
      })
      .catch(() => caches.match(request.mode === 'navigate' ? '/' : request)),
  )
})
