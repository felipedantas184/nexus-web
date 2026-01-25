// components/notifications/IOSInstructions.tsx
'use client';

import React from 'react';
import { 
  FaApple, 
  FaMobileAlt, 
  FaShareSquare, 
  FaPlusSquare,
  FaBell,
  FaTimes
} from 'react-icons/fa';

interface IOSInstructionsProps {
  onClose: () => void;
}

export default function IOSInstructions({ onClose }: IOSInstructionsProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-200 flex items-center justify-center">
              <FaApple className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Instruções para iPhone/iPad</h3>
              <p className="text-sm text-gray-600">Passo a passo completo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Introdução */}
          <div className="text-center">
            <p className="text-gray-700">
              Para melhor experiência com notificações no iOS, siga estes passos:
            </p>
            <div className="mt-2 text-sm text-gray-500">
              O Safari no iOS tem limitações que podemos contornar instalando o app.
            </div>
          </div>
          
          {/* Passos */}
          <div className="space-y-4">
            {/* Passo 1 */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="font-bold text-purple-700">1</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FaShareSquare className="w-5 h-5 text-purple-500" />
                  <h4 className="font-semibold text-gray-800">Toque no botão de compartilhar</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Na parte inferior do Safari, localize e toque no ícone de compartilhar (📤).
                </p>
                <div className="mt-2 p-2 bg-white border rounded text-xs text-gray-500">
                  <span className="font-medium">Localização:</span> Barra inferior central
                </div>
              </div>
            </div>
            
            {/* Passo 2 */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="font-bold text-purple-700">2</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FaPlusSquare className="w-5 h-5 text-purple-500" />
                  <h4 className="font-semibold text-gray-800">Adicione à Tela Inicial</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Role para baixo até encontrar a opção "Adicionar à Tela Inicial" e toque nela.
                </p>
                <div className="mt-2 p-2 bg-white border rounded text-xs text-gray-500">
                  <span className="font-medium">Dica:</span> Pode ser necessário rolar um pouco
                </div>
              </div>
            </div>
            
            {/* Passo 3 */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="font-bold text-purple-700">3</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FaMobileAlt className="w-5 h-5 text-purple-500" />
                  <h4 className="font-semibold text-gray-800">Configure o nome e adicione</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Dê um nome (ex: "Nexus") e toque em "Adicionar" no canto superior direito.
                </p>
                <div className="mt-2 p-2 bg-white border rounded text-xs text-gray-500">
                  <span className="font-medium">Sugestão:</span> Use um nome curto e reconhecível
                </div>
              </div>
            </div>
            
            {/* Passo 4 */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="font-bold text-purple-700">4</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FaBell className="w-5 h-5 text-purple-500" />
                  <h4 className="font-semibold text-gray-800">Abra e ative notificações</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Volte à tela inicial, abra o Nexus pelo novo ícone e ative as notificações quando solicitado.
                </p>
                <div className="mt-2 p-2 bg-white border rounded text-xs text-gray-500">
                  <span className="font-medium">Importante:</span> Sempre abra a partir do ícone instalado
                </div>
              </div>
            </div>
          </div>
          
          {/* Informações importantes */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Limitações do iOS</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Notificações push completas só funcionam no app instalado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Safari padrão tem suporte limitado a notificações</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Chrome no iOS usa o mesmo motor do Safari</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Alguns recursos podem não estar disponíveis</span>
              </li>
            </ul>
          </div>
          
          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Entendi
            </button>
            <button
              onClick={() => {
                // Tenta abrir o menu de compartilhhar do iOS via JS
                if (navigator.share) {
                  navigator.share({
                    title: 'Nexus Platform',
                    text: 'Adicione à tela inicial para notificações',
                    url: window.location.href
                  });
                }
                onClose();
              }}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-medium"
            >
              Compartilhar Agora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}