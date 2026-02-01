// hooks/useStudentSchedule.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ScheduleInstanceService } from '@/lib/services/ScheduleInstanceService';
import { ProgressService } from '@/lib/services/ProgressService';
import { ScheduleInstance, ActivityProgress } from '@/types/schedule';
import { useAuth } from '@/context/AuthContext';
import { DateUtils } from '@/lib/utils/dateUtils';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { firestore } from '@/firebase/config';

export function useStudentSchedule() {
  const { user } = useAuth();
  const [instances, setInstances] = useState<(ScheduleInstance & { progress?: ActivityProgress[] })[]>([]);
  const [todayActivities, setTodayActivities] = useState<ActivityProgress[]>([]);
  const [weekActivities, setWeekActivities] = useState<ActivityProgress[]>([]); // NOVO
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user || user.role !== 'student') {
      console.log('🚫 Usuário não é aluno ou não logado');
      setInstances([]);
      setTodayActivities([]);
      setWeekActivities([]); // NOVO
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Carregando dados do aluno:', user.id);

      // Carregar instâncias ativas
      const activeInstances = await ScheduleInstanceService.getStudentActiveInstances(
        user.id,
        { includeProgress: true, limit: 5 }
      );
      console.log('📋 Instâncias carregadas:', activeInstances.length);
      setInstances(activeInstances);

      // Carregar atividades de hoje
      console.log('📅 Buscando atividades de hoje...');
      const today = await ScheduleInstanceService.getTodayActivities(user.id);
      console.log('✅ Atividades de hoje encontradas:', today.length);
      setTodayActivities(today);

      // NOVO: Carregar atividades da semana atual
      console.log('📅 Buscando atividades da semana...');
      const week = await ScheduleInstanceService.getWeekActivities(user.id);
      console.log('✅ Atividades da semana encontradas:', week.length);
      setWeekActivities(week);

      setError(null);

    } catch (err: any) {
      console.error('❌ Erro ao carregar cronogramas do aluno:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const startActivity = useCallback(async (progressId: string) => {
    if (!user) return;

    try {
      await ProgressService.startActivity(progressId, user.id);
      await loadData(); // Recarregar dados
      return true;
    } catch (err: any) {
      console.error('Erro ao iniciar atividade:', err);
      throw err;
    }
  }, [user, loadData]);

  const completeActivity = useCallback(async (progressId: string, completionData?: any) => {
    if (!user) return;

    try {
      const result = await ProgressService.completeActivity(
        progressId,
        user.id,
        completionData
      );
      await loadData(); // Recarregar dados
      return result;
    } catch (err: any) {
      console.error('Erro ao completar atividade:', err);
      throw err;
    }
  }, [user, loadData]);

  const skipActivity = useCallback(async (progressId: string, reason?: string) => {
    if (!user) return;

    try {
      await ProgressService.skipActivity(progressId, user.id, reason);
      await loadData();
      return true;
    } catch (err: any) {
      console.error('Erro ao pular atividade:', err);
      throw err;
    }
  }, [user, loadData]);

  useEffect(() => {
    loadData();

    // Recarregar a cada 5 minutos para manter dados atualizados
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Adicione listener em tempo real para atividades
  useEffect(() => {
    if (!user || user.role !== 'student') return;

    // Listener para atividades de hoje em tempo real
    const setupTodayActivitiesListener = async () => {
      try {
        // Buscar instâncias primeiro
        const activeInstances = await ScheduleInstanceService.getStudentActiveInstances(
          user.id,
          { includeProgress: false, limit: 5 }
        );
        setInstances(activeInstances);

        // Para cada instância, adicionar listener de progresso
        const today = new Date();
        const todayDayOfWeek = DateUtils.getDayOfWeek(today);

        const unsubscribers: (() => void)[] = [];

        for (const instance of activeInstances) {
          const q = query(
            collection(firestore, 'activityProgress'),
            where('scheduleInstanceId', '==', instance.id),
            where('weekNumber', '==', instance.currentWeekNumber),
            where('dayOfWeek', '==', todayDayOfWeek),
            where('isActive', '==', true)
          );

          const unsubscribe = onSnapshot(q, (snapshot) => {
            const todayActivities: ActivityProgress[] = [];

            snapshot.forEach(doc => {
              const data = doc.data();
              const progress: any = {  //COMENTADO IMPORTANTE
                id: doc.id,
                ...data,
                scheduledDate: data.scheduledDate?.toDate(),
                startedAt: data.startedAt?.toDate(),
                completedAt: data.completedAt?.toDate(),
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
                studentId: user.id, // ← Garantir que studentId seja o atual
                activitySnapshot: {
                  ...data.activitySnapshot,
                  createdAt: data.activitySnapshot?.createdAt?.toDate(),
                  updatedAt: data.activitySnapshot?.updatedAt?.toDate()
                }
              };
              todayActivities.push(progress);
            });

            setTodayActivities(prev => {
              // Atualizar mantendo ordenação
              const updated = [...prev];
              todayActivities.forEach(newActivity => {
                const index = updated.findIndex(a => a.id === newActivity.id);
                if (index > -1) {
                  updated[index] = newActivity;
                } else {
                  updated.push(newActivity);
                }
              });
              return updated.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
            });
          });

          unsubscribers.push(unsubscribe);
        }

        return () => {
          unsubscribers.forEach(unsubscribe => unsubscribe());
        };

      } catch (err: any) {
        console.error('Erro ao configurar listener:', err);
        setError(err.message);
      }
    };

    const cleanup = setupTodayActivitiesListener();

    return () => {
      if (cleanup) cleanup.then(fn => fn?.());
    };
  }, [user]);

  return {
    instances,
    todayActivities,
    weekActivities,
    loading,
    error,
    refresh: loadData,
    startActivity,
    completeActivity,
    skipActivity,
    hasActiveSchedules: instances.length > 0,
    totalTodayActivities: todayActivities.length
  };
}