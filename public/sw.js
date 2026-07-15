const CACHE_NAME = 'efsun-v1';

// Uygulama yüklendiğinde temel dosyaları önbelleğe al
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/icon.png'
      ]);
    })
  );
  self.skipWaiting();
});

// İnternet koptuğunda önbellekteki dosyaları göster
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }).catch(() => {
      // Eğer hiçbir şey bulunamazsa ve internet yoksa beyaz ekran yerine anasayfayı göster
      return caches.match('/');
    })
  );
});

// Bildirimleri arka planda dinleyeceğimiz yer (Son aşamada burayı kullanacağız)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Yeni Mesaj!", {
      body: data.body || "Efsun'un Dünyası'ndan bir bildirim var.",
      icon: '/icon.png',
      badge: '/icon.png',
      vibrate: [200, 100, 200]
    })
  );
});