// app/professional/schedules/[id]/assign/page.tsx
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AssignmentInterface from '@/components/schedule/AssignmentInterface';
import { 
  FaArrowLeft, 
  FaUsers, 
  FaCalendarAlt,
  FaExclamationTriangle
} from 'react-icons/fa';

export default function AssignSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const scheduleId = params.id as string;
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => {
      router.push('/professional/schedules');
    }, 3000);
  };

  const handleCancel = () => {
    if (window.confirm('Tem certeza que deseja cancelar? As alterações serão perdidas.')) {
      router.push('/professional/schedules');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/professional/schedules"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <FaArrowLeft />
                Voltar
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Atribuir Cronograma</h1>
                <p className="text-gray-600">
                  Selecione os alunos que receberão este cronograma
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FaUsers />
              <span>Atribuição de Cronograma</span>
            </div>
          </div>

          {/* Mensagem de Sucesso */}
          {showSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <FaCalendarAlt className="text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">Cronograma atribuído com sucesso!</h3>
                  <p className="text-green-700">
                    Redirecionando para a lista de cronogramas...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Informações Rápidas */}
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">👥 Passo 1: Selecionar Alunos</h3>
                <p className="text-sm text-gray-600">
                  Filtre e selecione os alunos que receberão o cronograma
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">⚙️ Passo 2: Personalizar (Opcional)</h3>
                <p className="text-sm text-gray-600">
                  Ajuste atividades específicas para cada aluno
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">📅 Passo 3: Configurar Data</h3>
                <p className="text-sm text-gray-600">
                  Defina quando o cronograma começará
                </p>
              </div>
            </div>
            
            {/* Dica Importante */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Alunos com cronograma ativo
                  </p>
                  <p className="text-sm text-gray-600">
                    Alunos que já possuem este cronograma ativo aparecerão com indicador amarelo.
                    Você pode permitir múltiplos cronogramas na configuração abaixo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Interface */}
        <div className="mb-8">
          <AssignmentInterface
            scheduleId={scheduleId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>

        {/* Dicas Rápidas */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">💡 Dicas para Atribuição</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-800 mb-1">Personalize por Aluno</div>
              <p className="text-sm text-blue-700">
                Exclua atividades específicas para alunos que não precisam delas.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="font-medium text-green-800 mb-1">Data de Início Estratégica</div>
              <p className="text-sm text-green-700">
                Inicie cronogramas nas segundas-feiras para facilitar o acompanhamento semanal.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="font-medium text-purple-800 mb-1">Múltiplos Cronogramas</div>
              <p className="text-sm text-purple-700">
                Permita que alunos tenham mais de um cronograma ativo se necessário.
              </p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="font-medium text-amber-800 mb-1">Acompanhamento</div>
              <p className="text-sm text-amber-700">
                Após atribuir, monitore o progresso dos alunos no dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}