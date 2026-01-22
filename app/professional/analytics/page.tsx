// app/professional/analytics/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import StudentReports from '@/components/analytics/StudentReports';
import { 
  FaChartLine, 
  FaUsers, 
  FaUserGraduate,
  FaFilter,
  FaCalendarAlt,
  FaSchool,
  FaArrowLeft
} from 'react-icons/fa';

export default function AnalyticsPage() {
  const [view, setView] = useState<'dashboard' | 'student'>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/professional/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <FaArrowLeft />
                Voltar
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Analítico</h1>
                <p className="text-gray-600">
                  Análise e monitoramento do desempenho dos alunos
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FaChartLine />
              <span>Análise de Desempenho</span>
            </div>
          </div>

          {/* Tabs de Navegação */}
          <div className="bg-white rounded-xl shadow p-2 mb-6">
            <div className="flex">
              <button
                onClick={() => {
                  setView('dashboard');
                  setSelectedStudent(null);
                }}
                className={`flex-1 py-3 px-4 font-medium rounded-lg text-center ${view === 'dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FaChartLine />
                  Dashboard Geral
                </div>
              </button>
              
              <button
                onClick={() => setView('student')}
                className={`flex-1 py-3 px-4 font-medium rounded-lg text-center ${view === 'student' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FaUserGraduate />
                  Relatórios Individuais
                </div>
              </button>
            </div>
          </div>

          {/* Filtros Rápidos */}
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaFilter className="inline mr-2" />
                  Período
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option>Último mês</option>
                  <option>Último trimestre</option>
                  <option>Último semestre</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaSchool className="inline mr-2" />
                  Escola
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option>Todas as escolas</option>
                  <option>Escola Municipal A</option>
                  <option>Colégio Estadual B</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaCalendarAlt className="inline mr-2" />
                  Série
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option>Todas as séries</option>
                  <option>4º Ano</option>
                  <option>5º Ano</option>
                  <option>6º Ano</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaUsers className="inline mr-2" />
                  Status
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option>Todos os alunos</option>
                  <option>Ativos</option>
                  <option>Inativos</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="mb-8">
          {view === 'dashboard' ? (
            <AnalyticsDashboard />
          ) : (
            <StudentReports 
              showHeader={false}
              onBack={() => setView('dashboard')}
            />
          )}
        </div>

        {/* Rodapé Informativo */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">📊 Como usar este dashboard</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="font-medium text-gray-700 mb-2">Monitoramento Contínuo</div>
              <p className="text-sm text-gray-600">
                Acompanhe o engajamento e desempenho dos alunos em tempo real
              </p>
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-2">Identificação de Padrões</div>
              <p className="text-sm text-gray-600">
                Detecte tendências e padrões de comportamento para intervenções proativas
              </p>
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-2">Tomada de Decisão</div>
              <p className="text-sm text-gray-600">
                Use dados concretos para ajustar estratégias e personalizar abordagens
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}