// app/layout.tsx - ADICIONAR/ATUALIZAR
'use client';

import { useEffect } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // FORÇAR REGISTRO DO SERVICE WORKER
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          console.log('🔄 Registrando Service Worker...');
          
          // Primeiro, desregistrar todos os existentes
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
            console.log('🗑️ Service Worker desregistrado:', registration.scope);
          }
          
          // Aguardar um pouco
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Registrar novo
          const registration = await navigator.serviceWorker.register(
            '/firebase-messaging-sw.js',
            {
              scope: '/',
              updateViaCache: 'none'
            }
          );
          
          console.log('✅ Service Worker registrado:', registration.scope);
          
          // Verificar estado
          if (registration.active) {
            console.log('✅ Service Worker ATIVO');
          }
          if (registration.installing) {
            console.log('⏳ Service Worker INSTALANDO');
            registration.installing.addEventListener('statechange', (e) => {
              console.log('Estado mudou:', (e.target as any)?.state);
            });
          }
          
          // Aguardar ativação
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Testar comunicação
          if (registration.active) {
            registration.active.postMessage({
              type: 'PING',
              timestamp: new Date().toISOString()
            });
          }
          
        } catch (error) {
          console.error('❌ Erro ao registrar Service Worker:', error);
        }
      } else {
        console.warn('⚠️ Service Worker não suportado');
      }
    };
    
    // Registrar quando página carregar
    if (document.readyState === 'loading') {
      window.addEventListener('load', registerServiceWorker);
    } else {
      registerServiceWorker();
    }
  }, []);

  return (
    <html lang="pt-BR" className={inter.className}>
      <head>
        <title>Nexus Platform</title>
        <meta name="theme-color" content="#6366f1" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}