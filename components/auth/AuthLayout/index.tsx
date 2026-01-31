'use client';

import React, { useState, useEffect } from 'react';
import BrandSection from './BrandSection';
import FloatingElements from './FloatingElements';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 relative overflow-hidden">
      {/* Background Elements - Condicional para mobile */}
      {!isMobile && <FloatingElements userType={userType} />}
      
      {/* Mobile-optimized layout */}
      <div className="flex w-full min-h-screen flex-col lg:flex-row">
        {/* Brand Section - Oculto em mobile, visível em desktop */}
        <AnimatePresence>
          {!isMobile && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="hidden lg:flex lg:flex-[0_0_45%] bg-white/10 backdrop-blur-lg p-8 lg:p-12 flex-col justify-center text-white lg:min-h-screen overflow-auto"
            >
              <BrandSection 
                type={type}
                userType={userType}
                title={title}
                subtitle={subtitle}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Content Area */}
        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex items-center justify-center p-4 md:p-6 lg:p-8 w-full"
        >
          <div className="w-full max-w-md md:max-w-lg lg:max-w-md">
            {/* Mobile Header (apenas em mobile) */}
            {isMobile && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8 text-center"
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    {userType === 'student' ? (
                      <span className="text-white text-xl">🎓</span>
                    ) : (
                      <span className="text-white text-xl">👨‍⚕️</span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-white">
                    Nexus<span className="text-indigo-200">Platform</span>
                  </h1>
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">
                  {type === 'login' ? 'Bem-vindo de volta' : 'Comece sua jornada'}
                </h2>
                <p className="text-white/90 text-sm">
                  {subtitle || (type === 'login' 
                    ? 'Entre para continuar sua experiência' 
                    : 'Cadastre-se para acesso completo')}
                </p>
              </motion.div>
            )}
            
            {children}
            
            {/* Mobile Footer */}
            {isMobile && (
              <div className="mt-8 pt-6 border-t border-white/20 text-center">
                <p className="text-white/80 text-sm">
                  Ambiente 100% seguro • Conforme LGPD
                </p>
                <p className="text-white/60 text-xs mt-2">
                  © {new Date().getFullYear()} Nexus Platform
                </p>
              </div>
            )}
          </div>
        </motion.main>
      </div>
    </div>
  );
}