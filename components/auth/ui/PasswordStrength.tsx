// components/auth/ui/PasswordStrength.tsx
'use client';

import React from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface PasswordStrengthProps {
  password: string;
  confirmPassword?: string;
}

export default function PasswordStrength({ password, confirmPassword }: PasswordStrengthProps) {
  const getStrength = () => {
    let score = 0;
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };

    Object.values(requirements).forEach(met => {
      if (met) score++;
    });

    const strengthLevels = [
      { label: 'Muito fraca', color: 'bg-red-500', textColor: 'text-red-600' },
      { label: 'Fraca', color: 'bg-orange-500', textColor: 'text-orange-600' },
      { label: 'Média', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
      { label: 'Boa', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
      { label: 'Forte', color: 'bg-green-600', textColor: 'text-green-600' },
      { label: 'Muito forte', color: 'bg-green-700', textColor: 'text-green-700' }
    ];

    return {
      score,
      ...strengthLevels[Math.min(score, strengthLevels.length - 1)],
      percentage: Math.max(10, score * 20)
    };
  };

  const strength = getStrength();

  return (
    <div className="mt-2">
      {password && (
        <>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div 
              className={`h-full ${strength.color} transition-all duration-300`}
              style={{ width: `${strength.percentage}%` }}
            />
          </div>
          <div className={`text-xs font-semibold ${strength.textColor} mb-4`}>
            Força: {strength.label}
          </div>
        </>
      )}
      
      <div className="space-y-2">
        <div className={`flex items-center gap-2 text-xs ${password.length >= 8 ? 'text-emerald-600' : 'text-gray-500'}`}>
          {password.length >= 8 ? (
            <FaCheckCircle className="w-3 h-3" />
          ) : (
            <FaTimesCircle className="w-3 h-3" />
          )}
          <span>Pelo menos 8 caracteres</span>
        </div>
        
        <div className={`flex items-center gap-2 text-xs ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-emerald-600' : 'text-gray-500'}`}>
          {/[A-Z]/.test(password) && /[a-z]/.test(password) ? (
            <FaCheckCircle className="w-3 h-3" />
          ) : (
            <FaTimesCircle className="w-3 h-3" />
          )}
          <span>Letras maiúsculas e minúsculas</span>
        </div>
        
        <div className={`flex items-center gap-2 text-xs ${/[0-9]/.test(password) ? 'text-emerald-600' : 'text-gray-500'}`}>
          {/[0-9]/.test(password) ? (
            <FaCheckCircle className="w-3 h-3" />
          ) : (
            <FaTimesCircle className="w-3 h-3" />
          )}
          <span>Pelo menos um número</span>
        </div>
        
        {confirmPassword !== undefined && (
          <div className={`flex items-center gap-2 text-xs ${password === confirmPassword && password.length > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
            {password === confirmPassword && password.length > 0 ? (
              <FaCheckCircle className="w-3 h-3" />
            ) : (
              <FaTimesCircle className="w-3 h-3" />
            )}
            <span>Senhas coincidem</span>
          </div>
        )}
      </div>
    </div>
  );
}