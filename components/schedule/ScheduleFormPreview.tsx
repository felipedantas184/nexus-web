// components/schedule/ScheduleFormPreview.tsx
'use client';

import React from 'react';
import { CreateScheduleDTO } from '@/types/schedule';
import { ActivityService } from '@/lib/services/ActivityService';
import { FaCalendarAlt, FaClock, FaTasks, FaTag } from 'react-icons/fa';

interface ScheduleFormPreviewProps {
  scheduleData: CreateScheduleDTO;
}

export default function ScheduleFormPreview({ scheduleData }: ScheduleFormPreviewProps) {
  const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  // Calcular totais
  const totalActivities = scheduleData.activities.length;
  const totalDuration = scheduleData.activities.reduce(
    (sum, activity) => sum + (activity.metadata.estimatedDuration || 0), 
    0
  );
  const totalHours = (totalDuration / 60).toFixed(1);

  // Agrupar atividades por dia
  const activitiesByDay: Record<number, typeof scheduleData.activities> = {};
  scheduleData.activities.forEach(activity => {
    if (!activitiesByDay[activity.dayOfWeek]) {
      activitiesByDay[activity.dayOfWeek] = [];
    }
    activitiesByDay[activity.dayOfWeek].push(activity);
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Prévia do Cronograma
      </h3>

      {/* Metadados */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-indigo-500" />
          <div>
            <p className="text-sm text-gray-500">Início</p>
            <p className="font-medium">
              {scheduleData.startDate.toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaClock className="text-indigo-500" />
          <div>
            <p className="text-sm text-gray-500">Duração Semanal</p>
            <p className="font-medium">{totalHours}h</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaTasks className="text-indigo-500" />
          <div>
            <p className="text-sm text-gray-500">Atividades</p>
            <p className="font-medium">{totalActivities}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaTag className="text-indigo-500" />
          <div>
            <p className="text-sm text-gray-500">Categoria</p>
            <p className="font-medium capitalize">{scheduleData.category}</p>
          </div>
        </div>
      </div>

      {/* Dias da semana */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">Atividades por Dia</h4>
        
        {scheduleData.activeDays.map(dayNumber => {
          const dayActivities = activitiesByDay[dayNumber] || [];
          
          return (
            <div key={dayNumber} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h5 className="font-medium text-gray-800">
                  {daysOfWeek[dayNumber]}
                </h5>
                <span className="text-sm text-gray-500">
                  {dayActivities.length} atividade(s)
                </span>
              </div>

              {dayActivities.length > 0 ? (
                <div className="space-y-2">
                  {dayActivities.map((activity, index) => {
                    const preview = ActivityService.generateActivityPreview(activity as any);
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium text-sm">{activity.title}</p>
                          <p className="text-xs text-gray-500">
                            {preview.typeLabel} • {preview.estimatedTime}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          activity.metadata.difficulty === 'easy' 
                            ? 'bg-green-100 text-green-800'
                            : activity.metadata.difficulty === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {preview.difficulty}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">
                  Nenhuma atividade para este dia
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Resumo */}
      <div className="mt-6 pt-4 border-t">
        <h4 className="font-medium text-gray-700 mb-2">Resumo da Semana</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• {totalActivities} atividades programadas</li>
          <li>• {totalHours} horas estimadas de atividades</li>
          <li>• {scheduleData.activeDays.length} dias ativos na semana</li>
          <li>• Repetição: {scheduleData.repeatRules.resetOnRepeat ? 'Com reset semanal' : 'Contínua'}</li>
        </ul>
      </div>
    </div>
  );
}