import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { generateClient } from 'aws-amplify/api';
import { GET_REALTIME_TOKEN } from './useGraphQL';

const client = generateClient();
const SAMPLE_RATE = 24000;
const CHANNELS = 1;

type TrainingState = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error';
type TranscriptEntry = { role: 'user' | 'assistant'; text: string };

export function useRealtimeTraining(scenario: any) {
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

    return [
      `Eres ${scenario.clientName}, ${scenario.clientTitle} de ${scenario.clientCompany}.`,
      `Industria: ${scenario.industry}. Dificultad: ${scenario.difficulty}.`,
      persona.personality ? `Tu personalidad: ${persona.personality}` : '',
      persona.concerns ? `Tus preocupaciones principales: ${persona.concerns}` : '',
      persona.objectives ? `Tus objetivos: ${persona.objectives}` : '',
      '',
      'REGLAS:',
      '- Actúa SIEMPRE como el cliente, NUNCA como el vendedor.',
      '- Responde de forma natural y realista como lo haría este tipo de cliente.',
      '- El comercial te va a intentar vender servicios energéticos.',
      '- Haz preguntas, plantea objeciones y reacciona según tu personalidad.',
      '- Habla en español de España.',
      '- Sé conciso, como en una conversación telefónica real.',
    ].filter(Boolean).join('\n');
  }, [scenario]);

  const connect = useCallback(async () => {
    setState('connecting');
    try {
      const result = await client.graphql({ query: GET_REALTIME_TOKEN });
      const { token } = (result as any).data.getRealtimeToken;

      // Create AudioContext during user gesture for Safari
      const pCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
      const gain = pCtx.createGain();
      gain.connect(pCtx.destination);
      playbackCtxRef.current = pCtx;
      playbackGainRef.current = gain;
      nextPlayTimeRef.current = 0;

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
            voice: 'coral',
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
        startMicStream(ws);
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
      };

      ws.onerror = () => setState('error');
      ws.onclose = () => setState('idle');
    } catch (e) {
      console.error('Connection failed:', e);
      setState('error');
    }
  }, [buildSystemPrompt]);

  const handleMessage = useCallback((msg: any) => {
    switch (msg.type) {
      case 'input_audio_buffer.speech_started':
        setState('listening');
        // Interrupt playback
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
          setTranscript(prev => [
            ...prev,
            { role: 'assistant', text: pendingTranscriptRef.current },
          ]);
          pendingTranscriptRef.current = '';
        }
        break;

      case 'response.done':
        setState('connected');
        break;
    }
  }, []);

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

  const startMicStream = useCallback(async (ws: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: SAMPLE_RATE,
          channelCount: CHANNELS,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      micStreamRef.current = stream;

      const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
      micCtxRef.current = audioCtx;

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
        const b64 = btoa(binary);
        ws.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: b64,
        }));
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
      setState('connected');
    } catch (e) {
      console.error('Mic access failed:', e);
      setState('error');
    }
  }, []);

  const disconnect = useCallback(() => {
    // Stop mic
    if (micProcessorRef.current) {
      micProcessorRef.current.disconnect();
      micProcessorRef.current = null;
    }
    if (micCtxRef.current) {
      micCtxRef.current.close();
      micCtxRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }

    // Stop playback
    if (playbackCtxRef.current) {
      playbackCtxRef.current.close();
      playbackCtxRef.current = null;
    }
    playbackGainRef.current = null;

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setState('idle');
  }, []);

  return { state, transcript, connect, disconnect };
}
