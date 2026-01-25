// public/firebase-messaging-sw.js - VERSÃO CORRIGIDA E SIMPLIFICADA
console.log('[Service Worker] 🚀 Iniciando...');

// 1. INSTALAÇÃO
self.addEventListener('install', (event) => {
  console.log('[SW] 📦 Instalando...');
  // Pular espera - IMPORTANTE
  event.waitUntil(self.skipWaiting());
});

// 2. ATIVAÇÃO
self.addEventListener('activate', (event) => {
  console.log('[SW] ✅ Ativando...');
  // Tomar controle imediato de todos os clients
  event.waitUntil(self.clients.claim());
});

// 3. FETCH HANDLER (OBRIGATÓRIO para Service Worker ativo)
self.addEventListener('fetch', (event) => {
  // Handler vazio - só para manter SW ativo
  // Pode passar direto ou adicionar cache depois
  return; // ou event.respondWith(fetch(event.request))
});

// 4. PUSH HANDLER (notificações)
self.addEventListener('push', (event) => {
  console.log('[SW] 📬 Evento push recebido');
  
  let title = 'Nexus Platform';
  let body = 'Você tem novas atividades!';
  let icon = '/icons/icon-192x192.png';
  let data = {};
  
  try {
    if (event.data) {
      const payload = event.data.json();
      title = payload.title || title;
      body = payload.body || body;
      icon = payload.icon || icon;
      data = payload.data || {};
    }
  } catch (e) {
    // Se não for JSON, usar texto
    body = event.data.text() || body;
  }
  
  const options = {
    body: body,
    icon: icon,
    badge: '/icons/badge-72x72.png',
    data: data,
    tag: 'nexus-push',
    vibrate: [200, 100, 200],
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 5. MESSAGE HANDLER (para testes)
self.addEventListener('message', (event) => {
  console.log('[SW] 📩 Mensagem recebida:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title = 'Teste', body = 'Mensagem de teste' } = event.data;
    
    self.registration.showNotification(title, {
      body: body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'test-notification',
      vibrate: [100, 50, 100]
    });
  }
});

// 6. NOTIFICATION CLICK
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 🔔 Notificação clicada');
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/student/dashboard';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

console.log('[Service Worker] ✅ Configurado com sucesso!');