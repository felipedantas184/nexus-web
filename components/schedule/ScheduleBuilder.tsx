// components/schedule/ScheduleBuilder.tsx - VERSÃO CORRIGIDA
'use client';

import React, { useEffect, useState } from 'react';
import {
  CreateScheduleDTO,
  CreateActivityDTO
} from '@/types/schedule';
import { useScheduleForm } from '@/hooks/useScheduleForm';
import { useAuth } from '@/context/AuthContext';
import WeekScheduleGrid from './WeekScheduleGrid';
import ScheduleHeaderPanel from './ScheduleHeaderPanel';
import ScheduleConfirmation from './ScheduleConfirmation';
import QuickActivityModal from './QuickActivityModal';
import {
  FaSave,
  FaEye,
  FaListOl,
  FaCalendarCheck
} from 'react-icons/fa';
import { ScheduleService } from '@/lib/services/ScheduleService';

interface ScheduleBuilderProps {
  onSuccess?: (scheduleId: string) => void;
  onCancel?: () => void;
  initialData?: Partial<CreateScheduleDTO>;
  isEditing?: boolean;
  scheduleId?: string;
}

type ViewMode = 'schedule' | 'list' | 'preview';

export default function ScheduleBuilder({
  onSuccess,
  onCancel,
  initialData,
  isEditing = false,
  scheduleId
}: ScheduleBuilderProps) {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('schedule');
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [editingActivity, setEditingActivity] = useState<{
    day: number;
    activity: CreateActivityDTO;
    index: number;
  } | null>(null);

  // ✅ NOVO: Estado local para garantir que initialData seja passado
  const [effectiveInitialData, setEffectiveInitialData] = useState<Partial<CreateScheduleDTO> | undefined>(initialData);

  // ✅ CRÍTICO: Sincronizar quando initialData mudar
  useEffect(() => {
    console.log('🔄 ScheduleBuilder: initialData atualizado', {
      hasData: !!initialData,
      name: initialData?.name,
      activitiesCount: initialData?.activities?.length
    });

    if (initialData && Object.keys(initialData).length > 0) {
      console.log('📥 ScheduleBuilder: Atualizando effectiveInitialData');
      setEffectiveInitialData(initialData);
    }
  }, [initialData]);

  const {
    formData,
    errors,
    submitting,
    updateField,
    addActivity,
    updateActivity,
    removeActivity,
    validateForm,
    submitForm,
    hasActivities,
    updateExistingSchedule
  } = useScheduleForm(effectiveInitialData); // ✅ Usar effectiveInitialData

  // Dias da semana configurados
  const daysOfWeek = [
    { id: 0, label: 'Dom', full: 'Domingo', enabled: formData.activeDays.includes(0) },
    { id: 1, label: 'Seg', full: 'Segunda-feira', enabled: formData.activeDays.includes(1) },
    { id: 2, label: 'Ter', full: 'Terça-feira', enabled: formData.activeDays.includes(2) },
    { id: 3, label: 'Qua', full: 'Quarta-feira', enabled: formData.activeDays.includes(3) },
    { id: 4, label: 'Qui', full: 'Quinta-feira', enabled: formData.activeDays.includes(4) },
    { id: 5, label: 'Sex', full: 'Sexta-feira', enabled: formData.activeDays.includes(5) },
    { id: 6, label: 'Sáb', full: 'Sábado', enabled: formData.activeDays.includes(6) }
  ];

  const handleAddActivity = (day: number) => {
    setSelectedDay(day);
    setEditingActivity(null);
    setShowActivityModal(true);
  };

  const handleEditActivity = (day: number, activity: CreateActivityDTO, index: number) => {
    // ✅ VALIDAÇÃO EXTRA: Verificar se o índice é válido
    if (index < 0 || index >= formData.activities.length) {
      console.error('Índice inválido para edição:', index);
      return;
    }

    setSelectedDay(day);
    setEditingActivity({ day, activity, index });
    setShowActivityModal(true);
  };

  const handleSaveActivity = (activityData: CreateActivityDTO, repeatDays: number[]) => {
    if (selectedDay === null) return;

    // Para cada dia selecionado (incluindo o dia original)
    repeatDays.forEach(day => {
      if (editingActivity && day === selectedDay) {
        // ✅ CORREÇÃO: Usar índice global correto
        updateActivity(editingActivity.index, {
          ...activityData,
          dayOfWeek: day
        });
      } else {
        // ✅ CORREÇÃO: Calcular orderIndex correto para novo dia
        const activitiesForDay = formData.activities.filter(a => a.dayOfWeek === day);
        const orderIndex = activitiesForDay.length;

        const newActivity: CreateActivityDTO = {
          ...activityData,
          dayOfWeek: day,
          orderIndex
        };
        addActivity(newActivity);
      }
    });

    setShowActivityModal(false);
    setSelectedDay(null);
    setEditingActivity(null);
  };

  // ✅ CORREÇÃO: Validação antes de remover
  const handleRemoveActivity = (day: number, index: number) => {
    // Validação de índice
    if (index < 0 || index >= formData.activities.length) {
      console.error('Índice inválido para remoção:', index);
      return;
    }

    removeActivity(index);
  };

  const handleDuplicateActivity = (day: number, activity: CreateActivityDTO) => {
    const activitiesForDay = formData.activities.filter(a => a.dayOfWeek === day);
    const orderIndex = activitiesForDay.length;

    const newActivity: CreateActivityDTO = {
      ...activity,
      dayOfWeek: day,
      orderIndex,
      title: `${activity.title} (Cópia)`
    };
    addActivity(newActivity);
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('Usuário não autenticado');
      return;
    }

    try {
      let result: string;

      if (isEditing && scheduleId) {
        console.log('🔄 Modo edição - Atualizando cronograma:', scheduleId);

        // Usar a nova função de atualização
        result = await updateExistingSchedule(scheduleId, user.id);

        if (onSuccess) {
          onSuccess(result); // scheduleId da nova versão
        }

        alert('Cronograma atualizado com sucesso! Nova versão criada.');
      } else {
        console.log('🆕 Modo criação - Criando novo cronograma');

        // Usar função de criação existente
        const creationResult = await submitForm(user.id);
        result = creationResult.scheduleId;

        if (onSuccess) {
          onSuccess(result);
        }

        alert('Cronograma criado com sucesso!');
      }
    } catch (err: any) {
      console.error('❌ Erro no handleSubmit:', err);
      alert(err.message || 'Erro ao salvar cronograma');
    }
  };

  // Calcular estatísticas
  const totalActivities = formData.activities.length;
  const totalDuration = formData.activities.reduce((sum, act) =>
    sum + (act.metadata.estimatedDuration || 0), 0
  );
  const totalPoints = formData.activities.reduce((sum, act) =>
    sum + (act.scoring.pointsOnCompletion || 0), 0
  );

  useEffect(() => {
    console.log('🎯 ScheduleBuilder - initialData recebido:', {
      isEditing,
      scheduleId,
      hasInitialData: !!initialData,
      name: initialData?.name,
      activitiesCount: initialData?.activities?.length,
      activeDays: initialData?.activeDays
    });
  }, [initialData, isEditing, scheduleId]);

  useEffect(() => {
    console.log('📊 ScheduleBuilder - formData atual:', {
      name: formData.name,
      activitiesCount: formData.activities.length,
      activeDays: formData.activeDays
    });
  }, [formData]);

  return (
    <div className="space-y-8">
      {/* Painel de Configurações */}
      <ScheduleHeaderPanel
        formData={formData}
        errors={errors}
        updateField={updateField}
        totalActivities={totalActivities}
        totalDuration={totalDuration}
        totalPoints={totalPoints}
        activeDaysCount={formData.activeDays.length}
      />

      {/* Controle de Visualização */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-700">Visualização:</div>
            <div className="inline-flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setViewMode('schedule')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'schedule'
                  ? 'bg-white text-indigo-600 shadow'
                  : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <FaCalendarCheck className="w-4 h-4" />
                  <span>Cronograma Semanal</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow'
                  : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <FaListOl className="w-4 h-4" />
                  <span>Lista de Atividades</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'preview'
                  ? 'bg-white text-indigo-600 shadow'
                  : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <FaEye className="w-4 h-4" />
                  <span>Prévia</span>
                </div>
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-500 hidden md:block">
            {viewMode === 'schedule' && 'Organize atividades por dia da semana'}
            {viewMode === 'list' && 'Veja todas as atividades em lista'}
            {viewMode === 'preview' && 'Revise antes de salvar'}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="min-h-[500px]">
        {viewMode === 'schedule' && (
          <WeekScheduleGrid
            formData={formData}
            daysOfWeek={daysOfWeek.filter(d => d.enabled)}
            onAddActivity={handleAddActivity}
            onEditActivity={handleEditActivity}
            onRemoveActivity={handleRemoveActivity}
            onDuplicateActivity={handleDuplicateActivity}
            updateField={updateField}
          />
        )}

        {viewMode === 'list' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Lista de Todas as Atividades ({totalActivities})
            </h3>
            {/* Implementar lista de atividades */}
          </div>
        )}

        {viewMode === 'preview' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Prévia do Cronograma
            </h3>
            {/* Implementar preview */}
          </div>
        )}
      </div>

      {/* Confirmação */}
      <ScheduleConfirmation
        onCancel={onCancel}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
        isEditing={isEditing}
        formData={formData}
      />

      {/* Modal de Atividade */}
      {showActivityModal && selectedDay !== null && (
        <QuickActivityModal
          isOpen={showActivityModal}
          onClose={() => {
            setShowActivityModal(false);
            setSelectedDay(null);
            setEditingActivity(null);
          }}
          onSave={handleSaveActivity}
          initialDay={selectedDay}
          isEditing={!!editingActivity}
          initialData={editingActivity?.activity}
          availableDays={daysOfWeek.filter(d => d.enabled).map(d => d.id)}
          formData={formData}
        />
      )}
    </div>
  );
}