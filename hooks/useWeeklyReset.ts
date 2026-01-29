'use client';

import { useState, useCallback } from 'react';
import { WeeklyResetService } from '@/lib/services/WeeklyResetService';
import { WeeklySnapshotService } from '@/lib/services/WeeklySnapshotService';
import { useAuth } from '@/context/AuthContext';

export function useWeeklyReset() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  /**
   * Gera snapshot manualmente (para testes)
   */
  const generateSnapshot = useCallback(async (
    scheduleInstanceId: string,
    weekNumber: number
  ) => {
    if (!user || user.role === 'student') {
      throw new Error('Apenas profissionais podem executar esta ação');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await WeeklySnapshotService.generateSnapshot({
        scheduleInstanceId,
        weekNumber
      });

      setResult(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar snapshot');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Força reset para uma instância (para testes)
   */
  const forceResetInstance = useCallback(async (instanceId: string) => {
    if (!user || user.role === 'student') {
      throw new Error('Apenas profissionais podem executar esta ação');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await WeeklyResetService.forceResetForInstance(instanceId);
      setResult(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Erro ao forçar reset');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Testa processo completo (dry run)
   */
  const testWeeklyReset = useCallback(async () => {
    if (!user || user.role === 'student') {
      throw new Error('Apenas profissionais podem executar esta ação');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await WeeklyResetService.processWeeklyReset({
        dryRun: true,
        batchSize: 5
      });

      setResult(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Erro ao testar reset');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
 * Executa reset completo (equivalente à Cloud Function)
 */
  const executeFullWeeklyReset = useCallback(async () => {
    if (!user || user.role !== 'coordinator') {
      throw new Error('Apenas coordenadores podem executar reset completo');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await WeeklyResetService.executeFullWeeklyReset();
      setResult(result);

      // Log detalhado
      console.log('📊 Resultado do Reset Completo:', result);

      return result;
    } catch (err: any) {
      setError(err.message || 'Erro ao executar reset completo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    loading,
    error,
    result,
    generateSnapshot,
    forceResetInstance,
    testWeeklyReset,
    executeFullWeeklyReset,
    canExecute: user && user.role !== 'student'
  };
}