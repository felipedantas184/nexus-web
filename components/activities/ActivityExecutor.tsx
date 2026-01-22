// components/activities/ActivityExecutor.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ActivityProgress, ActivityType, ChecklistActivityConfig, FileActivityConfig, ProgressStatus, QuickActivityConfig, QuizActivityConfig, ScheduleActivity, TextActivityConfig, VideoActivityConfig } from '@/types/schedule';
import QuickActivity from './QuickActivity';
import TextActivity from './TextActivity';
import QuizActivity from './QuizActivity';
import VideoActivity from './VideoActivity';
import ChecklistActivity from './ChecklistActivity';
import FileActivity from './FileActivity';
import EmotionalStateModal from './EmotionalStateModal';
import { ProgressService } from '@/lib/services/ProgressService';
import { FaClock, FaCheck, FaPlay, FaPause, FaStopwatch } from 'react-icons/fa';
import { DebugUtils } from '@/lib/utils/debugUtils';

interface ActivityExecutorProps {
  progress: ActivityProgress;
  onStatusChange?: (progressId: string, newStatus: ProgressStatus) => void;
  onCompletion?: (progressId: string, result: any) => void;
  readOnly?: boolean;
}

export default function ActivityExecutor({
  progress,
  onStatusChange,
  onCompletion,
  readOnly = false
}: ActivityExecutorProps) {
  const [currentStatus, setCurrentStatus] = useState<ProgressStatus>(progress.status);
  const [timeSpent, setTimeSpent] = useState<number>(progress.executionData?.timeSpent || 0);
  const [showEmotionalModal, setShowEmotionalModal] = useState(false);
  const [emotionalState, setEmotionalState] = useState<{
    before?: number;
    after?: number;
  }>(progress.executionData?.emotionalState || {});
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const [activityProgress, setActivityProgress] = useState(progress);

  useEffect(() => {
    // Atualizar progresso quando prop mudar
    setActivityProgress(progress);
    setCurrentStatus(progress.status);
    setTimeSpent(progress.executionData?.timeSpent || 0);
    setEmotionalState(progress.executionData?.emotionalState || {});
  }, [progress]);


  // Iniciar timer quando atividade começa
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (currentStatus === 'in_progress' && startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 60000); // minutos
        setTimeSpent(elapsed);
      }, 60000); // atualizar a cada minuto
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStatus, startTime]);

  const handleStartActivity = async () => {
    if (readOnly) return;

    setIsLoading(true);

    try {
      DebugUtils.logActivityFlow('START_ACTIVITY_ATTEMPT', {
        progressId: activityProgress.id,
        studentId: activityProgress.studentId,
        currentStatus: activityProgress.status
      });

      const updatedProgress = await ProgressService.startActivity(
        activityProgress.id,
        activityProgress.studentId
      );

      // Atualizar estado local com resposta do servidor
      setActivityProgress(updatedProgress);
      setCurrentStatus('in_progress');
      setStartTime(new Date());

      // Mostrar modal de estado emocional inicial
      setShowEmotionalModal(true);

      onStatusChange?.(activityProgress.id, 'in_progress');

      DebugUtils.logActivityFlow('START_ACTIVITY_SUCCESS', {
        progressId: activityProgress.id,
        newStatus: 'in_progress'
      });

    } catch (error: any) {
      console.error('Erro ao iniciar atividade:', error);

      DebugUtils.logActivityFlow('START_ACTIVITY_ERROR', {
        progressId: activityProgress.id,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteActivity = async (completionData: any = {}) => {
    if (readOnly) return;

    setIsLoading(true);
    try {
      const finalCompletionData = {
        ...completionData,
        timeSpent, // ← JÁ TEMOS timeSpent como estado, use este!
        emotionalState: {
          ...emotionalState,
          after: emotionalState.after || emotionalState.before || 3
        }
      };

      const result = await ProgressService.completeActivity(
        progress.id,
        progress.studentId,
        finalCompletionData
      );

      setCurrentStatus('completed');
      onCompletion?.(progress.id, result);
      onStatusChange?.(progress.id, 'completed');
    } catch (error) {
      console.error('Erro ao completar atividade:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipActivity = async (reason?: string) => {
    if (readOnly) return;

    setIsLoading(true);
    try {
      await ProgressService.skipActivity(progress.id, progress.studentId, reason);
      setCurrentStatus('skipped');
      onStatusChange?.(progress.id, 'skipped');
    } catch (error) {
      console.error('Erro ao pular atividade:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async (draftData: any) => {
    if (readOnly) return;

    try {
      await ProgressService.saveDraft(progress.id, draftData);
      // Feedback visual opcional
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
    }
  };

  const handleEmotionalStateSubmit = (state: number, type: 'before' | 'after') => {
    setEmotionalState(prev => ({
      ...prev,
      [type]: state
    }));

    if (type === 'before') {
      setShowEmotionalModal(false);
    }
  };

  // Renderizar componente específico baseado no tipo
  // Renderizar componente específico baseado no tipo
  const renderActivityComponent = () => {
    // Extraímos para facilitar a leitura e fazemos o cast genérico inicial
    const activity = progress.activitySnapshot;

    const commonProps = {
      progress,
      readOnly,
      onComplete: handleCompleteActivity,
      onSaveDraft: handleSaveDraft,
      onSkip: handleSkipActivity
    };

    switch (activity.type) {
      case 'quick':
        return <QuickActivity
          {...commonProps}
          activity={activity as ScheduleActivity & { config: QuickActivityConfig }}
        />;

      case 'text':
        return <TextActivity
          {...commonProps}
          activity={activity as ScheduleActivity & { config: TextActivityConfig }}
        />;

      case 'quiz':
        return <QuizActivity
          {...commonProps}
          activity={activity as ScheduleActivity & { config: QuizActivityConfig }}
        />;

      case 'video':
        return <VideoActivity
          {...commonProps}
          activity={activity as ScheduleActivity & { config: VideoActivityConfig }}
        />;

      case 'checklist':
        return <ChecklistActivity
          {...commonProps}
          activity={activity as ScheduleActivity & { config: ChecklistActivityConfig }}
        />;

      case 'file':
        return <FileActivity
          {...commonProps}
          activity={activity as ScheduleActivity & { config: FileActivityConfig }}
        />;

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Tipo de atividade não suportado</p>
          </div>
        );
    }
  };

  // Status badges
  const statusConfig = {
    pending: { color: 'bg-gray-100 text-gray-800', icon: FaClock, label: 'Pendente' },
    in_progress: { color: 'bg-blue-100 text-blue-800', icon: FaPlay, label: 'Em Progresso' },
    completed: { color: 'bg-green-100 text-green-800', icon: FaCheck, label: 'Concluída' },
    skipped: { color: 'bg-yellow-100 text-yellow-800', icon: FaPause, label: 'Pulada' }
  };

  const StatusBadge = statusConfig[currentStatus];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header da Atividade */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${StatusBadge.color}`}>
                <StatusBadge.icon className="inline mr-1" />
                {StatusBadge.label}
              </span>

              <span className={`px-3 py-1 rounded-full text-xs font-medium ${progress.activitySnapshot.metadata.difficulty === 'easy'
                ? 'bg-green-100 text-green-800'
                : progress.activitySnapshot.metadata.difficulty === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
                }`}>
                {progress.activitySnapshot.metadata.difficulty === 'easy' ? 'Fácil' :
                  progress.activitySnapshot.metadata.difficulty === 'medium' ? 'Médio' : 'Difícil'}
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-800">
              {progress.activitySnapshot.title}
            </h2>

            {progress.activitySnapshot.description && (
              <p className="text-gray-600 mt-2">
                {progress.activitySnapshot.description}
              </p>
            )}
          </div>

          {!readOnly && currentStatus === 'pending' && (
            <button
              onClick={handleStartActivity}
              disabled={isLoading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              <FaPlay />
              {isLoading ? 'Iniciando...' : 'Iniciar Atividade'}
            </button>
          )}
        </div>

        {/* Metadados */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <FaClock className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Duração Estimada</p>
              <p className="font-medium">{progress.activitySnapshot.metadata.estimatedDuration} min</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FaStopwatch className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Tempo Gasto</p>
              <p className="font-medium">{timeSpent} min</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Pontos</p>
              <p className="font-medium">{progress.activitySnapshot.scoring.pointsOnCompletion}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Dia</p>
              <p className="font-medium">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][progress.dayOfWeek]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo da Atividade */}
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Instruções</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-line">
              {progress.activitySnapshot.instructions}
            </p>
          </div>
        </div>

        {/* Componente específico da atividade */}
        <div className="mb-6">
          {renderActivityComponent()}
        </div>

        {/* Recursos (se disponíveis) */}
        {progress.activitySnapshot.resources && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Recursos</h3>
            <div className="space-y-2">
              {progress.activitySnapshot.resources.links?.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="text-blue-600">
                    {link.type === 'video' ? '📹' : link.type === 'article' ? '📄' : '🔧'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-blue-700">{link.title}</p>
                    <p className="text-sm text-blue-600 truncate">{link.url}</p>
                  </div>
                </a>
              ))}

              {progress.activitySnapshot.resources.attachments?.map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-600">📎</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-700">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {file.type.toUpperCase()} • {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <a
                    href={file.url}
                    download
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    Baixar
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Estado Emocional */}
      <EmotionalStateModal
        isOpen={showEmotionalModal}
        onClose={() => setShowEmotionalModal(false)}
        onSubmit={handleEmotionalStateSubmit}
        type="before"
      />
    </div>
  );
}