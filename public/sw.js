const CACHE_NAME = 'pnsolar-v2';

// Các tài nguyên tĩnh cần cache
const STATIC_ASSETS = ['/manifest.json', '/logoPN-192.png', '/logoPN-512.png'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => { }))
  );
});

self.addEventListener('activate', (event) => {
  // Xóa cache cũ
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ✅ BẮT BUỘC — Chrome cần fetch handler để nhận diện PWA có thể cài đặt
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Chỉ xử lý request cùng origin
  if (url.origin !== self.location.origin) return;

  // API calls → luôn lấy từ network (không cache)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Tài nguyên tĩnh → cache-first, fallback network
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || 'PNSolar';
  const options = {
    body: data.message || '',
    icon: '/logoPN.jpg',
    badge: '/logoPN.jpg',
    tag: data.notificationId || 'pnsolar-notification',
    data: { link: data.link || '/dashboard' },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/dashboard';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(link);
            return;
          }
        }
        return self.clients.openWindow(link);
      })
  );
});
