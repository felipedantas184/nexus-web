// lib/utils/formatters.ts
import { cpfValidator, phoneValidator, professionalValidator } from '@/lib/validation';

export const formatters = {
  cpf: (value: string): string => {
    return cpfValidator.format(value);
  },
  
  phone: (value: string): string => {
    return phoneValidator.format(value);
  },
  
  licenseNumber: (value: string, role?: string): string => {
    return professionalValidator.formatLicenseNumber(value, role);
  },
  
  date: (value: string): string => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleDateString('pt-BR');
  },
  
  capitalize: (value: string): string => {
    return value
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },
  
  truncate: (value: string, length: number = 50): string => {
    if (value.length <= length) return value;
    return value.substring(0, length) + '...';
  }
};