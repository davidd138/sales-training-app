'use client';

import { useState, useCallback, useRef } from 'react';
import { generateClient } from 'aws-amplify/api';
import { GET_REALTIME_TOKEN } from '@/lib/graphql/queries';
import type { TranscriptEntry, TrainingState, Scenario } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: any = null;
function getClient() {
  if (!_client) _client = generateClient();
  return _client;
}

const SAMPLE_RATE = 24000;

export function useRealtimeTraining(scenario: Scenario) {
  const [state, setState] = useState<TrainingState>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  const micProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const playbackGainRef = useRef<GainNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const pendingTranscriptRef = useRef('');

  const buildSystemPrompt = useCallback(() => {
    let persona: any = {};
    try {
      persona = typeof scenario.persona === 'string'
        ? JSON.parse(scenario.persona)
        : scenario.persona || {};
    } catch { /* ignore */ }

    const difficultyBehavior: Record<string, string> = {
      easy: `Eres un cliente RECEPTIVO. Estas abierto a escuchar pero necesitas que te convenzan con argumentos solidos.
Haces preguntas genuinas porque te interesa. Muestras entusiasmo cuando algo te encaja.
Si el comercial lo hace bien, puedes mostrar interes real y avanzar hacia proximos pasos.`,
      medium: `Eres un cliente EXIGENTE. No estas cerrado pero tampoco facilitas las cosas.
Tienes objeciones reales basadas en tu experiencia. Necesitas datos concretos, no palabras.
Interrumpes si el comercial habla demasiado sin aportar valor. Comparas activamente con otros proveedores.
Puedes mostrar interes pero solo si el comercial demuestra que entiende TU situacion especifica.`,
      hard: `Eres un cliente MUY DIFICIL. Probablemente no quieres hablar con este comercial.
Eres impaciente, cortante, y tienes poco tiempo. El comercial tiene 30 segundos para captar tu atencion.
Pones objeciones fuertes, interrumpes, cuestionas todo. NO eres amable por cortesia.
Solo bajas la guardia si el comercial dice algo REALMENTE relevante para tu situacion.
Si el comercial no aporta valor, corta la conversacion: "Mira, no me interesa, tengo trabajo".`,
    };

    const parts = [
      `# IDENTIDAD`,
      `Eres ${scenario.clientName}, ${scenario.clientTitle} de ${scenario.clientCompany}.`,
      `Trabajas en el sector de ${scenario.industry}.`,
      ``,
      `# TU PERSONALIDAD`,
      persona.personality || '',
      ``,
      persona.communicationStyle ? `# COMO HABLAS\n${persona.communicationStyle}` : '',
      ``,
      `# TU SITUACION ACTUAL`,
      persona.currentSituation || '',
      ``,
      `# LO QUE TE PREOCUPA`,
      persona.concerns || '',
      ``,
      `# TUS OBJETIVOS (no los digas directamente, que el comercial los descubra)`,
      persona.objectives || '',
      ``,
      persona.hiddenAgenda ? `# TU AGENDA OCULTA (NUNCA digas esto directamente, pero influye en tus decisiones)\n${persona.hiddenAgenda}` : '',
      ``,
      persona.buyingSignals ? `# CUANDO MUESTRAS INTERES\n${persona.buyingSignals}` : '',
      ``,
      persona.redLines ? `# LO QUE TE HACE CERRARTE\n${persona.redLines}` : '',
      ``,
      `# NIVEL DE DIFICULTAD`,
      difficultyBehavior[scenario.difficulty] || difficultyBehavior.medium,
      ``,
      `# REGLAS FUNDAMENTALES DE ACTUACION`,
      ``,
      `1. ERES UN HUMANO REAL, NO UN ROBOT. Habla como una persona real en una llamada telefonica:`,
      `   - Usa muletillas naturales: "mmm", "a ver", "bueno", "pues mira", "hombre"`,
      `   - Haz pausas para pensar: "Dejame que piense...", "A ver como te digo esto..."`,
      `   - Reacciona emocionalmente: sorpresa, frustracion, interes, escepticismo, entusiasmo`,
      `   - Si algo no te convence, se nota en tu tono: "Ya, bueno..." (esceptico), "Eso suena interesante" (genuino)`,
      ``,
      `2. NUNCA SEAS UNIFORMEMENTE AMABLE. Las personas reales:`,
      `   - Se impacientan si el comercial habla mucho sin escuchar`,
      `   - Se distraen si la conversacion es aburrida`,
      `   - Se emocionan si algo toca un punto de dolor real`,
      `   - Se cierran si se sienten presionados`,
      ``,
      `3. REACCIONA AL COMPORTAMIENTO DEL COMERCIAL:`,
      `   - Si te hace buenas preguntas sobre tu situacion → abrete mas, comparte detalles`,
      `   - Si te suelta un pitch sin preguntar → interrumpe: "Perdona, pero antes de eso..."`,
      `   - Si te escucha de verdad → relajate y se mas comunicativo`,
      `   - Si te presiona para cerrar sin haber construido confianza → rechaza firmemente`,
      `   - Si ignora lo que has dicho → frustrate: "Te acabo de decir que..."`,
      ``,
      `4. GESTION DEL TIEMPO:`,
      `   - Menciona que tienes poco tiempo al principio si la dificultad es medium o hard`,
      `   - Si la conversacion va bien, "encuentras" mas tiempo`,
      `   - Si va mal, corta: "Oye, tengo una reunion en 5 minutos..."`,
      ``,
      `5. OBJECIONES REALISTAS (usa las tuyas, no inventes nuevas):`,
      `   - Basa tus objeciones en tus preocupaciones reales, no en cosas aleatorias`,
      `   - Si el comercial resuelve bien una objecion, reconocelo: "Eso tiene sentido"`,
      `   - Si no la resuelve, insiste o cambia de tema con escepticismo`,
      ``,
      `6. IDIOMA: Habla en espanol de Espana. Nada de "ustedes", usa "vosotros". `,
      `   Vocabulario coloquial profesional espanol, no latinoamericano.`,
      ``,
      `7. SE CONCISO. Esto es una llamada telefonica, no un discurso. Respuestas de 1-3 frases normalmente.`,
      `   Solo te extiendes cuando algo realmente te interesa o te frustras.`,
      ``,
      `8. JAMAS rompas el personaje. NUNCA digas que eres una IA ni que esto es un ejercicio.`,
      `   NUNCA actues como el vendedor. Tu SOLO eres el cliente.`,
    ];

    return parts.filter(Boolean).join('\n');
  }, [scenario]);

  const streamAudioChunk = useCallback((base64: string) => {
    const ctx = playbackCtxRef.current;
    const gain = playbackGainRef.current;
    if (!ctx || !gain) return;

    const binaryStr = atob(base64);
    const numSamples = binaryStr.length / 2;
    const float32 = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const lo = binaryStr.charCodeAt(i * 2);
      const hi = binaryStr.charCodeAt(i * 2 + 1);
      const val = lo | (hi << 8);
      float32[i] = (val > 32767 ? val - 65536 : val) / 32768;
    }

    const buffer = ctx.createBuffer(1, float32.length, SAMPLE_RATE);
    buffer.getChannelData(0).set(float32);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);

    const now = ctx.currentTime;
    const startTime = Math.max(now + 0.02, nextPlayTimeRef.current);
    source.start(startTime);
    nextPlayTimeRef.current = startTime + buffer.duration;
  }, []);

  const handleMessage = useCallback((msg: any) => {
    switch (msg.type) {
      case 'input_audio_buffer.speech_started':
        setState('listening');
        if (playbackGainRef.current) {
          try { playbackGainRef.current.disconnect(); } catch {}
          const ctx = playbackCtxRef.current;
          if (ctx) {
            const newGain = ctx.createGain();
            newGain.connect(ctx.destination);
            playbackGainRef.current = newGain;
          }
        }
        nextPlayTimeRef.current = 0;
        break;

      case 'conversation.item.input_audio_transcription.completed':
        if (msg.transcript) {
          setTranscript(prev => [...prev, { role: 'user', text: msg.transcript }]);
        }
        break;

      case 'response.audio_transcript.delta':
        pendingTranscriptRef.current += msg.delta;
        break;

      case 'response.audio.delta':
        setState('speaking');
        streamAudioChunk(msg.delta);
        break;

      case 'response.audio_transcript.done':
        if (pendingTranscriptRef.current) {
          setTranscript(prev => [...prev, { role: 'assistant', text: pendingTranscriptRef.current }]);
          pendingTranscriptRef.current = '';
        }
        break;

      case 'response.done':
        setState('connected');
        break;
    }
  }, [streamAudioChunk]);

  const startMicStream = useCallback((ws: WebSocket, stream: MediaStream, audioCtx: AudioContext) => {
    try {
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      micProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const input = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: btoa(binary) }));
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
    } catch (e) {
      console.error('Mic setup failed:', e);
      setState('error');
    }
  }, []);

  const connect = useCallback(async () => {
    setState('connecting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: SAMPLE_RATE, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      micStreamRef.current = stream;

      const pCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
      const gain = pCtx.createGain();
      gain.connect(pCtx.destination);
      playbackCtxRef.current = pCtx;
      playbackGainRef.current = gain;
      nextPlayTimeRef.current = 0;

      const micAudioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
      micCtxRef.current = micAudioCtx;

      const result = await getClient().graphql({ query: GET_REALTIME_TOKEN });
      const { token } = (result as any).data.getRealtimeToken;

      const ws = new WebSocket(
        'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview',
        ['realtime', `openai-insecure-api-key.${token}`, 'openai-beta.realtime-v1']
      );
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['audio', 'text'],
            instructions: buildSystemPrompt(),
            voice: (scenario as any).voice || 'coral',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: { model: 'gpt-4o-mini-transcribe' },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 700,
            },
          },
        }));
        setState('connected');
        startMicStream(ws, stream, micAudioCtx);
      };

      ws.onmessage = (event) => handleMessage(JSON.parse(event.data));
      ws.onerror = () => setState('error');
      ws.onclose = () => setState('idle');
    } catch (e) {
      console.error('Connection failed:', e);
      setState('error');
    }
  }, [buildSystemPrompt, handleMessage, startMicStream]);

  const disconnect = useCallback(() => {
    if (micProcessorRef.current) { micProcessorRef.current.disconnect(); micProcessorRef.current = null; }
    if (micCtxRef.current) { micCtxRef.current.close(); micCtxRef.current = null; }
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null; }
    if (playbackCtxRef.current) { playbackCtxRef.current.close(); playbackCtxRef.current = null; }
    playbackGainRef.current = null;
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    setState('idle');
  }, []);

  return { state, transcript, connect, disconnect };
}
