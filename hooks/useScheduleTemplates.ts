// hooks/useScheduleTemplates.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ScheduleService } from '@/lib/services/ScheduleService';
import { ScheduleTemplate } from '@/types/schedule';
import { useAuth } from '@/context/AuthContext';

export function useScheduleTemplates(
  options: {
    category?: string;
    activeOnly?: boolean;
    limit?: number;
  } = {}
) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchedules = useCallback(async () => {
    if (!user || user.role === 'student') {
      setSchedules([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const professionalId = user.id;
      const data = await ScheduleService.listProfessionalSchedules(
        professionalId,
        {
          category: options.category as any,
          activeOnly: options.activeOnly,
          limit: options.limit
        }
      );
      setSchedules(data);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar cronogramas:', err);
      setError(err.message || 'Erro ao carregar cronogramas');
    } finally {
      setLoading(false);
    }
  }, [user, options.category, options.activeOnly, options.limit]);

  const refresh = useCallback(() => {
    loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  return {
    schedules,
    loading,
    error,
    refresh,
    isEmpty: schedules.length === 0 && !loading
  };
}