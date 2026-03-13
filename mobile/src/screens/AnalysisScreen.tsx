import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  useQuery,
  useMutation,
  GET_CONVERSATION,
  ANALYZE_CONVERSATION,
} from '../hooks/useGraphQL';

type Props = { route: any; navigation: any };

const CATEGORY_LABELS: Record<string, string> = {
  rapport: 'Rapport',
  discovery: 'Discovery',
  presentation: 'Presentación',
  objectionHandling: 'Objeciones',
  closing: 'Cierre',
};

export default function AnalysisScreen({ route, navigation }: Props) {
  const { conversationId } = route.params;
  const conv = useQuery(GET_CONVERSATION);
  const analyze = useMutation(ANALYZE_CONVERSATION);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadData();
  }, [conversationId]);

  const loadData = async () => {
    const result = await conv.execute({ id: conversationId });
    if (result && !result.score) {
      setAnalyzing(true);
      try {
        await analyze.execute({ conversationId });
        await conv.execute({ id: conversationId });
      } catch (e) {
        console.error('Analysis failed:', e);
      }
      setAnalyzing(false);
    }
  };

  const data = conv.data;
  const score = data?.score;
  const conversation = data?.conversation;

  if (conv.loading || analyzing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>
          {analyzing ? 'Analizando conversación...' : 'Cargando...'}
        </Text>
      </View>
    );
  }

  if (!score) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Sin análisis disponible</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadData}
        >
          <Text style={styles.retryText}>Reintentar análisis</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scoreColor = (val: number) =>
    val >= 80 ? '#10B981' : val >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.scenarioName}>
        {conversation?.scenarioName || 'Sesión de entrenamiento'}
      </Text>

      {/* Overall score circle */}
      <View style={styles.overallContainer}>
        <View
          style={[
            styles.scoreCircle,
            { borderColor: scoreColor(score.overallScore) },
          ]}
        >
          <Text style={styles.scoreValue}>{score.overallScore}</Text>
          <Text style={styles.scoreLabel}>/ 100</Text>
        </View>
      </View>

      {/* Category bars */}
      <Text style={styles.sectionTitle}>Categorías</Text>
      {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
        const val = score[key] ?? 0;
        return (
          <View key={key} style={styles.categoryRow}>
            <Text style={styles.categoryLabel}>{label}</Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${val}%`,
                    backgroundColor: scoreColor(val),
                  },
                ]}
              />
            </View>
            <Text style={[styles.categoryScore, { color: scoreColor(val) }]}>
              {val}
            </Text>
          </View>
        );
      })}

      {/* Strengths */}
      {score.strengths?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Fortalezas</Text>
          {score.strengths.map((s: string, i: number) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletGreen}>+</Text>
              <Text style={styles.bulletText}>{s}</Text>
            </View>
          ))}
        </>
      )}

      {/* Improvements */}
      {score.improvements?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Áreas de mejora</Text>
          {score.improvements.map((s: string, i: number) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletOrange}>!</Text>
              <Text style={styles.bulletText}>{s}</Text>
            </View>
          ))}
        </>
      )}

      {/* Detailed feedback */}
      {score.detailedFeedback && (
        <>
          <Text style={styles.sectionTitle}>Feedback detallado</Text>
          <Text style={styles.feedback}>{score.detailedFeedback}</Text>
        </>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Dashboard')}
      >
        <Text style={styles.backButtonText}>Volver al inicio</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94A3B8', marginTop: 16, fontSize: 16 },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  scenarioName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  overallContainer: { alignItems: 'center', marginBottom: 32 },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
  },
  scoreValue: { fontSize: 40, fontWeight: '700', color: '#fff' },
  scoreLabel: { fontSize: 14, color: '#94A3B8' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    marginTop: 24,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryLabel: {
    width: 100,
    fontSize: 14,
    color: '#CBD5E1',
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  bar: { height: 8, borderRadius: 4 },
  categoryScore: { width: 30, textAlign: 'right', fontWeight: '700', fontSize: 14 },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 4,
  },
  bulletGreen: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 16,
    marginRight: 8,
    width: 16,
  },
  bulletOrange: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 16,
    marginRight: 8,
    width: 16,
  },
  bulletText: { flex: 1, color: '#CBD5E1', fontSize: 14, lineHeight: 20 },
  feedback: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 22,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  backButton: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#334155',
  },
  backButtonText: { color: '#60A5FA', fontWeight: '600', fontSize: 16 },
});
