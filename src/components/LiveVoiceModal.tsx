import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  X, 
  Sparkles, 
  Volume2, 
  Radio, 
  Zap, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { EvolveState } from '../types';
import { 
  floatTo16BitPCM, 
  arrayBufferToBase64, 
  LiveAudioPlayer 
} from '../utils/audioStreamer';
import { getNeedsAttention, getNextBestAction, calculateFinancialMetrics } from '../services/smartEngine';

interface LiveVoiceModalProps {
  state: EvolveState;
  onClose: () => void;
}

export function LiveVoiceModal({ state, onClose }: LiveVoiceModalProps) {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<{ role: 'user' | 'model'; text: string; time: string }[]>([]);
  const [activeSparTopic, setActiveSparTopic] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playerRef = useRef<LiveAudioPlayer | null>(null);
  const isMutedRef = useRef(false);

  // Keep ref in sync for onaudioprocess
  useEffect(() => {
    isMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  // Build system context
  const buildContextPrompt = () => {
    const attention = getNeedsAttention(state);
    const nextBest = getNextBestAction(state);
    const metrics = calculateFinancialMetrics(state);
    const activeClients = state.clients.map(c => `${c.name} (Stage: ${c.stage}, Expected: ₾${c.expectedRevenue})`).join(', ');
    const criticalTasks = state.tasks.filter(t => t.priority === 'Critical' || t.priority === 'High').slice(0, 4).map(t => `${t.title} [${t.status}]`).join('; ');

    return `CURRENT EVOLVE OS EXECUTIVE CONTEXT:
- Timezone: Tbilisi (GMT+4)
- Expected Daily Revenue: ₾${metrics.expectedIncome} | Received: ₾${metrics.receivedIncome} | Target: ₾6,000/mo
- Urgent Attention Items (${attention.length}): ${attention.slice(0, 3).map(a => a.title).join(', ')}
- Top Priority Recommendation: ${nextBest ? nextBest.title + ' (' + nextBest.georgianWhy + ')' : 'Execute routine blocks'}
- Active Clients: ${activeClients}
- High-priority Tasks: ${criticalTasks}
- Main Weekly Project: ${state.projects.find(p => p.isWeeklyMainProject)?.name || 'None'}
Be ready to respond to the user concisely in Georgian or English.`;
  };

  const startSession = async () => {
    setConnectionStatus('connecting');
    setErrorMessage(null);

    try {
      // 1. Initialize Player (24kHz for Gemini Live output)
      playerRef.current = new LiveAudioPlayer(24000);
      await playerRef.current.resume();

      // 2. Connect WebSocket to server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Live Voice] Connected to server WebSocket');
        // Send initial executive state context
        ws.send(JSON.stringify({
          systemContext: buildContextPrompt(),
          text: "Executive is now on the line. Greet briefly with high executive sharpness in Georgian (or English) and present the immediate #1 priority."
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.status === 'connected') {
            setConnectionStatus('connected');
          }

          if (data.audio) {
            setIsModelSpeaking(true);
            playerRef.current?.playChunk(data.audio);
          }

          if (data.interrupted) {
            playerRef.current?.stop();
            setIsModelSpeaking(false);
          }

          if (data.text) {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setTranscript(prev => [...prev, { role: 'model', text: data.text, time: timeStr }]);
            setIsModelSpeaking(false);
          }

          if (data.error) {
            setErrorMessage(data.error);
            setConnectionStatus('error');
          }
        } catch (err) {
          console.error('[Live Voice] Error parsing ws message:', err);
        }
      };

      ws.onerror = (e) => {
        console.error('[Live Voice] WS error:', e);
        setErrorMessage('WebSocket connection failed. Verify server and network.');
        setConnectionStatus('error');
      };

      ws.onclose = () => {
        setConnectionStatus('idle');
        setIsModelSpeaking(false);
      };

      // 3. Setup Mic Stream (16kHz for Gemini input)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMutedRef.current) return;
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Convert to 16-bit PCM little-endian
        const pcmBuffer = floatTo16BitPCM(inputData);
        const base64Audio = arrayBufferToBase64(pcmBuffer);

        wsRef.current.send(JSON.stringify({ audio: base64Audio }));
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

    } catch (err: any) {
      console.error('[Live Voice] Mic / Session start failed:', err);
      setErrorMessage(err.message || 'Microphone access denied or audio device not found');
      setConnectionStatus('error');
    }
  };

  const stopSession = () => {
    // Stop mic
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop player
    if (playerRef.current) {
      playerRef.current.close();
      playerRef.current = null;
    }

    // Stop WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionStatus('idle');
    setIsModelSpeaking(false);
  };

  useEffect(() => {
    // Auto start when modal opens
    startSession();
    return () => {
      stopSession();
    };
  }, []);

  const sendTopicPrompt = (topicTitle: string, promptText: string) => {
    setActiveSparTopic(topicTitle);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTranscript(prev => [...prev, { role: 'user', text: topicTitle, time: timeStr }]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Interrupt ongoing audio playback if any
      playerRef.current?.stop();
      wsRef.current.send(JSON.stringify({ text: promptText }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Radio className="w-5 h-5 animate-pulse" />
              {connectionStatus === 'connected' && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-neutral-900" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white tracking-tight">Chief of Staff — Live Voice</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  gemini-3.1-flash-live-preview
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                ცოცხალი ხმოვანი სპარინგი, სტრატეგიული გადაწყვეტილებები და დილის/საღამოს ბრიფინგი
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopSession();
              onClose();
            }}
            className="text-neutral-400 hover:text-white p-2 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Audio Visualizer / Status Area */}
        <div className="p-6 bg-gradient-to-b from-neutral-950/80 to-neutral-900 flex flex-col items-center justify-center border-b border-neutral-800">
          
          {/* Status Indicator */}
          <div className="mb-4">
            {connectionStatus === 'connecting' && (
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                მიმდინარეობს Gemini Live API-სთან დაკავშირება...
              </div>
            )}
            {connectionStatus === 'connected' && (
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {isModelSpeaking ? 'Chief of Staff საუბრობს...' : isMicMuted ? 'მიკროფონი გამორთულია' : 'პირდაპირი კავშირი ჩართულია (ისაუბრეთ თავისუფლად)'}
              </div>
            )}
            {connectionStatus === 'error' && (
              <div className="flex items-center gap-2 text-xs font-mono text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">
                <AlertCircle className="w-3.5 h-3.5" />
                {errorMessage || 'კავშირის შეცდომა'}
              </div>
            )}
          </div>

          {/* Animated Waveform Orb */}
          <div className="relative my-4 flex items-center justify-center">
            {/* Outer pulse ring */}
            <div className={`absolute w-36 h-36 rounded-full transition-all duration-700 ${
              isModelSpeaking 
                ? 'bg-emerald-500/20 scale-125 animate-pulse' 
                : connectionStatus === 'connected' && !isMicMuted
                ? 'bg-blue-500/10 scale-110'
                : 'bg-neutral-800/30'
            }`} />

            {/* Inner Core */}
            <div className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
              isModelSpeaking 
                ? 'bg-emerald-500 text-black shadow-emerald-500/30 scale-105' 
                : connectionStatus === 'connected' && !isMicMuted
                ? 'bg-neutral-800 border-2 border-emerald-500 text-emerald-400'
                : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
            }`}>
              {isModelSpeaking ? (
                <Volume2 className="w-10 h-10 animate-bounce" />
              ) : isMicMuted ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </div>

            {/* Simulated soundwave bars */}
            <div className="absolute -bottom-8 flex items-center gap-1.5 h-6">
              {[0.4, 0.8, 0.5, 1, 0.7, 0.9, 0.3, 0.6, 0.85, 0.4].map((scale, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isModelSpeaking 
                      ? 'bg-emerald-400' 
                      : connectionStatus === 'connected' && !isMicMuted
                      ? 'bg-neutral-500'
                      : 'bg-neutral-800'
                  }`}
                  style={{
                    height: isModelSpeaking 
                      ? `${Math.max(6, scale * 24)}px` 
                      : connectionStatus === 'connected' && !isMicMuted 
                      ? `${Math.max(4, scale * 12)}px` 
                      : '4px'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Audio Controls */}
          <div className="mt-8 flex items-center gap-3">
            <button
              onClick={() => setIsMicMuted(prev => !prev)}
              disabled={connectionStatus !== 'connected'}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition border cursor-pointer ${
                isMicMuted 
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' 
                  : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
              }`}
            >
              {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              {isMicMuted ? 'მიკროფონის ჩართვა' : 'მიკროფონის გათიშვა'}
            </button>

            {connectionStatus === 'error' && (
              <button
                onClick={startSession}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                ხელახლა დაკავშირება
              </button>
            )}

            <button
              onClick={() => {
                playerRef.current?.stop();
                setIsModelSpeaking(false);
              }}
              disabled={!isModelSpeaking}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 disabled:opacity-40 transition cursor-pointer"
            >
              შეწყვეტა
            </button>
          </div>
        </div>

        {/* Quick Executive Spar Topics */}
        <div className="p-4 bg-neutral-950/40 border-b border-neutral-800">
          <div className="text-[11px] uppercase tracking-wider font-mono text-neutral-400 mb-2 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            სწრაფი სპარინგის თემები
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => sendTopicPrompt(
                'დილის ბრიფინგი',
                'ჩამიტარე დილის მართვის ბრიფინგი გამართული, დახვეწილი ქართულით. გამახსენე დღის მთავარი ფინანსური მიზანი, კრიტიკული პრიორიტეტები და რუტინის განრიგი.'
              )}
              className="text-left p-2.5 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 hover:border-emerald-500/40 transition group cursor-pointer"
            >
              <div className="text-xs font-medium text-neutral-200 group-hover:text-emerald-400 flex items-center justify-between">
                <span>🌅 დილის ბრიფინგი</span>
                <span className="text-[10px] text-neutral-500 font-mono">დილა</span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">3 მთავარი პრიორიტეტის, ფინანსების და კალენდრის შემოწმება</div>
            </button>

            <button
              onClick={() => sendTopicPrompt(
                'Ronen-ის გადახდის სტრატეგია',
                'მომეცი მკაფიო, თავდაჯერებული და პროფესიონალური ტაქტიკა გამართული ქართულით, თუ როგორ ავიღო Ronen / IIC-სგან ₾350 გადახდა დღესვე ყოველგვარი გაჭიანურების გარეშე.'
              )}
              className="text-left p-2.5 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 hover:border-emerald-500/40 transition group cursor-pointer"
            >
              <div className="text-xs font-medium text-neutral-200 group-hover:text-emerald-400 flex items-center justify-between">
                <span>💼 მოლაპარაკება: Ronen Follow-up</span>
                <span className="text-[10px] text-emerald-400 font-mono">₾350</span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">ტაქტიკა ეტაპობრივი ანაზღაურების დასადასტურებლად</div>
            </button>

            <button
              onClick={() => sendTopicPrompt(
                'მეორეხარისხოვანი საქმეების მოშორება',
                'გადახედე დღევანდელ სიას და პირდაპირ, მკაცრად გამიფილტრე ყველაფერი, რაც პირდაპირ შემოსავალს არ ქმნის ან მთავარ პროექტს წინ არ წევს.'
              )}
              className="text-left p-2.5 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 hover:border-emerald-500/40 transition group cursor-pointer"
            >
              <div className="text-xs font-medium text-neutral-200 group-hover:text-emerald-400 flex items-center justify-between">
                <span>🎯 მკაცრი პრიორიტეტების ფილტრი</span>
                <span className="text-[10px] text-neutral-500 font-mono">ფოკუსი</span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">ზედმეტი ხმაურის მოცილება და შემოსავლის ბლოკის დაცვა</div>
            </button>

            <button
              onClick={() => sendTopicPrompt(
                'საღამოს შეჯამება',
                'ჩამიტარე საღამოს შეჯამება და რეალობის შემოწმება გამართული ქართულით. მკითხე, რა რეალური ნაბიჯი გადაიდგა, რა თანხა დაფიქსირდა და რა გადადის ხვალისთვის.'
              )}
              className="text-left p-2.5 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 hover:border-emerald-500/40 transition group cursor-pointer"
            >
              <div className="text-xs font-medium text-neutral-200 group-hover:text-emerald-400 flex items-center justify-between">
                <span>🌙 საღამოს შეჯამება</span>
                <span className="text-[10px] text-neutral-500 font-mono">რეფლექსია</span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">შედეგების დაფიქსირება და დასკვნები დღის ჩაკეტვამდე</div>
            </button>
          </div>
        </div>

        {/* Live Conversation Stream */}
        <div className="p-4 flex-1 overflow-y-auto max-h-48 space-y-3 bg-neutral-950/30">
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 border-b border-neutral-800/50 pb-1.5">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" />
              ცოცხალი დიალოგი
            </span>
            <span>გამართული ქართული & ინგლისური</span>
          </div>

          {transcript.length === 0 ? (
            <div className="text-center py-6 text-xs text-neutral-500 italic">
              ისაუბრეთ მიკროფონში ან აირჩიეთ თემა ზემოთ სპარინგის დასაწყებად.
            </div>
          ) : (
            transcript.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col text-xs ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 mb-0.5 font-mono">
                  <span>{msg.role === 'user' ? 'თქვენ' : 'Chief of Staff'}</span>
                  <span>•</span>
                  <span>{msg.time}</span>
                </div>
                <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-neutral-800 text-neutral-100 rounded-tr-sm border border-neutral-700' 
                    : 'bg-emerald-950/40 text-emerald-100 rounded-tl-sm border border-emerald-500/30'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <div className="text-[11px] text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>ორმხრივი აუდიო ნაკადი (16kHz in / 24kHz out)</span>
          </div>
          <button
            onClick={() => {
              stopSession();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition cursor-pointer"
          >
            სესიის დასრულება
          </button>
        </div>

      </div>
    </div>
  );
}
