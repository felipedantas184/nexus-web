// components/sidebar/StudentSidebar.tsx
'use client';

import {
  FaHome,
  FaChartLine,
  FaCalendarAlt,
  FaTrophy,
  FaFire,
  FaCheckCircle,
  FaSignOutAlt
} from 'react-icons/fa';
import { FaGear } from 'react-icons/fa6';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Student } from '@/types/auth';
import { useAuth } from '@/context/AuthContext';
import { useStudentSchedule } from '@/hooks/useStudentSchedule';

interface StudentSidebarProps {
  open: boolean;
  onNavigate?: () => void;
  className?: string;
}

export default function StudentSidebar({
  open,
  onNavigate,
  className = ''
}: StudentSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user || user.role !== 'student') return null;

  const student = user as Student;

  const menuItems = [
    { icon: FaHome, label: 'Dashboard', href: '/student/dashboard' },
    { icon: FaCalendarAlt, label: 'Cronogramas', href: '/student/schedules' },
    { icon: FaChartLine, label: 'Meu Progresso', href: '/student/progress' },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await logout();
    }
  };

  const {
    todayActivities,
    totalTodayActivities
  } = useStudentSchedule();

  const completedToday = todayActivities.filter(a => a.status === 'completed').length;
  const completionRate = totalTodayActivities > 0 ? Math.round((completedToday / totalTodayActivities) * 100) : 0;

  return (
    <>
      {/* Overlay para mobile quando sidebar está aberta */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity"
          onClick={onNavigate}
        />
      )}

      <nav
        className={`
          bg-gradient-to-b from-purple-800 via-purple-700 to-purple-900
          
          {/* ✅ DIMENSÕES CORRETAS */}
          w-72
          fixed lg:static
          left-0 top-0
          z-40
          
          {/* ✅ ALTURA INTELIGENTE - usa 100% e 100dvh para mobile */}
          h-[100dvh] lg:h-screen
          
          {/* ✅ SEM SCROLL NA SIDEBAR */}
          overflow-hidden
          
          {/* ✅ SOMBRAS E BORDAS */}
          shadow-2xl lg:shadow-2xl
          border-r border-white/10
          
          {/* ✅ TRANSIÇÕES */}
          transition-all duration-300 ease-in-out
          
          {/* ✅ MOBILE: controlado pelo estado open */}
          ${open ? 'translate-x-0' : '-translate-x-full'}
          
          ${className}
        `}
      >
        {/* ✅ CONTAINER PRINCIPAL - Altura total com flex column */}
        <div className="h-full flex flex-col">
          
          {/* ✅ HEADER FIXO - Sempre visível no topo */}
          <div className="flex-none p-6 pb-0">
            {/* User Header */}
            <div className="flex items-center gap-4 p-2 bg-white/12 rounded-2xl border border-white/20 backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl tracking-wider">
                  {student.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-base mb-1 truncate">
                  {student.name}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-white/90">
                  <FaTrophy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-medium">{student.profile?.totalPoints || 0} pontos</span>
                </div>
              </div>
            </div>

            {/* Streak Card - Header 
            <div className="mt-6">
              <div className="flex items-center gap-4 p-2 bg-white/12 rounded-2xl border border-white/20 backdrop-blur-md">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <FaFire className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-white">
                    {student.profile?.streak || 0}
                  </div>
                  <div className="text-xs text-white/75 uppercase tracking-wider">
                    Dias seguidos
                  </div>
                </div>
              </div>
            </div>*/}
          </div>

          {/* ✅ CONTEÚDO SCROLLÁVEL - Apenas essa área tem scroll */}
          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-6
                        scrollbar-thin scrollbar-track-purple-900/50 
                        scrollbar-thumb-white/20 hover:scrollbar-thumb-white/40">
            
            {/* Main Menu */}
            <ul className="space-y-1">
              {menuItems.map((item, index) => (
                <li key={index} className="group">
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl transition-all duration-300 relative
                      ${isActive(item.href)
                        ? 'bg-white/20 text-white border-l-4 border-purple-300 shadow-lg'
                        : 'text-white/85 hover:bg-white/10 hover:text-white'
                      }
                      group-hover:translate-x-1
                    `}
                  >
                    <div
                      className={`
                        w-6 h-6 flex items-center justify-center
                        ${isActive(item.href) ? 'text-purple-300' : 'text-white/70'}
                      `}
                    >
                      <item.icon className="w-5 h-5" />
                    </div>

                    <span className="font-medium text-sm">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Today's Progress */}
            <div className="bg-white/12 rounded-2xl p-5 border border-white/20 backdrop-blur-md mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white">
                  Progresso Hoje
                </h4>
                <span className="text-xs font-medium text-white">
                  {completedToday}/{totalTodayActivities}
                </span>
              </div>

              <div className="w-full h-2 bg-white/25 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${totalTodayActivities === 0 ? '100' : completionRate}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-white/75">
                  {completedToday} de {totalTodayActivities} atividades
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-300">
                  <FaCheckCircle className="w-3 h-3" />
                  <span>{completionRate === 0 ? '100' : completionRate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ FOOTER FIXO - Sempre visível no rodapé */}
          <div className="flex-none p-6 pt-0">
            <div className="pt-6 border-t border-white/10 space-y-2">
              <Link
                href="/student/settings"
                onClick={onNavigate}
                className={`
                  flex items-center gap-3 p-3 rounded-xl transition-all duration-300
                  ${isActive('/student/settings')
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
        </div>
      </nav>
    </>
  );
}