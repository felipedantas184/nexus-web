// components/schedule/QuickAddInput.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaPlus, FaCheck, FaTimes } from 'react-icons/fa';

interface QuickAddInputProps {
  day: number;
  dayLabel: string;
  onAddQuickActivity: (title: string, day: number) => void;
  isAdding?: boolean;
  onToggle?: () => void;
}

export default function QuickAddInput({
  day,
  dayLabel,
  onAddQuickActivity,
  isAdding = false,
  onToggle
}: QuickAddInputProps) {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleSubmit = () => {
    if (title.trim()) {
      onAddQuickActivity(title.trim(), day);
      setTitle('');
      if (onToggle) onToggle();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape' && onToggle) {
      onToggle();
    }
  };

  const handleCancel = () => {
    setTitle('');
    if (onToggle) onToggle();
  };

  // Estado inicial (não adicionando)
  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="w-full py-2 px-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 
                 border-2 border-blue-200 border-dashed rounded-xl text-blue-600 hover:text-blue-800 
                 font-medium transition-all duration-200 flex items-center justify-center gap-2 group"
      >
        <FaPlus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        <span>Adicionar rápida</span>
      </button>
    );
  }

  // Estado adicionando (mostra input)
  return (
    <div className="bg-white border-2 border-blue-300 rounded-xl p-3 shadow-sm animate-fadeIn">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <span className="text-sm font-bold text-blue-600">⚡</span>
        </div>
        <div>
          <div className="text-xs text-gray-500">Atividade Rápida</div>
          <div className="text-sm font-medium text-gray-700">{dayLabel}</div>
        </div>
      </div>

      <div className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="O que o aluno deve fazer?"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 
                   focus:border-blue-500 outline-none text-sm placeholder:text-gray-400 text-gray-900"
          maxLength={100}
        />
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {title.length}/100 • Enter para salvar
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Cancelar"
            >
              <FaTimes className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title.trim()}
              className={`p-2 rounded-lg ${title.trim()
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              title="Confirmar"
            >
              <FaCheck className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}