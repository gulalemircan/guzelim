self.addEventListener('install', (event) => {
  self.skipWaiting(); 
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); 
});

self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
        let isAppOpen = windowClients.some(client => client.focused);
        if (!isAppOpen) {
          return self.registration.showNotification(data.title || "Yeni Mesaj!", {
            body: data.body || "Bir mesajın var!",
            icon: '/icon-512.png',
            badge: '/icon-512.png',
            vibrate: [200, 100, 200],
            data: { url: '/' }
          });
        }
      })
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      for (let client of windowClients) {
        if (client.url.includes('/') && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});