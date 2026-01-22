// lib/services/StudentMetricsService.ts
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import { ScheduleInstance, ActivityProgress } from '@/types/schedule';
import { ScheduleInstanceService } from './ScheduleInstanceService';

export class StudentMetricsService {
  /**
   * Obtém métricas otimizadas da semana atual (sem N+1)
   */
  static async getCurrentWeekMetrics(studentId: string): Promise<{
    totalActivities: number;
    completedActivities: number;
    totalPoints: number;
    timeSpent: number;
    streak: number;
    level: number;
    completionRate: number;
  }> {
    try {
      console.log('📊 Obtendo métricas otimizadas para:', studentId);

      // 1. Buscar perfil do aluno (streak e level)
      const studentProfile = await this.getStudentProfile(studentId);

      // 2. Buscar instâncias ativas com progressCache (evita N+1)
      const instances = await ScheduleInstanceService.getStudentActiveInstances(
        studentId,
        { includeProgress: false }
      );

      // 3. Agregar dados dos progressCache
      let totalActivities = 0;
      let completedActivities = 0;
      let totalPoints = 0;
      let totalTimeSpent = 0;

      instances.forEach(instance => {
        if (instance.progressCache) {
          totalActivities += instance.progressCache.totalActivities;
          completedActivities += instance.progressCache.completedActivities;
          totalPoints += instance.progressCache.totalPointsEarned;
        }
      });

      // 4. Calcular tempo gasto (opcional, pode ser estimado)
      const estimatedTimeSpent = completedActivities * 25; // 25min média por atividade

      const completionRate = totalActivities > 0
        ? (completedActivities / totalActivities) * 100
        : 0;

      const timeSpent = completedActivities * 25;

      return {
        totalActivities,
        completedActivities,
        totalPoints,
        timeSpent,
        streak: studentProfile.streak,
        level: studentProfile.level,
        completionRate
      };

    } catch (error: any) {
      console.error('❌ Erro ao obter métricas otimizadas:', error);
      throw error;
    }
  }

  /**
   * Obtém perfil do aluno (streak, level, totalPoints)
   */
  private static async getStudentProfile(studentId: string): Promise<{
    streak: number;
    totalPoints: number;
    level: number;
  }> {
    try {
      const studentRef = doc(firestore, 'students', studentId);
      const studentDoc = await getDoc(studentRef);

      if (!studentDoc.exists()) {
        console.warn('Perfil do aluno não encontrado, usando defaults');
        return { streak: 0, totalPoints: 0, level: 1 };
      }

      const data = studentDoc.data();
      const profile = data?.profile || {};

      return {
        streak: profile.streak || 0,
        totalPoints: profile.totalPoints || 0,
        level: this.calculateLevel(profile.totalPoints || 0)
      };

    } catch (error) {
      console.warn('Erro ao buscar perfil do aluno, usando defaults:', error);
      return { streak: 0, totalPoints: 0, level: 1 };
    }
  }

  /**
   * Calcula nível baseado em pontos
   */
  private static calculateLevel(points: number): number {
    const baseXP = 100;
    return Math.max(1, Math.floor(Math.log(points / baseXP + 1) / Math.log(1.5)) + 1);
  }

  /**
   * Gera snapshot rápido de desempenho (para dashboard)
   */
  static async generateQuickSnapshot(studentId: string): Promise<{
    completionRate: number;
    weeklyAverage: number;
    bestDay: string;
    trend: 'improving' | 'stable' | 'declining';
    lastUpdated: Date;
  }> {
    try {
      const instances = await ScheduleInstanceService.getStudentActiveInstances(
        studentId,
        { includeProgress: false }
      );

      if (instances.length === 0) {
        return {
          completionRate: 0,
          weeklyAverage: 0,
          bestDay: 'N/A',
          trend: 'stable',
          lastUpdated: new Date()
        };
      }

      // Usar progressCache das instâncias
      let totalActivities = 0;
      let completedActivities = 0;
      let latestBestDay = 0;

      instances.forEach(instance => {
        if (instance.progressCache) {
          totalActivities += instance.progressCache.totalActivities;
          completedActivities += instance.progressCache.completedActivities;

          // Buscar melhor dia do snapshot mais recente
          if (instance.progressCache.lastUpdatedAt) {
            // Em produção, buscaria do PerformanceSnapshot
            // Por enquanto, estimar baseado em dia da semana atual
            latestBestDay = new Date().getDay();
          }
        }
      });

      const completionRate = totalActivities > 0
        ? (completedActivities / totalActivities) * 100
        : 0;

      const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const bestDay = days[latestBestDay] || 'N/A';

      return {
        completionRate,
        weeklyAverage: completionRate, // Simplificado
        bestDay,
        trend: 'stable', // Em produção buscaria do PerformanceSnapshot
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Erro ao gerar quick snapshot:', error);
      throw error;
    }
  }
}