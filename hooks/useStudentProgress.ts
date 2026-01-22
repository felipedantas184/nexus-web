// hooks/useStudentProgress.ts - VERSÃO OTIMIZADA
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ReportService } from '@/lib/services/ReportService';
import { ScheduleInstanceService } from '@/lib/services/ScheduleInstanceService';
import { StudentMetricsService } from '@/lib/services/StudentMetricsService';
import { AchievementUtils } from '@/lib/utils/achievementUtils';
import { 
  PerformanceSnapshot, 
  ScheduleInstance 
} from '@/types/schedule';

interface StudentProgressData {
  // Métricas otimizadas (sem N+1)
  currentMetrics: {
    streak: number;
    totalPoints: number;
    level: number;
    completionRate: number;
    totalActivities: number;
    completedActivities: number;
    timeSpent: number;
  };
  
  // Histórico semanal (PerformanceSnapshot)
  weeklySnapshots: PerformanceSnapshot[];
  
  // Achievements calculados
  achievements: Achievement[];
  
  // Dados de performance (do snapshot)
  performanceTrend: 'improving' | 'stable' | 'declining';
  
  // Insights (do snapshot mais recente)
  insights: {
    strengths: string[];
    challenges: string[];
    recommendations: string[];
  };
  
  // Metadados
  lastUpdated: Date;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number; // 0-100
  // REMOVIDO: unlockedAt para evitar recálculos
}

export function useStudentProgress() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProgressData = useCallback(async () => {
    if (!user || user.role !== 'student') {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Carregando dados otimizados de progresso para:', user.id);

      // 🔥 PARALELISMO: Executar todas as chamadas em paralelo
      const [
        currentMetrics,
        instances,
        snapshots
      ] = await Promise.all([
        // 1. Métricas otimizadas (sem N+1)
        StudentMetricsService.getCurrentWeekMetrics(user.id),
        
        // 2. Instâncias ativas (somente metadados)
        ScheduleInstanceService.getStudentActiveInstances(
          user.id,
          { includeProgress: false, limit: 10 }
        ),
        
        // 3. Snapshots históricos
        ReportService.getStudentSnapshots(user.id, {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          limit: 6 // Apenas últimas 6 semanas
        })
      ]);

      console.log('✅ Dados carregados em paralelo:', {
        metrics: currentMetrics,
        instances: instances.length,
        snapshots: snapshots.length
      });

      // 4. Determinar tendência a partir do snapshot (se disponível)
      const performanceTrend = snapshots.length >= 2 
        ? determineTrendFromSnapshots(snapshots)
        : 'stable';

      // 5. Extrair insights do snapshot mais recente
      const insights = extractInsightsFromSnapshots(snapshots);

      // 6. Calcular achievements baseados em dados reais
      const achievements = AchievementUtils.calculateAchievements(
        user.id,
        instances,
        snapshots,
        currentMetrics
      );

      const progressData: StudentProgressData = {
        currentMetrics,
        weeklySnapshots: snapshots,
        achievements,
        performanceTrend,
        insights,
        lastUpdated: new Date()
      };

      setData(progressData);

    } catch (err: any) {
      console.error('❌ Erro ao carregar progresso:', err);
      setError(err.message || 'Erro ao carregar dados de progresso');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Determina tendência baseada em improvementFromPreviousWeek
  const determineTrendFromSnapshots = (snapshots: PerformanceSnapshot[]): 'improving' | 'stable' | 'declining' => {
    if (snapshots.length < 1) return 'stable';
    
    const latest = snapshots[0];
    
    // Usar improvementFromPreviousWeek que já existe no PerformanceSnapshot
    if (latest.performance.improvementFromPreviousWeek !== undefined) {
      if (latest.performance.improvementFromPreviousWeek > 0.5) return 'improving';
      if (latest.performance.improvementFromPreviousWeek < -0.5) return 'declining';
    }
    
    return 'stable';
  };

  // Extrai insights do snapshot mais recente
  const extractInsightsFromSnapshots = (snapshots: PerformanceSnapshot[]) => {
    const defaultInsights = {
      strengths: [] as string[],
      challenges: [] as string[],
      recommendations: [] as string[]
    };

    if (snapshots.length === 0) return defaultInsights;

    const latest = snapshots[0];
    
    return {
      strengths: latest.insights.strengths.slice(0, 3),
      challenges: latest.insights.challenges.slice(0, 2),
      recommendations: latest.insights.recommendations.slice(0, 3)
    };
  };

  useEffect(() => {
    loadProgressData();
    
    // Recarregar apenas a cada 5 minutos (dados de progresso não mudam tão rápido)
    const interval = setInterval(loadProgressData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadProgressData]);

  return {
    data,
    loading,
    error,
    refresh: loadProgressData
  };
}