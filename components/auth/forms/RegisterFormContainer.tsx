// components/auth/forms/RegisterFormContainer.tsx
'use client';

import React, { useState } from 'react';
import AuthForm from './AuthForm';
import { useRouter } from 'next/navigation';
import { RegisterResult, AuthError } from '@/types';

interface RegisterFormContainerProps {
  defaultUserType: 'student' | 'professional';
}

export default function RegisterFormContainer({ 
  defaultUserType 
}: RegisterFormContainerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSuccess = (result: RegisterResult) => {
    console.log('Registration successful:', result);
    
    if (result.requiresVerification) {
      // Redirecionar para página de verificação
      router.push('/verify-email');
    } else {
      // Redirecionar para login
      router.push('/login?registered=true');
    }
  };

  const handleError = (error: AuthError) => {
    console.error('Registration error:', error);
  };

  return (
    <AuthForm
      mode="register"
      defaultUserType={defaultUserType}
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
}