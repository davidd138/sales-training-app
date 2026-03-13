import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useQuery, GET_ANALYTICS, LIST_CONVERSATIONS } from '../hooks/useGraphQL';

type Props = {
  navigation: any;
  userName: string | null;
};

export default function DashboardScreen({ navigation, userName }: Props) {
  const analytics = useQuery(GET_ANALYTICS);
  const conversations = useQuery(LIST_CONVERSATIONS);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      analytics.execute();
      conversations.execute({ limit: 5 });
    });
    return unsubscribe;
  }, [navigation]);

  const stats = analytics.data;
  const recent = conversations.data?.items || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>
        Hola, {userName || 'Comercial'}
      </Text>

      {analytics.loading ? (
        <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatCard
              label="Sesiones"
              value={stats?.totalSessions ?? 0}
              color="#3B82F6"
            />
            <StatCard
              label="Media"
              value={stats?.avgOverallScore ?? '-'}
              color="#10B981"
            />
            <StatCard
              label="Percentil"
              value={stats?.percentile != null ? `${stats.percentile}%` : '-'}
              color="#F59E0B"
            />
          </View>

          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('Scenarios')}
          >
            <Text style={styles.startButtonText}>Empezar entrenamiento</Text>
          </TouchableOpacity>

          {recent.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Últimas sesiones</Text>
              {recent.map((conv: any) => (
                <TouchableOpacity
                  key={conv.id}
                  style={styles.sessionCard}
                  onPress={() =>
                    navigation.navigate('Analysis', { conversationId: conv.id })
                  }
                >
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionName}>
                      {conv.scenarioName || conv.clientName || 'Sesión'}
                    </Text>
                    <Text style={styles.sessionDate}>
                      {new Date(conv.startedAt).toLocaleDateString('es-ES')}
                    </Text>
                  </View>
                  <Text style={styles.sessionDuration}>
                    {conv.duration ? `${Math.round(conv.duration / 60)}min` : '-'}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 20, paddingBottom: 40 },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  startButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  sessionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionInfo: { flex: 1 },
  sessionName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  sessionDate: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  sessionDuration: { fontSize: 14, color: '#94A3B8' },
});
