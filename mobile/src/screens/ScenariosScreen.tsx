import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useQuery, LIST_SCENARIOS } from '../hooks/useGraphQL';

type Props = { navigation: any };

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#10B981',
  medium: '#F59E0B',
  hard: '#EF4444',
};

export default function ScenariosScreen({ navigation }: Props) {
  const { data, loading, execute } = useQuery(LIST_SCENARIOS);

  useEffect(() => {
    execute();
  }, []);

  const scenarios = data || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Selecciona un escenario</Text>

      {loading ? (
        <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} />
      ) : scenarios.length === 0 ? (
        <Text style={styles.empty}>No hay escenarios disponibles</Text>
      ) : (
        scenarios.map((s: any) => (
          <TouchableOpacity
            key={s.id}
            style={styles.card}
            onPress={() => navigation.navigate('Training', { scenario: s })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>{s.name}</Text>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: DIFFICULTY_COLORS[s.difficulty] || '#94A3B8' },
                ]}
              >
                <Text style={styles.difficultyText}>
                  {s.difficulty === 'easy'
                    ? 'Fácil'
                    : s.difficulty === 'medium'
                    ? 'Media'
                    : 'Difícil'}
                </Text>
              </View>
            </View>
            <Text style={styles.clientInfo}>
              {s.clientName} · {s.clientTitle}
            </Text>
            <Text style={styles.company}>{s.clientCompany}</Text>
            <Text style={styles.industry}>{s.industry}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {s.description}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 20, paddingBottom: 40 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  empty: { color: '#94A3B8', textAlign: 'center', marginTop: 40, fontSize: 16 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardName: { fontSize: 18, fontWeight: '700', color: '#fff', flex: 1 },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  clientInfo: { fontSize: 14, color: '#60A5FA', marginBottom: 2 },
  company: { fontSize: 14, color: '#94A3B8', marginBottom: 2 },
  industry: { fontSize: 12, color: '#64748B', marginBottom: 8 },
  description: { fontSize: 14, color: '#CBD5E1', lineHeight: 20 },
});
