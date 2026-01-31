'use client';

import React, { useState, useEffect } from 'react';
import { 
  FaUserMd, 
  FaUserGraduate, 
  FaCheckCircle,
  FaShieldAlt,
  FaMobileAlt,
  FaHeartbeat
} from 'react-icons/fa';
import { motion } from 'framer-motion';

interface BrandSectionProps {
  type: 'login' | 'register';
  userType: 'student' | 'professional';
  title?: string;
  subtitle?: string;
}

export default function BrandSection({ 
  type, 
  userType, 
  title, 
  subtitle 
}: BrandSectionProps) {
  const isStudent = userType === 'student';
  const isLogin = type === 'login';
  
  const defaultTitle = isLogin
    ? `Bem-vindo de volta à ${isStudent ? 'sua jornada' : 'plataforma'}`
    : `Junte-se à nossa ${isStudent ? 'comunidade' : 'rede profissional'}`;
  
  const defaultSubtitle = isLogin
    ? isStudent
      ? 'Continue sua jornada de aprendizado e crescimento personalizado.'
      : 'Acesse ferramentas especializadas para acompanhamento integrado.'
    : isStudent
      ? 'Experiência gamificada de aprendizado e desenvolvimento emocional.'
      : 'Plataforma que conecta terapia e educação de forma integrada.';

  const benefits = isStudent
    ? [
        { icon: '🎮', text: 'Atividades gamificadas' },
        { icon: '📊', text: 'Progresso em tempo real' },
        { icon: '🤝', text: 'Apoio da equipe' },
        { icon: '🔒', text: 'Ambiente seguro' }
      ]
    : [
        { icon: '👥', text: 'Colaboração multidisciplinar' },
        { icon: '📈', text: 'Analytics detalhados' },
        { icon: '⚕️', text: 'Ferramentas especializadas' },
        { icon: '🔐', text: 'Conformidade LGPD' }
      ];

  return (
    <section className="relative h-full flex flex-col">
      {/* Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-10"
      >
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          {isStudent ? (
            <FaUserGraduate className="w-6 h-6 text-white" />
          ) : (
            <FaUserMd className="w-6 h-6 text-white" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Nexus<span className="text-indigo-200">Platform</span>
          </h1>
          <p className="text-white/70 text-sm">
            Terapia + Educação + Gamificação
          </p>
        </div>
      </motion.div>

      {/* Title & Subtitle */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-10 flex-1"
      >
        <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
          {title || defaultTitle}
        </h2>
        <p className="text-white/90 text-lg leading-relaxed">
          {subtitle || defaultSubtitle}
        </p>
      </motion.div>

      {/* Benefits Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-4 mb-10"
      >
        {benefits.map((benefit, index) => (
          <div 
            key={index}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center text-center"
          >
            <span className="text-2xl mb-2">{benefit.icon}</span>
            <span className="text-white text-sm font-medium">
              {benefit.text}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Trust & Security */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-auto"
      >
        <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl mb-4">
          <div className="flex items-center gap-3">
            <FaShieldAlt className="w-5 h-5 text-emerald-300" />
            <span className="text-white font-medium">
              100% Seguro
            </span>
          </div>
          <div className="flex items-center gap-3">
            <FaHeartbeat className="w-5 h-5 text-pink-300" />
            <span className="text-white font-medium">
              Ambiente Terapêutico
            </span>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-white/60 text-sm">
            Plataforma certificada para saúde mental e educação
          </p>
        </div>
      </motion.div>
    </section>
  );
}