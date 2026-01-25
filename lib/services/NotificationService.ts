// lib/services/NotificationService.ts - COMPLETO COM MÉTODOS LOCAIS
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
import { firestore } from '@/firebase/config';
import { UserNotificationPreferences } from '@/types/notification';

export class NotificationService {
  private static readonly COLLECTION = 'notifications';
  private static readonly PREFERENCES_COLLECTION = 'notificationPreferences';
  private static readonly DEVICES_COLLECTION = 'userDevices';

  // 1. SOLICITAR PERMISSÃO PARA NOTIFICAÇÕES LOCAIS
  static async requestNotificationPermission(): Promise<NotificationPermission> {
    try {
      if (!('Notification' in window)) {
        throw new Error('Este navegador não suporta notificações');
      }

      const permission = await Notification.requestPermission();

      console.log('Permissão para notificações:', permission);

      if (permission === 'granted') {
        console.log('✅ Permissão concedida para notificações');
        this.savePermissionGranted();
      }

      return permission;
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
        console.warn('Permissão para notificações não concedida');
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

      // Adicionar evento de clique
      notification.onclick = () => {
        notification.close();
        window.focus();

        // Se tiver URL nos dados, redirecionar
        if (options?.data?.url) {
          window.location.href = options.data.url;
        }
      };

      // Salvar no histórico
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

  // 5. TESTE DE NOTIFICAÇÃO (botão de teste)
  static async testNotification(): Promise<boolean> {
    try {
      // Primeiro, verificar permissão
      if (Notification.permission !== 'granted') {
        const permission = await this.requestNotificationPermission();
        if (permission !== 'granted') {
          return false;
        }
      }

      // Enviar notificação local
      const success = await this.sendLocalNotification(
        '✅ Teste de Notificação',
        'Esta é uma notificação de teste da Nexus Platform!',
        {
          data: {
            test: true,
            route: '/student/dashboard',
            timestamp: new Date().toISOString()
          },
          requireInteraction: true // Manter visível para teste
        }
      );

      return success;
    } catch (error) {
      console.error('Erro no teste de notificação:', error);
      return false;
    }
  }

  // 6. VERIFICAR STATUS DAS NOTIFICAÇÕES
  static async checkNotificationSupport(): Promise<{
    supported: boolean;
    permission: NotificationPermission;
    serviceWorker: boolean;
  }> {
    const supported = 'Notification' in window;
    const permission = supported ? Notification.permission : 'denied';
    const serviceWorker = 'serviceWorker' in navigator;

    return {
      supported,
      permission,
      serviceWorker
    };
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
        // Criar preferências padrão com TODOS os tipos
        const defaultPrefs: UserNotificationPreferences = {
          userId,
          enabled: true,
          channels: {
            push: true,
            in_app: true,
            email: false,
            sms: false
          },
          allowedHours: {
            start: "08:00",
            end: "21:00"
          },
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

      // Garantir que o objeto retornado tenha todos os campos necessários
      const userPrefs: UserNotificationPreferences = {
        userId: data.userId || userId,
        enabled: data.enabled !== undefined ? data.enabled : true,
        channels: {
          push: data.channels?.push !== undefined ? data.channels.push : true,
          in_app: data.channels?.in_app !== undefined ? data.channels.in_app : true,
          email: data.channels?.email !== undefined ? data.channels.email : false,
          sms: data.channels?.sms !== undefined ? data.channels.sms : false
        },
        allowedHours: data.allowedHours || {
          start: "08:00",
          end: "21:00"
        },
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

  // 7. MÉTODO PARA SETUP FOREGROUND LISTENER (se necessário)
  static setupForegroundMessageListener(callback: (payload: any) => void): () => void {
    // Simulação para ambiente local
    console.log('Foreground listener configurado (simulado)');

    // Retorna função para "desinscrever"
    return () => {
      console.log('Foreground listener removido');
    };
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