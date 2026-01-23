// MODIFICAR o hook completo:
'use client';

import { useState, useEffect, useCallback } from 'react';
import { SimpleReportService } from '@/lib/services/SimpleReportService';
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

      // 🔥 USAR O NOVO SERVIÇO SIMPLIFICADO
      const report = await SimpleReportService.generateStudentReport(targetStudentId);

      // Converter para formato esperado pelos componentes
      const formattedReport = {
        summary: {
          averageScore: report.overall.averageCompletionRate,
          averageCompletionRate: report.overall.averageCompletionRate,
          totalWeeks: report.weeklyReports.length,
          latestWeek: report.weeklyReports[0]?.weekNumber || 0,
          trend: report.trend,
          bestWeek: report.weeklyReports.reduce((best, current) =>
            current.summary.averageScore > best.summary.averageScore ? current : best
          )?.weekNumber || 0
        },
        weeklyTrends: report.weeklyReports.map(week => ({
          weekNumber: week.weekNumber,
          completionRate: week.summary.completionRate,
          averageScore: week.summary.averageScore,
          trendDirection: report.trend
        })),
        insights: report.weeklyReports[0]?.insights || {
          detectedPatterns: [],
          predictedNextWeek: 'Estável',
          confidence: 0.75
        },
        recommendations: report.weeklyReports[0]?.insights?.recommendations || []
      };

      setReports([formattedReport]);
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
      return await SimpleReportService.generateComparativeReport(
        studentIds,
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