// app/student/schedules/page.tsx
'use client';

import React, { useState } from 'react';
import {
  FaPlus,
  FaSearch,
  FaSync,
  FaChartLine,
  FaPlay,
  FaTrophy,
  FaCalendarAlt,
  FaUsers,
  FaExclamationCircle,
  FaFilter,
  FaSort
} from 'react-icons/fa';
import { FiCalendar, FiGrid, FiList, FiBarChart2 } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useStudentSchedule } from '@/hooks/useStudentSchedule';
import Link from 'next/link';

// Componentes
import ScheduleCalendar from '@/components/schedules/ScheduleCalendar';
import ScheduleList from '@/components/schedules/ScheduleList';
import ScheduleWeekView from '@/components/schedules/ScheduleWeekView';

export default function MySchedulesPage() {
  const { user } = useAuth();
  const {
    instances,
    todayActivities,
    weekActivities, // NOVO
    loading,
    error,
    refresh,
    totalTodayActivities
  } = useStudentSchedule();

  // Estados para visualização
  const [activeView, setActiveView] = useState<'calendar' | 'week' | 'list'>('week');
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Calcular estatísticas
  const getScheduleStats = () => {
    const totalInstances = instances.length;
    const activeInstances = instances.filter(i => i.status === 'active').length;
    const completedActivities = instances.reduce((total, instance) =>
      total + (instance.progressCache?.completedActivities || 0), 0);
    const totalActivities = instances.reduce((total, instance) =>
      total + (instance.progressCache?.totalActivities || 0), 0);
    const completionRate = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

    return {
      totalInstances,
      activeInstances,
      completedActivities,
      totalActivities,
      completionRate: Math.round(completionRate)
    };
  };

  const stats = getScheduleStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Carregando cronogramas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExclamationCircle className="w-8 h-8 text-red-600" />
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
    <div className="p-4 md:p-6 min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      {/* Header da Página */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Meus Cronogramas</h1>
            <p className="text-gray-600">Gerencie e acompanhe seus cronogramas terapêuticos</p>
          </div>
        </div>
      </div>

      {/* Controles de Visualização e Filtros */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          {/* Tabs de Visualização */}
          <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-xl">
            <button
              onClick={() => setActiveView('week')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${activeView === 'week'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-white'
                }`}
            >
              <FiGrid className="w-4 h-4" />
              <span>Semana</span>
            </button>

            <button
              onClick={() => setActiveView('list')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${activeView === 'list'
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-white'
                }`}
            >
              <FiList className="w-4 h-4" />
              <span>Lista</span>
            </button>
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cronogramas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full sm:w-64"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="paused">Pausados</option>
              <option value="completed">Concluídos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Layout Principal - Calendário em Destaque */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendário Principal (2/3 da tela) */}
        <div className="lg:col-span-2">
          {activeView === 'week' ? (
            <ScheduleWeekView
              selectedDay={selectedDay}
              selectedWeek={selectedWeek}
              weekActivities={weekActivities} // MODIFICADO: usar weekActivities em vez de todayActivities
              expandedActivity={expandedActivity}
              onDaySelect={setSelectedDay}
              onActivityExpand={setExpandedActivity}
              onActivityUpdate={refresh}
            />
          ) : (
            // Visualização em Lista
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Lista de Cronogramas</h3>
                  <div className="text-sm text-gray-500">
                    {instances.length} cronogramas
                  </div>
                </div>
              </div>

              {instances.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl mb-6">
                    <FiList className="w-10 h-10 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Nenhum cronograma encontrado
                  </h4>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Tente ajustar seus filtros de busca ou aguarde seu profissional atribuir novos cronogramas.
                  </p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Cronograma
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Progresso
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Semana
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {instances.map(instance => (
                          <tr key={instance.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                                  <FaCalendarAlt className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">Programa de Desenvolvimento</div>
                                  <div className="text-sm text-gray-500">
                                    Iniciado em {instance.startedAt.toLocaleDateString('pt-BR')}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${instance.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                                instance.status === 'paused' ? 'bg-amber-100 text-amber-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                {instance.status === 'active' ? 'Ativo' :
                                  instance.status === 'paused' ? 'Pausado' : 'Concluído'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {instance.progressCache ? (
                                <div className="w-32">
                                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Progresso</span>
                                    <span>{Math.round(instance.progressCache.completionPercentage)}%</span>
                                  </div>
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                      style={{ width: `${instance.progressCache.completionPercentage}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">Sem progresso</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 font-medium">
                                Semana {instance.currentWeekNumber}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setExpandedSchedule(expandedSchedule === instance.id ? null : instance.id)}
                                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                >
                                  {expandedSchedule === instance.id ? 'Recolher' : 'Expandir'}
                                </button>
                                <Link
                                  href={`/student/schedules/${instance.id}`}
                                  className="px-3 py-1.5 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-md transition-all duration-200"
                                >
                                  Ver
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lista de Cronogramas Lateral (1/3 da tela) */}
        <div>
          <ScheduleList
            schedules={instances}
            expandedSchedule={expandedSchedule}
            onScheduleExpand={setExpandedSchedule}
            searchTerm={searchTerm}
            filterStatus={filterStatus}
          />
        </div>
      </div>

      {/* Botão de Ação Flutuante para Mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-10">
        <button className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center">
          <FaPlus className="w-6 h-6" />
        </button>
      </div>

      {/* Footer da Página */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <div>
            Nexus Platform • Cronogramas • v2.1
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-600 hover:text-purple-600 transition-colors">
              Ajuda
            </button>
            <button className="text-gray-600 hover:text-purple-600 transition-colors">
              Feedback
            </button>
            <button className="text-gray-600 hover:text-purple-600 transition-colors">
              Configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}