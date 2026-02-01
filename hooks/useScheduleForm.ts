// hooks/useScheduleForm.ts - VERSÃO CORRIGIDA
'use client';

import { useState, useCallback } from 'react';
import { ScheduleService } from '@/lib/services/ScheduleService';
import { CreateScheduleDTO, CreateActivityDTO } from '@/types/schedule';
import { ValidationUtils } from '@/lib/utils/validationUtils';

export function useScheduleForm(initialData?: Partial<CreateScheduleDTO>) {
  // Calcula data de início (hoje, zerada)
  const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  // ✅ CORREÇÃO: 4 semanas = 28 dias
  const getDefaultEndDate = () => {
    const fourWeeksLater = new Date(getTodayDate().getTime() + (28 * 24 * 60 * 60 * 1000)); // ✅ 28 dias
    fourWeeksLater.setHours(0, 0, 0, 0);
    return fourWeeksLater;
  };

  const defaultStartDate = initialData?.startDate || getTodayDate();
  const defaultEndDate = initialData?.endDate || getDefaultEndDate();

  const [formData, setFormData] = useState<CreateScheduleDTO>({
    name: '',
    description: '',
    category: 'educational',
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    repeatRules: {
      resetOnRepeat: true,
    },
    activities: [],
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const updateField = useCallback((field: keyof CreateScheduleDTO, value: any) => {
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

  // ✅ CORREÇÃO: Adicionar atividade com índices consistentes
  const addActivity = useCallback((activity: CreateActivityDTO) => {
    setFormData(prev => {
      if (!prev.activeDays.includes(activity.dayOfWeek)) {
        const errorMsg = `Dia ${activity.dayOfWeek} não está ativo no cronograma`;
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

      return {
        ...prev,
        activities: [...prev.activities, activityWithAdjustedIndex]
      };
    });
  }, [errors]);

  // ✅ CORREÇÃO: Atualizar atividade mantendo consistência
  const updateActivity = useCallback((index: number, activity: Partial<CreateActivityDTO>) => {
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

  // ✅ CORREÇÃO: Remover atividade e reordenar as restantes do mesmo dia
  const removeActivity = useCallback((index: number) => {
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

      return {
        ...prev,
        activities: reorderedActivities
      };
    });
  }, []);

  const validateForm = useCallback((): boolean => {
    const validation = ValidationUtils.validateScheduleData(formData);

    if (!validation.isValid) {
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

      console.log('Erros de validação:', {
        errors: validation.errors,
        formData: {
          name: formData.name,
          startDate: formData.startDate,
          endDate: formData.endDate,
          activeDays: formData.activeDays,
          activitiesCount: formData.activities.length
        }
      });

      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [formData]);

  const submitForm = useCallback(async (professionalId: string) => {
    if (!validateForm()) {
      throw new Error('Formulário inválido. Corrija os erros antes de salvar.');
    }

    setSubmitting(true);
    try {
      // Sanitiza os dados antes de enviar
      const sanitizedData = ValidationUtils.sanitizeScheduleData(formData);

      const result = await ScheduleService.createScheduleTemplate(
        professionalId,
        sanitizedData
      );

      // Resetar formulário após sucesso
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

      setErrors({});

      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao salvar cronograma';
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
    hasActivities: formData.activities.length > 0
  };
}