// context/AuthContext.tsx - REFATORADO E CORRIGIDO
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { AuthContextType, User, LoginResult, RegisterResult, AuthError } from '@/types';
import { usePathname, useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth/AuthService';
import { UserService } from '@/lib/auth/UserService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Função para buscar usuário completo
  const fetchUserData = async (userId: string): Promise<User | null> => {
    try {
      // Primeiro, determinar tipo de usuário
      const userType = await UserService.getUserType(userId);
      
      // Buscar dados completos
      const userData = await UserService.getUser(userId, userType);
      return userData as User;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Login unificado com redirecionamento
  const login = async (email: string, password: string): Promise<LoginResult> => {
    setLoading(true);
    try {
      const result = await AuthService.login(email, password);
      
      // Buscar dados completos do usuário
      const userData = await fetchUserData(result.userId);
      if (userData) {
        setUser(userData);
        
        // Redirecionar baseado no tipo
        if (result.userType === 'professional') {
          router.push('/professional/dashboard');
        } else {
          router.push('/student/dashboard');
        }
      }
      
      return result;
    } catch (error: any) {
      console.error('Login error in context:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Registro unificado com redirecionamento
  const register = async (data: any): Promise<RegisterResult> => {
    setLoading(true);
    try {
      const result = await AuthService.register(data);
      
      // Se registro foi bem sucedido, fazer login automático
      if (result.success && result.userId) {
        // Em produção, aqui faríamos login automático ou redirecionaria para confirmação
        // Por enquanto, redirecionar para login
        router.push('/login');
      }
      
      return result;
    } catch (error: any) {
      console.error('Registration error in context:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout com redirecionamento
  const logout = async (): Promise<void> => {
    try {
      await AuthService.logout();
      setUser(null);
      router.push('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Listener de estado de autenticação SIMPLIFICADO
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await fetchUserData(firebaseUser.uid);
          setUser(userData);
        } catch (error) {
          console.error('Error fetching user on auth state change:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Redirecionamento baseado em autenticação - LÓGICA SIMPLIFICADA
  useEffect(() => {
    if (loading) return;
    
    const publicPaths = ['/login', '/register', '/', '/forgot-password'];
    const isPublicPath = publicPaths.includes(pathname);
    
    // Se não está logado e está tentando acessar área privada
    if (!user && !isPublicPath) {
      router.push('/login');
      return;
    }
    
    // Se está logado e está em página pública
    if (user && isPublicPath) {
      // Redirecionar para dashboard apropriado
      const targetPath = user.role === 'student' 
        ? '/student/dashboard' 
        : '/professional/dashboard';
      router.push(targetPath);
      return;
    }
    
    // Se está logado e tenta acessar área do tipo errado
    if (user) {
      if (user.role === 'student' && pathname.startsWith('/professional')) {
        router.push('/student/dashboard');
      } else if (user.role !== 'student' && pathname.startsWith('/student')) {
        router.push('/professional/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};