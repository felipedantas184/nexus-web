// components/student/ProgressTracking.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  FaChartLine,
  FaTrophy,
  FaFire,
  FaStar,
  FaMedal,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaRegChartBar,
  FaArrowUp,
  FaArrowDown,
  FaSpinner,
  FaChartPie,
  FaMinus,
  FaBullseye,
  FaLightbulb,
  FaAward,
  FaCrown,
  FaGem,
  FaRocket,
  FaSeedling,
  FaMountain,
  FaChevronRight,
  FaHistory,
  FaCheck
} from 'react-icons/fa';
import { FiTarget, FiBarChart2, FiActivity, FiZap } from 'react-icons/fi';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { PerformanceSnapshot } from '@/types/schedule';
import { FaArrowTrendDown, FaArrowTrendUp } from 'react-icons/fa6';

interface WeeklyProgress {
  weekNumber: number;
  completionRate: number;
  points: number;
  trend: 'up' | 'down' | 'stable';
}

export default function ProgressTracking() {
  const { data, loading, error, refresh } = useStudentProgress();
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'stats'>('overview');

  const getTrend = (improvement?: number): 'up' | 'down' | 'stable' => {
    if (improvement === undefined) return 'stable';
    if (improvement > 0.5) return 'up';
    if (improvement < -0.5) return 'down';
    return 'stable';
  };

  // Converter snapshots para formato do weeklyProgress
  const getWeeklyProgress = (): WeeklyProgress[] => {
    if (!data?.weeklySnapshots.length) return [];

    // Tipamos o retorno do map como WeeklyProgress para evitar ambiguidade
    return data.weeklySnapshots.map((snapshot): WeeklyProgress => {
      return {
        weekNumber: snapshot.weekNumber,
        completionRate: snapshot.engagement.completionRate,
        points: snapshot.performance.totalPointsEarned,
        trend: getTrend(snapshot.performance.improvementFromPreviousWeek)
      };
    }).reverse();
  };

  const getLevelProgress = (level: number) => {
    if (!data?.currentMetrics.totalPoints) return 0;

    const baseXP = 100;
    const xpForLevel = baseXP * Math.pow(1.5, level - 1);
    const previousLevelXP = level > 1 ? baseXP * Math.pow(1.5, level - 2) : 0;
    const xpForThisLevel = xpForLevel - previousLevelXP;
    const xpInThisLevel = data.currentMetrics.totalPoints - previousLevelXP;

    return Math.min(100, Math.max(0, (xpInThisLevel / xpForThisLevel) * 100));
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <FaArrowTrendUp className="w-4 h-4 text-emerald-500" />;
      case 'down': return <FaArrowTrendDown className="w-4 h-4 text-red-500" />;
      default: return <FaMinus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'declining': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const getAchievementIcon = (achievementType: string) => {
    switch (achievementType.toLowerCase()) {
      case 'streak': return <FaFire className="w-5 h-5" />;
      case 'level': return <FaCrown className="w-5 h-5" />;
      case 'completion': return <FaCheckCircle className="w-5 h-5" />;
      case 'points': return <FaGem className="w-5 h-5" />;
      case 'speed': return <FaRocket className="w-5 h-5" />;
      case 'consistency': return <FaHistory className="w-5 h-5" />;
      default: return <FaAward className="w-5 h-5" />;
    }
  };

  const getWeeklyAverage = (): number => {
    if (!data?.weeklySnapshots.length) return 0;

    const sum = data.weeklySnapshots.reduce((total, snapshot) =>
      total + snapshot.engagement.completionRate, 0);
    return Math.round(sum / data.weeklySnapshots.length);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 border-3 border-purple-200 rounded-full"></div>
            <div className="w-16 h-16 border-3 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Analisando seu progresso...</p>
          <p className="text-sm text-gray-500 mt-1">Isso pode levar alguns segundos</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl mb-6">
            <FaChartLine className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Erro ao carregar progresso
          </h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Não foi possível carregar seus dados de progresso. Isso pode ser temporário.
          </p>
          <button
            onClick={refresh}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const { currentMetrics, achievements, insights } = data;
  const weeklyProgress = getWeeklyProgress();
  const bestDay = data?.weeklySnapshots[0]?.performance.bestPerformingDay !== undefined
    ? ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][
    data.weeklySnapshots[0].performance.bestPerformingDay
    ] || 'N/A'
    : 'N/A';
  const weeklyAverage = getWeeklyAverage();
  const levelProgress = getLevelProgress(currentMetrics.level);

  return (
    <div className="space-y-6">
      {/* Header Moderno */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
              <FaChartLine className="w-7 h-7 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">Meu Progresso</h2>
              <p className="text-gray-600">Análise detalhada do seu desenvolvimento</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <div className="text-sm text-gray-500 mb-1">Última atualização</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-sm font-medium text-gray-900">
                {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Modernas */}
        <div className="flex flex-col sm:flex-row gap-2 bg-gray-100 p-2 rounded-xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-3 ${
              activeTab === 'overview' 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm' 
                : 'text-gray-600 hover:bg-white'
            }`}
          >
            <FiActivity className="w-4 h-4" />
            <span>Visão Geral</span>
          </button>
          
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-3 ${
              activeTab === 'achievements' 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm' 
                : 'text-gray-600 hover:bg-white'
            }`}
          >
            <FaTrophy className="w-4 h-4" />
            <span>Conquistas</span>
          </button>
          
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-3 ${
              activeTab === 'stats' 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm' 
                : 'text-gray-600 hover:bg-white'
            }`}
          >
            <FiBarChart2 className="w-4 h-4" />
            <span>Estatísticas</span>
          </button>
        </div>
      </div>

      {/* Conteúdo baseado na tab ativa */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Cards de Métricas Principais - Design Moderno */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Streak Card */}
            <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl border border-amber-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                  <FaFire className="w-6 h-6 text-amber-600" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-amber-600 uppercase tracking-wider">Sequência</div>
                  <div className="text-2xl font-bold text-gray-900">{currentMetrics.streak}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-1">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-2 rounded-full ${
                        i < Math.min(currentMetrics.streak, 7)
                          ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                          : 'bg-amber-100'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs text-amber-600">
                  {currentMetrics.streak >= 7 
                    ? '🔥 Semana perfeita!' 
                    : `${7 - currentMetrics.streak} dias para a semana completa`}
                </div>
              </div>
            </div>

            {/* Points Card */}
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <FaStar className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-blue-600 uppercase tracking-wider">Pontos</div>
                  <div className="text-2xl font-bold text-gray-900">{currentMetrics.totalPoints}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-sm text-blue-700">Próximo nível: {currentMetrics.level + 1}</div>
                <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
                <div className="text-xs text-blue-600">
                  {levelProgress.toFixed(1)}% completo
                </div>
              </div>
            </div>

            {/* Level Card */}
            <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl border border-purple-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                  <FaCrown className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-purple-600 uppercase tracking-wider">Nível</div>
                  <div className="text-2xl font-bold text-gray-900">{currentMetrics.level}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-sm text-purple-700">Continue evoluindo!</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-600">Experiência</span>
                  <span className="font-medium text-purple-900">{levelProgress.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Completion Card */}
            <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl border border-emerald-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                  <FaCheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Conclusão</div>
                  <div className="text-2xl font-bold text-gray-900">{currentMetrics.completionRate.toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-sm text-emerald-700">
                  {currentMetrics.completedActivities}/{currentMetrics.totalActivities} atividades
                </div>
                <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
                    style={{ width: `${currentMetrics.completionRate}%` }}
                  />
                </div>
                <div className="text-xs text-emerald-600">
                  Média semanal: {weeklyAverage}%
                </div>
              </div>
            </div>
          </div>

          {/* Progresso Semanal - Design Moderno */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                  <FaCalendarAlt className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Progresso Semanal</h3>
                  <p className="text-sm text-gray-600">{weeklyProgress.length} semanas analisadas</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">Tendência:</div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getTrendColor(data.performanceTrend)}`}>
                  {data.performanceTrend === 'improving' ? 'Melhorando' :
                    data.performanceTrend === 'declining' ? 'Decaindo' : 'Estável'}
                </div>
              </div>
            </div>

            {weeklyProgress.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {weeklyProgress.map((week, index) => (
                  <div key={index} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="font-bold text-gray-700">S{week.weekNumber}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Semana {week.weekNumber}</div>
                          <div className="text-xs text-gray-500">{week.points} pontos</div>
                        </div>
                      </div>
                      {getTrendIcon(week.trend)}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Taxa de conclusão</span>
                        <span className="font-bold text-gray-900">{week.completionRate.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"
                          style={{ width: `${week.completionRate}%` }}
                        />
                      </div>
                      
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium`}>
                        {getTrendIcon(week.trend)}
                        <span>
                          {week.trend === 'up' ? 'Melhorando' :
                           week.trend === 'down' ? 'Decaindo' : 'Estável'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4">
                  <FaChartPie className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2">Complete mais atividades para ver seu progresso semanal</p>
                <p className="text-sm text-gray-500">Os dados aparecerão automaticamente</p>
              </div>
            )}
          </div>

          {/* Insights Personalizados - Design Moderno */}
          {insights && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pontos Fortes */}
              {insights.strengths.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                      <FiZap className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-900 mb-1">Seus Pontos Fortes</h4>
                      <p className="text-sm text-emerald-700">Áreas onde você se destaca</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-3">
                    {insights.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        <span className="text-emerald-800">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recomendações */}
              {insights.recommendations.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <FaLightbulb className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900 mb-1">Recomendações</h4>
                      <p className="text-sm text-blue-700">Oportunidades de melhoria</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-3">
                    {insights.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                          <FaArrowUp className="w-3 h-3 text-blue-500" />
                        </div>
                        <span className="text-blue-800">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Próximos Passos */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                    <FiTarget className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-900 mb-1">Próximos Passos</h4>
                    <p className="text-sm text-purple-700">Seus objetivos atuais</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-xl border border-purple-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">Alcançar nível {currentMetrics.level + 1}</div>
                      <div className="text-sm font-bold text-purple-600">{levelProgress.toFixed(1)}%</div>
                    </div>
                    <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700"
                        style={{ width: `${levelProgress}%` }}
                      />
                    </div>
                  </div>

                  {currentMetrics.streak < 7 && (
                    <div className="p-4 bg-white rounded-xl border border-purple-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">Completar semana de streak</div>
                        <div className="text-sm font-bold text-purple-600">{currentMetrics.streak}/7</div>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: 7 }).map((_, i) => (
                          <div
                            key={i}
                            className={`flex-1 h-2 rounded-full ${
                              i < currentMetrics.streak
                                ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                                : 'bg-amber-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <button className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2">
                    Definir novas metas
                    <FaChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <FaTrophy className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Minhas Conquistas</h3>
              <p className="text-gray-600">Reconhecimento pelo seu progresso e dedicação</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => {
              const isUnlocked = achievement.unlocked;
              
              return (
                <div
                  key={achievement.id}
                  className={`rounded-2xl border p-5 transition-all duration-300 hover:shadow-md ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-white to-amber-50 border-amber-200'
                      : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Ícone da conquista */}
                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center ${
                      isUnlocked
                        ? 'bg-gradient-to-br from-amber-100 to-orange-100'
                        : 'bg-gradient-to-br from-gray-100 to-gray-200'
                    }`}>
                      <div className={isUnlocked ? 'text-amber-600' : 'text-gray-400'}>
                        {getAchievementIcon(achievement.type || 'default')}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-bold text-lg ${isUnlocked ? 'text-gray-900' : 'text-gray-600'}`}>
                          {achievement.title}
                        </h4>
                        {isUnlocked && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
                            <FaCheck className="w-3 h-3" />
                            Desbloqueada
                          </span>
                        )}
                      </div>

                      <p className={`text-sm mb-4 ${isUnlocked ? 'text-gray-600' : 'text-gray-500'}`}>
                        {achievement.description}
                      </p>

                      {/* Progress Bar para conquistas não desbloqueadas */}
                      {!isUnlocked && achievement.progress !== undefined && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Progresso</span>
                            <span className="font-medium text-gray-700">{achievement.progress}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-700"
                              style={{ width: `${achievement.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumo de Conquistas */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Resumo de conquistas</div>
                <div className="text-lg font-bold text-gray-900">
                  {achievements.filter(a => a.unlocked).length} de {achievements.length} desbloqueadas
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Próxima conquista</div>
                  <div className="font-medium text-gray-900">
                    {achievements.find(a => !a.unlocked)?.title || 'Todas desbloqueadas!'}
                  </div>
                </div>
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
                  Ver todas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
              <FiBarChart2 className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Estatísticas Detalhadas</h3>
              <p className="text-gray-600">Análise completa do seu desempenho e evolução</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Estatísticas de Tempo */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <FaClock className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Estatísticas de Tempo</h4>
                  <p className="text-sm text-gray-600">Seu investimento em aprendizado</p>
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm text-gray-500 mb-1">Tempo total investido</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.floor(currentMetrics.timeSpent / 60)}h {currentMetrics.timeSpent % 60}min
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm text-gray-500 mb-1">Tempo médio por atividade</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {currentMetrics.completedActivities > 0
                      ? Math.round(currentMetrics.timeSpent / currentMetrics.completedActivities)
                      : 0} min
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
                  <div className="text-sm text-indigo-600 mb-1">Dia mais produtivo</div>
                  <div className="font-bold text-indigo-900 text-lg">{bestDay}</div>
                  <div className="text-xs text-indigo-500 mt-1">Maior taxa de conclusão</div>
                </div>
              </div>
            </div>

            {/* Estatísticas de Atividades */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                  <FaCheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Estatísticas de Atividades</h4>
                  <p className="text-sm text-gray-600">Seu desempenho e consistência</p>
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-sm text-emerald-600 mb-1">Taxa de sucesso</div>
                  <div className="text-2xl font-bold text-emerald-900">{currentMetrics.completionRate.toFixed(1)}%</div>
                  <div className="text-xs text-emerald-500 mt-1">Alta performance!</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">Atividades totais</div>
                    <div className="text-xl font-bold text-gray-900">{currentMetrics.totalActivities}</div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">Concluídas</div>
                    <div className="text-xl font-bold text-gray-900">{currentMetrics.completedActivities}</div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-amber-600 mb-1">Atividade favorita</div>
                      <div className="font-bold text-amber-900">Questionários</div>
                    </div>
                    <div className="text-2xl">🎯</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Análise de Tendência */}
            <div className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <FaChartLine className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Análise de Tendência</h4>
                  <p className="text-sm text-gray-600">Sua evolução ao longo do tempo</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-white rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-500">Direção atual</div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      data.performanceTrend === 'improving' ? 'bg-emerald-100 text-emerald-600' :
                      data.performanceTrend === 'declining' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {data.performanceTrend === 'improving' ? <FaArrowTrendUp className="w-4 h-4" /> :
                       data.performanceTrend === 'declining' ? <FaArrowTrendDown className="w-4 h-4" /> :
                       <FaMinus className="w-4 h-4" />}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.performanceTrend === 'improving' ? 'Melhorando' :
                     data.performanceTrend === 'declining' ? 'Decaindo' : 'Estável'}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {data.performanceTrend === 'improving' ? 'Continue assim!' :
                     data.performanceTrend === 'declining' ? 'Revisar estratégia' : 'Bom trabalho'}
                  </div>
                </div>
                
                <div className="p-5 bg-white rounded-xl border border-gray-200">
                  <div className="text-sm text-gray-500 mb-3">Semanas analisadas</div>
                  <div className="text-2xl font-bold text-gray-900">{data.weeklySnapshots.length}</div>
                  <div className="text-sm text-gray-500 mt-1">Histórico completo</div>
                </div>
              </div>
            </div>

            {/* Insights Personalizados */}
            <div className="md:col-span-2 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                  <FaLightbulb className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Insights Personalizados</h4>
                  <p className="text-sm text-gray-600">Recomendações baseadas em dados</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h5 className="font-semibold text-emerald-800 mb-3">✨ Seus Pontos Fortes</h5>
                  <div className="space-y-3">
                    {insights.strengths.slice(0, 3).map((strength, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        <span className="text-emerald-800">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h5 className="font-semibold text-blue-800 mb-3">💡 Recomendações</h5>
                  <div className="space-y-3">
                    {insights.recommendations.slice(0, 3).map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                          <FaArrowUp className="w-3 h-3 text-blue-500" />
                        </div>
                        <span className="text-blue-800">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}