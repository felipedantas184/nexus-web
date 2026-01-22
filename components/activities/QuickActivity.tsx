// components/activities/QuickActivity.tsx
'use client';

import React, { useState } from 'react';
import { ActivityProgress, QuickActivityConfig } from '@/types/schedule';
import { FaCheck, FaClock } from 'react-icons/fa';

interface QuickActivityProps {
  activity: {
    config: QuickActivityConfig;
    instructions: string;
    title: string;
  };
  progress: ActivityProgress;
  readOnly: boolean;
  onComplete: (data?: any) => Promise<void>;
  onSkip: (reason?: string) => Promise<void>;
  onSaveDraft?: (data: any) => Promise<void>;
}

export default function QuickActivity({ 
  activity, 
  progress, 
  readOnly,
  onComplete,
  onSkip
}: QuickActivityProps) {
  const [isCompleted, setIsCompleted] = useState(progress.status === 'completed');
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState(progress.executionData?.notes || '');

  const handleComplete = async () => {
    if (readOnly) return;
    
    setIsLoading(true);
    try {
      await onComplete({
        notes,
        submission: { completed: true }
      });
      setIsCompleted(true);
    } catch (error) {
      console.error('Erro ao completar atividade rápida:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    if (readOnly) return;
    
    const reason = prompt('Por que você está pulando esta atividade? (opcional)');
    await onSkip(reason || undefined);
  };

  if (isCompleted) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <FaCheck className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Atividade Concluída!</h3>
        <p className="text-gray-600">Você completou esta atividade rápida.</p>
        
        {notes && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Suas notas:</p>
            <p className="text-gray-700 mt-1">{notes}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FaClock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800 mb-1">Atividade Rápida</h3>
            <p className="text-blue-700">
              {activity.instructions}
            </p>
            <p className="text-sm text-blue-600 mt-2">
              Esta é uma atividade simples que você pode completar rapidamente.
            </p>
          </div>
        </div>
      </div>

      {activity.config.requiresConfirmation && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Notas (opcional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Adicione qualquer observação sobre a atividade..."
              disabled={readOnly}
            />
          </label>
          
          <p className="text-sm text-gray-500">
            Esta atividade requer confirmação de conclusão.
          </p>
        </div>
      )}

      {!readOnly && progress.status === 'in_progress' && (
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleComplete}
            disabled={isLoading}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FaCheck />
            {isLoading ? 'Concluindo...' : 'Marcar como Concluída'}
          </button>
          
          <button
            onClick={handleSkip}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Pular
          </button>
        </div>
      )}

      {!readOnly && progress.status === 'pending' && (
        <div className="pt-4 text-center">
          <p className="text-gray-500">
            Inicie a atividade para começar
          </p>
        </div>
      )}
    </div>
  );
}