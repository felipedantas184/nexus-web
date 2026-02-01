'use client';

import React, { useState, useEffect } from 'react';
import StudentDashboard from '@/components/student/StudentDashboard';
import { useAuth } from '@/context/AuthContext';
import GAD7Modal from '@/components/assessments/GAD7Modal';

export default function StudentDashboardPage() {
  const { user, logout } = useAuth();
  const [showGAD7, setShowGAD7] = useState(false);

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await logout();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      {/* Modal GAD-7 */}
      <GAD7Modal 
        onComplete={() => {
          console.log('Avaliação GAD-7 completada');
          setShowGAD7(false);
        }}
      />
      
      <main>
        <StudentDashboard showHeader={true} />
      </main>
    </div>
  );
}