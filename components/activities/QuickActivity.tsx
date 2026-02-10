// components/activities/QuickActivity.tsx
'use client';

import React, { useState, useRef } from 'react';
import { ActivityProgress, QuickActivityConfig } from '@/types/schedule';
import { FaCheck, FaClock, FaCamera, FaTrash, FaPaperclip } from 'react-icons/fa';

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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string>('');

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setPhotoError('A foto deve ter no máximo 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setPhotoError('Por favor, selecione um arquivo de imagem');
        return;
      }

      setPhotoFile(file);
      setPhotoError('');

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleComplete = async () => {
    if (readOnly) return;

    // Validação da foto obrigatória
    if (!photoFile) {
      setPhotoError('É obrigatório anexar uma foto como comprovação da atividade');
      return;
    }

    setIsLoading(true);
    try {
      await onComplete({
        notes,
        submission: { completed: true }
        // Note: photoFile não é enviado propositalmente, pois é "fake"
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
      <div className="space-y-6">
        {/**
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
          */}
        {/* Seção de foto obrigatória */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FaPaperclip className="text-gray-400" />
            <label className="text-sm font-medium text-gray-700">
              Comprovação por foto <span className="text-red-500">*</span>
            </label>
          </div>

          <p className="text-sm text-gray-500">
            Anexe uma foto como comprovação visual de que a atividade foi realizada.
          </p>

          {photoPreview ? (
            <div className="space-y-3">
              <div className="relative border-2 border-dashed border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaCamera className="text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Foto anexada</p>
                      <p className="text-sm text-green-600">{photoFile?.name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={readOnly}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                  >
                    <FaTrash />
                  </button>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Pré-visualização:</p>
                  <div className="relative h-48 rounded-lg overflow-hidden">
                    <img
                      src={photoPreview}
                      alt="Pré-visualização da foto"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${photoError
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                accept="image/*"
                className="hidden"
                disabled={readOnly}
                required
              />

              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaCamera className="w-6 h-6 text-blue-600" />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={readOnly}
                    className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                  >
                    Clique para selecionar uma foto
                  </button>
                  <p className="text-sm text-gray-500 mt-1">
                    ou arraste e solte aqui
                  </p>
                </div>

                <p className="text-xs text-gray-400">
                  Formatos: JPG, PNG, GIF • Máx.: 5MB
                </p>
              </div>
            </div>
          )}

          {photoError && (
            <p className="text-sm text-red-600 mt-2">{photoError}</p>
          )}
        </div>
      </div>

      {!readOnly && progress.status === 'in_progress' && (
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleComplete}
            disabled={isLoading || !photoFile}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FaCheck />
            {isLoading ? 'Concluindo...' : 'Marcar como Concluída'}
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