import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit,
  getDoc,
  doc
} from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import {
  ActivityProgress,
  ActivityType,
  WeeklyReportData,
  StudentReport,
  ComparativeReport
} from '@/types/schedule';
import { DateUtils } from '@/lib/utils/dateUtils';

export class SimpleReportService {
  private static readonly COLLECTIONS = {
    PROGRESS: 'activityProgress',
    STUDENTS: 'students',
    INSTANCES: 'scheduleInstances'
  };

  /**
   * Cache em memória para requests consecutivos
   */
  private static cache = new Map<string, {
    data: StudentReport;
    timestamp: number;
  }>();

  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Gera relatório completo com otimizações
   */
  static async generateStudentReport(studentId: string): Promise<StudentReport> {
    try {
      // 1. Verificar cache válido
      const cacheKey = `student_${studentId}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log(`📊 [CACHE] Retornando relatório em cache para ${studentId}`);
        return {
          ...cached.data,
          dataFreshness: 'cached',
          calculationMethod: 'cached'
        };
      }

      console.log(`📊 Gerando relatório para aluno: ${studentId}`);

      // 2. Executar em paralelo: aluno + atividades
      const [studentData, allActivities] = await Promise.all([
        this.getStudentData(studentId),
        this.getStudentActivitiesOptimized(studentId)
      ]);

      // 3. Calcular métricas gerais (sincronizadas com aluno)
      const overallMetrics = await this.calculateOverallMetrics(studentId, allActivities);

      // 4. Agrupar atividades por semana REAL (baseado em scheduledDate)
      const weeklyGroups = this.groupActivitiesByActualWeek(allActivities);

      // 5. Gerar relatórios semanais em paralelo (limitado a 8 semanas)
      const weekPromises = Object.entries(weeklyGroups)
        .slice(0, 8)
        .map(([weekKey, activities]) =>
          this.generateWeeklyReport(weekKey, activities)
        );

      const weekResults = await Promise.all(weekPromises);
      
      // Filtrar resultados nulos e garantir o tipo
      const weeklyReports: WeeklyReportData[] = weekResults
        .filter((report): report is WeeklyReportData => report !== null)
        .sort((a, b) => b.weekNumber - a.weekNumber);

      // 6. Determinar tendência baseada em dados
      const trend = this.determineTrendFromData(weeklyReports);

      // 7. Montar relatório final
      const report: StudentReport = {
        studentId,
        studentName: studentData.name,
        school: studentData.school || 'Não informada',
        grade: studentData.grade || 'Não informada',
        overall: overallMetrics,
        weeklyReports,
        trend: trend.direction,
        trendConfidence: trend.confidence,
        generatedAt: new Date(),
        dataFreshness: 'realtime',
        calculationMethod: 'full'
      };

      // 8. Atualizar cache
      this.cache.set(cacheKey, {
        data: report,
        timestamp: Date.now()
      });

      return report;

    } catch (error: any) {
      console.error('❌ Erro ao gerar relatório:', error);

      // Retornar relatório de fallback
      return this.generateFallbackReport(studentId, error);
    }
  }

  /**
   * Gera relatório comparativo otimizado
   */
  static async generateComparativeReport(
    studentIds: string[],
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<ComparativeReport> {
    try {
      console.log(`📊 Gerando relatório comparativo para ${studentIds.length} alunos`);

      const startDate = this.getPeriodStartDate(period);
      const now = new Date();

      // 1. Buscar dados básicos de todos alunos em paralelo
      const studentPromises = studentIds.map(id => this.getStudentData(id));
      const studentsData = await Promise.all(studentPromises);

      // 2. Gerar relatórios individuais em PARALELO
      const reportPromises = studentIds.map(id => this.generateStudentReport(id));
      const reports = await Promise.allSettled(reportPromises);

      // 3. Processar resultados
      interface StudentReportItem {
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

      const studentReports: StudentReportItem[] = [];
      let totalCompletion = 0;
      let totalScore = 0;
      let totalConsistency = 0;
      let totalStreak = 0;
      let validReports = 0;

      reports.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.weeklyReports.length > 0) {
          const report = result.value;
          const studentData = studentsData[index];
          const latestWeek = report.weeklyReports[0];

          studentReports.push({
            studentId: studentIds[index],
            studentName: studentData.name,
            school: studentData.school || '',
            grade: studentData.grade || '',
            completionRate: latestWeek.summary.completionRate,
            averageScore: latestWeek.summary.averageScore,
            consistency: latestWeek.summary.consistencyScore,
            totalPoints: report.overall.totalPoints,
            streak: report.overall.streak,
            trend: report.trend,
            lastActivity: report.overall.lastActivityDate
          });

          totalCompletion += latestWeek.summary.completionRate;
          totalScore += latestWeek.summary.averageScore;
          totalConsistency += latestWeek.summary.consistencyScore;
          totalStreak += report.overall.streak;
          validReports++;
        }
      });

      // 4. Calcular médias
      const groupAverages = validReports > 0 ? {
        averageCompletionRate: totalCompletion / validReports,
        averageScore: totalScore / validReports,
        averageConsistency: totalConsistency / validReports,
        averageStreak: totalStreak / validReports
      } : {
        averageCompletionRate: 0,
        averageScore: 0,
        averageConsistency: 0,
        averageStreak: 0
      };

      // 5. Ordenar por métrica principal
      studentReports.sort((a, b) => b.completionRate - a.completionRate);

      return {
        period,
        startDate,
        endDate: now,
        students: studentReports,
        groupAverages,
        generatedAt: now,
        studentCount: validReports
      };

    } catch (error: any) {
      console.error('❌ Erro no relatório comparativo:', error);
      throw error;
    }
  }

  /**
   * Métodos auxiliares OTIMIZADOS
   */
  private static async getStudentData(studentId: string): Promise<{
    name: string;
    school: string;
    grade: string;
    totalPoints: number;
    level: number;
    streak: number;
  }> {
    try {
      const studentRef = doc(firestore, this.COLLECTIONS.STUDENTS, studentId);
      const studentDoc = await getDoc(studentRef);

      if (!studentDoc.exists()) {
        throw new Error('Aluno não encontrado');
      }

      const data = studentDoc.data();
      return {
        name: data.name || 'Aluno',
        school: data.profile?.school || '',
        grade: data.profile?.grade || '',
        totalPoints: data.profile?.totalPoints || 0,
        level: data.profile?.level || 1,
        streak: data.profile?.streak || 0
      };
    } catch (error) {
      console.warn('⚠️ Erro ao buscar aluno, usando fallback:', error);
      return {
        name: 'Aluno',
        school: 'Não informada',
        grade: 'Não informada',
        totalPoints: 0,
        level: 1,
        streak: 0
      };
    }
  }

  private static async getStudentActivitiesOptimized(studentId: string): Promise<ActivityProgress[]> {
    try {
      // Buscar apenas últimas 8 semanas (56 dias)
      const eightWeeksAgo = new Date();
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

      const q = query(
        collection(firestore, this.COLLECTIONS.PROGRESS),
        where('studentId', '==', studentId),
        where('isActive', '==', true),
        where('scheduledDate', '>=', Timestamp.fromDate(eightWeeksAgo)),
        orderBy('scheduledDate', 'desc'),
        limit(200) // Limite razoável para MVP
      );

      const snapshot = await getDocs(q);
      const activities: ActivityProgress[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        // Converter timestamps apenas se existirem
        activities.push({
          id: doc.id,
          ...data,
          scheduledDate: data.scheduledDate?.toDate(),
          startedAt: data.startedAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
          activitySnapshot: data.activitySnapshot || {}
        } as ActivityProgress);
      });

      console.log(`📥 Encontradas ${activities.length} atividades para ${studentId}`);
      return activities;

    } catch (error) {
      console.error('❌ Erro ao buscar atividades:', error);
      return [];
    }
  }

  private static groupActivitiesByActualWeek(activities: ActivityProgress[]): Record<string, ActivityProgress[]> {
    const weeks: Record<string, ActivityProgress[]> = {};

    activities.forEach(activity => {
      if (!activity.scheduledDate) return;

      // Usar a semana real da atividade (baseado na data agendada)
      const weekStart = DateUtils.getWeekStartDate(activity.scheduledDate);
      const weekEnd = DateUtils.getWeekEndDate(activity.scheduledDate);
      const weekKey = `${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`;

      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(activity);
    });

    return weeks;
  }

  private static async generateWeeklyReport(
    weekKey: string,
    activities: ActivityProgress[]
  ): Promise<WeeklyReportData | null> {
    if (activities.length === 0) return null;

    // Extrair datas da chave
    const [startStr, endStr] = weekKey.split('_');
    const weekStartDate = new Date(startStr);
    const weekEndDate = new Date(endStr);

    // Calcular número da semana
    const weekNumber = DateUtils.getWeekNumber(weekStartDate);

    // Métricas
    const completedActivities = activities.filter(a => a.status === 'completed');
    const skippedActivities = activities.filter(a => a.status === 'skipped');
    const totalActivities = activities.length;

    const completionRate = totalActivities > 0
      ? (completedActivities.length / totalActivities) * 100
      : 0;

    // Pontuação (apenas de atividades completadas)
    const totalPoints = completedActivities.reduce((sum, a) =>
      sum + (a.scoring?.pointsEarned || 0), 0);
    const averageScore = completedActivities.length > 0
      ? totalPoints / completedActivities.length
      : 0;

    // Tempo (usar executionData.timeSpent se disponível)
    const totalTime = completedActivities.reduce((sum, a) => {
      const timeSpent = a.executionData?.timeSpent;
      return sum + (typeof timeSpent === 'number' ? timeSpent : 0);
    }, 0);
    const averageTime = completedActivities.length > 0
      ? totalTime / completedActivities.length
      : 0;

    // Consistência (dias únicos com atividades completadas)
    const uniqueDays = new Set(
      completedActivities.map(a => a.dayOfWeek)
    ).size;
    const consistencyScore = Math.min(100, (uniqueDays / 7) * 100);

    // Aderência (atividades completadas no dia correto)
    let adherenceScore = 0;
    if (completedActivities.length > 0) {
      const onTime = completedActivities.filter(a => {
        if (!a.completedAt || !a.scheduledDate) return false;
        return DateUtils.isSameDay(a.completedAt, a.scheduledDate);
      }).length;
      adherenceScore = (onTime / completedActivities.length) * 100;
    }

    // Breakdown por dia
    const dayBreakdown: Record<number, {
      total: number;
      completed: number;
      skipped: number;
      averageScore: number;
      averageTime: number;
    }> = {};
    
    for (let i = 0; i < 7; i++) {
      const dayActivities = activities.filter(a => a.dayOfWeek === i);
      const dayCompleted = dayActivities.filter(a => a.status === 'completed');
      const daySkipped = dayActivities.filter(a => a.status === 'skipped');

      const dayTime = dayCompleted.reduce((sum, a) =>
        sum + (a.executionData?.timeSpent || 0), 0);

      dayBreakdown[i] = {
        total: dayActivities.length,
        completed: dayCompleted.length,
        skipped: daySkipped.length,
        averageScore: dayCompleted.length > 0
          ? dayCompleted.reduce((sum, a) => sum + (a.scoring?.pointsEarned || 0), 0) / dayCompleted.length
          : 0,
        averageTime: dayCompleted.length > 0 ? dayTime / dayCompleted.length : 0
      };
    }

    // Breakdown por tipo
    const activityTypeBreakdown: Record<ActivityType, {
      total: number;
      completed: number;
      averageScore: number;
      averageTime: number;
    }> = {} as any;
    
    activities.forEach(activity => {
      const type = activity.activitySnapshot?.type || 'unknown';
      if (!activityTypeBreakdown[type]) {
        activityTypeBreakdown[type] = { total: 0, completed: 0, averageScore: 0, averageTime: 0 };
      }

      const breakdown = activityTypeBreakdown[type];
      breakdown.total++;

      if (activity.status === 'completed') {
        breakdown.completed++;
        breakdown.averageScore += activity.scoring?.pointsEarned || 0;
        breakdown.averageTime += activity.executionData?.timeSpent || 0;
      }
    });

    // Calcular médias finais
    Object.values(activityTypeBreakdown).forEach(data => {
      if (data.completed > 0) {
        data.averageScore = data.averageScore / data.completed;
        data.averageTime = data.averageTime / data.completed;
      }
    });

    // Insights baseados em dados reais
    const insights = this.generateDataDrivenInsights(
      completionRate,
      consistencyScore,
      averageScore,
      adherenceScore,
      dayBreakdown,
      activityTypeBreakdown
    );

    return {
      weekNumber,
      weekStartDate,
      weekEndDate,
      summary: {
        totalActivities,
        completedActivities: completedActivities.length,
        skippedActivities: skippedActivities.length,
        completionRate,
        totalPoints,
        averageScore,
        consistencyScore,
        averageTimePerActivity: averageTime,
        adherenceScore
      },
      dayBreakdown,
      activityTypeBreakdown,
      insights: {
        ...insights,
        generatedAt: new Date(),
        dataSource: 'calculated'
      }
    };
  }

  private static generateDataDrivenInsights(
    completionRate: number,
    consistencyScore: number,
    averageScore: number,
    adherenceScore: number,
    dayBreakdown: Record<number, {
      total: number;
      completed: number;
      skipped: number;
      averageScore: number;
      averageTime: number;
    }>,
    activityTypeBreakdown: Record<ActivityType, {
      total: number;
      completed: number;
      averageScore: number;
      averageTime: number;
    }>
  ) {
    const strengths: string[] = [];
    const challenges: string[] = [];
    const recommendations: string[] = [];

    // Baseado em thresholds realistas
    if (completionRate >= 80) {
      strengths.push('Excelente engajamento nas atividades');
    } else if (completionRate <= 40) {
      challenges.push('Baixa taxa de conclusão');
      recommendations.push('Considere ajustar a dificuldade das atividades');
    }

    if (consistencyScore >= 70) {
      strengths.push('Rotina bem estabelecida');
    } else if (consistencyScore <= 30) {
      challenges.push('Pouca consistência semanal');
      recommendations.push('Estabelecer horários fixos pode ajudar');
    }

    if (averageScore >= 8) {
      strengths.push('Bom desempenho nas avaliações');
    } else if (averageScore <= 5) {
      challenges.push('Dificuldade com o conteúdo');
      recommendations.push('Revisar conceitos fundamentais');
    }

    if (adherenceScore >= 80) {
      strengths.push('Cumprimento dos prazos');
    }

    // Análise por dia da semana
    Object.entries(dayBreakdown).forEach(([day, data]) => {
      if (data.total > 2) { // Apenas dias com atividades significativas
        const dayRate = data.completed / data.total * 100;
        const dayNames = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];

        if (dayRate >= 90) {
          strengths.push(`Alta produtividade nas ${dayNames[parseInt(day)]}-feiras`);
        } else if (dayRate <= 20) {
          challenges.push(`Dificuldade nas ${dayNames[parseInt(day)]}-feiras`);
        }
      }
    });

    // Análise por tipo de atividade
    Object.entries(activityTypeBreakdown).forEach(([type, data]) => {
      if (data.total >= 3 && data.completed > 0) {
        if (data.averageScore >= 8) {
          strengths.push(`Bom desempenho em atividades do tipo ${type}`);
        } else if (data.averageScore <= 5) {
          challenges.push(`Dificuldade com atividades do tipo ${type}`);
          recommendations.push(`Praticar mais atividades do tipo ${type}`);
        }
      }
    });

    return {
      strengths: strengths.slice(0, 3),
      challenges: challenges.slice(0, 2),
      recommendations: recommendations.slice(0, 3)
    };
  }

  private static async calculateOverallMetrics(
    studentId: string,
    activities: ActivityProgress[]
  ): Promise<{
    totalPoints: number;
    currentLevel: number;
    streak: number;
    totalActivitiesCompleted: number;
    averageCompletionRate: number;
    totalTimeSpent: number;
    lastActivityDate?: Date;
  }> {
    const studentData = await this.getStudentData(studentId);
    const completedActivities = activities.filter(a => a.status === 'completed');

    // Tempo total (em minutos)
    const totalTimeSpent = completedActivities.reduce((sum, a) =>
      sum + (a.executionData?.timeSpent || 0), 0);

    // Última atividade (corrigido)
    let lastActivityDate: Date | undefined = undefined;
    if (completedActivities.length > 0) {
      completedActivities.forEach(a => {
        if (a.completedAt && (!lastActivityDate || a.completedAt > lastActivityDate)) {
          lastActivityDate = a.completedAt;
        }
      });
    }

    // Taxa média de conclusão (últimas 4 semanas)
    const weeklyGroups = this.groupActivitiesByActualWeek(activities);
    const recentWeeks = Object.values(weeklyGroups).slice(0, 4);
    const avgCompletionRate = recentWeeks.length > 0
      ? recentWeeks.reduce((sum, week) => {
          const completed = week.filter(a => a.status === 'completed').length;
          return sum + (week.length > 0 ? (completed / week.length) * 100 : 0);
        }, 0) / recentWeeks.length
      : 0;

    return {
      totalPoints: studentData.totalPoints, // Sincronizado com perfil
      currentLevel: studentData.level, // Sincronizado com perfil
      streak: studentData.streak, // Sincronizado com perfil
      totalActivitiesCompleted: completedActivities.length,
      averageCompletionRate: avgCompletionRate,
      totalTimeSpent,
      lastActivityDate
    };
  }

  private static determineTrendFromData(weeklyReports: WeeklyReportData[]): {
    direction: 'improving' | 'stable' | 'declining';
    confidence: 'high' | 'medium' | 'low';
  } {
    if (weeklyReports.length < 2) {
      return { direction: 'stable', confidence: 'low' };
    }

    const recentWeeks = weeklyReports.slice(0, 3); // Últimas 3 semanas
    const scores = recentWeeks.map(w => w.summary.averageScore).filter(s => s > 0);

    if (scores.length < 2) {
      return { direction: 'stable', confidence: 'low' };
    }

    // Calcular tendência linear simples
    const improvements: number[] = [];
    for (let i = 1; i < scores.length; i++) {
      improvements.push(scores[i] - scores[i - 1]);
    }

    const avgImprovement = improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;

    // Thresholds realistas
    if (avgImprovement > 0.8) {
      return { direction: 'improving', confidence: scores.length >= 3 ? 'high' : 'medium' };
    } else if (avgImprovement < -0.8) {
      return { direction: 'declining', confidence: scores.length >= 3 ? 'high' : 'medium' };
    }

    return { direction: 'stable', confidence: 'medium' };
  }

  private static getPeriodStartDate(period: 'week' | 'month' | 'quarter'): Date {
    const now = new Date();
    const startDate = new Date(now);

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
    }

    return startDate;
  }

  private static generateFallbackReport(studentId: string, error: any): StudentReport {
    console.warn(`⚠️ Gerando relatório de fallback para ${studentId}`);

    return {
      studentId,
      studentName: 'Aluno',
      school: 'Não disponível',
      grade: 'Não disponível',
      overall: {
        totalPoints: 0,
        currentLevel: 1,
        streak: 0,
        totalActivitiesCompleted: 0,
        averageCompletionRate: 0,
        totalTimeSpent: 0
      },
      weeklyReports: [],
      trend: 'stable',
      trendConfidence: 'low',
      generatedAt: new Date(),
      dataFreshness: 'stale',
      calculationMethod: 'full'
    };
  }

  /**
   * Limpar cache manualmente (útil para testes)
   */
  static clearCache(): void {
    this.cache.clear();
    console.log('🧹 Cache de relatórios limpo');
  }
}