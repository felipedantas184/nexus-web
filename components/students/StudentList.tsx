// components\students\StudentList.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Student } from '@/types/auth';
import { useAuth } from '@/context/AuthContext';
import { StudentService } from '@/lib/services/StudentService';
import StudentCard from './StudentCard';
import StudentListItem from './StudentListItem';
import {
  FaUser,
  FaExclamationTriangle,
  FaSync,
  FaUsersSlash
} from 'react-icons/fa';

interface StudentListProps {
  viewMode: 'list' | 'grid';
  selectedStudents: string[];
  onSelectionChange: (ids: string[]) => void;
  isCoordinator: boolean;
}

export default function StudentList({
  viewMode,
  selectedStudents,
  onSelectionChange,
  isCoordinator
}: StudentListProps) {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    grade: 'all',
    school: 'all',
    status: 'all'
  });

  useEffect(() => {
    loadStudents();
  }, [user, isCoordinator]);

  const loadStudents = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const studentsData = await StudentService.getStudentsByProfessionalOrAll(
        user.id,
        user.role,
        {
          activeOnly: true,
          filters: {
            grade: filters.grade !== 'all' ? filters.grade : undefined,
            school: filters.school !== 'all' ? filters.school : undefined
          }
        }
      );

      setStudents(studentsData);
    } catch (err: any) {
      console.error('Erro ao carregar alunos:', err);
      setError(err.message || 'Erro ao carregar alunos');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (studentId: string) => {
    const newSelection = selectedStudents.includes(studentId)
      ? selectedStudents.filter(id => id !== studentId)
      : [...selectedStudents, studentId];
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    const allIds = students.map(s => s.id);
    onSelectionChange(allIds);
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  const filteredStudents = students.filter(student => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!student.name.toLowerCase().includes(searchLower) &&
          !student.email.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    if (filters.status !== 'all') {
      // Lógica de status pode ser implementada aqui
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Carregando alunos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <FaExclamationTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Erro ao carregar alunos</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadStudents}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 mx-auto"
        >
          <FaSync />
          Tentar novamente
        </button>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <FaUsersSlash className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {isCoordinator ? 'Nenhum aluno encontrado' : 'Nenhum aluno atribuído'}
        </h3>
        <p className="text-gray-600 mb-4">
          {isCoordinator 
            ? 'Não há alunos cadastrados no sistema ou os filtros não retornaram resultados.'
            : 'Você ainda não tem alunos atribuídos. Entre em contato com um coordenador.'
          }
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Controles da Lista */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          Mostrando <span className="font-semibold">{filteredStudents.length}</span> de{' '}
          <span className="font-semibold">{students.length}</span> alunos
          {isCoordinator && ' no sistema'}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Selecionar todos
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={handleDeselectAll}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Limpar seleção
          </button>
        </div>
      </div>

      {/* Lista/Grade de Alunos */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              isSelected={selectedStudents.includes(student.id)}
              onSelect={() => handleStudentSelect(student.id)}
              isCoordinator={isCoordinator}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredStudents.map(student => (
              <StudentListItem
                key={student.id}
                student={student}
                isSelected={selectedStudents.includes(student.id)}
                onSelect={() => handleStudentSelect(student.id)}
                isCoordinator={isCoordinator}
              />
            ))}
          </div>
        </div>
      )}

      {/* Paginação */}
      {filteredStudents.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Página 1 de 1 • {filteredStudents.length} itens
          </div>
          <div className="flex gap-2">
            <button
              disabled
              className="px-3 py-1 border border-gray-300 text-gray-400 rounded-lg cursor-not-allowed"
            >
              Anterior
            </button>
            <button className="px-3 py-1 bg-indigo-600 text-white rounded-lg">
              1
            </button>
            <button
              disabled
              className="px-3 py-1 border border-gray-300 text-gray-400 rounded-lg cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}