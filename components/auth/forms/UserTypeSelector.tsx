// components/auth/forms/UserTypeSelector.tsx
import React from 'react';
import { FaUserGraduate, FaUserMd } from 'react-icons/fa';

interface UserTypeSelectorProps {
  value: 'student' | 'professional';
  onChange: (value: 'student' | 'professional') => void;
}

export default function UserTypeSelector({ value, onChange }: UserTypeSelectorProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Tipo de conta
      </label>
      <div className="flex gap-4">
        <div 
          className={`
            flex-1 border-2 rounded-xl p-5 cursor-pointer transition-all duration-200
            ${value === 'student' 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-gray-300 bg-white hover:border-indigo-300'
            }
            hover:-translate-y-1
          `}
          onClick={() => onChange('student')}
        >
          <div className="flex flex-col items-center gap-3">
            <div className={value === 'student' ? 'text-indigo-600' : 'text-gray-500'}>
              <FaUserGraduate className="w-6 h-6" />
            </div>
            <div className={`font-semibold ${value === 'student' ? 'text-indigo-600' : 'text-gray-800'}`}>
              Aluno
            </div>
            <div className="text-gray-500 text-xs text-center">
              Para estudantes e aprendizes
            </div>
          </div>
        </div>

        <div 
          className={`
            flex-1 border-2 rounded-xl p-5 cursor-pointer transition-all duration-200
            ${value === 'professional' 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-gray-300 bg-white hover:border-indigo-300'
            }
            hover:-translate-y-1
          `}
          onClick={() => onChange('professional')}
        >
          <div className="flex flex-col items-center gap-3">
            <div className={value === 'professional' ? 'text-indigo-600' : 'text-gray-500'}>
              <FaUserMd className="w-6 h-6" />
            </div>
            <div className={`font-semibold ${value === 'professional' ? 'text-indigo-600' : 'text-gray-800'}`}>
              Profissional
            </div>
            <div className="text-gray-500 text-xs text-center">
              Para psicólogos, psiquiatras e educadores
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}