// types/notification.ts - NOVO ARQUIVO
export type NotificationType = 
  | 'activity_reminder' 
  | 'schedule_update' 
  | 'achievement' 
  | 'message' 
  | 'system'
  | 'therapeutic_reminder'
  | 'educational_reminder';

export type NotificationChannel = 'push' | 'in_app' | 'email' | 'sms';
export type NotificationStatus = 'scheduled' | 'sent' | 'delivered' | 'read' | 'failed' | 'cancelled';

export interface Notification {
  id: string;
  userId: string; // Destinatário
  title: string;
  body: string;
  type: NotificationType;
  
  // Dados específicos
  data?: {
    activityId?: string;
    scheduleInstanceId?: string;
    scheduleTemplateId?: string;
    route?: string; // Ex: '/student/activity/123'
    deepLink?: string;
    priority?: 'high' | 'normal' | 'low';
    [key: string]: any;
  };
  
  // Controle de entrega
  channels: NotificationChannel[];
  scheduledFor: Date;
  sentAt?: Date;
  expiresAt: Date;
  
  // Status e tracking
  status: NotificationStatus;
  deliveryAttempts: number;
  lastAttemptAt?: Date;
  
  // Metadados
  metadata: {
    triggeredBy: 'system' | 'professional' | 'automated' | 'user';
    campaignId?: string;
    templateId?: string;
    therapeuticContext?: string;
    [key: string]: any;
  };
  
  // Resposta do usuário
  userInteraction?: {
    interactedAt?: Date;
    action?: 'dismissed' | 'clicked' | 'snoozed' | 'ignored';
    emotionalState?: number; // 1-5
    feedback?: string;
  };
  
  // Timestamps padrão
  createdAt: Date;
  updatedAt: Date;
}

export interface UserNotificationPreferences {
  userId: string;
  enabled: boolean;
  
  // Canais preferidos
  channels: {
    push: boolean;
    in_app: boolean;
    email: boolean;
    sms: boolean;
  };
  
  // Horários permitidos
  allowedHours: {
    start: string; // "08:00"
    end: string;   // "21:00"
  };
  
  // Dias da semana permitidos (0-6, Domingo-Sábado)
  allowedDays: number[];
  
  // Preferências por tipo
  types: Record<NotificationType, boolean>;
  
  // Dados de dispositivo (para FCM)
  devices?: Array<{
    token: string; // FCM token
    platform: 'android' | 'ios' | 'web';
    deviceType: 'desktop' | 'mobile' | 'tablet';
    userAgent: string;
    lastActive: Date;
    isActive: boolean;
  }>;
  
  // Configurações específicas para saúde mental
  therapeuticSettings?: {
    avoidEveningNotifications?: boolean; // Evitar notificações à noite
    weekendReducedFrequency?: boolean; // Reduzir frequência no fim de semana
    emotionalStateConsideration?: boolean; // Considerar estado emocional
    maxDailyNotifications?: number; // Máximo de notificações por dia
  };
  
  updatedAt: Date;
}

export interface NotificationAnalytics {
  notificationId: string;
  userId: string;
  
  // Métricas de entrega
  delivery: {
    attemptedAt: Date;
    deliveredAt?: Date;
    failedAt?: Date;
    failureReason?: string;
    retryCount: number;
  };
  
  // Métricas de engajamento
  engagement?: {
    viewedAt?: Date;
    clickedAt?: Date;
    timeToView?: number; // segundos
    timeToClick?: number; // segundos
    dismissedAt?: Date;
  };
  
  // Contexto do dispositivo
  deviceContext?: {
    platform: string;
    browser: string;
    online: boolean;
    batteryLevel?: number;
  };
  
  createdAt: Date;
}

export interface CreateNotificationDTO {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Notification['data'];
  channels?: NotificationChannel[];
  scheduledFor?: Date;
  priority?: 'high' | 'normal' | 'low';
}

export interface SendTestNotificationDTO {
  userId: string;
  title: string;
  body: string;
  channel: NotificationChannel;
}

// Tipos para resposta de APIs
export interface NotificationResponse {
  success: boolean;
  notificationId?: string;
  error?: string;
  details?: any;
}

// Tipos para tokens FCM
export interface FCMToken {
  tokenId: string;
  userId: string;
  token: string; // Token FCM real
  deviceInfo: {
    platform: 'android' | 'ios' | 'web' | 'windows' | 'macos' | 'linux';
    userAgent: string;
    language?: string;
    timestamp: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date;
  deactivatedAt?: Date;
  deactivationReason?: 'token_invalid' | 'user_request' | 'device_changed' | 'unknown';
}

// Tipos para histórico de notificações FCM
export interface FCMNotificationHistory {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: any;
  successCount: number;
  failureCount: number;
  sentAt: Date;
  triggeredBy: 'scheduler' | 'api' | 'system' | 'professional';
  createdAt: Date;
}

// Tipos para métricas de notificações
export interface NotificationMetrics {
  date: string; // YYYY-MM-DD
  type: 'daily_reminder' | 'custom' | 'therapeutic' | 'educational';
  totalUsers: number;
  notificationsSent: number;
  deliveryRate: number;
  clickRate?: number;
  errors: number;
  timestamp: Date;
}

// Resposta da Cloud Function de envio
export interface FCMSendResponse {
  success: boolean;
  message?: string;
  details?: {
    totalTokens: number;
    successful: number;
    failed: number;
    responses: Array<{
      success: boolean;
      messageId?: string;
      error?: {
        code: string;
        message: string;
      };
    }>;
  };
}

// Payload da mensagem FCM
export interface FCMPayload {
  notification?: {
    title: string;
    body: string;
    image?: string;
    icon?: string;
  };
  data?: {
    [key: string]: string;
  };
  android?: {
    priority?: 'high' | 'normal';
    notification?: {
      channelId?: string;
      sound?: string;
      icon?: string;
      color?: string;
    };
  };
  apns?: {
    payload?: {
      aps: {
        sound?: string;
        badge?: number;
        category?: string;
      };
    };
  };
  webpush?: {
    headers?: {
      [key: string]: string;
    };
    notification?: {
      icon?: string;
      badge?: string;
      vibrate?: number[];
    };
  };
}