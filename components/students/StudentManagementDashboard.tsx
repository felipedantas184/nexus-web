'use client';

import React, { useState, useEffect } from 'react';
import { Student } from '@/types/auth';
import { useAuth } from '@/context/AuthContext';
import { StudentService } from '@/lib/services/StudentService';
import {
  FaChartLine,
  FaUsers,
  FaSchool,
  FaGraduationCap,
  FaStar,
  FaFire,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSync,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';

interface StudentManagementDashboardProps {
  isCoordinator: boolean;
}

export default function StudentManagementDashboard({ isCoordinator }: StudentManagementDashboardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, [user, isCoordinator]);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Carregar todos os alunos baseado no role
      const students = await StudentService.getStudentsByProfessionalOrAll(
        user.id,
        user.role,
        { activeOnly: true }
      );

      // Calcular métricas
      const metrics = calculateMetrics(students);
      const trends = calculateTrends(students);
      const schools = groupBySchool(students);
      const grades = groupByGrade(students);

      setDashboardData({
        students,
        metrics,
        trends,
        schools,
        grades,
        topPerformers: getTopPerformers(students),
        needsAttention: getNeedsAttention(students)
      });
    } catch (err: any) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError(err.message || 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (students: Student[]) => {
    const totalPoints = students.reduce((sum, student) => sum + (student.profile.totalPoints || 0), 0);
    const totalStreak = students.reduce((sum, student) => sum + (student.profile.streak || 0), 0);
    const activeStudents = students.filter(s => s.isActive).length;
    const newThisMonth = students.filter(s => {
      const createdAt = new Date(s.createdAt);
      const now = new Date();
      return createdAt.getMonth() === now.getMonth() && 
             createdAt.getFullYear() === now.getFullYear();
    }).length;

    return {
      total: students.length,
      active: activeStudents,
      inactive: students.length - activeStudents,
      averagePoints: students.length > 0 ? Math.round(totalPoints / students.length) : 0,
      averageStreak: students.length > 0 ? (totalStreak / students.length).toFixed(1) : 0,
      newThisMonth,
      completionRate: 78 // Mock - implementar lógica real
    };
  };

  const calculateTrends = (students: Student[]) => {
    // Mock de tendências - implementar lógica real com dados históricos
    return {
      engagement: '+12%',
      points: '+8%',
      completion: '+5%',
      retention: '-3%'
    };
  };

  const groupBySchool = (students: Student[]) => {
    const schoolMap: Record<string, number> = {};
    students.forEach(student => {
      const school = student.profile.school || 'Não informada';
      schoolMap[school] = (schoolMap[school] || 0) + 1;
    });

    return Object.entries(schoolMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const groupByGrade = (students: Student[]) => {
    const gradeMap: Record<string, number> = {};
    students.forEach(student => {
      const grade = student.profile.grade || 'Não informada';
      gradeMap[grade] = (gradeMap[grade] || 0) + 1;
    });

    return Object.entries(gradeMap)
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => b.count - a.count);
  };

  const getTopPerformers = (students: Student[]) => {
    return students
      .filter(s => s.isActive)
      .sort((a, b) => (b.profile.totalPoints || 0) - (a.profile.totalPoints || 0))
      .slice(0, 5)
      .map(student => ({
        id: student.id,
        name: student.name,
        points: student.profile.totalPoints || 0,
        streak: student.profile.streak || 0,
        level: student.profile.level || 1
      }));
  };

  const getNeedsAttention = (students: Student[]) => {
    return students
      .filter(s => s.isActive && (s.profile.streak || 0) < 3)
      .slice(0, 5)
      .map(student => ({
        id: student.id,
        name: student.name,
        streak: student.profile.streak || 0,
        lastActive: '2 dias atrás', // Mock - implementar lógica real
        points: student.profile.totalPoints || 0
      }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Carregando dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <FaExclamationTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Erro ao carregar dashboard</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 mx-auto"
        >
          <FaSync />
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!dashboardData) return null;

  return (
    <div className="space-y-6">
      {/* Header do Dashboard */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
              <FaChartLine className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Dashboard de Alunos
              </h2>
              <p className="text-gray-600">
                {isCoordinator 
                  ? 'Visão geral de todos os alunos da plataforma' 
                  : 'Visão geral dos seus alunos atribuídos'
                }
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Atualizado agora há pouco
          </div>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {dashboardData.metrics.total}
              </div>
              <div className="text-sm text-gray-600">Total de Alunos</div>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <FaUsers className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FaArrowUp className="w-3 h-3 text-green-500" />
            <span className="text-green-600">+{dashboardData.metrics.newThisMonth} este mês</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {dashboardData.metrics.averagePoints}
              </div>
              <div className="text-sm text-gray-600">Pontos Médios</div>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <FaStar className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FaArrowUp className="w-3 h-3 text-green-500" />
            <span className="text-green-600">{dashboardData.trends.points}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {dashboardData.metrics.averageStreak}d
              </div>
              <div className="text-sm text-gray-600">Streak Médio</div>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <FaFire className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FaArrowUp className="w-3 h-3 text-green-500" />
            <span className="text-green-600">{dashboardData.trends.engagement}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {dashboardData.metrics.completionRate}%
              </div>
              <div className="text-sm text-gray-600">Taxa de Conclusão</div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FaCheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FaArrowUp className="w-3 h-3 text-green-500" />
            <span className="text-green-600">{dashboardData.trends.completion}</span>
          </div>
        </div>
      </div>

      {/* Gráficos e Distribuições */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Escola */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaSchool className="text-indigo-500" />
            Distribuição por Escola
          </h3>
          <div className="space-y-4">
            {dashboardData.schools.map((school: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{school.name}</div>
                    <div className="text-sm text-gray-500">{school.count} alunos</div>
                  </div>
                </div>
                <div className="text-lg font-bold text-gray-800">
                  {Math.round((school.count / dashboardData.metrics.total) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribuição por Série */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaGraduationCap className="text-indigo-500" />
            Distribuição por Série
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {dashboardData.grades.map((gradeData: any, index: number) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="text-lg font-bold text-gray-800 mb-1">
                  {gradeData.grade}
                </div>
                <div className="text-sm text-gray-600">{gradeData.count} alunos</div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${(gradeData.count / dashboardData.metrics.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers e Alunos que Precisam de Atenção */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaStar className="text-amber-500" />
            Top Performers
          </h3>
          <div className="space-y-4">
            {dashboardData.topPerformers.map((student: any, index: number) => (
              <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full flex items-center justify-center">
                    <span className="font-bold text-amber-600">{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{student.name}</div>
                    <div className="text-sm text-gray-500">Nível {student.level} • Streak {student.streak}d</div>
                  </div>
                </div>
                <div className="text-lg font-bold text-gray-800">
                  {student.points} pts
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alunos que Precisam de Atenção */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaExclamationTriangle className="text-red-500" />
            Precisam de Atenção
          </h3>
          <div className="space-y-4">
            {dashboardData.needsAttention.map((student: any) => (
              <div key={student.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <FaExclamationTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{student.name}</div>
                    <div className="text-sm text-gray-500">Streak baixo: {student.streak} dia(s)</div>
                  </div>
                </div>
                <div className="text-sm text-red-600">
                  {student.lastActive}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tendências e Insights */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Tendências e Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 bg-green-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <FaArrowUp className="w-4 h-4 text-green-600" />
              <div className="font-medium text-green-800">Engajamento Crescente</div>
            </div>
            <p className="text-sm text-green-700">
              Os alunos estão {dashboardData.trends.engagement} mais engajados este mês
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <FaCalendarAlt className="w-4 h-4 text-blue-600" />
              <div className="font-medium text-blue-800">Novos Alunos</div>
            </div>
            <p className="text-sm text-blue-700">
              +{dashboardData.metrics.newThisMonth} novos alunos este mês
            </p>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <FaFire className="w-4 h-4 text-amber-600" />
              <div className="font-medium text-amber-800">Streak Consistente</div>
            </div>
            <p className="text-sm text-amber-700">
              65% dos alunos mantiveram streak acima de 7 dias
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <FaGraduationCap className="w-4 h-4 text-purple-600" />
              <div className="font-medium text-purple-800">Série Dominante</div>
            </div>
            <p className="text-sm text-purple-700">
              {dashboardData.grades[0]?.grade} tem mais alunos ({dashboardData.grades[0]?.count})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}