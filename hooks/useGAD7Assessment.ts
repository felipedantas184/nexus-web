'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { GAD7Service } from '@/lib/services/GAD7Service';

export function useGAD7Assessment() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [needsAssessment, setNeedsAssessment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se precisa preencher - OTIMIZADO
  const checkAssessmentNeeded = useCallback(async () => {
    if (!user || user.role !== 'student') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Pequeno delay para evitar race conditions
      await new Promise(resolve => setTimeout(resolve, 500));

      const needs = await GAD7Service.needsAssessment(user.id);
      setNeedsAssessment(needs);
    } catch (err: any) {
      console.error('Erro ao verificar GAD-7:', err);
      setError('Não foi possível verificar avaliação pendente');
      setNeedsAssessment(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Salvar avaliação - MANTIDO
  const saveAssessment = useCallback(async (responses: any) => {
    if (!user || user.role !== 'student') return null;

    try {
      const assessmentId = await GAD7Service.saveAssessment(user.id, responses);
      await checkAssessmentNeeded();
      return assessmentId;
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar avaliação');
      return null;
    }
  }, [user, checkAssessmentNeeded]);

  // Marcar como "fazer mais tarde" - OTIMIZADO
  const markForLater = useCallback(async () => {
    if (!user || user.role !== 'student') return;

    try {
      await GAD7Service.markReminder(user.id);
      setNeedsAssessment(false);

      // Re-verificar após 30 minutos (não imediatamente)
      setTimeout(() => {
        checkAssessmentNeeded();
      }, 30 * 60 * 1000);
    } catch (err) {
      console.error('Erro ao marcar lembrete:', err);
    }
  }, [user, checkAssessmentNeeded]);

  // Inicializar - OTIMIZADO
  useEffect(() => {
    if (user?.role === 'student') {
      // Aguardar carregamento completo do dashboard
      const timer = setTimeout(() => {
        checkAssessmentNeeded();
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [user, checkAssessmentNeeded]);

  return {
    // Estado
    loading,
    needsAssessment,
    error,

    // Ações
    saveAssessment,
    markForLater,
    refresh: checkAssessmentNeeded,

    // Dados
    questions: GAD7Service.QUESTIONS,

    // Utilitários
    setNeedsAssessment
  };
}