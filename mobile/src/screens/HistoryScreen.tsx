import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useQuery, LIST_CONVERSATIONS } from '../hooks/useGraphQL';

type Props = { navigation: any };

export default function HistoryScreen({ navigation }: Props) {
  const { data, loading, execute } = useQuery(LIST_CONVERSATIONS);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadInitial();
    });
    return unsubscribe;
  }, [navigation]);

  const loadInitial = async () => {
    const result = await execute({ limit: 20 });
    setItems(result?.items || []);
    setNextToken(result?.nextToken || null);
  };

  const loadMore = async () => {
    if (!nextToken || loading) return;
    const result = await execute({ limit: 20, nextToken });
    setItems((prev) => [...prev, ...(result?.items || [])]);
    setNextToken(result?.nextToken || null);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Analysis', { conversationId: item.id })}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardName}>
          {item.scenarioName || item.clientName || 'Sesión'}
        </Text>
        <Text
          style={[
            styles.statusBadge,
            item.status === 'completed' ? styles.statusCompleted : styles.statusPending,
          ]}
        >
          {item.status === 'completed' ? 'Completada' : 'En curso'}
        </Text>
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.cardDate}>
          {new Date(item.startedAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
        <Text style={styles.cardDuration}>
          {item.duration ? `${Math.round(item.duration / 60)} min` : '-'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} />
          ) : (
            <Text style={styles.empty}>No hay sesiones todavía</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  list: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardName: { fontSize: 16, fontWeight: '600', color: '#fff', flex: 1 },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  statusCompleted: { backgroundColor: '#064E3B', color: '#10B981' },
  statusPending: { backgroundColor: '#78350F', color: '#F59E0B' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardDate: { fontSize: 13, color: '#94A3B8' },
  cardDuration: { fontSize: 13, color: '#94A3B8' },
  empty: { color: '#94A3B8', textAlign: 'center', marginTop: 40, fontSize: 16 },
});
