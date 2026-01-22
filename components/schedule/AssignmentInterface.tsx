// components/schedule/AssignmentInterface.tsx - ATUALIZADO
'use client';

import React, { useState, useEffect } from 'react';
import {
  AssignScheduleDTO
} from '@/types/schedule';
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
  FaShieldAlt
} from 'react-icons/fa';

interface StudentWithStatus extends Student {
  hasActiveInstance?: boolean;
  canReceiveSchedule: boolean;
  stats?: {
    totalPoints: number;
    streak: number;
    level: number;
  };
  isAssignedToMe: boolean;
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

  const [filteredStudents, setFilteredStudents] = useState<StudentWithStatus[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    grade: 'all',
    school: 'all',
    assignment: 'all' // 'all', 'assigned', 'unassigned'
  });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [assignmentData, setAssignmentData] = useState<AssignScheduleDTO>({
    studentIds: [],
    startDate: new Date(),
    allowMultiple: false,
    customizations: {}
  });

  const [grades, setGrades] = useState<string[]>(['all']);
  const [schools, setSchools] = useState<string[]>(['all']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isCoordinator = userRole === 'coordinator';

  const normalizeStudents = (students: Student[]): StudentWithStatus[] => {
    return students.map(student => {
      const isAssigned = isCoordinator 
        ? true // Coordenador pode ver todos
        : student.profile.assignedProfessionals?.includes('current-user-id') || false;

      return {
        ...student,
        hasActiveInstance: false,
        canReceiveSchedule: true,
        isAssignedToMe: isAssigned,
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

        // Carregar dados do cronograma
        await loadScheduleData(scheduleId);

        // Carregar alunos
        await loadStudents();

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

    // Filtro de busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower) ||
        student.profile.school.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por série
    if (filters.grade !== 'all') {
      filtered = filtered.filter(
        student => student.profile.grade === filters.grade
      );
    }

    // Filtro por escola
    if (filters.school !== 'all') {
      filtered = filtered.filter(
        student => student.profile.school === filters.school
      );
    }

    // Filtro por atribuição (apenas para não-coordenadores)
    if (!isCoordinator && filters.assignment !== 'all') {
      if (filters.assignment === 'assigned') {
        filtered = filtered.filter(student => student.isAssignedToMe);
      } else if (filters.assignment === 'unassigned') {
        filtered = filtered.filter(student => !student.isAssignedToMe);
      }
    }

    setFilteredStudents(filtered);
  }, [students, filters, isCoordinator]);

  const handleStudentSelect = (studentId: string) => {
    const student = filteredStudents.find(s => s.id === studentId);

    if (!student) return;

    // Verificar permissões para selecionar
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

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao atribuir cronograma');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Carregando dados...</span>
      </div>
    );
  }

  if (error && !loadingStudents) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaExclamationTriangle className="text-red-500" />
          <h3 className="font-semibold text-red-800">Erro ao carregar dados</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Permissões */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isCoordinator ? 'bg-purple-100' : 'bg-indigo-100'}`}>
              {isCoordinator ? (
                <FaGlobe className="w-5 h-5 text-purple-600" />
              ) : (
                <FaUsers className="w-5 h-5 text-indigo-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {schedule ? `Atribuir: ${schedule.name}` : 'Atribuir Cronograma'}
              </h2>
              <div className="flex items-center gap-3">
                <p className="text-gray-500">
                  {schedule?.description || 'Selecione os alunos que receberão este cronograma'}
                </p>
                {isCoordinator && (
                  <span className="px-2 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center gap-1">
                    <FaShieldAlt className="w-3 h-3" />
                    Modo Coordenador
                  </span>
                )}
              </div>
            </div>
          </div>

          {schedule && (
            <div className="text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <FaCalendarAlt />
                <span>{schedule.metadata.totalActivities} atividades</span>
              </div>
            </div>
          )}
        </div>

        {/* Informação de Permissões */}
        {isCoordinator ? (
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-3">
              <FaGlobe className="text-purple-600" />
              <div>
                <h3 className="font-semibold text-purple-800">
                  Modo Coordenador Ativado
                </h3>
                <p className="text-purple-700 text-sm">
                  Você pode visualizar e atribuir cronogramas para <strong>TODOS os alunos</strong> da plataforma.
                  {!isCoordinator && ' Apenas coordenadores têm esta permissão.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-center gap-3">
              <FaUserTie className="text-indigo-600" />
              <div>
                <h3 className="font-semibold text-indigo-800">
                  Modo Profissional
                </h3>
                <p className="text-indigo-700 text-sm">
                  Você pode atribuir cronogramas apenas para <strong>alunos atribuídos a você</strong>.
                  {selectedStudents.length > 0 && filteredStudents.some(s => !s.isAssignedToMe) && (
                    <span className="block mt-1 text-amber-700">
                      ⚠️ Alguns alunos selecionados não estão sob sua responsabilidade e serão ignorados.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Busca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaSearch className="inline mr-2" />
              Buscar Alunos
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Nome, email ou escola..."
            />
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              {grades.map(grade => (
                <option key={grade} value={grade}>
                  {grade === 'all' ? 'Todas as séries' : grade}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              {schools.map(school => (
                <option key={school} value={school}>
                  {school === 'all' ? 'Todas as escolas' : school}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por atribuição (apenas para não-coordenadores) */}
          {!isCoordinator && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaUserTie className="inline mr-2" />
                Atribuição
              </label>
              <select
                value={filters.assignment}
                onChange={(e) => setFilters(prev => ({ ...prev, assignment: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Todos os alunos</option>
                <option value="assigned">Meus alunos</option>
                <option value="unassigned">Não atribuídos a mim</option>
              </select>
            </div>
          )}

          {/* Ações em lote */}
          <div className="flex items-end">
            <div className="flex gap-2 w-full">
              <button
                onClick={handleSelectAllAvailable}
                className="flex-1 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loadingStudents || filteredStudents.length === 0}
              >
                Selecionar Todos
              </button>
              <button
                onClick={handleDeselectAll}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        {/* Contadores */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <div className="text-gray-600">
            <span className="font-medium">{filteredStudents.length}</span> alunos filtrados
          </div>
          <div className="text-gray-600">
            <span className="font-medium">{selectedStudents.length}</span> selecionados
          </div>
          {!isCoordinator && (
            <div className="text-gray-600">
              <span className="font-medium">
                {filteredStudents.filter(s => s.isAssignedToMe).length}
              </span> meus alunos
            </div>
          )}
          <div className="text-gray-600">
            <span className="font-medium">
              {filteredStudents.filter(s => s.hasActiveInstance).length}
            </span> com cronograma ativo
          </div>
          {isCoordinator && (
            <div className="text-green-600 font-medium">
              <FaGlobe className="inline mr-1" />
              Modo Coordenador: Vendo todos os alunos
            </div>
          )}
        </div>
      </div>

      {/* Lista de Alunos */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
          {loadingStudents ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Carregando alunos...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FaUser className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Nenhum aluno encontrado
              </h3>
              <p className="text-gray-500">
                {filters.search || filters.grade !== 'all' || filters.school !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : isCoordinator 
                    ? 'Nenhum aluno cadastrado no sistema'
                    : 'Nenhum aluno atribuído a você'}
              </p>
            </div>
          ) : (
            filteredStudents.map(student => {
              const isSelectable = isCoordinator || student.isAssignedToMe;
              
              return (
                <div key={student.id} className={`p-4 hover:bg-gray-50 ${!isSelectable ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentSelect(student.id)}
                        disabled={!student.canReceiveSchedule || !isSelectable}
                        className={`h-4 w-4 rounded focus:ring-indigo-500 ${
                          !isSelectable ? 'cursor-not-allowed' : ''
                        }`}
                      />

                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          student.isAssignedToMe ? 'bg-indigo-100' : 'bg-gray-100'
                        }`}>
                          <FaUser className={`w-5 h-5 ${student.isAssignedToMe ? 'text-indigo-600' : 'text-gray-600'}`} />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-800 truncate">
                            {student.name}
                          </h4>

                          {student.hasActiveInstance && (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                              Cronograma ativo
                            </span>
                          )}

                          {!student.isAssignedToMe && isCoordinator && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                              Não atribuído a você
                            </span>
                          )}

                          {student.profile.level && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Nível {student.profile.level}
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-500 mb-1">
                          {student.email} • {student.profile.school}
                        </div>

                        <div className="flex gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FaGraduationCap className="w-3 h-3" />
                            {student.profile.grade}
                          </span>
                          <span>•</span>
                          <span>{student.profile.totalPoints || 0} pontos</span>
                          <span>•</span>
                          <span>Streak: {student.profile.streak || 0} dias</span>
                          {!student.isAssignedToMe && (
                            <>
                              <span>•</span>
                              <span className="text-gray-400">
                                {student.profile.assignedProfessionals?.length || 0} prof.
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col items-end">
                      {student.hasActiveInstance ? (
                        <div className="text-sm text-yellow-600 flex items-center gap-1">
                          <FaExclamationTriangle />
                          Já possui
                        </div>
                      ) : student.canReceiveSchedule ? (
                        <div className={`text-sm flex items-center gap-1 ${
                          isSelectable ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          <FaCheck />
                          {isSelectable ? 'Disponível' : 'Não atribuído'}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">
                          Indisponível
                        </div>
                      )}

                      {!student.isAssignedToMe && isCoordinator && (
                        <div className="mt-2 text-xs text-gray-500">
                          Pode atribuir
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personalizações (se selecionado) */}
                  {selectedStudents.includes(student.id) && activities.length > 0 && (
                    <div className="mt-3 pl-7 border-t pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FaCog className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          Personalizações para {student.name}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 mb-2">
                        Selecione atividades para excluir deste aluno:
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {activities.slice(0, 4).map(activity => {
                          const isExcluded = assignmentData.customizations?.[student.id]
                            ?.excludedActivities?.includes(activity.id);

                          return (
                            <label
                              key={activity.id}
                              className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isExcluded}
                                onChange={() => handleCustomizationToggle(student.id, activity.id)}
                                className="rounded border-gray-300 text-indigo-600"
                              />
                              <span className="text-sm truncate">
                                {activity.title} ({['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][activity.dayOfWeek]})
                              </span>
                            </label>
                          );
                        })}

                        {activities.length > 4 && (
                          <div className="text-sm text-gray-500 italic">
                            +{activities.length - 4} outras atividades
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Configurações de Atribuição */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Configurações de Atribuição</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data de Início */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaCalendarAlt className="inline mr-2" />
              Data de Início
            </label>
            <input
              type="date"
              value={assignmentData.startDate.toISOString().split('T')[0]}
              onChange={(e) => setAssignmentData(prev => ({
                ...prev,
                startDate: new Date(e.target.value)
              }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="mt-1 text-sm text-gray-500">
              O cronograma começará na semana desta data
            </p>
          </div>

          {/* Permitir múltiplos cronogramas */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={assignmentData.allowMultiple || false}
                onChange={(e) => setAssignmentData(prev => ({
                  ...prev,
                  allowMultiple: e.target.checked
                }))}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="font-medium text-gray-700">Permitir múltiplos cronogramas ativos</div>
                <div className="text-sm text-gray-500">
                  Aluno poderá ter este e outros cronogramas simultaneamente
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Mensagens de Aviso */}
      {!isCoordinator && selectedStudents.some(studentId => {
        const student = filteredStudents.find(s => s.id === studentId);
        return student && !student.isAssignedToMe;
      }) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="text-amber-500" />
            <div>
              <h4 className="font-medium text-amber-800">Aviso de Permissão</h4>
              <p className="text-sm text-amber-700">
                Você selecionou alunos que não estão sob sua responsabilidade. 
                Apenas coordenadores podem atribuir cronogramas para alunos não atribuídos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Resultado da Atribuição */}
      {result && (
        <div className={`rounded-xl p-6 ${result.failed.length === 0
          ? 'bg-green-50 border border-green-200'
          : 'bg-yellow-50 border border-yellow-200'
          }`}>
          <div className="flex items-center gap-3 mb-4">
            {result.failed.length === 0 ? (
              <FaCheck className="w-5 h-5 text-green-600" />
            ) : (
              <FaExclamationTriangle className="w-5 h-5 text-yellow-600" />
            )}
            <h3 className="font-semibold">
              {result.failed.length === 0
                ? '✅ Atribuição Concluída com Sucesso!'
                : '⚠️ Atribuição Parcialmente Concluída'}
            </h3>
          </div>

          {result.successful.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">
                <strong>{result.successful.length}</strong> aluno(s) atribuído(s) com sucesso:
              </div>
              <div className="space-y-1">
                {result.successful.map(item => (
                  <div key={item.studentId} className="text-sm text-gray-700">
                    • {students.find(s => s.id === item.studentId)?.name || item.studentId}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.failed.length > 0 && (
            <div>
              <div className="text-sm text-gray-600 mb-2">
                <strong>{result.failed.length}</strong> aluno(s) falharam na atribuição:
              </div>
              <div className="space-y-1">
                {result.failed.map(item => (
                  <div key={item.studentId} className="text-sm text-red-700">
                    • {students.find(s => s.id === item.studentId)?.name || item.studentId}: {item.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={clearResult}
            className="mt-4 text-sm text-gray-600 hover:text-gray-800"
          >
            Limpar resultado
          </button>
        </div>
      )}

      {/* Mensagens de Erro */}
      {error && !result && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex justify-between">
        <div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={assigning}
            >
              Cancelar
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={assigning || selectedStudents.length === 0}
            className={`px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 ${
              isCoordinator 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
            }`}
          >
            {assigning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Atribuindo...
              </>
            ) : (
              <>
                {isCoordinator ? <FaGlobe /> : <FaCheck />}
                Atribuir a {selectedStudents.length} Aluno(s)
                {isCoordinator && ' (Modo Coordenador)'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}