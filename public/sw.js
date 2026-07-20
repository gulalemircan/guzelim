const CACHE_NAME = 'efsun-v2';

// Uygulama yüklendiğinde temel dosyaları önbelleğe al ve motoru anında çalıştır[cite: 5]
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Beklemeyi reddet, anında kur![cite: 5]
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Dosya bulunamazsa motoru çökertmemesi için hata yakalayıcı (catch) ekledik
      return cache.addAll([
        '/',
        '/manifest.json',
        '/icon.png' //[cite: 5]
      ]).catch(err => console.log('Önbellek önemsiz hata:', err));
    })
  );
});

// Kurulur kurulmaz sayfanın kontrolünü zorla ele al
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); 
});

// İnternet koptuğunda önbellekteki dosyaları göster[cite: 5]
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request); //[cite: 5]
    }).catch(() => {
      // Eğer hiçbir şey bulunamazsa ve internet yoksa beyaz ekran yerine anasayfayı göster[cite: 5]
      return caches.match('/'); //[cite: 5]
    })
  );
});

// ZEKİ BİLDİRİM SİSTEMİ (Uygulama açıksa susar, kapalıysa bildirimi ekrana basar)[cite: 5]
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json(); //[cite: 5]

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) { //[cite: 5]
        let isAppOpen = false; //[cite: 5]
        
        // Kullanıcı o an uygulamadaysa ve ekranı açıksa bunu tespit ediyoruz[cite: 5]
        for (let i = 0; i < windowClients.length; i++) {
          if (windowClients[i].focused) { //[cite: 5]
            isAppOpen = true; //[cite: 5]
            break; //[cite: 5]
          }
        }

        // SADECE uygulama kapalıysa veya arka plandaysa bildirimi fırlat![cite: 5]
        if (!isAppOpen) {
          const options = {
            body: data.body || "Efsun'un Dünyası'ndan bir bildirim var.", //[cite: 5]
            icon: '/icon.png', //[cite: 5]
            badge: '/icon.png', //[cite: 5]
            vibrate: [200, 100, 200], //[cite: 5]
            data: { url: '/' } //[cite: 5]
          };
          return self.registration.showNotification(data.title || "Yeni Mesaj!", options); //[cite: 5]
        }
      })
    );
  }
});

// Bildirime tıklanınca uygulamayı açar[cite: 5]
self.addEventListener('notificationclick', function (event) {
  event.notification.close(); //[cite: 5]
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) { //[cite: 5]
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i]; //[cite: 5]
        if (client.url.includes('/') && 'focus' in client) { //[cite: 5]
          return client.focus(); //[cite: 5]
        }
      }
      if (clients.openWindow) { //[cite: 5]
        return clients.openWindow('/'); //[cite: 5]
      }
    })
  );
});