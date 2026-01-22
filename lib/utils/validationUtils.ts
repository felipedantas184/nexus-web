import { ActivityType, CreateScheduleDTO } from "@/types/schedule";

// lib/utils/validationUtils.ts
export class ValidationUtils {
  static validateScheduleData(data: CreateScheduleDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Nome
    if (!data.name || data.name.trim().length < 3) {
      errors.push('Nome do cronograma deve ter pelo menos 3 caracteres');
    }

    // Datas
    if (data.startDate < new Date()) {
      errors.push('Data de início não pode ser no passado');
    }

    if (data.endDate && data.endDate <= data.startDate) {
      errors.push('Data de término deve ser após a data de início');
    }

    // Dias ativos
    if (!data.activeDays.length) {
      errors.push('Selecione pelo menos um dia da semana');
    }

    if (data.activeDays.some(day => day < 0 || day > 6)) {
      errors.push('Dias da semana devem estar entre 0 (domingo) e 6 (sábado)');
    }

    // Atividades
    if (!data.activities || data.activities.length === 0) {
      errors.push('Adicione pelo menos uma atividade');
    }

    // Validar atividades individuais
    data.activities.forEach((activity, index) => {
      if (activity.dayOfWeek < 0 || activity.dayOfWeek > 6) {
        errors.push(`Atividade ${index + 1}: Dia da semana inválido`);
      }

      if (activity.estimatedDuration <= 0) {
        errors.push(`Atividade ${index + 1}: Duração estimada deve ser positiva`);
      }

      if (activity.pointsOnCompletion < 0) {
        errors.push(`Atividade ${index + 1}: Pontuação não pode ser negativa`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateActivityConfig(type: ActivityType, config: any): boolean {
    switch (type) {
      case 'quick':
        return typeof config.autoComplete === 'boolean';
      
      case 'text':
        return typeof config.minWords === 'number' && 
               typeof config.maxWords === 'number';
      
      case 'quiz':
        return Array.isArray(config.questions) && 
               config.questions.length > 0 &&
               typeof config.passingScore === 'number';
      
      case 'video':
        return typeof config.url === 'string' && 
               config.url.includes('http');
      
      case 'checklist':
        return Array.isArray(config.items) && 
               config.items.length > 0;
      
      case 'file':
        return Array.isArray(config.allowedTypes) && 
               typeof config.maxSizeMB === 'number';
      
      default:
        return false;
    }
  }

  static sanitizeScheduleData(data: any): CreateScheduleDTO {
    return {
      ...data,
      name: (data.name || '').trim(),
      description: (data.description || '').trim(),
      activeDays: Array.from(new Set(data.activeDays || [])).sort(),
      activities: (data.activities || []).map((activity: any) => ({
        ...activity,
        title: (activity.title || '').trim(),
        instructions: (activity.instructions || '').trim(),
        description: (activity.description || '').trim(),
      }))
    };
  }
}