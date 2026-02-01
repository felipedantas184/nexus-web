// lib/services/ScheduleInstanceService.ts
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import {
  ScheduleInstance,
  ActivityProgress,
  AssignScheduleDTO,
  InstanceStatus,
  ScheduleTemplate
} from '@/types/schedule';
import { ScheduleService } from './ScheduleService';
import { ActivityService } from './ActivityService';
import { DateUtils } from '@/lib/utils/dateUtils';
import { AuditService } from '@/lib/auth/AuditService';
import { UserService } from '@/lib/auth/UserService';
import { ProgressService } from './ProgressService';

export class ScheduleInstanceService {
  private static readonly COLLECTIONS = {
    INSTANCES: 'scheduleInstances',
    PROGRESS: 'activityProgress'
  };

  /**
   * Atribui um cronograma a um ou mais alunos
   */
  static async assignScheduleToStudents(
    professionalId: string,
    scheduleTemplateId: string,
    assignData: AssignScheduleDTO
  ): Promise<{
    successful: Array<{ studentId: string; instanceId: string }>;
    failed: Array<{ studentId: string; error: string }>;
  }> {
    try {
      // 1. Verificar se profissional tem permissão
      const schedule = await ScheduleService.getScheduleTemplate(scheduleTemplateId);
      if (schedule.professionalId !== professionalId) {
        throw new Error('Sem permissão para atribuir este cronograma');
      }

      const successful: Array<{ studentId: string; instanceId: string }> = [];
      const failed: Array<{ studentId: string; error: string }> = [];

      // 2. Para cada aluno
      for (const studentId of assignData.studentIds) {
        try {
          // Verificar se aluno existe
          // COMENTADO
          // const studentExists = await UserService.checkUserExists(studentId, 'student');
          // if (!studentExists) {
          //   throw new Error('Aluno não encontrado');
          // }

          // Verificar se já tem cronograma ativo (se não permitir múltiplos)
          if (!assignData.allowMultiple) {
            const hasActive = await this.hasActiveSchedule(studentId, scheduleTemplateId);
            if (hasActive) {
              throw new Error('Aluno já possui este cronograma ativo');
            }
          }

          // Calcular data de início
          const startDate = assignData.startDate || new Date();

          // Criar instância
          const instanceId = await this.createScheduleInstance(
            scheduleTemplateId,
            studentId,
            professionalId,
            startDate,
            assignData.customizations?.[studentId]
          );

          // Gerar atividades da primeira semana
          await this.generateWeekActivities(instanceId, 1);

          successful.push({ studentId, instanceId });

          // Log de auditoria
          // COMENTADO
          // await AuditService.logEvent(professionalId, 'SCHEDULE_ASSIGNED', {
          //   scheduleTemplateId,
          //   studentId,
          //   instanceId,
          //   startDate
          // });

        } catch (error: any) {
          failed.push({ studentId, error: error.message });
          console.error(`Erro ao atribuir para ${studentId}:`, error);
        }
      }

      return { successful, failed };

    } catch (error: any) {
      console.error('Erro ao atribuir cronograma:', error);
      throw error;
    }
  }

  /**
   * Cria uma instância de cronograma para um aluno
   */
  private static async createScheduleInstance(
    scheduleTemplateId: string,
    studentId: string,
    professionalId: string,
    startDate: Date,
    customizations?: any
  ): Promise<string> {
    try {
      const instanceId = this.generateInstanceId(scheduleTemplateId, studentId);
      const weekStartDate = DateUtils.getWeekStartDate(startDate);
      const weekEndDate = DateUtils.getWeekEndDate(startDate);

      const instanceData: Omit<ScheduleInstance, 'id'> = {
        scheduleTemplateId,
        studentId,
        professionalId,
        currentWeekNumber: 1,
        currentWeekStartDate: weekStartDate,
        currentWeekEndDate: weekEndDate,
        status: 'active',
        startedAt: startDate,
        customizations,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        progressCache: {
          completedActivities: 0,
          totalActivities: 0,
          completionPercentage: 0,
          totalPointsEarned: 0,
          streakDays: 0,
          lastUpdatedAt: new Date()
        }
      };

      await setDoc(doc(firestore, this.COLLECTIONS.INSTANCES, instanceId), {
        ...instanceData,
        currentWeekStartDate: Timestamp.fromDate(weekStartDate),
        currentWeekEndDate: Timestamp.fromDate(weekEndDate),
        startedAt: Timestamp.fromDate(startDate),
        'progressCache.lastUpdatedAt': serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return instanceId;

    } catch (error: any) {
      console.error('Erro ao criar instância:', error);
      throw error;
    }
  }

  /**
   * Gera atividades para uma semana específica
   */
  static async generateWeekActivities(
    instanceId: string,
    weekNumber: number
  ): Promise<string[]> {
    try {
      // 1. Buscar instância
      const instance = await this.getScheduleInstance(instanceId);
      const schedule = await ScheduleService.getScheduleTemplate(instance.scheduleTemplateId);
      const activities = await ActivityService.listScheduleActivities(instance.scheduleTemplateId);

      // 2. Calcular datas da semana
      const weekStartDate = DateUtils.addWeeks(
        instance.currentWeekStartDate,
        weekNumber - 1
      );
      const weekEndDate = DateUtils.addWeeks(
        instance.currentWeekEndDate,
        weekNumber - 1
      );

      const progressIds: string[] = [];
      const batch = writeBatch(firestore);

      // 3. Para cada atividade do template
      for (const activity of activities) {
        // Verificar se atividade está excluída por personalização
        if (instance.customizations?.excludedActivities?.includes(activity.id)) {
          continue;
        }

        // Calcular data da atividade (considerando semana correta)
        const activityDate = new Date(weekStartDate);
        activityDate.setDate(weekStartDate.getDate() + activity.dayOfWeek);

        // Criar ID único para progresso desta semana
        const progressId = `${instanceId}_week${weekNumber}_${activity.id}`;

        const progressData: Omit<ActivityProgress, 'id'> = {
          scheduleInstanceId: instanceId,
          activityId: activity.id,
          studentId: instance.studentId,
          weekNumber,
          dayOfWeek: activity.dayOfWeek,
          activitySnapshot: activity,
          status: 'pending',
          scheduledDate: activityDate,
          scoring: {
            pointsEarned: 0,
            bonusPoints: 0,
            penaltyPoints: 0
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        };

        const progressRef = doc(firestore, this.COLLECTIONS.PROGRESS, progressId);
        batch.set(progressRef, {
          ...progressData,
          scheduledDate: Timestamp.fromDate(activityDate),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        progressIds.push(progressId);
      }

      // 4. Atualizar cache de progresso da instância
      await this.updateProgressCache(instanceId);

      await batch.commit();
      return progressIds;

    } catch (error: any) {
      console.error('Erro ao gerar atividades da semana:', error);
      throw error;
    }
  }

  /**
   * Busca instâncias ativas de um aluno
   */
  static async getStudentActiveInstances(
    studentId: string,
    options: {
      includeProgress?: boolean;
      limit?: number;
    } = {}
  ): Promise<(ScheduleInstance & { progress?: ActivityProgress[] })[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTIONS.INSTANCES),
        where('studentId', '==', studentId),
        where('status', 'in', ['active', 'paused']),
        where('isActive', '==', true),
        orderBy('startedAt', 'desc'),
        ...(options.limit ? [limit(options.limit)] : [])
      );

      const snapshot = await getDocs(q);
      const instances: (ScheduleInstance & { progress?: ActivityProgress[] })[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const instance = {
          id: doc.id,
          ...data,
          currentWeekStartDate: data.currentWeekStartDate?.toDate(),
          currentWeekEndDate: data.currentWeekEndDate?.toDate(),
          startedAt: data.startedAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as ScheduleInstance;

        if (options.includeProgress) {
          const progress = await this.getWeekProgress(
            instance.id,
            instance.currentWeekNumber
          );
          instances.push({ ...instance, progress });
        } else {
          instances.push(instance);
        }
      }

      return instances;

    } catch (error: any) {
      console.error('Erro ao buscar instâncias do aluno:', error);
      throw error;
    }
  }

  /**
   * Busca progresso de uma semana específica
   */
  static async getWeekProgress(
    instanceId: string,
    weekNumber: number
  ): Promise<ActivityProgress[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTIONS.PROGRESS),
        where('scheduleInstanceId', '==', instanceId),
        where('weekNumber', '==', weekNumber),
        where('isActive', '==', true),
        orderBy('dayOfWeek'),
        orderBy('activitySnapshot.orderIndex')
      );

      const snapshot = await getDocs(q);
      const progress: ActivityProgress[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        progress.push({
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
        } as ActivityProgress);
      });

      return progress;

    } catch (error: any) {
      console.error('Erro ao buscar progresso da semana:', error);
      throw error;
    }
  }

  static async getScheduleInstanceById(instanceId: string): Promise<ScheduleInstance> {
    try {
      const instanceDoc = await getDoc(
        doc(firestore, this.COLLECTIONS.INSTANCES, instanceId)
      );

      if (!instanceDoc.exists()) {
        throw new Error('Instância não encontrada');
      }

      const data = instanceDoc.data();
      return {
        id: instanceDoc.id,
        ...data,
        currentWeekStartDate: data.currentWeekStartDate?.toDate(),
        currentWeekEndDate: data.currentWeekEndDate?.toDate(),
        startedAt: data.startedAt?.toDate(),
        completedAt: data.completedAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as ScheduleInstance;

    } catch (error: any) {
      console.error('Erro ao buscar instância:', error);
      throw error;
    }
  }

  /**
   * Busca atividades de hoje para um aluno
   */
  static async getTodayActivities(studentId: string): Promise<ActivityProgress[]> {
    try {
      console.log('📅 Buscando atividades de hoje para aluno:', studentId);

      // 1. Buscar instâncias ativas
      const instances = await this.getStudentActiveInstances(studentId);

      console.log('📋 Instâncias ativas encontradas:', instances.length);

      const todayActivities: ActivityProgress[] = [];
      const today = new Date();
      const todayDayOfWeek = DateUtils.getDayOfWeek(today);

      console.log('📆 Dia da semana atual:', todayDayOfWeek, '(0=Domingo, 1=Segunda...)');

      // 2. Para cada instância, buscar atividades de hoje
      for (const instance of instances) {
        console.log('🔍 Buscando atividades para instância:', instance.id);

        try {
          const progress = await this.getWeekProgress(instance.id, instance.currentWeekNumber);

          console.log(`📊 Progressos encontrados na semana ${instance.currentWeekNumber}:`, progress.length);

          // 🔥 PROBLEMA AQUI: Estava filtrando apenas 'pending'
          // CORREÇÃO: Remover filtro de status ou incluir todos
          const todayProgress = progress.filter(p => {
            const isToday = p.dayOfWeek === todayDayOfWeek;
            console.log(`  • Atividade ${p.id}: dia=${p.dayOfWeek}, status=${p.status}, hoje?=${isToday}`);
            return isToday;
          });

          console.log(`✅ Atividades de hoje para instância ${instance.id}:`, todayProgress.length);

          // Adicionar studentId se não existir
          todayProgress.forEach(p => {
            p.studentId = studentId;
            todayActivities.push(p);
          });

        } catch (err) {
          console.error(`Erro ao buscar progresso para instância ${instance.id}:`, err);
          continue; // Continuar com outras instâncias
        }
      }

      console.log(`🎯 TOTAL atividades de hoje encontradas: ${todayActivities.length}`);

      // Log detalhado dos status
      const statusCount = {
        pending: todayActivities.filter(a => a.status === 'pending').length,
        in_progress: todayActivities.filter(a => a.status === 'in_progress').length,
        completed: todayActivities.filter(a => a.status === 'completed').length,
        skipped: todayActivities.filter(a => a.status === 'skipped').length
      };

      console.log('📊 Distribuição de status:', statusCount);

      return todayActivities;

    } catch (error: any) {
      console.error('❌ Erro ao buscar atividades de hoje:', error);
      throw error;
    }
  }

  static async getWeekActivities(studentId: string, weekNumber?: number): Promise<ActivityProgress[]> {
  try {
    console.log('🔍 [getWeekActivities] Buscando atividades da semana para aluno:', studentId);
    
    // Se weekNumber não for fornecido, usa a semana atual
    const targetWeekNumber = weekNumber || DateUtils.getWeekNumber(new Date());
    console.log('📅 [getWeekActivities] Semana alvo:', targetWeekNumber);
    
    // Buscar instâncias ativas
    const activeInstances = await this.getStudentActiveInstances(studentId, {
      includeProgress: false,
      limit: 10
    });
    
    console.log('📋 [getWeekActivities] Instâncias ativas encontradas:', activeInstances.length);
    
    const allActivities: ActivityProgress[] = [];
    
    for (const instance of activeInstances) {
      console.log(`📋 [getWeekActivities] Processando instância: ${instance.id}`);
      console.log(`📋 [getWeekActivities] Semana da instância: ${instance.currentWeekNumber}`);
      
      try {
        // Buscar atividades de todos os dias da semana atual da instância
        for (let day = 0; day < 7; day++) {
          const activities = await ProgressService.getActivitiesByWeekAndDay(
            studentId,
            instance.id,
            instance.currentWeekNumber,
            day
          );
          
          if (activities.length > 0) {
            console.log(`📋 [getWeekActivities] Encontradas ${activities.length} atividades para dia ${day}`);
            allActivities.push(...activities);
          }
        }
      } catch (err) {
        console.error(`❌ [getWeekActivities] Erro ao buscar atividades para instância ${instance.id}:`, err);
      }
    }
    
    console.log('✅ [getWeekActivities] Total de atividades da semana:', allActivities.length);
    
    // Agrupar por dia da semana para log
    const activitiesByDay: Record<number, number> = {};
    allActivities.forEach(activity => {
      activitiesByDay[activity.dayOfWeek] = (activitiesByDay[activity.dayOfWeek] || 0) + 1;
    });
    
    console.log('📊 [getWeekActivities] Distribuição por dia:', activitiesByDay);
    
    return allActivities;
    
  } catch (error) {
    console.error('❌ [getWeekActivities] Erro geral:', error);
    throw error;
  }
}

  /**
   * Atualiza status de uma instância
   */
  static async updateInstanceStatus(
    instanceId: string,
    status: InstanceStatus,
    completedAt?: Date
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: serverTimestamp()
      };

      if (completedAt) {
        updateData.completedAt = Timestamp.fromDate(completedAt);
      }

      await updateDoc(
        doc(firestore, this.COLLECTIONS.INSTANCES, instanceId),
        updateData
      );

    } catch (error: any) {
      console.error('Erro ao atualizar status da instância:', error);
      throw error;
    }
  }

  /**
   * Pausar um cronograma
   */
  static async pauseSchedule(instanceId: string): Promise<void> {
    await this.updateInstanceStatus(instanceId, 'paused');

    // Log de auditoria
    // COMENTADO
    // const instance = await this.getScheduleInstance(instanceId);
    // await AuditService.logEvent(instance.professionalId, 'SCHEDULE_PAUSED', {
    //   instanceId,
    //   studentId: instance.studentId
    // });
  }

  /**
   * Retomar um cronograma pausado
   */
  static async resumeSchedule(instanceId: string): Promise<void> {
    await this.updateInstanceStatus(instanceId, 'active');

    // Log de auditoria
    // COMENTADO
    // const instance = await this.getScheduleInstance(instanceId);
    // await AuditService.logEvent(instance.professionalId, 'SCHEDULE_RESUMED', {
    //   instanceId,
    //   studentId: instance.studentId
    // });
  }

  /**
   * Completar um cronograma
   */
  static async completeSchedule(instanceId: string): Promise<void> {
    await this.updateInstanceStatus(instanceId, 'completed', new Date());

    // Log de auditoria
    // COMENTADO
    // const instance = await this.getScheduleInstance(instanceId);
    // await AuditService.logEvent(instance.professionalId, 'SCHEDULE_COMPLETED', {
    //   instanceId,
    //   studentId: instance.studentId,
    //   completedAt: new Date()
    // });
  }

  /**
   * Atualiza cache de progresso de uma instância
   */
  static async updateProgressCache(instanceId: string): Promise<void> {
    console.log(`🔍 [UPDATE CACHE] Chamado para ${instanceId}`, new Date().toISOString());

    try {
      const progress = await this.getWeekProgress(instanceId, 1); // Semana atual

      const completed = progress.filter(p => p.status === 'completed').length;
      const total = progress.length;
      const totalPoints = progress
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.scoring.pointsEarned, 0);

      // Calcular streak (dias consecutivos com atividades completadas)
      const streakDays = await this.calculateStreak(instanceId);

      await updateDoc(doc(firestore, this.COLLECTIONS.INSTANCES, instanceId), {
        'progressCache.completedActivities': completed,
        'progressCache.totalActivities': total,
        'progressCache.completionPercentage': total > 0 ? (completed / total) * 100 : 0,
        'progressCache.totalPointsEarned': totalPoints,
        'progressCache.streakDays': streakDays,
        'progressCache.lastUpdatedAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`📊 [UPDATE CACHE] ${instanceId} atualizado: ${completed}/${total} atividades`);

    } catch (error) {
      console.error(`❌ [UPDATE CACHE] Erro em ${instanceId}:`, error);
      // Não falhar a operação principal
    }
  }

  /**
   * Calcula streak de dias consecutivos
   */
  private static async calculateStreak(instanceId: string): Promise<number> {
    try {
      // Buscar todas as atividades completadas, ordenadas por data
      const q = query(
        collection(firestore, this.COLLECTIONS.PROGRESS),
        where('scheduleInstanceId', '==', instanceId),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const completedDates = new Set<string>();

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.completedAt) {
          const date = data.completedAt.toDate().toISOString().split('T')[0];
          completedDates.add(date);
        }
      });

      // Calcular dias consecutivos
      const dates = Array.from(completedDates).sort().reverse();
      let streak = 0;
      let currentDate = new Date();

      while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (dates.includes(dateStr)) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      return streak;

    } catch (error) {
      console.error('Erro ao calcular streak:', error);
      return 0;
    }
  }

  /**
   * Métodos auxiliares privados
   */
  private static async getScheduleInstance(instanceId: string): Promise<ScheduleInstance> {
    const instanceDoc = await getDoc(
      doc(firestore, this.COLLECTIONS.INSTANCES, instanceId)
    );

    if (!instanceDoc.exists()) {
      throw new Error('Instância não encontrada');
    }

    const data = instanceDoc.data();
    return {
      id: instanceDoc.id,
      ...data,
      currentWeekStartDate: data.currentWeekStartDate?.toDate(),
      currentWeekEndDate: data.currentWeekEndDate?.toDate(),
      startedAt: data.startedAt?.toDate(),
      completedAt: data.completedAt?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as ScheduleInstance;
  }

  private static async hasActiveSchedule(
    studentId: string,
    scheduleTemplateId: string
  ): Promise<boolean> {
    const q = query(
      collection(firestore, this.COLLECTIONS.INSTANCES),
      where('studentId', '==', studentId),
      where('scheduleTemplateId', '==', scheduleTemplateId),
      where('status', 'in', ['active', 'paused']),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  private static generateInstanceId(
    scheduleTemplateId: string,
    studentId: string
  ): string {
    const timestamp = Date.now();
    return `${scheduleTemplateId}_${studentId.substring(0, 8)}_${timestamp}`;
  }
}