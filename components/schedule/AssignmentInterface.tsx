// components/schedule/AssignmentInterface.tsx - VERSÃO OTIMIZADA
'use client';

import React, { useState, useEffect } from 'react';
import { AssignScheduleDTO } from '@/types/schedule';
import { Student } from '@/types/auth';
import { useScheduleAssignment } from '@/hooks/useScheduleAssignment';
import {
  FaUser,
  FaCalendarAlt,
  FaFilter,
  FaSearch,
  FaUsers,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaCog,
  FaSchool,
  FaGraduationCap,
  FaUserTie,
  FaGlobe,
  FaShieldAlt,
  FaFire,
  FaStar,
  FaClock,
  FaChartBar,
  FaEye,
  FaEyeSlash,
  FaCalendarPlus,
  FaLayerGroup
} from 'react-icons/fa';
import { TbFilter } from 'react-icons/tb';

interface StudentWithStatus extends Student {
  hasActiveInstance?: boolean;
  canReceiveSchedule: boolean;
  stats?: {
    totalPoints: number;
    streak: number;
    level: number;
  };
  isAssignedToMe: boolean;
  engagementScore?: number; // 0-100
}

interface AssignmentInterfaceProps {
  scheduleId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AssignmentInterface({
  scheduleId,
  onSuccess,
  onCancel
}: AssignmentInterfaceProps) {
  const {
    loadingStudents,
    students,
    schedule,
    activities,
    assigning,
    result,
    loadScheduleData,
    loadStudents,
    assignSchedule,
    clearResult,
    refreshStudents,
    userRole
  } = useScheduleAssignment();

  const getTodayAtMidnight = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const [filteredStudents, setFilteredStudents] = useState<StudentWithStatus[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    grade: 'all',
    school: 'all',
    assignment: 'all',
    engagement: 'all' // 'low', 'medium', 'high'
  });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [assignmentData, setAssignmentData] = useState<AssignScheduleDTO>({
    studentIds: [],
    startDate: getTodayAtMidnight(), // Data de hoje às 00:00
    allowMultiple: true,
    customizations: {}
  });
  const [showFilters, setShowFilters] = useState(false);
  const [grades, setGrades] = useState<string[]>(['all']);
  const [schools, setSchools] = useState<string[]>(['all']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isCoordinator = userRole === 'coordinator';

  const calculateEngagementScore = (student: Student): number => {
    // Pontuação baseada em múltiplos fatores
    const streakScore = Math.min(student.profile.streak * 5, 30);
    const pointsScore = Math.min(student.profile.totalPoints / 100, 40);
    const levelScore = student.profile.level * 10;

    return Math.min(streakScore + pointsScore + levelScore, 100);
  };

  const normalizeStudents = (students: Student[]): StudentWithStatus[] => {
    return students.map(student => {
      const isAssigned = isCoordinator
        ? true
        : student.profile.assignedProfessionals?.includes('current-user-id') || false;

      const engagementScore = calculateEngagementScore(student);

      return {
        ...student,
        hasActiveInstance: false,
        canReceiveSchedule: true,
        isAssignedToMe: isAssigned,
        engagementScore,
        stats: {
          totalPoints: student.profile.totalPoints ?? 0,
          streak: student.profile.streak ?? 0,
          level: student.profile.level ?? 1
        }
      };
    });
  };

  // Carregar dados iniciais
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([
          loadScheduleData(scheduleId),
          loadStudents()
        ]);
      } catch (err: any) {
        console.error('Erro ao inicializar:', err);
        setError(err.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, [scheduleId]);

  // Extrair filtros únicos
  useEffect(() => {
    if (students.length > 0) {
      const uniqueGrades = ['all', ...new Set(students.map(s => s.profile.grade).filter(Boolean))];
      const uniqueSchools = ['all', ...new Set(students.map(s => s.profile.school).filter(Boolean))];
      setGrades(uniqueGrades);
      setSchools(uniqueSchools);
    }
  }, [students]);

  // Aplicar filtros
  useEffect(() => {
    const normalized = normalizeStudents(students);
    let filtered = [...normalized];

    // Busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower) ||
        student.profile.school.toLowerCase().includes(searchLower)
      );
    }

    // Filtros adicionais
    if (filters.grade !== 'all') {
      filtered = filtered.filter(student => student.profile.grade === filters.grade);
    }
    if (filters.school !== 'all') {
      filtered = filtered.filter(student => student.profile.school === filters.school);
    }
    if (filters.engagement !== 'all') {
      filtered = filtered.filter(student => {
        const score = student.engagementScore || 0;
        if (filters.engagement === 'low') return score < 40;
        if (filters.engagement === 'medium') return score >= 40 && score < 70;
        if (filters.engagement === 'high') return score >= 70;
        return true;
      });
    }
    if (!isCoordinator && filters.assignment !== 'all') {
      if (filters.assignment === 'assigned') {
        filtered = filtered.filter(student => student.isAssignedToMe);
      } else if (filters.assignment === 'unassigned') {
        filtered = filtered.filter(student => !student.isAssignedToMe);
      }
    }

    setFilteredStudents(filtered);
  }, [students, filters, isCoordinator]);

  // Funções de manipulação (mantidas iguais)
  const handleStudentSelect = (studentId: string) => {
    const student = filteredStudents.find(s => s.id === studentId);
    if (!student) return;

    if (!isCoordinator && !student.isAssignedToMe) {
      setError('Você só pode selecionar alunos que estão sob sua responsabilidade');
      return;
    }

    setSelectedStudents(prev => {
      const newSelection = prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId];

      setAssignmentData(prev => ({
        ...prev,
        studentIds: newSelection,
        customizations: {
          ...prev.customizations,
          [studentId]: prev.customizations?.[studentId] || {}
        }
      }));

      return newSelection;
    });
  };

  const handleSelectAllAvailable = () => {
    const availableStudents = filteredStudents
      .filter(s => {
        if (!s.canReceiveSchedule) return false;
        if (!isCoordinator && !s.isAssignedToMe) return false;
        return true;
      })
      .map(s => s.id);

    setSelectedStudents(availableStudents);
    setAssignmentData(prev => ({
      ...prev,
      studentIds: availableStudents,
      customizations: availableStudents.reduce((acc, studentId) => ({
        ...acc,
        [studentId]: prev.customizations?.[studentId] || {}
      }), {})
    }));
  };

  const handleDeselectAll = () => {
    setSelectedStudents([]);
    setAssignmentData(prev => ({
      ...prev,
      studentIds: [],
      customizations: {}
    }));
  };

  const handleCustomizationToggle = (studentId: string, activityId: string) => {
    setAssignmentData(prev => {
      const currentCustomizations = prev.customizations?.[studentId] || {};
      const currentExcluded = currentCustomizations.excludedActivities || [];

      const newExcluded = currentExcluded.includes(activityId)
        ? currentExcluded.filter(id => id !== activityId)
        : [...currentExcluded, activityId];

      return {
        ...prev,
        customizations: {
          ...prev.customizations,
          [studentId]: {
            ...currentCustomizations,
            excludedActivities: newExcluded
          }
        }
      };
    });
  };

  const handleSubmit = async () => {
    if (selectedStudents.length === 0) {
      setError('Selecione pelo menos um aluno');
      return;
    }

    if (!assignmentData.startDate) {
      setError('Selecione uma data de início');
      return;
    }

    try {
      setError(null);
      await assignSchedule(scheduleId, assignmentData);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao atribuir cronograma');
    }
  };

  // Componente de Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium">Carregando dados do cronograma...</p>
        <p className="text-sm text-gray-500 mt-2">Preparando interface de atribuição</p>
      </div>
    );
  }

  // Componente de Erro
  if (error && !loadingStudents) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <FaExclamationTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Erro ao carregar dados</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                Tentar novamente
              </button>
              <button
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Card de Informações do Cronograma */}
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-3 rounded-xl ${isCoordinator ? 'bg-gradient-to-r from-purple-100 to-pink-100' : 'bg-gradient-to-r from-indigo-100 to-blue-100'}`}>
                  {isCoordinator ? (
                    <FaGlobe className="w-6 h-6 text-purple-600" />
                  ) : (
                    <FaUsers className="w-6 h-6 text-indigo-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {schedule ? schedule.name : 'Carregando cronograma...'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {schedule?.description || 'Preparando informações do cronograma'}
                  </p>
                </div>
              </div>

              {schedule && (
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                    <FaCalendarAlt className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{schedule.metadata.totalActivities} atividades</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                    <FaClock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {schedule.metadata.estimatedWeeklyHours}h semanais
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                    <FaChartBar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {schedule.category === 'therapeutic' ? 'Terapêutico' :
                        schedule.category === 'educational' ? 'Educacional' : 'Misto'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {isCoordinator ? (
              <div className="flex-shrink-0">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium">
                  <FaShieldAlt className="w-4 h-4" />
                  Modo Coordenador
                </span>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Acesso completo à plataforma
                </p>
              </div>
            ) : (
              <div className="flex-shrink-0">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-full font-medium">
                  <FaUserTie className="w-4 h-4" />
                  Modo Profissional
                </span>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Alunos atribuídos a você
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Painel de Filtros Avançados */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TbFilter className="w-5 h-5 text-indigo-600" />
                Filtros e Busca
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Encontre alunos específicos usando filtros avançados
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {showFilters ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
              <span className="text-sm font-medium">{showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}</span>
            </button>
          </div>
        </div>

        <div className={`p-6 ${showFilters ? 'block' : 'hidden'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaSearch className="inline mr-2" />
                Buscar Alunos
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Nome, email ou escola..."
                />
                <FaSearch className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Filtro por série */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaGraduationCap className="inline mr-2" />
                Série/Ano
              </label>
              <select
                value={filters.grade}
                onChange={(e) => setFilters(prev => ({ ...prev, grade: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {grades.map(grade => (
                  <option key={grade} value={grade}>
                    {grade === 'all' ? 'Todas as séries' : `Série ${grade}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por escola */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaSchool className="inline mr-2" />
                Escola
              </label>
              <select
                value={filters.school}
                onChange={(e) => setFilters(prev => ({ ...prev, school: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {schools.map(school => (
                  <option key={school} value={school}>
                    {school === 'all' ? 'Todas as escolas' : school}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por engajamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaFire className="inline mr-2" />
                Nível de Engajamento
              </label>
              <select
                value={filters.engagement}
                onChange={(e) => setFilters(prev => ({ ...prev, engagement: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Todos os níveis</option>
                <option value="high">Alto engajamento</option>
                <option value="medium">Engajamento médio</option>
                <option value="low">Baixo engajamento</option>
              </select>
            </div>
          </div>

          {/* Filtro por atribuição (condicional) */}
          {!isCoordinator && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaUserTie className="inline mr-2" />
                Atribuição
              </label>
              <select
                value={filters.assignment}
                onChange={(e) => setFilters(prev => ({ ...prev, assignment: e.target.value }))}
                className="w-full md:w-64 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Todos os alunos</option>
                <option value="assigned">Meus alunos</option>
                <option value="unassigned">Não atribuídos a mim</option>
              </select>
            </div>
          )}

          {/* Contadores e Estatísticas */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{filteredStudents.length}</div>
                <div className="text-sm text-gray-600">Alunos filtrados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{selectedStudents.length}</div>
                <div className="text-sm text-gray-600">Selecionados</div>
              </div>
              {!isCoordinator && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredStudents.filter(s => s.isAssignedToMe).length}
                  </div>
                  <div className="text-sm text-gray-600">Meus alunos</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {filteredStudents.filter(s => s.hasActiveInstance).length}
                </div>
                <div className="text-sm text-gray-600">Com cronograma ativo</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {Math.round(filteredStudents.reduce((acc, s) => acc + (s.engagementScore || 0), 0) / filteredStudents.length) || 0}%
                </div>
                <div className="text-sm text-gray-600">Engajamento médio</div>
              </div>
            </div>
          </div>

          {/* Ações em Lote */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleSelectAllAvailable}
              disabled={loadingStudents || filteredStudents.length === 0}
              className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity font-medium flex items-center gap-2"
            >
              <FaCheck className="w-4 h-4" />
              Selecionar Todos Disponíveis
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-5 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Limpar Seleção
            </button>
            <div className="ml-auto">
              <span className="text-sm text-gray-500">
                <FaFire className="inline mr-1 w-3 h-3" />
                Dica: Filtre por engajamento para priorizar alunos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Alunos com Cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Alunos Disponíveis</h3>
          <p className="text-gray-600 text-sm mt-1">
            {selectedStudents.length > 0
              ? `${selectedStudents.length} aluno(s) selecionado(s)`
              : 'Selecione os alunos que receberão o cronograma'}
          </p>
        </div>

        <div className="p-6">
          {loadingStudents ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-3 text-gray-600">Carregando lista de alunos...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <FaUser className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Nenhum aluno encontrado
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {filters.search || filters.grade !== 'all' || filters.school !== 'all' || filters.engagement !== 'all'
                  ? 'Tente ajustar os filtros para encontrar mais alunos.'
                  : isCoordinator
                    ? 'Nenhum aluno cadastrado no sistema. Adicione alunos primeiro.'
                    : 'Nenhum aluno atribuído a você. Solicite atribuições ao coordenador.'}
              </p>
              {(filters.search || filters.grade !== 'all' || filters.school !== 'all') && (
                <button
                  onClick={() => setFilters({ search: '', grade: 'all', school: 'all', assignment: 'all', engagement: 'all' })}
                  className="mt-4 px-4 py-2 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Limpar todos os filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map(student => {
                const isSelectable = isCoordinator || student.isAssignedToMe;
                const engagementScore = student.engagementScore || 0;
                const engagementColor = engagementScore >= 70 ? 'emerald' :
                  engagementScore >= 40 ? 'amber' : 'rose';

                return (
                  <div
                    key={student.id}
                    className={`group relative bg-gradient-to-br from-white to-gray-50 border rounded-2xl p-4 transition-all duration-300 hover:shadow-lg ${selectedStudents.includes(student.id)
                      ? 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100'
                      : 'border-gray-200'
                      } ${!isSelectable ? 'opacity-70' : 'hover:border-indigo-200'}`}
                  >
                    {/* Checkbox */}
                    <div className="absolute top-4 right-4">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentSelect(student.id)}
                        disabled={!student.canReceiveSchedule || !isSelectable}
                        className={`h-5 w-5 rounded border-gray-300 focus:ring-2 focus:ring-indigo-500 ${selectedStudents.includes(student.id)
                          ? 'text-indigo-600 border-indigo-600'
                          : ''
                          } ${!isSelectable ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      />
                    </div>

                    {/* Avatar e Informações Básicas */}
                    <div className="flex items-start gap-4 mb-0">
                      <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center ${student.isAssignedToMe
                        ? 'bg-gradient-to-br from-indigo-100 to-blue-100'
                        : 'bg-gray-100'
                        }`}>
                        <FaUser className={`w-7 h-7 ${student.isAssignedToMe ? 'text-indigo-600' : 'text-gray-600'
                          }`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900 truncate">
                            {student.name}
                          </h4>
                          {student.hasActiveInstance && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                              <FaExclamationTriangle className="w-3 h-3" />
                              Ativo
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 truncate mb-2">
                          {student.email}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FaSchool className="w-3 h-3" />
                            {student.profile.school}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <FaGraduationCap className="w-3 h-3" />
                            {student.profile.grade}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status e Ações */}
                    <div className="space-y-3">
                      {!student.isAssignedToMe && isCoordinator && (
                        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                          <span className="font-medium">Não atribuído a você</span>
                          <p className="text-xs mt-0.5">Pode atribuir como coordenador</p>
                        </div>
                      )}
                    </div>

                    {/* Overlay de Não Selecionável */}
                    {!isSelectable && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <div className="text-center p-4">
                          <FaUserTie className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-600">Não atribuído a você</p>
                          <p className="text-xs text-gray-500">Apenas coordenadores podem atribuir</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Configurações de Atribuição */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FaLayerGroup className="w-5 h-5 text-indigo-600" />
            Configurações de Atribuição
          </h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Data de Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <FaCalendarPlus className="inline mr-2" />
                Data de Início do Cronograma
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={assignmentData.startDate.toISOString().split('T')[0]}
                  onChange={(e) => setAssignmentData(prev => ({
                    ...prev,
                    startDate: new Date(e.target.value)
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Configurações Adicionais */}
            <div className="space-y-6">
              {/* Contador de Selecionados */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-indigo-800">Alunos selecionados</div>
                    <div className="text-2xl font-bold text-indigo-900">{selectedStudents.length}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-indigo-800">Status</div>
                    <div className={`text-sm font-medium ${selectedStudents.length === 0 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                      {selectedStudents.length === 0 ? 'Nenhum selecionado' : 'Pronto para atribuir'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback e Mensagens */}
      {!isCoordinator && selectedStudents.some(studentId => {
        const student = filteredStudents.find(s => s.id === studentId);
        return student && !student.isAssignedToMe;
      }) && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <FaExclamationTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-amber-800 text-lg mb-1">
                    Permissões Insuficientes
                  </h4>
                  <p className="text-amber-700 mb-3">
                    Você selecionou alunos que não estão sob sua responsabilidade.
                    Apenas coordenadores podem atribuir cronogramas para alunos não atribuídos.
                  </p>
                  <button
                    onClick={() => {
                      const validStudents = selectedStudents.filter(studentId => {
                        const student = filteredStudents.find(s => s.id === studentId);
                        return student && student.isAssignedToMe;
                      });
                      setSelectedStudents(validStudents);
                    }}
                    className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
                  >
                    Remover alunos não atribuídos
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Resultado da Atribuição */}
      {result && (
        <div className={`animate-in fade-in slide-in-from-bottom-4 rounded-2xl p-8 ${result.failed.length === 0
          ? 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200'
          : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'
          }`}>
          <div className="flex items-start gap-4 mb-6">
            {result.failed.length === 0 ? (
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <FaCheck className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
            ) : (
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <FaExclamationTriangle className="w-8 h-8 text-amber-600" />
                </div>
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">
                {result.failed.length === 0
                  ? '✅ Atribuição Concluída com Sucesso!'
                  : '⚠️ Atribuição Parcialmente Concluída'}
              </h3>
              <p className="text-gray-700">
                {result.failed.length === 0
                  ? 'Todos os alunos selecionados receberam o cronograma com sucesso.'
                  : 'Alguns alunos não puderam receber o cronograma. Veja os detalhes abaixo.'}
              </p>
            </div>
          </div>

          {result.successful.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaCheck className="w-4 h-4 text-emerald-600" />
                <span>{result.successful.length} aluno(s) atribuído(s) com sucesso:</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.successful.slice(0, 6).map(item => {
                  const student = students.find(s => s.id === item.studentId);
                  return (
                    <div key={item.studentId} className="bg-white/50 rounded-xl p-4 border border-gray-200">
                      <div className="font-medium text-gray-900">{student?.name || 'Aluno'}</div>
                      <div className="text-sm text-gray-600 mt-1">{student?.email}</div>
                    </div>
                  );
                })}
                {result.successful.length > 6 && (
                  <div className="bg-white/50 rounded-xl p-4 border border-gray-200 flex items-center justify-center">
                    <span className="text-gray-600">+{result.successful.length - 6} alunos</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {result.failed.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaExclamationTriangle className="w-4 h-4 text-amber-600" />
                <span>{result.failed.length} aluno(s) falharam na atribuição:</span>
              </h4>
              <div className="space-y-3">
                {result.failed.map(item => {
                  const student = students.find(s => s.id === item.studentId);
                  return (
                    <div key={item.studentId} className="bg-white/50 rounded-xl p-4 border border-amber-200">
                      <div className="font-medium text-amber-800">{student?.name || item.studentId}</div>
                      <div className="text-sm text-amber-700 mt-1">{item.error}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <button
                onClick={clearResult}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Limpar resultado
              </button>
              <button
                onClick={() => refreshStudents()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Atualizar lista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mensagens de Erro */}
      {error && !result && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <FaExclamationTriangle className="w-6 h-6 text-red-600 mt-1" />
              <div>
                <h4 className="font-semibold text-red-800 mb-1">Erro na Atribuição</h4>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ações Finais */}
      <div className="bottom-6 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium hover:border-gray-400"
                disabled={assigning}
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <div className="text-sm text-gray-600">
                {selectedStudents.length} aluno(s) selecionado(s)
              </div>
              <div className="text-xs text-gray-500">
                {activities.length} atividades cada
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={assigning || selectedStudents.length === 0}
              className={`px-8 py-4 rounded-xl font-bold transition-all flex items-center gap-3 ${assigning
                ? 'opacity-70 cursor-not-allowed'
                : 'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                } ${isCoordinator
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white'
                }`}
            >
              {assigning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Atribuindo...
                </>
              ) : (
                <>
                  {isCoordinator ? <FaGlobe className="w-5 h-5" /> : <FaCheck className="w-5 h-5" />}
                  <span>
                    Atribuir Cronograma
                    <span className="block text-sm font-normal opacity-90">
                      {selectedStudents.length} aluno(s) selecionado(s)
                    </span>
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}