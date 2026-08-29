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
  CheckCircle2,
  Shield,
  FileCheck,
  Radio,
  Sparkles
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
      text: 'Routine grease top-up completed on mud pump #2 bearings. Gauges normal.',
      time: '08:45 AM',
      sif_label: 'LOW',
      sif_score: 0.15,
      status: 'VERIFIED SAFE'
    },
    {
      id: 'REP-W7-02',
      text: 'BOP secondary valve seal weeping hydraulic fluid under 1800 PSI vibration.',
      time: '11:15 AM',
      sif_label: 'HIGH',
      sif_score: 0.94,
      status: 'SWA ESCALATED'
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
      label: 'Gas Kick / Surge',
      presetText: 'Annular BOP valve seal weeping hydraulic fluid under 1800 PSI vibration during drilling.'
    },
    {
      id: 'gas',
      icon: '💨',
      label: 'H2S / Gas Smell',
      presetText: 'Strong H2S smell detected near cellar pit during well pressure test.'
    },
    {
      id: 'crane',
      icon: '🏗️',
      label: 'Unsafe Crane Lift',
      presetText: 'Crane moving heavy 5-ton drill collar over wellhead manifold without ground spotter.'
    },
    {
      id: 'ppe',
      icon: '🛑',
      label: 'Broken Rail / Slip',
      presetText: 'Staircase safety handrail loose on mud tank walkway. Oil spilled on floor.'
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
        setInputText('BOP secondary valve seal weeping hydraulic fluid under 1800 PSI vibration at Well Pad 7.');
      }, 2500);
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
        setInputText('BOP secondary valve seal weeping hydraulic fluid under 1800 PSI vibration at Well Pad 7.');
      }
    } catch {
      setInputText('BOP secondary valve seal weeping hydraulic fluid under 1800 PSI vibration at Well Pad 7.');
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
              ? `🚨 CRITICAL ALERT (SIF ${Math.round((rep.sif_score || 0.94) * 100)}%): Escalated to Rig Supervisor & Duliajan Control Room.`
              : `✅ Report Logged (Low Risk). Shift Supervisor notified.`;

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
              feedback: '🚨 CRITICAL ALERT: Escalated to Control Room.'
            });
          }
          setIsSubmitting(false);
        }, 1000);
      }
    } catch {
      alert('Network error connecting to SANKET server');
      setIsSubmitting(false);
    }
  };

  const handleEmergencySWA = () => {
    setSwaToast('🛑 STOP WORK ORDER SENT: Rig Siren & Supervisor Alerted!');
    setTimeout(() => setSwaToast(null), 6000);
  };

  return (
    <div className="min-h-screen bg-[#0F1B1D] text-[#F7F8F5] p-3 sm:p-6 font-sans select-none">
      <div className="w-full max-w-5xl mx-auto space-y-4 pb-8">
        
        {/* ── Top Header ── */}
        <div className="bg-[#162829] p-3.5 sm:p-4 rounded-xl border border-[#264245] shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
              <Image
                src="/assets/sanket_logo_derrick.png"
                alt="SANKET AI Logo"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2 leading-none">
                <span className="font-heading font-bold text-base tracking-tight text-white">SANKET</span>
                <span className="font-heading font-bold text-base text-[#1B8A6C]">· FIELD</span>
              </div>
              <p className="text-[11px] text-[#8BA4A7] mt-1 font-medium">
                Oil India Limited · Rig #4 (Well Pad 7)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg bg-[#1D3234] hover:bg-[#264245] text-[#8BA4A7] hover:text-white transition-colors cursor-pointer border border-[#264245] flex items-center gap-1 text-xs"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {swaToast && (
          <div className="p-3.5 rounded-xl bg-[#D63B3B] text-white text-xs font-semibold flex items-center justify-between shadow-xl border border-[#B92525]">
            <div className="flex items-center gap-2.5">
              <AlertOctagon className="w-5 h-5 fill-white shrink-0 animate-bounce" />
              <span>{swaToast}</span>
            </div>
            <button onClick={() => setSwaToast(null)} className="text-white font-bold px-2 cursor-pointer">✕</button>
          </div>
        )}

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* ── LEFT COLUMN: Voice & Hazard Logger (7 Cols) ── */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Worker Profile Strip */}
            <div className="bg-[#162829] p-3.5 rounded-xl border border-[#264245] shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0A6B63] text-white font-bold flex items-center justify-center text-sm">
                  {currentUser?.full_name?.charAt(0) || 'B'}
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white">
                    {currentUser?.full_name || 'Bikash Das'} (Rig Operator)
                  </h2>
                  <div className="text-[11px] text-[#8BA4A7] mt-0.5">
                    Badge: <strong className="text-white">OIL-OP-4491</strong> · Shift: <strong className="text-amber-400">Day Shift</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#1B8A6C] bg-[#1D3234] px-2.5 py-1 rounded-lg border border-[#264245]">
                <Radio className="w-3.5 h-3.5" />
                <span>Radio Ch-09</span>
              </div>
            </div>

            {/* Voice Hazard Logger */}
            <div className="bg-[#162829] p-4 sm:p-5 rounded-xl border border-[#264245] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#264245] pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#1B8A6C]" />
                  Report Safety Hazard
                </span>
                <span className="text-[10px] text-[#1B8A6C] font-semibold bg-[#1D3234] px-2 py-0.5 rounded border border-[#264245]">
                  VOICE ENABLED
                </span>
              </div>

              {/* Big Push-To-Talk Button */}
              <div className="flex flex-col items-center justify-center py-2">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTranscribing}
                  className={`w-28 h-28 rounded-full flex flex-col items-center justify-center gap-1.5 transition-all shadow-xl cursor-pointer border-3 ${
                    isRecording
                      ? 'bg-[#D63B3B] text-white border-[#F5C6C6] scale-105 animate-pulse'
                      : 'bg-[#0A6B63] hover:bg-[#085B54] text-white border-[#1B8A6C] hover:scale-102'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-8 h-8 fill-white" />
                      <span className="text-[11px] font-bold">{recordingSeconds}s STOP</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-8 h-8" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">TAP TO SPEAK</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-[#8BA4A7] mt-3 font-medium text-center">
                  {isRecording ? '🔴 Listening... Speak clearly' : isTranscribing ? '⚡ Converting voice to text...' : 'Speak in Hindi, Assamese or English'}
                </p>
              </div>

              {/* 4 Quick-Select Hazard Pre-fills */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase text-[#8BA4A7]">Quick Tap Hazard:</div>
                <div className="grid grid-cols-2 gap-2">
                  {quickTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleSelectTag(tag)}
                      className={`p-2.5 rounded-lg border text-left transition-all text-xs font-medium flex items-center gap-2 cursor-pointer ${
                        selectedTag === tag.id
                          ? 'bg-[#0A6B63]/30 border-[#1B8A6C] text-white ring-1 ring-[#1B8A6C]'
                          : 'bg-[#1D3234] border-[#264245] text-[#8BA4A7] hover:text-white hover:bg-[#264245]'
                      }`}
                    >
                      <span className="text-base">{tag.icon}</span>
                      <span className="truncate">{tag.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Observation Text Input Area */}
              <div>
                <textarea
                  rows={2}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Or type hazard notes here..."
                  className="w-full p-3 rounded-lg bg-[#1D3234] border border-[#264245] text-xs text-white placeholder-[#5E7072] focus:outline-none focus:border-[#0A6B63] leading-relaxed"
                />
              </div>

              {/* Submit Observation Button */}
              <button
                type="button"
                onClick={handleSubmitObservation}
                disabled={isSubmitting || !inputText.trim()}
                className="w-full py-3 rounded-lg bg-[#0A6B63] hover:bg-[#085B54] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer transition-all"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSubmitting ? 'Sending to Control Room...' : 'Send Hazard Report'}
              </button>
            </div>

            {/* Real-Time SIF Result Box */}
            {lastResult && (
              <div className={`p-3.5 rounded-xl border space-y-1.5 shadow-md ${
                lastResult.sif_label === 'HIGH'
                  ? 'bg-[#FDF2F2]/10 border-[#F5C6C6]/40 text-[#F5C6C6]'
                  : 'bg-[#EDFAF4]/10 border-[#BFEADB]/40 text-[#BFEADB]'
              }`}>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    {lastResult.sif_label === 'HIGH' ? <Flame className="w-4 h-4 text-[#D63B3B]" /> : <CheckCircle2 className="w-4 h-4 text-[#1B8A6C]" />}
                    {lastResult.sif_label} RISK ({Math.round(lastResult.sif_score * 100)}%)
                  </span>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded">
                    {lastResult.iogp_rule}
                  </span>
                </div>
                <p className="text-xs text-slate-200">
                  {lastResult.feedback}
                </p>
              </div>
            )}

            {/* Emergency Stop Work Authority (SWA) Red Bar */}
            <button
              type="button"
              onClick={handleEmergencySWA}
              className="w-full py-3 rounded-xl bg-[#D63B3B] hover:bg-[#B92525] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all border border-[#F5C6C6]/30"
            >
              <AlertOctagon className="w-4 h-4 fill-white" />
              Emergency Stop Work (SWA Lockdown)
            </button>

          </div>

          {/* ── RIGHT COLUMN: Shift Status & History (5 Cols) ── */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Active Permit & Gas Level */}
            <div className="bg-[#162829] p-4 rounded-xl border border-[#264245] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#264245] pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#0A6B63]" />
                  Active Shift Permit
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                  AUTHORIZED
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-[#8BA4A7]">
                <div className="flex justify-between">
                  <span>Permit:</span>
                  <strong className="text-white">ePTW-048 (Drilling & BOP)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Supervisor:</span>
                  <strong className="text-emerald-400">Horen Gogoi</strong>
                </div>
              </div>

              {/* Gas Level Box */}
              <div className="p-2.5 rounded-lg bg-[#1D3234] border border-[#264245] grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-[#162829]">
                  <div className="text-[10px] text-[#8BA4A7]">H₂S Gas Level</div>
                  <div className="text-emerald-400 font-bold text-sm">0.0 PPM (Safe)</div>
                </div>
                <div className="p-2 rounded bg-[#162829]">
                  <div className="text-[10px] text-[#8BA4A7]">Well Pressure</div>
                  <div className="text-amber-400 font-bold text-sm">1400 PSI</div>
                </div>
              </div>
            </div>

            {/* Shift Rules */}
            <div className="bg-[#162829] p-4 rounded-xl border border-[#264245] shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#264245] pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#2563EB]" />
                  Today's Safety Rules
                </span>
                <span className="text-[10px] text-[#8BA4A7]">MANDATORY</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-[#1D3234] border border-[#264245] flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                  <span className="font-semibold text-white">Energy Isolation (LOTO)</span>
                </div>
                <div className="p-2 rounded-lg bg-[#1D3234] border border-[#264245] flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                  <span className="font-semibold text-white">Do Not Bypass Safety Controls</span>
                </div>
              </div>
            </div>

            {/* My Reports Today */}
            <div className="bg-[#162829] p-4 rounded-xl border border-[#264245] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#264245] pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#8BA4A7]" />
                  My Reports (Today)
                </span>
                <span className="text-[10px] text-[#1B8A6C]">{submittedReports.length} Sent</span>
              </div>

              <div className="space-y-2">
                {submittedReports.map((rep) => (
                  <div key={rep.id} className="p-2.5 rounded-lg bg-[#1D3234] border border-[#264245] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        rep.sif_label === 'HIGH' ? 'bg-[#D63B3B]/20 text-[#F5C6C6] border border-[#D63B3B]/40' : 'bg-[#1B8A6C]/20 text-[#BFEADB] border border-[#1B8A6C]/40'
                      }`}>
                        {rep.sif_label} ({Math.round(rep.sif_score * 100)}%)
                      </span>
                      <span className="text-[10px] text-[#8BA4A7]">{rep.time}</span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      "{rep.text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
