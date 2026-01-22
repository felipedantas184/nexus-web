// lib/utils/encryption.ts - SIMPLIFICADO PARA DEV
// Em produção, usar bibliotecas como crypto-js ou Web Crypto API

// Chave de encryption (EM PRODUÇÃO, usar variáveis de ambiente)
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'dev-key-123456';

export const encryptData = (data: string): string => {
  // Implementação simplificada para desenvolvimento
  // EM PRODUÇÃO: Usar AES-256-GCM com Web Crypto API
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ Usando encryption simplificado. Em produção, implemente encryption real.');
  }
  
  // Base64 encoding simples (NÃO SEGURO para produção)
  return btoa(unescape(encodeURIComponent(data + '|' + ENCRYPTION_KEY)));
};

export const decryptData = (encrypted: string): string => {
  try {
    // Base64 decoding simples
    const decoded = decodeURIComponent(escape(atob(encrypted)));
    const parts = decoded.split('|');
    
    if (parts.length === 2 && parts[1] === ENCRYPTION_KEY) {
      return parts[0];
    }
    
    throw new Error('Decryption failed');
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
};

// Função para gerar hash (para busca sem expor dados)
export const generateHash = (data: string): string => {
  // Implementação simplificada
  // EM PRODUÇÃO: Usar SHA-256
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};