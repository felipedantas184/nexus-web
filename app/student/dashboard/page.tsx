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
import NotificationManager from '@/components/notifications/NotificationManager';

export default function StudentDashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await logout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Conteúdo Principal */}

       {/* Banner de notificações (opcional) 
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <NotificationManager />
      </div>*/}
      <main>
        <StudentDashboard showHeader={true} />
      </main>
    </div>
  );
}