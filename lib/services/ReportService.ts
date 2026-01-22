// lib/services/ReportService.ts
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
  limit,
  orderBy
} from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import {
  PerformanceSnapshot,
  ActivityProgress,
  ScheduleInstance,
  ActivityType
} from '@/types/schedule';
import { ScheduleInstanceService } from './ScheduleInstanceService';
import { ActivityService } from './ActivityService';
import { DateUtils } from '@/lib/utils/dateUtils';
import { AuditService } from '@/lib/auth/AuditService';
import { StudentMetricsService } from './StudentMetricsService';

interface AggregatedData {
  activitiesByDay: Record<number, { completed: number; total: number }>;
  activitiesByType: Record<ActivityType, {
    completed: number;
    averageScore: number;
    averageTime: number;
  }>;
  timeDistribution: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  emotionalScores: number[];
}

export class ReportService {
  private static readonly COLLECTIONS = {
    SNAPSHOTS: 'performanceSnapshots',
    PROGRESS: 'activityProgress'
  };

  /**
   * Gera snapshot de desempenho para uma semana específica
   */
  static async generateWeeklySnapshot(
    instanceId: string,
    weekNumber: number
  ): Promise<string> {
    try {
      console.log(`📊 Gerando snapshot para ${instanceId}, semana ${weekNumber}`);

      // 1. Buscar dados da semana
      const progress = await ScheduleInstanceService.getWeekProgress(instanceId, weekNumber);
      if (progress.length === 0) {
        throw new Error('Nenhuma atividade encontrada para esta semana');
      }

      // 2. Buscar instância para metadados
      const instances = await ScheduleInstanceService.getStudentActiveInstances(
        progress[0].studentId,
        { includeProgress: false, limit: 1 }
      );
      const instance = instances.find(i => i.id === instanceId);
      if (!instance) {
        throw new Error('Instância não encontrada');
      }

      // 3. Agregar dados
      const aggregatedData = await this.aggregateWeeklyData(progress);
      const metrics = this.calculateMetrics(aggregatedData, progress);
      const insights = await this.generateInsights(metrics, aggregatedData);

      // 4. Integrar com dados emocionais (GAD-7) se disponível
      const emotionalAnalysis = await this.getEmotionalAnalysis(
        instance.studentId,
        instance.currentWeekStartDate,
        instance.currentWeekEndDate
      );

      // 5. Criar snapshot
      const snapshotId = `${instanceId}_week${weekNumber}_${Date.now()}`;
      const snapshotData: Omit<PerformanceSnapshot, 'id'> = {
        scheduleInstanceId: instanceId,
        studentId: instance.studentId,
        weekNumber,
        weekStartDate: instance.currentWeekStartDate,
        weekEndDate: instance.currentWeekEndDate,

        engagement: {
          completionRate: metrics.completionRate,
          averageTimePerActivity: metrics.averageTime,
          consistencyScore: metrics.consistencyScore,
          adherenceToSchedule: metrics.adherenceScore,
          emotionalEngagement: emotionalAnalysis?.engagementScore
        },

        performance: {
          totalPointsEarned: metrics.totalPoints,
          averageScorePerActivity: metrics.averageScore,
          bestPerformingDay: metrics.bestDay,
          worstPerformingDay: metrics.worstDay,
          improvementFromPreviousWeek: await this.calculateImprovement(
            instanceId,
            weekNumber
          )
        },

        activityTypeAnalysis: aggregatedData.activitiesByType,

        insights,

        aggregatedData: {
          activitiesByDay: aggregatedData.activitiesByDay,
          timeDistribution: aggregatedData.timeDistribution,
          emotionalTrend: aggregatedData.emotionalScores
        },

        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      // 6. Salvar no Firestore
      await setDoc(doc(firestore, this.COLLECTIONS.SNAPSHOTS, snapshotId), {
        ...snapshotData,
        weekStartDate: Timestamp.fromDate(snapshotData.weekStartDate),
        weekEndDate: Timestamp.fromDate(snapshotData.weekEndDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 7. Log de auditoria
      // COMENTADO
      // await AuditService.logEvent('system', 'PERFORMANCE_SNAPSHOT_GENERATED', {
      //   instanceId,
      //   weekNumber,
      //   snapshotId,
      //   metrics
      // });

      console.log(`✅ Snapshot ${snapshotId} gerado com sucesso`);

      return snapshotId;

    } catch (error: any) {
      console.error(`❌ Erro ao gerar snapshot:`, error);
      throw error;
    }
  }

  /**
   * Gera relatório completo para um aluno
   */
  static async generateStudentReport(
    studentId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      includeDetailedData?: boolean;
    } = {}
  ): Promise<{
    summary: any;
    weeklyTrends: any[];
    insights: any;
    recommendations: string[];
  }> {
    try {
      // 1. Buscar todos os snapshots do aluno
      const snapshots = await this.getStudentSnapshots(studentId, options);

      if (snapshots.length === 0) {
        return {
          summary: { message: 'Nenhum dado disponível para análise' },
          weeklyTrends: [],
          insights: {},
          recommendations: []
        };
      }

      // 2. Calcular tendências semanais
      const weeklyTrends = this.calculateWeeklyTrends(snapshots);

      // 3. Gerar resumo geral
      const summary = this.generateSummary(snapshots, weeklyTrends);

      // 4. Gerar insights baseados em IA (simulação)
      const insights = await this.generateAIInsights(snapshots, weeklyTrends);

      // 5. Gerar recomendações personalizadas
      const recommendations = this.generateRecommendations(summary, insights);

      return {
        summary,
        weeklyTrends,
        insights,
        recommendations
      };

    } catch (error: any) {
      console.error('Erro ao gerar relatório do aluno:', error);
      throw error;
    }
  }

  /**
   * Gera relatório comparativo entre múltiplos alunos
   */
  static async generateComparativeReport(
    studentIds: string[],
    professionalId: string,
    period: 'week' | 'month' | 'quarter'
  ): Promise<{
    comparison: any[];
    groupMetrics: any;
    individualHighlights: Record<string, any>;
  }> {
    try {
      const comparison = [];
      const individualHighlights: Record<string, any> = {};

      // Para cada aluno
      for (const studentId of studentIds) {
        const snapshots = await this.getStudentSnapshots(studentId, {
          period
        });

        if (snapshots.length > 0) {
          const latestSnapshot = snapshots[0];
          const trends = this.calculateWeeklyTrends(snapshots);

          comparison.push({
            studentId,
            completionRate: latestSnapshot.engagement.completionRate,
            averageScore: latestSnapshot.performance.averageScorePerActivity,
            consistency: latestSnapshot.engagement.consistencyScore,
            trend: trends.length > 1 ? trends[trends.length - 1].trendDirection : 'stable'
          });

          // Destaques individuais
          individualHighlights[studentId] = {
            strengths: latestSnapshot.insights.strengths.slice(0, 2),
            challenges: latestSnapshot.insights.challenges.slice(0, 2),
            recommendations: latestSnapshot.insights.recommendations.slice(0, 2)
          };
        }
      }

      // Métricas do grupo
      const groupMetrics = this.calculateGroupMetrics(comparison);

      return {
        comparison: comparison.sort((a, b) => b.completionRate - a.completionRate),
        groupMetrics,
        individualHighlights
      };

    } catch (error: any) {
      console.error('Erro ao gerar relatório comparativo:', error);
      throw error;
    }
  }

  /**
   * Métodos auxiliares privados
   */
  private static async aggregateWeeklyData(
    progress: ActivityProgress[]
  ): Promise<AggregatedData> {
    const activitiesByDay: Record<number, { completed: number; total: number }> = {};
    const activitiesByType: Record<ActivityType, { completed: number; averageScore: number; averageTime: number }> = {} as any;
    const timeDistribution = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    const emotionalScores: number[] = [];

    // Inicializar estruturas
    for (let i = 0; i < 7; i++) {
      activitiesByDay[i] = { completed: 0, total: 0 };
    }

    // Agregar dados
    progress.forEach(item => {
      // Por dia
      activitiesByDay[item.dayOfWeek].total++;
      if (item.status === 'completed') {
        activitiesByDay[item.dayOfWeek].completed++;
      }

      // Por tipo
      const type = item.activitySnapshot.type;
      if (!activitiesByType[type]) {
        activitiesByType[type] = {
          completed: 0,
          averageScore: 0,
          averageTime: 0
        };
      }

      if (item.status === 'completed') {
        const current = activitiesByType[type];
        const newCompleted = current.completed + 1;

        // Média de score
        current.averageScore =
          (current.averageScore * current.completed +
            (item.scoring.pointsEarned || 0)) / newCompleted;

        // Média de tempo
        const timeSpent = item.executionData?.timeSpent || 0;
        current.averageTime =
          (current.averageTime * current.completed + timeSpent) / newCompleted;

        current.completed = newCompleted;
      }

      // Distribuição temporal
      if (item.startedAt) {
        const timeOfDay = DateUtils.getTimeOfDay(item.startedAt);
        timeDistribution[timeOfDay]++;
      }

      // Dados emocionais
      if (item.executionData?.emotionalState?.after) {
        emotionalScores.push(item.executionData.emotionalState.after);
      }
    });

    return {
      activitiesByDay,
      activitiesByType,
      timeDistribution,
      emotionalScores
    };
  }

  private static calculateMetrics(
    aggregatedData: AggregatedData,
    progress: ActivityProgress[]
  ) {
    const completed = progress.filter(p => p.status === 'completed').length;
    const total = progress.length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    // Tempo médio
    const timeSpent = progress
      .filter(p => p.status === 'completed' && p.executionData?.timeSpent)
      .reduce((sum, p) => sum + (p.executionData!.timeSpent || 0), 0);
    const averageTime = completed > 0 ? timeSpent / completed : 0;

    // Pontuação média
    const totalPoints = progress
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.scoring.pointsEarned || 0), 0);
    const averageScore = completed > 0 ? totalPoints / completed : 0;

    // Consistência (dias com atividades completadas)
    const daysWithActivities = Object.values(aggregatedData.activitiesByDay)
      .filter(day => day.completed > 0).length;
    const consistencyScore = (daysWithActivities / 7) * 100;

    // Aderência (completou no dia correto)
    let adherenceScore = 0;
    if (completed > 0) {
      const onTime = progress.filter(p => {
        if (p.status !== 'completed' || !p.completedAt || !p.scheduledDate) return false;
        const scheduledDay = p.scheduledDate.toDateString();
        const completedDay = p.completedAt.toDateString();
        return scheduledDay === completedDay;
      }).length;
      adherenceScore = (onTime / completed) * 100;
    }

    // Melhor/pior dia
    let bestDay = -1;
    let worstDay = -1;
    let bestRate = -1;
    let worstRate = 101;

    Object.entries(aggregatedData.activitiesByDay).forEach(([day, data]) => {
      const rate = data.total > 0 ? (data.completed / data.total) * 100 : 0;
      if (rate > bestRate) {
        bestRate = rate;
        bestDay = parseInt(day);
      }
      if (rate < worstRate && data.total > 0) {
        worstRate = rate;
        worstDay = parseInt(day);
      }
    });

    return {
      completionRate,
      averageTime,
      totalPoints,
      averageScore,
      consistencyScore,
      adherenceScore,
      bestDay,
      worstDay
    };
  }

  private static async generateInsights(metrics: any, aggregatedData: AggregatedData) {
    const strengths: string[] = [];
    const challenges: string[] = [];
    const recommendations: string[] = [];

    // Análise de taxa de conclusão
    if (metrics.completionRate >= 80) {
      strengths.push('Alta taxa de conclusão de atividades');
      recommendations.push('Continue mantendo o excelente engajamento!');
    } else if (metrics.completionRate <= 50) {
      challenges.push('Baixa taxa de conclusão de atividades');
      recommendations.push('Experimente dividir as atividades em partes menores');
    }

    // Análise de consistência
    if (metrics.consistencyScore >= 70) {
      strengths.push('Boa consistência ao longo da semana');
    } else {
      challenges.push('Atividades concentradas em poucos dias da semana');
      recommendations.push('Tente distribuir as atividades ao longo da semana');
    }

    // Análise por tipo de atividade
    Object.entries(aggregatedData.activitiesByType).forEach(([type, data]) => {
      if (data.completed > 0) {
        if (data.averageScore >= 8) {
          strengths.push(`Bom desempenho em atividades do tipo ${type}`);
        } else if (data.averageScore <= 5) {
          challenges.push(`Dificuldade com atividades do tipo ${type}`);
          recommendations.push(`Pratique mais atividades do tipo ${type}`);
        }
      }
    });

    // Análise de horário preferencial
    const { timeDistribution } = aggregatedData;
    const maxTime = Math.max(...Object.values(timeDistribution));
    const preferredTime = Object.entries(timeDistribution)
      .find(([_, count]) => count === maxTime)?.[0];

    if (preferredTime) {
      recommendations.push(`Você tem mais produtividade no período da ${preferredTime}`);
    }

    return { strengths, challenges, recommendations };
  }

  private static async getEmotionalAnalysis(
    studentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    engagementScore?: number;
    moodTrend?: 'improving' | 'stable' | 'declining';
  } | undefined> {
    try {
      // Integração futura com GAD-7
      // Por enquanto, retornar undefined
      return undefined;
    } catch {
      return undefined;
    }
  }

  private static async calculateImprovement(
    instanceId: string,
    currentWeek: number
  ): Promise<number | undefined> {
    if (currentWeek <= 1) return undefined;

    try {
      const previousSnapshot = await this.getWeeklySnapshot(instanceId, currentWeek - 1);
      const currentProgress = await ScheduleInstanceService.getWeekProgress(instanceId, currentWeek);

      if (!previousSnapshot || currentProgress.length === 0) {
        return undefined;
      }

      const previousScore = previousSnapshot.performance.averageScorePerActivity;
      const currentCompleted = currentProgress.filter(p => p.status === 'completed');
      const currentScore = currentCompleted.length > 0
        ? currentCompleted.reduce((sum, p) => sum + (p.scoring.pointsEarned || 0), 0) / currentCompleted.length
        : 0;

      return currentScore - previousScore;
    } catch {
      return undefined;
    }
  }

  private static async getWeeklySnapshot(
    instanceId: string,
    weekNumber: number
  ): Promise<PerformanceSnapshot | null> {
    const q = query(
      collection(firestore, this.COLLECTIONS.SNAPSHOTS),
      where('scheduleInstanceId', '==', instanceId),
      where('weekNumber', '==', weekNumber),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const data = snapshot.docs[0].data();
    return {
      id: snapshot.docs[0].id,
      ...data,
      weekStartDate: data.weekStartDate?.toDate(),
      weekEndDate: data.weekEndDate?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as PerformanceSnapshot;
  }

  static async getProfessionalDashboardMetrics(
    studentIds: string[],
    period: 'week' | 'month' | 'quarter'
  ): Promise<Record<string, {
    completionRate: number;
    averageScore: number;
    streak: number;
    lastActivity: Date;
  }>> {
    const metrics: Record<string, any> = {};

    for (const studentId of studentIds) {
      try {
        // Usar o novo serviço otimizado
        const studentMetrics = await StudentMetricsService.getCurrentWeekMetrics(studentId);
        const snapshots = await this.getStudentSnapshots(studentId, { period });

        metrics[studentId] = {
          completionRate: studentMetrics.completionRate,
          averageScore: snapshots.length > 0
            ? snapshots[0].performance.averageScorePerActivity
            : 0,
          streak: studentMetrics.streak,
          lastActivity: snapshots.length > 0
            ? snapshots[0].weekEndDate
            : new Date()
        };
      } catch (error) {
        console.error(`Erro ao buscar métricas do aluno ${studentId}:`, error);
        metrics[studentId] = {
          completionRate: 0,
          averageScore: 0,
          streak: 0,
          lastActivity: new Date()
        };
      }
    }

    return metrics;
  }

  static async getStudentSnapshots(
    studentId: string,
    options: any
  ): Promise<PerformanceSnapshot[]> {
    let q = query(
      collection(firestore, this.COLLECTIONS.SNAPSHOTS),
      where('studentId', '==', studentId),
      where('isActive', '==', true),
      orderBy('weekStartDate', 'desc')
    );

    if (options.startDate) {
      q = query(q, where('weekStartDate', '>=', options.startDate));
    }

    if (options.endDate) {
      q = query(q, where('weekEndDate', '<=', options.endDate));
    }

    const snapshot = await getDocs(q);
    const snapshots: PerformanceSnapshot[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      snapshots.push({
        id: doc.id,
        ...data,
        weekStartDate: data.weekStartDate?.toDate(),
        weekEndDate: data.weekEndDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as PerformanceSnapshot);
    });

    return snapshots;
  }

  private static calculateWeeklyTrends(snapshots: PerformanceSnapshot[]) {
    return snapshots.map((snapshot, index) => {
      const previous = snapshots[index + 1];
      let trendDirection: 'improving' | 'stable' | 'declining' = 'stable';

      if (previous) {
        const currentScore = snapshot.performance.averageScorePerActivity;
        const previousScore = previous.performance.averageScorePerActivity;

        if (currentScore > previousScore + 0.5) trendDirection = 'improving';
        else if (currentScore < previousScore - 0.5) trendDirection = 'declining';
      }

      return {
        weekNumber: snapshot.weekNumber,
        completionRate: snapshot.engagement.completionRate,
        averageScore: snapshot.performance.averageScorePerActivity,
        trendDirection
      };
    });
  }

  private static generateSummary(snapshots: PerformanceSnapshot[], trends: any[]) {
    if (snapshots.length === 0) return {};

    const latest = snapshots[0];
    const trend = trends[0]?.trendDirection || 'stable';

    return {
      totalWeeks: snapshots.length,
      averageCompletionRate: snapshots.reduce((sum, s) => sum + s.engagement.completionRate, 0) / snapshots.length,
      averageScore: snapshots.reduce((sum, s) => sum + s.performance.averageScorePerActivity, 0) / snapshots.length,
      latestWeek: latest.weekNumber,
      trend,
      bestWeek: snapshots.reduce((best, current) =>
        current.performance.averageScorePerActivity > best.performance.averageScorePerActivity ? current : best
      ).weekNumber
    };
  }

  private static async generateAIInsights(snapshots: PerformanceSnapshot[], trends: any[]) {
    // Simulação de insights baseados em IA
    // Em produção, integraria com OpenAI/Gemini

    const patterns: string[] = [];

    // Detectar padrões
    if (trends.length >= 3) {
      const recentTrend = trends.slice(0, 3);
      const improving = recentTrend.filter(t => t.trendDirection === 'improving').length;
      const declining = recentTrend.filter(t => t.trendDirection === 'declining').length;

      if (improving >= 2) {
        patterns.push('Tendência de melhoria consistente nas últimas semanas');
      } else if (declining >= 2) {
        patterns.push('Possível fadiga ou diminuição de engajamento');
      }
    }

    // Análise de consistência
    const consistencyScores = snapshots.map(s => s.engagement.consistencyScore);
    const avgConsistency = consistencyScores.reduce((a, b) => a + b, 0) / consistencyScores.length;

    if (avgConsistency < 50) {
      patterns.push('Baixa consistência semanal - atividades concentradas em poucos dias');
    }

    return {
      detectedPatterns: patterns,
      predictedNextWeek: 'Estável',
      confidence: 0.75
    };
  }

  private static generateRecommendations(summary: any, insights: any): string[] {
    const recommendations: string[] = [];

    if (summary.trend === 'declining') {
      recommendations.push('Considere reduzir a carga de atividades por alguns dias');
      recommendations.push('Revise as atividades mais desafiadoras com seu profissional');
    }

    if (summary.averageCompletionRate < 70) {
      recommendations.push('Experimente definir horários fixos para as atividades');
      recommendations.push('Comunique ao seu profissional se alguma atividade for muito difícil');
    }

    if (insights.detectedPatterns?.includes('Baixa consistência semanal')) {
      recommendations.push('Tente distribuir as atividades igualmente ao longo da semana');
      recommendations.push('Use lembretes para dias com menos atividades');
    }

    return recommendations.slice(0, 3); // Limitar a 3 recomendações
  }

  private static calculateGroupMetrics(comparison: any[]) {
    if (comparison.length === 0) return {};

    const avgCompletion = comparison.reduce((sum, s) => sum + s.completionRate, 0) / comparison.length;
    const avgScore = comparison.reduce((sum, s) => sum + s.averageScore, 0) / comparison.length;
    const avgConsistency = comparison.reduce((sum, s) => sum + s.consistency, 0) / comparison.length;

    return {
      averageCompletionRate: avgCompletion,
      averageScore: avgScore,
      averageConsistency: avgConsistency,
      totalStudents: comparison.length,
      topPerformer: comparison.reduce((best, current) =>
        current.completionRate > best.completionRate ? current : best
      ).studentId
    };
  }
}