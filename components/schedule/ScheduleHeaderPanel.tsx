'use client';

import React from 'react';
import { CreateScheduleDTO, ScheduleCategory } from '@/types/schedule';
import {
  FaCalendarAlt,
  FaClock,
  FaTag,
  FaInfoCircle
} from 'react-icons/fa';

interface ScheduleHeaderPanelProps {
  formData: CreateScheduleDTO;
  errors: Record<string, string>;
  updateField: (field: keyof CreateScheduleDTO, value: any) => void;
  totalActivities: number;
  totalDuration: number;
  totalPoints: number;
  activeDaysCount: number;
}

export default function ScheduleHeaderPanel({
  formData,
  errors,
  updateField,
  totalActivities,
  totalDuration,
  totalPoints,
  activeDaysCount
}: ScheduleHeaderPanelProps) {
  const categories: { value: ScheduleCategory; label: string; color: string }[] = [
    {
      value: 'therapeutic',
      label: 'Terapêutico',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      value: 'educational',
      label: 'Educacional',
      color: 'from-purple-500 to-pink-500'
    },
    {
      value: 'mixed',
      label: 'Misto',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const daysOfWeek = [
    { id: 0, label: 'Dom' },
    { id: 1, label: 'Seg' },
    { id: 2, label: 'Ter' },
    { id: 3, label: 'Qua' },
    { id: 4, label: 'Qui' },
    { id: 5, label: 'Sex' },
    { id: 6, label: 'Sáb' }
  ];

  const toggleActiveDay = (dayId: number) => {
    const newDays = formData.activeDays.includes(dayId)
      ? formData.activeDays.filter(d => d !== dayId)
      : [...formData.activeDays, dayId];
    updateField('activeDays', newDays.sort());
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Cabeçalho com Estatísticas */}
      <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
              <FaCalendarAlt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Configurações do Cronograma
              </h2>
              <p className="text-gray-600 text-sm">
                Defina as características básicas do seu cronograma
              </p>
            </div>
          </div>

          {/* Estatísticas Rápidas */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-indigo-600">
                {totalActivities}
              </div>
              <div className="text-xs text-gray-500">Atividades</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {(totalDuration / 60).toFixed(1)}h
              </div>
              <div className="text-xs text-gray-500">Tempo</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-600">
                {totalPoints}
              </div>
              <div className="text-xs text-gray-500">Pontos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo das Configurações */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna 1: Informações Básicas */}
          <div className="space-y-6">
            {/* Nome do Cronograma */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Cronograma *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-gray-400 text-gray-900"
                placeholder="Ex: Programa de Recuperação Matemática"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição (opcional)
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none placeholder:text-gray-400 text-gray-900"
                placeholder="Descreva o propósito deste cronograma..."
                rows={2}
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Categoria *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => updateField('category', category.value)}
                    className={`p-3 border rounded-lg transition-all ${formData.category === category.value
                      ? `border-indigo-500 bg-gradient-to-r ${category.color} bg-opacity-10`
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="text-center">
                      <div className={`font-medium text-sm ${formData.category === category.value
                        ? 'text-indigo-600'
                        : 'text-gray-700'
                        }`}>
                        {category.label}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna 2: Configurações de Tempo */}
          <div className="space-y-6">
            {/* Data de Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="w-4 h-4 text-gray-400" />
                  Data de Início *
                </div>
              </label>
              <input
                type="date"
                value={formData.startDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  const [year, month, day] = e.target.value.split('-').map(Number);
                  const localDate = new Date(year, month - 1, day);
                  updateField('startDate', localDate);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-400 text-gray-900"
                min={new Date().toLocaleDateString('en-CA')}
              />
            </div>

            {/* Data de Término (OBRIGATÓRIA) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="w-4 h-4 text-gray-400" />
                  Data de Término *
                </div>
              </label>
              <input
                type="date"
                value={formData.endDate ? formData.endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const [year, month, day] = e.target.value.split('-').map(Number);
                  const localDate = new Date(year, month - 1, day);

                  // Validação: data de término não pode ser anterior à data de início
                  if (localDate < formData.startDate) {
                    alert('Data de término não pode ser anterior à data de início');
                    return;
                  }

                  updateField('endDate', localDate);
                }}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-400 text-gray-900
      ${errors.endDate ? 'border-red-500' : 'border-gray-300'}`}
                min={formData.startDate.toISOString().split('T')[0]}
                required
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <FaInfoCircle className="w-3 h-3" />
                O cronograma será executado até esta data
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}