// components/auth/AuthLayout/BrandSection.tsx
import React from 'react';
import { 
  FaUserMd, 
  FaUserGraduate, 
  FaCheckCircle,
  FaShieldAlt 
} from 'react-icons/fa';

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
    : `Junte-se à nossa ${isStudent ? 'comunidade de alunos' : 'rede de profissionais'}`;
  
  const defaultSubtitle = isLogin
    ? isStudent
      ? 'Continue sua jornada de aprendizado e crescimento personalizado.'
      : 'Acesse ferramentas especializadas para acompanhamento terapêutico-educacional.'
    : isStudent
      ? 'Cadastre-se para uma experiência gamificada de aprendizado e desenvolvimento.'
      : 'Faça parte da plataforma que conecta terapia e educação de forma integrada.';

  const benefits = isStudent
    ? [
        'Atividades gamificadas e envolventes',
        'Acompanhamento personalizado',
        'Progresso visual em tempo real',
        'Comunicação com sua equipe de apoio'
      ]
    : [
        'Ferramentas especializadas multidisciplinares',
        'Colaboração em tempo real com a equipe',
        'Relatórios e analytics detalhados',
        'Conformidade com LGPD e normas éticas'
      ];

  return (
    <section className="flex-[0_0_40%] bg-white/10 backdrop-blur-lg p-8 lg:p-12 flex flex-col justify-center text-white lg:min-h-screen lg:max-h-screen overflow-hidden lg:overflow-auto">
      {/* Logo */}
      <div className="flex items-center gap-4 mb-8">
        {isStudent ? (
          <FaUserGraduate className="w-8 h-8 text-white" />
        ) : (
          <FaUserMd className="w-8 h-8 text-white" />
        )}
        <h1 className="text-2xl lg:text-2xl font-bold text-white">
          Nexus<span className="text-indigo-300 font-light">Platform</span>
        </h1>
      </div>

      {/* Title & Subtitle */}
      <div className="mb-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
          {title || defaultTitle}
        </h2>
        <p className="text-white/90 text-base lg:text-lg leading-relaxed">
          {subtitle || defaultSubtitle}
        </p>
      </div>

      {/* Benefits List */}
      <div className="flex flex-col gap-4 my-6 lg:my-8">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex items-start gap-3">
            <FaCheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="text-white/90 text-sm lg:text-base">
              {benefit}
            </span>
          </div>
        ))}
      </div>

      {/* Trust Badge */}
      <div className="flex items-center gap-3 mt-8 lg:mt-12 p-4 bg-white/10 rounded-lg">
        <FaShieldAlt className="w-5 h-5 text-indigo-300" />
        <span className="text-white/80 text-sm">
          Ambiente seguro e protegido conforme LGPD
        </span>
      </div>

      {/* Bottom spacing for mobile */}
      <div className="lg:hidden h-8" />
    </section>
  );
}