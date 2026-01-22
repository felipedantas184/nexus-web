// hooks/useScheduleForm.ts
'use client';

import { useState, useCallback } from 'react';
import { ScheduleService } from '@/lib/services/ScheduleService';
import { CreateScheduleDTO, CreateActivityDTO } from '@/types/schedule';
import { ValidationUtils } from '@/lib/utils/validationUtils';

export function useScheduleForm() {
  const [formData, setFormData] = useState<CreateScheduleDTO>({
    name: '',
    description: '',
    category: 'mixed',
    startDate: new Date(),
    activeDays: [1, 2, 3, 4, 5], // Segunda a sexta
    repeatRules: {
      resetOnRepeat: true,
      maxRepetitions: undefined
    },
    activities: []
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
    setFormData(prev => ({
      ...prev,
      activities: [...prev.activities, activity]
    }));
  }, []);

  const updateActivity = useCallback((index: number, activity: Partial<CreateActivityDTO>) => {
    setFormData(prev => {
      const newActivities = [...prev.activities];
      newActivities[index] = { ...newActivities[index], ...activity };
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
      // Converter erros para formato de campo
      const fieldErrors: Record<string, string> = {};
      validation.errors.forEach(error => {
        // Tentar extrair o campo do erro
        if (error.includes('Nome')) fieldErrors.name = error;
        else if (error.includes('data')) fieldErrors.startDate = error;
        else if (error.includes('dia')) fieldErrors.activeDays = error;
        else if (error.includes('atividade')) fieldErrors.activities = error;
        else fieldErrors._general = error;
      });
      
      setErrors(fieldErrors);
      return false;
    }
    
    setErrors({});
    return true;
  }, [formData]);

  const submitForm = useCallback(async (professionalId: string) => {
    if (!validateForm()) {
      throw new Error('Formulário inválido');
    }

    setSubmitting(true);
    try {
      const result = await ScheduleService.createScheduleTemplate(
        professionalId,
        formData
      );
      
      // Resetar formulário após sucesso
      setFormData({
        name: '',
        description: '',
        category: 'mixed',
        startDate: new Date(),
        activeDays: [1, 2, 3, 4, 5],
        repeatRules: {
          resetOnRepeat: true,
          maxRepetitions: undefined
        },
        activities: []
      });
      
      setErrors({});
      
      return result;
    } catch (error: any) {
      setErrors({ _general: error.message });
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