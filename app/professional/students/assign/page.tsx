'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { StudentService } from '@/lib/services/StudentService';
import { ProfessionalService } from '@/lib/services/ProfessionalService';
import { Student, Professional } from '@/types/auth';
import {
  FaArrowLeft,
  FaUsers,
  FaUserPlus,
  FaUserMinus,
  FaSearch,
  FaFilter,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaUserFriends,
  FaSync,
  FaGlobe,
  FaUserTie
} from 'react-icons/fa';

export default function BulkAssignmentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados
  const [students, setStudents] = useState<Student[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [assignmentType, setAssignmentType] = useState<'add' | 'remove'>('add');
  const [filters, setFilters] = useState({
    search: '',
    grade: 'all',
    school: 'all',
    currentAssignment: 'all'
  });

  const isCoordinator = user?.role === 'coordinator';

  useEffect(() => {
    if (!isCoordinator) {
      router.push('/professional/students');
      return;
    }
    loadData();
  }, [isCoordinator]);

  const loadData = async () => {
    if (!user || !isCoordinator) return;

    setLoading(true);
    setError(null);

    try {
      // Carregar todos os alunos
      const studentsData = await StudentService.getStudentsByProfessionalOrAll(
        user.id,
        user.role,
        { activeOnly: true }
      );

      // Carregar todos os profissionais
      const professionalsData = await ProfessionalService.getAllProfessionals();

      setStudents(studentsData);
      setProfessionals(professionalsData.filter(p => p.id !== user.id));

      // Definir profissional atual como primeira opção
      if (professionalsData.length > 0) {
        setSelectedProfessional(professionalsData[0].id);
      }

    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    const availableStudents = filteredStudents
      .filter(student => {
        const isAssigned = student.profile.assignedProfessionals?.includes(selectedProfessional);
        return assignmentType === 'add' ? !isAssigned : isAssigned;
      })
      .map(s => s.id);

    setSelectedStudents(availableStudents);
  };

  const handleDeselectAll = () => {
    setSelectedStudents([]);
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSubmit = async () => {
    if (selectedStudents.length === 0) {
      setError('Selecione pelo menos um aluno');
      return;
    }

    if (!selectedProfessional) {
      setError('Selecione um profissional');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const professional = professionals.find(p => p.id === selectedProfessional);
      if (!professional) {
        throw new Error('Profissional não encontrado');
      }

      // Executar atribuição/remoção em massa
      const results = await (assignmentType === 'add'
        ? StudentService.bulkAssignStudents(selectedStudents, selectedProfessional)
        : StudentService.bulkRemoveStudents(selectedStudents, selectedProfessional));

      const successful = results.success.length;
      const failed = results.failed.length;

      if (failed > 0) {
        const errorMessages = results.failed.map(f => `${f.studentId}: ${f.error}`).join(', ');
        setError(`${successful} operações bem-sucedidas, ${failed} falhas. Detalhes: ${errorMessages}`);
      } else {
        alert(`${assignmentType === 'add' ? 'Atribuição' : 'Remoção'} realizada com sucesso para ${successful} aluno(s)!`);

        // Recarregar dados para refletir as mudanças
        await loadData();
        setSelectedStudents([]);

        // Opcional: navegar de volta
        // router.push('/professional/students');
      }

    } catch (err: any) {
      setError(err.message || 'Erro ao processar atribuição');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!student.name.toLowerCase().includes(searchLower) &&
        !student.email.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    if (filters.grade !== 'all' && student.profile.grade !== filters.grade) {
      return false;
    }

    if (filters.school !== 'all' && student.profile.school !== filters.school) {
      return false;
    }

    if (filters.currentAssignment !== 'all') {
      const isAssigned = student.profile.assignedProfessionals?.includes(selectedProfessional);
      if (filters.currentAssignment === 'assigned' && !isAssigned) return false;
      if (filters.currentAssignment === 'unassigned' && isAssigned) return false;
    }

    return true;
  });

  const getStudentStatus = (student: Student) => {
    const isAssigned = student.profile.assignedProfessionals?.includes(selectedProfessional);
    return {
      isAssigned,
      canSelect: assignmentType === 'add' ? !isAssigned : isAssigned,
      assignedCount: student.profile.assignedProfessionals?.length || 0
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Carregando dados...</span>
      </div>
    );
  }

  if (!isCoordinator) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <FaExclamationTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Acesso Restrito</h3>
            <p className="text-gray-600 mb-4">
              Apenas coordenadores podem acessar a funcionalidade de atribuição em massa.
            </p>
            <Link
              href="/professional/students"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 inline-flex items-center gap-2"
            >
              <FaArrowLeft />
              Voltar para Lista de Alunos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/professional/students"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <FaArrowLeft />
                Voltar
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Atribuição em Massa de Alunos
                </h1>
                <p className="text-gray-600">
                  Atribua ou remova múltiplos alunos de profissionais em uma única operação
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FaGlobe className="w-4 h-4" />
              <span>Modo Coordenador</span>
            </div>
          </div>

          {/* Informações de Contexto */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <FaUserFriends className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 mb-2">
                  Atribuição em Massa - Modo Coordenador
                </h3>
                <p className="text-gray-700 mb-3">
                  Como coordenador, você pode atribuir ou remover múltiplos alunos de profissionais em uma única operação.
                  Selecione os alunos, escolha o profissional e o tipo de operação.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-purple-700">
                    <FaUserPlus className="inline mr-1" />
                    <strong>{students.length}</strong> alunos disponíveis
                  </div>
                  <div className="text-purple-700">
                    <FaUserTie className="inline mr-1" />
                    <strong>{professionals.length}</strong> profissionais
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Painel de Controle */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Configuração da Operação */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Configuração da Operação</h3>

            <div className="space-y-6">
              {/* Tipo de Operação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Operação
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentType('add');
                      setSelectedStudents([]);
                    }}
                    className={`p-4 border-2 rounded-xl transition-all ${assignmentType === 'add'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FaUserPlus className={`w-5 h-5 ${assignmentType === 'add' ? 'text-green-600' : 'text-gray-500'
                        }`} />
                      <div className={`font-semibold ${assignmentType === 'add' ? 'text-green-700' : 'text-gray-700'
                        }`}>
                        Adicionar Alunos
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        Vincular alunos ao profissional
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentType('remove');
                      setSelectedStudents([]);
                    }}
                    className={`p-4 border-2 rounded-xl transition-all ${assignmentType === 'remove'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FaUserMinus className={`w-5 h-5 ${assignmentType === 'remove' ? 'text-red-600' : 'text-gray-500'
                        }`} />
                      <div className={`font-semibold ${assignmentType === 'remove' ? 'text-red-700' : 'text-gray-700'
                        }`}>
                        Remover Alunos
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        Desvincular alunos do profissional
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Seleção de Profissional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profissional
                </label>
                <select
                  value={selectedProfessional}
                  onChange={(e) => {
                    setSelectedProfessional(e.target.value);
                    setSelectedStudents([]);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Selecione um profissional</option>
                  {professionals.map(professional => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name} ({professional.role}) - {professional.profile.institution || 'Sem instituição'}
                    </option>
                  ))}
                </select>
                {selectedProfessional && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800">
                      {professionals.find(p => p.id === selectedProfessional)?.name}
                      {assignmentType === 'add'
                        ? ' receberá os alunos selecionados'
                        : ' terá os alunos selecionados removidos'
                      }
                    </div>
                  </div>
                )}
              </div>

              {/* Resumo da Operação */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Resumo</span>
                  <span className="text-sm text-gray-500">{selectedStudents.length} selecionados</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">
                    Você está prestes a:
                  </div>
                  <div className="font-medium text-gray-800">
                    {assignmentType === 'add' ? 'Adicionar' : 'Remover'} {selectedStudents.length} aluno(s)
                    {selectedProfessional && ` para ${professionals.find(p => p.id === selectedProfessional)?.name}`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Filtros de Alunos</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaSearch className="inline mr-2" />
                  Buscar Alunos
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Nome ou email do aluno"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Série/Ano
                  </label>
                  <select
                    value={filters.grade}
                    onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="all">Todas as séries</option>
                    <option value="1º Ano">1º Ano</option>
                    <option value="2º Ano">2º Ano</option>
                    <option value="3º Ano">3º Ano</option>
                    {/* Adicionar mais séries conforme necessário */}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Escola
                  </label>
                  <select
                    value={filters.school}
                    onChange={(e) => setFilters({ ...filters, school: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="all">Todas as escolas</option>
                    {Array.from(new Set(students.map(s => s.profile.school))).map(school => (
                      <option key={school} value={school}>{school}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedProfessional && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status de Atribuição
                  </label>
                  <select
                    value={filters.currentAssignment}
                    onChange={(e) => setFilters({ ...filters, currentAssignment: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="all">Todos os alunos</option>
                    <option value="assigned">Já atribuídos</option>
                    <option value="unassigned">Não atribuídos</option>
                  </select>
                </div>
              )}

              {/* Ações em Massa */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="flex-1 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100"
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
          </div>

          {/* Estatísticas */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Estatísticas</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Total de Alunos</span>
                <span className="font-bold text-gray-800">{students.length}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Alunos Filtrados</span>
                <span className="font-bold text-gray-800">{filteredStudents.length}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Selecionados</span>
                <span className="font-bold text-gray-800">{selectedStudents.length}</span>
              </div>

              {selectedProfessional && (
                <>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-700">Atualmente atribuídos</span>
                    <span className="font-bold text-blue-800">
                      {students.filter(s =>
                        s.profile.assignedProfessionals?.includes(selectedProfessional)
                      ).length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700">Disponíveis para {assignmentType === 'add' ? 'atribuição' : 'remoção'}</span>
                    <span className="font-bold text-green-800">
                      {filteredStudents.filter(s => {
                        const isAssigned = s.profile.assignedProfessionals?.includes(selectedProfessional);
                        return assignmentType === 'add' ? !isAssigned : isAssigned;
                      }).length}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Ações */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleSubmit}
                disabled={loading || selectedStudents.length === 0 || !selectedProfessional}
                className={`w-full py-3 rounded-xl font-medium transition-all ${selectedStudents.length > 0 && selectedProfessional
                    ? assignmentType === 'add'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                      : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <FaSync className="w-4 h-4 animate-spin" />
                    Processando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    {assignmentType === 'add' ? <FaUserPlus /> : <FaUserMinus />}
                    {assignmentType === 'add' ? 'Atribuir' : 'Remover'} {selectedStudents.length} Aluno(s)
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Alunos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                Lista de Alunos ({filteredStudents.length})
              </h3>
              <div className="text-sm text-gray-500">
                {selectedStudents.length} selecionados
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <FaUsers className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Nenhum aluno encontrado
                </h3>
                <p className="text-gray-600">
                  {filters.search || filters.grade !== 'all' || filters.school !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Nenhum aluno disponível no sistema'
                  }
                </p>
              </div>
            ) : (
              filteredStudents.map(student => {
                const status = getStudentStatus(student);

                return (
                  <div
                    key={student.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${!status.canSelect ? 'opacity-50' : ''
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentSelect(student.id)}
                        disabled={!status.canSelect}
                        className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />

                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FaUsers className="w-5 h-5 text-indigo-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-gray-800 truncate">
                            {student.name}
                          </h4>
                          {status.isAssigned && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              Atribuído
                            </span>
                          )}
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {student.profile.grade}
                          </span>
                        </div>

                        <div className="text-sm text-gray-500 mb-1 truncate">
                          {student.email} • {student.profile.school}
                        </div>

                        <div className="text-xs text-gray-500">
                          {status.assignedCount} profissional(is) • {student.profile.totalPoints || 0} pontos
                        </div>
                      </div>

                      <div className="ml-4">
                        {!status.canSelect ? (
                          <div className="text-sm text-gray-400">
                            {assignmentType === 'add' ? 'Já atribuído' : 'Não atribuído'}
                          </div>
                        ) : (
                          <div className={`text-sm ${selectedStudents.includes(student.id)
                              ? 'text-green-600'
                              : 'text-gray-500'
                            }`}>
                            {selectedStudents.includes(student.id) ? 'Selecionado' : 'Disponível'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Mensagens de Erro */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <FaExclamationTriangle className="w-5 h-5 text-red-500" />
              <div>
                <h4 className="font-medium text-red-800">Erro na operação</h4>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Informações Importantes */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-2">
                Informações importantes sobre atribuição em massa
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• A atribuição em massa é instantânea e não pode ser desfeita automaticamente</li>
                <li>• Alunos podem ter múltiplos profissionais atribuídos simultaneamente</li>
                <li>• A remoção não exclui o aluno do sistema, apenas remove a atribuição</li>
                <li>• Notificações serão enviadas aos profissionais quando alunos forem atribuídos</li>
                <li>• Sempre verifique se o profissional selecionado é o correto antes de confirmar</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}