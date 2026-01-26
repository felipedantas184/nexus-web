import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import cors from 'cors'; // ← MANTEM
import { MulticastMessage } from 'firebase-admin/lib/messaging/messaging-api';

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

// CORREÇÃO: Configurar CORS corretamente
const corsHandler = cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'firebase-instance-id-token', // ← ADICIONAR ESTE
    'x-firebase-appcheck'          // ← ADICIONAR ESTE TAMBÉM
  ],
  credentials: true
});

export const sendPushNotification = functions
  .region('southamerica-east1')
  .https.onRequest((req, res) => {
    // Handler EXPLÍCITO para OPTIONS (necessário para headers custom)
    
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
      res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, firebase-instance-id-token, x-firebase-appcheck');
      res.set('Access-Control-Allow-Credentials', 'true');
      res.status(204).send('');
      return;
    }

    return corsHandler(req, res, async () => {
      try {
        // LOGS DE DEBUG - VERIFICAR O QUE CHEGA
        console.log('=== DEBUG REQUEST ===');
        console.log('Method:', req.method);
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        console.log('Body type:', typeof req.body);
        console.log('=====================');

        // Verificar método HTTP
        if (req.method !== 'POST') {
          res.status(405).json({ error: 'Método não permitido' });
          return;
        }

        if (!req.body) {
          console.error('❌ Body vazio ou undefined');
          res.status(400).json({
            error: 'Body da requisição está vazio',
            tip: 'Verifique se Content-Type: application/json está sendo enviado'
          });
          return;
        }

        const { userId, title, body, data, type = 'custom' } = req.body;

        // LOG dos dados recebidos
        console.log('📥 Dados recebidos:', { userId, title, body, data, type });
        // Validação
        if (!userId || !title || !body) {
          res.status(400).json({
            error: 'Campos obrigatórios: userId, title, body'
          });
          return;
        }

        console.log(`📤 Enviando notificação para usuário ${userId}: ${title}`);

        // Buscar tokens FCM do usuário
        const tokensSnapshot = await db.collection('userFCMTokens')
          .where('userId', '==', userId)
          .where('isActive', '==', true)
          .get();

        if (tokensSnapshot.empty) {
          res.status(404).json({
            error: 'Nenhum token FCM ativo encontrado para este usuário'
          });
          return;
        }

        const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

        // Preparar mensagem
        const message: MulticastMessage = {
          notification: {
            title,
            body,
          },
          data: {
            type,
            timestamp: new Date().toISOString(),
            ...data,
          },
          tokens,
          android: {
            priority: 'high',
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
              },
            },
          },
        };

        // Enviar notificação
        const response = await messaging.sendEachForMulticast(message);

        // Registrar no histórico
        await db.collection('notificationHistory').add({
          userId,
          title,
          body,
          type,
          channels: ['push'],
          data: message.data,
          successCount: response.successCount,
          failureCount: response.failureCount,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          triggeredBy: 'api',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Remover tokens inválidos
        if (response.failureCount > 0) {
          await cleanupInvalidTokens(userId, tokens, response.responses);
        }

        // CORREÇÃO: Adicionar headers CORS na resposta
        res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
        res.status(200).json({
          success: true,
          message: 'Notificação enviada com sucesso',
          details: {
            totalTokens: tokens.length,
            successful: response.successCount,
            failed: response.failureCount,
            responses: response.responses.map(r => ({
              success: r.success,
              messageId: r.messageId,
              error: r.error?.message
            }))
          }
        });

      } catch (error: any) {
        console.error('❌ Erro ao enviar notificação:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          code: error.code
        });
      }
    });
  });

async function cleanupInvalidTokens(
  userId: string,
  tokens: string[],
  responses: admin.messaging.SendResponse[]
): Promise<void> {
  const batch = db.batch();
  let hasUpdates = false;

  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];

    if (!response.success) {
      const token = tokens[i];

      const snapshot = await db
        .collection('userFCMTokens')
        .where('userId', '==', userId)
        .where('token', '==', token)
        .get();

      snapshot.forEach(doc => {
        batch.update(doc.ref, {
          isActive: false,
          deactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
          deactivationReason: response.error?.code || 'unknown',
        });
        hasUpdates = true;
      });
    }
  }

  if (hasUpdates) {
    await batch.commit();
  }
}