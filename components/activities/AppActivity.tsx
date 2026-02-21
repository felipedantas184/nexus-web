// components/activities/AppActivity.tsx
'use client';

import React, { useState, useRef } from 'react';
import { ActivityProgress, AppActivityConfig } from '@/types/schedule';
import { FaCheck, FaClock, FaCamera, FaTrash, FaPaperclip, FaMobile } from 'react-icons/fa';

interface AppActivityProps {
  activity: {
    config: AppActivityConfig;
    instructions: string;
    title: string;
  };
  progress: ActivityProgress;
  readOnly: boolean;
  onComplete: (data?: any) => Promise<void>;
  onSkip: (reason?: string) => Promise<void>;
  onSaveDraft?: (data: any) => Promise<void>;
}

export default function AppActivity({
  activity,
  progress,
  readOnly,
  onComplete,
  onSkip
}: AppActivityProps) {
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
      setPhotoError('É obrigatório anexar uma foto como comprovação da atividade no app');
      return;
    }

    setIsLoading(true);
    try {
      await onComplete({
        notes,
        submission: { completed: true }
      });
      setIsCompleted(true);
    } catch (error) {
      console.error('Erro ao completar atividade de app:', error);
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
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Atividade no App Concluída!</h3>
        <p className="text-gray-600">Você completou esta atividade no aplicativo.</p>

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
        {/* Seção de foto obrigatória */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FaMobile className="text-gray-400" />
            <label className="text-sm font-medium text-gray-700">
              Comprovação por foto <span className="text-red-500">*</span>
            </label>
          </div>

          <p className="text-sm text-gray-500">
            Tire uma foto da tela do app como comprovação de que a atividade foi realizada.
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
              : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
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
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <FaCamera className="w-6 h-6 text-purple-600" />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={readOnly}
                    className="text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
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
            className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FaCheck />
            {isLoading ? 'Concluindo...' : 'Marcar como Concluída no App'}
          </button>
        </div>
      )}

      {!readOnly && progress.status === 'pending' && (
        <div className="pt-4 text-center">
          <p className="text-gray-500">
            Inicie a atividade no app para começar
          </p>
        </div>
      )}
    </div>
  );
}