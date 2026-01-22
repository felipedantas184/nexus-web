// lib/validation/professionalValidator.ts
export const professionalValidator = {
  async validateEmail(email: string): Promise<{ valid: boolean; error?: string }> {
    const domain = email.split('@')[1]?.toLowerCase();
    
    if (!domain) {
      return { valid: false, error: 'Email inválido' };
    }
    
    // Lista de domínios autorizados para profissionais
    // Em produção, isso viria de uma configuração ou banco de dados
    const allowedDomains = [
      // Domínios governamentais
      '.gov.br',
      '.saude.gov.br',
      '.sus.gov.br',
      
      // Hospitais e clínicas (exemplos)
      'hospital.com.br',
      'clinica.com.br',
      'saude.com.br',
      
      // Universidades
      '.edu.br',
      '.usp.br',
      '.unifesp.br',
      
      // Orgaos de classe (exemplos)
      'cremesp.org.br',
      'crp.org.br',
      'gmail.com',
      'hotmail.com'
    ];
    
    const isValidDomain = allowedDomains.some(allowed => 
      domain.endsWith(allowed)
    );
    
    if (!isValidDomain) {
      return {
        valid: false,
        error: 'Email institucional requerido. Use email da sua instituição de saúde/educação.'
      };
    }
    
    return { valid: true };
  },
  
  validateLicenseNumber(
    licenseNumber: string,
    role?: string
  ): { valid: boolean; error?: string } {
    if (!licenseNumber) {
      return { valid: false, error: 'Registro profissional é obrigatório' };
    }
    
    const cleanLicense = licenseNumber.replace(/\s+/g, '').toUpperCase();
    
    if (role === 'psychologist' || role === 'psychiatrist') {
      // Validar CRP (psicólogos) - Formato: XX/XXXXX
      if (role === 'psychologist') {
        const crpRegex = /^\d{2}\/\d{5}$/;
        if (!crpRegex.test(cleanLicense)) {
          return {
            valid: false,
            error: 'Formato de CRP inválido. Use: XX/XXXXX'
          };
        }
      }
      
      // Validar CRM (psiquiatras) - Formato: CRM-XX XXXXX
      if (role === 'psychiatrist') {
        const crmRegex = /^CRM-\w{2}\s?\d{4,5}$/;
        if (!crmRegex.test(cleanLicense)) {
          return {
            valid: false,
            error: 'Formato de CRM inválido. Use: CRM-XX XXXXX'
          };
        }
      }
    }
    
    return { valid: true };
  },
  
  formatLicenseNumber(licenseNumber: string, role?: string): string {
    const cleanLicense = licenseNumber.replace(/\s+/g, '').toUpperCase();
    
    if (role === 'psychologist') {
      // Formatar CRP: 12345678901 -> 12/34567
      if (cleanLicense.length === 7) {
        return cleanLicense.replace(/(\d{2})(\d{5})/, '$1/$2');
      }
    }
    
    if (role === 'psychiatrist') {
      // Formatar CRM: CRMSP123456 -> CRM-SP 123456
      const match = cleanLicense.match(/^CRM(\w{2})(\d+)$/);
      if (match) {
        return `CRM-${match[1]} ${match[2]}`;
      }
    }
    
    return licenseNumber;
  }
};