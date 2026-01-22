// components/student/TodayActivities.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ActivityProgress, ProgressStatus } from '@/types/schedule';
import ActivityExecutor from '@/components/activities/ActivityExecutor';
import { 
  FaCalendarDay, 
  FaCheckCircle, 
  FaClock, 
  FaListOl,
  FaFilter,
  FaSort,
  FaExclamationTriangle,
  FaPlay,
  FaExternalLinkAlt
} from 'react-icons/fa';

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
      case 'quick': return '⚡';
      case 'text': return '📝';
      case 'quiz': return '❓';
      case 'video': return '🎬';
      case 'checklist': return '✅';
      case 'file': return '📎';
      default: return '📋';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'skipped': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando atividades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FaCalendarDay className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Atividades de Hoje</h2>
              <p className="text-gray-500">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-sm text-gray-500">atividades hoje</div>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <div className="text-sm text-gray-500">Pendentes</div>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.pending}</div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <div className="text-sm text-blue-500">Em Progresso</div>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.in_progress}</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <div className="text-sm text-green-500">Concluídas</div>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.completed}</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-purple-400" />
              <div className="text-sm text-purple-500">Progresso</div>
            </div>
            <div className="text-2xl font-bold mt-2">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Filtros e ordenação */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaFilter className="inline mr-2" />
              Filtrar por status
            </label>
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'in_progress', 'completed'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status as any)}
                  className={`px-3 py-1.5 text-sm rounded-full ${
                    filter === status
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'Todas' :
                   status === 'pending' ? 'Pendentes' :
                   status === 'in_progress' ? 'Em Progresso' : 'Concluídas'}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaSort className="inline mr-2" />
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
            >
              <option value="time">Duração (menor primeiro)</option>
              <option value="priority">Prioridade (obrigatórias primeiro)</option>
              <option value="type">Tipo de atividade</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Atividades */}
      <div className="space-y-4">
        {sortedActivities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FaCalendarDay className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {filter === 'all' ? 'Nenhuma atividade para hoje' : 'Nenhuma atividade encontrada'}
            </h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'Parabéns! Você completou todas as atividades de hoje.' 
                : 'Tente ajustar os filtros de busca.'}
            </p>
          </div>
        ) : (
          sortedActivities.map(activity => (
            <div key={activity.id} className="bg-white rounded-xl shadow overflow-hidden">
              {/* Cabeçalho da atividade (resumo) */}
              <div 
                className="p-4 border-b cursor-pointer hover:bg-gray-50"
                onClick={(e) => handleActivityClick(activity, e)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">
                      {getActivityIcon(activity.activitySnapshot.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">
                          {activity.activitySnapshot.title}
                        </h3>
                        
                        {/* Botão de abrir em página (para atividades em progresso/completas) */}
                        {(activity.status === 'in_progress' || activity.status === 'completed') && (
                          <button
                            onClick={(e) => handleOpenInPage(activity.id, e)}
                            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            title="Abrir em página separada"
                          >
                            <FaExternalLinkAlt className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <span>{activity.activitySnapshot.metadata.estimatedDuration} min</span>
                        <span>•</span>
                        <span className="capitalize">{activity.activitySnapshot.type}</span>
                        {activity.activitySnapshot.scoring.isRequired && (
                          <>
                            <span>•</span>
                            <span className="text-red-600 font-medium">Obrigatória</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(activity.status)}`}>
                      {activity.status === 'pending' ? 'Pendente' :
                       activity.status === 'in_progress' ? 'Em Progresso' :
                       activity.status === 'completed' ? 'Concluída' : 'Pulada'}
                    </span>
                    
                    {/* Botão de expandir (agora funciona apenas para expandir) */}
                    <button 
                      className="expand-button text-gray-400 hover:text-gray-600 p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedActivity(expandedActivity === activity.id ? null : activity.id);
                      }}
                    >
                      {expandedActivity === activity.id ? '▲' : '▼'}
                    </button>
                  </div>
                </div>
                
                {/* Botão de iniciar (visível apenas para atividades pendentes) */}
                {activity.status === 'pending' && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivityClick(activity, e);
                      }}
                      disabled={processingActivity === activity.id}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <FaPlay />
                      {processingActivity === activity.id ? 'Abrindo...' : 'Iniciar Atividade'}
                    </button>
                  </div>
                )}
              </div>

              {/* Conteúdo expandido (ActivityExecutor) - apenas para atividades NÃO pendentes */}
              {expandedActivity === activity.id && activity.status !== 'pending' && (
                <div className="p-4 border-t">
                  <ActivityExecutor
                    progress={activity}
                    onStatusChange={handleActivityStatusChange}
                    onCompletion={handleActivityStatusChange}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Dicas rápidas */}
      {stats.pending > 0 && stats.in_progress === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 mb-1">
                Você tem {stats.pending} atividade(s) pendente(s)
              </p>
              <p className="text-sm text-yellow-700">
                Clique em "Iniciar Atividade" para começar cada uma delas!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Resumo de progresso */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-indigo-800">Resumo do Dia</h3>
            <p className="text-sm text-indigo-600">Seu progresso até agora</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-800">
              {stats.completed}/{stats.total}
            </div>
            <div className="text-sm text-indigo-600">atividades</div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progresso</span>
            <span className="font-medium text-gray-800">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </span>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              style={{ 
                width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` 
              }}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center pt-4">
            <div>
              <div className="text-xl font-bold text-gray-800">{stats.pending}</div>
              <div className="text-xs text-gray-500">Pendentes</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">{stats.in_progress}</div>
              <div className="text-xs text-gray-500">Em Andamento</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">{stats.completed}</div>
              <div className="text-xs text-gray-500">Concluídas</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}