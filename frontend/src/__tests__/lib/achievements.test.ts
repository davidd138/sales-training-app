import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS, getUnlockedAchievements, type AchievementStats } from '@/lib/achievements';

describe('Achievements', () => {
  const baseStats: AchievementStats = {
    totalSessions: 0,
    bestScore: 0,
    avgScore: 0,
    difficultiesPlayed: [],
    consecutiveDays: 0,
    scenariosPlayed: 0,
  };

  it('has 10 achievements defined', () => {
    expect(ACHIEVEMENTS).toHaveLength(15);
  });

  it('returns no achievements for fresh user', () => {
    const unlocked = getUnlockedAchievements(baseStats);
    expect(unlocked).toHaveLength(0);
  });

  it('unlocks first_call after 1 session', () => {
    const unlocked = getUnlockedAchievements({ ...baseStats, totalSessions: 1 });
    expect(unlocked.some(a => a.id === 'first_call')).toBe(true);
  });

  it('unlocks five_sessions after 5 sessions', () => {
    const unlocked = getUnlockedAchievements({ ...baseStats, totalSessions: 5 });
    expect(unlocked.some(a => a.id === 'five_sessions')).toBe(true);
  });

  it('unlocks score_80 when best score is 80+', () => {
    const unlocked = getUnlockedAchievements({ ...baseStats, bestScore: 85 });
    expect(unlocked.some(a => a.id === 'score_80')).toBe(true);
  });

  it('unlocks all_difficulties when all 3 played', () => {
    const unlocked = getUnlockedAchievements({ ...baseStats, difficultiesPlayed: ['easy', 'medium', 'hard'] });
    expect(unlocked.some(a => a.id === 'all_difficulties')).toBe(true);
  });

  it('unlocks streak_3 after 3 consecutive days', () => {
    const unlocked = getUnlockedAchievements({ ...baseStats, consecutiveDays: 3 });
    expect(unlocked.some(a => a.id === 'streak_3')).toBe(true);
  });

  it('unlocks multiple achievements at once', () => {
    const stats: AchievementStats = {
      totalSessions: 12,
      bestScore: 92,
      avgScore: 75,
      difficultiesPlayed: ['easy', 'medium', 'hard'],
      consecutiveDays: 8,
      scenariosPlayed: 6,
    };
    const unlocked = getUnlockedAchievements(stats);
    expect(unlocked.length).toBeGreaterThan(5);
  });

  it('each achievement has required fields', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.id).toBeTruthy();
      expect(a.title).toBeTruthy();
      expect(a.description).toBeTruthy();
      expect(a.icon).toBeTruthy();
      expect(typeof a.condition).toBe('function');
    }
  });
});
