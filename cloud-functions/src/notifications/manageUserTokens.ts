import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/v1/https';

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Cloud Function para gerenciar tokens FCM dos usuários
 * 
 * Triggered quando:
 * 1. Um usuário se registra
 * 2. Um token precisa ser salvo/atualizado
 * 3. Um token precisa ser removido
 */
export const saveUserFCMToken = functions
  .region('southamerica-east1')
  .https.onCall(async ( data: { token: string; deviceInfo?: any }, context: CallableContext ) => {
    try {
      // Verificar autenticação
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'Usuário não autenticado'
        );
      }
      
      const { token, deviceInfo } = data;
      const userId = context.auth.uid;
      
      if (!token) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Token FCM é obrigatório'
        );
      }
      
      console.log(`💾 Salvando token FCM para usuário ${userId}`);
      
      // Gerar ID único para o token (baseado no hash)
      const tokenHash = await generateTokenHash(token);
      const tokenId = `${userId}_${tokenHash.substring(0, 16)}`;
      
      // Preparar dados do token
      const tokenData = {
        tokenId,
        userId,
        token,
        deviceInfo: deviceInfo || {
          platform: getPlatform(),
          userAgent: context.rawRequest.headers['user-agent'] || 'unknown',
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        },
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUsedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Salvar/atualizar token
      await db.collection('userFCMTokens')
        .doc(tokenId)
        .set(tokenData, { merge: true });
      
      console.log(`✅ Token FCM salvo para usuário ${userId} (ID: ${tokenId})`);
      
      // Atualizar preferências do usuário para habilitar push
      await updateUserNotificationPreferences(userId);
      
      return {
        success: true,
        tokenId,
        message: 'Token FCM salvo com sucesso'
      };
      
    } catch (error: any) {
      console.error('❌ Erro ao salvar token FCM:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Erro ao salvar token FCM'
      );
    }
  });

/**
 * Remover token FCM (logout ou dispositivo removido)
 */
export const removeUserFCMToken = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'Usuário não autenticado'
        );
      }
      
      const { token } = data;
      const userId = context.auth.uid;
      
      if (!token) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Token FCM é obrigatório'
        );
      }
      
      console.log(`🗑️  Removendo token FCM para usuário ${userId}`);
      
      // Buscar token específico
      const tokensSnapshot = await db.collection('userFCMTokens')
        .where('userId', '==', userId)
        .where('token', '==', token)
        .get();
      
      if (tokensSnapshot.empty) {
        return {
          success: true,
          message: 'Token não encontrado ou já removido'
        };
      }
      
      // Marcar como inativo (não deletar para histórico)
      const batch = db.batch();
      tokensSnapshot.forEach(doc => {
        batch.update(doc.ref, {
          isActive: false,
          deactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
          deactivationReason: 'user_request'
        });
      });
      
      await batch.commit();
      
      console.log(`✅ Token FCM removido para usuário ${userId}`);
      
      return {
        success: true,
        message: 'Token FCM removido com sucesso'
      };
      
    } catch (error: any) {
      console.error('❌ Erro ao remover token FCM:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Erro ao remover token FCM'
      );
    }
  });

/**
 * Limpar tokens antigos/inativos (execução periódica)
 */
export const cleanupOldTokens = functions
  .region('southamerica-east1')
  .pubsub.schedule('every 24 hours')
  .timeZone('America/Sao_Paulo')
  .onRun(async () => {
    try {
      console.log('🧹 Iniciando limpeza de tokens FCM antigos...');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Buscar tokens inativos há mais de 30 dias
      const oldTokensSnapshot = await db.collection('userFCMTokens')
        .where('isActive', '==', false)
        .where('deactivatedAt', '<', thirtyDaysAgo)
        .limit(1000)
        .get();
      
      console.log(`📊 Tokens antigos encontrados: ${oldTokensSnapshot.size}`);
      
      // Deletar em batch
      const batch = db.batch();
      oldTokensSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      console.log(`✅ ${oldTokensSnapshot.size} tokens antigos removidos`);
      
      return null;
      
    } catch (error) {
      console.error('❌ Erro na limpeza de tokens:', error);
      throw error;
    }
  });

// ========== FUNÇÕES AUXILIARES ==========

async function generateTokenHash(token: string): Promise<string> {
  // Usar Web Crypto API para gerar hash seguro
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getPlatform(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('android')) return 'android';
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
  if (userAgent.includes('windows')) return 'windows';
  if (userAgent.includes('mac')) return 'macos';
  if (userAgent.includes('linux')) return 'linux';
  
  return 'web';
}

async function updateUserNotificationPreferences(userId: string): Promise<void> {
  try {
    const prefsRef = db.collection('notificationPreferences').doc(userId);
    const prefsDoc = await prefsRef.get();
    
    if (prefsDoc.exists) {
      // Atualizar existente
      await prefsRef.update({
        'channels.push': true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Criar novo com push habilitado
      await prefsRef.set({
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
        allowedDays: [1, 2, 3, 4, 5],
        types: {
          activity_reminder: true,
          schedule_update: true,
          achievement: true,
          message: true,
          system: false,
          therapeutic_reminder: true,
          educational_reminder: true
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log(`✅ Preferências atualizadas para usuário ${userId}`);
  } catch (error) {
    console.error('❌ Erro ao atualizar preferências:', error);
  }
}