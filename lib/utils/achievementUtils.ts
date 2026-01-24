// lib/utils/achievementUtils.ts - VERSÃO CORRIGIDA

export class AchievementUtils {
  /**
   * Calcula conquistas baseadas em dados reais do aluno
   * - Determinístico (sempre o mesmo resultado para os mesmos inputs)
   * - Não persistido (recalculado a cada render)
   * - Sem unlockedAt dinâmico
   */
  static calculateAchievements(
    studentId: string,
    instances: any[],
    snapshots: any[],
    currentMetrics: {
      streak: number;
      totalPoints: number;
      completedActivities: number;
      completionRate: number;
    }
  ): Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    type: string;
    unlocked: boolean;
    progress?: number;
  }> {
    const achievements = [];
    
    // 📊 1. Primeiros Passos (qualquer atividade completada)
    const firstStepsUnlocked = currentMetrics.completedActivities > 0;
    achievements.push({
      id: 'first_steps',
      title: 'Primeiros Passos',
      description: 'Complete sua primeira atividade',
      icon: '👣',
      type: 'completion',
      unlocked: firstStepsUnlocked,
      progress: firstStepsUnlocked ? 100 : 0
    });
    
    // 🔥 2. Streak de 3 dias
    const streak3Progress = Math.min(100, (currentMetrics.streak / 3) * 100);
    achievements.push({
      id: 'streak_3',
      title: 'Fogo Inicial',
      description: 'Mantenha um streak de 3 dias',
      icon: '🔥',
      type: 'streak',
      unlocked: currentMetrics.streak >= 3,
      progress: streak3Progress
    });
    
    // 🏆 3. Streak de 7 dias
    const streak7Progress = Math.min(100, (currentMetrics.streak / 7) * 100);
    achievements.push({
      id: 'streak_7',
      title: 'Semana Perfeita',
      description: 'Mantenha um streak de 7 dias',
      icon: '🏆',
      type: 'streak',
      unlocked: currentMetrics.streak >= 7,
      progress: streak7Progress
    });
    
    // 💯 4. Pontos acumulados (100)
    const points100Progress = Math.min(100, (currentMetrics.totalPoints / 100) * 100);
    achievements.push({
      id: 'points_100',
      title: 'Centenário',
      description: 'Alcance 100 pontos',
      icon: '💯',
      type: 'completion',
      unlocked: currentMetrics.totalPoints >= 100,
      progress: points100Progress
    });
    
    // ⭐ 5. Pontos acumulados (500)
    const points500Progress = Math.min(100, (currentMetrics.totalPoints / 500) * 100);
    achievements.push({
      id: 'points_500',
      title: 'Mestre dos Pontos',
      description: 'Alcance 500 pontos',
      icon: '⭐',
      type: 'points',
      unlocked: currentMetrics.totalPoints >= 500,
      progress: points500Progress
    });
    
    // ✅ 6. Atividades completadas (50)
    const activities50Progress = Math.min(100, (currentMetrics.completedActivities / 50) * 100);
    achievements.push({
      id: 'activities_50',
      title: 'Produtivo',
      description: 'Complete 50 atividades',
      icon: '✅',
      type: 'streak',
      unlocked: currentMetrics.completedActivities >= 50,
      progress: activities50Progress
    });
    
    // 🎯 7. Semana perfeita (busca em snapshots)
    const perfectWeekUnlocked = snapshots.some(s => s.engagement?.completionRate === 100);
    achievements.push({
      id: 'perfect_week',
      title: 'Semana Impecável',
      description: 'Conclua 100% das atividades em uma semana',
      icon: '🎯',
      type: 'speed',
      unlocked: perfectWeekUnlocked,
      progress: perfectWeekUnlocked ? 100 : 0
    });
    
    // 🌅 8. Madrugador (simplificado - em produção teria lógica de horário)
    const earlyBirdProgress = 0; // Seria calculado baseado em horários de completion
    achievements.push({
      id: 'early_bird',
      title: 'Madrugador',
      description: 'Complete 5 atividades antes das 8h',
      icon: '🌅',
      type: 'consistency',
      unlocked: false,
      progress: earlyBirdProgress
    });
    
    // 📈 9. Consistência (completion rate > 80% em múltiplas semanas)
    const consistentWeeks = snapshots.filter(s => s.engagement?.completionRate >= 80).length;
    const consistencyProgress = Math.min(100, (consistentWeeks / 3) * 100);
    achievements.push({
      id: 'consistency',
      title: 'Consistente',
      description: 'Mantenha >80% de conclusão por 3 semanas',
      icon: '📈',
      type: 'completion',
      unlocked: consistentWeeks >= 3,
      progress: consistencyProgress
    });
    
    return achievements;
  }

  /**
   * Retorna descrição detalhada de uma conquista
   */
  static getAchievementDescription(id: string): string {
    const descriptions: Record<string, string> = {
      'first_steps': 'Complete qualquer atividade para desbloquear',
      'streak_3': 'Faça atividades por 3 dias consecutivos',
      'streak_7': 'Mantenha sua rotina por uma semana inteira',
      'points_100': 'Acumule pontos completando atividades',
      'points_500': 'Continue progredindo para alcançar 500 pontos',
      'activities_50': 'Complete 50 atividades no total',
      'perfect_week': 'Não perca nenhuma atividade por uma semana',
      'early_bird': 'Faça atividades nas primeiras horas do dia',
      'consistency': 'Seja consistente semana após semana'
    };
    
    return descriptions[id] || 'Continue progredindo para desbloquear';
  }
}