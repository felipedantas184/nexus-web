// components/analytics/AnalyticsDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
  FaCalendarAlt
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { ReportService } from '@/lib/services/ReportService';
import { ScheduleInstanceService } from '@/lib/services/ScheduleInstanceService';
import { StudentService } from '@/lib/services/StudentService';
import { PerformanceSnapshot } from '@/types/schedule';

interface DashboardMetrics {
  totalStudents: number;
  activeStudents: number;
  totalSchedules: number;
  activeSchedules: number;
  avgCompletionRate: number;
  avgEngagementScore: number;
  avgTimeSpent: number;
}

interface WeeklyTrend {
  weekNumber: number;
  completionRate: number;
  engagementScore: number;
  trend: 'up' | 'down' | 'stable';
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [comparisonData, setComparisonData] = useState<any>(null);

  // Carregar dados do dashboard
  useEffect(() => {
    if (!user || user.role === 'student') return;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Carregar métricas básicas
        const dashboardMetrics = await loadDashboardMetrics();
        setMetrics(dashboardMetrics);

        // 2. Carregar tendências semanais
        const trends = await loadWeeklyTrends();
        setWeeklyTrends(trends);

        // 3. Carregar dados comparativos
        if (dashboardMetrics.totalStudents > 1) {
          const comparative = await loadComparativeData(user.id);
          setComparisonData(comparative);
        }

      } catch (err: any) {
        console.error('Erro ao carregar dashboard:', err);
        setError(err.message || 'Erro ao carregar dados analíticos');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, selectedPeriod, timeRange]);

  const loadDashboardMetrics = async (): Promise<DashboardMetrics> => {
    if (!user || user.role === 'student') {
      throw new Error('Apenas profissionais podem acessar esta função');
    }

    try {
      // Buscar alunos do profissional
      const students = await StudentService.getStudentsByProfessional(user.id, {
        activeOnly: true
      });

      // Buscar cronogramas ativos
      let activeSchedulesCount = 0;
      let totalCompletionRate = 0;
      let totalEngagementScore = 0;
      let totalTimeSpent = 0;
      let studentsWithData = 0;

      for (const student of students.slice(0, 10)) { // Limitar para performance
        try {
          // Buscar instâncias ativas do aluno
          const instances = await ScheduleInstanceService.getStudentActiveInstances(
            student.id,
            { includeProgress: false }
          );

          activeSchedulesCount += instances.length;

          // Buscar último snapshot para métricas
          const snapshots = await ReportService.getStudentSnapshots(student.id, {
            limit: 1
          });

          if (snapshots.length > 0) {
            const latest = snapshots[0];
            totalCompletionRate += latest.engagement.completionRate;
            totalEngagementScore += latest.engagement.consistencyScore;
            totalTimeSpent += latest.engagement.averageTimePerActivity;
            studentsWithData++;
          }
        } catch (err) {
          console.warn(`Erro ao processar aluno ${student.id}:`, err);
        }
      }

      const avgCompletionRate = studentsWithData > 0 ? totalCompletionRate / studentsWithData : 0;
      const avgEngagementScore = studentsWithData > 0 ? totalEngagementScore / studentsWithData : 0;
      const avgTimeSpent = studentsWithData > 0 ? totalTimeSpent / studentsWithData : 0;

      return {
        totalStudents: students.length,
        activeStudents: students.filter(s => {
          const lastActivity =
            s.lastLoginAt ?? s.updatedAt;

          const daysSinceLastActivity =
            (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);

          return daysSinceLastActivity < 7;
        }).length,
        totalSchedules: activeSchedulesCount,
        activeSchedules: activeSchedulesCount,
        avgCompletionRate,
        avgEngagementScore,
        avgTimeSpent
      };
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      return {
        totalStudents: 0,
        activeStudents: 0,
        totalSchedules: 0,
        activeSchedules: 0,
        avgCompletionRate: 0,
        avgEngagementScore: 0,
        avgTimeSpent: 0
      };
    }
  };

  const loadWeeklyTrends = async (): Promise<WeeklyTrend[]> => {
    try {
      // Simulação - em produção, buscaria dados reais das últimas semanas
      const trends: WeeklyTrend[] = [
        { weekNumber: 1, completionRate: 65, engagementScore: 72, trend: 'up' },
        { weekNumber: 2, completionRate: 70, engagementScore: 75, trend: 'up' },
        { weekNumber: 3, completionRate: 68, engagementScore: 73, trend: 'down' },
        { weekNumber: 4, completionRate: 75, engagementScore: 78, trend: 'up' },
        { weekNumber: 5, completionRate: 72, engagementScore: 76, trend: 'down' },
        { weekNumber: 6, completionRate: 78, engagementScore: 80, trend: 'up' },
      ];

      return trends;
    } catch (error) {
      console.error('Erro ao carregar tendências:', error);
      return [];
    }
  };

  const loadComparativeData = async (userId: string) => {
    try {
      // Buscar alunos para comparação
      const students = await StudentService.getStudentsByProfessional(userId, {
        activeOnly: true,
        limit: 5
      });

      if (students.length < 2) return null;

      const studentIds = students.map(s => s.id);
      return await ReportService.generateComparativeReport(
        studentIds,
        userId,
        selectedPeriod
      );
    } catch (error) {
      console.error('Erro ao carregar dados comparativos:', error);
      return null;
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <FaArrowUp className="text-green-500" />;
      case 'down': return <FaArrowDown className="text-red-500" />;
      default: return <span className="text-gray-400">→</span>;
    }
  };

  const getMetricColor = (value: number, type: 'rate' | 'score' | 'time' = 'rate') => {
    if (type === 'rate') {
      if (value >= 80) return 'text-green-600';
      if (value >= 60) return 'text-yellow-600';
      return 'text-red-600';
    }
    if (type === 'score') {
      if (value >= 75) return 'text-green-600';
      if (value >= 50) return 'text-yellow-600';
      return 'text-red-600';
    }
    return 'text-blue-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard analítico...</p>
        </div>
      </div>
    );
  }

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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Analítico</h1>
            <p className="text-gray-600">
              Monitoramento e análise do desempenho dos alunos
            </p>
          </div>

          <div className="flex gap-3">
            {/* Filtro de Período */}
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="week">Última Semana</option>
                <option value="month">Último Mês</option>
                <option value="quarter">Último Trimestre</option>
              </select>
              <FaCalendarAlt className="absolute left-3 top-2.5 text-gray-400" />
            </div>

            {/* Botão Exportar */}
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100">
              <FaDownload />
              Exportar
            </button>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total de Alunos */}
          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaUsers className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {metrics?.totalStudents || 0}
            </div>
            <div className="text-sm text-gray-600">
              Alunos atribuídos
            </div>
            {metrics && (
              <div className="mt-2 text-sm">
                <span className="text-green-600 font-medium">
                  {metrics.activeStudents} ativos
                </span>
                <span className="text-gray-400 mx-2">•</span>
                <span className="text-gray-500">
                  {Math.round((metrics.activeStudents / metrics.totalStudents) * 100)}% engajamento
                </span>
              </div>
            )}
          </div>

          {/* Taxa de Conclusão */}
          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <FaCalendarCheck className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Média</span>
            </div>
            <div className={`text-3xl font-bold mb-2 ${getMetricColor(metrics?.avgCompletionRate || 0)}`}>
              {Math.round(metrics?.avgCompletionRate || 0)}%
            </div>
            <div className="text-sm text-gray-600">
              Taxa de conclusão
            </div>
            {weeklyTrends.length > 0 && (
              <div className="mt-2 flex items-center gap-1 text-sm">
                {getTrendIcon(weeklyTrends[weeklyTrends.length - 1].trend)}
                <span className="text-gray-500">
                  {weeklyTrends[weeklyTrends.length - 1].completionRate}% esta semana
                </span>
              </div>
            )}
          </div>

          {/* Engajamento */}
          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FaChartLine className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Pontuação</span>
            </div>
            <div className={`text-3xl font-bold mb-2 ${getMetricColor(metrics?.avgEngagementScore || 0, 'score')}`}>
              {Math.round(metrics?.avgEngagementScore || 0)}/100
            </div>
            <div className="text-sm text-gray-600">
              Engajamento médio
            </div>
            {weeklyTrends.length > 0 && (
              <div className="mt-2 flex items-center gap-1 text-sm">
                {getTrendIcon(weeklyTrends[weeklyTrends.length - 1].trend)}
                <span className="text-gray-500">
                  {weeklyTrends[weeklyTrends.length - 1].engagementScore} esta semana
                </span>
              </div>
            )}
          </div>

          {/* Tempo Médio */}
          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FaClock className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-sm text-gray-500">Média</span>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {Math.round(metrics?.avgTimeSpent || 0)}min
            </div>
            <div className="text-sm text-gray-600">
              Tempo por atividade
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Por atividade concluída
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos e Tendências */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendência Semanal */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold text-gray-800">Tendência Semanal</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-1 text-sm rounded ${timeRange === '7d' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600'}`}
              >
                7D
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1 text-sm rounded ${timeRange === '30d' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600'}`}
              >
                30D
              </button>
              <button
                onClick={() => setTimeRange('90d')}
                className={`px-3 py-1 text-sm rounded ${timeRange === '90d' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600'}`}
              >
                90D
              </button>
            </div>
          </div>

          {weeklyTrends.length > 0 ? (
            <div className="space-y-4">
              {weeklyTrends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <FaCalendarAlt className="text-gray-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">Semana {trend.weekNumber}</div>
                      <div className="text-sm text-gray-500">Taxa de conclusão</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-bold ${getMetricColor(trend.completionRate)}`}>
                      {trend.completionRate}%
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      {getTrendIcon(trend.trend)}
                      <span>Engajamento: {trend.engagementScore}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FaChartLine className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Nenhum dado disponível para análise</p>
            </div>
          )}
        </div>

        {/* Dados Comparativos */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold text-gray-800">Análise Comparativa</h2>
            <FaFilter className="text-gray-400" />
          </div>

          {comparisonData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    {comparisonData.groupMetrics.averageCompletionRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-blue-600">Conclusão média</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {comparisonData.groupMetrics.averageScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-green-600">Pontuação média</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">
                    {comparisonData.groupMetrics.averageConsistency.toFixed(1)}%
                  </div>
                  <div className="text-sm text-purple-600">Consistência</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-700">Ranking de Alunos</h3>
                {comparisonData.comparison.slice(0, 5).map((student: any, index: number) => (
                  <div key={student.studentId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="font-medium text-indigo-700">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {student.name || `Aluno ${student.studentId.substring(0, 6)}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.completionRate}% concluído
                        </div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 text-xs rounded-full ${student.trend === 'improving' ? 'bg-green-100 text-green-800' :
                      student.trend === 'declining' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {student.trend === 'improving' ? 'Melhorando' :
                        student.trend === 'declining' ? 'Decaindo' : 'Estável'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FaUserGraduate className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-700 mb-2">Dados insuficientes</h3>
              <p className="text-gray-500">
                É necessário ter pelo menos 2 alunos com dados para análise comparativa
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Insights e Recomendações */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold text-gray-800 mb-6">Insights e Recomendações</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <FaChartBar className="text-green-600" />
              <h3 className="font-medium text-green-800">Pontos Fortes</h3>
            </div>
            <ul className="space-y-2 text-sm text-green-700">
              <li>• Alta taxa de conclusão em atividades de vídeo</li>
              <li>• Engajamento consistente nas segundas-feiras</li>
              <li>• Tempo médio por atividade dentro do esperado</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <FaExclamationTriangle className="text-yellow-600" />
              <h3 className="font-medium text-yellow-800">Atenção</h3>
            </div>
            <ul className="space-y-2 text-sm text-yellow-700">
              <li>• Baixo engajamento nas sextas-feiras</li>
              <li>• Atividades de texto com menor taxa de conclusão</li>
              <li>• 2 alunos com tendência de queda</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <FaSchool className="text-blue-600" />
              <h3 className="font-medium text-blue-800">Recomendações</h3>
            </div>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• Revisar atividades de sexta-feira</li>
              <li>• Oferecer apoio adicional para atividades de texto</li>
              <li>• Verificar alunos com tendência de queda</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}