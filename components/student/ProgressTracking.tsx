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
  FaSpinner
} from 'react-icons/fa';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { PerformanceSnapshot } from '@/types/schedule';

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

  const getStreakColor = (streak: number) => {
    if (streak >= 7) return 'from-red-500 to-orange-500';
    if (streak >= 3) return 'from-orange-500 to-yellow-500';
    return 'from-yellow-500 to-green-500';
  };

  const getWeeklyAverage = (): number => {
    if (!data?.weeklySnapshots.length) return 0;

    const sum = data.weeklySnapshots.reduce((total, snapshot) =>
      total + snapshot.engagement.completionRate, 0);
    return Math.round(sum / data.weeklySnapshots.length);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Analisando seu progresso...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <FaChartLine className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          {error || 'Erro ao carregar progresso'}
        </h3>
        <p className="text-gray-500 mb-4">
          Não foi possível carregar seus dados de progresso.
        </p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Tentar novamente
        </button>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FaChartLine className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Meu Progresso</h2>
              <p className="text-gray-500">Dados reais baseados no seu desempenho</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-500">Última atualização</div>
            <div className="text-sm font-medium text-gray-700">
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-4 py-2 font-medium ${activeTab === 'achievements' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
            >
              Conquistas
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 font-medium ${activeTab === 'stats' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
            >
              Estatísticas
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo baseado na tab ativa */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Cards de Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Streak */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FaFire className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-sm text-orange-600">Sequência</span>
              </div>
              <div className="text-3xl font-bold text-orange-800 mb-2">
                {currentMetrics.streak} dias
              </div>
              <div className="text-sm text-orange-700">
                Mantenha o ritmo!
              </div>
              {currentMetrics.streak > 0 && (
                <div className="mt-4">
                  <div className="flex gap-1">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-full ${i < Math.min(currentMetrics.streak, 7)
                          ? 'bg-orange-500'
                          : 'bg-orange-200'
                          }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    {currentMetrics.streak >= 7 ? '🔥 Semana completa!' : `${7 - currentMetrics.streak} dias para a semana completa`}
                  </div>
                </div>
              )}
            </div>

            {/* Pontos */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaStar className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-blue-600">Pontos</span>
              </div>
              <div className="text-3xl font-bold text-blue-800 mb-2">
                {currentMetrics.totalPoints}
              </div>
              <div className="text-sm text-blue-700">
                Total acumulado
              </div>
              <div className="mt-4">
                <div className="text-xs text-blue-600 mb-1">Progresso para nível {currentMetrics.level + 1}</div>
                <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${getLevelProgress(currentMetrics.level)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Nível */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FaMedal className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-purple-600">Nível</span>
              </div>
              <div className="text-3xl font-bold text-purple-800 mb-2">
                {currentMetrics.level}
              </div>
              <div className="text-sm text-purple-700">
                Continue evoluindo!
              </div>
              <div className="mt-2">
                <div className="text-xs text-purple-600">
                  Progresso: {getLevelProgress(currentMetrics.level).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Taxa de Conclusão */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FaCheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-green-600">Conclusão</span>
              </div>
              <div className="text-3xl font-bold text-green-800 mb-2">
                {currentMetrics.completionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-green-700">
                {currentMetrics.completedActivities}/{currentMetrics.totalActivities} atividades
              </div>
              <div className="mt-4">
                <div className="text-xs text-green-600 mb-1">
                  Média semanal: {weeklyAverage}%
                </div>
                <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${currentMetrics.completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Progresso Semanal */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Progresso Semanal</h3>
              <span className="text-sm text-gray-500">
                {weeklyProgress.length} semanas analisadas
              </span>
            </div>

            {weeklyProgress.length > 0 ? (
              <div className="space-y-4">
                {weeklyProgress.map((week, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        <FaCalendarAlt className="text-gray-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">Semana {week.weekNumber}</div>
                        <div className="text-sm text-gray-500">
                          {week.points} pontos • {week.completionRate.toFixed(1)}% concluído
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {week.trend === 'up' && <FaArrowUp className="text-green-500" />}
                      {week.trend === 'down' && <FaArrowDown className="text-red-500" />}
                      <span className={`px-2 py-1 text-xs rounded-full ${week.trend === 'up' ? 'bg-green-100 text-green-800' :
                        week.trend === 'down' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {week.trend === 'up' ? 'Melhorando' :
                          week.trend === 'down' ? 'Decaindo' : 'Estável'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Complete mais atividades para ver seu progresso semanal</p>
              </div>
            )}
          </div>

          {/* Insights Personalizados */}
          {insights && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pontos Fortes */}
              {insights.strengths.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                  <h4 className="font-semibold text-green-800 mb-3">✨ Seus Pontos Fortes</h4>
                  <ul className="space-y-2">
                    {insights.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span className="text-green-700 text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recomendações */}
              {insights.recommendations.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                  <h4 className="font-semibold text-blue-800 mb-3">💡 Recomendações</h4>
                  <ul className="space-y-2">
                    {insights.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">→</span>
                        <span className="text-blue-700 text-sm">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Próximos Passos */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                <h4 className="font-semibold text-purple-800 mb-3">🎯 Próximos Passos</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg">
                    <div className="font-medium text-gray-800">Alcance nível {currentMetrics.level + 1}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {getLevelProgress(currentMetrics.level).toFixed(1)}% completo
                    </div>
                  </div>

                  {currentMetrics.streak < 7 && (
                    <div className="p-3 bg-white rounded-lg">
                      <div className="font-medium text-gray-800">Complete uma semana inteira</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {7 - currentMetrics.streak} dias restantes
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FaTrophy className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Minhas Conquistas</h3>
              <p className="text-gray-500">
                Baseado no seu desempenho real na plataforma
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`border rounded-xl p-4 ${achievement.unlocked
                  ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
                  : 'bg-gray-50 border-gray-200'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`text-2xl ${achievement.unlocked ? '' : 'opacity-40'}`}>
                    {achievement.icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-semibold ${achievement.unlocked ? 'text-gray-800' : 'text-gray-600'}`}>
                        {achievement.title}
                      </h4>
                      {achievement.unlocked && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Desbloqueada
                        </span>
                      )}
                    </div>

                    <p className={`text-sm ${achievement.unlocked ? 'text-gray-600' : 'text-gray-500'}`}>
                      {achievement.description}
                    </p>

                    {achievement.unlocked && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Desbloqueada
                      </span>
                    )}

                    {!achievement.unlocked && achievement.progress !== undefined && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progresso</span>
                          <span>{achievement.progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
                            style={{ width: `${achievement.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaRegChartBar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Estatísticas Detalhadas</h3>
              <p className="text-gray-500">Análise completa do seu desempenho</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Estatísticas de Tempo */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-medium text-gray-800 mb-4">📊 Estatísticas de Tempo</h4>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tempo total gasto</span>
                  <span className="font-semibold">
                    {Math.floor(currentMetrics.timeSpent / 60)}h {currentMetrics.timeSpent % 60}min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tempo médio por atividade</span>
                  <span className="font-semibold">
                    {currentMetrics.completedActivities > 0
                      ? Math.round(currentMetrics.timeSpent / currentMetrics.completedActivities)
                      : 0} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dia mais produtivo</span>
                  <span className="font-semibold">{bestDay}</span>
                </div>
              </div>
            </div>

            {/* Estatísticas de Atividades */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-medium text-gray-800 mb-4">✅ Estatísticas de Atividades</h4>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Atividades totais</span>
                  <span className="font-semibold">{currentMetrics.totalActivities}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Atividades concluídas</span>
                  <span className="font-semibold">{currentMetrics.completedActivities}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de sucesso</span>
                  <span className="font-semibold">{currentMetrics.completionRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Análise de Tendência */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6">
              <h4 className="font-medium text-indigo-800 mb-4">📈 Análise de Tendência</h4>
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">Direção atual</div>
                      <div className="text-sm text-gray-500">
                        {data.performanceTrend === 'improving' ? 'Melhorando' :
                          data.performanceTrend === 'declining' ? 'Decaindo' : 'Estável'}
                      </div>
                    </div>
                    <div className="text-2xl">
                      {data.performanceTrend === 'improving' ? '📈' :
                        data.performanceTrend === 'declining' ? '📉' : '➡️'}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg">
                  <div className="font-medium text-gray-800">Semanas analisadas</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {data.weeklySnapshots.length} semanas
                  </div>
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
              <h4 className="font-medium text-green-800 mb-4">💡 Insights</h4>
              <div className="space-y-2">
                {insights.strengths.slice(0, 2).map((strength, index) => (
                  <p key={index} className="text-sm text-green-700">
                    • {strength}
                  </p>
                ))}
                {insights.recommendations.slice(0, 1).map((recommendation, index) => (
                  <p key={index} className="text-sm text-green-700">
                    • {recommendation}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}