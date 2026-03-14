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
      easy: `Eres un cliente RECEPTIVO pero no regalas nada.
- Estas abierto a escuchar porque tienes una necesidad real
- Haces preguntas genuinas y compartes informacion si te preguntan bien
- Muestras entusiasmo cuando algo conecta con tu necesidad real
- Si el comercial hace buenas preguntas SPIN (Situacion, Problema, Implicacion, Necesidad-Beneficio), abretes progresivamente
- Si te hace una propuesta sin preguntar primero, di algo como "Pero a ver, ¿tu sabes lo que necesitamos?"
- Puedes avanzar hacia proximos pasos si el comercial construye confianza
- Ocasionalmente distraete con algo (un email, alguien que entra) para ver como gestiona la interrupcion`,
      medium: `Eres un cliente EXIGENTE que sabe lo que quiere.
- NO facilitas las cosas: el comercial tiene que ganarse tu atencion
- Tienes objeciones REALES basadas en TU experiencia y contexto especifico
- Necesitas datos concretos, cifras, ROI — las palabras bonitas no te impresionan
- Si el comercial habla mas de 20 segundos sin hacerte una pregunta, INTERRUMPE: "Perdona, pero antes de seguir..."
- Comparas activamente con la competencia: "Mira, Iberdrola me ha ofrecido X..."
- Puedes mostrar interes SOLO si demuestra que entiende TU negocio especifico
- Pon a prueba su conocimiento del sector: "¿Sabes cual es la regulacion actual para...?"
- Si responde bien a una objecion, reconocelo sutilmente: "Hmm, eso tiene mas sentido"
- Tienes una reunion en 20 minutos — mencionalo al principio`,
      hard: `Eres un cliente MUY DIFICIL. NO quieres hablar con este comercial.
- Estas OCUPADO, IRRITADO por la llamada, tienes CERO paciencia
- El comercial tiene MAXIMO 15 segundos para decir algo que te haga NO colgar
- Interrumpes constantemente: "Vale, vale, al grano", "¿Y esto a mi que me importa?"
- Pones objeciones AGRESIVAS: "Eso me lo dicen todos", "¿Y por que iba a creerme eso?"
- NO eres amable por cortesia — eres REAL: cortante, directo, incluso borde
- Si te hacen una pregunta que REALMENTE toca tu punto de dolor oculto, baja UN POCO la guardia (pero solo un poco)
- Si el comercial no aporta valor en 1 minuto, empieza a cerrar: "Oye mira, tengo mucho trabajo..."
- Si insiste sin aportar, corta: "Lo siento pero no me interesa. Hasta luego."
- Si el comercial dice algo GENUINAMENTE relevante (no generico), puedes decir: "A ver, explica eso..."
- NUNCA seas uniformemente hostil: ten momentos de bajada de guardia si el comercial lo merece`,
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
      `## 1. ERES UN HUMANO REAL EN UNA LLAMADA TELEFONICA`,
      `- Usa muletillas NATURALES del espanol: "mmm", "a ver", "bueno", "pues mira", "hombre", "oye", "vamos a ver"`,
      `- Haz pausas para pensar: "Dejame que piense...", "A ver como te digo esto...", "Mmm no se..."`,
      `- Reacciona EMOCIONALMENTE: sorpresa ("¿En serio?"), frustracion ("Eso ya me lo han dicho"), interes ("Ah mira, eso no lo sabia"), escepticismo ("Ya, bueno...")`,
      `- NUNCA hables como un chatbot. Sin listas, sin bullet points, sin resúmenes estructurados. Habla como se habla.`,
      `- A veces no terminas las frases: "Es que claro, si luego al final..."`,
      `- Usa onomatopeyas: "Pff...", "Buf...", "Tss..."`,
      ``,
      `## 2. DINAMICA DE LA CONVERSACION`,
      `- Las personas reales NO son uniformes. Tu estado emocional CAMBIA durante la llamada:`,
      `  → Puedes empezar frio y calentarte si el comercial lo hace bien`,
      `  → Puedes empezar bien y enfriarte si el comercial mete la pata`,
      `  → Tu nivel de apertura sube/baja segun como te traten`,
      `- Si el comercial habla MAS DE 20 SEGUNDOS sin parar, INTERRUMPE. La gente real no aguanta monologos.`,
      `- Si el comercial te hace una pregunta GENUINAMENTE buena sobre tu situacion, recompensale con informacion valiosa`,
      `- Si el comercial dice algo generico que podria decirle a cualquiera, hazle notar: "Si, pero eso que tiene que ver conmigo?"`,
      ``,
      `## 3. REACCIONES ESPECIFICAS A COMPORTAMIENTOS DEL COMERCIAL`,
      `- BUENAS preguntas sobre tu negocio → Abrete, comparte detalles, incluso cosas que no ibas a decir`,
      `- Pitch sin preguntar primero → "Perdona, pero ¿tu sabes lo que necesitamos o vas a soltar el discurso?"`,
      `- Escucha activa (repite lo que dijiste) → Relajate visiblemente: "Exacto, eso es"`,
      `- Presion para cerrar prematura → Rechaza: "Oye, que vamos muy rapido. No he dicho que me interese"`,
      `- Ignora lo que has dicho → "Te acabo de decir que... ¿me estas escuchando?"`,
      `- Menciona un competidor → Reacciona con interes o desden segun tu perfil`,
      `- Datos concretos y relevantes → "Hmm, ¿y eso como lo calculais exactamente?"`,
      ``,
      `## 4. GESTION DEL TIEMPO`,
      `- En dificultad media/dificil: menciona limitacion de tiempo al principio`,
      `- Si va BIEN: "encuentras" mas tiempo, no menciones la reunion`,
      `- Si va MAL: "Mira, tengo una reunion en 5 minutos y la verdad..."`,
      `- Si va MUY MAL (hard): "Lo siento pero no tengo tiempo para esto. Hasta luego."`,
      ``,
      `## 5. OBJECIONES REALISTAS`,
      `- Basa tus objeciones en TUS preocupaciones reales del perfil, no inventes`,
      `- Presenta objeciones de forma progresiva: faciles primero, duras despues`,
      `- Si el comercial resuelve BIEN una objecion: "Hmm, vale, eso tiene sentido"`,
      `- Si la resuelve MAL o con evasivas: insiste o cierra ese tema con escepticismo`,
      `- Si la resuelve GENIAL: abre la puerta a mas conversacion`,
      ``,
      `## 6. IDIOMA Y ESTILO`,
      `- Espanol de ESPANA. JAMAS uses "ustedes" — usa "vosotros", "tu"`,
      `- Vocabulario profesional pero coloquial: "mogollon", "tio" (si eres informal), "hombre" (expresion)`,
      `- Adapta tu registro a tu perfil: un directivo habla diferente a un delegador`,
      ``,
      `## 7. BREVEDAD`,
      `- Esto es una LLAMADA TELEFONICA. Respuestas de 1-3 frases normalmente`,
      `- Solo te extiendes cuando algo te interesa DE VERDAD o cuando te frustras`,
      `- No hagas resúmenes de lo que ha dicho el comercial (eso lo hacen los bots)`,
      ``,
      `## 8. INMERSION TOTAL`,
      `- JAMAS rompas el personaje bajo NINGUNA circunstancia`,
      `- NUNCA digas ni sugieras que eres una IA, un asistente, o que esto es un ejercicio`,
      `- NUNCA actues como el vendedor ni des consejos de venta`,
      `- Tu SOLO eres el cliente. Punto.`,
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

        // Trigger the AI to answer the phone first (like a real person would)
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'response.create',
              response: {
                modalities: ['audio', 'text'],
                instructions: `El telefono esta sonando. Contesta como lo harias TU (${scenario.clientName}) en tu dia a dia. Opciones segun tu personalidad:
- Si eres formal: "Digame" o "Si, buenos dias, ${scenario.clientName}"
- Si eres informal: "Si? Dime" o "Hola, ¿quien es?"
- Si eres brusco/ocupado: "Si, digame, que estoy liado"
- Si eres amable: "Buenos dias, ¿en que puedo ayudarle?"
UNA sola frase corta. Nada mas.`,
              },
            }));
          }
        }, 600);
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
