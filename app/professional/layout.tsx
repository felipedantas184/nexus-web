// app/professional/layout.tsx
'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  FaChartLine, 
  FaCalendarAlt, 
  FaUsers, 
  FaCog,
  FaSignOutAlt,
  FaBell
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await logout();
    }
  };

  return (
    <ProtectedRoute allowedRoles={['psychologist', 'psychiatrist', 'monitor', 'coordinator']}>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white shadow-lg z-20">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-indigo-600">N</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-800">Nexus Platform</h1>
                <p className="text-xs text-gray-500">Profissional</p>
              </div>
            </div>
          </div>

          <nav className="p-4">
            <div className="space-y-2">
              <Link
                href="/professional/dashboard"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-50 text-gray-700 hover:text-indigo-600"
              >
                <FaChartLine />
                <span>Dashboard</span>
              </Link>
              
              <Link
                href="/professional/schedules"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-50 text-gray-700 hover:text-indigo-600"
              >
                <FaCalendarAlt />
                <span>Cronogramas</span>
              </Link>
              
              <Link
                href="/professional/analytics"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-50 text-gray-700 hover:text-indigo-600"
              >
                <FaChartLine />
                <span>Analytics</span>
              </Link>
              
              <Link
                href="/professional/students"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-50 text-gray-700 hover:text-indigo-600"
              >
                <FaUsers />
                <span>Alunos</span>
              </Link>
            </div>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="font-semibold text-indigo-600">
                  {user?.name?.charAt(0).toUpperCase() || 'P'}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            
            <div className="space-y-1">
              <Link
                href="/professional/settings"
                className="flex items-center gap-2 p-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                <FaCog className="w-4 h-4" />
                Configurações
              </Link>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full p-2 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                <FaSignOutAlt className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </aside>

        {/* Conteúdo Principal */}
        <main className="ml-64 p-6">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}