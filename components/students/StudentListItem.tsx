'use client';

import React, { useState } from 'react';
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
  FaUserMinus,
  FaEllipsisV,
  FaChartLine,
  FaPaperPlane,
  FaFileExport
} from 'react-icons/fa';

interface StudentListItemProps {
  student: Student;
  isSelected: boolean;
  onSelect: () => void;
  isCoordinator: boolean;
}

export default function StudentListItem({
  student,
  isSelected,
  onSelect,
  isCoordinator
}: StudentListItemProps) {
  const [showActions, setShowActions] = useState(false);
  const isAssignedToCurrentUser = student.profile.assignedProfessionals?.includes('current-user-id');

  return (
    <div className={`p-4 hover:bg-gray-50 transition-colors ${
      isSelected ? 'bg-blue-50' : ''
    }`}>
      <div className="flex items-center justify-between">
        {/* Seleção e Avatar */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
          />

          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
            <FaUser className="w-5 h-5 text-indigo-600" />
          </div>

          {/* Informações Principais */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-gray-800 truncate">
                {student.name}
              </h3>
              
              <div className="flex items-center gap-2">
                <div className={`px-2 py-0.5 text-xs rounded-full ${
                  student.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {student.isActive ? 'Ativo' : 'Inativo'}
                </div>

                {!isAssignedToCurrentUser && isCoordinator && (
                  <div className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                    Não atribuído
                  </div>
                )}

                <div className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Nível {student.profile.level || 1}
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500 mb-2 truncate">
              {student.email} • {student.profile.school}
            </div>

            {/* Estatísticas Rápidas */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <FaGraduationCap className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-600">{student.profile.grade}</span>
              </div>
              <div className="flex items-center gap-1">
                <FaStar className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-gray-600">{student.profile.totalPoints || 0} pontos</span>
              </div>
              <div className="flex items-center gap-1">
                <FaFire className="w-3.5 h-3.5 text-red-500" />
                <span className="text-gray-600">{student.profile.streak || 0}d streak</span>
              </div>
              <div className="flex items-center gap-1">
                <FaCalendar className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-600">
                  Desde {new Date(student.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3 ml-4">
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <FaEllipsisV />
            </button>

            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <Link
                  href={`/professional/students/${student.id}`}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowActions(false)}
                >
                  <FaEye className="w-3.5 h-3.5" />
                  Ver perfil completo
                </Link>
                
                <Link
                  href={`/professional/students/${student.id}/progress`}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowActions(false)}
                >
                  <FaChartLine className="w-3.5 h-3.5" />
                  Ver progresso
                </Link>
                
                {isCoordinator && (
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                    onClick={() => setShowActions(false)}
                  >
                    {isAssignedToCurrentUser ? (
                      <>
                        <FaUserMinus className="w-3.5 h-3.5" />
                        Remover atribuição
                      </>
                    ) : (
                      <>
                        <FaUserPlus className="w-3.5 h-3.5" />
                        Atribuir a mim
                      </>
                    )}
                  </button>
                )}
                
                <button
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={() => setShowActions(false)}
                >
                  <FaPaperPlane className="w-3.5 h-3.5" />
                  Enviar mensagem
                </button>
                
                <button
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={() => setShowActions(false)}
                >
                  <FaFileExport className="w-3.5 h-3.5" />
                  Exportar dados
                </button>
              </div>
            )}
          </div>

          {isCoordinator && (
            <Link
              href={`/professional/students/${student.id}/edit`}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
            >
              <FaEdit className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}