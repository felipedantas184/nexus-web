// components/auth/AuthLayout/index.tsx
'use client';

import React from 'react';
import BrandSection from './BrandSection';
import FloatingElements from './FloatingElements';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  type?: 'login' | 'register';
  userType?: 'student' | 'professional';
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  type = 'login',
  userType = 'professional'
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-500 to-purple-600 relative overflow-hidden">
      <FloatingElements userType={userType} />
      
      <div className="flex w-full min-h-screen lg:flex-row flex-col">
        <BrandSection 
          type={type}
          userType={userType}
          title={title}
          subtitle={subtitle}
        />
        
        <main 
          className="flex-1 flex items-center justify-center p-8 lg:p-4"
          style={{
            animation: 'fadeInUp 0.6s ease-out'
          }}
        >
          <div className="w-full max-w-md">
            {children}
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}