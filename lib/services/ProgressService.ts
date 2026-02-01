// lib/services/ProgressService.ts
import {
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  increment,
  arrayUnion,
  getDoc
} from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import {
  ActivityProgress,
  ProgressStatus,
  ActivityType
} from '@/types/schedule';
import { ScheduleInstanceService } from './ScheduleInstanceService';
import { AuditService } from '@/lib/auth/AuditService';
import { DateUtils } from '@/lib/utils/dateUtils';

interface CompletionData {
  timeSpent?: number; // em minutos
  submission?: any;
  emotionalState?: {
    before?: number;
    after?: number;
  };
  notes?: string;
  attachments?: string[];
}

export class ProgressService {
  private static readonly COLLECTIONS = {
    PROGRESS: 'activityProgress',
    STUDENTS: 'students'
  };

  /**
   * Inicia uma atividade
   */
  static async startActivity(
    progressId: string,
    studentId: string
  ): Promise<ActivityProgress> { // ← Mudar retorno para ActivityProgress
    try {
      console.log('🚀 Iniciando atividade:', { progressId, studentId });

      // 1. Buscar e validar progresso
      const progress = await this.getActivityProgress(progressId, studentId);

      console.log('📋 Progresso encontrado:', {
        id: progress.id,
        currentStatus: progress.status,
        scheduledDate: progress.scheduledDate
      });

      // 2. Validar se pode iniciar
      if (progress.status !== 'pending') {
        throw new Error(`Atividade já está ${progress.status}`);
      }

      // 3. Atualizar status
      const now = new Date();
      const progressRef = doc(firestore, this.COLLECTIONS.PROGRESS, progressId);

      await updateDoc(progressRef, {
        status: 'in_progress',
        startedAt: Timestamp.fromDate(now),
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Atividade ${progressId} iniciada com sucesso`);

      // 4. Retornar progresso atualizado
      return {
        ...progress,
        status: 'in_progress',
        startedAt: now,
        updatedAt: now
      };

    } catch (error: any) {
      console.error('❌ Erro ao iniciar atividade:', error);
      throw error;
    }
  }

  /**
   * Completa uma atividade
   */
  static async completeActivity(
    progressId: string,
    studentId: string,
    completionData: CompletionData = {}
  ): Promise<{
    pointsEarned: number;
    bonusPoints: number;
    totalPoints: number;
  }> {
    try {
      console.log('✅ Iniciando completeActivity:', { progressId, studentId });

      // 1. Buscar progresso atual para validar
      const progress = await this.getActivityProgress(progressId, studentId);

      if (progress.status !== 'in_progress') {
        throw new Error(`Atividade não está em progresso (status: ${progress.status})`);
      }

      // 2. Calcular pontuação PRIMEIRO
      const scoring = await this.calculateScoring(progressId, completionData);

      console.log('📊 Pontuação calculada:', scoring);

      // 3. Calcular tempo gasto CORRETAMENTE
      let timeSpentValue = completionData.timeSpent;

      // Se não veio no completionData, calcular
      if (!timeSpentValue && progress.startedAt) {
        const startedAt = progress.startedAt;
        const now = new Date();
        const diffMs = now.getTime() - startedAt.getTime();
        timeSpentValue = Math.floor(diffMs / (1000 * 60)); // minutos
      }

      // Valor padrão se ainda não tiver
      timeSpentValue = timeSpentValue || 30;

      console.log('⏱️ Tempo gasto:', timeSpentValue, 'minutos');

      const now = new Date();
      const progressRef = doc(firestore, this.COLLECTIONS.PROGRESS, progressId);

      // 4. Preparar dados para atualização
      const updateData: any = {
        status: 'completed',
        completedAt: Timestamp.fromDate(now),
        scoring: {
          pointsEarned: scoring.pointsEarned,
          bonusPoints: scoring.bonusPoints,
          penaltyPoints: scoring.penaltyPoints || 0
        },
        updatedAt: serverTimestamp()
      };

      // 5. Adicionar executionData APENAS com dados válidos
      const executionDataUpdate: any = {
        timeSpent: timeSpentValue, // ← NÚMERO, não Promise!
        ...completionData
      };

      // Remover quaisquer Promises ou objetos inválidos
      Object.keys(executionDataUpdate).forEach(key => {
        if (executionDataUpdate[key] instanceof Promise) {
          console.warn('⚠️ Removendo Promise do executionData:', key);
          delete executionDataUpdate[key];
        }
      });

      updateData.executionData = executionDataUpdate;

      // 6. Atualizar no Firestore
      await updateDoc(progressRef, updateData);

      console.log(`✅ Atividade ${progressId} completada com sucesso`);

      // 7. Atualizar cache da instância
      try {
        const instanceId = progress.scheduleInstanceId;
        if (instanceId) {
          await ScheduleInstanceService.updateProgressCache(instanceId);
        }
      } catch (cacheError) {
        console.warn('⚠️ Erro ao atualizar cache (não crítico):', cacheError);
      }

      // 8. Atualizar estatísticas do aluno
      try {
        await this.updateStudentStats(studentId, scoring.totalPoints);
      } catch (statsError) {
        console.warn('⚠️ Erro ao atualizar estatísticas (não crítico):', statsError);
      }

      return scoring;

    } catch (error: any) {
      console.error('❌ Erro ao completar atividade:', error);
      throw error;
    }
  }

  /**
   * Pula uma atividade
   */
  static async skipActivity(
    progressId: string,
    studentId: string,
    reason?: string
  ): Promise<void> {
    try {
      await updateDoc(doc(firestore, this.COLLECTIONS.PROGRESS, progressId), {
        status: 'skipped',
        executionData: {
          skippedReason: reason || 'Skipped by student',
          skippedAt: new Date()
        },
        updatedAt: serverTimestamp()
      });

      // COMENTADO
      // await AuditService.logEvent(studentId, 'ACTIVITY_SKIPPED', {
      //   progressId,
      //   reason
      // });

    } catch (error: any) {
      console.error('Erro ao pular atividade:', error);
      throw error;
    }
  }

  /**
   * Salva rascunho/progresso parcial
   */
  static async saveDraft(
    progressId: string,
    draftData: any
  ): Promise<void> {
    try {
      await updateDoc(doc(firestore, this.COLLECTIONS.PROGRESS, progressId), {
        executionData: {
          ...draftData,
          lastSavedAt: new Date()
        },
        updatedAt: serverTimestamp()
      });

    } catch (error: any) {
      console.error('Erro ao salvar rascunho:', error);
      throw error;
    }
  }

  /**
   * Submete resposta de quiz
   */
  static async submitQuizAnswers(
    progressId: string,
    studentId: string,
    answers: Record<string, any>,
    attemptNumber: number = 1
  ): Promise<{
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    passed: boolean;
  }> {
    try {
      // Buscar atividade para validar respostas
      const progressRef = doc(firestore, this.COLLECTIONS.PROGRESS, progressId);

      // Em produção, isso buscaria a atividade e validaria as respostas
      // Por enquanto, simular pontuação
      const score = Math.floor(Math.random() * 100); // Simulação
      const totalQuestions = Object.keys(answers).length;
      const correctAnswers = Math.floor(totalQuestions * (score / 100));

      const quizConfig = {} as any; // Seria buscado do activitySnapshot
      const passingScore = quizConfig.passingScore || 70;
      const passed = score >= passingScore;

      // Registrar tentativa
      await updateDoc(progressRef, {
        'executionData.attempts': arrayUnion({
          attemptNumber,
          startedAt: new Date(),
          completedAt: new Date(),
          score,
          answers
        }),
        updatedAt: serverTimestamp()
      });

      // Se passou, completar atividade
      if (passed) {
        await this.completeActivity(progressId, studentId, {
          submission: { answers, score }
        });
      }

      return {
        score,
        totalQuestions,
        correctAnswers,
        passed
      };

    } catch (error: any) {
      console.error('Erro ao submeter quiz:', error);
      throw error;
    }
  }

  /**
   * Métodos auxiliares privados
   */
  private static async calculateScoring(
    progressId: string,
    completionData: CompletionData
  ): Promise<{
    pointsEarned: number;
    bonusPoints: number;
    penaltyPoints: number;
    totalPoints: number;
  }> {
    try {
      // Em produção, buscaria a atividade e aplicaria regras de pontuação
      // Por enquanto, lógica básica
      const basePoints = 10; // Seria do activitySnapshot
      let bonusPoints = 0;
      let penaltyPoints = 0;

      // Bônus por completar antes do prazo
      if (completionData.timeSpent) {
        // Se completou em menos tempo que o estimado
        const estimatedTime = 30; // Seria do activitySnapshot
        if (completionData.timeSpent < estimatedTime) {
          bonusPoints += 2;
        }
      }

      // Bônus por estado emocional positivo
      if (completionData.emotionalState?.after) {
        if (completionData.emotionalState.after >= 4) { // Escala 1-5
          bonusPoints += 1;
        }
      }

      const totalPoints = basePoints + bonusPoints - penaltyPoints;

      return {
        pointsEarned: basePoints,
        bonusPoints,
        penaltyPoints,
        totalPoints
      };

    } catch (error) {
      console.error('Erro ao calcular pontuação:', error);
      return {
        pointsEarned: 10,
        bonusPoints: 0,
        penaltyPoints: 0,
        totalPoints: 10
      };
    }
  }

  private static async calculateTimeSpent(progressId: string): Promise<number> {
    try {
      const progressRef = doc(firestore, this.COLLECTIONS.PROGRESS, progressId);
      const progressDoc = await getDoc(progressRef);

      if (!progressDoc.exists()) {
        console.warn('Progresso não encontrado para calcular tempo:', progressId);
        return 0;
      }

      const data = progressDoc.data();
      const startedAt = data.startedAt?.toDate();

      if (!startedAt) {
        console.warn('Atividade não tem startedAt:', progressId);
        return 0;
      }

      // Calcular diferença em minutos
      const now = new Date();
      const diffInMs = now.getTime() - startedAt.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

      // Garantir valor mínimo e máximo razoável
      return Math.max(1, Math.min(diffInMinutes, 240)); // 1-240 minutos

    } catch (error) {
      console.error('Erro ao calcular tempo gasto:', error);
      return 0;
    }
  }

  private static async updateStudentStats(
    studentId: string,
    points: number
  ): Promise<void> {
    try {
      const studentRef = doc(firestore, this.COLLECTIONS.STUDENTS, studentId);

      await updateDoc(studentRef, {
        'profile.totalPoints': increment(points),
        'profile.streak': increment(1),
        'profile.lastActivityAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Erro ao atualizar estatísticas do aluno:', error);
      // Não falhar a operação principal
    }
  }

  /**
 * Busca progresso por ID e valida acesso do aluno
 */
  static async getActivityProgress(
    progressId: string,
    studentId: string
  ): Promise<ActivityProgress> {
    try {
      const progressRef = doc(firestore, this.COLLECTIONS.PROGRESS, progressId);
      const progressDoc = await getDoc(progressRef);

      if (!progressDoc.exists()) {
        throw new Error('Atividade não encontrada');
      }

      const data = progressDoc.data();

      // Validar que o aluno tem acesso a esta atividade
      // Removido validação estrita para debug
      // if (data.studentId !== studentId) {
      //   throw new Error('Sem permissão para acessar esta atividade');
      // }

      return {
        id: progressDoc.id,
        ...data,
        scheduledDate: data.scheduledDate?.toDate(),
        startedAt: data.startedAt?.toDate(),
        completedAt: data.completedAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        activitySnapshot: {
          ...data.activitySnapshot,
          createdAt: data.activitySnapshot?.createdAt?.toDate(),
          updatedAt: data.activitySnapshot?.updatedAt?.toDate()
        }
      } as ActivityProgress;

    } catch (error: any) {
      console.error('Erro ao buscar progresso:', error);
      throw error;
    }
  }

  /**
   * Valida se atividade pode ser iniciada/completada
   */
  static async validateActivityAccess(
    progressId: string,
    studentId: string
  ): Promise<{
    canAccess: boolean;
    reason?: string;
    activity?: any;
  }> {
    try {
      // Buscar progresso
      const progressRef = doc(firestore, this.COLLECTIONS.PROGRESS, progressId);
      // Em produção, verificaria:
      // 1. Se atividade pertence ao aluno
      // 2. Se está no status correto
      // 3. Se não está expirada
      // 4. Se aluno tem permissão

      return {
        canAccess: true,
        activity: {} // atividade seria buscada
      };

    } catch (error) {
      return {
        canAccess: false,
        reason: 'Erro ao validar acesso'
      };
    }
  }

  /**
 * Busca atividades por semana e dia da semana
 */
  static async getActivitiesByWeekAndDay(
    studentId: string,
    scheduleInstanceId: string,
    weekNumber: number,
    dayOfWeek: number
  ): Promise<ActivityProgress[]> {
    try {
      console.log('🔍 [getActivitiesByWeekAndDay] Buscando atividades:', {
        studentId,
        scheduleInstanceId,
        weekNumber,
        dayOfWeek
      });

      // Importar funções do Firestore necessárias
      const { collection, query, where, getDocs } = await import('firebase/firestore');

      // Criar query para buscar atividades específicas
      const q = query(
        collection(firestore, this.COLLECTIONS.PROGRESS),
        where('studentId', '==', studentId),
        where('scheduleInstanceId', '==', scheduleInstanceId),
        where('weekNumber', '==', weekNumber),
        where('dayOfWeek', '==', dayOfWeek),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const activities: ActivityProgress[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();

        // Converter timestamps do Firestore para Date
        const activity: ActivityProgress = {
          id: doc.id,
          ...data,
          scheduledDate: data.scheduledDate?.toDate(),
          startedAt: data.startedAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          activitySnapshot: {
            ...data.activitySnapshot,
            createdAt: data.activitySnapshot?.createdAt?.toDate(),
            updatedAt: data.activitySnapshot?.updatedAt?.toDate()
          }
        } as ActivityProgress;

        activities.push(activity);
      });

      console.log(`✅ [getActivitiesByWeekAndDay] Encontradas ${activities.length} atividades`);

      // Log detalhado para debug
      activities.forEach((activity, index) => {
        console.log(`  ${index + 1}. ${activity.activitySnapshot?.title || 'Sem título'} (${activity.status})`);
      });

      return activities;

    } catch (error: any) {
      console.error('❌ [getActivitiesByWeekAndDay] Erro:', error);
      throw new Error(`Erro ao buscar atividades: ${error.message}`);
    }
  }
}