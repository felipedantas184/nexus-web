// components/analytics/AnalyticsDashboard.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FaChartLine,
  FaUsers,
  FaCalendarCheck,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle,
  FaFilter,
  FaDownload,
  FaUserGraduate,
  FaSchool,
  FaChartBar,
  FaCalendarAlt,
  FaSpinner,
  FaFire,
  FaTrophy,
  FaStar,
  FaRegChartBar,
  FaCrown,
  FaCalendarDay,
  FaCheckCircle,
  FaTimesCircle,
  FaSignal,
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { SimpleReportService } from '@/lib/services/SimpleReportService';
import { StudentService } from '@/lib/services/StudentService';
import { StudentReport, ComparativeReport } from '@/types/schedule';
import { FaClockRotateLeft, FaRankingStar } from 'react-icons/fa6';

// Tipos específicos para o dashboard
interface DashboardMetrics {
  totalStudents: number;
  activeStudents: number;
  totalActivitiesCompleted: number;
  avgCompletionRate: number;
  avgConsistencyScore: number;
  avgStreakDays: number;
  totalPointsEarned: number;
  avgTimePerActivity: number;
}

interface TopPerformer {
  studentId: string;
  studentName: string;
  school: string;
  grade: string;
  completionRate: number;
  streak: number;
  totalPoints: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface ActivityTypeStats {
  type: string;
  completed: number;
  total: number;
  completionRate: number;
  averageScore: number;
}

interface DayOfWeekPerformance {
  day: number;
  dayName: string;
  completed: number;
  total: number;
  completionRate: number;
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [activityTypeStats, setActivityTypeStats] = useState<ActivityTypeStats[]>([]);
  const [dayPerformance, setDayPerformance] = useState<DayOfWeekPerformance[]>([]);
  const [comparativeData, setComparativeData] = useState<ComparativeReport | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  // Nomes dos dias da semana
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  // Função para carregar todos os dados do dashboard
  const loadDashboardData = useCallback(async () => {
    if (!user || user.role === 'student') return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Carregando dados do dashboard...');

      // 1. Buscar alunos atribuídos ao profissional
      const students = await StudentService.getStudentsByProfessionalOrAll(
        user.id,
        user.role,
        {
          activeOnly: true,
          limit: 50
        }
      );

      console.log(`📊 ${students.length} alunos encontrados`);

      if (students.length === 0) {
        setMetrics({
          totalStudents: 0,
          activeStudents: 0,
          totalActivitiesCompleted: 0,
          avgCompletionRate: 0,
          avgConsistencyScore: 0,
          avgStreakDays: 0,
          totalPointsEarned: 0,
          avgTimePerActivity: 0
        });
        setLoading(false);
        return;
      }

      // 2. Gerar relatórios individuais em paralelo (limitado a 10 para performance)
      const studentIds = students.slice(0, 10).map(s => s.id);
      const reportPromises = studentIds.map(id =>
        SimpleReportService.generateStudentReport(id).catch(err => {
          console.warn(`Erro no relatório do aluno ${id}:`, err);
          return null;
        })
      );

      const reports = await Promise.all(reportPromises);
      const validReports = reports.filter((r): r is StudentReport => r !== null);

      console.log(`📈 ${validReports.length} relatórios gerados com sucesso`);

      // 3. Calcular métricas agregadas
      const aggregatedMetrics = await calculateAggregatedMetrics(validReports, students);
      setMetrics(aggregatedMetrics);

      // 4. Identificar top performers
      const performers = identifyTopPerformers(validReports);
      setTopPerformers(performers);

      // 5. Estatísticas por tipo de atividade
      const activityStats = calculateActivityTypeStats(validReports);
      setActivityTypeStats(activityStats);

      // 6. Desempenho por dia da semana
      const dayStats = calculateDayPerformance(validReports);
      setDayPerformance(dayStats);

      // 7. Dados comparativos (apenas se tiver pelo menos 2 alunos)
      if (validReports.length >= 2) {
        try {
          const comparative = await SimpleReportService.generateComparativeReport(
            studentIds.slice(0, 5),
            selectedPeriod
          );
          setComparativeData(comparative);
        } catch (err) {
          console.warn('Erro ao gerar relatório comparativo:', err);
        }
      }

    } catch (err: any) {
      console.error('Erro ao carregar dashboard:', err);
      setError(err.message || 'Erro ao carregar dados analíticos');
    } finally {
      setLoading(false);
    }
  }, [user, selectedPeriod, timeRange]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Funções auxiliares para cálculos
  const calculateAggregatedMetrics = async (
    reports: StudentReport[],
    students: any[]
  ): Promise<DashboardMetrics> => {
    if (reports.length === 0) {
      return {
        totalStudents: students.length,
        activeStudents: students.filter(s => s.isActive).length,
        totalActivitiesCompleted: 0,
        avgCompletionRate: 0,
        avgConsistencyScore: 0,
        avgStreakDays: 0,
        totalPointsEarned: 0,
        avgTimePerActivity: 0
      };
    }

    let totalCompletionRate = 0;
    let totalConsistencyScore = 0;
    let totalStreak = 0;
    let totalPoints = 0;
    let totalActivitiesCompleted = 0;
    let totalTimeSpent = 0;
    let reportsWithActivities = 0;

    reports.forEach(report => {
      if (report.weeklyReports.length > 0) {
        const latestWeek = report.weeklyReports[0];

        totalCompletionRate += latestWeek.summary.completionRate;
        totalConsistencyScore += latestWeek.summary.consistencyScore;
        totalActivitiesCompleted += latestWeek.summary.completedActivities;
        totalPoints += latestWeek.summary.totalPoints;
        totalTimeSpent += latestWeek.summary.averageTimePerActivity * latestWeek.summary.completedActivities;
        reportsWithActivities++;
      }
      totalStreak += report.overall.streak;
    });

    const activeStudents = students.filter(s => {
      const lastLogin = s.lastLoginAt;

      if (!lastLogin) return false;

      // Converte para Date se for Timestamp do Firebase
      let lastLoginDate: Date;

      if (lastLogin.toDate && typeof lastLogin.toDate === 'function') {
        // É um Timestamp do Firebase
        lastLoginDate = lastLogin.toDate();
      } else if (lastLogin instanceof Date) {
        // Já é um Date
        lastLoginDate = lastLogin;
      } else if (typeof lastLogin === 'string') {
        // É uma string ISO
        lastLoginDate = new Date(lastLogin);
      } else if (lastLogin.seconds) {
        // É um objeto com seconds (Timestamp alternativo)
        lastLoginDate = new Date(lastLogin.seconds * 1000);
      } else {
        // Formato desconhecido, considera inativo
        console.warn('Formato de lastLogin desconhecido:', lastLogin);
        return false;
      }

      const daysSinceLastLogin = Math.floor((Date.now() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceLastLogin <= 7;
    }).length;

    return {
      totalStudents: students.length,
      activeStudents: activeStudents || students.length, // Fallback
      totalActivitiesCompleted,
      avgCompletionRate: reportsWithActivities > 0 ? totalCompletionRate / reportsWithActivities : 0,
      avgConsistencyScore: reportsWithActivities > 0 ? totalConsistencyScore / reportsWithActivities : 0,
      avgStreakDays: reports.length > 0 ? totalStreak / reports.length : 0,
      totalPointsEarned: totalPoints,
      avgTimePerActivity: totalActivitiesCompleted > 0 ? totalTimeSpent / totalActivitiesCompleted : 0
    };
  };

  const identifyTopPerformers = (reports: StudentReport[]): TopPerformer[] => {
    return reports
      .filter(report => report.weeklyReports.length > 0)
      .map(report => {
        const latestWeek = report.weeklyReports[0];
        return {
          studentId: report.studentId,
          studentName: report.studentName,
          school: report.school,
          grade: report.grade,
          completionRate: latestWeek.summary.completionRate,
          streak: report.overall.streak,
          totalPoints: report.overall.totalPoints,
          trend: report.trend
        };
      })
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5); // Top 5 apenas
  };

  const calculateActivityTypeStats = (reports: StudentReport[]): ActivityTypeStats[] => {
    const typeStats: Record<string, { completed: number; total: number; totalScore: number }> = {};

    reports.forEach(report => {
      report.weeklyReports.forEach(week => {
        Object.entries(week.activityTypeBreakdown).forEach(([type, stats]) => {
          if (!typeStats[type]) {
            typeStats[type] = { completed: 0, total: 0, totalScore: 0 };
          }
          typeStats[type].completed += stats.completed;
          typeStats[type].total += stats.total;
          typeStats[type].totalScore += stats.averageScore * stats.completed;
        });
      });
    });

    return Object.entries(typeStats).map(([type, stats]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      completed: stats.completed,
      total: stats.total,
      completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      averageScore: stats.completed > 0 ? stats.totalScore / stats.completed : 0
    }))
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5); // Top 5 tipos de atividade
  };

  const calculateDayPerformance = (reports: StudentReport[]): DayOfWeekPerformance[] => {
    const dayStats: Record<number, { completed: number; total: number }> = {};

    // Inicializar todos os dias
    for (let i = 0; i < 7; i++) {
      dayStats[i] = { completed: 0, total: 0 };
    }

    reports.forEach(report => {
      report.weeklyReports.forEach(week => {
        Object.entries(week.dayBreakdown).forEach(([dayStr, stats]) => {
          const day = parseInt(dayStr);
          dayStats[day].completed += stats.completed;
          dayStats[day].total += stats.total;
        });
      });
    });

    return Object.entries(dayStats).map(([dayStr, stats]) => {
      const day = parseInt(dayStr);
      return {
        day,
        dayName: dayNames[day],
        completed: stats.completed,
        total: stats.total,
        completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
      };
    }).sort((a, b) => b.completionRate - a.completionRate);
  };

  // Funções de formatação e UI
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  };

  const getMetricColor = (value: number, type: 'percentage' | 'score' | 'streak' = 'percentage') => {
    if (type === 'percentage' || type === 'score') {
      if (value >= 80) return 'text-green-600';
      if (value >= 60) return 'text-yellow-600';
      return 'text-red-600';
    }
    if (type === 'streak') {
      if (value >= 5) return 'text-orange-600';
      if (value >= 3) return 'text-yellow-600';
      return 'text-blue-600';
    }
    return 'text-gray-600';
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving': return <FaArrowUp className="text-green-500" />;
      case 'declining': return <FaArrowDown className="text-red-500" />;
      default: return <span className="text-gray-400">→</span>;
    }
  };

  const exportDashboardData = () => {
    const data = {
      metrics,
      topPerformers,
      activityTypeStats,
      dayPerformance,
      comparativeData,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando dashboard analítico...</p>
          <p className="text-sm text-gray-500 mt-2">
            Isso pode levar alguns segundos na primeira vez
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <FaChartLine className="text-red-500" />
          <div>
            <h3 className="font-semibold text-red-800">Erro ao carregar dashboard</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
        <button
          onClick={loadDashboardData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // No data state
  if (metrics?.totalStudents === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <FaUsers className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum aluno encontrado</h3>
        <p className="text-gray-500 mb-6">
          Você ainda não tem alunos atribuídos ou os alunos não completaram atividades
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="p-3 bg-gray-50 rounded-lg">
            <FaUserGraduate className="inline mr-2" />
            Atribuir alunos a você
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <FaCalendarCheck className="inline mr-2" />
            Criar cronogramas
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <FaChartLine className="inline mr-2" />
            Aguardar primeira atividade
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Analítico</h1>
            <p className="text-gray-600">
              Baseado em {metrics?.totalStudents || 0} aluno(s) - Dados em tempo real
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Filtro de Período */}
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-gray-400" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              >
                <option value="week">Última Semana</option>
                <option value="month">Último Mês</option>
                <option value="quarter">Último Trimestre</option>
              </select>
            </div>

            {/* Botão Exportar */}
            <button
              onClick={exportDashboardData}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
            >
              <FaDownload />
              Exportar Dados
            </button>

            {/* Botão Atualizar */}
            <button
              onClick={loadDashboardData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <FaSpinner className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total de Alunos */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaUsers className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-blue-700">
                {metrics?.activeStudents || 0}/{metrics?.totalStudents || 0} ativos
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {metrics?.totalStudents || 0}
            </div>
            <div className="text-sm text-gray-600">Alunos Atribuídos</div>
          </div>

          {/* Taxa de Conclusão */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FaCheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className={`text-sm font-medium ${getMetricColor(metrics?.avgCompletionRate || 0)}`}>
                {formatPercentage(metrics?.avgCompletionRate || 0)}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {metrics?.totalActivitiesCompleted || 0}
            </div>
            <div className="text-sm text-gray-600">Atividades Concluídas</div>
          </div>

          {/* Engajamento */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FaSignal className="w-5 h-5 text-purple-600" />
              </div>
              <span className={`text-sm font-medium ${getMetricColor(metrics?.avgConsistencyScore || 0, 'score')}`}>
                {Math.round(metrics?.avgConsistencyScore || 0)}/100
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {formatTime(metrics?.avgTimePerActivity || 0)}
            </div>
            <div className="text-sm text-gray-600">Tempo Médio por Atividade</div>
          </div>

          {/* Streak e Pontos */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FaFire className="w-5 h-5 text-orange-600" />
              </div>
              <span className={`text-sm font-medium ${getMetricColor(metrics?.avgStreakDays || 0, 'streak')}`}>
                {Math.round(metrics?.avgStreakDays || 0)} dias
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {metrics?.totalPointsEarned || 0}
            </div>
            <div className="text-sm text-gray-600">Pontos Totais Conquistados</div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal em Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Top Performers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Performers */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FaCrown className="text-yellow-500" />
                <h2 className="font-semibold text-gray-800">Top Performers</h2>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                {topPerformers.length} alunos
              </span>
            </div>

            {topPerformers.length > 0 ? (
              <div className="space-y-4">
                {topPerformers.map((student, index) => (
                  <div key={student.studentId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${index === 0 ? 'bg-yellow-100' :
                          index === 1 ? 'bg-gray-100' :
                            index === 2 ? 'bg-orange-100' : 'bg-blue-100'
                        }`}>
                        <span className={`font-bold ${index === 0 ? 'text-yellow-700' :
                            index === 1 ? 'text-gray-700' :
                              index === 2 ? 'text-orange-700' : 'text-blue-700'
                          }`}>
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {student.studentName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.school} • {student.grade}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className={`font-bold ${getMetricColor(student.completionRate)}`}>
                          {formatPercentage(student.completionRate)}
                        </div>
                        <div className="text-sm text-gray-500">Conclusão</div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-gray-800">
                          {student.streak} dias
                        </div>
                        <div className="text-sm text-gray-500">Sequência</div>
                      </div>

                      <div className="flex items-center gap-1">
                        {getTrendIcon(student.trend)}
                        <span className="text-sm text-gray-500">
                          {student.totalPoints} pts
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <FaUserGraduate className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">Nenhum aluno com atividades concluídas</p>
              </div>
            )}
          </div>

          {/* Desempenho por Tipo de Atividade */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FaChartBar className="text-blue-500" />
                <h2 className="font-semibold text-gray-800">Desempenho por Tipo de Atividade</h2>
              </div>
            </div>

            {activityTypeStats.length > 0 ? (
              <div className="space-y-4">
                {activityTypeStats.map((stat, index) => (
                  <div key={stat.type} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{stat.type}</span>
                      <span className={`font-bold ${getMetricColor(stat.completionRate)}`}>
                        {formatPercentage(stat.completionRate)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${stat.completionRate >= 80 ? 'bg-green-500' :
                            stat.completionRate >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                          }`}
                        style={{ width: `${Math.min(stat.completionRate, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{stat.completed}/{stat.total} concluídas</span>
                      <span>Média: {stat.averageScore.toFixed(1)} pontos</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">Sem dados de tipos de atividade</p>
              </div>
            )}
          </div>
        </div>

        {/* Coluna 2: Métricas Secundárias */}
        <div className="space-y-6">
          {/* Desempenho por Dia da Semana */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FaCalendarDay className="text-purple-500" />
                <h2 className="font-semibold text-gray-800">Melhores Dias</h2>
              </div>
            </div>

            {dayPerformance.length > 0 ? (
              <div className="space-y-3">
                {dayPerformance.slice(0, 3).map((day) => (
                  <div key={day.day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{day.dayName}</span>
                    <div className="text-right">
                      <div className={`font-bold ${getMetricColor(day.completionRate)}`}>
                        {formatPercentage(day.completionRate)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {day.completed}/{day.total} atividades
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">Sem dados de desempenho por dia</p>
              </div>
            )}
          </div>

          {/* Insights Rápidos */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FaExclamationTriangle className="text-orange-500" />
                <h2 className="font-semibold text-gray-800">Insights Rápidos</h2>
              </div>
            </div>

            <div className="space-y-4">
              {metrics && metrics.avgCompletionRate >= 70 ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <FaCheckCircle className="text-green-600" />
                    <span className="font-medium text-green-800">Excelente Engajamento</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Taxa média de conclusão acima de 70%. Bom trabalho!
                  </p>
                </div>
              ) : metrics && metrics.avgCompletionRate <= 40 ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <FaTimesCircle className="text-red-600" />
                    <span className="font-medium text-red-800">Atenção Necessária</span>
                  </div>
                  <p className="text-sm text-red-700">
                    Taxa de conclusão baixa. Considere revisar as atividades.
                  </p>
                </div>
              ) : null}

              {metrics && metrics.avgStreakDays >= 5 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <FaFire className="text-blue-600" />
                    <span className="font-medium text-blue-800">Alta Consistência</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Alunos mantêm uma boa sequência de atividades.
                  </p>
                </div>
              )}

              {activityTypeStats.length > 0 && activityTypeStats.some(s => s.completionRate <= 30) && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <FaChartBar className="text-yellow-600" />
                    <span className="font-medium text-yellow-800">Tipo de Atividade com Baixo Engajamento</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Alguns tipos de atividade têm baixa taxa de conclusão.
                  </p>
                </div>
              )}

              {(!metrics || metrics.totalActivitiesCompleted === 0) && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <FaClockRotateLeft className="text-gray-600" />
                    <span className="font-medium text-gray-800">Aguardando Dados</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Os alunos ainda não completaram atividades. Os dados aparecerão aqui em breve.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Status do Sistema */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FaRegChartBar className="text-gray-600" />
                <h3 className="font-semibold text-gray-700">Status do Sistema</h3>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                Operacional
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Dados Atualizados</span>
                <span className="font-medium text-gray-800">
                  {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cache</span>
                <span className="font-medium text-gray-800">5 min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Alunos Processados</span>
                <span className="font-medium text-gray-800">{metrics?.totalStudents || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Relatórios Gerados</span>
                <span className="font-medium text-gray-800">{topPerformers.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dados Comparativos (se disponível) */}
      {comparativeData && comparativeData.students.length >= 2 && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FaRankingStar className="text-indigo-500" />
              <h2 className="font-semibold text-gray-800">Análise Comparativa</h2>
            </div>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">
              {comparativeData.students.length} alunos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aluno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conclusão
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pontuação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consistência
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sequência
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tendência
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comparativeData.students.map((student) => (
                  <tr key={student.studentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{student.studentName}</div>
                        <div className="text-sm text-gray-500">{student.school} • {student.grade}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`font-bold ${getMetricColor(student.completionRate)}`}>
                        {formatPercentage(student.completionRate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {student.averageScore.toFixed(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {formatPercentage(student.consistency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {student.streak} dias
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {getTrendIcon(student.trend)}
                        <span className={`text-sm ${student.trend === 'improving' ? 'text-green-600' :
                            student.trend === 'declining' ? 'text-red-600' :
                              'text-gray-600'
                          }`}>
                          {student.trend === 'improving' ? 'Melhorando' :
                            student.trend === 'declining' ? 'Diminuindo' : 'Estável'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {comparativeData.generatedAt && (
            <div className="text-xs text-gray-400 text-right mt-4">
              Gerado: {new Date(comparativeData.generatedAt).toLocaleString('pt-BR')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}