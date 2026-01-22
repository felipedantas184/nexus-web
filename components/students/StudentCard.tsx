'use client';

import React from 'react';
import { Student } from '@/types/auth';
import Link from 'next/link';
import {
  FaUser,
  FaGraduationCap,
  FaSchool,
  FaStar,
  FaFire,
  FaCalendar,
  FaEye,
  FaEdit,
  FaUserPlus,
  FaUserMinus
} from 'react-icons/fa';

interface StudentCardProps {
  student: Student;
  isSelected: boolean;
  onSelect: () => void;
  isCoordinator: boolean;
}

export default function StudentCard({
  student,
  isSelected,
  onSelect,
  isCoordinator
}: StudentCardProps) {
  const isAssignedToCurrentUser = student.profile.assignedProfessionals?.includes('current-user-id');

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${
      isSelected 
        ? 'border-indigo-500 ring-2 ring-indigo-200' 
        : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
    }`}>
      {/* Cabeçalho do Card */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <FaUser className="w-6 h-6 text-indigo-600" />
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className={`px-2 py-1 text-xs rounded-full ${
              student.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {student.isActive ? 'Ativo' : 'Inativo'}
            </div>
            {!isAssignedToCurrentUser && isCoordinator && (
              <div className="mt-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                Não atribuído
              </div>
            )}
          </div>
        </div>

        {/* Informações do Aluno */}
        <div className="mb-4">
          <h3 className="font-bold text-gray-800 text-lg mb-1 truncate">
            {student.name}
          </h3>
          <p className="text-gray-500 text-sm mb-3 truncate">
            {student.email}
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <FaGraduationCap className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-600">{student.profile.grade}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FaSchool className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-600 truncate">{student.profile.school}</span>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <FaStar className="w-3 h-3 text-amber-500" />
              <span className="text-xs text-gray-500">Pontos</span>
            </div>
            <div className="text-lg font-bold text-gray-800">
              {student.profile.totalPoints || 0}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <FaFire className="w-3 h-3 text-red-500" />
              <span className="text-xs text-gray-500">Streak</span>
            </div>
            <div className="text-lg font-bold text-gray-800">
              {student.profile.streak || 0}d
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <Link
            href={`/professional/students/${student.id}`}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
          >
            <FaEye className="w-3.5 h-3.5" />
            Ver
          </Link>
          
          {isCoordinator && (
            <button
              className="flex-1 bg-indigo-100 text-indigo-700 py-2 rounded-lg text-sm font-medium hover:bg-indigo-200 flex items-center justify-center gap-2"
            >
              {isAssignedToCurrentUser ? (
                <>
                  <FaUserMinus className="w-3.5 h-3.5" />
                  Remover
                </>
              ) : (
                <>
                  <FaUserPlus className="w-3.5 h-3.5" />
                  Atribuir
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Rodapé */}
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <FaCalendar className="w-3 h-3" />
            <span>Desde {new Date(student.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
          <div>
            {student.profile.assignedProfessionals?.length || 0} prof.
          </div>
        </div>
      </div>
    </div>
  );
}