// app\(auth)\login\page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthCard from '@/components/auth/ui/AuthCard';
import LoginFormContainer from '@/components/auth/forms/LoginFormContainer';
import { FaLock, FaUserGraduate } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'Login - Nexus Platform',
  description: 'Acesse sua conta na Nexus Platform',
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Bem-vindo de volta"
      subtitle="Entre na sua conta para continuar"
      type="login"
    >
      <AuthCard
        title="Acesso à Plataforma"
        subtitle="Use suas credenciais para entrar"
        icon={<FaLock size={32} className="text-indigo-500" />}
        footer={
          <div className="flex flex-col gap-2">
            <div className="text-sm text-gray-600">
              Primeiro acesso?{' '}
              <Link 
                href="/register" 
                className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
              >
                Crie uma conta
              </Link>
            </div>
            <div className="text-sm text-gray-600">
              <Link 
                href="/forgot-password" 
                className="text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="mt-4 text-sm">
              <Link 
                href="/register?type=student" 
                className="flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700 transition-colors"
              >
                <FaUserGraduate className="w-3.5 h-3.5" />
                Sou aluno
              </Link>
            </div>
          </div>
        }
      >
        <LoginFormContainer />
      </AuthCard>
    </AuthLayout>
  );
}