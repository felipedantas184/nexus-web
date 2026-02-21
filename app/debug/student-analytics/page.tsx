// pages/debug/student-analytics.tsx
'use client'

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  getDocs,
  where,
  orderBy,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { format, subWeeks, startOfWeek, endOfWeek, differenceInWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos baseados na estrutura existente
interface StudentSnapshot {
  id: string;
  studentId: string;
  studentName?: string;
  weekNumber: number;
  weekStartDate: Date;
  weekEndDate: Date;
  metrics: {
    totalActivities: number;
    completedActivities: number;
    skippedActivities: number;
    completionRate: number;
    totalPointsEarned: number;
    averagePointsPerActivity: number;
    totalTimeSpent: number;
    averageTimePerActivity: number;
    consistencyScore: number;
    adherenceScore: number;
    streakAtEndOfWeek: number;
  };
  dailyBreakdown: Record<number, {
    total: number;
    completed: number;
    skipped: number;
    pointsEarned: number;
    timeSpent: number;
  }>;
  activityTypeBreakdown: Record<string, {
    total: number;
    completed: number;
    averagePoints: number;
    averageTime: number;
  }>;
  metadata: {
    scheduleTemplateName: string;
    scheduleTemplateId: string;
    professionalId: string;
  };
}

interface StudentSummary {
  studentId: string;
  studentName: string;
  totalSnapshots: number;
  firstSnapshotDate?: Date;
  lastSnapshotDate?: Date;
  overall: {
    avgCompletionRate: number;
    avgConsistencyScore: number;
    avgAdherenceScore: number;
    totalPoints: number;
    totalTimeSpent: number;
    bestWeek: number;
    worstWeek: number;
    currentStreak: number;
    maxStreak: number;
  };
  trends: {
    completionTrend: 'up' | 'down' | 'stable';
    consistencyTrend: 'up' | 'down' | 'stable';
    pointsTrend: 'up' | 'down' | 'stable';
  };
  recentWeeks: StudentSnapshot[];
}

interface FilterOptions {
  startDate?: Date;
  endDate?: Date;
  studentId?: string;
  professionalId?: string;
  minCompletionRate?: number;
}

export default function StudentAnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<StudentSnapshot[]>([]);
  const [studentSummaries, setStudentSummaries] = useState<StudentSummary[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [dateRange, setDateRange] = useState<'4weeks' | '8weeks' | '12weeks' | 'all'>('8weeks');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSnapshots();
  }, [user, dateRange]);

  const loadSnapshots = async () => {
    try {
      setLoading(true);

      // Calcular range de datas
      let startDate: Date | undefined;
      const now = new Date();

      switch (dateRange) {
        case '4weeks':
          startDate = subWeeks(now, 4);
          break;
        case '8weeks':
          startDate = subWeeks(now, 8);
          break;
        case '12weeks':
          startDate = subWeeks(now, 12);
          break;
        case 'all':
          startDate = undefined;
          break;
      }

      // Buscar todos os snapshots
      let snapshotsQuery;
      if (startDate) {
        snapshotsQuery = query(
          collection(firestore, 'weeklySnapshots'),
          where('weekStartDate', '>=', Timestamp.fromDate(startDate)),
          orderBy('weekStartDate', 'desc')
        );
      } else {
        snapshotsQuery = query(
          collection(firestore, 'weeklySnapshots'),
          orderBy('weekStartDate', 'desc')
        );
      }

      const snapshotsSnapshot = await getDocs(snapshotsQuery);

      const snapshotsData: StudentSnapshot[] = [];
      const studentIds = new Set<string>();

      // Processar snapshots
      for (const docSnap of snapshotsSnapshot.docs) {
        const data = docSnap.data();

        let studentName = '';
        if (data.studentId) {
          studentIds.add(data.studentId);

          // Agora o Firebase 'doc' funciona corretamente porque não há conflito de nome
          const studentRef = doc(firestore, 'students', data.studentId);
          const studentDoc = await getDoc(studentRef);

          if (studentDoc.exists()) {
            // Use 'as any' ou uma interface se o data() vier sem tipo
            studentName = (studentDoc.data() as any).name || 'Nome não encontrado';
          }
        }

        snapshotsData.push({
          id: docSnap.id, // Referência correta à variável do loop
          studentId: data.studentId,
          studentName,
          weekNumber: data.weekNumber,
          weekStartDate: data.weekStartDate?.toDate(),
          weekEndDate: data.weekEndDate?.toDate(),
          metrics: data.metrics || {},
          dailyBreakdown: data.dailyBreakdown || {},
          activityTypeBreakdown: data.activityTypeBreakdown || {},
          metadata: data.metadata || {}
        });
      }

      setSnapshots(snapshotsData);
      const summaries = generateStudentSummaries(snapshotsData);
      setStudentSummaries(summaries);

    } catch (error: unknown) {
      // 2. Tratando o erro de tipo 'unknown'
      if (error instanceof Error) {
        console.error('Erro ao carregar snapshots:', error.message);
      } else {
        console.error('Erro desconhecido:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateStudentSummaries = (snapshotsData: StudentSnapshot[]): StudentSummary[] => {
    const studentMap = new Map<string, StudentSnapshot[]>();

    // Agrupar snapshots por aluno
    snapshotsData.forEach(snapshot => {
      if (!studentMap.has(snapshot.studentId)) {
        studentMap.set(snapshot.studentId, []);
      }
      studentMap.get(snapshot.studentId)!.push(snapshot);
    });

    const summaries: StudentSummary[] = [];

    studentMap.forEach((studentSnapshots, studentId) => {
      // Ordenar por data (mais recente primeiro)
      studentSnapshots.sort((a, b) => b.weekStartDate.getTime() - a.weekStartDate.getTime());

      // Calcular métricas agregadas
      const totalSnapshots = studentSnapshots.length;
      const firstSnapshot = studentSnapshots[totalSnapshots - 1];
      const lastSnapshot = studentSnapshots[0];

      // Calcular médias
      const avgCompletionRate = studentSnapshots.reduce((acc, s) => acc + (s.metrics.completionRate || 0), 0) / totalSnapshots;
      const avgConsistencyScore = studentSnapshots.reduce((acc, s) => acc + (s.metrics.consistencyScore || 0), 0) / totalSnapshots;
      const avgAdherenceScore = studentSnapshots.reduce((acc, s) => acc + (s.metrics.adherenceScore || 0), 0) / totalSnapshots;

      const totalPoints = studentSnapshots.reduce((acc, s) => acc + (s.metrics.totalPointsEarned || 0), 0);
      const totalTimeSpent = studentSnapshots.reduce((acc, s) => acc + (s.metrics.totalTimeSpent || 0), 0);

      // Melhor e pior semana
      const bestWeek = Math.max(...studentSnapshots.map(s => s.metrics.completionRate || 0));
      const worstWeek = Math.min(...studentSnapshots.map(s => s.metrics.completionRate || 0));

      // Maior streak
      const maxStreak = Math.max(...studentSnapshots.map(s => s.metrics.streakAtEndOfWeek || 0));

      // Calcular tendências (comparar últimas 3 semanas com anteriores)
      const recentWeeks = studentSnapshots.slice(0, 3);
      const previousWeeks = studentSnapshots.slice(3, 6);

      const recentAvgCompletion = recentWeeks.reduce((acc, s) => acc + (s.metrics.completionRate || 0), 0) / recentWeeks.length;
      const previousAvgCompletion = previousWeeks.length > 0
        ? previousWeeks.reduce((acc, s) => acc + (s.metrics.completionRate || 0), 0) / previousWeeks.length
        : recentAvgCompletion;

      const recentAvgConsistency = recentWeeks.reduce((acc, s) => acc + (s.metrics.consistencyScore || 0), 0) / recentWeeks.length;
      const previousAvgConsistency = previousWeeks.length > 0
        ? previousWeeks.reduce((acc, s) => acc + (s.metrics.consistencyScore || 0), 0) / previousWeeks.length
        : recentAvgConsistency;

      const recentAvgPoints = recentWeeks.reduce((acc, s) => acc + (s.metrics.totalPointsEarned || 0), 0) / recentWeeks.length;
      const previousAvgPoints = previousWeeks.length > 0
        ? previousWeeks.reduce((acc, s) => acc + (s.metrics.totalPointsEarned || 0), 0) / previousWeeks.length
        : recentAvgPoints;

      summaries.push({
        studentId,
        studentName: studentSnapshots[0]?.studentName || 'Nome não encontrado',
        totalSnapshots,
        firstSnapshotDate: firstSnapshot?.weekStartDate,
        lastSnapshotDate: lastSnapshot?.weekStartDate,
        overall: {
          avgCompletionRate,
          avgConsistencyScore,
          avgAdherenceScore,
          totalPoints,
          totalTimeSpent,
          bestWeek,
          worstWeek,
          currentStreak: lastSnapshot?.metrics.streakAtEndOfWeek || 0,
          maxStreak
        },
        trends: {
          completionTrend: recentAvgCompletion > previousAvgCompletion + 5 ? 'up'
            : recentAvgCompletion < previousAvgCompletion - 5 ? 'down'
              : 'stable',
          consistencyTrend: recentAvgConsistency > previousAvgConsistency + 5 ? 'up'
            : recentAvgConsistency < previousAvgConsistency - 5 ? 'down'
              : 'stable',
          pointsTrend: recentAvgPoints > previousAvgPoints + 10 ? 'up'
            : recentAvgPoints < previousAvgPoints - 10 ? 'down'
              : 'stable'
        },
        recentWeeks: studentSnapshots.slice(0, 4) // Últimas 4 semanas
      });
    });

    // Ordenar por nome do aluno
    return summaries.sort((a, b) => a.studentName.localeCompare(b.studentName));
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-gray-600';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const filteredStudents = studentSummaries.filter(student => {
    if (searchTerm) {
      return student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-lg text-gray-700">Carregando analytics dos alunos...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              📊 Analytics de Alunos
            </h1>
            <div className="space-x-2">
              <button
                onClick={() => router.push('/debug/schedules')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                ← Templates
              </button>
              <button
                onClick={() => router.push('/debug/instances-cleaner')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                ← Instâncias
              </button>
            </div>
          </div>

          {/* Filtros Rápidos */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar aluno por nome ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="4weeks">Últimas 4 semanas</option>
                <option value="8weeks">Últimas 8 semanas</option>
                <option value="12weeks">Últimas 12 semanas</option>
                <option value="all">Todo período</option>
              </select>
              <button
                onClick={loadSnapshots}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                🔄 Aplicar Filtros
              </button>
            </div>
          </div>

          {/* Cards de Resumo Global */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-4">
              <div className="text-sm text-blue-600">Total de Alunos</div>
              <div className="text-3xl font-bold text-blue-800">{filteredStudents.length}</div>
              <div className="text-xs text-blue-600 mt-1">com snapshots</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-4">
              <div className="text-sm text-green-600">Média de Conclusão</div>
              <div className="text-3xl font-bold text-green-800">
                {Math.round(filteredStudents.reduce((acc, s) => acc + s.overall.avgCompletionRate, 0) / filteredStudents.length || 0)}%
              </div>
              <div className="text-xs text-green-600 mt-1">geral</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-4">
              <div className="text-sm text-purple-600">Total de Pontos</div>
              <div className="text-3xl font-bold text-purple-800">
                {filteredStudents.reduce((acc, s) => acc + s.overall.totalPoints, 0).toLocaleString()}
              </div>
              <div className="text-xs text-purple-600 mt-1">acumulados</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow p-4">
              <div className="text-sm text-orange-600">Streak Máximo</div>
              <div className="text-3xl font-bold text-orange-800">
                {Math.max(...filteredStudents.map(s => s.overall.maxStreak))}
              </div>
              <div className="text-xs text-orange-600 mt-1">dias consecutivos</div>
            </div>
          </div>
        </div>

        {/* Lista de Alunos */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Desempenho dos Alunos ({filteredStudents.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nenhum aluno encontrado com snapshots no período selecionado
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div key={student.studentId} className="p-6 hover:bg-gray-50">
                  {/* Header do Aluno */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {student.studentName}
                      </h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          ID: {student.studentId.slice(0, 12)}...
                        </code>
                        <span className="text-xs text-gray-500">
                          {student.totalSnapshots} semanas de dados
                        </span>
                        <span className="text-xs text-gray-500">
                          Último snapshot: {student.lastSnapshotDate ? format(student.lastSnapshotDate, 'dd/MM/yyyy') : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Tendências */}
                    <div className="flex space-x-3">
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Conclusão</div>
                        <div className={`text-lg ${getTrendColor(student.trends.completionTrend)}`}>
                          {getTrendIcon(student.trends.completionTrend)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Consistência</div>
                        <div className={`text-lg ${getTrendColor(student.trends.consistencyTrend)}`}>
                          {getTrendIcon(student.trends.consistencyTrend)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Pontos</div>
                        <div className={`text-lg ${getTrendColor(student.trends.pointsTrend)}`}>
                          {getTrendIcon(student.trends.pointsTrend)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cards de Métricas */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500">Taxa de Conclusão</div>
                      <div className={`text-lg font-bold ${getScoreColor(student.overall.avgCompletionRate)} px-2 py-1 rounded inline-block`}>
                        {Math.round(student.overall.avgCompletionRate)}%
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500">Consistência</div>
                      <div className={`text-lg font-bold ${getScoreColor(student.overall.avgConsistencyScore)} px-2 py-1 rounded inline-block`}>
                        {Math.round(student.overall.avgConsistencyScore)}%
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500">Adesão</div>
                      <div className={`text-lg font-bold ${getScoreColor(student.overall.avgAdherenceScore)} px-2 py-1 rounded inline-block`}>
                        {Math.round(student.overall.avgAdherenceScore)}%
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500">Pontos Totais</div>
                      <div className="text-lg font-bold text-purple-700">
                        {student.overall.totalPoints}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500">Streak Atual</div>
                      <div className="text-lg font-bold text-orange-700">
                        {student.overall.currentStreak} dias
                      </div>
                      <div className="text-xs text-gray-400">
                        Max: {student.overall.maxStreak}
                      </div>
                    </div>
                  </div>

                  {/* Timeline das Últimas Semanas */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Últimas semanas
                    </h4>
                    <div className="flex space-x-2">
                      {student.recentWeeks.map((week, index) => (
                        <div
                          key={index}
                          className="flex-1 bg-gray-50 rounded-lg p-2 hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => {
                            console.log('Detalhes da semana:', week);
                            alert(`Semana ${week.weekNumber}\n` +
                              `Período: ${format(week.weekStartDate, 'dd/MM')} - ${format(week.weekEndDate, 'dd/MM')}\n` +
                              `Conclusão: ${week.metrics.completionRate}%\n` +
                              `Atividades: ${week.metrics.completedActivities}/${week.metrics.totalActivities}\n` +
                              `Pontos: ${week.metrics.totalPointsEarned}\n` +
                              `Streak: ${week.metrics.streakAtEndOfWeek} dias`);
                          }}
                        >
                          <div className="text-xs text-gray-500">
                            Semana {week.weekNumber}
                          </div>
                          <div className="text-xs text-gray-400 mb-1">
                            {format(week.weekStartDate, 'dd/MM')}
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${week.metrics.completionRate || 0}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-green-600">
                              {week.metrics.completedActivities || 0}/{week.metrics.totalActivities || 0}
                            </span>
                            <span className="text-purple-600">
                              {week.metrics.totalPointsEarned || 0}pts
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Melhor e Pior Semana */}
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-lg p-2">
                      <div className="text-xs text-green-600">Melhor semana</div>
                      <div className="text-sm font-medium text-green-800">
                        {Math.round(student.overall.bestWeek)}% de conclusão
                      </div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2">
                      <div className="text-xs text-red-600">Pior semana</div>
                      <div className="text-sm font-medium text-red-800">
                        {Math.round(student.overall.worstWeek)}% de conclusão
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rodapé com estatísticas */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium">📊 Total de snapshots analisados:</span>{' '}
              {snapshots.length}
            </div>
            <div>
              <span className="font-medium">📅 Período:</span>{' '}
              {dateRange === 'all' ? 'Todo histórico' : `Últimas ${dateRange.replace('weeks', '')} semanas`}
            </div>
            <div>
              <span className="font-medium">🔄 Última atualização:</span>{' '}
              {format(new Date(), 'dd/MM/yyyy HH:mm')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}