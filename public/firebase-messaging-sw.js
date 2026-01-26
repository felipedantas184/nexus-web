// Importar scripts do Firebase via importScripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

console.log('[Service Worker] 🚀 Iniciando com Firebase...');

// Configuração do Firebase (mesma do frontend)
firebase.initializeApp({
  apiKey: 'AIzaSyCLQZbL3OJkjDd7_c4IHnDKQQrTdodqUQs',
  authDomain: 'nexus-platform-92bb4.firebaseapp.com',
  projectId: 'nexus-platform-92bb4',
  storageBucket: 'nexus-platform-92bb4.appspot.com',
  messagingSenderId: '1093617052984',
  appId: '1:1093617052984:web:64b921911222625c447195',
  measurementId: 'G-LLCJJ69D55'
});

const messaging = firebase.messaging();

// 1. BACKGROUND MESSAGE HANDLER (FCM)
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] 📬 Mensagem em background recebida:', payload);
  
  const { title, body, data, icon } = payload.notification || {};
  
  const notificationOptions = {
    body: body || 'Você tem novas atividades!',
    icon: icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: data || payload.data || {},
    tag: 'nexus-fcm-background',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: [
      {
        action: 'open_dashboard',
        title: 'Abrir Dashboard'
      },
      {
        action: 'dismiss',
        title: 'Fechar'
      }
    ]
  };
  
  return self.registration.showNotification(
    title || 'Nexus Platform',
    notificationOptions
  );
});

// 2. INSTALAÇÃO
self.addEventListener('install', (event) => {
  console.log('[SW] 📦 Instalando Service Worker...');
  event.waitUntil(self.skipWaiting());
});

// 3. ATIVAÇÃO
self.addEventListener('activate', (event) => {
  console.log('[SW] ✅ Ativando Service Worker...');
  event.waitUntil(self.clients.claim());
});

// 4. FETCH HANDLER (Cache para performance)
self.addEventListener('fetch', (event) => {
  // Cache-first para assets estáticos
  if (event.request.url.includes('/_next/static/') || 
      event.request.url.includes('/icons/')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});

// 5. NOTIFICATION CLICK HANDLER
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 🔔 Notificação clicada:', event.notification.data);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.route || 
                   event.notification.data?.url || 
                   '/student/dashboard';
  
  // Verificar ação do botão
  if (event.action === 'open_dashboard') {
    // Abrir dashboard específico
    openClientUrl('/student/dashboard');
  } else if (event.action === 'dismiss') {
    // Apenas fechar
    return;
  } else {
    // Clique na notificação
    const activityId = event.notification.data?.activityId;
    if (activityId) {
      openClientUrl(`/student/activity/${activityId}`);
    } else {
      openClientUrl(urlToOpen);
    }
  }
  
  function openClientUrl(url) {
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// 6. MESSAGE HANDLER (para testes do frontend)
self.addEventListener('message', (event) => {
  console.log('[SW] 📩 Mensagem recebida do frontend:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title = 'Teste', body = 'Mensagem de teste', data } = event.data;
    
    self.registration.showNotification(title, {
      body: body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: data,
      tag: 'test-notification',
      vibrate: [100, 50, 100]
    });
  }
  
  if (event.data && event.data.type === 'PING') {
    event.ports[0].postMessage({
      type: 'PONG',
      timestamp: new Date().toISOString(),
      swVersion: '2.0.0-fcm'
    });
  }
});

console.log('[Service Worker] ✅ Configurado com Firebase Messaging!');