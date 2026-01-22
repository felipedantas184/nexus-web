// lib/validation/emailValidator.ts
export const emailValidator = {
  validate(email: string): { valid: boolean; error?: string } {
    if (!email) {
      return { valid: false, error: 'Email é obrigatório' };
    }
    
    // Regex básico de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Formato de email inválido' };
    }
    
    // Verificar domínios inválidos
    const invalidDomains = [
      'example.com',
      'test.com',
      'mailinator.com',
      'tempmail.com'
    ];
    
    const domain = email.split('@')[1].toLowerCase();
    if (invalidDomains.includes(domain)) {
      return { valid: false, error: 'Domínio de email não permitido' };
    }
    
    return { valid: true };
  }
};