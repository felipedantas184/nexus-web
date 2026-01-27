// components/student/TodayActivities.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ActivityProgress, ActivityType, ProgressStatus } from '@/types/schedule';
import ActivityExecutor from '@/components/activities/ActivityExecutor';
import {
  FaCalendarDay,
  FaCheckCircle,
  FaClock,
  FaFilter,
  FaSort,
  FaExclamationTriangle,
  FaPlay,
  FaExternalLinkAlt,
  FaCalendarCheck,
  FaTasks,
  FaChartLine,
  FaBookOpen,
  FaVideo,
  FaFileAlt,
  FaQuestionCircle,
  FaArrowRight,
  FaCheck,
  FaHourglassHalf,
  FaLightbulb,
  FaBullseye,
  FaStopwatch,
  FaStar
} from 'react-icons/fa';
import { FiZap, FiClock } from 'react-icons/fi';
import { FaListCheck } from 'react-icons/fa6';

interface TodayActivitiesProps {
  activities: ActivityProgress[];
  loading?: boolean;
  onActivityUpdate?: () => void;
}

export default function TodayActivities({
  activities,
  loading = false,
  onActivityUpdate
}: TodayActivitiesProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'time' | 'priority' | 'type'>('time');
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [processingActivity, setProcessingActivity] = useState<string | null>(null);

  // Aplicar filtros
  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.status === filter;
  });

  // Aplicar ordenação
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    switch (sortBy) {
      case 'time':
        return a.activitySnapshot.metadata.estimatedDuration - b.activitySnapshot.metadata.estimatedDuration;
      case 'priority':
        const priorityA = a.activitySnapshot.scoring.isRequired ? 1 : 0;
        const priorityB = b.activitySnapshot.scoring.isRequired ? 1 : 0;
        return priorityB - priorityA;
      case 'type':
        return a.activitySnapshot.type.localeCompare(b.activitySnapshot.type);
      default:
        return 0;
    }
  });

  const getStatusStats = () => {
    const stats = {
      total: activities.length,
      pending: activities.filter(a => a.status === 'pending').length,
      in_progress: activities.filter(a => a.status === 'in_progress').length,
      completed: activities.filter(a => a.status === 'completed').length
    };
    return stats;
  };

  const stats = getStatusStats();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quick': return <FiZap className="w-5 h-5" />;
      case 'text': return <FaBookOpen className="w-5 h-5" />;
      case 'quiz': return <FaQuestionCircle className="w-5 h-5" />;
      case 'video': return <FaVideo className="w-5 h-5" />;
      case 'checklist': return <FaListCheck className="w-5 h-5" />;
      case 'file': return <FaFileAlt className="w-5 h-5" />;
      default: return <FaTasks className="w-5 h-5" />;
    }
  };

  const getActivityIconColor = (type: string) => {
    switch (type) {
      case 'quick': return 'text-amber-500 bg-amber-50';
      case 'text': return 'text-blue-500 bg-blue-50';
      case 'quiz': return 'text-purple-500 bg-purple-50';
      case 'video': return 'text-red-500 bg-red-50';
      case 'checklist': return 'text-emerald-500 bg-emerald-50';
      case 'file': return 'text-gray-500 bg-gray-50';
      default: return 'text-indigo-500 bg-indigo-50';
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          color: 'text-amber-700 bg-amber-50 border-amber-100',
          icon: <FaClock className="w-3 h-3" />,
          label: 'Pendente'
        };
      case 'in_progress':
        return {
          color: 'text-blue-700 bg-blue-50 border-blue-100',
          icon: <FaHourglassHalf className="w-3 h-3" />,
          label: 'Em Progresso'
        };
      case 'completed':
        return {
          color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
          icon: <FaCheck className="w-3 h-3" />,
          label: 'Concluída'
        };
      case 'skipped':
        return {
          color: 'text-gray-700 bg-gray-50 border-gray-100',
          icon: <FaStopwatch className="w-3 h-3" />,
          label: 'Pulada'
        };
      default:
        return {
          color: 'text-gray-700 bg-gray-50 border-gray-100',
          icon: <FaClock className="w-3 h-3" />,
          label: 'Pendente'
        };
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-emerald-600 bg-emerald-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleActivityStatusChange = () => {
    onActivityUpdate?.();
  };

  // 🔥 FUNÇÃO CHAVE: Lida com o clique na atividade
  const handleActivityClick = async (activity: ActivityProgress, e: React.MouseEvent) => {
    // Se clicou no botão de expandir, apenas expande/colapsa
    const target = e.target as HTMLElement;
    if (target.closest('.expand-button') || target.classList.contains('expand-button')) {
      setExpandedActivity(expandedActivity === activity.id ? null : activity.id);
      return;
    }

    // Se a atividade está pendente, redireciona para a página dela
    if (activity.status === 'pending') {
      setProcessingActivity(activity.id);
      try {
        // Redireciona para a página da atividade
        router.push(`/student/activity/${activity.id}`);
      } finally {
        setProcessingActivity(null);
      }
    } else if (activity.status === 'in_progress') {
      // Se já está em progresso, apenas expande
      setExpandedActivity(expandedActivity === activity.id ? null : activity.id);
    }
    // Se está completed ou skipped, apenas expande
  };

  // Botão para abrir em página separada
  const handleOpenInPage = (activityId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/student/activity/${activityId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 border-3 border-purple-200 rounded-full"></div>
            <div className="w-12 h-12 border-3 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Carregando atividades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com métricas visuais */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm">
        {/* Cards de estatísticas - Design moderno */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <FaClock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
                <div className="text-sm text-gray-500">Pendentes</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <FaHourglassHalf className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.in_progress}</div>
                <div className="text-sm text-gray-500">Em Progresso</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-200 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                <FaCheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
                <div className="text-sm text-gray-500">Concluídas</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                <FaChartLine className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">Total Hoje</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e ordenação - Design moderno */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtros por status */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FaFilter className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Filtrar por status</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'Todas', icon: <FaTasks className="w-3 h-3" /> },
                { value: 'pending', label: 'Pendentes', icon: <FaClock className="w-3 h-3" /> },
                { value: 'in_progress', label: 'Em Progresso', icon: <FaHourglassHalf className="w-3 h-3" /> },
                { value: 'completed', label: 'Concluídas', icon: <FaCheckCircle className="w-3 h-3" /> }
              ].map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${filter === value
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {icon}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ordenação */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FaSort className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Ordenar por</label>
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="time">Duração (mais curta primeiro)</option>
                <option value="priority">Prioridade (obrigatórias primeiro)</option>
                <option value="type">Tipo de atividade</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Atividades - Design mais limpo (estilo antigo) */}
      <div className="space-y-4">
        {sortedActivities.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-6">
              <FaCalendarCheck className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {filter === 'all' ? 'Nenhuma atividade para hoje' : 'Nenhuma atividade encontrada'}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {filter === 'all'
                ? 'Excelente! Você completou todas as atividades programadas para hoje.'
                : 'Tente ajustar os filtros para encontrar outras atividades.'}
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-purple-600 font-medium">
              <FaLightbulb className="w-4 h-4" />
              <span>Use este tempo para revisar seus aprendizados!</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {sortedActivities.map(activity => {
              // Mapeamento de cores por tipo de atividade (mantendo consistência visual)
              const activityTypeStyles: Record<ActivityType, {
                bg: string;
                text: string;
                icon: React.ReactNode;
              }> = {
                quick: {
                  bg: 'bg-amber-100',
                  text: 'text-amber-600',
                  icon: <FiZap className="w-4 h-4" />
                },
                text: {
                  bg: 'bg-blue-100',
                  text: 'text-blue-600',
                  icon: <FaBookOpen className="w-4 h-4" />
                },
                quiz: {
                  bg: 'bg-purple-100',
                  text: 'text-purple-600',
                  icon: <FaQuestionCircle className="w-4 h-4" />
                },
                video: {
                  bg: 'bg-red-100',
                  text: 'text-red-600',
                  icon: <FaVideo className="w-4 h-4" />
                },
                checklist: {
                  bg: 'bg-emerald-100',
                  text: 'text-emerald-600',
                  icon: <FaListCheck className="w-4 h-4" />
                },
                file: {
                  bg: 'bg-gray-100',
                  text: 'text-gray-600',
                  icon: <FaFileAlt className="w-4 h-4" />
                }
              };

              const typeStyle = activityTypeStyles[activity.activitySnapshot.type] ?? activityTypeStyles.text;
              const statusConfig = getStatusConfig(activity.status);
              const isCompleted = activity.status === 'completed';
              const isInProgress = activity.status === 'in_progress';
              const isPending = activity.status === 'pending';

              return (
                <div
                  key={activity.id}
                  className={`
              rounded-xl border p-4 flex flex-col gap-4 transition-all duration-200
              shadow-sm hover:shadow-md hover:-translate-y-0.5
              ${isCompleted ? 'bg-emerald-50 border-emerald-200' :
                      isInProgress ? 'bg-blue-50 border-blue-200' :
                        'bg-white border-gray-200'}
              ${isPending ? 'hover:border-purple-300' : ''}
            `}
                >
                  {/* HEADER */}
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      {/* ICON */}
                      <div
                        className={`
                    w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0
                    ${isCompleted ? 'bg-emerald-100 text-emerald-600' : `${typeStyle.bg} ${typeStyle.text}`}
                  `}
                      >
                        {typeStyle.icon}
                      </div>

                      {/* INFO */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900 line-clamp-1">
                            {activity.activitySnapshot.title}
                          </span>

                          {activity.activitySnapshot.scoring.isRequired && (
                            <span
                              title="Atividade obrigatória"
                              className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"
                            />
                          )}
                        </div>

                        {/* STATUS BADGE */}
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md w-fit ${isCompleted ? 'bg-emerald-100 text-emerald-700' :
                            isInProgress ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* TOGGLE/ACTION BUTTON */}
                    <button
                      onClick={() => setExpandedActivity(expandedActivity === activity.id ? null : activity.id)}
                      className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  ${isCompleted ? 'text-emerald-600 hover:bg-emerald-100' :
                          isInProgress ? 'text-blue-600 hover:bg-blue-100' :
                            'text-gray-600 hover:bg-gray-100'}
                  transition-colors
                `}
                      title={expandedActivity === activity.id ? "Recolher detalhes" : "Expandir detalhes"}
                    >
                      {expandedActivity === activity.id ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* METADATA */}
                  <div className="flex gap-3 text-gray-500 text-xs">
                    <div className="flex items-center gap-1">
                      <FaClock className="w-3 h-3" />
                      {activity.activitySnapshot.metadata.estimatedDuration}min
                    </div>

                    <div className="flex items-center gap-1">
                      <FaStar className="w-3 h-3" />
                      {activity.activitySnapshot.scoring.pointsOnCompletion}pts
                    </div>

                    {activity.activitySnapshot.metadata.difficulty && (
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${activity.activitySnapshot.metadata.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                        activity.activitySnapshot.metadata.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {activity.activitySnapshot.metadata.difficulty === 'easy' ? 'Fácil' :
                          activity.activitySnapshot.metadata.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                      </div>
                    )}
                  </div>

                  {/* DESCRIPTION (if available and not too long) */}
                  {activity.activitySnapshot.description && activity.activitySnapshot.description.length < 100 && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {activity.activitySnapshot.description}
                    </p>
                  )}

                  {/* FOOTER */}
                  <div className="border-t pt-3 flex flex-col gap-3">
                    <div className="flex gap-2">
                      {/* MAIN ACTION BUTTON */}
                      {isPending ? (
                        <button
                          onClick={(e) => handleActivityClick(activity, e)} // Passe o 'e' real aqui
                          disabled={processingActivity === activity.id}
                          className={`
        flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700
        text-white font-semibold text-xs
        px-3 py-2 rounded-lg
        flex items-center justify-center gap-1.5
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
      `}
                        >
                          <FaPlay className="w-3 h-3" />
                          {processingActivity === activity.id ? 'Abrindo...' : 'Iniciar'}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleOpenInPage(activity.id, e)} // Passe o 'e' real aqui também
                          className="
                            flex-1 bg-indigo-500 hover:bg-indigo-600
                            text-white font-semibold text-xs
                            px-3 py-2 rounded-lg
                            flex items-center justify-center gap-1.5
                            transition-colors duration-200
                          "
                        >
                          <FaExternalLinkAlt className="w-3 h-3" />
                          Abrir
                        </button>
                      )}
                    </div>

                    {/* COMPLETION STATUS */}
                    {isCompleted && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <FaCheck className="w-3 h-3" />
                        Concluída • {activity.scoring.pointsEarned} pontos
                      </div>
                    )}

                    {/* IN PROGRESS STATUS */}
                    {isInProgress && activity.startedAt && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                        <FaHourglassHalf className="w-3 h-3" />
                        Em andamento
                      </div>
                    )}
                  </div>

                  {/* EXPANDED DETAILS (ActivityExecutor) */}
                  {expandedActivity === activity.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <ActivityExecutor
                        progress={activity}
                        onStatusChange={handleActivityStatusChange}
                        onCompletion={handleActivityStatusChange}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Insights e Dicas - Design moderno */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerta para atividades pendentes */}
        {stats.pending > 0 && stats.in_progress === 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border border-amber-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                <FaExclamationTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Atividades Pendentes</h3>
                <p className="text-amber-800 mb-3">
                  Você tem <span className="font-bold">{stats.pending} atividade(s)</span> pendente(s) para hoje.
                </p>
                <div className="text-sm text-amber-700">
                  💡 <span className="font-medium">Dica:</span> Comece pelas mais curtas para ganhar impulso!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resumo de produtividade */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <FaChartLine className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-indigo-900 mb-4">Resumo de Produtividade</h3>

              {/* Barra de progresso */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-indigo-700">Progresso do dia</span>
                  <span className="font-bold text-indigo-900">
                    {stats.completed}/{stats.total} ({stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                    style={{
                      width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Estatísticas detalhadas */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-900 mb-1">{stats.pending}</div>
                  <div className="text-xs text-indigo-600">Pendentes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-900 mb-1">{stats.in_progress}</div>
                  <div className="text-xs text-indigo-600">Em Andamento</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-900 mb-1">{stats.completed}</div>
                  <div className="text-xs text-indigo-600">Concluídas</div>
                </div>
              </div>

              {/* Meta diária */}
              {stats.total > 0 && (
                <div className="mt-4 pt-4 border-t border-indigo-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-indigo-700">Meta diária</span>
                    <span className={`font-medium ${(stats.completed / stats.total) >= 0.8 ? 'text-emerald-600' :
                      (stats.completed / stats.total) >= 0.5 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                      {(stats.completed / stats.total) >= 0.8 ? 'Excelente! 🎉' :
                        (stats.completed / stats.total) >= 0.5 ? 'Bom progresso! 👏' : 'Continue assim! 💪'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ações rápidas para mobile */}
      <div className="lg:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex items-center gap-2 bg-white rounded-full shadow-lg border border-gray-200 px-4 py-3">
          <div className="text-sm text-gray-600">
            {stats.pending > 0 ? `${stats.pending} pendente(s)` : 'Tudo feito!'}
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
            <FaCheck className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}