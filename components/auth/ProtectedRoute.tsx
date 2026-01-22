// components/auth/ProtectedRoute.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('student' | 'psychologist' | 'psychiatrist' | 'monitor' | 'coordinator')[];
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = [] 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      // Se não está autenticado
      if (!user) {
        router.push('/login');
        return;
      }

      // Se tem restrição de roles
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirecionar para dashboard apropriado
        if (user.role === 'student') {
          router.push('/student/dashboard');
        } else {
          router.push('/professional/dashboard');
        }
        return;
      }

      // Verificar se está na área correta
      const isInStudentArea = pathname.startsWith('/student');
      const isInProfessionalArea = pathname.startsWith('/professional');

      if (user.role === 'student' && isInProfessionalArea) {
        router.push('/student/dashboard');
      } else if (user.role !== 'student' && isInStudentArea) {
        router.push('/professional/dashboard');
      }
    }
  }, [user, loading, router, pathname, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecionamento acontecerá no useEffect
  }

  return <>{children}</>;
}