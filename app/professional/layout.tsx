// app/layout/professional-layout.tsx
'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ProfessionalSidebar from '@/components/layout/ProfessionalSidebar';
import ProfessionalNavbar from '@/components/layout/ProfessionalNavbar';

export default function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ProtectedRoute allowedRoles={['psychologist', 'psychiatrist', 'monitor', 'coordinator']}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Sidebar */}
        <div className="fixed left-0 top-0 z-40">
          <ProfessionalSidebar
            open={sidebarOpen}
            onNavigate={() => setSidebarOpen(false)}
          />
        </div>

        {/* Main Content Area */}
        <div className={`
          h-screen transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-0'}
        `}
        >
          {/* Navbar */}
          <ProfessionalNavbar
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            sidebarCollapsed={!sidebarOpen}
          />

          {/* Page Content */}
          <main className="h-[calc(100vh-64px)] overflow-y-auto no-scrollbar">
            {/* Content Container */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/70 shadow-sm min-h-[calc(100vh-12rem)]">
              {children}
            </div>

            {/* Footer */}
            <footer className="mt-8 text-center text-sm text-gray-500">
              <p>
                Nexus Platform •
                <span className="ml-2 text-blue-600 font-medium">Professional Edition v2.0</span>
                <span className="mx-2">•</span>
                <span>Suporte: support@nexusplatform.com</span>
              </p>
              <p className="mt-1 text-xs">
                Todos os dados são criptografados e protegidos conforme LGPD/HIPAA
              </p>
            </footer>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}