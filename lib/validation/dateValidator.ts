// lib/validation/dateValidator.ts
export const dateValidator = {
  validateBirthdate(
    dateString: string,
    minAge: number = 4,
    maxAge: number = 120
  ): { valid: boolean; error?: string } {
    if (!dateString) {
      return { valid: false, error: 'Data é obrigatória' };
    }
    
    const birthDate = new Date(dateString);
    const today = new Date();
    
    // Verificar se é uma data válida
    if (isNaN(birthDate.getTime())) {
      return { valid: false, error: 'Data inválida' };
    }
    
    // Verificar se não é data futura
    if (birthDate > today) {
      return { valid: false, error: 'Data de nascimento não pode ser futura' };
    }
    
    // Calcular idade
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    // Verificar idade mínima e máxima
    if (age < minAge) {
      return {
        valid: false,
        error: `Idade mínima: ${minAge} anos. Responsável necessário.`
      };
    }
    
    if (age > maxAge) {
      return { valid: false, error: 'Data de nascimento inválida' };
    }
    
    return { valid: true };
  },
  
  formatToISO(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }
};