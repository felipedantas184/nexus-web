// components/activities/TextActivity.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ActivityProgress, TextActivityConfig } from '@/types/schedule';
import { FaSave, FaCheck, FaFileAlt } from 'react-icons/fa';

interface TextActivityProps {
  activity: {
    config: TextActivityConfig;
    instructions: string;
  };
  progress: ActivityProgress;
  readOnly: boolean;
  onComplete: (data?: any) => Promise<void>;
  onSaveDraft: (data: any) => Promise<void>;
  onSkip: (reason?: string) => Promise<void>;
}

export default function TextActivity({
  activity,
  progress,
  readOnly,
  onComplete,
  onSaveDraft,
  onSkip
}: TextActivityProps) {
  const [text, setText] = useState(progress.executionData?.submission?.text || '');
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const config = activity.config as TextActivityConfig;

  useEffect(() => {
    const words = text.trim().split(/\s+/).filter((word : any) => word.length > 0);
    setWordCount(words.length);
  }, [text]);

  const handleSaveDraft = async () => {
    if (readOnly) return;
    
    setIsSaving(true);
    try {
      await onSaveDraft({
        text,
        wordCount
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    if (readOnly) return;
    
    // Validar tamanho do texto
    if (config.minWords && wordCount < config.minWords) {
      alert(`O texto deve ter pelo menos ${config.minWords} palavras. Atualmente: ${wordCount}`);
      return;
    }
    
    if (config.maxWords && wordCount > config.maxWords) {
      alert(`O texto deve ter no máximo ${config.maxWords} palavras. Atualmente: ${wordCount}`);
      return;
    }
    
    setIsCompleting(true);
    try {
      await onComplete({
        submission: {
          text,
          wordCount,
          format: config.format || 'plain'
        }
      });
    } catch (error) {
      console.error('Erro ao completar atividade de texto:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSkip = async () => {
    if (readOnly) return;
    
    const reason = prompt('Por que você está pulando esta atividade? (opcional)');
    await onSkip(reason || undefined);
  };

  const isComplete = progress.status === 'completed';

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <FaFileAlt className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-purple-800 mb-1">Atividade de Texto</h3>
            <p className="text-purple-700">
              {activity.instructions}
            </p>
            
            {config.minWords || config.maxWords ? (
              <div className="mt-3 space-y-1">
                {config.minWords && (
                  <p className="text-sm text-purple-600">
                    • Mínimo: {config.minWords} palavras
                  </p>
                )}
                {config.maxWords && (
                  <p className="text-sm text-purple-600">
                    • Máximo: {config.maxWords} palavras
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {isComplete ? (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-700">Seu texto enviado:</h4>
            <span className="text-sm text-gray-500">{wordCount} palavras</span>
          </div>
          <div className="bg-gray-50 p-4 rounded whitespace-pre-line">
            {text}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">
                Sua resposta
              </label>
              <div className="text-sm text-gray-500">
                {wordCount} {wordCount === 1 ? 'palavra' : 'palavras'}
                {config.minWords && ` (mínimo: ${config.minWords})`}
                {config.maxWords && ` (máximo: ${config.maxWords})`}
              </div>
            </div>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
              placeholder="Digite sua resposta aqui..."
              disabled={readOnly || progress.status !== 'in_progress'}
            />
            
            {config.format === 'markdown' && (
              <div className="text-sm text-gray-500">
                <p>Dica: Você pode usar formatação Markdown (## Título, **negrito**, *itálico*)</p>
              </div>
            )}
          </div>

          {lastSaved && (
            <p className="text-sm text-gray-500">
              Último salvamento: {lastSaved.toLocaleTimeString('pt-BR')}
            </p>
          )}

          {!readOnly && progress.status === 'in_progress' && (
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FaSave />
                {isSaving ? 'Salvando...' : 'Salvar Rascunho'}
              </button>
              
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FaCheck />
                {isCompleting ? 'Enviando...' : 'Enviar Resposta'}
              </button>
              
              <button
                onClick={handleSkip}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Pular
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}