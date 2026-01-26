// components/notifications/NotificationManager.tsx - CORRIGIDO FINAL
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { NotificationService } from '@/lib/services/NotificationService';
import { FaBell, FaBellSlash, FaCog, FaInfoCircle } from 'react-icons/fa';
import IOSInstructions from './IOSInstructions'; // Adicionar import

export default function NotificationManager() {
  const { user } = useAuth();
  const [notificationStatus, setNotificationStatus] = useState<{
    supported: boolean;
    permission: NotificationPermission;
    serviceWorker: boolean;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [fcmStatus, setFcmStatus] = useState<{ available: boolean; tokenExists: boolean; } | null>(null);

  const showIOSInstructions = () => {
    setShowIOSModal(true);
  };

  useEffect(() => {
    if (user) {
      checkNotificationStatus();
      checkFCMStatus(); // NOVO
    }
  }, [user]);

  const checkFCMStatus = async () => {
    const status = await NotificationService.checkFCMAvailability();
    setFcmStatus(status);
  };

  const checkNotificationStatus = async () => {
    const status = await NotificationService.checkNotificationSupport();
    setNotificationStatus(status);
  };

  const requestPermission = async () => {
    if (!notificationStatus?.supported) return;

    setIsLoading(true);
    setError(null);

    try {
      // Usar o método atualizado que tenta FCM primeiro
      const permission = await NotificationService.requestNotificationPermission();

      if (permission === 'granted') {
        // Agora também tenta obter token FCM
        if (user?.id) {
          const token = await NotificationService.requestFCMToken(user.id);
          if (token) {
            console.log('✅ Token FCM registrado com sucesso');
          }
        }

        await checkNotificationStatus();
        await checkFCMStatus(); // Atualizar status FCM
        showSuccessMessage();
      } else if (permission === 'denied') {
        setError('Permissão para notificações foi negada...');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao ativar notificações');
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccessMessage = () => {
    // Pode ser um toast ou mensagem temporária
    console.log('Notificações ativadas com sucesso!');
  };

  const openBrowserSettings = () => {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('chrome') || userAgent.includes('chromium')) {
      try {
        window.open('chrome://settings/content/notifications', '_blank');
      } catch {
        showGenericInstructions();
      }
    } else if (userAgent.includes('firefox')) {
      try {
        window.open('about:preferences#privacy', '_blank');
      } catch {
        showGenericInstructions();
      }
    } else if (userAgent.includes('safari')) {
      try {
        window.open('x-apple.systempreferences:com.apple.preference.notifications', '_blank');
      } catch {
        showGenericInstructions();
      }
    } else if (userAgent.includes('edge')) {
      try {
        window.open('edge://settings/content/notifications', '_blank');
      } catch {
        showGenericInstructions();
      }
    } else {
      showGenericInstructions();
    }
  };

  const showGenericInstructions = () => {
    const instructions = `Para configurar notificações:
      
      1. Clique no cadeado 🔒 na barra de endereços
      2. Procure por "Notificações" ou "Permissões"
      3. Altere para "Permitir"
      4. Recarregue a página
            
      Ou acesse: Configurações do Navegador → Privacidade → Notificações`;

    alert(instructions);
  };

  const testNotification = async () => {
    try {
      setIsLoading(true);

      // ⚠️ CORREÇÃO: Passar o userId REAL do usuário logado
      const currentUserId = user?.id; // do useAuth()

      console.log('🧪 Testando notificação para usuário:', currentUserId);

      // Usar o método atualizado passando o userId real
      const success = await NotificationService.testNotification(currentUserId);

      if (success) {
        alert('✅ Notificação enviada com sucesso!\n\nVerifique sua barra de notificações.');
      } else {
        alert('⚠️ Notificação enviada via fallback local.\n\nO FCM não pôde ser usado (usuário sem token registrado).');
      }

    } catch (err: any) {
      console.error('Erro no teste:', err);
      alert(`❌ Erro: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !notificationStatus) {
    return null;
  }

  // 🔧 CORREÇÃO PARA iOS: Verificar suporte real
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isIOSChrome = isIOS && /CriOS/.test(navigator.userAgent);
  const isIOSFirefox = isIOS && /FxiOS/.test(navigator.userAgent);

  // Se for iOS, verificar suporte específico
  if (isIOS) {
    const iosSupported =
      ('Notification' in window) &&
      ('serviceWorker' in navigator) &&
      (Notification.permission !== 'denied');

    if (!iosSupported) {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-3">
            <FaInfoCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm text-yellow-800 font-medium">
                iOS - Instruções Especiais
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                1. Adicione este site à tela inicial
                2. Abra a partir do ícone na tela
                3. Ative as notificações
              </p>
              <button
                onClick={() => showIOSInstructions()}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800"
              >
                Ver instruções detalhadas
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Se não suporta notificações
  if (!notificationStatus.supported && !isIOS) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-3">
          <FaInfoCircle className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-sm text-yellow-800 font-medium">
              Navegador não compatível
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Use Chrome, Firefox, Safari ou Edge para receber lembretes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Se permissão negada
  if (notificationStatus.permission === 'denied') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaBellSlash className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm text-red-800 font-medium">
                Notificações bloqueadas
              </p>
              <p className="text-xs text-red-600">
                Você não receberá lembretes de atividades.
              </p>
            </div>
          </div>
          <button
            onClick={openBrowserSettings}
            className="px-3 py-1.5 text-sm bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
            title="Abrir configurações do navegador"
          >
            Configurar
          </button>
        </div>
      </div>
    );
  }

  // Se permissão não foi solicitada ainda
  if (notificationStatus.permission === 'default') {
    return (
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <FaBell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-800 font-medium">
                Ativar notificações
              </p>
              <p className="text-xs text-blue-600">
                Receba lembretes das suas atividades diárias.
              </p>
            </div>
          </div>
          <button
            onClick={requestPermission}
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Ativando...
              </span>
            ) : (
              'Ativar Notificações'
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Se permissão concedida
  return (
    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center">
            <FaBell className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-green-800 font-medium">
              Notificações ativas ✓
            </p>
            <p className="text-xs text-green-600">
              Você receberá lembretes das atividades.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={testNotification}
            className="px-3 py-1.5 text-sm bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
            title="Testar notificação"
          >
            Testar
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Configurações"
          >
            <FaCog className="w-5 h-5" />
          </button>
        </div>
      </div>

      {notificationStatus?.permission === 'granted' && fcmStatus && (
        <div className="mt-2 text-xs">
          {fcmStatus.available ? (
            fcmStatus.tokenExists ? (
              <span className="text-green-600">✓ FCM ativo (notificações push)</span>
            ) : (
              <span className="text-yellow-600">⚠️ FCM disponível mas token não registrado</span>
            )
          ) : (
            <span className="text-gray-500">ℹ️ Usando notificações locais</span>
          )}
        </div>
      )}

      {showSettings && (
        <div className="mt-4 pt-4 border-t border-green-200">
          <div className="space-y-4">
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-2">Como funcionam as notificações:</p>
              <ul className="space-y-1 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Lembretes das atividades do dia</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Horário: apenas das 8h às 21h</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>Não perturbamos à noite/madrugada</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  <span>Clique para abrir a atividade diretamente</span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={openBrowserSettings}
                className="px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <FaCog className="w-4 h-4" />
                Configurar no navegador
              </button>
              <button
                onClick={checkNotificationStatus}
                className="px-3 py-2 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <FaBell className="w-4 h-4" />
                Verificar status
              </button>
            </div>

            <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
              <p>
                <span className="font-medium">Dica:</span> Mantenha esta janela aberta para receber notificações mesmo quando estiver em outras abas.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}