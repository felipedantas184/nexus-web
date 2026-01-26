// lib/services/NotificationService.ts
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  Timestamp,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { firestore, messaging } from '@/firebase/config';
import { UserNotificationPreferences } from '@/types/notification';
import { getToken, deleteToken, onMessage } from 'firebase/messaging';

// Importar funções do Firebase Cloud Functions
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/config';

export class NotificationService {
  private static readonly COLLECTION = 'notifications';
  private static readonly PREFERENCES_COLLECTION = 'notificationPreferences';
  private static readonly TOKENS_COLLECTION = 'userFCMTokens';

  // ========== MÉTODOS FCM (NOVOS) ==========

  /**
   * Solicitar permissão e obter token FCM real
   */
  static async requestFCMToken(userId: string): Promise<string | null> {
    try {
      if (!messaging) {
        console.warn('Firebase Messaging não disponível');
        return null;
      }

      // Solicitar permissão
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        console.warn('Permissão para notificações não concedida');
        return null;
      }

      // Obter VAPID key do environment
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.error('VAPID key não configurada');
        return null;
      }

      // Obter token FCM
      const token = await getToken(messaging, { vapidKey });

      if (!token) {
        console.warn('Não foi possível obter token FCM');
        return null;
      }

      console.log('✅ Token FCM obtido:', token.substring(0, 20) + '...');

      // Salvar token no Firestore via Cloud Function
      await this.saveFCMTokenToBackend(userId, token);

      return token;

    } catch (error: any) {
      console.error('❌ Erro ao obter token FCM:', error);

      // Se for erro de permissão, não propagar
      if (error.code === 'messaging/permission-blocked') {
        console.warn('Permissão para notificações bloqueada pelo usuário');
      }

      return null;
    }
  }

  /**
   * Salvar token FCM no backend (via Cloud Function)
   */
  private static async saveFCMTokenToBackend(userId: string, token: string): Promise<boolean> {
    try {
      if (!functions) {
        console.warn('Firebase Functions não disponível');
        return false;
      }

      const saveTokenFunction = httpsCallable(functions, 'saveUserFCMToken');

      await saveTokenFunction({
        token,
        deviceInfo: {
          platform: this.getPlatform(),
          userAgent: navigator.userAgent,
          language: navigator.language
        }
      });

      console.log('✅ Token FCM salvo no backend');
      return true;

    } catch (error) {
      console.error('❌ Erro ao salvar token FCM no backend:', error);
      return false;
    }
  }

  /**
   * Remover token FCM (logout ou dispositivo removido)
   */
  static async removeFCMToken(userId: string, token: string): Promise<boolean> {
    try {
      if (!functions || !messaging) {
        console.warn('Firebase não disponível');
        return false;
      }

      // Remover localmente
      await deleteToken(messaging);

      // Remover do backend
      const removeTokenFunction = httpsCallable(functions, 'removeUserFCMToken');
      await removeTokenFunction({ token });

      console.log('✅ Token FCM removido');
      return true;

    } catch (error) {
      console.error('❌ Erro ao remover token FCM:', error);
      return false;
    }
  }

  /**
   * Configurar listener para mensagens em foreground
   */
  static setupForegroundMessageListener(
    onMessageReceived: (payload: any) => void
  ): () => void {
    if (!messaging) {
      console.warn('Firebase Messaging não disponível');
      return () => { };
    }

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📬 Mensagem em foreground recebida:', payload);

      // Mostrar notificação local se não estiver visível
      if (payload.notification) {
        this.showLocalForegroundNotification(
          payload.notification.title || 'Nexus Platform',
          payload.notification.body || 'Nova mensagem',
          payload.data
        );
      }

      // Chamar callback personalizado
      onMessageReceived(payload);
    });

    return unsubscribe;
  }

  /**
   * Enviar notificação push via FCM (para testes ou ações específicas)
   */
  static async sendFCMPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    try {
      const functionUrl = 'http://localhost:5001/projeto-nexus-62ebb/southamerica-east1/sendPushNotification';

      console.log('📤 Chamando função via fetch...');

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title,
          body,
          data,
          type: 'custom'
        })
      });

      console.log('✅ Status:', response.status);
      const result = await response.json();
      console.log('✅ Resultado:', result);

      return result.success === true;

    } catch (error) {
      console.error('❌ Erro:', error);
      return false;
    }
  }

  /**
   * Verificar se FCM está disponível e configurado
   */
  static async checkFCMAvailability(): Promise<{
    available: boolean;
    permission: NotificationPermission;
    tokenExists: boolean;
    vapidKeyConfigured: boolean;
  }> {
    const available = !!messaging;
    const permission = Notification.permission;
    const vapidKeyConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    let tokenExists = false;
    if (messaging && permission === 'granted') {
      try {
        const token = await getToken(messaging);
        tokenExists = !!token;
      } catch (error) {
        console.warn('Erro ao verificar token:', error);
      }
    }

    return {
      available,
      permission,
      tokenExists,
      vapidKeyConfigured
    };
  }

  // ========== MÉTODOS AUXILIARES ==========

  private static getPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    if (userAgent.includes('windows')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';

    return 'web';
  }

  private static async showLocalForegroundNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    // Usar a notificação local existente como fallback
    await this.sendLocalNotification(title, body, {
      icon: '/icons/icon-192x192.png',
      data: data,
      requireInteraction: false
    });
  }

  // 1. SOLICITAR PERMISSÃO PARA NOTIFICAÇÕES LOCAIS
  static async requestNotificationPermission(): Promise<NotificationPermission> {
    try {
      // Primeiro tentar com FCM se disponível
      const fcmAvailable = await this.checkFCMAvailability();

      if (fcmAvailable.available && fcmAvailable.vapidKeyConfigured) {
        // Usar FCM
        const permission = await Notification.requestPermission();
        return permission;
      } else {
        // Fallback para notificações locais
        return "default"; //COMENTADO
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return 'denied';
    }
  }

  // 2. ENVIAR NOTIFICAÇÃO LOCAL (sem servidor)
  static async sendLocalNotification(
    title: string,
    body: string,
    options?: NotificationOptions
  ): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        throw new Error('Notificações não suportadas');
      }
      if (Notification.permission !== 'granted') {
        console.warn('Permissão não concedida');
        return false;
      }
      const notification = new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'nexus-local-notification',
        requireInteraction: false,
        ...options
      });
      notification.onclick = () => {
        notification.close();
        window.focus();
        if (options?.data?.url) {
          window.location.href = options.data.url;
        }
      };
      await this.saveNotificationToHistory({
        title,
        body,
        type: 'activity_reminder',
        channels: ['in_app'],
        data: options?.data
      });
      return true;
    } catch (error) {
      console.error('Erro ao enviar notificação local:', error);
      return false;
    }
  }

  // 3. ENVIAR NOTIFICAÇÃO PUSH SIMULADA (para testar service worker)
  static async sendSimulatedPushNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    try {
      // Verificar se service worker está registrado
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker não suportado');
      }

      const registration = await navigator.serviceWorker.ready;

      // Enviar mensagem para o service worker
      registration.active?.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        data,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Notificação simulada enviada para Service Worker');

      // Também salvar no histórico
      await this.saveNotificationToHistory({
        title,
        body,
        type: 'system',
        channels: ['push'],
        data
      });

      return true;
    } catch (error) {
      console.error('Erro ao enviar notificação simulada:', error);
      return false;
    }
  }

  // 4. AGENDAR NOTIFICAÇÃO DIÁRIA (LOCAL)
  static async scheduleDailyLocalNotification(
    userId: string,
    activities: Array<{ id: string, title: string }>
  ): Promise<void> {
    try {
      if (activities.length === 0) return;

      const preferences = await this.getUserPreferences(userId);

      if (!preferences?.enabled || !preferences.channels.in_app) {
        return;
      }

      // Calcular melhor horário
      const optimalTime = this.calculateOptimalTime(preferences);
      const now = new Date();

      // Se for um horário futuro, usar setTimeout
      if (optimalTime > now) {
        const delay = optimalTime.getTime() - now.getTime();

        console.log(`Agendando notificação local para ${optimalTime.toLocaleTimeString()} (em ${Math.round(delay / 1000 / 60)} minutos)`);

        setTimeout(async () => {
          await this.sendLocalNotification(
            '📚 Atividades do Dia',
            `Você tem ${activities.length} atividade(s) para hoje. Vamos começar?`,
            {
              data: {
                activityIds: activities.map(a => a.id),
                route: '/student/dashboard',
                priority: 'normal'
              }
            }
          );
        }, delay);
      } else {
        // Enviar imediatamente se já passou do horário
        await this.sendLocalNotification(
          '📚 Atividades do Dia',
          `Você tem ${activities.length} atividade(s) para hoje. Vamos começar?`,
          {
            data: {
              activityIds: activities.map(a => a.id),
              route: '/student/dashboard',
              priority: 'normal'
            }
          }
        );
      }
    } catch (error) {
      console.error('Erro ao agendar notificação local:', error);
    }
  }

  static async checkServiceWorkerStatus(): Promise<{
    registered: boolean;
    active: boolean;
    state?: string;
    error?: string;
  }> {
    try {
      if (!('serviceWorker' in navigator)) {
        return { registered: false, active: false, error: 'Service Worker não suportado' };
      }

      const registrations = await navigator.serviceWorker.getRegistrations();

      if (registrations.length === 0) {
        return { registered: false, active: false, error: 'Nenhum Service Worker registrado' };
      }

      const registration = registrations.find(reg =>
        reg.scope.includes(window.location.origin)
      );

      if (!registration) {
        return { registered: false, active: false, error: 'Service Worker não encontrado para este domínio' };
      }

      return {
        registered: true,
        active: !!registration.active,
        state: registration.active?.state || 'unknown'
      };

    } catch (error: any) {
      return {
        registered: false,
        active: false,
        error: error.message
      };
    }
  }

  static async diagnoseConnection(): Promise<{
    emulatorReachable: boolean;
    functionsEndpoint: string;
    timestamp: string;
  }> {
    try {
      // CORREÇÃO: Usar localhost ou 127.0.0.1 baseado no que realmente funciona
      const baseUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:5001'  // ← VOLTAR para localhost (mais padrão)
        : `https://southamerica-east1-${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net`;

      const endpoint = `${baseUrl}/projeto-nexus-62ebb/southamerica-east1/healthCheck`;

      // CORREÇÃO: Adicionar modo 'cors' explicitamente
      const response = await fetch(endpoint, {
        method: 'GET',
        mode: 'cors', // ← ADICIONAR ESTE PARÂMETRO
        headers: { 'Content-Type': 'application/json' }
      });

      return {
        emulatorReachable: response.ok,
        functionsEndpoint: endpoint,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Diagnose connection error:', error);
      return {
        emulatorReachable: false,
        functionsEndpoint: 'error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // ATUALIZAR testNotification
  static async testNotification(userId?: string): Promise<boolean> {
    // Agora testa FCM primeiro, depois fallback
    try {
      console.log('=== TESTE DE NOTIFICAÇÃO COM FCM ===');

      // USAR userId REAL se fornecido, senão usar o teste
      const targetUserId = userId || 'test_user_id';

      console.log(`🎯 Usuário alvo: ${targetUserId}`);

      // PRIMEIRO: Diagnóstico de conexão
      const connection = await this.diagnoseConnection();
      console.log('🔍 Diagnóstico de conexão:', connection);

      if (!connection.emulatorReachable && process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Emulador não está acessível. Execute: firebase emulators:start --only functions');
      }

      // 1. Verificar FCM
      const fcmStatus = await this.checkFCMAvailability();
      console.log('Status FCM:', fcmStatus);

      if (fcmStatus.available && fcmStatus.tokenExists) {
        // Testar com FCM usando ID correto
        const testResult = await this.sendFCMPushNotification(
          targetUserId, // ← USAR userId correto
          '✅ Teste FCM Funcionando',
          'Esta é uma notificação de teste via Firebase Cloud Messaging',
          { test: true, timestamp: new Date().toISOString() }
        );

        if (testResult) {
          console.log('✅ Teste FCM bem-sucedido');
          return true;
        }
      }

      // 2. Fallback para teste local
      console.log('Usando fallback local...');
      return await this.sendLocalNotification(
        'Teste Local',
        'Notificação de teste (fallback)',
        {
          icon: '/icons/icon-192x192.png',
          requireInteraction: true,
          data: { test: true, mode: 'local_fallback' }
        }
      );

    } catch (error: any) {
      console.error('❌ Erro no teste:', error);
      return false;
    }
  }

  // 12. DETECTAR iOS
  static isIOS(): boolean {
    if (typeof window === 'undefined') return false;

    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  }

  // 13. VERIFICAR SUPORTE iOS
  static checkIOSSupport(): {
    safari: boolean;
    standalone: boolean;
    notifications: boolean;
    instructions: string[];
  } {
    const isIOS = this.isIOS();
    const isStandalone = (window.navigator as any).standalone === true;

    const result = {
      safari: isIOS && /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
      standalone: isStandalone,
      notifications: 'Notification' in window,
      instructions: [] as string[]
    };

    // Instruções para iOS
    if (isIOS) {
      if (!isStandalone) {
        result.instructions.push(
          '📱 Para notificações no iOS:',
          '1. Clique no botão de compartilhar (📤)',
          '2. Role para baixo e selecione "Adicionar à Tela Inicial"',
          '3. Abra o app a partir do ícone na sua tela',
          '4. Ative as notificações quando solicitado'
        );
      }

      if (!result.notifications) {
        result.instructions.push(
          '🔕 Notificações push não são totalmente suportadas no iOS Safari',
          'Use o app instalado (adicionado à tela inicial) para melhor experiência'
        );
      }
    }

    return result;
  }

  // 14. MÉTODO DE TESTE ESPECÍFICO PARA iOS
  static async testIOSNotification(): Promise<boolean> {
    try {
      const iosInfo = this.checkIOSSupport();
      console.log('iOS Info:', iosInfo);

      // iOS requer que o site seja aberto como PWA (standalone)
      if (this.isIOS() && !iosInfo.standalone) {
        console.warn('⚠️ iOS: Site não está em modo standalone (PWA)');
        // Podemos mostrar notificação local mesmo assim
      }

      // iOS tem suporte limitado, mas podemos tentar
      if (Notification.permission === 'granted') {
        return await this.sendLocalNotification(
          '📱 Teste iOS',
          'Notificação de teste no iPhone/iPad',
          {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            requireInteraction: false,
            silent: true // iOS pode preferir notificações silenciosas
          }
        );
      }

      return false;
    } catch (error) {
      console.error('Erro no teste iOS:', error);
      return false;
    }
  }

  // 15. ATUALIZAR checkNotificationSupport PARA INCLUIR iOS
  static async checkNotificationSupport(): Promise<{
    supported: boolean;
    permission: NotificationPermission;
    serviceWorker: boolean;
    isIOS?: boolean;
    iosStandalone?: boolean;
    iosInstructions?: string[];
  }> {
    const supported = 'Notification' in window;
    const permission = supported ? Notification.permission : 'denied';
    const serviceWorker = 'serviceWorker' in navigator;
    const isIOS = this.isIOS();

    const result: any = {
      supported,
      permission,
      serviceWorker
    };

    if (isIOS) {
      const iosInfo = this.checkIOSSupport();
      result.isIOS = true;
      result.iosStandalone = iosInfo.standalone;
      result.iosInstructions = iosInfo.instructions;
      // iOS tem suporte limitado, mas consideramos "suportado" para mostrar UI
      result.supported = true; // Mostrar UI mesmo com limitações
    }

    return result;
  }

  // 7. OBTER PREFERÊNCIAS DO USUÁRIO (MANTIDO)
  static async getUserPreferences(userId: string): Promise<UserNotificationPreferences | null> {
    try {
      const q = query(
        collection(firestore, this.PREFERENCES_COLLECTION),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        const defaultPrefs: UserNotificationPreferences = {
          userId,
          enabled: true,
          channels: { push: true, in_app: true, email: false, sms: false },
          allowedHours: { start: "08:00", end: "21:00" },
          allowedDays: [0, 1, 2, 3, 4, 5, 6],
          types: {
            activity_reminder: true,
            schedule_update: true,
            achievement: true,
            message: true,
            system: false,
            therapeutic_reminder: true,
            educational_reminder: true
          },
          therapeuticSettings: {
            avoidEveningNotifications: true,
            weekendReducedFrequency: true,
            emotionalStateConsideration: true,
            maxDailyNotifications: 4
          },
          updatedAt: new Date()
        };
        await addDoc(collection(firestore, this.PREFERENCES_COLLECTION), defaultPrefs);
        return defaultPrefs;
      }
      const data = snapshot.docs[0].data();
      const userPrefs: UserNotificationPreferences = {
        userId: data.userId || userId,
        enabled: data.enabled !== undefined ? data.enabled : true,
        channels: {
          push: data.channels?.push !== undefined ? data.channels.push : true,
          in_app: data.channels?.in_app !== undefined ? data.channels.in_app : true,
          email: data.channels?.email !== undefined ? data.channels.email : false,
          sms: data.channels?.sms !== undefined ? data.channels.sms : false
        },
        allowedHours: data.allowedHours || { start: "08:00", end: "21:00" },
        allowedDays: data.allowedDays || [0, 1, 2, 3, 4, 5, 6],
        types: {
          activity_reminder: data.types?.activity_reminder !== undefined ? data.types.activity_reminder : true,
          schedule_update: data.types?.schedule_update !== undefined ? data.types.schedule_update : true,
          achievement: data.types?.achievement !== undefined ? data.types.achievement : true,
          message: data.types?.message !== undefined ? data.types.message : true,
          system: data.types?.system !== undefined ? data.types.system : false,
          therapeutic_reminder: data.types?.therapeutic_reminder !== undefined ? data.types.therapeutic_reminder : true,
          educational_reminder: data.types?.educational_reminder !== undefined ? data.types.educational_reminder : true
        },
        devices: data.devices || [],
        therapeuticSettings: data.therapeuticSettings || {
          avoidEveningNotifications: true,
          weekendReducedFrequency: true,
          emotionalStateConsideration: true,
          maxDailyNotifications: 4
        },
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
      return userPrefs;
    } catch (error) {
      console.error('Erro ao buscar preferências:', error);
      return null;
    }
  }

  // 8. MÉTODOS AUXILIARES
  private static async savePermissionGranted(): Promise<void> {
    try {
      // Salvar que o usuário concedeu permissão
      localStorage.setItem('notification_permission_granted', 'true');
      localStorage.setItem('notification_permission_date', new Date().toISOString());
    } catch (error) {
      console.error('Erro ao salvar permissão:', error);
    }
  }

  private static async saveNotificationToHistory(notification: {
    title: string;
    body: string;
    type: string;
    channels: string[];
    data?: any;
  }): Promise<void> {
    try {
      // Salvar no Firestore para histórico
      await addDoc(collection(firestore, this.COLLECTION), {
        ...notification,
        createdAt: serverTimestamp(),
        status: 'sent'
      });
    } catch (error) {
      console.error('Erro ao salvar notificação no histórico:', error);
    }
  }

  private static calculateOptimalTime(preferences: UserNotificationPreferences): Date {
    const [startHour, startMinute] = preferences.allowedHours.start.split(':').map(Number);
    const now = new Date();

    // Horário ideal: 9:00 AM
    const optimalTime = new Date();
    optimalTime.setHours(9, 0, 0, 0);

    // Ajustar se 9:00 está fora do período permitido
    if (!this.isWithinAllowedHours(optimalTime, preferences)) {
      optimalTime.setHours(startHour, startMinute, 0, 0);
    }

    // Se já passou do horário hoje, agenda para amanhã
    if (optimalTime < now) {
      optimalTime.setDate(optimalTime.getDate() + 1);
    }

    return optimalTime;
  }

  private static isWithinAllowedHours(time: Date, preferences: UserNotificationPreferences): boolean {
    const [startHour, startMinute] = preferences.allowedHours.start.split(':').map(Number);
    const [endHour, endMinute] = preferences.allowedHours.end.split(':').map(Number);

    const timeHour = time.getHours();
    const timeMinute = time.getMinutes();

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const timeMinutes = timeHour * 60 + timeMinute;

    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  }

  // 6. MÉTODO PARA TESTAR NOTIFICAÇÃO SIMULADA (Service Worker)
  static async sendTestNotification(
    userId: string,
    title: string,
    body: string
  ): Promise<boolean> {
    try {
      // Usar o método existente testNotification
      return await this.testNotification();
    } catch (error) {
      console.error('Erro em sendTestNotification:', error);
      return false;
    }
  }

  // 8. MÉTODO PARA OBTER TOKEN (simulado para ambiente local)
  static async requestPermissionAndGetToken(userId: string): Promise<string | null> {
    try {
      const permission = await this.requestNotificationPermission();

      if (permission === 'granted') {
        // Simular token para ambiente local
        const simulatedToken = `simulated-token-${userId}-${Date.now()}`;
        console.log('Token simulado gerado:', simulatedToken);
        return simulatedToken;
      }

      return null;
    } catch (error) {
      console.error('Erro ao obter token:', error);
      return null;
    }
  }
}