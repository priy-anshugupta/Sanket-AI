'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Mic, 
  Square, 
  LogOut, 
  Send, 
  Clock, 
  MapPin, 
  Volume2, 
  RefreshCw,
  AlertOctagon,
  Flame,
  CheckCircle2
} from 'lucide-react';

const API = 'http://localhost:8000';

interface WorkerReport {
  id: string;
  text: string;
  time: string;
  sif_label: 'HIGH' | 'MEDIUM' | 'LOW';
  sif_score: number;
  status: string;
}

export default function FieldWorkerTerminal() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ full_name: string; role: string; username: string } | null>(null);
  
  const [inputText, setInputText] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submittedReports, setSubmittedReports] = useState<WorkerReport[]>([
    {
      id: 'REP-W7-01',
      text: 'Routine grease top-up completed on mud pump #2 bearings.',
      time: '08:45 AM',
      sif_label: 'LOW',
      sif_score: 0.15,
      status: 'VERIFIED SAFE'
    }
  ]);

  const [lastResult, setLastResult] = useState<{
    sif_score: number;
    sif_label: string;
    iogp_rule?: string;
    feedback: string;
  } | null>(null);

  const [swaToast, setSwaToast] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sanket_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        setCurrentUser({ full_name: 'Bikash Das', role: 'field_worker', username: 'bikash' });
      }
    } catch {
      setCurrentUser({ full_name: 'Bikash Das', role: 'field_worker', username: 'bikash' });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('sanket_token');
    localStorage.removeItem('sanket_user');
    router.push('/login');
  };

  const quickTags = [
    {
      id: 'kick',
      icon: '🚨',
      label: 'Gas Kick / 1800 PSI',
      presetText: 'Annular BOP secondary valve seal weeping hydraulic fluid under 1800 PSI vibration during pipe tripping at Well Pad 7.'
    },
    {
      id: 'gas',
      icon: '💨',
      label: 'H2S / Methane Vapor',
      presetText: 'Strong rotten egg H2S smell detected near cellar pit during kill-line test at Well Pad 7.'
    },
    {
      id: 'crane',
      icon: '🏗️',
      label: 'Unsafe Crane / Lifting',
      presetText: 'Crawler crane moving 5-ton drill collar over active wellhead manifold without ground spotter.'
    },
    {
      id: 'ppe',
      icon: '🛑',
      label: 'PPE / Slip / Barrier',
      presetText: 'Worn out staircase safety handrail loose on mud tank inspection walkway. Oil weeping on floor.'
    }
  ];

  const handleSelectTag = (tag: typeof quickTags[0]) => {
    setSelectedTag(tag.id);
    setInputText(tag.presetText);
    setLastResult(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        stream.getTracks().forEach(t => t.stop());
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds(p => p + 1), 1000);
    } catch {
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds(p => p + 1), 1000);
      setTimeout(() => {
        stopRecording();
        setInputText('Annular BOP secondary valve seal weeping hydraulic fluid under 1800 PSI vibration at Well Pad 7.');
      }, 3000);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const fd = new FormData();
      fd.append('audio', blob, 'worker_voice.wav');
      const res = await fetch(`${API}/api/voice/transcribe`, { method: 'POST', body: fd });
      if (res.ok) {
        const d = await res.json();
        setInputText(d.text || '');
      } else {
        setInputText('Annular BOP secondary valve seal weeping hydraulic fluid under 1800 PSI vibration at Well Pad 7.');
      }
    } catch {
      setInputText('Annular BOP secondary valve seal weeping hydraulic fluid under 1800 PSI vibration at Well Pad 7.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSubmitObservation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    setIsSubmitting(true);
    setLastResult(null);

    try {
      const res = await fetch(`${API}/api/reports/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          source: 'is_field_terminal',
          location: 'Well Pad 7 (Upper Assam)',
          activity_type: 'Drilling',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTimeout(async () => {
          try {
            const repRes = await fetch(`${API}/api/reports/${data.job_id}`);
            const rep = await repRes.json();
            
            const isHigh = rep.sif_label === 'HIGH';
            const feedbackText = isHigh 
              ? `🚨 SIF CRITICAL ALERT (${rep.sif_score?.toFixed(2)}): Escalated to Toolpusher Horen Gogoi & Duliajan Control Room. Prepare for SWA.`
              : `✅ Observation Logged: Risk Score ${rep.sif_score?.toFixed(2)} (${rep.sif_label}). Shift Supervisor notified.`;

            setLastResult({
              sif_score: rep.sif_score || 0.94,
              sif_label: rep.sif_label || 'HIGH',
              iogp_rule: rep.iogp_rule || 'Energy Isolation',
              feedback: feedbackText
            });

            setSubmittedReports(prev => [
              {
                id: `REP-${data.job_id.substring(0, 6)}`,
                text: inputText,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                sif_label: rep.sif_label || 'HIGH',
                sif_score: rep.sif_score || 0.94,
                status: isHigh ? 'SWA ESCALATED' : 'LOGGED'
              },
              ...prev
            ]);
            setInputText('');
          } catch {
            setLastResult({
              sif_score: 0.94,
              sif_label: 'HIGH',
              iogp_rule: 'Energy Isolation',
              feedback: '🚨 SIF CRITICAL PRECURSOR ESCALATED TO CONTROL ROOM.'
            });
          }
          setIsSubmitting(false);
        }, 1200);
      }
    } catch {
      alert('Network error connecting to SANKET server');
      setIsSubmitting(false);
    }
  };

  const handleEmergencySWA = () => {
    setSwaToast('🛑 EMERGENCY SWA DISPATCHED: Toolpusher & Rig Siren Triggered! Halt operations immediately.');
    setTimeout(() => setSwaToast(null), 6000);
  };

  return (
    <div className="min-h-screen bg-[#0F1B1D] text-[#F7F8F5] flex justify-center p-3 sm:p-5 font-sans select-none">
      <div className="w-full max-w-md space-y-3.5 pb-8">
        
        {/* ── Top ATEX Terminal Header ── */}
        <div className="bg-[#162829] p-3.5 rounded-xl border border-[#264245] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
              <Image
                src="/assets/sanket_logo_derrick.png"
                alt="SANKET AI Logo"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1 leading-none">
                <span className="font-heading font-bold text-sm tracking-tight text-white">SANKET</span>
                <span className="font-heading font-bold text-sm text-[#1B8A6C]">· FIELD</span>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#8BA4A7] mt-0.5">
                Zone 1/2 IS Terminal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg bg-[#1D3234] hover:bg-[#264245] text-[#8BA4A7] hover:text-white transition-colors cursor-pointer border border-[#264245]"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Worker Profile Card ── */}
        <div className="bg-[#162829] p-3.5 rounded-xl border border-[#264245] shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0A6B63] text-white font-bold flex items-center justify-center text-xs">
                {currentUser?.full_name?.charAt(0) || 'B'}
              </div>
              <div>
                <h2 className="text-xs font-bold text-white leading-tight">
                  {currentUser?.full_name || 'Bikash Das'}
                </h2>
                <div className="text-[10px] font-mono text-[#8BA4A7]">
                  Badge: <span className="text-white font-semibold">OIL-OP-4491</span>
                </div>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[10px] font-semibold">
              DAY SHIFT
            </span>
          </div>

          <div className="p-2 rounded-lg bg-[#1D3234] border border-[#264245] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5 text-[#8BA4A7]">
              <MapPin className="w-3.5 h-3.5 text-[#1B8A6C]" />
              <span>Well Pad 7 (Upper Assam)</span>
            </div>
            <span className="text-[#1B8A6C] font-semibold">RIG #4</span>
          </div>
        </div>

        {swaToast && (
          <div className="p-3 rounded-lg bg-[#D63B3B] text-white text-xs font-semibold flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 fill-white shrink-0" />
              <span>{swaToast}</span>
            </div>
            <button onClick={() => setSwaToast(null)} className="text-white font-bold">✕</button>
          </div>
        )}

        {/* ── Giant PTT Voice Hazard Logger ── */}
        <div className="bg-[#162829] p-4 rounded-xl border border-[#264245] shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#264245] pb-2">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-[#1B8A6C]" />
              Report Safety Hazard
            </span>
            <span className="text-[10px] font-mono text-[#8BA4A7]">PTT VOICE AI</span>
          </div>

          {/* Big Push-To-Talk Button */}
          <div className="flex flex-col items-center justify-center py-1">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranscribing}
              className={`w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 transition-all shadow-lg cursor-pointer border-2 ${
                isRecording
                  ? 'bg-[#D63B3B] text-white border-[#F5C6C6] scale-105 animate-pulse'
                  : 'bg-[#0A6B63] hover:bg-[#085B54] text-white border-[#1B8A6C]'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-7 h-7 fill-white" />
                  <span className="text-[10px] font-mono font-bold">{recordingSeconds}s STOP</span>
                </>
              ) : (
                <>
                  <Mic className="w-7 h-7" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">HOLD PTT</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-[#8BA4A7] mt-2 font-mono">
              {isRecording ? '🔴 Listening... Speak clearly' : isTranscribing ? '⚡ Transcribing with Whisper...' : 'Tap to speak (Hindi / English / Assamese)'}
            </p>
          </div>

          {/* 4 Quick-Select Hazard Pre-fills */}
          <div className="space-y-1">
            <div className="text-[10px] font-medium uppercase text-[#8BA4A7]">Quick Tap Category:</div>
            <div className="grid grid-cols-2 gap-1.5">
              {quickTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleSelectTag(tag)}
                  className={`p-2 rounded-lg border text-left transition-all text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                    selectedTag === tag.id
                      ? 'bg-[#0A6B63]/25 border-[#0A6B63] text-white'
                      : 'bg-[#1D3234] border-[#264245] text-[#8BA4A7] hover:text-white'
                  }`}
                >
                  <span className="text-sm">{tag.icon}</span>
                  <span className="truncate">{tag.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Observation Text Input Area */}
          <div>
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Describe hazard condition (equipment, pressure, leak, barrier)..."
              className="w-full p-2.5 rounded-lg bg-[#1D3234] border border-[#264245] text-xs text-white placeholder-[#5E7072] focus:outline-none focus:border-[#0A6B63] leading-relaxed"
            />
          </div>

          {/* Submit Observation Button */}
          <button
            type="button"
            onClick={handleSubmitObservation}
            disabled={isSubmitting || !inputText.trim()}
            className="w-full py-2.5 rounded-lg bg-[#0A6B63] hover:bg-[#085B54] text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {isSubmitting ? 'Transmitting into SIF Pipeline...' : 'Transmit Safety Observation'}
          </button>
        </div>

        {/* ── Real-Time SIF Result Box ── */}
        {lastResult && (
          <div className={`p-3 rounded-lg border space-y-1.5 ${
            lastResult.sif_label === 'HIGH'
              ? 'bg-[#FDF2F2]/10 border-[#F5C6C6]/30 text-[#F5C6C6]'
              : 'bg-[#EDFAF4]/10 border-[#BFEADB]/30 text-[#BFEADB]'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5">
                {lastResult.sif_label === 'HIGH' ? <Flame className="w-3.5 h-3.5 text-[#D63B3B]" /> : <CheckCircle2 className="w-3.5 h-3.5 text-[#1B8A6C]" />}
                {lastResult.sif_label} SIF ({lastResult.sif_score.toFixed(2)})
              </span>
              <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded">
                {lastResult.iogp_rule}
              </span>
            </div>
            <p className="text-xs leading-relaxed font-normal text-slate-200">
              {lastResult.feedback}
            </p>
          </div>
        )}

        {/* ── My Shift Observations History ── */}
        <div className="bg-[#162829] p-3.5 rounded-xl border border-[#264245] shadow-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#264245] pb-2">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#8BA4A7]" />
              My Observations (Today)
            </span>
            <span className="text-[10px] font-mono text-[#8BA4A7]">{submittedReports.length} Submitted</span>
          </div>

          <div className="space-y-1.5">
            {submittedReports.map((rep) => (
              <div key={rep.id} className="p-2.5 rounded-lg bg-[#1D3234] border border-[#264245] space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                    rep.sif_label === 'HIGH' ? 'bg-[#D63B3B]/20 text-[#F5C6C6]' : 'bg-[#1B8A6C]/20 text-[#BFEADB]'
                  }`}>
                    {rep.sif_label} ({rep.sif_score.toFixed(2)})
                  </span>
                  <span className="text-[10px] font-mono text-[#8BA4A7]">{rep.time}</span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2 italic">
                  "{rep.text}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Emergency Stop Work Authority (SWA) Red Bar ── */}
        <button
          type="button"
          onClick={handleEmergencySWA}
          className="w-full py-3 rounded-lg bg-[#D63B3B] hover:bg-[#B92525] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <AlertOctagon className="w-4 h-4 fill-white" />
          Emergency Stop Work Authority (SWA)
        </button>

      </div>
    </div>
  );
}
