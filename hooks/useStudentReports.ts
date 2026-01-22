// hooks/useStudentReports.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ReportService } from '@/lib/services/ReportService';
import { useAuth } from '@/context/AuthContext';

export function useStudentReports(studentId?: string) {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const targetStudentId = studentId || (user?.role === 'student' ? user.id : null);

  const loadReports = useCallback(async () => {
    if (!targetStudentId) {
      setReports([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const report = await ReportService.generateStudentReport(targetStudentId, {
        includeDetailedData: true
      });
      
      setReports([report]); // Para compatibilidade com array
      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar relatórios:', err);
      setError(err.message || 'Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  }, [targetStudentId]);

  const generateComparativeReport = useCallback(async (
    studentIds: string[],
    period: 'week' | 'month' | 'quarter' = 'month'
  ) => {
    if (!user || user.role === 'student') {
      throw new Error('Apenas profissionais podem gerar relatórios comparativos');
    }

    try {
      return await ReportService.generateComparativeReport(
        studentIds,
        user.id,
        period
      );
    } catch (err: any) {
      console.error('Erro ao gerar relatório comparativo:', err);
      throw err;
    }
  }, [user]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return {
    reports,
    loading,
    error,
    refresh: loadReports,
    generateComparativeReport,
    hasReports: reports.length > 0
  };
}