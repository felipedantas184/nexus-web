// lib/validation/phoneValidator.ts
export const phoneValidator = {
  validate(phone: string): { valid: boolean; error?: string } {
    if (!phone) {
      return { valid: true }; // Telefone é opcional
    }
    
    // Remover caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Verificar se tem entre 10 e 11 dígitos (com DDD)
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return { valid: false, error: 'Telefone inválido. Use (DDD) 9XXXX-XXXX' };
    }
    
    // Verificar se DDD é válido (11-99)
    const ddd = parseInt(cleanPhone.substring(0, 2));
    if (ddd < 11 || ddd > 99) {
      return { valid: false, error: 'DDD inválido' };
    }
    
    return { valid: true };
  },
  
  format(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 10) {
      return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (cleanPhone.length === 11) {
      return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
  },
  
  normalize(phone: string): string {
    return phone.replace(/\D/g, '');
  }
};