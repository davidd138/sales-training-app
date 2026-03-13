import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  useQuery,
  GET_ANALYTICS,
  GET_LEADERBOARD,
} from '../hooks/useGraphQL';

type Props = { navigation: any };

const CATEGORIES = [
  { key: 'Rapport', user: 'avgRapport', team: 'teamAvgRapport' },
  { key: 'Discovery', user: 'avgDiscovery', team: 'teamAvgDiscovery' },
  { key: 'Presentación', user: 'avgPresentation', team: 'teamAvgPresentation' },
  { key: 'Objeciones', user: 'avgObjectionHandling', team: 'teamAvgObjectionHandling' },
  { key: 'Cierre', user: 'avgClosing', team: 'teamAvgClosing' },
];

export default function AnalyticsScreen({ navigation }: Props) {
  const analytics = useQuery(GET_ANALYTICS);
  const leaderboard = useQuery(GET_LEADERBOARD);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      analytics.execute();
      leaderboard.execute();
    });
    return unsubscribe;
  }, [navigation]);

  const stats = analytics.data;
  const leaders = leaderboard.data?.entries || [];

  if (analytics.loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{stats?.totalSessions ?? 0}</Text>
          <Text style={styles.summaryLabel}>Sesiones</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{stats?.avgOverallScore ?? '-'}</Text>
          <Text style={styles.summaryLabel}>Media</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {stats?.percentile != null ? `${stats.percentile}%` : '-'}
          </Text>
          <Text style={styles.summaryLabel}>Percentil</Text>
        </View>
      </View>

      {/* Category comparison: User vs Team */}
      <Text style={styles.sectionTitle}>Tu rendimiento vs Equipo</Text>
      {CATEGORIES.map(({ key, user, team }) => {
        const userVal = stats?.[user] ?? 0;
        const teamVal = stats?.[team] ?? 0;
        return (
          <View key={key} style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>{key}</Text>
            <View style={styles.comparisonBars}>
              <View style={styles.barRow}>
                <View
                  style={[styles.barUser, { width: `${userVal}%` }]}
                />
                <Text style={styles.barValue}>{userVal}</Text>
              </View>
              <View style={styles.barRow}>
                <View
                  style={[styles.barTeam, { width: `${teamVal}%` }]}
                />
                <Text style={styles.barValueTeam}>{teamVal}</Text>
              </View>
            </View>
          </View>
        );
      })}

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>Tú</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#475569' }]} />
          <Text style={styles.legendText}>Equipo</Text>
        </View>
      </View>

      {/* Trend */}
      {stats?.recentScores?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Últimas puntuaciones</Text>
          {stats.recentScores.map((s: any, i: number) => (
            <View key={i} style={styles.trendRow}>
              <Text style={styles.trendScenario}>
                {s.scenarioName || 'Sesión'}
              </Text>
              <Text
                style={[
                  styles.trendScore,
                  { color: s.overallScore >= 70 ? '#10B981' : '#F59E0B' },
                ]}
              >
                {s.overallScore}
              </Text>
            </View>
          ))}
        </>
      )}

      {/* Leaderboard */}
      {leaders.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
          {leaders.map((entry: any, i: number) => (
            <View key={entry.userId} style={styles.leaderRow}>
              <Text style={styles.leaderRank}>#{i + 1}</Text>
              <View style={styles.leaderInfo}>
                <Text style={styles.leaderName}>
                  {entry.name || entry.email}
                </Text>
                <Text style={styles.leaderSessions}>
                  {entry.totalSessions} sesiones
                </Text>
              </View>
              <Text style={styles.leaderScore}>{entry.avgScore}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 20, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: { fontSize: 24, fontWeight: '700', color: '#fff' },
  summaryLabel: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    marginTop: 8,
  },
  comparisonRow: { marginBottom: 16 },
  comparisonLabel: { fontSize: 14, color: '#CBD5E1', marginBottom: 6 },
  comparisonBars: { gap: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center' },
  barUser: {
    height: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  barTeam: {
    height: 6,
    backgroundColor: '#475569',
    borderRadius: 3,
  },
  barValue: { marginLeft: 8, color: '#3B82F6', fontSize: 12, fontWeight: '600' },
  barValueTeam: { marginLeft: 8, color: '#64748B', fontSize: 12 },
  legendRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
    marginTop: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#94A3B8', fontSize: 12 },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
  },
  trendScenario: { color: '#CBD5E1', fontSize: 14 },
  trendScore: { fontWeight: '700', fontSize: 16 },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  leaderRank: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
    width: 36,
  },
  leaderInfo: { flex: 1 },
  leaderName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  leaderSessions: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  leaderScore: { fontSize: 20, fontWeight: '700', color: '#10B981' },
});
