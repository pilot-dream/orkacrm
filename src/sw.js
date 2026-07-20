import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

// Force immediate activation and control of clients when a new service worker is installed
self.skipWaiting();
clientsClaim();

// Precaching do Vite
precacheAndRoute(self.__WB_MANIFEST || []);

// Escutar eventos de Push Notification
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event sem dados recebido.');
    return;
  }

  let payload = {
    title: 'ORKA CRM',
    body: 'Nova notificação de sistema.',
    url: '/'
  };

  try {
    payload = event.data.json();
  } catch (e) {
    // Se o payload não for JSON (texto simples)
    payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: '/logo-192.png',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      url: payload.url || '/'
    },
    tag: 'orka-notification-tag', // Agrupa notificações similares
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// Tratar clique na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // URL para redirecionar o usuário
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.href).toString();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Tentar encontrar uma aba do CRM que já esteja aberta
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        const clientUrl = new URL(client.url).origin;
        const currentUrl = new URL(self.location.href).origin;
        
        if (clientUrl === currentUrl) {
          // Se encontrou a aba, navega para a URL e foca
          return client.navigate(targetUrl).then((c) => {
            if (c) c.focus();
          });
        }
      }
      
      // Se não encontrou nenhuma aba aberta, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
