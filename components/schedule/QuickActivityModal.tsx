'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  CreateActivityDTO, 
  ActivityType, 
  DifficultyLevel,
  CreateScheduleDTO,
  ActivityConfig
} from '@/types/schedule';
import {
  FaTimes,
  FaSave,
  FaFileAlt,
  FaVideo,
  FaQuestionCircle,
  FaList,
  FaFile,
  FaSync,
  FaStar,
  FaClock,
  FaUpload,
  FaCheck,
  FaTag,
  FaPlus,
  FaTrash
} from 'react-icons/fa';

interface QuickActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activityData: CreateActivityDTO, repeatDays: number[]) => void;
  initialDay: number;
  isEditing?: boolean;
  initialData?: CreateActivityDTO;
  availableDays: number[];
  formData: CreateScheduleDTO;
}

const activityTypes: Array<{
  type: ActivityType;
  icon: React.ReactNode;
  label: string;
  color: string;
  description: string;
}> = [
  {
    type: 'quick',
    icon: '⚡',
    label: 'Rápida',
    color: 'bg-blue-500',
    description: 'Atividade simples sem detalhes'
  },
  {
    type: 'text',
    icon: <FaFileAlt />,
    label: 'Texto',
    color: 'bg-purple-500',
    description: 'Resposta escrita'
  },
  {
    type: 'quiz',
    icon: <FaQuestionCircle />,
    label: 'Quiz',
    color: 'bg-amber-500',
    description: 'Perguntas e respostas'
  },
  {
    type: 'video',
    icon: <FaVideo />,
    label: 'Vídeo',
    color: 'bg-red-500',
    description: 'Assistir conteúdo em vídeo'
  },
  {
    type: 'checklist',
    icon: <FaList />,
    label: 'Checklist',
    color: 'bg-green-500',
    description: 'Lista de itens para marcar'
  },
  {
    type: 'file',
    icon: <FaFile />,
    label: 'Arquivo',
    color: 'bg-indigo-500',
    description: 'Upload de arquivos'
  }
];

const difficultyOptions: Array<{
  value: DifficultyLevel;
  label: string;
  color: string;
}> = [
  { value: 'easy', label: 'Fácil', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Médio', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'hard', label: 'Difícil', color: 'bg-red-100 text-red-800' }
];

const dayLabels: Record<number, string> = {
  0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 
  4: 'Qui', 5: 'Sex', 6: 'Sáb'
};

export default function QuickActivityModal({
  isOpen,
  onClose,
  onSave,
  initialDay,
  isEditing = false,
  initialData,
  availableDays,
  formData
}: QuickActivityModalProps) {
  const [selectedType, setSelectedType] = useState<ActivityType>('text');
  const [repeatDays, setRepeatDays] = useState<number[]>([initialDay]);
  const [form, setForm] = useState<Partial<CreateActivityDTO>>({
    title: '',
    description: '',
    instructions: '',
    type: 'text',
    dayOfWeek: initialDay,
    orderIndex: 0,
    config: {},
    scoring: {
      isRequired: true,
      pointsOnCompletion: 10,
      bonusPoints: 0
    },
    metadata: {
      estimatedDuration: 15,
      difficulty: 'medium',
      therapeuticFocus: [],
      educationalFocus: []
    },
    estimatedDuration: 15,
    pointsOnCompletion: 10
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [checklistItems, setChecklistItems] = useState<string[]>(['']);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Inicializar com dados existentes
  useEffect(() => {
    if (initialData) {
      setForm(initialData);
      setSelectedType(initialData.type);
    }
  }, [initialData]);

  const toggleRepeatDay = (day: number) => {
    setRepeatDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title?.trim()) {
      alert('Por favor, informe o título da atividade');
      return;
    }

    // Preparar dados finais
    const activityData: CreateActivityDTO = {
      ...form as CreateActivityDTO,
      type: selectedType,
      dayOfWeek: initialDay, // Baseado no dia original
      orderIndex: formData.activities.filter(a => a.dayOfWeek === initialDay).length,
      config: getConfigForType(),
      metadata: {
        estimatedDuration: form.metadata?.estimatedDuration || 15,
        difficulty: form.metadata?.difficulty || 'medium',
        therapeuticFocus: form.metadata?.therapeuticFocus || [],
        educationalFocus: form.metadata?.educationalFocus || []
      },
      estimatedDuration: form.metadata?.estimatedDuration || 15,
      pointsOnCompletion: form.scoring?.pointsOnCompletion || 10
    };

    onSave(activityData, repeatDays);
  };

  const getConfigForType = (): ActivityConfig => {
    switch (selectedType) {
      case 'text':
        return {
          minWords: 50,
          maxWords: 500,
          format: 'plain'
        };
      case 'video':
        return {
          url: '',
          provider: 'youtube'
        };
      case 'checklist':
        return {
          items: checklistItems.map((item, idx) => ({
            id: `item-${Date.now()}-${idx}`,
            label: item,
            required: true
          }))
        };
      case 'quiz':
        return {
          questions: [],
          passingScore: 70
        };
      case 'file':
        return {
          allowedTypes: ['.pdf', '.doc', '.docx', '.jpg', '.png'],
          maxSizeMB: 10
        };
      default:
        return {
          autoComplete: true
        };
    }
  };

  const addChecklistItem = () => {
    setChecklistItems([...checklistItems, '']);
  };

  const removeChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const updateChecklistItem = (index: number, value: string) => {
    const newItems = [...checklistItems];
    newItems[index] = value;
    setChecklistItems(newItems);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditing ? 'Editar Atividade' : 'Nova Atividade'}
              </h2>
              <p className="text-indigo-100 text-sm mt-1">
                Configure os detalhes da atividade
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-200 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6 space-y-6">
            {/* Seção 1: Tipo e Repetição */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo de Atividade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Atividade *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {activityTypes.map((type) => (
                    <button
                      key={type.type}
                      type="button"
                      onClick={() => setSelectedType(type.type)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedType === type.type
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full ${type.color} flex items-center justify-center text-white`}>
                          {type.icon}
                        </div>
                        <span className="text-xs font-medium text-gray-700">
                          {type.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dias de Repetição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Repetir em outros dias
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {availableDays.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleRepeatDay(day)}
                      className={`p-2 rounded-lg font-medium transition-all ${
                        repeatDays.includes(day)
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {dayLabels[day]}
                        {repeatDays.includes(day) && (
                          <FaCheck className="w-3 h-3" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Atividade será criada em {repeatDays.length} dia{repeatDays.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Seção 2: Informações Básicas */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={form.title || ''}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: Meditação Guiada"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dificuldade
                  </label>
                  <select
                    value={form.metadata?.difficulty || 'medium'}
                    onChange={(e) => setForm({
                      ...form,
                      metadata: { ...form.metadata!, difficulty: e.target.value as DifficultyLevel }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  >
                    {difficultyOptions.map(diff => (
                      <option key={diff.value} value={diff.value}>
                        {diff.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Descreva a atividade..."
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instruções *
                </label>
                <textarea
                  value={form.instructions || ''}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="O que o aluno deve fazer?"
                  rows={3}
                  required
                />
              </div>
            </div>

            {/* Seção 3: Duração e Pontuação */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <FaClock className="w-4 h-4 text-gray-400" />
                    Duração (min)
                  </div>
                </label>
                <input
                  type="number"
                  min="1"
                  max="240"
                  value={form.metadata?.estimatedDuration || 15}
                  onChange={(e) => setForm({
                    ...form,
                    metadata: { ...form.metadata!, estimatedDuration: parseInt(e.target.value) || 15 }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <FaStar className="w-4 h-4 text-amber-400" />
                    Pontos
                  </div>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.scoring?.pointsOnCompletion || 10}
                  onChange={(e) => setForm({
                    ...form,
                    scoring: { ...form.scoring!, pointsOnCompletion: parseInt(e.target.value) || 10 }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Conclusão
                </label>
                <select
                  value={form.scoring?.isRequired ? 'required' : 'optional'}
                  onChange={(e) => setForm({
                    ...form,
                    scoring: { ...form.scoring!, isRequired: e.target.value === 'required' }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                >
                  <option value="required">Obrigatória</option>
                  <option value="optional">Opcional</option>
                </select>
              </div>
            </div>

            {/* Seção 4: Configurações Específicas */}
            {selectedType === 'checklist' && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Itens da Checklist *
                </label>
                {checklistItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {index + 1}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateChecklistItem(index, e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg"
                      placeholder={`Item ${index + 1}...`}
                      required
                    />
                    {checklistItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <FaPlus className="w-4 h-4" />
                  Adicionar Item
                </button>
              </div>
            )}

            {selectedType === 'file' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Arquivo para Upload
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
                >
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-3">
                      <FaFile className="w-12 h-12 text-indigo-500" />
                      <div>
                        <p className="font-medium text-gray-800">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Clique para alterar o arquivo
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <FaUpload className="w-12 h-12 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-800">
                          Clique para selecionar um arquivo
                        </p>
                        <p className="text-sm text-gray-500">
                          PDF, DOC, JPG, PNG até 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              </div>
            )}
          </div>

          {/* Footer com Ações */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex justify-between gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <FaSave className="w-4 h-4" />
                {isEditing ? 'Salvar Alterações' : 'Criar Atividade'}
                {repeatDays.length > 1 && (
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    {repeatDays.length} dias
                  </span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}