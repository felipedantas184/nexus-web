// hooks/useProfessionalInstances.ts - NOVO!
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import { ScheduleInstance } from '@/types/schedule';
import { StudentService } from '@/lib/services/StudentService';

export function useProfessionalInstances() {
  const { user } = useAuth();
  const [instances, setInstances] = useState<ScheduleInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInstances = useCallback(async () => {
    if (!user || user.role === 'student') {
      setInstances([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando instâncias para profissional:', user.id);

      // Opção 1: Buscar todas as instâncias (se profissional tem acesso a todas)
      // Opção 2: Buscar apenas instâncias dos alunos atribuídos

      // Vou implementar Opção 2 (mais segura)

      // 1. Primeiro, buscar alunos atribuídos a este profissional
      const students = await StudentService.getStudentsByProfessionalOrAll(
        user.id,
        user.role,
        { activeOnly: true }
      );

      const studentIds = students.map(s => s.id);

      if (studentIds.length === 0) {
        console.log('ℹ️ Nenhum aluno atribuído a este profissional');
        setInstances([]);
        setLoading(false);
        return;
      }

      console.log(`📋 Buscando instâncias para ${studentIds.length} alunos`);

      // 2. Buscar instâncias para cada aluno (em batches)
      const allInstances: ScheduleInstance[] = [];

      // Processar em batches para evitar muitas queries
      const batchSize = 10;
      for (let i = 0; i < studentIds.length; i += batchSize) {
        const batch = studentIds.slice(i, i + batchSize);

        const promises = batch.map(async (studentId) => {
          const q = query(
            collection(firestore, 'scheduleInstances'),
            where('studentId', '==', studentId),
            where('isActive', '==', true),
            where('status', 'in', ['active', 'paused'])
          );

          const snapshot = await getDocs(q);
          snapshot.forEach(doc => {
            const data = doc.data();
            allInstances.push({
              id: doc.id,
              ...data,
              currentWeekStartDate: data.currentWeekStartDate?.toDate(),
              currentWeekEndDate: data.currentWeekEndDate?.toDate(),
              startedAt: data.startedAt?.toDate(),
              completedAt: data.completedAt?.toDate(),
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate()
            } as ScheduleInstance);
          });
        });

        await Promise.all(promises);
      }

      // Ordenar por data de criação (mais recente primeiro)
      allInstances.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      console.log(`✅ Encontradas ${allInstances.length} instâncias`);
      setInstances(allInstances);

    } catch (err: any) {
      console.error('❌ Erro ao carregar instâncias:', err);
      setError(err.message || 'Erro ao carregar instâncias');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadInstances();
  }, [loadInstances]);

  return {
    instances,
    loading,
    error,
    refresh: loadInstances,
    totalInstances: instances.length,
    activeInstances: instances.filter(i => i.status === 'active').length,
    pausedInstances: instances.filter(i => i.status === 'paused').length
  };
}