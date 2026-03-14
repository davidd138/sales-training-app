export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji
  condition: (stats: AchievementStats) => boolean;
};

export type AchievementStats = {
  totalSessions: number;
  bestScore: number;
  avgScore: number;
  difficultiesPlayed: string[];
  consecutiveDays: number;
  scenariosPlayed: number;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_call',
    title: 'Primera Llamada',
    description: 'Completa tu primera sesion de entrenamiento',
    icon: '📞',
    condition: (s) => s.totalSessions >= 1,
  },
  {
    id: 'five_sessions',
    title: 'Constancia',
    description: 'Completa 5 sesiones de entrenamiento',
    icon: '🔥',
    condition: (s) => s.totalSessions >= 5,
  },
  {
    id: 'ten_sessions',
    title: 'Dedicacion Total',
    description: 'Completa 10 sesiones de entrenamiento',
    icon: '💪',
    condition: (s) => s.totalSessions >= 10,
  },
  {
    id: 'score_80',
    title: 'Rendimiento Excelente',
    description: 'Consigue una puntuacion superior a 80',
    icon: '⭐',
    condition: (s) => s.bestScore >= 80,
  },
  {
    id: 'score_90',
    title: 'Maestro del Cierre',
    description: 'Consigue una puntuacion superior a 90',
    icon: '🏆',
    condition: (s) => s.bestScore >= 90,
  },
  {
    id: 'all_difficulties',
    title: 'Valiente',
    description: 'Prueba todos los niveles de dificultad',
    icon: '🎯',
    condition: (s) => s.difficultiesPlayed.length >= 3,
  },
  {
    id: 'streak_3',
    title: 'Racha de 3',
    description: 'Practica 3 dias consecutivos',
    icon: '📈',
    condition: (s) => s.consecutiveDays >= 3,
  },
  {
    id: 'streak_7',
    title: 'Semana Perfecta',
    description: 'Practica 7 dias consecutivos',
    icon: '🌟',
    condition: (s) => s.consecutiveDays >= 7,
  },
  {
    id: 'explorer',
    title: 'Explorador',
    description: 'Prueba al menos 5 escenarios diferentes',
    icon: '🧭',
    condition: (s) => s.scenariosPlayed >= 5,
  },
  {
    id: 'improvement',
    title: 'Mejora Continua',
    description: 'Tu media supera el 70',
    icon: '📊',
    condition: (s) => s.avgScore >= 70,
  },
];

export function getUnlockedAchievements(stats: AchievementStats): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.condition(stats));
}
