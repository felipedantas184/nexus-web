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
      {/* Conteúdo Principal */}
      <main>
        <StudentDashboard showHeader={true} />
      </main>
    </div>
  );
}