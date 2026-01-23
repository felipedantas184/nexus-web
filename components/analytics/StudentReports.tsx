// components/analytics/StudentReports.tsx - CORREÇÕES NO TOPO DO ARQUIVO
'use client';

import React, { useState, useEffect } from 'react';
import {
  FaUser,
  FaChartBar,
  FaCalendarWeek,
  FaClock,
  FaStar,
  FaDownload,
  FaPrint,
  FaShare,
  FaLightbulb,
  FaExclamationCircle,
  FaSchool,
  FaGraduationCap,
  FaFire,
  FaSpinner,
  FaCalendarAlt,
  FaCheckCircle,
  FaRegClock,
  FaUserGraduate
} from "react-icons/fa";
import { useAuth } from '@/context/AuthContext';
import { SimpleReportService } from '@/lib/services/SimpleReportService';
import { StudentService } from '@/lib/services/StudentService';
import { Student } from '@/types/auth';
import { StudentReport, WeeklyReportData } from '@/types/schedule';
import { FaArrowTrendDown, FaArrowTrendUp } from 'react-icons/fa6';

interface StudentReportsProps {
  studentId?: string;
  showHeader?: boolean;
  onBack?: () => void;
}

export default function StudentReports({
  studentId,
  showHeader = true,
  onBack
}: StudentReportsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false); // ⚠️ MUDADO: inicial false
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [report, setReport] = useState<StudentReport | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'weekly' | 'insights'>('overview');

  // Determinar ID do aluno
  const targetStudentId = studentId || (user?.role === 'student' ? user.id : null);

  // Carregar dados
  useEffect(() => {
    // ⚠️ CORREÇÃO CRÍTICA: Se não tem studentId, não carrega nada
    if (!targetStudentId) {
      setLoading(false);
      setError(null);
      setStudent(null);
      setReport(null);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Carregar dados do aluno
        const studentData = await loadStudentData(targetStudentId);
        setStudent(studentData);

        // 2. Gerar relatório usando serviço simplificado
        const studentReport = await SimpleReportService.generateStudentReport(targetStudentId);
        setReport(studentReport);

      } catch (err: any) {
        console.error('Erro ao carregar relatórios:', err);
        setError(err.message || 'Erro ao carregar dados do aluno');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [targetStudentId, user]);

  // ⚠️ ADICIONAR: Estado "sem aluno selecionado"
  if (!targetStudentId && user?.role !== 'student') {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <FaUserGraduate className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700">
          Selecione um aluno
        </h3>
        <p className="text-gray-500">
          Escolha um aluno para visualizar o relatório individual
        </p>
      </div>
    );
  }

  const loadStudentData = async (id: string): Promise<Student> => {
    try {
      // Para profissionais visualizando alunos
      const stats = await StudentService.getStudentStats(id);

      // Buscar dados completos do aluno
      const studentDoc = await StudentService.getStudentById(id, user?.id || '');

      return {
        id,
        email: studentDoc.email,
        name: studentDoc.name,
        role: 'student',
        profileComplete: true,
        isActive: true,
        createdAt: studentDoc.createdAt,
        updatedAt: studentDoc.updatedAt,
        lastLoginAt: studentDoc.lastLoginAt,
        profile: {
          cpf: studentDoc.profile.cpf || '',
          birthday: studentDoc.profile.birthday,
          school: studentDoc.profile.school,
          grade: studentDoc.profile.grade,
          assignedProfessionals: studentDoc.profile.assignedProfessionals || [],
          assignedPrograms: studentDoc.profile.assignedPrograms || [],
          streak: stats.streak,
          totalPoints: stats.totalPoints,
          level: stats.level,
          achievements: []
        }
      };
    } catch (error) {
      console.error('Erro ao carregar dados do aluno:', error);
      // Fallback básico
      return {
        id,
        email: 'aluno@exemplo.com',
        name: 'Aluno',
        role: 'student',
        profileComplete: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: {
          cpf: '',
          birthday: new Date(),
          school: 'Escola Exemplo',
          grade: '6º Ano',
          assignedProfessionals: [],
          assignedPrograms: [],
          streak: 0,
          totalPoints: 0,
          level: 1,
          achievements: []
        }
      };
    }
  };

  const getTrendColor = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving': return <FaArrowTrendUp className="text-green-500" />;
      case 'declining': return <FaArrowTrendDown className="text-red-500" />;
      default: return <span className="text-gray-400">→</span>;
    }
  };

  const getTrendBadge = (trend: 'improving' | 'stable' | 'declining', confidence: 'high' | 'medium' | 'low') => {
    const confidenceColor = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800'
    }[confidence];

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${confidenceColor}`}>
        {trend === 'improving' ? 'Melhorando' :
          trend === 'declining' ? 'Decaindo' : 'Estável'}
      </span>
    );
  };

  const formatDateRange = (start: Date, end: Date) => {
    return `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}min` : `${hours}h`;
  };

  const exportReport = () => {
    if (!report) return;

    const data = {
      student: student?.name,
      report,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${student?.name || 'aluno'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="mt-4 text-gray-600">Gerando relatório do aluno...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <FaExclamationCircle className="text-red-500" />
          <div>
            <h3 className="font-semibold text-red-800">Erro ao carregar relatórios</h3>
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

  if (!report || !student) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <FaUser className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Nenhum dado disponível
        </h3>
        <p className="text-gray-500">
          Não foram encontrados dados para gerar relatórios
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="text-gray-600 hover:text-gray-800"
                >
                  ← Voltar
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Relatório do Aluno: {student.name}
                </h1>
                <p className="text-gray-600">
                  Análise detalhada de desempenho e engajamento
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={exportReport}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
              >
                <FaDownload />
                Exportar
              </button>
              <button
                onClick={printReport}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <FaPrint />
                Imprimir
              </button>
            </div>
          </div>

          {/* Informações do Aluno */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Escola</div>
              <div className="font-medium">{student.profile.school}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Série</div>
              <div className="font-medium">{student.profile.grade}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Pontos Totais</div>
              <div className="font-medium">{student.profile.totalPoints}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Nível</div>
              <div className="font-medium">{student.profile.level}</div>
            </div>
          </div>

          {/* Status do Relatório */}
          <div className="mt-4 text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span>
                <span className="font-medium">Gerado:</span> {report.generatedAt.toLocaleString('pt-BR')}
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium">Status:</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${report.dataFreshness === 'realtime' ? 'bg-green-100 text-green-800' :
                  report.dataFreshness === 'cached' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                  {report.dataFreshness === 'realtime' ? 'Atualizado' :
                    report.dataFreshness === 'cached' ? 'Cache (5min)' : 'Antigo'}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium">Tendência:</span>
                {getTrendBadge(report.trend, report.trendConfidence)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-medium ${activeTab === 'overview' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-6 py-4 font-medium ${activeTab === 'weekly' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
            >
              Análise Semanal
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`px-6 py-4 font-medium ${activeTab === 'insights' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
            >
              Insights
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Visão Geral */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Pontos e Nível */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FaStar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-blue-700">Pontuação Total</div>
                      <div className="text-2xl font-bold text-blue-800">
                        {report.overall.totalPoints}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-blue-700">
                    Nível {report.overall.currentLevel}
                  </div>
                </div>

                {/* Streak */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FaFire className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-sm text-orange-700">Sequência Atual</div>
                      <div className="text-2xl font-bold text-orange-800">
                        {report.overall.streak} dias
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-orange-700">
                    Consistência de uso
                  </div>
                </div>

                {/* Atividades */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FaCheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-green-700">Atividades</div>
                      <div className="text-2xl font-bold text-green-800">
                        {report.overall.totalActivitiesCompleted}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-green-700">
                    {report.overall.averageCompletionRate.toFixed(1)}% conclusão
                  </div>
                </div>

                {/* Tempo */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FaRegClock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-purple-700">Tempo Total</div>
                      <div className="text-2xl font-bold text-purple-800">
                        {formatTime(report.overall.totalTimeSpent)}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-purple-700">
                    Dedicado às atividades
                  </div>
                </div>
              </div>

              {/* Últimas Semanas */}
              {report.weeklyReports.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Desempenho Recente</h3>
                  <div className="space-y-3">
                    {report.weeklyReports.slice(0, 3).map((week) => (
                      <div key={week.weekNumber} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <FaCalendarAlt className="text-gray-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">Semana {week.weekNumber}</div>
                            <div className="text-sm text-gray-500">
                              {formatDateRange(week.weekStartDate, week.weekEndDate)}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`font-bold ${week.summary.completionRate >= 70 ? 'text-green-600' : week.summary.completionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {week.summary.completionRate.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-500">
                            {week.summary.completedActivities}/{week.summary.totalActivities} atividades
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Melhor Dia da Semana */}
              {report.weeklyReports.length > 0 && (
                <div className="bg-white border rounded-xl p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Distribuição por Dia</h3>
                  <div className="grid grid-cols-7 gap-2">
                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, index) => {
                      const latestWeek = report.weeklyReports[0];
                      const dayData = latestWeek.dayBreakdown[index];
                      const completionRate = dayData?.total > 0
                        ? (dayData.completed / dayData.total) * 100
                        : 0;

                      return (
                        <div key={day} className="text-center">
                          <div className="text-sm text-gray-500 mb-1">{day}</div>
                          <div className="h-24 bg-gray-100 rounded-lg overflow-hidden relative">
                            {completionRate > 0 && (
                              <div
                                className={`absolute bottom-0 left-0 right-0 ${completionRate >= 80 ? 'bg-green-500' :
                                  completionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                style={{ height: `${completionRate}%` }}
                              />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-xs font-medium">
                                {dayData?.completed || 0}/{dayData?.total || 0}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {completionRate.toFixed(0)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Análise Semanal */}
          {activeTab === 'weekly' && (
            <div className="space-y-6">
              {/* Seletor de Semana */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Análise Detalhada por Semana</h3>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">Todas as semanas</option>
                  {report.weeklyReports.map(week => (
                    <option key={week.weekNumber} value={week.weekNumber}>
                      Semana {week.weekNumber} ({formatDateRange(week.weekStartDate, week.weekEndDate)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Lista de Semanas */}
              <div className="space-y-4">
                {(selectedWeek === 'all' ? report.weeklyReports : report.weeklyReports.filter(w => w.weekNumber === selectedWeek)).map(week => (
                  <div key={week.weekNumber} className="border rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            Semana {week.weekNumber}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {formatDateRange(week.weekStartDate, week.weekEndDate)}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {week.summary.completionRate.toFixed(1)}% concluído
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Métricas da Semana */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="text-sm text-blue-700 mb-1">Engajamento</div>
                          <div className="text-2xl font-bold text-blue-800">
                            {week.summary.consistencyScore.toFixed(1)}%
                          </div>
                          <div className="text-sm text-blue-600">
                            Aderência: {week.summary.adherenceScore.toFixed(1)}%
                          </div>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="text-sm text-green-700 mb-1">Desempenho</div>
                          <div className="text-2xl font-bold text-green-800">
                            {week.summary.averageScore.toFixed(1)}
                          </div>
                          <div className="text-sm text-green-600">
                            {week.summary.totalPoints} pontos
                          </div>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg">
                          <div className="text-sm text-purple-700 mb-1">Tempo</div>
                          <div className="text-2xl font-bold text-purple-800">
                            {formatTime(week.summary.averageTimePerActivity)}
                          </div>
                          <div className="text-sm text-purple-600">
                            por atividade
                          </div>
                        </div>
                      </div>

                      {/* Detalhamento por Tipo */}
                      {Object.keys(week.activityTypeBreakdown).length > 0 && (
                        <div className="mb-6">
                          <h5 className="font-medium text-gray-700 mb-3">Desempenho por Tipo</h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(week.activityTypeBreakdown).map(([type, data]: [string, any]) => (
                              <div key={type} className="p-3 bg-gray-50 rounded-lg">
                                <div className="font-medium text-gray-800 mb-1 capitalize">{type}</div>
                                <div className="space-y-1">
                                  <div className="text-sm text-gray-600">
                                    Concluídas: <span className="font-medium">{data.completed}/{data.total}</span>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Pontuação: <span className="font-medium">{data.averageScore.toFixed(1)}</span>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Tempo: <span className="font-medium">{formatTime(data.averageTime)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Insights da Semana */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-700">Insights da Semana</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {week.insights.strengths.length > 0 && (
                            <div className="p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <FaArrowTrendUp className="text-green-600" />
                                <span className="font-medium text-green-800">Pontos Fortes</span>
                              </div>
                              <ul className="text-sm text-green-700 space-y-1">
                                {week.insights.strengths.map((strength, i) => (
                                  <li key={i}>• {strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {week.insights.challenges.length > 0 && (
                            <div className="p-3 bg-yellow-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <FaExclamationCircle className="text-yellow-600" />
                                <span className="font-medium text-yellow-800">Desafios</span>
                              </div>
                              <ul className="text-sm text-yellow-700 space-y-1">
                                {week.insights.challenges.map((challenge, i) => (
                                  <li key={i}>• {challenge}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {activeTab === 'insights' && report.weeklyReports.length > 0 && (
            <div className="space-y-6">
              {/* Insights Gerados */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FaLightbulb className="w-6 h-6 text-indigo-600" />
                  <h3 className="font-semibold text-indigo-800">Análise Detalhada</h3>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-800 mb-3">Padrões Detectados</h4>
                  <div className="space-y-2">
                    {report.trend === 'improving' && (
                      <div className="flex items-start gap-2">
                        <div className="mt-1 w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Tendência positiva de melhoria no desempenho</span>
                      </div>
                    )}
                    {report.overall.streak >= 3 && (
                      <div className="flex items-start gap-2">
                        <div className="mt-1 w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Boa consistência de uso da plataforma</span>
                      </div>
                    )}
                    {report.overall.averageCompletionRate >= 70 && (
                      <div className="flex items-start gap-2">
                        <div className="mt-1 w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Alta taxa de conclusão de atividades</span>
                      </div>
                    )}
                    {report.overall.averageCompletionRate <= 50 && (
                      <div className="flex items-start gap-2">
                        <div className="mt-1 w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-gray-700">Oportunidade para melhorar engajamento</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Confiança da Análise</div>
                    <div className="font-medium text-gray-800">
                      {report.trendConfidence === 'high' ? 'Alta' :
                        report.trendConfidence === 'medium' ? 'Média' : 'Baixa'}
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Semanas Analisadas</div>
                    <div className="font-medium text-gray-800">
                      {report.weeklyReports.length} semanas
                    </div>
                  </div>
                </div>
              </div>

              {/* Recomendações Personalizadas */}
              <div className="bg-white border rounded-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Recomendações Personalizadas</h3>

                <div className="space-y-4">
                  {report.weeklyReports[0]?.insights.recommendations.length > 0 ? (
                    report.weeklyReports[0].insights.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">{index + 1}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-800">{recommendation}</p>
                          <div className="mt-2 flex gap-2">
                            <button className="text-sm text-indigo-600 hover:text-indigo-800">
                              Aplicar
                            </button>
                            <button className="text-sm text-gray-500 hover:text-gray-700">
                              Mais tarde
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                        <FaLightbulb className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">
                        Continue usando a plataforma para gerar recomendações personalizadas
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Ações Sugeridas */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h3 className="font-semibold text-yellow-800 mb-4">Ações Sugeridas</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">Revisar cronograma</div>
                      <div className="text-sm text-gray-500">Ajustar atividades mais desafiadoras</div>
                    </div>
                    <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                      Revisar
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">Programar feedback</div>
                      <div className="text-sm text-gray-500">Agendar sessão de acompanhamento</div>
                    </div>
                    <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                      Agendar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compartilhamento */}
      {user?.role !== 'student' && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Compartilhar Relatório</h3>
              <p className="text-sm text-gray-500">
                Compartilhe este relatório com outros profissionais
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <FaShare />
              Compartilhar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}