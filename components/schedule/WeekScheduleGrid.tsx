'use client';

import React from 'react';
import { CreateScheduleDTO, CreateActivityDTO } from '@/types/schedule';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCopy,
  FaClock,
  FaStar,
  FaExclamationCircle,
  FaCheckCircle
} from 'react-icons/fa';

interface WeekScheduleGridProps {
  formData: CreateScheduleDTO;
  daysOfWeek: Array<{ id: number; label: string; full: string }>;
  onAddActivity: (day: number) => void;
  onEditActivity: (day: number, activity: CreateActivityDTO, index: number) => void;
  onRemoveActivity: (day: number, index: number) => void;
  onDuplicateActivity: (day: number, activity: CreateActivityDTO) => void;
  updateField: (field: keyof CreateScheduleDTO, value: any) => void;
}

export default function WeekScheduleGrid({
  formData,
  daysOfWeek,
  onAddActivity,
  onEditActivity,
  onRemoveActivity,
  onDuplicateActivity,
  updateField
}: WeekScheduleGridProps) {

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      'quick': '⚡',
      'text': '📝',
      'quiz': '❓',
      'video': '🎬',
      'checklist': '✅',
      'file': '📎'
    };
    return icons[type] || '🎯';
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      'quick': 'bg-blue-100 text-blue-800 border-blue-200',
      'text': 'bg-purple-100 text-purple-800 border-purple-200',
      'quiz': 'bg-amber-100 text-amber-800 border-amber-200',
      'video': 'bg-red-100 text-red-800 border-red-200',
      'checklist': 'bg-green-100 text-green-800 border-green-200',
      'file': 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getActivitiesByDay = (day: number) => {
    return formData.activities
      .filter(activity => activity.dayOfWeek === day)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  };

  const getDayStats = (day: number) => {
    const activities = getActivitiesByDay(day);
    const totalTime = activities.reduce((sum, act) =>
      sum + (act.metadata.estimatedDuration || 0), 0
    );
    const totalPoints = activities.reduce((sum, act) =>
      sum + (act.scoring.pointsOnCompletion || 0), 0
    );
    const requiredCount = activities.filter(act => act.scoring.isRequired).length;

    return {
      totalTime,
      totalPoints,
      count: activities.length,
      requiredCount
    };
  };

  const dayLabels: Record<number, string> = {
    0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta',
    4: 'Quinta', 5: 'Sexta', 6: 'Sábado'
  };

  return (
    <div className="space-y-6">
      {/* Grid de Dias - Layout Horizontal Expandido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {([...daysOfWeek.slice(1), daysOfWeek[0]]).map((day) => {
          const activities = getActivitiesByDay(day.id);
          const stats = getDayStats(day.id);
          const hasActivities = activities.length > 0;

          return (
            <div
              key={day.id}
              className={`bg-white rounded-xl shadow-sm border ${hasActivities
                  ? 'border-gray-300 hover:border-indigo-300'
                  : 'border-gray-200 hover:border-gray-300'
                } transition-all duration-200`}
            >
              {/* Cabeçalho do Dia */}
              <div className={`p-5 rounded-t-xl ${hasActivities
                  ? 'bg-gradient-to-r from-gray-50 to-white'
                  : 'bg-gray-50'
                }`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white border-2 border-indigo-200 rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-lg font-bold text-indigo-600">{day.label}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{day.full}</h3>
                        <p className="text-sm text-gray-500">
                          {stats.count} atividade{stats.count !== 1 ? 's' : ''}
                          {stats.requiredCount > 0 && ` • ${stats.requiredCount} obrigatória${stats.requiredCount !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Estatísticas do Dia */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-4">
                      {stats.totalTime > 0 && (
                        <div className="flex items-center gap-1 text-sm">
                          <FaClock className="w-3 h-3 text-gray-400" />
                          <span className="font-semibold text-gray-700">
                            {stats.totalTime}min
                          </span>
                        </div>
                      )}
                      {stats.totalPoints > 0 && (
                        <div className="flex items-center gap-1 text-sm">
                          <FaStar className="w-3 h-3 text-amber-400" />
                          <span className="font-semibold text-gray-700">
                            {stats.totalPoints}pts
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botão Principal de Adicionar */}
                <button
                  type="button"
                  onClick={() => onAddActivity(day.id)}
                  className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-3 ${hasActivities
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-md'
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 border border-gray-300'
                    }`}
                >
                  <FaPlus className="w-4 h-4" />
                  {hasActivities ? 'Adicionar Outra Atividade' : 'Adicionar Primeira Atividade'}
                </button>
              </div>

              {/* Lista de Atividades */}
              <div className="p-4 max-h-[400px] overflow-y-auto">
                {hasActivities ? (
                  <div className="space-y-3">
                    {activities.map((activity, index) => (
                      <div
                        key={`${day.id}-${index}`}
                        className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-200 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start gap-3">
                          {/* Ícone do Tipo */}
                          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${getActivityColor(activity.type)} text-lg`}>
                            {getActivityIcon(activity.type)}
                          </div>

                          {/* Conteúdo da Atividade */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-800 text-sm mb-1">
                                  {activity.title}
                                </h4>
                                <div className="flex items-center gap-3">
                                  <span className={`text-xs px-2 py-1 rounded-full ${getActivityColor(activity.type)}`}>
                                    {activity.type === 'quick' && 'Rápida'}
                                    {activity.type === 'text' && 'Texto'}
                                    {activity.type === 'quiz' && 'Quiz'}
                                    {activity.type === 'video' && 'Vídeo'}
                                    {activity.type === 'checklist' && 'Checklist'}
                                    {activity.type === 'file' && 'Arquivo'}
                                  </span>

                                  {activity.scoring.isRequired && (
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1">
                                      <FaExclamationCircle className="w-3 h-3" />
                                      Obrigatória
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Ações */}
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => onDuplicateActivity(day.id, activity)}
                                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                                  title="Duplicar"
                                >
                                  <FaCopy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onEditActivity(day.id, activity, index)}
                                  className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                                  title="Editar"
                                >
                                  <FaEdit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRemoveActivity(day.id, index)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                  title="Remover"
                                >
                                  <FaTrash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {activity.description || activity.instructions}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <FaClock className="w-3 h-3" />
                                <span>{activity.metadata.estimatedDuration} min</span>
                              </div>

                              <div className="flex items-center gap-1">
                                <FaStar className="w-3 h-3" />
                                <span>{activity.scoring.pointsOnCompletion} pontos</span>
                              </div>

                              <div className={`text-xs px-2 py-1 rounded-full ${activity.metadata.difficulty === 'easy'
                                  ? 'bg-green-100 text-green-800'
                                  : activity.metadata.difficulty === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                {activity.metadata.difficulty === 'easy' && 'Fácil'}
                                {activity.metadata.difficulty === 'medium' && 'Médio'}
                                {activity.metadata.difficulty === 'hard' && 'Difícil'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <FaPlus className="w-6 h-6 text-gray-400" />
                    </div>
                    <h4 className="font-medium text-gray-600 mb-2">
                      Nenhuma atividade ainda
                    </h4>
                    <p className="text-gray-500 text-sm mb-4">
                      Clique no botão acima para começar
                    </p>
                    <button
                      type="button"
                      onClick={() => onAddActivity(day.id)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      + Criar primeira atividade
                    </button>
                  </div>
                )}
              </div>

              {/* Rodapé com Observações */}
              {hasActivities && (
                <div className="border-t border-gray-200 p-4">
                  <textarea
                    placeholder="Observações para este dia (opcional)..."
                    className="w-full text-xs border border-gray-300 rounded-lg p-3 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    rows={2}
                    onChange={(e) => {
                      // Implementar lógica de observações por dia se necessário
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}