// hooks/useScheduleForm.ts - VERSÃO CORRIGIDA COM INICIALIZAÇÃO SÍNCRONA
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ScheduleService } from '@/lib/services/ScheduleService';
import { CreateScheduleDTO, CreateActivityDTO } from '@/types/schedule';
import { ValidationUtils } from '@/lib/utils/validationUtils';

export function useScheduleForm(initialData?: Partial<CreateScheduleDTO>) {
  console.log('🎯 useScheduleForm chamado com initialData:', {
    hasInitialData: !!initialData,
    name: initialData?.name,
    activitiesCount: initialData?.activities?.length,
    activeDays: initialData?.activeDays
  });

  // Usar useRef para rastrear se já inicializamos
  const hasInitialized = useRef(false);

  // Calcula data de início (hoje, zerada)
  const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  // 4 semanas = 28 dias
  const getDefaultEndDate = () => {
    const fourWeeksLater = new Date(getTodayDate().getTime() + (28 * 24 * 60 * 60 * 1000));
    fourWeeksLater.setHours(0, 0, 0, 0);
    return fourWeeksLater;
  };

  // ✅ CORREÇÃO: Função separada para criar estado inicial
  const getInitialState = (data?: Partial<CreateScheduleDTO>): CreateScheduleDTO => {
    console.log('🔄 getInitialState chamado com data:', data);

    if (data && Object.keys(data).length > 0) {
      console.log('📥 Usando data para estado inicial:', {
        name: data.name,
        activitiesCount: data.activities?.length,
        activeDays: data.activeDays
      });

      return {
        name: data.name || '',
        description: data.description || '',
        category: data.category || 'educational',
        startDate: data.startDate instanceof Date ? data.startDate : getTodayDate(),
        endDate: data.endDate instanceof Date ? data.endDate : getDefaultEndDate(),
        activeDays: data.activeDays || [0, 1, 2, 3, 4, 5, 6],
        repeatRules: {
          resetOnRepeat: data.repeatRules?.resetOnRepeat ?? true,
        },
        activities: data.activities || [],
      };
    }

    console.log('🆕 Usando estado padrão (criação)');
    return {
      name: '',
      description: '',
      category: 'educational',
      startDate: getTodayDate(),
      endDate: getDefaultEndDate(),
      activeDays: [0, 1, 2, 3, 4, 5, 6],
      repeatRules: {
        resetOnRepeat: true,
      },
      activities: [],
    };
  };

  // ✅ CORREÇÃO: Inicialização SEMPRE com undefined primeiro
  const [formData, setFormData] = useState<CreateScheduleDTO>(() => getInitialState());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ✅✅✅ ESSENCIAL: useEffect para REIDRATAR quando initialData chegar
  useEffect(() => {
    // Se não tem initialData ou já inicializamos, ignora
    if (!initialData || hasInitialized.current) {
      return;
    }

    // Se initialData está vazio ou incompleto, ignora
    if (Object.keys(initialData).length === 0 || !initialData.name) {
      console.log('⚠️ initialData vazio ou incompleto, ignorando...');
      return;
    }

    console.log('♻️ REIDRATAÇÃO: Atualizando formulário com initialData:', {
      name: initialData.name,
      activities: initialData.activities?.length,
      activeDays: initialData.activeDays
    });

    // Criar novo estado com os dados carregados
    const newState = getInitialState(initialData);

    console.log('📋 Novo estado definido:', {
      name: newState.name,
      activities: newState.activities.length,
      activeDays: newState.activeDays
    });

    setFormData(newState);
    hasInitialized.current = true;

  }, [initialData]); // ⚠️ IMPORTANTE: Dependência em initialData

  // Log para debug do formData atual
  useEffect(() => {
    console.log('📊 formData atualizado:', {
      name: formData.name,
      activities: formData.activities.length,
      activeDays: formData.activeDays
    });
  }, [formData]);

  const updateField = useCallback((field: keyof CreateScheduleDTO, value: any) => {
    console.log(`📝 Atualizando campo ${field}:`, value);

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const addActivity = useCallback((activity: CreateActivityDTO) => {
    console.log('➕ Adicionando atividade:', {
      title: activity.title,
      day: activity.dayOfWeek,
      orderIndex: activity.orderIndex
    });

    setFormData(prev => {
      if (!prev.activeDays.includes(activity.dayOfWeek)) {
        const errorMsg = `Dia ${activity.dayOfWeek} não está ativo no cronograma`;
        console.warn('❌ Erro ao adicionar atividade:', errorMsg);
        setErrors(prevErrors => ({ ...prevErrors, activities: errorMsg }));
        return prev;
      }

      // Verificar e ajustar orderIndex para evitar conflitos
      const activitiesForDay = prev.activities.filter(a => a.dayOfWeek === activity.dayOfWeek);
      const existingIndices = activitiesForDay.map(a => a.orderIndex);

      let orderIndex = activity.orderIndex;
      while (existingIndices.includes(orderIndex)) {
        orderIndex++;
      }

      const activityWithAdjustedIndex = {
        ...activity,
        orderIndex
      };

      if (errors.activities) {
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors.activities;
          return newErrors;
        });
      }

      const newActivities = [...prev.activities, activityWithAdjustedIndex];
      console.log(`✅ Atividade adicionada. Total: ${newActivities.length}`);

      return {
        ...prev,
        activities: newActivities
      };
    });
  }, [errors]);

  const updateActivity = useCallback((index: number, activity: Partial<CreateActivityDTO>) => {
    console.log('✏️ Atualizando atividade:', { index, title: activity.title });

    setFormData(prev => {
      if (index < 0 || index >= prev.activities.length) {
        console.error('Índice de atividade inválido:', index);
        return prev;
      }

      const newActivities = [...prev.activities];
      const originalActivity = newActivities[index];

      // Preserva orderIndex original se não foi especificado
      const updatedActivity = {
        ...originalActivity,
        ...activity,
        orderIndex: activity.orderIndex !== undefined ? activity.orderIndex : originalActivity.orderIndex
      };

      newActivities[index] = updatedActivity;

      // Valida se o dia atualizado está ativo
      if (activity.dayOfWeek !== undefined && !prev.activeDays.includes(activity.dayOfWeek)) {
        const errorMsg = `Dia ${activity.dayOfWeek} não está ativo no cronograma`;
        setErrors(prevErrors => ({ ...prevErrors, activities: errorMsg }));
        return prev;
      }

      return { ...prev, activities: newActivities };
    });
  }, []);

  const removeActivity = useCallback((index: number) => {
    console.log('🗑️ Removendo atividade:', index);

    setFormData(prev => {
      if (index < 0 || index >= prev.activities.length) {
        console.error('Índice de atividade inválido para remoção:', index);
        return prev;
      }

      const activityToRemove = prev.activities[index];

      // Remove a atividade
      const filteredActivities = prev.activities.filter((_, i) => i !== index);

      // Reordena atividades do mesmo dia
      const reorderedActivities = filteredActivities.map(activity => {
        if (activity.dayOfWeek === activityToRemove.dayOfWeek && activity.orderIndex > activityToRemove.orderIndex) {
          return {
            ...activity,
            orderIndex: activity.orderIndex - 1
          };
        }
        return activity;
      });

      console.log(`✅ Atividade removida. Restantes: ${reorderedActivities.length}`);

      return {
        ...prev,
        activities: reorderedActivities
      };
    });
  }, []);

  const validateForm = useCallback((): boolean => {
    console.log('🔍 Validando formulário...');
    const validation = ValidationUtils.validateScheduleData(formData);

    if (!validation.isValid) {
      console.warn('❌ Validação falhou:', validation.errors);
      const fieldErrors: Record<string, string> = {};
      const allErrors: string[] = [];

      validation.errors.forEach(error => {
        allErrors.push(error);

        if (error.includes('Nome')) fieldErrors.name = error;
        else if (error.includes('Data de início')) fieldErrors.startDate = error;
        else if (error.includes('Data de término')) fieldErrors.endDate = error;
        else if (error.includes('dia da semana') || error.includes('Dias da semana')) {
          fieldErrors.activeDays = error;
        }
        else if (error.includes('atividade') || error.includes('Atividade')) {
          if (fieldErrors.activities) {
            fieldErrors.activities = `${fieldErrors.activities}; ${error}`;
          } else {
            fieldErrors.activities = error;
          }
        }
        else {
          fieldErrors._general = error;
        }
      });

      setErrors(fieldErrors);
      return false;
    }

    console.log('✅ Formulário válido');
    setErrors({});
    return true;
  }, [formData]);

  const submitForm = useCallback(async (professionalId: string) => {
    console.log('🚀 Submetendo formulário (criação)...', {
      professionalId,
      name: formData.name,
      activities: formData.activities.length
    });

    if (!validateForm()) {
      throw new Error('Formulário inválido. Corrija os erros antes de salvar.');
    }

    setSubmitting(true);
    try {
      // Sanitiza os dados antes de enviar
      const sanitizedData = ValidationUtils.sanitizeScheduleData(formData);
      console.log('📤 Dados sanitizados para envio:', sanitizedData);

      const result = await ScheduleService.createScheduleTemplate(
        professionalId,
        sanitizedData
      );

      console.log('✅ Cronograma criado com sucesso:', result.scheduleId);

      // Resetar formulário após sucesso (apenas se não for edição)
      if (!initialData) {
        const today = new Date();
        const fourWeeksLater = new Date(today.getTime() + (28 * 24 * 60 * 60 * 1000));

        setFormData({
          name: '',
          description: '',
          category: 'educational',
          startDate: today,
          endDate: fourWeeksLater,
          activeDays: [1, 2, 3, 4, 5],
          repeatRules: {
            resetOnRepeat: true,
          },
          activities: []
        });
      }

      setErrors({});

      return result;
    } catch (error: any) {
      console.error('❌ Erro ao salvar cronograma:', error);
      const errorMessage = error.message || 'Erro ao salvar cronograma';
      setErrors({ _general: errorMessage });
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [formData, validateForm, initialData]);

  // ✅ NOVO: Função para atualizar cronograma existente
  const updateExistingSchedule = useCallback(async (scheduleId: string, professionalId: string) => {
    console.log('🔄 Atualizando cronograma existente:', { scheduleId, professionalId });

    if (!validateForm()) {
      throw new Error('Formulário inválido. Corrija os erros antes de atualizar.');
    }

    setSubmitting(true);
    try {
      const sanitizedData = ValidationUtils.sanitizeScheduleData(formData);
      console.log('📤 Dados para atualização:', sanitizedData);

      const newScheduleId = await ScheduleService.updateScheduleTemplate(
        scheduleId,
        professionalId,
        sanitizedData
      );

      console.log('✅ Cronograma atualizado com sucesso. Nova versão:', newScheduleId);

      return newScheduleId;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar cronograma:', error);
      const errorMessage = error.message || 'Erro ao atualizar cronograma';
      setErrors({ _general: errorMessage });
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [formData, validateForm]);

  return {
    formData,
    errors,
    submitting,
    updateField,
    addActivity,
    updateActivity,
    removeActivity,
    validateForm,
    submitForm,
    updateExistingSchedule,
    hasActivities: formData.activities.length > 0
  };
}