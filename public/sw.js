const CACHE_NAME = 'efsun-v1';

// Uygulama yüklendiğinde temel dosyaları önbelleğe al[cite: 6]
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

// İnternet koptuğunda önbellekteki dosyaları göster[cite: 6]
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }).catch(() => {
      // Eğer hiçbir şey bulunamazsa ve internet yoksa beyaz ekran yerine anasayfayı göster[cite: 6]
      return caches.match('/');
    })
  );
});

// ZEKİ BİLDİRİM SİSTEMİ (Uygulama açıksa susar, kapalıysa bildirimi ekrana basar)
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
        let isAppOpen = false;
        
        // Kullanıcı o an uygulamadaysa ve ekranı açıksa bunu tespit ediyoruz
        for (let i = 0; i < windowClients.length; i++) {
          if (windowClients[i].focused) {
            isAppOpen = true;
            break;
          }
        }

        // SADECE uygulama kapalıysa veya arka plandaysa bildirimi fırlat!
        if (!isAppOpen) {
          const options = {
            body: data.body || "Efsun'un Dünyası'ndan bir bildirim var.", //[cite: 6]
            icon: '/icon.png', //[cite: 6]
            badge: '/icon.png', //[cite: 6]
            vibrate: [200, 100, 200], //[cite: 6]
            data: { url: '/' }
          };
          return self.registration.showNotification(data.title || "Yeni Mesaj!", options); //[cite: 6]
        }
      })
    );
  }
});

// Bildirime tıklanınca uygulamayı açar
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});