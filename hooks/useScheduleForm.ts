// hooks/useScheduleForm.ts
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

  // Calcula data de término padrão (4 semanas depois, zerada)
  const getDefaultEndDate = () => {
    const fourWeeksLater = new Date(getTodayDate().getTime() + (6 * 24 * 60 * 60 * 1000));
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
    endDate: defaultEndDate, // OBRIGATÓRIO
    activeDays: [0, 1, 2, 3, 4, 5, 6], // Seg a Sex por padrão
    repeatRules: {
      resetOnRepeat: true,
    },
    activities: [],
    ...initialData // Sobrescreve com dados iniciais se fornecidos
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const updateField = useCallback((field: keyof CreateScheduleDTO, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpar erro do campo quando atualizado
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const addActivity = useCallback((activity: CreateActivityDTO) => {
    setFormData(prev => {
      // Valida se a atividade está em dia ativo
      if (!prev.activeDays.includes(activity.dayOfWeek)) {
        const errorMsg = `Dia ${activity.dayOfWeek} não está ativo no cronograma`;
        setErrors(prevErrors => ({ ...prevErrors, activities: errorMsg }));
        return prev;
      }

      // Limpa erro de atividades se existir
      if (errors.activities) {
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors.activities;
          return newErrors;
        });
      }

      return {
        ...prev,
        activities: [...prev.activities, activity]
      };
    });
  }, [errors]);

  const updateActivity = useCallback((index: number, activity: Partial<CreateActivityDTO>) => {
    setFormData(prev => {
      const newActivities = [...prev.activities];
      newActivities[index] = { ...newActivities[index], ...activity };

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
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index)
    }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const validation = ValidationUtils.validateScheduleData(formData);

    if (!validation.isValid) {
      // Converter erros para formato de campo + manter lista completa
      const fieldErrors: Record<string, string> = {};
      const allErrors: string[] = []; // Para debug

      validation.errors.forEach(error => {
        allErrors.push(error); // Guarda todos os erros

        // Mapeia erros para campos específicos
        if (error.includes('Nome')) fieldErrors.name = error;
        else if (error.includes('Data de início')) fieldErrors.startDate = error;
        else if (error.includes('Data de término')) fieldErrors.endDate = error;
        else if (error.includes('dia da semana') || error.includes('Dias da semana')) {
          fieldErrors.activeDays = error;
        }
        else if (error.includes('atividade') || error.includes('Atividade')) {
          // Se já tem erro de atividades, adiciona à lista
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

      // ADICIONE ESTE CONSOLE.LOG PARA DEBUG
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
    // Validação com ValidationUtils
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
      // Extrair mensagem de erro do Firebase/ScheduleService
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