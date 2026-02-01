'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FaUserGraduate,
  FaRocket,
  FaChartLine,
  FaUsers,
  FaShieldAlt,
  FaBrain,
  FaGraduationCap,
  FaHeartbeat,
  FaMobileAlt,
  FaChevronDown,
  FaCheck,
  FaPlay,
  FaArrowRight
} from 'react-icons/fa';
import {
  FaLightbulb,
  FaHandshake,
  FaCalendarCheck,
  FaComments,
  FaBullseye,
  FaClipboardCheck,
  FaLock,
  FaChartBar
} from 'react-icons/fa6';
import { RxAvatar } from 'react-icons/rx';

// ========== COMPONENTE PRINCIPAL ==========
export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToNext = useCallback(() => {
    const nextSection = document.getElementById('problem');
    nextSection?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <div className="overflow-x-hidden scroll-smooth">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col pt-20 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-800 overflow-hidden">
        {/* Floating Icons */}
        <FloatingIcon delay="0s" position="top-1/5 left-5">
          <FaBrain className="w-6 h-6" />
        </FloatingIcon>
        <FloatingIcon delay="1s" position="top-1/4 right-8">
          <FaGraduationCap className="w-6 h-6" />
        </FloatingIcon>
        <FloatingIcon delay="2s" position="bottom-1/5 left-12">
          <FaHeartbeat className="w-6 h-6" />
        </FloatingIcon>
        <FloatingIcon delay="3s" position="bottom-15 right-10">
          <FaComments className="w-6 h-6" />
        </FloatingIcon>

        {/* Navbar */}
        <nav className={`fixed top-0 left-0 right-0 px-8 py-5 flex justify-between items-center z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-blue-950/98 backdrop-blur-md border-b border-white/10' 
            : 'bg-blue-950/95 backdrop-blur-sm'
        }`}>
          <div className="flex items-center gap-3">
            <FaRocket className="w-7 h-7 text-indigo-400" />
            <span className="text-2xl font-bold text-white">Nexus</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-8">
            <NavLink href="#problem" onClick={closeMenu}>O Problema</NavLink>
            <NavLink href="#solution" onClick={closeMenu}>Solução</NavLink>
            <NavLink href="#features" onClick={closeMenu}>Recursos</NavLink>
            <NavLink href="#impact" onClick={closeMenu}>Impacto</NavLink>
            <NavLink href="#cta" onClick={closeMenu}>Começar</NavLink>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <Link 
              href="/login" 
              className="px-6 py-2.5 text-white/90 font-medium rounded-lg border border-white/20 hover:bg-white/10 hover:border-white/30 transition-colors"
            >
              Entrar
            </Link>
            <PrimaryButton href="/register">
              Teste Grátis <FaArrowRight className="w-3.5 h-3.5" />
            </PrimaryButton>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMenu}
            className="lg:hidden text-2xl text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </nav>

        {/* Mobile Menu */}
        <div className={`fixed top-0 right-0 w-3/4 h-screen bg-blue-950/98 backdrop-blur-xl p-8 flex flex-col gap-8 transition-all duration-350 z-40 lg:hidden ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <MobileNavLink href="#problem" onClick={closeMenu}>O Problema</MobileNavLink>
          <MobileNavLink href="#solution" onClick={closeMenu}>Solução</MobileNavLink>
          <MobileNavLink href="#features" onClick={closeMenu}>Recursos</MobileNavLink>
          <MobileNavLink href="#impact" onClick={closeMenu}>Impacto</MobileNavLink>
          <MobileNavLink href="#cta" onClick={closeMenu}>Começar</MobileNavLink>
          
          <Link 
            href="/login" 
            className="mt-4 px-6 py-3 text-white/90 font-medium rounded-lg border border-white/20 hover:bg-white/10 text-center transition-colors"
          >
            Entrar
          </Link>
          
          <PrimaryButton href="/register" className="justify-center">
            Teste Grátis <FaArrowRight className="w-3.5 h-3.5" />
          </PrimaryButton>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl w-full px-8 py-16 mx-auto text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-full text-sm font-medium text-white mb-8">
            <FaLightbulb className="w-4 h-4" />
            Transformando acompanhamento terapêutico-educacional
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Unifica a equipe
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
              Guia os alunos
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
            Conectamos profissionais, personalizamos programas e engajamos estudantes
            em uma jornada de desenvolvimento integral e mensurável.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <PrimaryButton 
              href="/login" 
              className="px-10 py-4 text-lg"
            >
              <FaRocket className="w-5 h-5" />
              Entrar
            </PrimaryButton>

            <SecondaryButton 
              href="/register" 
              className="px-10 py-4 text-lg"
            >
              <RxAvatar className="w-5 h-5" />
              Criar Conta
            </SecondaryButton>
          </div>

          <div className="flex flex-wrap justify-center gap-8 md:gap-12 max-w-2xl mx-auto mb-12">
            <StatItem value="+85%" label="Engajamento dos Alunos" />
            <StatItem value="40%" label="Mais Eficiência" />
            <StatItem value="100%" label="LGPD Compliant" />
          </div>

          <button 
            onClick={scrollToNext}
            className="w-14 h-20 mx-auto border-2 border-white/25 rounded-2xl flex items-center justify-center text-white/70 hover:text-white hover:border-white/55 transition-all animate-float cursor-pointer"
            aria-label="Role para a próxima seção"
          >
            <FaChevronDown className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-16 md:py-32 px-6 md:px-10 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <SectionSubtitle>O Desafio Atual</SectionSubtitle>
          <SectionTitle>
            A <span className="text-indigo-600 relative after:absolute after:bottom-1 after:left-0 after:w-full after:h-2 after:bg-indigo-200 after:-z-10">Fragmentação</span> que Prejudica o Progresso
          </SectionTitle>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto mt-4">
            Instituições enfrentam desafios complexos no acompanhamento integrado de estudantes
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          <ProblemCard 
            accent="border-l-red-500"
            icon={<FaUsers className="w-7 h-7 text-red-500" />}
            title="Sistemas Isolados"
            description="Educação e saúde mental funcionando separadamente, sem visão integrada do estudante."
          />

          <ProblemCard 
            accent="border-l-amber-500"
            icon={<FaChartLine className="w-7 h-7 text-amber-500" />}
            title="Dados Desconexos"
            description="Informações espalhadas em emails, WhatsApp e planilhas, dificultando a análise do progresso."
          />

          <ProblemCard 
            accent="border-l-purple-500"
            icon={<FaMobileAlt className="w-7 h-7 text-purple-500" />}
            title="Baixo Engajamento"
            description="Estudantes desmotivados com atividades tradicionais e falta de acompanhamento contínuo."
          />
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-16 md:py-32 px-6 md:px-10 bg-white">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <SectionSubtitle>Nossa Abordagem</SectionSubtitle>
          <SectionTitle>
            Conectando os <span className="text-indigo-600 relative after:absolute after:bottom-1 after:left-0 after:w-full after:h-2 after:bg-indigo-200 after:-z-10">3 Pilares</span> do Sucesso
          </SectionTitle>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
          <FeatureCard
            icon={<FaUsers className="w-6 h-6" />}
            iconColor="text-indigo-500"
            iconBg="bg-indigo-50"
            title="Ecossistema Colaborativo"
            description="Conecte psicólogos, psiquiatras, monitores e coordenadores em uma plataforma única com visão 360° do estudante."
            benefits={[
              "Observações compartilhadas em tempo real",
              "Comunicação segura e organizada",
              "Perfil unificado do estudante"
            ]}
          />

          <FeatureCard
            icon={<FaBullseye className="w-6 h-6" />}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-50"
            title="Programas Personalizados"
            description="Crie jornadas terapêutico-educacionais adaptadas para ansiedade, TDAH, depressão e outras necessidades específicas."
            benefits={[
              "6 tipos de atividades interativas",
              "Progressão baseada em resultados",
              "Adaptação automática por desempenho"
            ]}
          />

          <FeatureCard
            icon={<FaClipboardCheck className="w-6 h-6" />}
            iconColor="text-purple-500"
            iconBg="bg-purple-50"
            title="Engajamento Gamificado"
            description="Transforme o acompanhamento em uma experiência motivadora com mecânicas de jogos e recompensas significativas."
            benefits={[
              "Sistema de conquistas e badges",
              "Progresso visual e motivacional",
              "Leaderboards saudáveis por turma"
            ]}
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-32 px-6 md:px-10 bg-slate-100">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <SectionSubtitle>Recursos Avançados</SectionSubtitle>
          <SectionTitle>
            Tudo que sua equipe
            <br />
            <span className="text-indigo-600 relative after:absolute after:bottom-1 after:left-0 after:w-full after:h-2 after:bg-indigo-200 after:-z-10">precisa em um só lugar</span>
          </SectionTitle>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          <SimpleFeatureCard
            icon={<FaChartBar className="w-6 h-6" />}
            iconColor="text-indigo-500"
            iconBg="bg-indigo-50"
            title="Analytics em Tempo Real"
            description="Dashboards com métricas de engajamento, progresso e resultados mensuráveis para tomada de decisão."
          />

          <SimpleFeatureCard
            icon={<FaCalendarCheck className="w-6 h-6" />}
            iconColor="text-amber-500"
            iconBg="bg-amber-50"
            title="Cronogramas Inteligentes"
            description="Crie e replique atividades automaticamente com ajustes em tempo real baseados no desempenho."
          />

          <SimpleFeatureCard
            icon={<FaShieldAlt className="w-6 h-6" />}
            iconColor="text-red-500"
            iconBg="bg-red-50"
            title="Segurança Máxima"
            description="Conformidade total com LGPD, criptografia de ponta a ponta e auditoria completa de acesso."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-16 md:py-32 px-6 md:px-10 bg-gradient-to-br from-slate-900 to-slate-800 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(99,102,241,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.1)_0%,transparent_50%)]" />
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <SectionSubtitle color="text-indigo-300">Comece Agora</SectionSubtitle>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Transforme o acompanhamento
            <br />
            <span className="text-indigo-300">na sua instituição</span>
          </h2>

          <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
            Junte-se a mais de 200 instituições que já usam a Nexus
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <PrimaryButton href="/register" className="px-8 py-4">
              <FaRocket className="w-4.5 h-4.5" />
              Começar como Profissional
            </PrimaryButton>

            <SecondaryButton href="/demo" className="px-8 py-4">
              <RxAvatar className="w-4.5 h-4.5" />
              Sou Aluno
            </SecondaryButton>
          </div>

          <div className="flex items-center justify-center gap-3 text-white/80 text-sm">
            <FaShieldAlt className="w-5 h-5 text-indigo-300" />
            <span>Garantia de satisfação ou seu dinheiro de volta em 30 dias</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <FaRocket className="w-7 h-7 text-indigo-400" />
                <span className="text-2xl font-bold">Nexus</span>
              </div>
              <p className="text-slate-300">
                Conectando terapia, educação e resultados em uma plataforma integrada.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold text-white mb-4">Produto</h4>
                <FooterLink href="#features">Recursos</FooterLink>
                <FooterLink href="#solution">Solução</FooterLink>
                <FooterLink href="#pricing">Planos</FooterLink>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-4">Empresa</h4>
                <FooterLink href="/about">Sobre</FooterLink>
                <FooterLink href="/blog">Blog</FooterLink>
                <FooterLink href="/contact">Contato</FooterLink>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-4">Legal</h4>
                <FooterLink href="/privacy">Privacidade</FooterLink>
                <FooterLink href="/terms">Termos</FooterLink>
                <FooterLink href="/lgpd">LGPD</FooterLink>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-slate-400 text-sm">
              © {new Date().getFullYear()} Nexus. Todos os direitos reservados.
            </div>
            <div className="flex gap-6">
              <Link href="#" className="text-slate-300 text-sm hover:text-white transition-colors">
                LinkedIn
              </Link>
              <Link href="#" className="text-slate-300 text-sm hover:text-white transition-colors">
                Instagram
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ========== COMPONENTES REUTILIZÁVEIS ==========

interface FloatingIconProps {
  delay: string;
  position: string;
  children: React.ReactNode;
}

function FloatingIcon({ delay, position, children }: FloatingIconProps) {
  return (
    <div 
      className={`absolute ${position} w-16 h-16 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white animate-float hidden md:flex pointer-events-none`}
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  );
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}

function NavLink({ href, children, onClick }: NavLinkProps) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className="text-white/90 font-medium text-sm hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-500 after:to-purple-300 hover:after:w-full after:transition-all after:duration-300"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children, onClick }: NavLinkProps) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className="text-white text-lg font-medium hover:text-indigo-300 transition-colors"
    >
      {children}
    </Link>
  );
}

interface PrimaryButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

function PrimaryButton({ href, children, className = '' }: PrimaryButtonProps) {
  return (
    <Link 
      href={href}
      className={`bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold px-7 py-3 rounded-xl inline-flex items-center gap-2 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-pulse-subtle ${className}`}
    >
      {children}
    </Link>
  );
}

interface SecondaryButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

function SecondaryButton({ href, children, className = '' }: SecondaryButtonProps) {
  return (
    <Link 
      href={href}
      className={`text-white font-semibold px-7 py-3 rounded-xl inline-flex items-center gap-2 border-2 border-white/30 hover:bg-white/10 hover:border-white/50 hover:-translate-y-1 transition-all ${className}`}
    >
      {children}
    </Link>
  );
}

interface StatItemProps {
  value: string;
  label: string;
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="text-center min-w-[120px]">
      <div className="text-3xl md:text-4xl font-bold text-indigo-300 mb-1">
        {value}
      </div>
      <div className="text-sm text-white/80 font-medium">
        {label}
      </div>
    </div>
  );
}

interface SectionSubtitleProps {
  children: React.ReactNode;
  color?: string;
}

function SectionSubtitle({ children, color = 'text-indigo-600' }: SectionSubtitleProps) {
  return (
    <div className={`text-xs font-semibold uppercase tracking-wider ${color} mb-4 inline-block px-4 py-2 rounded-full bg-indigo-50`}>
      {children}
    </div>
  );
}

interface SectionTitleProps {
  children: React.ReactNode;
}

function SectionTitle({ children }: SectionTitleProps) {
  return (
    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
      {children}
    </h2>
  );
}

interface ProblemCardProps {
  accent: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function ProblemCard({ accent, icon, title, description }: ProblemCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ${accent} border-l-4`}>
      <div className="flex justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3">
        {title}
      </h3>
      <p className="text-slate-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  benefits: string[];
}

function FeatureCard({ icon, iconColor, iconBg, title, description, benefits }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
      <div className={`w-16 h-16 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center mb-6`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3">
        {title}
      </h3>
      <p className="text-slate-600 mb-6 flex-grow">
        {description}
      </p>
      <ul className="space-y-3">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-start gap-3 text-slate-700">
            <FaCheck className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface SimpleFeatureCardProps {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
}

function SimpleFeatureCard({ icon, iconColor, iconBg, title, description }: SimpleFeatureCardProps) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <div className={`w-16 h-16 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center mb-6`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3">
        {title}
      </h3>
      <p className="text-slate-600">
        {description}
      </p>
    </div>
  );
}

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
}

function FooterLink({ href, children }: FooterLinkProps) {
  return (
    <Link 
      href={href}
      className="block text-slate-300 text-sm mb-2 hover:text-white transition-colors"
    >
      {children}
    </Link>
  );
}