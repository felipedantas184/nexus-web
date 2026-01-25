// app/layout/student-layout.tsx
'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import StudentSidebar from '@/components/layout/StudentSidebar';
import StudentNavbar from '@/components/layout/StudentNavbar';
import { FaQuestionCircle } from 'react-icons/fa';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
        {/* Sidebar */}
        <div className="fixed left-0 top-0 z-40">
          <StudentSidebar 
            open={sidebarOpen} 
            onNavigate={() => setSidebarOpen(false)}
          />
        </div>

        {/* Main Content Area */}
        <div className={`
          min-h-screen transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-0'}
        `}>
          {/* Navbar */}
          <StudentNavbar 
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            sidebarCollapsed={!sidebarOpen}
          />

          {/* Page Content */}
          <main className="">
            {/* Content Container */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/70 shadow-sm min-h-[calc(100vh-16rem)]">
              {children}
            </div>

            {/* Footer */}
            <footer className="mt-8 text-center text-sm text-gray-500">
              <p>
                Nexus Platform - Saúde Mental & Educação Integradas • 
                <span className="ml-2 text-purple-600 font-medium">Sua evolução importa</span>
              </p>
              <p className="mt-1 text-xs">
                Em caso de crise, entre em contato com seu profissional de saúde mental
              </p>
            </footer>
          </main>

          {/* Floating Help Button */}
          <button
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 
                     text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 
                     flex items-center justify-center z-30"
            onClick={() => {/* Abrir chat de suporte */}}
            title="Precisa de ajuda?"
          >
            <FaQuestionCircle className="w-6 h-6" />
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}