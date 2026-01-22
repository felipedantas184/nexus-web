// components/analytics/StudentReports.tsx
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
  FaExclamationCircle
} from 'react-icons/fa';
import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";
import { useAuth } from '@/context/AuthContext';
import { ReportService } from '@/lib/services/ReportService';
import { StudentService } from '@/lib/services/StudentService';
import { Student } from '@/types/auth';
import { PerformanceSnapshot } from '@/types/schedule';

interface StudentReportsProps {
  studentId?: string; // Opcional - se não fornecido, usa o aluno logado
  showHeader?: boolean;
  onBack?: () => void;
}

export default function StudentReports({ 
  studentId,
  showHeader = true,
  onBack 
}: StudentReportsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [report, setReport] = useState<any>(null);
  const [snapshots, setSnapshots] = useState<PerformanceSnapshot[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'weekly' | 'insights'>('overview');

  // Determinar ID do aluno
  const targetStudentId = studentId || (user?.role === 'student' ? user.id : null);

  // Carregar dados
  useEffect(() => {
    if (!targetStudentId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Carregar dados do aluno
        const studentData = await loadStudentData(targetStudentId);
        setStudent(studentData);

        // 2. Gerar relatório do aluno
        const studentReport = await ReportService.generateStudentReport(targetStudentId, {
          includeDetailedData: true
        });
        setReport(studentReport);

        // 3. Carregar snapshots individuais
        const studentSnapshots = await ReportService.getStudentSnapshots(targetStudentId, {
          limit: 8 // Últimas 8 semanas
        });
        setSnapshots(studentSnapshots);

      } catch (err: any) {
        console.error('Erro ao carregar relatórios:', err);
        setError(err.message || 'Erro ao carregar dados do aluno');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [targetStudentId]);

  const loadStudentData = async (id: string): Promise<Student> => {
    try {
      // Em produção, buscaria do Firestore
      // Por enquanto, retornar dados mock baseados no usuário atual
      if (user?.role === 'student' && user.id === id) {
        return user as Student;
      }

      // Para profissionais visualizando alunos
      const stats = await StudentService.getStudentStats(id);
      
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
          streak: stats.streak,
          totalPoints: stats.totalPoints,
          level: stats.level,
          achievements: []
        }
      };
    } catch (error) {
      console.error('Erro ao carregar dados do aluno:', error);
      throw error;
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

  const formatDateRange = (start: Date, end: Date) => {
    return `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`;
  };

  const exportReport = () => {
    const data = {
      student: student?.name,
      report,
      snapshots,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${student?.name || 'aluno'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando relatórios...</p>
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
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                <FaPrint />
                Imprimir
              </button>
            </div>
          </div>

          {/* Informações do Aluno */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              {/* Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <FaChartBar className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="text-sm text-blue-700">Desempenho Geral</div>
                      <div className="text-2xl font-bold text-blue-800">
                        {report.summary.averageScore?.toFixed(1) || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-blue-700">
                    {report.summary.trend === 'improving' ? 'Tendência positiva' :
                     report.summary.trend === 'declining' ? 'Tendência negativa' :
                     'Estável'}
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <FaCalendarWeek className="w-6 h-6 text-green-600" />
                    <div>
                      <div className="text-sm text-green-700">Taxa de Conclusão</div>
                      <div className="text-2xl font-bold text-green-800">
                        {report.summary.averageCompletionRate?.toFixed(1) || 0}%
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-green-700">
                    Semanas analisadas: {report.summary.totalWeeks || 0}
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <FaStar className="w-6 h-6 text-purple-600" />
                    <div>
                      <div className="text-sm text-purple-700">Consistência</div>
                      <div className="text-2xl font-bold text-purple-800">
                        {snapshots[0]?.engagement.consistencyScore?.toFixed(1) || 0}%
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-purple-700">
                    Melhor semana: {report.summary.bestWeek || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Tendências */}
              {report.weeklyTrends.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Tendências Recentes</h3>
                  <div className="space-y-3">
                    {report.weeklyTrends.slice(0, 4).map((trend: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded ${getTrendColor(trend.trendDirection)} bg-opacity-20`}>
                            {getTrendIcon(trend.trendDirection)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">Semana {trend.weekNumber}</div>
                            <div className="text-sm text-gray-500">Conclusão: {trend.completionRate}%</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-800">{trend.averageScore.toFixed(1)}</div>
                          <div className="text-sm text-gray-500">Pontuação média</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Análise por Tipo de Atividade */}
              {snapshots[0]?.activityTypeAnalysis && (
                <div className="bg-white border rounded-xl p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Desempenho por Tipo de Atividade</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(snapshots[0].activityTypeAnalysis).map(([type, data]: [string, any]) => (
                      <div key={type} className="p-4 bg-gray-50 rounded-lg">
                        <div className="font-medium text-gray-800 mb-2 capitalize">{type}</div>
                        <div className="space-y-1">
                          <div className="text-sm text-gray-600">
                            Concluídas: <span className="font-medium">{data.completed}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Pontuação: <span className="font-medium">{data.averageScore.toFixed(1)}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Tempo: <span className="font-medium">{data.averageTime.toFixed(0)}min</span>
                          </div>
                        </div>
                      </div>
                    ))}
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
                  {snapshots.map(snapshot => (
                    <option key={snapshot.weekNumber} value={snapshot.weekNumber}>
                      Semana {snapshot.weekNumber} ({formatDateRange(snapshot.weekStartDate, snapshot.weekEndDate)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Lista de Snapshots */}
              <div className="space-y-4">
                {(selectedWeek === 'all' ? snapshots : snapshots.filter(s => s.weekNumber === selectedWeek)).map(snapshot => (
                  <div key={snapshot.id} className="border rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            Semana {snapshot.weekNumber}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {formatDateRange(snapshot.weekStartDate, snapshot.weekEndDate)}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {snapshot.engagement.completionRate}% concluído
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="text-sm text-blue-700 mb-1">Engajamento</div>
                          <div className="text-2xl font-bold text-blue-800">
                            {snapshot.engagement.consistencyScore}%
                          </div>
                          <div className="text-sm text-blue-600">
                            Tempo médio: {snapshot.engagement.averageTimePerActivity}min
                          </div>
                        </div>
                        
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="text-sm text-green-700 mb-1">Desempenho</div>
                          <div className="text-2xl font-bold text-green-800">
                            {snapshot.performance.averageScorePerActivity.toFixed(1)}
                          </div>
                          <div className="text-sm text-green-600">
                            Pontos: {snapshot.performance.totalPointsEarned}
                          </div>
                        </div>
                        
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <div className="text-sm text-purple-700 mb-1">Dias</div>
                          <div className="text-2xl font-bold text-purple-800">
                            {snapshot.aggregatedData.activitiesByDay ? 
                              Object.values(snapshot.aggregatedData.activitiesByDay).filter(d => d.completed > 0).length : 0}/7
                          </div>
                          <div className="text-sm text-purple-600">
                            Dias com atividades
                          </div>
                        </div>
                      </div>

                      {/* Insights da Semana */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-700">Insights da Semana</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {snapshot.insights.strengths.length > 0 && (
                            <div className="p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <FaArrowTrendUp className="text-green-600" />
                                <span className="font-medium text-green-800">Pontos Fortes</span>
                              </div>
                              <ul className="text-sm text-green-700 space-y-1">
                                {snapshot.insights.strengths.slice(0, 3).map((strength: string, i: number) => (
                                  <li key={i}>• {strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {snapshot.insights.challenges.length > 0 && (
                            <div className="p-3 bg-yellow-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <FaExclamationCircle className="text-yellow-600" />
                                <span className="font-medium text-yellow-800">Desafios</span>
                              </div>
                              <ul className="text-sm text-yellow-700 space-y-1">
                                {snapshot.insights.challenges.slice(0, 3).map((challenge: string, i: number) => (
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
          {activeTab === 'insights' && report.insights && (
            <div className="space-y-6">
              {/* Insights Gerados */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FaLightbulb className="w-6 h-6 text-indigo-600" />
                  <h3 className="font-semibold text-indigo-800">Análise de IA</h3>
                </div>
                
                {report.insights.detectedPatterns && report.insights.detectedPatterns.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-3">Padrões Detectados</h4>
                    <div className="space-y-2">
                      {report.insights.detectedPatterns.map((pattern: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="mt-1 w-2 h-2 bg-indigo-500 rounded-full"></div>
                          <span className="text-gray-700">{pattern}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Previsão Próxima Semana</div>
                    <div className="font-medium text-gray-800">{report.insights.predictedNextWeek || 'Estável'}</div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Confiança da Análise</div>
                    <div className="font-medium text-gray-800">
                      {report.insights.confidence ? `${(report.insights.confidence * 100).toFixed(0)}%` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recomendações */}
              <div className="bg-white border rounded-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Recomendações Personalizadas</h3>
                
                <div className="space-y-4">
                  {report.recommendations && report.recommendations.length > 0 ? (
                    report.recommendations.map((recommendation: string, index: number) => (
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
                        Sem recomendações disponíveis no momento
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