import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import cors from 'cors'; // ← MANTEM

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// CORREÇÃO: Configurar CORS corretamente
{/**
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
}); */}

export const sendPushNotification = functions
  .region('southamerica-east1')
  .https.onRequest((req, res) => {  // ← onRequest
    console.log('🔥🔥🔥 FUNCTION EXECUTADA - ON REQUEST');
    
    const corsHandler = cors({ origin: true });
    
    return corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método não permitido' });
        return;
      }
      
      console.log('📦📦📦 BODY:', req.body);
      
      res.status(200).json({ 
        success: true, 
        message: 'Função HTTP executada!' 
      });
    });
  });

  {/**
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
} */}