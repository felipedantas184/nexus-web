// app/student/dashboard/page.tsx - VERSÃO ATUALIZADA COM VISUAL INSPIRADOR
'use client';

import React, { useState, useEffect } from 'react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <main>
        <StudentDashboard showHeader={true} />
      </main>
    </div>
  );
}