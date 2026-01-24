// components/schedules/ScheduleCalendar.tsx
'use client';

import React from 'react';
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaCalendarAlt, 
  FaCalendarDay,
  FaClock,
  FaTrophy
} from 'react-icons/fa';
import { ActivityProgress } from '@/types/schedule';

// Dias da semana em português
const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const FULL_DAYS_OF_WEEK = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

interface ScheduleCalendarProps {
  selectedDay: number;
  selectedWeek: number;
  onDaySelect: (dayIndex: number) => void;
  onWeekChange: (weekOffset: number) => void;
  todayActivities: ActivityProgress[];
  onActivitySelect?: (activity: ActivityProgress) => void;
}

export default function ScheduleCalendar({
  selectedDay,
  selectedWeek,
  onDaySelect,
  onWeekChange,
  todayActivities,
  onActivitySelect
}: ScheduleCalendarProps) {
  const currentDate = new Date();
  const isCurrentWeek = selectedWeek === 0;

  // Calcular datas da semana selecionada
  const getWeekDates = (weekOffset: number) => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentDate = now.getDate();
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(currentDate - currentDay + (weekOffset * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    
    return weekDates;
  };

  const weekDates = getWeekDates(selectedWeek);

  // Formatar data
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Obter status da atividade
  const getActivityStatus = (activity: ActivityProgress) => {
    switch (activity.status) {
      case 'pending': return { label: 'Pendente', color: 'bg-amber-100 text-amber-800' };
      case 'in_progress': return { label: 'Em Progresso', color: 'bg-blue-100 text-blue-800' };
      case 'completed': return { label: 'Concluída', color: 'bg-emerald-100 text-emerald-800' };
      case 'skipped': return { label: 'Pulada', color: 'bg-gray-100 text-gray-800' };
      default: return { label: 'Pendente', color: 'bg-amber-100 text-amber-800' };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      {/* Cabeçalho do Calendário */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
            <FaCalendarAlt className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Calendário</h3>
            <p className="text-sm text-gray-600">Visualize suas atividades por semana</p>
          </div>
        </div>
      </div>

      {/* Navegação da Semana */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onWeekChange(selectedWeek - 1)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <FaChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          
          <div className="text-lg font-semibold text-gray-900">
            {isCurrentWeek ? 'Esta semana' : formatDate(weekDates[0]) + ' - ' + formatDate(weekDates[6])}
          </div>
          
          <button
            onClick={() => onWeekChange(selectedWeek + 1)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <FaChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        
        <button
          onClick={() => onWeekChange(0)}
          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors"
        >
          Hoje
        </button>
      </div>

      {/* Grid de Dias da Semana */}
      <div className="grid grid-cols-7 gap-3 mb-8">
        {DAYS_OF_WEEK.map((day, index) => {
          const date = weekDates[index];
          const isToday = date.getDate() === currentDate.getDate() && 
                          date.getMonth() === currentDate.getMonth() && 
                          date.getFullYear() === currentDate.getFullYear();
          const isSelected = selectedDay === index;
          
          return (
            <button
              key={index}
              onClick={() => onDaySelect(index)}
              className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 ${
                isToday
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white'
                  : isSelected
                  ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 text-purple-700'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="text-xs font-medium mb-1">{day}</div>
              <div className="text-2xl font-bold">{date.getDate()}</div>
              {isToday && (
                <div className="mt-1 text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">
                  Hoje
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Atividades do Dia Selecionado */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-900">
            Atividades para {FULL_DAYS_OF_WEEK[selectedDay]}
          </h4>
          <div className="text-sm text-gray-500">
            {formatDate(weekDates[selectedDay])}
          </div>
        </div>

        {todayActivities.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl mb-4">
              <FaCalendarDay className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">
              Nenhuma atividade programada para este dia
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayActivities.map((activity) => {
              const status = getActivityStatus(activity);
              
              return (
                <div 
                  key={activity.id}
                  onClick={() => onActivitySelect?.(activity)}
                  className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-sm transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 text-sm mb-1 truncate">
                        {activity.activitySnapshot.title}
                      </h5>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <FaClock className="w-3 h-3" />
                          <span>{activity.activitySnapshot.metadata.estimatedDuration} min</span>
                        </div>
                        {activity.activitySnapshot.scoring.pointsOnCompletion > 0 && (
                          <div className="flex items-center gap-1">
                            <FaTrophy className="w-3 h-3 text-amber-500" />
                            <span>{activity.activitySnapshot.scoring.pointsOnCompletion} pontos</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}