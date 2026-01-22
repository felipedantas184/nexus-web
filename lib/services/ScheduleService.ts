// lib/services/ScheduleService.ts
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
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import {
  ScheduleTemplate,
  ScheduleActivity,
  CreateScheduleDTO,
  CreateActivityDTO,
  ScheduleCategory
} from '@/types/schedule';
import { ValidationUtils } from '@/lib/utils/validationUtils';
import { DateUtils } from '@/lib/utils/dateUtils';
import { AuditService } from '@/lib/auth/AuditService';

export class ScheduleService {
  private static readonly COLLECTIONS = {
    TEMPLATES: 'weeklySchedules',
    ACTIVITIES: 'scheduleActivities'
  };

  /**
   * Cria um novo template de cronograma
   */
  static async createScheduleTemplate(
    professionalId: string,
    data: CreateScheduleDTO
  ): Promise<{
    scheduleId: string;
    activityIds: string[];
    metadata: any;
  }> {
    try {
      // 1. Validação
      const validation = ValidationUtils.validateScheduleData(data);
      if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
      }

      const sanitizedData = ValidationUtils.sanitizeScheduleData(data);

      // 2. Calcular métricas
      const metrics = this.calculateScheduleMetrics(sanitizedData.activities);

      // 3. Criar ID do cronograma
      const scheduleId = this.generateScheduleId(professionalId, sanitizedData.name);

      // 4. Criar template no Firestore
      const scheduleData: Omit<ScheduleTemplate, 'id'> = {
        professionalId,
        name: sanitizedData.name,
        description: sanitizedData.description,
        category: sanitizedData.category,
        startDate: sanitizedData.startDate,
        endDate: sanitizedData.endDate,
        activeDays: sanitizedData.activeDays,
        repeatRules: {
          type: 'weekly',
          resetOnRepeat: sanitizedData.repeatRules.resetOnRepeat,
          maxRepetitions: sanitizedData.repeatRules.maxRepetitions
        },
        metadata: {
          version: 1,
          estimatedWeeklyHours: metrics.estimatedWeeklyHours,
          totalActivities: metrics.totalActivities,
          tags: metrics.tags
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      await setDoc(doc(firestore, this.COLLECTIONS.TEMPLATES, scheduleId), {
        ...scheduleData,
        startDate: Timestamp.fromDate(sanitizedData.startDate),
        endDate: sanitizedData.endDate ? Timestamp.fromDate(sanitizedData.endDate) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 5. Criar atividades
      const activityIds = await this.createActivities(scheduleId, sanitizedData.activities);

      // 6. Log de auditoria
      // COMENTADO
      // await AuditService.logEvent(professionalId, 'SCHEDULE_CREATED', {
      //   scheduleId,
      //   activityCount: activityIds.length,
      //   metrics
      // });

      return {
        scheduleId,
        activityIds,
        metadata: metrics
      };

    } catch (error: any) {
      console.error('Erro ao criar cronograma:', error);
      throw new Error(`Falha ao criar cronograma: ${error.message}`);
    }
  }

  /**
   * Busca um template por ID
   */
  static async getScheduleTemplate(
    scheduleId: string,
    includeActivities: boolean = false
  ): Promise<ScheduleTemplate & { activities?: ScheduleActivity[] }> {
    try {
      const scheduleDoc = await getDoc(
        doc(firestore, this.COLLECTIONS.TEMPLATES, scheduleId)
      );

      if (!scheduleDoc.exists()) {
        throw new Error('Cronograma não encontrado');
      }

      const scheduleData = scheduleDoc.data();
      const schedule = {
        id: scheduleDoc.id,
        ...scheduleData,
        startDate: scheduleData.startDate?.toDate(),
        endDate: scheduleData.endDate?.toDate(),
        createdAt: scheduleData.createdAt?.toDate(),
        updatedAt: scheduleData.updatedAt?.toDate()
      } as ScheduleTemplate;

      if (includeActivities) {
        const activities = await this.getScheduleActivities(scheduleId);
        return { ...schedule, activities };
      }

      return schedule;

    } catch (error: any) {
      console.error('Erro ao buscar cronograma:', error);
      throw error;
    }
  }

  /**
   * Lista cronogramas de um profissional
   */
  static async listProfessionalSchedules(
    professionalId: string,
    options: {
      category?: ScheduleCategory;
      activeOnly?: boolean;
      limit?: number;
    } = {}
  ): Promise<ScheduleTemplate[]> {
    try {
      let q = query(
        collection(firestore, this.COLLECTIONS.TEMPLATES),
        where('professionalId', '==', professionalId)
      );

      if (options.activeOnly) {
        q = query(q, where('isActive', '==', true));
      }

      if (options.category) {
        q = query(q, where('category', '==', options.category));
      }

      const snapshot = await getDocs(q);
      const schedules: ScheduleTemplate[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        schedules.push({
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate(),
          endDate: data.endDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as ScheduleTemplate);
      });

      // Ordenar por data de criação (mais recente primeiro)
      schedules.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Aplicar limite
      if (options.limit) {
        return schedules.slice(0, options.limit);
      }

      return schedules;

    } catch (error: any) {
      console.error('Erro ao listar cronogramas:', error);
      throw error;
    }
  }

  /**
   * Atualiza um template existente (cria nova versão)
   */
  static async updateScheduleTemplate(
    scheduleId: string,
    professionalId: string,
    updates: Partial<CreateScheduleDTO>
  ): Promise<string> {
    try {
      // Buscar template atual
      const currentTemplate = await this.getScheduleTemplate(scheduleId, true);

      // Verificar permissões
      if (currentTemplate.professionalId !== professionalId) {
        throw new Error('Sem permissão para editar este cronograma');
      }

      // Criar nova versão
      const newVersion = currentTemplate.metadata.version + 1;
      const newScheduleId = `${scheduleId}_v${newVersion}`;

      // Mesclar atualizações
      const mergedData: CreateScheduleDTO = {
        name: updates.name || currentTemplate.name,
        description: updates.description || currentTemplate.description,
        category: updates.category || currentTemplate.category,
        startDate: updates.startDate || currentTemplate.startDate,
        endDate: updates.endDate,
        activeDays: updates.activeDays || currentTemplate.activeDays,
        repeatRules: {
          resetOnRepeat: updates.repeatRules?.resetOnRepeat ??
            currentTemplate.repeatRules.resetOnRepeat,
          maxRepetitions: updates.repeatRules?.maxRepetitions
        },
        activities: updates.activities ||
          (currentTemplate as any).activities?.map((activity: ScheduleActivity) => ({
            dayOfWeek: activity.dayOfWeek,
            orderIndex: activity.orderIndex,
            type: activity.type,
            title: activity.title,
            description: activity.description,
            instructions: activity.instructions,
            config: activity.config,
            scoring: activity.scoring,
            metadata: activity.metadata
          })) || []
      };

      // Criar novo template
      const result = await this.createScheduleTemplate(professionalId, mergedData);

      // Arquivar versão antiga
      await updateDoc(doc(firestore, this.COLLECTIONS.TEMPLATES, scheduleId), {
        isActive: false,
        updatedAt: serverTimestamp()
      });

      return result.scheduleId;

    } catch (error: any) {
      console.error('Erro ao atualizar cronograma:', error);
      throw error;
    }
  }

  /**
   * Arquivar um cronograma
   */
  static async archiveSchedule(
    scheduleId: string,
    professionalId: string
  ): Promise<void> {
    try {
      const schedule = await this.getScheduleTemplate(scheduleId);

      if (schedule.professionalId !== professionalId) {
        throw new Error('Sem permissão para arquivar este cronograma');
      }

      await updateDoc(doc(firestore, this.COLLECTIONS.TEMPLATES, scheduleId), {
        isActive: false,
        updatedAt: serverTimestamp()
      });

      // COMENTADO
      // await AuditService.logEvent(professionalId, 'SCHEDULE_ARCHIVED', {
      //   scheduleId
      // });

    } catch (error: any) {
      console.error('Erro ao arquivar cronograma:', error);
      throw error;
    }
  }

  /**
   * Métodos auxiliares privados
   */
  private static async createActivities(
    scheduleId: string,
    activities: CreateActivityDTO[]
  ): Promise<string[]> {
    const batch = writeBatch(firestore);
    const activityIds: string[] = [];

    activities.forEach((activity, index) => {
      const activityId = `${scheduleId}_act_${index}`;
      const activityRef = doc(firestore, this.COLLECTIONS.ACTIVITIES, activityId);

      const activityData: Omit<ScheduleActivity, 'id'> = {
        scheduleTemplateId: scheduleId,
        dayOfWeek: activity.dayOfWeek,
        orderIndex: activity.orderIndex,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        instructions: activity.instructions,
        config: activity.config,
        scoring: activity.scoring,
        metadata: activity.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      batch.set(activityRef, {
        ...activityData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      activityIds.push(activityId);
    });

    await batch.commit();
    return activityIds;
  }

  private static async getScheduleActivities(scheduleId: string): Promise<ScheduleActivity[]> {
    const q = query(
      collection(firestore, this.COLLECTIONS.ACTIVITIES),
      where('scheduleTemplateId', '==', scheduleId),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);
    const activities: ScheduleActivity[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as ScheduleActivity);
    });

    // Ordenar por dia da semana e índice
    activities.sort((a, b) => {
      if (a.dayOfWeek === b.dayOfWeek) {
        return a.orderIndex - b.orderIndex;
      }
      return a.dayOfWeek - b.dayOfWeek;
    });

    return activities;
  }

  private static calculateScheduleMetrics(activities: CreateActivityDTO[]): {
    totalActivities: number;
    estimatedWeeklyHours: number;
    tags: string[];
  } {
    const totalActivities = activities.length;
    const estimatedWeeklyHours = activities.reduce(
      (total, activity) => total + (activity.metadata.estimatedDuration || 30),
      0
    ) / 60;

    // Extrair tags únicas
    const tags = Array.from(new Set(
      activities.flatMap(activity => [
        ...(activity.metadata.therapeuticFocus || []),
        ...(activity.metadata.educationalFocus || [])
      ])
    )).filter(Boolean);

    return {
      totalActivities,
      estimatedWeeklyHours: parseFloat(estimatedWeeklyHours.toFixed(1)),
      tags
    };
  }

  private static generateScheduleId(professionalId: string, name: string): string {
    const timestamp = Date.now();
    const nameSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 20);

    return `${professionalId.substring(0, 8)}_${nameSlug}_${timestamp}`;
  }
}