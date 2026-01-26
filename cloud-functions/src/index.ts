import * as functions from 'firebase-functions/v1';

// Exportar todas as Cloud Functions
export * from './notifications/dailyReminderScheduler';
export * from './notifications/sendPushNotification';
export * from './notifications/manageUserTokens';

// Função de health check
export const healthCheck = functions
  .region('southamerica-east1')
  .https.onRequest((req, res) => {
    // Adicionar todos os headers necessários
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, firebase-instance-id-token');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'nexus-notifications',
      version: '1.0.0',
    });
  });