// app/professional/students/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import StudentManagementDashboard from '@/components/students/StudentManagementDashboard';
import StudentList from '@/components/students/StudentList';
import StudentFilters from '@/components/students/StudentFilters';
import { 
  FaUsers, 
  FaUserPlus, 
  FaChartLine, 
  FaFilter,
  FaDownload,
  FaUserGraduate,
  FaGlobe,
  FaUserTie
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

export default function StudentsPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'dashboard'>('list');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const isCoordinator = user?.role === 'coordinator';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Gerenciamento de Alunos
              </h1>
              <p className="text-gray-600 mt-2">
                {isCoordinator 
                  ? 'Gerencie todos os alunos da plataforma Nexus'
                  : 'Gerencie seus alunos atribuídos'
                }
              </p>
            </div>

            <div className="flex items-center gap-4">
              {isCoordinator && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-sm font-medium">
                  <FaGlobe className="w-4 h-4" />
                  Modo Coordenador
                </div>
              )}
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <FaUserTie className="w-4 h-4" />
                <span>{user?.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Ferramentas */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Modo de Visualização */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Visualização:</span>
                <div className="inline-flex rounded-lg bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      viewMode === 'list'
                        ? 'bg-white text-indigo-600 shadow'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Lista
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white text-indigo-600 shadow'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Grade
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('dashboard')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      viewMode === 'dashboard'
                        ? 'bg-white text-indigo-600 shadow'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Dashboard
                  </button>
                </div>
              </div>

              {/* Botão Filtros */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <FaFilter className="w-4 h-4" />
                Filtros
                {showFilters && (
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Exportar */}
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <FaDownload className="w-4 h-4" />
                Exportar
              </button>

              {/* Vincular Aluno (todos profissionais) */}
              <Link
                href="/professional/students/assign"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700"
              >
                <FaUserGraduate className="w-4 h-4" />
                Vincular Aluno
              </Link>
            </div>
          </div>

          {/* Filtros Avançados (Expandível) */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <StudentFilters onFilterChange={() => {}} />
            </div>
          )}
        </div>

        {/* Conteúdo Principal */}
        <div className="mb-8">
          {viewMode === 'dashboard' ? (
            <StudentManagementDashboard isCoordinator={isCoordinator} />
          ) : (
            <StudentList 
              viewMode={viewMode}
              selectedStudents={selectedStudents}
              onSelectionChange={setSelectedStudents}
              isCoordinator={isCoordinator}
            />
          )}
        </div>

        {/* Barra de Ações em Massa */}
        {selectedStudents.length > 0 && (
          <div className="sticky bottom-6 bg-white rounded-2xl shadow-lg border border-gray-300 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <FaUsers className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">
                    {selectedStudents.length} aluno(s) selecionado(s)
                  </div>
                  <div className="text-sm text-gray-500">
                    Ações em massa disponíveis
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  onClick={() => setSelectedStudents([])}
                >
                  Limpar Seleção
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Aplicar Cronograma
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700"
                >
                  Enviar Mensagem
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dicas e Informações */}
        <div className="mt-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaChartLine className="text-indigo-500" />
              Dicas para Gestão de Alunos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-800 mb-1">Segmentação</div>
                <p className="text-sm text-blue-700">
                  Use filtros para segmentar alunos por escola, série ou desempenho
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="font-medium text-green-800 mb-1">Acompanhamento</div>
                <p className="text-sm text-green-700">
                  Monstre pontos, streak e progresso para intervenções oportunas
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="font-medium text-purple-800 mb-1">Comunicação</div>
                <p className="text-sm text-purple-700">
                  Envie mensagens em massa para grupos específicos de alunos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}