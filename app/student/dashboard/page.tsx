// app/student/dashboard/page.tsx
'use client';

import React from 'react';
import StudentDashboard from '@/components/student/StudentDashboard';
import { 
  FaBell, 
  FaCog, 
  FaQuestionCircle,
  FaSignOutAlt
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function StudentDashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await logout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Home */}
            <div className="flex items-center">
              <Link href="/student/dashboard" className="text-xl font-bold text-indigo-600">
                Nexus Platform
              </Link>
              <span className="ml-2 text-sm text-gray-500">Aluno</span>
            </div>

            {/* Navegação */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/student/dashboard" className="text-gray-700 hover:text-indigo-600 font-medium">
                Dashboard
              </Link>
              <Link href="/student/schedules" className="text-gray-700 hover:text-indigo-600">
                Cronogramas
              </Link>
              <Link href="/student/progress" className="text-gray-700 hover:text-indigo-600">
                Progresso
              </Link>
              <Link href="/student/achievements" className="text-gray-700 hover:text-indigo-600">
                Conquistas
              </Link>
            </div>

            {/* Ações do Usuário */}
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-800">
                <FaBell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <Link href="/student/settings" className="p-2 text-gray-600 hover:text-gray-800">
                <FaCog className="w-5 h-5" />
              </Link>
              
              <Link href="/student/help" className="p-2 text-gray-600 hover:text-gray-800">
                <FaQuestionCircle className="w-5 h-5" />
              </Link>
              
              <div className="relative group">
                <button className="flex items-center space-x-2 focus:outline-none">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-indigo-600">
                      {user?.name?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                  <span className="hidden md:inline text-gray-700">{user?.name}</span>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block z-10">
                  <Link href="/student/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    Meu Perfil
                  </Link>
                  <Link href="/student/settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    Configurações
                  </Link>
                  <div className="border-t my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    <FaSignOutAlt className="mr-2" />
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main>
        <StudentDashboard showHeader={true} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="text-lg font-bold text-indigo-600">Nexus Platform</div>
              <p className="text-sm text-gray-600">
                Plataforma terapêutico-educacional integrada
              </p>
            </div>
            
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-800">
                Privacidade
              </Link>
              <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-800">
                Termos
              </Link>
              <Link href="/help" className="text-sm text-gray-600 hover:text-gray-800">
                Ajuda
              </Link>
              <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-800">
                Contato
              </Link>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Nexus Platform. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}