const CACHE = 'boxbox-v2'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // HTML и ассеты Next — сначала сеть, чтобы после деплоя не залипал старый UI
  if (request.mode === 'navigate' || url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (request.mode === 'navigate' && res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put('/', copy))
          }
          return res
        })
        .catch(() => caches.match('/') || caches.match(request)),
    )
    return
  }

  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return res
      })
      .catch(() => caches.match(request)),
  )
})
