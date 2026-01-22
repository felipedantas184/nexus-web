// components/student/StudentDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import TodayActivities from './TodayActivities';
import ProgressTracking from './ProgressTracking';
import { useStudentSchedule } from '@/hooks/useStudentSchedule';
import { 
  FaCalendarDay, 
  FaChartLine, 
  FaTrophy,
  FaBell,
  FaCalendarWeek,
  FaUserGraduate,
  FaLightbulb,
  FaComments
} from 'react-icons/fa';

interface StudentDashboardProps {
  showHeader?: boolean;
}

export default function StudentDashboard({ showHeader = true }: StudentDashboardProps) {
  const { 
    todayActivities, 
    instances, 
    loading, 
    error, 
    refresh,
    totalTodayActivities,
    hasActiveSchedules
  } = useStudentSchedule();

  const [activeSection, setActiveSection] = useState<'activities' | 'progress' | 'schedules'>('activities');
  const [todaysDate] = useState(new Date());

  // Formatadores
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando seu dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Erro ao carregar dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {showHeader && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">{getGreeting()}! 👋</h1>
                <p className="text-indigo-100">Bem-vindo(a) ao seu espaço de aprendizado</p>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-indigo-200">{formatDate(todaysDate)}</div>
                <div className="text-lg font-bold">{totalTodayActivities} atividades hoje</div>
              </div>
            </div>

            {/* Cards Rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <FaCalendarDay className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm opacity-90">Atividades Hoje</div>
                    <div className="text-xl font-bold">{totalTodayActivities}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <FaChartLine className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm opacity-90">Cronogramas Ativos</div>
                    <div className="text-xl font-bold">{instances.length}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <FaTrophy className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm opacity-90">Dias Consecutivos</div>
                    <div className="text-xl font-bold">0</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navegação */}
        <div className="bg-white rounded-xl shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveSection('activities')}
              className={`flex-1 py-4 font-medium text-center ${activeSection === 'activities' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
            >
              <div className="flex items-center justify-center gap-2">
                <FaCalendarDay />
                Atividades de Hoje
              </div>
            </button>
            
            <button
              onClick={() => setActiveSection('progress')}
              className={`flex-1 py-4 font-medium text-center ${activeSection === 'progress' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
            >
              <div className="flex items-center justify-center gap-2">
                <FaChartLine />
                Meu Progresso
              </div>
            </button>
            
            <button
              onClick={() => setActiveSection('schedules')}
              className={`flex-1 py-4 font-medium text-center ${activeSection === 'schedules' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
            >
              <div className="flex items-center justify-center gap-2">
                <FaCalendarWeek />
                Meus Cronogramas
              </div>
            </button>
          </div>
        </div>

        {/* Seção Ativa */}
        <div className="mb-8">
          {activeSection === 'activities' ? (
            <TodayActivities 
              activities={todayActivities} 
              onActivityUpdate={refresh}
            />
          ) : activeSection === 'progress' ? (
            <ProgressTracking />
          ) : (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FaCalendarWeek className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Meus Cronogramas</h2>
                  <p className="text-gray-500">Todos os cronogramas ativos atribuídos a você</p>
                </div>
              </div>

              {instances.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <FaCalendarWeek className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Nenhum cronograma ativo
                  </h3>
                  <p className="text-gray-500">
                    Aguarde seu profissional atribuir um cronograma para você
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {instances.map(instance => (
                    <div key={instance.id} className="border rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-800">Cronograma Ativo</h3>
                          <div className="text-sm text-gray-500 mt-1">
                            Semana {instance.currentWeekNumber} • Iniciado em {instance.startedAt.toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          instance.status === 'active' ? 'bg-green-100 text-green-800' :
                          instance.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {instance.status === 'active' ? 'Ativo' :
                           instance.status === 'paused' ? 'Pausado' : 'Concluído'}
                        </span>
                      </div>
                      
                      {instance.progressCache && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-800">
                              {instance.progressCache.completedActivities}
                            </div>
                            <div className="text-sm text-gray-500">Concluídas</div>
                          </div>
                          
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-800">
                              {instance.progressCache.totalActivities}
                            </div>
                            <div className="text-sm text-gray-500">Totais</div>
                          </div>
                          
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-800">
                              {Math.round(instance.progressCache.completionPercentage)}%
                            </div>
                            <div className="text-sm text-gray-500">Completas</div>
                          </div>
                          
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-800">
                              {instance.progressCache.streakDays}
                            </div>
                            <div className="text-sm text-gray-500">Dias Streak</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar de Motivação e Dicas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dica do Dia */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaLightbulb className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-blue-800">Dica do Dia</h3>
            </div>
            <p className="text-blue-700">
              Divida atividades grandes em partes menores. Completar cada parte dá uma sensação de progresso!
            </p>
          </div>

          {/* Status de Conectividade */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <FaUserGraduate className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-800">Seu Status</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-green-700">Atividades hoje:</span>
                <span className="font-semibold text-green-800">{totalTodayActivities}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Cronogramas ativos:</span>
                <span className="font-semibold text-green-800">{instances.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Próxima atividade:</span>
                <span className="font-semibold text-green-800">
                  {todayActivities.find(a => a.status === 'pending')?.activitySnapshot.title || 'Nenhuma'}
                </span>
              </div>
            </div>
          </div>

          {/* Suporte Rápido */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FaComments className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-purple-800">Precisa de Ajuda?</h3>
            </div>
            <p className="text-purple-700 mb-3">
              Tem dificuldade com alguma atividade?
            </p>
            <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
              Solicitar Ajuda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}