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
  FaComments,
  FaCheckCircle,
  FaFire,
  FaChartBar,
  FaArrowRight,
  FaChevronRight,
  FaStar
} from 'react-icons/fa';
import { FiTrendingUp, FiClock } from 'react-icons/fi';

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

  // Estatísticas calculadas
  const completedToday = todayActivities.filter(a => a.status === 'completed').length;
  const pendingToday = todayActivities.filter(a => a.status === 'pending').length;
  const completionRate = totalTodayActivities > 0 ? Math.round((completedToday / totalTodayActivities) * 100) : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Preparando seu dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Erro ao carregar</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={refresh}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header Moderno */}
      {showHeader && (
        <div className="relative overflow-hidden">
          {/* Background com gradiente sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-indigo-50" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
                    <FaStar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{getGreeting()}!</h1>
                    <p className="text-gray-600">Continue sua jornada de desenvolvimento</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {formatDate(todaysDate)}
                </div>
              </div>

              {/* Status Badge */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3">
                <div className="text-sm text-gray-500 mb-1">Status do dia</div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${completionRate > 70 ? 'bg-emerald-500' : completionRate > 30 ? 'bg-amber-500' : 'bg-red-500'}`} />
                  <div className="text-lg font-bold text-gray-900">{completionRate}% concluído</div>
                </div>
              </div>
            </div>

            {/* Cards de Métricas - Design Moderno */}
            {/** <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"> */}
              {/* Card: Atividades Hoje 
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
                    <FaCalendarDay className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                    Hoje
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{totalTodayActivities}</div>
                <div className="text-sm text-gray-600">Atividades programadas</div>
                {totalTodayActivities > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Concluídas</span>
                      <span className="font-medium text-gray-900">{completedToday}/{totalTodayActivities}</span>
                    </div>
                    <div className="mt-1 w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>*/}

              {/* Card: Cronogramas Ativos 
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100">
                    <FaCalendarWeek className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                    Ativos
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{instances.length}</div>
                <div className="text-sm text-gray-600">Cronogramas em andamento</div>
                {instances.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <FiTrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-600 font-medium">Em progresso</span>
                  </div>
                )}
              </div>*/}

              {/* Card: Streak 
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100">
                    <FaFire className="w-6 h-6 text-amber-600" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-amber-50 text-amber-700 rounded-full">
                    Sequência
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">7</div>
                <div className="text-sm text-gray-600">Dias consecutivos</div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {[...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-5 h-5 rounded-full ${i < 5 ? 'bg-emerald-400' : 'bg-gray-200'} border border-white`}
                      />
                    ))}
                  </div>
                </div>
              </div>*/}

              {/* Card: Pontuação 
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100">
                    <FaTrophy className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                    Conquistas
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">1,250</div>
                <div className="text-sm text-gray-600">Pontos totais</div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <FaChartBar className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-600">Nível <span className="font-medium text-gray-900">3</span></span>
                </div>
              </div>*/}
            {/**</div> */}
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Seção Ativa - Design Moderno */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100">
                    <FaCalendarDay className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Atividades de Hoje</h2>
                    <p className="text-gray-600 text-sm">
                      {completedToday} de {totalTodayActivities} concluídas • {pendingToday} pendentes
                    </p>
                  </div>
                </div>
                {totalTodayActivities > 0 && (
                  <button className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium text-sm transition-colors">
                    Ver calendário completo
                  </button>
                )}
              </div>
            </div>
            <div className="p-1">
              <TodayActivities
                activities={todayActivities}
                onActivityUpdate={refresh}
              />
            </div>
          </div>
        </div>

          {/* Sidebar de Insights - Design Moderno */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dica do Dia */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200">
                  <FaLightbulb className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Dica do Dia</h3>
                  <p className="text-sm text-blue-700">Para melhor produtividade</p>
                </div>
              </div>
              <p className="text-blue-800 mb-4">
                Estabeleça metas pequenas e comemoráveis. Cada pequena vitória libera dopamina, mantendo você motivado!
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-600 font-medium">Baseado em ciência comportamental</span>
                <FaChevronRight className="w-4 h-4 text-blue-500" />
              </div>
            </div>

            {/* Status de Desempenho */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200">
                  <FaUserGraduate className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-900">Seu Desempenho</h3>
                  <p className="text-sm text-emerald-700">Análise da semana</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800">Taxa de conclusão</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-900">{completionRate}%</span>
                    <div className={`w-2 h-2 rounded-full ${completionRate > 70 ? 'bg-emerald-500' : completionRate > 30 ? 'bg-amber-500' : 'bg-red-500'}`} />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800">Tempo médio por atividade</span>
                  <span className="font-medium text-emerald-900">18 min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800">Consistência</span>
                  <span className="font-medium text-emerald-900">Alta</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-emerald-200">
                <div className="text-xs text-emerald-600">
                  📈 <span className="font-medium">+12%</span> em relação à semana passada
                </div>
              </div>
            </div>

            {/* Suporte Rápido */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200">
                  <FaComments className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900">Suporte</h3>
                  <p className="text-sm text-purple-700">Estamos aqui para ajudar</p>
                </div>
              </div>
              <p className="text-purple-800 mb-6">
                Encontrou dificuldade? Nossa equipe de suporte está disponível para auxiliar no seu desenvolvimento.
              </p>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200">
                  Solicitar ajuda agora
                </button>
                <button className="w-full px-4 py-3 bg-white text-purple-700 border border-purple-200 rounded-xl font-medium hover:bg-purple-50 transition-colors">
                  Ver FAQ
                </button>
              </div>
            </div>
          </div>

          {/* Footer do Dashboard */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
              <div>
                Nexus Platform • Dashboard do Estudante • v2.1
              </div>
              <div className="flex items-center gap-4">
                <button className="text-gray-600 hover:text-purple-600 transition-colors">
                  Feedback
                </button>
                <button className="text-gray-600 hover:text-purple-600 transition-colors">
                  Ajuda
                </button>
                <button className="text-gray-600 hover:text-purple-600 transition-colors">
                  Configurações
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      );
}