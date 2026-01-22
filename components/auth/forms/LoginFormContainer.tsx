// components/auth/forms/LoginFormContainer.tsx
'use client';

import React, { useState } from 'react';
import AuthForm from './AuthForm';
import { useRouter } from 'next/navigation';
import { LoginResult, AuthError } from '@/types';

export default function LoginFormContainer() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSuccess = (result: LoginResult) => {
    console.log('Login successful:', result);
    // Redirecionamento já acontece no AuthContext
  };

  const handleError = (error: AuthError) => {
    console.error('Login error:', error);
    // O erro já é mostrado no AuthForm
  };

  return (
    <AuthForm
      mode="login"
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
}