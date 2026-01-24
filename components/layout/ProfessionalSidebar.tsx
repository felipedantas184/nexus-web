// components\sidebar\ProfessionalSidebar.tsx
'use client';

import {
  FaHome,
  FaUsers,
  FaBook,
  FaChartLine,
  FaStickyNote,
  FaCog,
  FaUserPlus,
  FaCalendarAlt,
  FaSignOutAlt,
  FaBell,
  FaFileAlt,
  FaComments
} from 'react-icons/fa';
import { FaUserDoctor, FaChartColumn, FaGear } from 'react-icons/fa6';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Professional } from '@/types/auth';
import { useAuth } from '@/context/AuthContext';

interface ProfessionalSidebarProps {
  open: boolean;
  onNavigate?: () => void;
  className?: string;
}

export default function ProfessionalSidebar({
  open,
  onNavigate,
  className = ''
}: ProfessionalSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user || user.role === 'student') return null;

  const professional = user as Professional;

  const menuItems = [
    {
      icon: FaHome,
      label: 'Dashboard',
      href: '/professional/dashboard',
      badge: null
    },
    {
      icon: FaUsers,
      label: 'Alunos',
      href: '/professional/students',
      badge: professional.profile?.assignedStudents?.length || 0,
    },
    {
      icon: FaCalendarAlt,
      label: 'Cronogramas',
      href: '/professional/schedules',
      badge: null
    },
    {
      icon: FaChartColumn,
      label: 'Analytics',
      href: '/professional/analytics',
      badge: null
    },
  ];

  const quickActions = [
    {
      icon: FaBook,
      label: 'Novo Cronograma',
      href: '/professional/programs/create',
      color: 'bg-emerald-500/20',
      iconColor: 'text-emerald-300'
    },
    {
      icon: FaCalendarAlt,
      label: 'Novo Cronograma',
      href: '/professional/schedules/create',
      color: 'bg-amber-500/20',
      iconColor: 'text-amber-300'
    }
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const getRoleLabel = () => {
    switch (professional.role) {
      case 'psychologist': return 'Psicólogo';
      case 'psychiatrist': return 'Psiquiatra';
      case 'monitor': return 'Monitor';
      case 'coordinator': return 'Coordenador';
      default: return 'Profissional';
    }
  };

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await logout();
    }
  };

  return (
    <nav
      className={`
        bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900
        w-72 h-screen p-6 flex flex-col
        transition-all duration-300 ease-in-out
        shadow-2xl border-r border-white/10
        fixed top-0 left-0 z-50
        overflow-hidden
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="flex-1 flex flex-col overflow-y-auto pr-2 scrollbar-none">
        {/* User Header */}
        <div className="flex items-center gap-4 p-5 bg-white/10 rounded-2xl mb-6 border border-white/20 backdrop-blur-sm">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl tracking-wider">
                {professional.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-3 border-blue-900 shadow-md" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-base mb-1 truncate">
              {professional.name}
            </div>
            <div className="flex items-center gap-2 text-sm text-white/90 font-medium">
              <FaUserDoctor className="w-3 h-3 text-indigo-300" />
              <span>{getRoleLabel()}</span>
            </div>
          </div>
        </div>

        {/* Main Menu */}
        <ul className="space-y-1 mb-8">
          {menuItems.map((item, index) => {
            const active = isActive(item.href);

            return (
              <li key={index} className="group">
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl transition-all duration-300 relative
                    ${active
                      ? 'bg-indigo-600/30 text-white border-l-4 border-indigo-400 shadow-lg'
                      : 'text-white/85 hover:bg-white/10 hover:text-white'
                    }
                    group-hover:translate-x-1
                  `}
                >
                  <div
                    className={`
                      w-6 h-6 flex items-center justify-center
                      ${active ? 'text-indigo-300' : 'text-white/70'}
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                  </div>

                  <span className="font-medium text-sm flex-1">
                    {item.label}
                  </span>

                  {item.badge !== null && item.badge > 0 && (
                    <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-6 text-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider flex-1">
              Ações Rápidas
            </h4>
            <div className="flex-1 h-px bg-white/10 ml-3" />
          </div>

          <div className="space-y-2">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                onClick={onNavigate}
                className="flex items-center gap-3 p-3 bg-white/10 rounded-xl border border-white/20 
                         text-white/90 hover:bg-white/20 hover:text-white hover:border-white/30 
                         transition-all duration-300 hover:translate-x-1 group"
              >
                <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                  <action.icon className={`w-4 h-4 ${action.iconColor}`} />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Settings & Logout */}
        <div className="mt-auto pt-6 border-t border-white/10 space-y-2">
          <Link
            href="/professional/settings"
            onClick={onNavigate}
            className={`
              flex items-center gap-3 p-3 rounded-xl transition-all duration-300
              ${isActive('/professional/settings')
                ? 'bg-white/20 text-white'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
              }
              hover:translate-x-1
            `}
          >
            <FaGear className="w-4 h-4" />
            <span className="text-sm font-medium">Configurações</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 rounded-xl text-white/80 hover:bg-red-500/20 
                     hover:text-red-300 transition-all duration-300 w-full hover:translate-x-1"
          >
            <FaSignOutAlt className="w-4 h-4" />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </div>
    </nav>
  );
}