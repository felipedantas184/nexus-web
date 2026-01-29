import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
  writeBatch,
  DocumentData
} from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import {
  WeeklySnapshot,
  ScheduleInstance,
  ActivityProgress,
  ActivityType,
  GenerateSnapshotDTO
} from '@/types/schedule';
import { ScheduleInstanceService } from './ScheduleInstanceService';
import { DateUtils } from '@/lib/utils/dateUtils';

export class WeeklySnapshotService {
  private static readonly COLLECTIONS = {
    SNAPSHOTS: 'weeklySnapshots', // Nome mais claro
    PROGRESS: 'activityProgress',
    INSTANCES: 'scheduleInstances'
  };

  /**
   * Gera snapshot da semana que terminou
   * Método PRINCIPAL do Sprint 1
   */
  static async generateSnapshot(
    dto: GenerateSnapshotDTO
  ): Promise<{ snapshotId: string; metrics: any; error?: string }> {
    try {
      console.log(`📊 [SNAPSHOT] Gerando para instância ${dto.scheduleInstanceId}, semana ${dto.weekNumber}`);

      // 1. Verificar se snapshot já existe
      const existingSnapshot = await this.getSnapshotByWeek(
        dto.scheduleInstanceId,
        dto.weekNumber
      );

      if (existingSnapshot && !dto.forceRegenerate) {
        console.log(`📊 [SNAPSHOT] Já existe para semana ${dto.weekNumber}, retornando existente`);
        return {
          snapshotId: existingSnapshot.id,
          metrics: existingSnapshot.metrics
        };
      }

      // 2. Buscar progresso da semana
      const progress = await ScheduleInstanceService.getWeekProgress(
        dto.scheduleInstanceId,
        dto.weekNumber
      );

      if (progress.length === 0) {
        throw new Error(`Nenhuma atividade encontrada para semana ${dto.weekNumber}`);
      }

      // 3. Buscar instância para metadados
      const instance = await ScheduleInstanceService.getScheduleInstanceById(
        dto.scheduleInstanceId
      );

      // 4. Calcular métricas
      const metrics = this.calculateWeeklyMetrics(progress);
      const dailyBreakdown = this.calculateDailyBreakdown(progress);
      const activityTypeBreakdown = this.calculateActivityTypeBreakdown(progress);

      // 5. Criar ID único
      const snapshotId = this.generateSnapshotId(
        dto.scheduleInstanceId,
        dto.weekNumber
      );

      // 6. Montar snapshot
      const snapshotData: Omit<WeeklySnapshot, 'id'> = {
        scheduleInstanceId: dto.scheduleInstanceId,
        studentId: instance.studentId,
        weekNumber: dto.weekNumber,
        weekStartDate: DateUtils.addWeeks(instance.currentWeekStartDate, dto.weekNumber - 1),
        weekEndDate: DateUtils.addWeeks(instance.currentWeekEndDate, dto.weekNumber - 1),
        metrics,
        dailyBreakdown,
        activityTypeBreakdown,
        metadata: {
          scheduleTemplateName: 'Não disponível', // Seria buscado do template
          scheduleTemplateId: instance.scheduleTemplateId,
          professionalId: instance.professionalId,
          generatedBy: 'system',
          dataSource: 'calculated'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      // 7. Salvar no Firestore
      await setDoc(doc(firestore, this.COLLECTIONS.SNAPSHOTS, snapshotId), {
        ...snapshotData,
        weekStartDate: Timestamp.fromDate(snapshotData.weekStartDate),
        weekEndDate: Timestamp.fromDate(snapshotData.weekEndDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log(`✅ [SNAPSHOT] Gerado com sucesso: ${snapshotId}`);
      console.log(`📈 Métricas: ${metrics.completionRate}% completado, ${metrics.totalPointsEarned} pontos`);

      return {
        snapshotId,
        metrics
      };

    } catch (error: any) {
      console.error(`❌ [SNAPSHOT] Erro ao gerar:`, error);
      return {
        snapshotId: '',
        metrics: {},
        error: `Falha ao gerar snapshot: ${error.message}`
      };
    }
  }

  /**
   * Calcula métricas básicas da semana
   */
  private static calculateWeeklyMetrics(progress: ActivityProgress[]) {
    const total = progress.length;
    const completed = progress.filter(p => p.status === 'completed').length;
    const skipped = progress.filter(p => p.status === 'skipped').length;

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    // Pontuação total
    const totalPoints = progress
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.scoring?.pointsEarned || 0), 0);

    const averagePoints = completed > 0 ? totalPoints / completed : 0;

    // Tempo total
    const totalTime = progress
      .filter(p => p.status === 'completed' && p.executionData?.timeSpent)
      .reduce((sum, p) => sum + (p.executionData!.timeSpent || 0), 0);

    const averageTime = completed > 0 ? totalTime / completed : 0;

    // Consistência (dias únicos com atividades completadas)
    const uniqueDays = new Set(
      progress
        .filter(p => p.status === 'completed')
        .map(p => p.dayOfWeek)
    ).size;

    const consistencyScore = (uniqueDays / 7) * 100;

    // Aderência (completou no dia correto)
    const onTimeActivities = progress.filter(p => {
      if (p.status !== 'completed' || !p.completedAt || !p.scheduledDate) return false;
      return DateUtils.isSameDay(p.completedAt, p.scheduledDate);
    }).length;

    const adherenceScore = completed > 0 ? (onTimeActivities / completed) * 100 : 0;

    // Streak no final da semana (último dia com atividade)
    let streak = 0;
    const completedDates = progress
      .filter(p => p.status === 'completed' && p.completedAt)
      .map(p => p.completedAt!.toISOString().split('T')[0])
      .sort();

    if (completedDates.length > 0) {
      const lastDate = new Date(completedDates[completedDates.length - 1]);
      const today = new Date();
      streak = DateUtils.getDaysBetween(lastDate, today) + 1;
    }

    return {
      totalActivities: total,
      completedActivities: completed,
      skippedActivities: skipped,
      completionRate: Math.round(completionRate),
      totalPointsEarned: totalPoints,
      averagePointsPerActivity: parseFloat(averagePoints.toFixed(1)),
      totalTimeSpent: totalTime,
      averageTimePerActivity: parseFloat(averageTime.toFixed(1)),
      consistencyScore: Math.round(consistencyScore),
      adherenceScore: Math.round(adherenceScore),
      streakAtEndOfWeek: streak
    };
  }

  /**
   * Calcula breakdown por dia
   */
  private static calculateDailyBreakdown(progress: ActivityProgress[]) {
    const breakdown: Record<number, {
      total: number;
      completed: number;
      skipped: number;
      pointsEarned: number;
      timeSpent: number;
    }> = {};

    // Inicializar todos os dias (0-6)
    for (let i = 0; i < 7; i++) {
      breakdown[i] = {
        total: 0,
        completed: 0,
        skipped: 0,
        pointsEarned: 0,
        timeSpent: 0
      };
    }

    // Preencher com dados reais
    progress.forEach(item => {
      const day = item.dayOfWeek;
      breakdown[day].total++;

      if (item.status === 'completed') {
        breakdown[day].completed++;
        breakdown[day].pointsEarned += item.scoring?.pointsEarned || 0;
        breakdown[day].timeSpent += item.executionData?.timeSpent || 0;
      } else if (item.status === 'skipped') {
        breakdown[day].skipped++;
      }
    });

    return breakdown;
  }

  /**
   * Calcula breakdown por tipo de atividade
   */
  private static calculateActivityTypeBreakdown(progress: ActivityProgress[]) {
    const breakdown: Record<ActivityType, {
      total: number;
      completed: number;
      averagePoints: number;
      averageTime: number;
    }> = {} as any;

    // Inicializar contadores
    const tempData: Record<string, {
      total: number;
      completed: number;
      totalPoints: number;
      totalTime: number;
    }> = {};

    progress.forEach(item => {
      const type = item.activitySnapshot?.type || 'unknown';

      if (!tempData[type]) {
        tempData[type] = {
          total: 0,
          completed: 0,
          totalPoints: 0,
          totalTime: 0
        };
      }

      tempData[type].total++;

      if (item.status === 'completed') {
        tempData[type].completed++;
        tempData[type].totalPoints += item.scoring?.pointsEarned || 0;
        tempData[type].totalTime += item.executionData?.timeSpent || 0;
      }
    });

    // Calcular médias
    Object.entries(tempData).forEach(([type, data]) => {
      breakdown[type as ActivityType] = {
        total: data.total,
        completed: data.completed,
        averagePoints: data.completed > 0 ? data.totalPoints / data.completed : 0,
        averageTime: data.completed > 0 ? data.totalTime / data.completed : 0
      };
    });

    return breakdown;
  }

  /**
   * Busca snapshots de um aluno
   */
  static async getStudentSnapshots(
    studentId: string,
    options: {
      limit?: number;
      scheduleInstanceId?: string;
    } = {}
  ): Promise<WeeklySnapshot[]> {
    try {
      let q = query(
        collection(firestore, this.COLLECTIONS.SNAPSHOTS),
        where('studentId', '==', studentId),
        where('isActive', '==', true)
      );

      if (options.scheduleInstanceId) {
        q = query(q, where('scheduleInstanceId', '==', options.scheduleInstanceId));
      }

      q = query(q, where('weekNumber', '>', 0)); // Semanas válidas apenas

      const snapshot = await getDocs(q);
      const snapshots: WeeklySnapshot[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        snapshots.push({
          id: doc.id,
          ...data,
          weekStartDate: data.weekStartDate?.toDate(),
          weekEndDate: data.weekEndDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as WeeklySnapshot);
      });

      // Ordenar por semana (mais recente primeiro)
      snapshots.sort((a, b) => b.weekNumber - a.weekNumber);

      // Aplicar limite
      if (options.limit) {
        return snapshots.slice(0, options.limit);
      }

      return snapshots;

    } catch (error: any) {
      console.error('Erro ao buscar snapshots:', error);
      return [];
    }
  }

  /**
   * Busca snapshot específico
   */
  private static async getSnapshotByWeek(
    scheduleInstanceId: string,
    weekNumber: number
  ): Promise<WeeklySnapshot | null> {
    try {
      const q = query(
        collection(firestore, this.COLLECTIONS.SNAPSHOTS),
        where('scheduleInstanceId', '==', scheduleInstanceId),
        where('weekNumber', '==', weekNumber),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        weekStartDate: data.weekStartDate?.toDate(),
        weekEndDate: data.weekEndDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as WeeklySnapshot;

    } catch (error) {
      console.error('Erro ao buscar snapshot:', error);
      return null;
    }
  }

  /**
   * Gera ID único para snapshot
   */
  private static generateSnapshotId(
    scheduleInstanceId: string,
    weekNumber: number
  ): string {
    const timestamp = Date.now();
    return `snapshot_${scheduleInstanceId}_week${weekNumber}_${timestamp}`;
  }
}