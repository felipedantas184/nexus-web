// components/layout/ProfessionalNavbar.tsx
'use client';

import { useState } from 'react';
import { 
  FaBars, 
  FaSignOutAlt, 
  FaChevronDown,
  FaBrain,
  FaBell,
  FaSearch,
  FaQuestionCircle
} from 'react-icons/fa';
import { 
  FaUserGear,
  FaHeadset,
  FaUserDoctor,
  FaStethoscope,
  FaGear
} from 'react-icons/fa6';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Professional } from '@/types/auth';

interface ProfessionalNavbarProps {
  toggleSidebar: () => void;
  sidebarCollapsed?: boolean;
}

export default function ProfessionalNavbar({ 
  toggleSidebar, 
  sidebarCollapsed = false 
}: ProfessionalNavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  if (!user || user.role === 'student') return null;
  
  const professional = user as Professional;

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      try {
        await logout();
        router.push('/login');
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      }
    }
  };

  const getRoleLabel = () => {
    switch (professional.role) {
      case 'psychologist': return 'Psicólogo(a)';
      case 'psychiatrist': return 'Psiquiatra';
      case 'monitor': return 'Monitor(a)';
      case 'coordinator': return 'Coordenador(a)';
      default: return 'Profissional';
    }
  };

  const getRoleIcon = () => {
    switch (professional.role) {
      case 'psychologist': return <FaUserDoctor className="w-3.5 h-3.5" />;
      case 'psychiatrist': return <FaStethoscope className="w-3.5 h-3.5" />;
      case 'monitor': return <FaHeadset className="w-3.5 h-3.5" />;
      case 'coordinator': return <FaUserGear className="w-3.5 h-3.5" />;
      default: return <FaUserDoctor className="w-3.5 h-3.5" />;
    }
  };

  const getRoleColor = () => {
    switch (professional.role) {
      case 'psychologist': return 'purple';
      case 'psychiatrist': return 'emerald';
      case 'monitor': return 'amber';
      case 'coordinator': return 'indigo';
      default: return 'blue';
    }
  };

  const getUserInitials = () => {
    return professional.name
      .split(' ')
      .map(n => n[0] || '')
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Dados mock para demonstração
  const notifications = [
    { id: 1, title: 'Novo aluno atribuído', read: false },
    { id: 2, title: 'Relatório semanal pronto', read: true },
    { id: 3, title: 'Observação pendente de revisão', read: false },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;
  const roleColor = getRoleColor();
  const roleIcon = getRoleIcon();

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-800 h-16 shadow-lg shadow-blue-900/20 border-b border-white/10">
      <div className="w-full h-full px-4 md:px-6 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Sidebar Toggle */}
          <button
            onClick={toggleSidebar}
            title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            className="p-2 rounded-xl bg-white/15 text-white hover:bg-white/25 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <FaBars className="w-5 h-5" />
          </button>
          
          {/* Logo/Brand */}
          <Link 
            href="/professional/dashboard" 
            className="flex items-center gap-3 transition-opacity hover:opacity-90 active:opacity-80"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <FaBrain className="w-5 h-5 text-white" />
            </div>
            <div className="hidden md:block">
              <div className="text-lg font-bold text-white leading-tight">Nexus</div>
              <div className="text-xs text-indigo-200 font-semibold">Professional</div>
            </div>
          </Link>
          
          {/* Role Badge */}
          <div 
            className={`
              hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full border
              text-xs font-semibold text-white
              ${roleColor === 'purple' ? 'bg-purple-500/15 border-purple-500/30 hover:bg-purple-500/25' : ''}
              ${roleColor === 'emerald' ? 'bg-emerald-500/15 border-emerald-500/30 hover:bg-emerald-500/25' : ''}
              ${roleColor === 'amber' ? 'bg-amber-500/15 border-amber-500/30 hover:bg-amber-500/25' : ''}
              ${roleColor === 'indigo' ? 'bg-indigo-500/15 border-indigo-500/30 hover:bg-indigo-500/25' : ''}
              transition-all duration-200 hover:-translate-y-0.5 cursor-default
            `}
          >
            {roleIcon}
            <span>{getRoleLabel()}</span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Notifications */}
          <div className="relative">
            <button 
              className="p-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white 
                       transition-all duration-200 hover:-translate-y-0.5 relative"
              onClick={() => {/* Abrir dropdown de notificações */}}
              title="Notificações"
            >
              <FaBell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/15 transition-colors"
            >
              <div 
                className={`
                  w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm
                  ${roleColor === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-900/30' : ''}
                  ${roleColor === 'emerald' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-900/30' : ''}
                  ${roleColor === 'amber' ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-900/30' : ''}
                  ${roleColor === 'indigo' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-900/30' : ''}
                  shadow-md
                `}
              >
                {getUserInitials()}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-semibold text-white truncate max-w-[120px]">
                  {professional.name.split(' ')[0]}
                </div>
                <div className="text-xs text-white/80 flex items-center gap-1">
                  {getRoleLabel()}
                  <FaChevronDown className={`w-2.5 h-2.5 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 overflow-hidden animate-fade-in">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div 
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm
                          ${roleColor === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : ''}
                          ${roleColor === 'emerald' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : ''}
                          ${roleColor === 'amber' ? 'bg-gradient-to-br from-amber-500 to-amber-600' : ''}
                          ${roleColor === 'indigo' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' : ''}
                        `}
                      >
                        {getUserInitials()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{professional.name}</div>
                        <div className="text-xs text-gray-500">{getRoleLabel()}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <Link
                      href="/professional/profile"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FaUserDoctor className="w-4 h-4 text-gray-500" />
                      <span>Meu Perfil</span>
                    </Link>
                    
                    <Link
                      href="/professional/settings"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FaGear className="w-4 h-4 text-gray-500" />
                      <span>Configurações</span>
                    </Link>
                    
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 w-full transition-colors"
                      >
                        <FaSignOutAlt className="w-4 h-4" />
                        <span>Sair da Plataforma</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}