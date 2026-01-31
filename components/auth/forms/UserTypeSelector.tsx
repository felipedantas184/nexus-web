'use client';

import React, { useState, useEffect } from 'react';
import { FaUserGraduate, FaUserMd } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface UserTypeSelectorProps {
  value: 'student' | 'professional';
  onChange: (value: 'student' | 'professional') => void;
}

export default function UserTypeSelector({ value, onChange }: UserTypeSelectorProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-3.5">
        Tipo de conta
      </label>
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-3`}>
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className={`flex-1 border-2 rounded-xl p-4 cursor-pointer transition-all duration-200
            ${value === 'student' 
              ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-indigo-100/50 shadow-sm' 
              : 'border-gray-300 bg-white hover:border-indigo-300 hover:bg-gray-50'
            }
            ${isMobile ? 'flex items-center gap-4' : 'flex flex-col items-center gap-3'}
          `}
          onClick={() => onChange('student')}
        >
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg
            ${value === 'student' 
              ? 'bg-indigo-100 text-indigo-600' 
              : 'bg-gray-100 text-gray-500'
            }
          `}>
            <FaUserGraduate className="w-5 h-5" />
          </div>
          <div className={isMobile ? 'flex-1' : ''}>
            <div className={`font-semibold text-sm ${value === 'student' ? 'text-indigo-600' : 'text-gray-800'}`}>
              Aluno
            </div>
            <div className="text-gray-500 text-xs mt-0.5">
              Estudantes e aprendizes
            </div>
          </div>
          {value === 'student' && (
            <div className="w-3 h-3 bg-indigo-500 rounded-full ml-auto" />
          )}
        </motion.div>

        <motion.div 
          whileTap={{ scale: 0.98 }}
          className={`flex-1 border-2 rounded-xl p-4 cursor-pointer transition-all duration-200
            ${value === 'professional' 
              ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100/50 shadow-sm' 
              : 'border-gray-300 bg-white hover:border-purple-300 hover:bg-gray-50'
            }
            ${isMobile ? 'flex items-center gap-4' : 'flex flex-col items-center gap-3'}
          `}
          onClick={() => onChange('professional')}
        >
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg
            ${value === 'professional' 
              ? 'bg-purple-100 text-purple-600' 
              : 'bg-gray-100 text-gray-500'
            }
          `}>
            <FaUserMd className="w-5 h-5" />
          </div>
          <div className={isMobile ? 'flex-1' : ''}>
            <div className={`font-semibold text-sm ${value === 'professional' ? 'text-purple-600' : 'text-gray-800'}`}>
              Profissional
            </div>
            <div className="text-gray-500 text-xs mt-0.5">
              Psicólogos, educadores e especialistas
            </div>
          </div>
          {value === 'professional' && (
            <div className="w-3 h-3 bg-purple-500 rounded-full ml-auto" />
          )}
        </motion.div>
      </div>
    </div>
  );
}