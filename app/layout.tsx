// app/layout.tsx - VERSÃO FINAL RECOMENDADA
'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { useEffect } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Registrar Service Worker apenas no cliente
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          // Aguardar a página carregar completamente
          if (document.readyState === 'loading') {
            window.addEventListener('load', async () => {
              const registration = await navigator.serviceWorker.register(
                '/firebase-messaging-sw.js'
              );
              console.log('✅ Service Worker registrado:', registration.scope);
            });
          } else {
            const registration = await navigator.serviceWorker.register(
              '/firebase-messaging-sw.js'
            );
            console.log('✅ Service Worker registrado:', registration.scope);
          }
        } catch (error) {
          console.error('❌ Erro Service Worker:', error);
        }
      }
    };

    registerServiceWorker();
  }, []);

  return (
    <html lang="pt-BR" className={inter.className}>
      <head>
        <title>Nexus Platform - Saúde Mental e Educação</title>
        <meta name="description" content="Plataforma terapêutico-educacional integrada" />
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