import { RegisterData, ValidationResult } from '@/types';
import { cpfValidator } from './cpfValidator';
import { emailValidator } from './emailValidator';
import { dateValidator } from './dateValidator';
import { phoneValidator } from './phoneValidator';
import { professionalValidator } from './professionalValidator';

export class ValidationService {
  // Validação de registro completo
  static async validateRegister(data: RegisterData): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validações básicas
    const nameValidation = this.validateName(data.name);
    if (!nameValidation.valid) errors.push(nameValidation.error!);

    const emailValidation = this.validateEmail(data.email);
    if (!emailValidation.valid) errors.push(emailValidation.error!);

    const passwordValidation = this.validatePassword(data.password, data.confirmPassword);
    if (!passwordValidation.valid) errors.push(passwordValidation.error!);

    // Validações específicas por tipo
    if (data.type === 'student') {
      const studentValidation = await this.validateStudentData(data);
      if (!studentValidation.valid) {
        errors.push(...(studentValidation.metadata?.errors || []));
      }
    } else {
      const professionalValidation = await this.validateProfessionalData(data);
      if (!professionalValidation.valid) {
        errors.push(...(professionalValidation.metadata?.errors || []));
      }
    }

    if (errors.length > 0) {
      return {
        valid: false,
        error: errors.join(' '),
        metadata: { errors }
      };
    }

    return { valid: true };
  }

  // Validação de login
  static validateLogin(email: string, password: string): ValidationResult {
    const errors: string[] = [];

    const emailValidation = this.validateEmail(email);
    if (!emailValidation.valid) errors.push(emailValidation.error!);

    if (!password || password.length < 6) {
      errors.push('A senha deve ter pelo menos 6 caracteres');
    }

    if (errors.length > 0) {
      return {
        valid: false,
        error: errors.join(' '),
        metadata: { errors }
      };
    }

    return { valid: true };
  }

  // Validações individuais
  static validateName(name: string): ValidationResult {
    if (!name || name.trim().length < 3) {
      return {
        valid: false,
        error: 'Nome deve ter pelo menos 3 caracteres'
      };
    }

    if (name.length > 100) {
      return {
        valid: false,
        error: 'Nome muito longo (máximo 100 caracteres)'
      };
    }

    return { valid: true };
  }

  static validateEmail(email: string): ValidationResult {
    return emailValidator.validate(email);
  }

  static validatePassword(password: string, confirmPassword?: string): ValidationResult {
    if (!password || password.length < 6) {
      return {
        valid: false,
        error: 'A senha deve ter pelo menos 6 caracteres'
      };
    }

    if (password.length > 128) {
      return {
        valid: false,
        error: 'Senha muito longa (máximo 128 caracteres)'
      };
    }

    // Verificar força da senha
    const strength = this.getPasswordStrength(password);
    if (strength.score < 2) {
      return {
        valid: false,
        error: 'Senha muito fraca. Use letras maiúsculas, minúsculas e números'
      };
    }

    // Verificar se as senhas coincidem
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return {
        valid: false,
        error: 'As senhas não coincidem'
      };
    }

    return { valid: true };
  }

  // Validação de dados do estudante
  private static async validateStudentData(data: RegisterData): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!data.cpf) {
      errors.push('CPF é obrigatório');
    } else {
      const cpfValidation = cpfValidator.validate(data.cpf);
      if (!cpfValidation.valid) errors.push(cpfValidation.error!);
    }

    if (!data.birthday) {
      errors.push('Data de nascimento é obrigatória');
    } else {
      const dateValidation = dateValidator.validateBirthdate(data.birthday, 4, 120); // 4-120 anos
      if (!dateValidation.valid) errors.push(dateValidation.error!);
    }

    if (!data.school) {
      errors.push('Escola é obrigatória');
    } else if (data.school.length < 3) {
      errors.push('Nome da escola muito curto');
    }

    if (!data.grade) {
      errors.push('Série/ano é obrigatório');
    }

    if (data.phone) {
      const phoneValidation = phoneValidator.validate(data.phone);
      if (!phoneValidation.valid) errors.push(phoneValidation.error!);
    }

    if (errors.length > 0) {
      return {
        valid: false,
        error: 'Erros nos dados do aluno',
        metadata: { errors }
      };
    }

    return { valid: true };
  }

  // Validação de dados do profissional - ATUALIZADO
  private static async validateProfessionalData(data: RegisterData): Promise<ValidationResult> {
    const errors: string[] = [];

    // CPF é obrigatório para profissionais
    if (!data.cpf) {
      errors.push('CPF é obrigatório');
    } else {
      const cpfValidation = cpfValidator.validate(data.cpf);
      if (!cpfValidation.valid) errors.push(cpfValidation.error!);
    }

    // Role é obrigatório
    if (!data.role) {
      errors.push('Função profissional é obrigatória');
    }

    // LicenseNumber, specialization, institution são opcionais no registro inicial

    // Validação de email institucional (opcional por enquanto)
    if (process.env.NEXT_PUBLIC_REQUIRE_INSTITUTIONAL_EMAIL === 'true') {
      const emailValidation = await professionalValidator.validateEmail(data.email);
      if (!emailValidation.valid) errors.push(emailValidation.error!);
    }

    if (errors.length > 0) {
      return {
        valid: false,
        error: 'Erros nos dados do profissional',
        metadata: { errors }
      };
    }

    return { valid: true };
  }

  // Avaliar força da senha
  private static getPasswordStrength(password: string): { score: number; label: string } {
    let score = 0;
    
    // Comprimento
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Complexidade
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    const labels = ['Muito fraca', 'Fraca', 'Média', 'Boa', 'Forte', 'Muito forte'];
    
    return {
      score: Math.min(score, labels.length - 1),
      label: labels[Math.min(score, labels.length - 1)]
    };
  }
}

// Exportar validadores individuais também
export { cpfValidator, emailValidator, dateValidator, phoneValidator, professionalValidator };