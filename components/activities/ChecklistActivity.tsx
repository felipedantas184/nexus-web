// components/activities/ChecklistActivity.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ActivityProgress, ChecklistActivityConfig } from '@/types/schedule';
import { FaCheck, FaList } from 'react-icons/fa';

interface ChecklistActivityProps {
  activity: {
    config: ChecklistActivityConfig;
    instructions: string;
  };
  progress: ActivityProgress;
  readOnly: boolean;
  onComplete: (data?: any) => Promise<void>;
  onSkip: (reason?: string) => Promise<void>;
}

export default function ChecklistActivity({
  activity,
  progress,
  readOnly,
  onComplete,
  onSkip
}: ChecklistActivityProps) {
  const config = activity.config as ChecklistActivityConfig;
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(progress.status === 'completed');

  // Carregar estado anterior
  useEffect(() => {
    if (progress.executionData?.submission?.checkedItems) {
      setCheckedItems(progress.executionData.submission.checkedItems);
    } else {
      // Inicializar todos como false
      const initialChecked: Record<string, boolean> = {};
      config.items.forEach(item => {
        initialChecked[item.id] = false;
      });
      setCheckedItems(initialChecked);
    }
  }, [config.items, progress.executionData?.submission?.checkedItems]);

  const handleCheckItem = (itemId: string, checked: boolean) => {
    if (readOnly || progress.status !== 'in_progress') return;
    
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: checked
    }));
  };

  const handleComplete = async () => {
    if (readOnly) return;
    
    // Verificar itens obrigatórios
    const missingRequired = config.items
      .filter(item => item.required && !checkedItems[item.id])
      .map(item => item.label);
    
    if (missingRequired.length > 0) {
      alert(`Por favor, complete os itens obrigatórios:\n\n${missingRequired.join('\n')}`);
      return;
    }
    
    setIsLoading(true);
    try {
      await onComplete({
        submission: {
          checkedItems,
          completedItems: Object.values(checkedItems).filter(Boolean).length,
          totalItems: config.items.length
        }
      });
      setIsCompleted(true);
    } catch (error) {
      console.error('Erro ao completar checklist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    if (readOnly) return;
    
    const reason = prompt('Por que você está pulando esta checklist? (opcional)');
    await onSkip(reason || undefined);
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = config.items.length;
  const requiredCount = config.items.filter(item => item.required).length;
  const completedRequired = config.items
    .filter(item => item.required && checkedItems[item.id])
    .length;

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <FaList className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-emerald-800 mb-1">Checklist</h3>
            <p className="text-emerald-700">
              {activity.instructions}
            </p>
            
            <div className="mt-3 space-y-1">
              <p className="text-sm text-emerald-600">
                • {totalCount} itens total
              </p>
              {requiredCount > 0 && (
                <p className="text-sm text-emerald-600">
                  • {requiredCount} itens obrigatórios
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progresso */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-sm text-gray-600">Progresso:</span>
            <div className="text-2xl font-bold">
              {completedCount}/{totalCount}
            </div>
          </div>
          
          {requiredCount > 0 && (
            <div className={`px-3 py-1 rounded-full text-sm ${
              completedRequired >= requiredCount
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {completedRequired}/{requiredCount} obrigatórios
            </div>
          )}
        </div>
        
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="space-y-3">
        {config.items.map((item) => (
          <label
            key={item.id}
            className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
              checkedItems[item.id]
                ? 'bg-emerald-50 border-emerald-200'
                : 'hover:bg-gray-50'
            } ${item.required ? 'border-l-4 border-l-red-500' : ''}`}
          >
            <input
              type="checkbox"
              checked={checkedItems[item.id] || false}
              onChange={(e) => handleCheckItem(item.id, e.target.checked)}
              className="mt-1 mr-3"
              disabled={readOnly || progress.status !== 'in_progress' || isCompleted}
            />
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${
                  checkedItems[item.id] ? 'text-emerald-800 line-through' : 'text-gray-800'
                }`}>
                  {item.label}
                </span>
                
                {item.required && (
                  <span className="text-xs text-red-600 font-medium px-2 py-0.5 bg-red-100 rounded">
                    Obrigatório
                  </span>
                )}
              </div>
              
              {checkedItems[item.id] && (
                <div className="mt-2 flex items-center text-sm text-emerald-600">
                  <FaCheck className="mr-1" />
                  Concluído
                </div>
              )}
            </div>
          </label>
        ))}
      </div>

      {isCompleted ? (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-3">
            <FaCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <h4 className="font-semibold text-gray-800 mb-1">Checklist Concluída!</h4>
          <p className="text-gray-600">
            Você completou {completedCount} de {totalCount} itens
            {requiredCount > 0 && ` (${completedRequired} obrigatórios)`}
          </p>
        </div>
      ) : (
        !readOnly && progress.status === 'in_progress' && (
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleComplete}
              disabled={isLoading || (requiredCount > 0 && completedRequired < requiredCount)}
              className="flex-1 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FaCheck />
              {isLoading ? 'Concluindo...' : 'Finalizar Checklist'}
            </button>
            
            <button
              onClick={handleSkip}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Pular
            </button>
          </div>
        )
      )}

      {!readOnly && progress.status === 'pending' && (
        <div className="text-center py-4 text-gray-500">
          Inicie a atividade para começar a checklist
        </div>
      )}
    </div>
  );
}