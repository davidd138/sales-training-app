import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS, getUnlockedAchievements, type AchievementStats } from '@/lib/achievements';

describe('Extended Achievements', () => {
  const baseStats: AchievementStats = {
    totalSessions: 0, bestScore: 0, avgScore: 0,
    difficultiesPlayed: [], consecutiveDays: 0, scenariosPlayed: 0,
  };

  it('has 15 achievements defined', () => {
    expect(ACHIEVEMENTS.length).toBe(15);
  });

  it('all achievements have unique ids', () => {
    const ids = ACHIEVEMENTS.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('unlocks veteran after 20 sessions', () => {
    const unlocked = getUnlockedAchievements({ ...baseStats, totalSessions: 20 });
    expect(unlocked.some(a => a.id === 'twenty_sessions')).toBe(true);
  });

  it('unlocks completist after 10 scenarios', () => {
    const unlocked = getUnlockedAchievements({ ...baseStats, scenariosPlayed: 10 });
    expect(unlocked.some(a => a.id === 'all_scenarios')).toBe(true);
  });

  it('unlocks perfect week after 7 consecutive days', () => {
    const unlocked = getUnlockedAchievements({ ...baseStats, consecutiveDays: 7 });
    const weekAchievements = unlocked.filter(a => a.id === 'streak_7' || a.id === 'perfect_week');
    expect(weekAchievements.length).toBe(2);
  });

  it('power user unlocks many achievements', () => {
    const powerStats: AchievementStats = {
      totalSessions: 25, bestScore: 95, avgScore: 82,
      difficultiesPlayed: ['easy', 'medium', 'hard'],
      consecutiveDays: 10, scenariosPlayed: 12,
    };
    const unlocked = getUnlockedAchievements(powerStats);
    expect(unlocked.length).toBeGreaterThanOrEqual(12);
  });
});
