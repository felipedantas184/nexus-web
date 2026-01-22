// lib/validation/cpfValidator.ts
export const cpfValidator = {
  validate(cpf: string): { valid: boolean; error?: string } {
    // Remover caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // Verificar tamanho
    if (cleanCPF.length !== 11) {
      return { valid: false, error: 'CPF deve conter 11 dígitos' };
    }
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      return { valid: false, error: 'CPF inválido' };
    }
    
    // Validar primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) {
      return { valid: false, error: 'CPF inválido' };
    }
    
    // Validar segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) {
      return { valid: false, error: 'CPF inválido' };
    }
    
    return { valid: true };
  },
  
  format(cpf: string): string {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return cpf;
    
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
};