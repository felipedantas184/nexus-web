// firebase/config.ts - COM TIPAGEM CORRIGIDA
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

// Inicialização condicional do FCM
let messaging: Messaging | null = null;

// Só inicializar no cliente
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      try {
        messaging = getMessaging(app);
        
        // Verificar se o service worker pode ser registrado
        if ('serviceWorker' in navigator) {
          registerServiceWorker();
        }
      } catch (error) {
        console.error('Erro ao inicializar Firebase Messaging:', error);
      }
    } else {
      console.warn('Este navegador não suporta Firebase Messaging');
    }
  }).catch((error) => {
    console.error('Erro ao verificar suporte do Firebase Messaging:', error);
  });
}

// Função para registrar service worker
async function registerServiceWorker() {
  try {
    // Registrar service worker para notificações
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });
    
    console.log('✅ Service Worker registrado com sucesso:', registration.scope);
    
    // Verificar se está ativo
    if (registration.active) {
      console.log('Service Worker está ativo');
    }
    
    // Configurar o messaging para usar este service worker
    if (messaging) {
      // Em produção, o FCM usará automaticamente o service worker registrado
    }
    
    return registration;
  } catch (error) {
    console.error('❌ Erro ao registrar Service Worker:', error);
    return null;
  }
}

export { messaging };
export default app;