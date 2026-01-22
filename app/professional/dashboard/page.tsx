// app/professional/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaCalendarPlus, 
  FaUsers, 
  FaChartLine, 
  FaClock,
  FaArrowRight,
  FaExclamationTriangle,
  FaCalendarCheck
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { useSchedules } from '@/hooks/useSchedules';
import { ScheduleInstanceService } from '@/lib/services/ScheduleInstanceService';
import { StudentService } from '@/lib/services/StudentService';

export default function ProfessionalDashboardPage() {
  const { user } = useAuth();
  const { schedules, loading: schedulesLoading } = useSchedules({ 
    activeOnly: true,
    limit: 5 
  });
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    activeSchedules: 0,
    pendingAssignments: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoadingStats(true);
        
        // Carregar estatísticas
        const students = await StudentService.getStudentsByProfessional(user.id, {
          activeOnly: true
        });
        
        // Contar instâncias ativas
        let activeInstances = 0;
        for (const student of students.slice(0, 10)) {
          const instances = await ScheduleInstanceService.getStudentActiveInstances(
            student.id,
            { includeProgress: false, limit: 1 }
          );
          activeInstances += instances.length;
        }
        
        setStats({
          totalStudents: students.length,
          activeStudents: students.filter(s => {
            const lastActivity = s.lastLoginAt || s.updatedAt;
            const daysSinceLastActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceLastActivity < 7;
          }).length,
          activeSchedules: activeInstances,
          pendingAssignments: schedules.filter(s => !s.isActive).length
        });
        
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoadingStats(false);
      }
    };
    
    loadDashboardData();
  }, [user, schedules]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Profissional</h1>
          <p className="text-gray-600">Bem-vindo(a), {user?.name}</p>
        </div>
        
        <Link
          href="/professional/schedules/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700"
        >
          <FaCalendarPlus />
          Novo Cronograma
        </Link>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaUsers className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-2">
            {loadingStats ? '...' : stats.totalStudents}
          </div>
          <div className="text-sm text-gray-600">Alunos Atribuídos</div>
          {!loadingStats && (
            <div className="mt-2 text-sm text-green-600">
              {stats.activeStudents} ativos esta semana
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaCalendarCheck className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Ativos</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-2">
            {loadingStats ? '...' : stats.activeSchedules}
          </div>
          <div className="text-sm text-gray-600">Cronogramas Ativos</div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaChartLine className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Pendentes</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-2">
            {stats.pendingAssignments}
          </div>
          <div className="text-sm text-gray-600">Para Atribuir</div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <FaClock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm text-gray-500">Hoje</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-2">
            {schedules.length}
          </div>
          <div className="text-sm text-gray-600">Cronogramas</div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cronogramas Recentes */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Cronogramas Recentes</h2>
              <Link
                href="/professional/schedules"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                Ver todos
              </Link>
            </div>
            
            {schedulesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Carregando cronogramas...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <FaCalendarPlus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Nenhum cronograma criado
                </h3>
                <p className="text-gray-500 mb-4">
                  Comece criando seu primeiro cronograma
                </p>
                <Link
                  href="/professional/schedules/new"
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
                >
                  <FaCalendarPlus />
                  Criar Primeiro Cronograma
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {schedules.slice(0, 5).map(schedule => (
                  <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div>
                      <h4 className="font-medium text-gray-800">{schedule.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <span>{schedule.metadata.totalActivities || 0} atividades</span>
                        <span>•</span>
                        <span>{schedule.metadata.estimatedWeeklyHours}h/semana</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        schedule.category === 'therapeutic' ? 'bg-blue-100 text-blue-800' :
                        schedule.category === 'educational' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {schedule.category === 'therapeutic' ? 'Terapêutico' :
                         schedule.category === 'educational' ? 'Educacional' : 'Misto'}
                      </span>
                      
                      <Link
                        href={`/professional/schedules/${schedule.id}/assign`}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <FaArrowRight />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Ações Rápidas</h2>
            <div className="space-y-3">
              <Link
                href="/professional/schedules/new"
                className="flex items-center justify-between p-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
              >
                <span className="font-medium">Criar Cronograma</span>
                <FaCalendarPlus />
              </Link>
              
              <Link
                href="/professional/analytics"
                className="flex items-center justify-between p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
              >
                <span className="font-medium">Ver Analytics</span>
                <FaChartLine />
              </Link>
              
              <Link
                href="/professional/students"
                className="flex items-center justify-between p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
              >
                <span className="font-medium">Gerenciar Alunos</span>
                <FaUsers />
              </Link>
            </div>
          </div>

          {/* Alertas */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Alertas</h2>
            <div className="space-y-3">
              {stats.pendingAssignments > 0 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <FaExclamationTriangle className="text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">
                      {stats.pendingAssignments} cronograma(s) para atribuir
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Atribua cronogramas pendentes aos alunos
                    </p>
                  </div>
                </div>
              )}
              
              {stats.activeStudents < stats.totalStudents / 2 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <FaUsers className="text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">
                      Engajamento abaixo da média
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Apenas {stats.activeStudents} de {stats.totalStudents} alunos ativos
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}