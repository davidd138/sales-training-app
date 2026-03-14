import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useMutation, CREATE_CONVERSATION, UPDATE_CONVERSATION } from '../hooks/useGraphQL';
import { useRealtimeTraining } from '../hooks/useRealtimeTraining';

type Props = {
  route: any;
  navigation: any;
};

export default function TrainingCallScreen({ route, navigation }: Props) {
  const { scenario } = route.params;
  const [elapsed, setElapsed] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<any>(null);
  const timerStartedRef = useRef(false);

  const createConv = useMutation(CREATE_CONVERSATION);
  const updateConv = useMutation(UPDATE_CONVERSATION);

  const { state, connect, disconnect, transcript } = useRealtimeTraining(scenario);

  useEffect(() => {
    (async () => {
      try {
        const conv = await createConv.execute({
          input: { scenarioId: scenario.id },
        });
        setConversationId(conv.id);
        await connect();
      } catch (e) {
        console.error('Failed to start training:', e);
        navigation.goBack();
      }
    })();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const isActive = state === 'connected' || state === 'speaking' || state === 'listening';
    if (isActive && !timerStartedRef.current) {
      timerStartedRef.current = true;
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
  }, [state]);

  const handleHangUp = useCallback(async () => {
    disconnect();
    if (timerRef.current) clearInterval(timerRef.current);

    if (conversationId) {
      try {
        await updateConv.execute({
          input: {
            id: conversationId,
            transcript: JSON.stringify(transcript),
            duration: elapsed,
            status: 'completed',
            endedAt: new Date().toISOString(),
          },
        });
      } catch (e) {
        console.error('Failed to save conversation:', e);
      }
      navigation.replace('Analysis', { conversationId });
    } else {
      navigation.goBack();
    }
  }, [conversationId, elapsed, transcript, disconnect, navigation]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const stateLabel =
    state === 'connecting'
      ? 'Conectando...'
      : state === 'listening'
      ? 'Escuchando...'
      : state === 'speaking'
      ? 'Hablando...'
      : state === 'connected'
      ? 'Conectado'
      : state === 'error'
      ? 'Error de conexión'
      : '';

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.clientName}>{scenario.clientName}</Text>
        <Text style={styles.clientTitle}>{scenario.clientTitle}</Text>
        <Text style={styles.company}>{scenario.clientCompany}</Text>
      </View>

      <View style={styles.centerSection}>
        <Text style={styles.timer}>{formatTime(elapsed)}</Text>
        <Text style={[styles.stateLabel, state === 'error' && styles.errorLabel]}>
          {stateLabel}
        </Text>
        {state === 'error' && (
          <TouchableOpacity style={styles.retryButton} onPress={connect}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        )}
        {(state === 'listening' || state === 'speaking') && (
          <View
            style={[
              styles.pulseIndicator,
              state === 'speaking'
                ? styles.pulseActive
                : styles.pulseListening,
            ]}
          />
        )}
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.hangUpButton} onPress={handleHangUp}>
          <Text style={styles.hangUpText}>Colgar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 80,
  },
  clientName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  clientTitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 4,
  },
  company: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  centerSection: {
    alignItems: 'center',
  },
  timer: {
    fontSize: 48,
    fontWeight: '300',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  stateLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
  pulseIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  pulseActive: {
    backgroundColor: '#3B82F6',
  },
  pulseListening: {
    backgroundColor: '#10B981',
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: 60,
  },
  hangUpButton: {
    backgroundColor: '#EF4444',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hangUpText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorLabel: {
    color: '#EF4444',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#1E293B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
