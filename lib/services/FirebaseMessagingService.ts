// lib/services/FirebaseMessagingService.ts - COMPLETO
import { messaging } from '@/firebase/config';
import { getToken, onMessage, deleteToken } from 'firebase/messaging';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  serverTimestamp,
  getFirestore 
} from 'firebase/firestore';
import { firestore } from '@/firebase/config';

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  isMobile: boolean;
  screenResolution: string;
  timezone: string;
  timestamp: string;
}

export interface FCMToken {
  id: string;
  userId: string;
  token: string;
  deviceInfo: DeviceInfo;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface NotificationPayload {
  notification?: {
    title: string;
    body: string;
    image?: string;
  };
  data?: {
    [key: string]: string;
  };
}

export class FirebaseMessagingService {
  private static readonly TOKENS_COLLECTION = 'fcmTokens';
  private static readonly NOTIFICATIONS_COLLECTION = 'notifications';
  private static db = firestore;

  // 1. VERIFICAR SE FCM ESTÁ DISPONÍVEL
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window && messaging !== null;
  }

  // 2. OBTER E SALVAR TOKEN FCM
  static async getAndSaveToken(userId: string): Promise<string | null> {
    try {
      if (!this.isSupported()) {
        console.warn('FCM não suportado neste navegador');
        return null;
      }

      if (!messaging) {
        throw new Error('Firebase Messaging não inicializado');
      }

      // Verificar permissão existente
      if (Notification.permission === 'denied') {
        console.warn('Permissão para notificações foi negada anteriormente');
        return null;
      }

      // Solicitar permissão se necessário
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('Permissão para notificações não concedida:', permission);
          return null;
        }
      }

      // Obter token FCM
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.warn('VAPID key não configurada');
        return null;
      }

      const token = await getToken(messaging, { vapidKey });
      
      if (!token) {
        console.warn('Não foi possível obter token FCM');
        return null;
      }

      // Salvar token no Firestore
      await this.saveUserToken(userId, token);
      
      console.log('✅ Token FCM obtido e salvo');
      return token;

    } catch (error: any) {
      console.error('Erro ao obter token FCM:', error);
      
      // Fallback para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('Usando token simulado para desenvolvimento');
        const simulatedToken = `dev-token-${userId}-${Date.now()}`;
        await this.saveUserToken(userId, simulatedToken);
        return simulatedToken;
      }
      
      return null;
    }
  }

  // 3. SALVAR TOKEN DO USUÁRIO
  private static async saveUserToken(userId: string, token: string): Promise<void> {
    try {
      const deviceInfo = this.getDeviceInfo();
      
      // Verificar se token já existe para este dispositivo
      const q = query(
        collection(this.db, this.TOKENS_COLLECTION),
        where('userId', '==', userId),
        where('deviceInfo.userAgent', '==', deviceInfo.userAgent)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Novo token
        await addDoc(collection(this.db, this.TOKENS_COLLECTION), {
          userId,
          token,
          deviceInfo,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isActive: true
        });
        console.log('Novo token salvo para usuário:', userId);
      } else {
        // Atualizar token existente
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          token,
          deviceInfo,
          updatedAt: serverTimestamp(),
          isActive: true
        });
        console.log('Token atualizado para usuário:', userId);
      }
    } catch (error) {
      console.error('Erro ao salvar token:', error);
      throw error;
    }
  }

  // 4. CONFIGURAR LISTENER PARA MENSAGENS EM PRIMEIRO PLANO
  static setupForegroundListener(
    onMessageReceived: (payload: any) => void
  ): () => void {
    if (!this.isSupported() || !messaging) {
      console.warn('Firebase Messaging não disponível para foreground listener');
      return () => {};
    }

    try {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('📬 Mensagem FCM em primeiro plano:', payload);
        
        // Executar callback
        onMessageReceived(payload);
        
        // Mostrar notificação customizada se desejado
        if (payload.notification) {
          this.showCustomNotification(payload);
        }
      });

      console.log('✅ Foreground listener configurado');
      return unsubscribe;
    } catch (error) {
      console.error('Erro ao configurar foreground listener:', error);
      return () => {};
    }
  }

  // 5. NOTIFICAÇÃO CUSTOMIZADA EM PRIMEIRO PLANO
  private static showCustomNotification(payload: any): void {
    if (Notification.permission !== 'granted' || !('Notification' in window)) {
      return;
    }

    try {
      const title = payload.notification?.title || 'Nexus Platform';
      const body = payload.notification?.body || '';
      
      const notification = new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: payload.data || {},
        tag: 'foreground-notification',
        requireInteraction: false
      });

      notification.onclick = () => {
        notification.close();
        window.focus();
        
        if (payload.data?.route) {
          window.location.href = payload.data.route;
        }
      };
    } catch (error) {
      console.error('Erro ao mostrar notificação customizada:', error);
    }
  }

  // 6. AGENDAR NOTIFICAÇÃO DIÁRIA (CLIENT-SIDE PARA TESTE)
  static async scheduleDailyReminder(
    userId: string, 
    hour: number = 8, 
    minute: number = 0
  ): Promise<boolean> {
    try {
      // Primeiro, garantir que temos token
      const token = await this.getAndSaveToken(userId);
      if (!token) {
        console.warn('Não foi possível obter token para agendamento');
        return false;
      }

      // Calcular horário
      const now = new Date();
      const targetTime = new Date();
      targetTime.setDate(now.getDate());
      targetTime.setHours(hour, minute, 0, 0);
      
      // Se já passou do horário hoje, agenda para amanhã
      if (targetTime < now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
      const delay = targetTime.getTime() - now.getTime();

      // Salvar agendamento no Firestore
      await addDoc(collection(this.db, this.NOTIFICATIONS_COLLECTION), {
        userId,
        type: 'daily_reminder',
        title: '📚 Atividades do Dia',
        body: 'Hora de realizar suas atividades diárias!',
        scheduledFor: targetTime,
        status: 'scheduled',
        data: {
          route: '/student/dashboard',
          priority: 'normal',
          triggerTime: targetTime.toISOString(),
          test: delay < 24 * 60 * 60 * 1000 // Marcar como teste se for para hoje/amanhã
        },
        metadata: {
          triggeredBy: 'user_test',
          scheduledAt: new Date().toISOString()
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log(`⏰ Notificação agendada para ${targetTime.toLocaleString()}`);
      
      // Para testes imediatos, podemos enviar uma notificação de teste
      if (delay < 5 * 60 * 1000) { // Se for em menos de 5 minutos
        console.log('Enviando notificação de teste imediata...');
        await this.sendTestNotification(userId);
      }
      
      return true;

    } catch (error) {
      console.error('Erro ao agendar notificação:', error);
      return false;
    }
  }

  // 7. ENVIAR NOTIFICAÇÃO DE TESTE
  static async sendTestNotification(userId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          title: '🔔 Teste de Notificação',
          body: 'Esta é uma notificação de teste do Nexus Platform!',
          type: 'test'
        })
      });
      
      const result = await response.json();
      return result.success === true;
      
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
      return false;
    }
  }

  // 8. OBTER TOKENS DE UM USUÁRIO
  static async getUserTokens(userId: string): Promise<string[]> {
    try {
      const q = query(
        collection(this.db, this.TOKENS_COLLECTION),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data().token);
    } catch (error) {
      console.error('Erro ao obter tokens:', error);
      return [];
    }
  }

  // 9. REMOVER/INVALIDAR TOKEN
  static async removeToken(token: string): Promise<void> {
    try {
      // Buscar token
      const q = query(
        collection(this.db, this.TOKENS_COLLECTION),
        where('token', '==', token)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        
        // Marcar como inativo
        await updateDoc(docRef, {
          isActive: false,
          updatedAt: serverTimestamp()
        });
        
        console.log('Token marcado como inativo');
        
        // Tentar deletar token do FCM
        if (messaging) {
          try {
            await deleteToken(messaging);
            console.log('Token deletado do FCM');
          } catch (deleteError) {
            console.warn('Não foi possível deletar token do FCM:', deleteError);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao remover token:', error);
      throw error;
    }
  }

  // 10. LIMPAR TODOS OS TOKENS DO USUÁRIO (logout)
  static async clearUserTokens(userId: string): Promise<void> {
    try {
      const q = query(
        collection(this.db, this.TOKENS_COLLECTION),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      
      const promises = snapshot.docs.map(async (docSnapshot) => {
        const docRef = docSnapshot.ref;
        await updateDoc(docRef, {
          isActive: false,
          updatedAt: serverTimestamp()
        });
      });
      
      await Promise.all(promises);
      console.log(`Todos os tokens do usuário ${userId} foram inativados`);
      
    } catch (error) {
      console.error('Erro ao limpar tokens do usuário:', error);
      throw error;
    }
  }

  // 11. VERIFICAR STATUS DO FCM
  static async checkFCMStatus(): Promise<{
    supported: boolean;
    hasToken: boolean;
    permission: NotificationPermission;
    serviceWorker: boolean;
  }> {
    const supported = this.isSupported();
    const permission = Notification.permission;
    const serviceWorker = 'serviceWorker' in navigator;
    
    let hasToken = false;
    if (supported && messaging) {
      try {
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || ''
        });
        hasToken = !!token;
      } catch (error) {
        console.warn('Erro ao verificar token:', error);
      }
    }
    
    return {
      supported,
      hasToken,
      permission,
      serviceWorker
    };
  }

  // 12. INFORMAÇÕES DO DISPOSITIVO
  private static getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      isMobile: /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString()
    };
  }

  // 13. REGISTRAR SERVICE WORKER (helper)
  static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker não suportado');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      console.log('✅ Service Worker registrado:', registration.scope);
      
      // Aguardar ativação
      if (registration.active) {
        console.log('Service Worker ativo');
      } else if (registration.installing) {
        await new Promise<void>((resolve) => {
          registration.installing!.addEventListener('statechange', (event) => {
            if ((event.target as ServiceWorker).state === 'activated') {
              console.log('Service Worker ativado');
              resolve();
            }
          });
        });
      }
      
      return registration;
    } catch (error) {
      console.error('❌ Erro ao registrar Service Worker:', error);
      return null;
    }
  }
}