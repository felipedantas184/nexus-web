// public/firebase-messaging-sw.js
console.log('[Service Worker] ✅ Inicializando...');

// Evento de instalação
self.addEventListener('install', (event) => {
  console.log('[Service Worker] 📦 Instalado');
  self.skipWaiting(); // Ativar imediatamente
});

// Evento de ativação
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] 🚀 Ativado');
  event.waitUntil(clients.claim()); // Tomar controle imediato
});

// Receber mensagens push (LOCAL - sem Firebase)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] 📬 Evento push recebido:', event);
  
  let notificationData = {
    title: 'Nexus Platform',
    body: 'Você tem novas atividades!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png'
  };
  
  // Tentar extrair dados do evento
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: data.data || {}
      };
    } catch (e) {
      // Se não for JSON, tentar texto
      const text = event.data.text();
      if (text) {
        notificationData.body = text;
      }
    }
  }
  
  console.log('[Service Worker] Mostrando notificação:', notificationData);
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data || {},
      tag: 'nexus-notification', // Agrupar notificações similares
      vibrate: [200, 100, 200], // Padrão de vibração
      actions: [
        {
          action: 'open',
          title: 'Abrir'
        },
        {
          action: 'dismiss',
          title: 'Fechar'
        }
      ]
    })
  );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] 🔔 Notificação clicada:', event.notification);
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  let urlToOpen = '/student/dashboard';
  
  if (notificationData.route) {
    urlToOpen = notificationData.route;
  }
  
  // Verificar ação do botão
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then((windowClients) => {
        // Procurar janela aberta
        for (const client of windowClients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Abrir nova janela se não encontrar
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  } else if (event.action === 'dismiss') {
    console.log('[Service Worker] Notificação descartada');
  }
});

// Fechar notificação
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] ❌ Notificação fechada:', event.notification);
});

console.log('[Service Worker] ✅ Configurado com sucesso!');