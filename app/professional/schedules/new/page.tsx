// app/professional/schedules/new/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ScheduleBuilder from '@/components/schedule/ScheduleBuilder';
import { FaArrowLeft, FaCalendarPlus } from 'react-icons/fa';
import Link from 'next/link';

export default function CreateSchedulePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleSuccess = (scheduleId: string) => {
    console.log('Cronograma criado:', scheduleId);
    router.push('/professional/schedules');
    // Em produção, poderia redirecionar para página do cronograma
    // router.push(`/professional/schedules/${scheduleId}`);
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
                <h1 className="text-2xl font-bold text-gray-900">Criar Novo Cronograma</h1>
                <p className="text-gray-600">
                  Configure um cronograma semanal para seus alunos
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FaCalendarPlus />
              <span>Criação de Cronograma</span>
            </div>
          </div>

          {/* Informações Rápidas */}
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">📝 Passo 1: Configurações</h3>
                <p className="text-sm text-gray-600">
                  Defina nome, categoria e dias ativos
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">✅ Passo 2: Atividades</h3>
                <p className="text-sm text-gray-600">
                  Adicione atividades para cada dia da semana
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">🎯 Passo 3: Revisão</h3>
                <p className="text-sm text-gray-600">
                  Revise e salve seu cronograma
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Builder */}
        <div className="mb-8">
          <ScheduleBuilder
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>

        {/* Dicas Rápidas */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">💡 Dicas para um bom cronograma</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-800 mb-1">Duração Balanceada</div>
              <p className="text-sm text-blue-700">
                Evite sobrecarregar um único dia. Distribua as atividades igualmente.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="font-medium text-green-800 mb-1">Variedade de Tipos</div>
              <p className="text-sm text-green-700">
                Misture diferentes tipos de atividades para manter o engajamento.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="font-medium text-purple-800 mb-1">Instruções Claras</div>
              <p className="text-sm text-purple-700">
                Escreva instruções simples e diretas para facilitar a execução.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}