// components/activities/EmotionalStateModal.tsx
'use client';

import React, { useState } from 'react';
import { FaSmile, FaMeh, FaFrown, FaRegTimesCircle } from 'react-icons/fa';

interface EmotionalStateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (state: number, type: 'before' | 'after') => void;
  type: 'before' | 'after';
}

export default function EmotionalStateModal({
  isOpen,
  onClose,
  onSubmit,
  type
}: EmotionalStateModalProps) {
  const [selectedState, setSelectedState] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selectedState !== null) {
      onSubmit(selectedState, type);
      onClose();
      setSelectedState(null);
    }
  };

  const emotions = [
    { value: 1, icon: FaFrown, label: 'Muito Triste', color: 'text-red-500', bg: 'bg-red-100' },
    { value: 2, icon: FaFrown, label: 'Triste', color: 'text-orange-500', bg: 'bg-orange-100' },
    { value: 3, icon: FaMeh, label: 'Neutro', color: 'text-yellow-500', bg: 'bg-yellow-100' },
    { value: 4, icon: FaSmile, label: 'Feliz', color: 'text-green-500', bg: 'bg-green-100' },
    { value: 5, icon: FaSmile, label: 'Muito Feliz', color: 'text-blue-500', bg: 'bg-blue-100' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              {type === 'before' ? 'Como você está se sentindo?' : 'Como você está se sentindo agora?'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaRegTimesCircle className="w-6 h-6" />
            </button>
          </div>

          <p className="text-gray-600 mb-8">
            {type === 'before' 
              ? 'Nos conte como está seu humor antes de começar esta atividade.'
              : 'Nos conte como está seu humor após completar esta atividade.'}
          </p>

          <div className="grid grid-cols-5 gap-4 mb-8">
            {emotions.map(emotion => (
              <button
                key={emotion.value}
                onClick={() => setSelectedState(emotion.value)}
                className={`flex flex-col items-center p-4 rounded-xl transition-all ${
                  selectedState === emotion.value
                    ? `${emotion.bg} border-2 border-current transform scale-105`
                    : 'border-2 border-transparent hover:bg-gray-50'
                }`}
              >
                <emotion.icon className={`w-8 h-8 mb-2 ${emotion.color}`} />
                <span className={`text-sm font-medium ${emotion.color}`}>
                  {emotion.value}
                </span>
              </button>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Pular
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={selectedState === null}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}