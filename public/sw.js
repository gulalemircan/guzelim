// public/sw.js
// SIFIR ÖNBELLEK (CACHE YOK), SADECE SAF BİLDİRİM MOTORU

self.addEventListener('install', (event) => {
  // Kurulumda hiçbir dosya indirmeye çalışma, anında aktif ol!
  self.skipWaiting(); 
});

self.addEventListener('activate', (event) => {
  // Sayfayı anında kontrol et
  event.waitUntil(clients.claim()); 
});

// ZEKİ BİLDİRİM SİSTEMİ (Chat açıkken susar, arka planda telefonu titretir)
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
        let isAppOpen = false;
        
        for (let i = 0; i < windowClients.length; i++) {
          if (windowClients[i].focused) {
            isAppOpen = true;
            break;
          }
        }

        if (!isAppOpen) {
          const options = {
            body: data.body || "Yeni bir mesajın var!",
            icon: '/icon-512.png', // Dosya yoksa bile motoru çökertmez, sadece ikonsuz atar
            badge: '/icon-512.png',
            vibrate: [200, 100, 200],
            data: { url: '/' }
          };
          return self.registration.showNotification(data.title || "Yeni Mesaj!", options);
        }
      })
    );
  }
});

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