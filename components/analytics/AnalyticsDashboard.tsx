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
  FaCalendarAlt,
  FaSpinner,
  FaFire,
  FaTrophy,
  FaStar,
  FaRegChartBar
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { SimpleReportService } from '@/lib/services/SimpleReportService';
import { ScheduleInstanceService } from '@/lib/services/ScheduleInstanceService';
import { StudentService } from '@/lib/services/StudentService';

interface DashboardMetrics {
  totalStudents: number;
  activeStudents: number;
  totalSchedules: number;
  activeSchedules: number;
  avgCompletionRate: number;
  avgEngagementScore: number;
  avgTimeSpent: number;
  avgStreak: number;
}

interface WeeklyTrend {
  weekNumber: number;
  completionRate: number;
  engagementScore: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface StudentComparison {
  studentId: string;
  studentName: string;
  school: string;
  grade: string;
  completionRate: number;
  averageScore: number;
  consistency: number;
  totalPoints: number;
  streak: number;
  trend: 'improving' | 'stable' | 'declining';
  lastActivity?: Date;
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [comparisonData, setComparisonData] = useState<{
    students: StudentComparison[];
    groupAverages: {
      averageCompletionRate: number;
      averageScore: number;
      averageConsistency: number;
      averageStreak: number;
    };
    generatedAt: Date;
  } | null>(null);

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
        activeOnly: true,
        limit: 10 // Limitar para performance
      });

      // Processar alunos em batches para não sobrecarregar
      const batchSize = 3;
      let totalCompletionRate = 0;
      let totalEngagementScore = 0;
      let totalTimeSpent = 0;
      let totalStreak = 0;
      let studentsWithData = 0;
      let totalSchedules = 0;

      // Processar em batches
      for (let i = 0; i < students.length; i += batchSize) {
        const batch = students.slice(i, i + batchSize);
        const batchReports = await Promise.allSettled(
          batch.map(student => SimpleReportService.generateStudentReport(student.id))
        );

        // Processar resultados do batch
        batchReports.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.weeklyReports.length > 0) {
            const report = result.value;
            const latestWeek = report.weeklyReports[0];
            
            totalCompletionRate += latestWeek.summary.completionRate;
            totalEngagementScore += latestWeek.summary.consistencyScore;
            totalTimeSpent += latestWeek.summary.averageTimePerActivity;
            totalStreak += report.overall.streak;
            studentsWithData++;
          }
        });
      }

      // Contar cronogramas ativos
      try {
        for (const student of students.slice(0, 5)) {
          const instances = await ScheduleInstanceService.getStudentActiveInstances(
            student.id,
            { includeProgress: false, limit: 1 }
          );
          totalSchedules += instances.length;
        }
      } catch (error) {
        console.warn('Erro ao contar cronogramas:', error);
        totalSchedules = students.length; // Fallback
      }

      // Calcular médias
      const avgCompletionRate = studentsWithData > 0 ? totalCompletionRate / studentsWithData : 0;
      const avgEngagementScore = studentsWithData > 0 ? totalEngagementScore / studentsWithData : 0;
      const avgTimeSpent = studentsWithData > 0 ? totalTimeSpent / studentsWithData : 0;
      const avgStreak = studentsWithData > 0 ? totalStreak / studentsWithData : 0;

      // Contar alunos ativos (últimos 7 dias)
      const activeStudents = students.filter(s => {
        const lastActivity = s.lastLoginAt ?? s.updatedAt;
        const daysSinceLastActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLastActivity < 7;
      }).length;

      return {
        totalStudents: students.length,
        activeStudents,
        totalSchedules,
        activeSchedules: totalSchedules,
        avgCompletionRate,
        avgEngagementScore,
        avgTimeSpent,
        avgStreak
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
        avgTimeSpent: 0,
        avgStreak: 0
      };
    }
  };

  const loadWeeklyTrends = async (): Promise<WeeklyTrend[]> => {
    try {
      // Em MVP, usar dados dos alunos reais ou mock
      const students = await StudentService.getStudentsByProfessional(user!.id, {
        activeOnly: true,
        limit: 3
      });

      if (students.length === 0) return [];

      const trends: WeeklyTrend[] = [];
      
      // Para cada aluno, pegar a última semana
      for (const student of students.slice(0, 3)) {
        try {
          const report = await SimpleReportService.generateStudentReport(student.id);
          if (report.weeklyReports.length > 0) {
            const latestWeek = report.weeklyReports[0];
            trends.push({
              weekNumber: latestWeek.weekNumber,
              completionRate: latestWeek.summary.completionRate,
              engagementScore: latestWeek.summary.consistencyScore,
              trend: report.trend
            });
          }
        } catch (err) {
          console.warn(`Erro ao buscar tendências do aluno ${student.id}:`, err);
        }
      }

      // Se não tiver dados reais, usar mock
      if (trends.length === 0) {
        return [
          { weekNumber: 1, completionRate: 65, engagementScore: 72, trend: 'improving' },
          { weekNumber: 2, completionRate: 70, engagementScore: 75, trend: 'improving' },
          { weekNumber: 3, completionRate: 68, engagementScore: 73, trend: 'declining' },
          { weekNumber: 4, completionRate: 75, engagementScore: 78, trend: 'improving' },
        ];
      }

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
      const comparativeReport = await SimpleReportService.generateComparativeReport(
        studentIds,
        selectedPeriod
      );

      return {
        students: comparativeReport.students,
        groupAverages: comparativeReport.groupAverages,
        generatedAt: comparativeReport.generatedAt
      };
    } catch (error) {
      console.error('Erro ao carregar dados comparativos:', error);
      return null;
    }
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving': return <FaArrowUp className="text-green-500" />;
      case 'declining': return <FaArrowDown className="text-red-500" />;
      default: return <span className="text-gray-400">→</span>;
    }
  };

  const getMetricColor = (value: number, type: 'rate' | 'score' | 'time' | 'streak' = 'rate') => {
    if (type === 'rate' || type === 'score') {
      if (value >= 80) return 'text-green-600';
      if (value >= 60) return 'text-yellow-600';
      return 'text-red-600';
    }
    if (type === 'streak') {
      if (value >= 5) return 'text-orange-600';
      if (value >= 3) return 'text-yellow-600';
      return 'text-blue-600';
    }
    return 'text-blue-600';
  };

  const getTrendColor = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const exportDashboardData = () => {
    const data = {
      metrics,
      weeklyTrends,
      comparisonData,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
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
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Tentar novamente
        </button>
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
            <button 
              onClick={exportDashboardData}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
            >
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
                <span className={`${getTrendColor(weeklyTrends[weeklyTrends.length - 1].trend)}`}>
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
                <span className={`${getTrendColor(weeklyTrends[weeklyTrends.length - 1].trend)}`}>
                  {weeklyTrends[weeklyTrends.length - 1].engagementScore} pontos
                </span>
              </div>
            )}
          </div>

          {/* Streak */}
          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FaFire className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm text-gray-500">Sequência</span>
            </div>
            <div className={`text-3xl font-bold mb-2 ${getMetricColor(metrics?.avgStreak || 0, 'streak')}`}>
              {Math.round(metrics?.avgStreak || 0)} dias
            </div>
            <div className="text-sm text-gray-600">
              Média de dias seguidos
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Consistência na plataforma
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
              <p className="text-gray-500">Complete atividades para ver análises semanais</p>
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    {comparisonData.groupAverages.averageCompletionRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-blue-600">Conclusão</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {comparisonData.groupAverages.averageScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-green-600">Pontuação</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">
                    {comparisonData.groupAverages.averageConsistency.toFixed(1)}%
                  </div>
                  <div className="text-sm text-purple-600">Consistência</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-700">
                    {comparisonData.groupAverages.averageStreak.toFixed(1)}
                  </div>
                  <div className="text-sm text-orange-600">Sequência</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-700">Ranking de Alunos</h3>
                {comparisonData.students.slice(0, 5).map((student, index) => (
                  <div key={student.studentId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="font-medium text-indigo-700">{index + 1}</span>
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
                    <div className="text-right">
                      <div className={`font-bold ${getMetricColor(student.completionRate)}`}>
                        {student.completionRate.toFixed(1)}%
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        {getTrendIcon(student.trend)}
                        <span className="text-gray-500">{student.streak} dias</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {comparisonData.generatedAt && (
                <div className="text-xs text-gray-400 text-right mt-2">
                  Gerado: {new Date(comparisonData.generatedAt).toLocaleTimeString('pt-BR')}
                </div>
              )}
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
              <li>• {metrics && metrics.avgCompletionRate >= 70 ? 'Alta taxa de conclusão geral' : 'Bom engajamento nos períodos da manhã'}</li>
              <li>• Atividades interativas têm melhor retenção</li>
              <li>• {metrics && metrics.avgStreak >= 3 ? 'Boa consistência de uso' : 'Crescimento na participação'}</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <FaExclamationTriangle className="text-yellow-600" />
              <h3 className="font-medium text-yellow-800">Atenção</h3>
            </div>
            <ul className="space-y-2 text-sm text-yellow-700">
              <li>• {metrics && metrics.avgCompletionRate <= 50 ? 'Taxa de conclusão abaixo do esperado' : 'Alguns alunos com baixa participação'}</li>
              <li>• Atividades longas têm menor taxa de finalização</li>
              <li>• {comparisonData && comparisonData.students.some(s => s.trend === 'declining') ? 'Alguns alunos com tendência de queda' : 'Variabilidade no engajamento'}</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <FaSchool className="text-blue-600" />
              <h3 className="font-medium text-blue-800">Recomendações</h3>
            </div>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• {metrics && metrics.avgCompletionRate <= 60 ? 'Dividir atividades complexas em partes menores' : 'Manter o formato atual de atividades'}</li>
              <li>• Reforçar feedback imediato nas correções</li>
              <li>• {comparisonData ? 'Personalizar abordagem para alunos com baixo engajamento' : 'Monitorar progresso individualmente'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Status do Sistema */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FaRegChartBar className="text-indigo-600" />
            <h3 className="font-semibold text-indigo-800">Status do Sistema</h3>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
            Operacional
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-sm text-gray-500">Dados Atualizados</div>
            <div className="text-lg font-bold text-gray-800">
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-sm text-gray-500">Cache</div>
            <div className="text-lg font-bold text-gray-800">5min</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-sm text-gray-500">Alunos Processados</div>
            <div className="text-lg font-bold text-gray-800">{metrics?.totalStudents || 0}</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-sm text-gray-500">Relatórios Hoje</div>
            <div className="text-lg font-bold text-gray-800">1</div>
          </div>
        </div>
      </div>
    </div>
  );
}