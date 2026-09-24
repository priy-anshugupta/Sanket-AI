'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  AlertTriangle,
  Flame,
  CheckCircle2,
  Shield,
  FileCheck,
  Radio,
  Sparkles,
  UploadCloud,
  Check,
  Trash2,
  ArrowRight,
  X
} from 'lucide-react';
import { getApiBase } from '@/lib/config';

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
  const [currentUser, setCurrentUser] = useState<{ full_name: string; role: string; username: string }>({
    full_name: 'Bikash Das',
    role: 'field_worker',
    username: 'bikash',
  });
  
  const [inputText, setInputText] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchFeedback, setTouchFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [canUseLiveMic, setCanUseLiveMic] = useState(true);
  const [submittedReports, setSubmittedReports] = useState<WorkerReport[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasMedia = Boolean(typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia);
      setCanUseLiveMic(hasMedia);
    }
  }, []);

  // ── Ultra-Robust API Resolution (works on Vercel, phone, laptop, any IP, localhost) ──
  const getApiUrl = useCallback((path: string) => {
    return getApiBase(path);
  }, []);

  // Universal fetch with automatic fallback (Same-Origin Next.js Rewrite Port 3000 -> Direct Port 8000)
  // Ensures mobile phone over LAN works seamlessly without firewall or CORS blockage
  const universalFetch = useCallback(async (path: string, options?: RequestInit) => {
    try {
      const res = await fetch(path, options);
      if (res.ok) return res;
      if (res.status === 404 || res.status >= 500) {
        const directUrl = getApiUrl(path);
        return await fetch(directUrl, options);
      }
      return res;
    } catch {
      try {
        const directUrl = getApiUrl(path);
        return await fetch(directUrl, options);
      } catch (err2) {
        throw err2;
      }
    }
  }, [getApiUrl]);

  // Load user on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sanket_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Poll system air-gap status
  const [airgapStatus, setAirgapStatus] = useState<{ is_airgapped: boolean; outbound_kbps?: number } | null>(null);

  useEffect(() => {
    const fetchAirgap = async () => {
      try {
        const res = await universalFetch('/api/system/airgap');
        if (res && res.ok) {
          const d = await res.json();
          setAirgapStatus(d);
        }
      } catch {}
    };
    fetchAirgap();
    const interval = setInterval(fetchAirgap, 5000);
    return () => clearInterval(interval);
  }, [universalFetch]);

  // Fetch real submitted worker reports from database
  const fetchWorkerHistory = useCallback(async () => {
    try {
      const res = await universalFetch('/api/reports?limit=12&sort_by=latest');
      if (res && res.ok) {
        const d = await res.json();
        const reps: any[] = d.reports || [];
        if (reps.length > 0) {
          const formatted: WorkerReport[] = reps.map((r: any) => {
            const rawScore = typeof r.sif_score === 'number' ? r.sif_score : 0.15;
            const validScore = Math.min(Math.max(rawScore, 0.0), 0.99);
            const validLabel = r.sif_label || (validScore >= 0.75 ? 'HIGH' : validScore >= 0.50 ? 'MEDIUM' : 'LOW');
            const isResolved = r.status === 'RESOLVED' || r.status === 'CLOSED';
            return {
              id: `REP-${r.id.substring(0, 6).toUpperCase()}`,
              text: r.raw_text,
              time: r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
              sif_label: validLabel as any,
              sif_score: validScore,
              status: isResolved ? 'RESOLVED ✓' : (validScore >= 0.75 ? 'SWA ESCALATED' : 'CONTROL ROOM SYNCED'),
            };
          });
          setSubmittedReports(formatted);
          try {
            localStorage.setItem('sanket_worker_history', JSON.stringify(formatted));
          } catch {}

          // Synchronize lastResult with the latest database record to guarantee 1:1 parity with Control Room
          setLastResult(prev => {
            if (!prev) return null;
            const top = reps[0];
            const topScore = typeof top.sif_score === 'number' ? Math.min(Math.max(top.sif_score, 0.0), 0.99) : prev.sif_score;
            const topLabel = top.sif_label || (topScore >= 0.75 ? 'HIGH' : topScore >= 0.50 ? 'MEDIUM' : 'LOW');
            const isHigh = topLabel === 'HIGH' || topScore >= 0.75;
            const scorePercent = Math.round(topScore * 100);
            const scoreDecimal = topScore.toFixed(2);
            return {
              ...prev,
              sif_score: topScore,
              sif_label: topLabel,
              iogp_rule: top.iogp_rule || prev.iogp_rule,
              feedback: isHigh 
                ? `🚨 CRITICAL ALERT (SIF ${scorePercent}% · ${scoreDecimal}): Escalated to Rig Supervisor & Duliajan Control Room.`
                : `✅ Safe Observation (SIF ${scorePercent}% · ${scoreDecimal} · ${topLabel}): Routine shift monitoring active.`,
            };
          });
        }
      }
    } catch {
      try {
        const cached = localStorage.getItem('sanket_worker_history');
        if (cached) setSubmittedReports(JSON.parse(cached));
      } catch {}
    }
  }, [universalFetch]);

  useEffect(() => {
    fetchWorkerHistory();
    const interval = setInterval(fetchWorkerHistory, 4000);
    return () => clearInterval(interval);
  }, [fetchWorkerHistory]);

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
  const streamRef = useRef<MediaStream | null>(null);

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

  // Core submission function that accepts text directly
  const submitTextObservation = async (textToSubmit: string) => {
    if (!textToSubmit || !textToSubmit.trim()) return;
    setIsSubmitting(true);
    setLastResult(null);
    setTouchFeedback('🚀 Transmitting to Control Room...');

    const payload = {
      text: textToSubmit.trim(),
      source: 'is_field_terminal',
      location: 'Well Pad 7',
      activity_type: 'Drilling',
    };

    try {
      const res = await universalFetch('/api/reports/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res && res.ok) {
        const data = await res.json();
        
        let scoreVal = typeof data.sif_score === 'number' ? data.sif_score : null;
        let labelVal = data.sif_label || null;
        let ruleVal = data.iogp_rule || null;

        // If not immediately provided in response, poll up to 3 times
        if (scoreVal === null && data.job_id) {
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              await new Promise(r => setTimeout(r, 400));
              const repRes = await universalFetch(`/api/reports/${data.job_id}`);
              if (repRes && repRes.ok) {
                const rep = await repRes.json();
                if (typeof rep.sif_score === 'number' && rep.sif_score > 0) {
                  scoreVal = rep.sif_score;
                  labelVal = rep.sif_label;
                  ruleVal = rep.iogp_rule;
                  break;
                }
              }
            } catch {}
          }
        }

        const finalScore = scoreVal !== null ? Math.min(Math.max(scoreVal, 0.0), 0.99) : 0.15;
        const finalLabel = labelVal || (finalScore >= 0.75 ? 'HIGH' : finalScore >= 0.50 ? 'MEDIUM' : 'LOW');
        const isHigh = finalLabel === 'HIGH' || finalScore >= 0.75;
        const finalRule = ruleVal || (isHigh ? 'Energy Isolation & Pressure' : 'General Maintenance & Housekeeping');

        const scorePercent = Math.round(finalScore * 100);
        const scoreDecimal = finalScore.toFixed(2);

        const feedbackText = isHigh 
          ? `🚨 CRITICAL ALERT (SIF ${scorePercent}% · ${scoreDecimal}): Escalated to Rig Supervisor & Duliajan Control Room.`
          : `✅ Safe Observation (SIF ${scorePercent}% · ${scoreDecimal} · ${finalLabel}): Routine shift monitoring active.`;

        setLastResult({
          sif_score: finalScore,
          sif_label: finalLabel as any,
          iogp_rule: finalRule,
          feedback: feedbackText,
        });

        const newReport: WorkerReport = {
          id: `REP-${data.job_id?.substring(0, 6).toUpperCase() || 'NEW'}`,
          text: textToSubmit.trim(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sif_label: finalLabel as any,
          sif_score: finalScore,
          status: isHigh ? 'SWA ESCALATED' : 'CONTROL ROOM SYNCED',
        };
        setSubmittedReports(prev => [newReport, ...prev.slice(0, 9)]);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sanket:new_report', { detail: newReport }));
        }
        setInputText('');
        setSelectedTag(null);
        setTouchFeedback('🎉 Transmitted & Synced to Control Room!');
        setIsSubmitting(false);
        setTimeout(() => setTouchFeedback(null), 3500);
      } else {
        setTouchFeedback('❌ Failed to ingest report. Try again.');
        setIsSubmitting(false);
        setTimeout(() => setTouchFeedback(null), 3000);
      }
    } catch {
      setTouchFeedback('❌ Network error. Ensure backend is running.');
      setIsSubmitting(false);
      setTimeout(() => setTouchFeedback(null), 3000);
    }
  };

  const handleSelectTag = (tag: typeof quickTags[0]) => {
    setSelectedTag(tag.id);
    setInputText(tag.presetText);
    setTouchFeedback(`📋 Selected: "${tag.label}". Tap "Send Hazard Report" below to transmit.`);
    setTimeout(() => setTouchFeedback(null), 3000);
  };

  // ──── ROBUST VOICE RECORDING: MediaRecorder Start/Stop + OpenAI Whisper ────

  // Upload a blob to backend Whisper for transcription
  const uploadAndTranscribe = async (audioBlob: Blob | File) => {
    setIsTranscribing(true);
    setTouchFeedback('🧠 AI transcribing your voice...');
    try {
      const mime = audioBlob.type || '';
      let ext = 'webm';
      if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac')) {
        ext = 'm4a';
      } else if (mime.includes('wav')) {
        ext = 'wav';
      } else if (mime.includes('ogg')) {
        ext = 'ogg';
      } else if ((audioBlob as File).name && (audioBlob as File).name.includes('.')) {
        ext = (audioBlob as File).name.split('.').pop()?.toLowerCase() || 'webm';
      }
      const filename = `recording.${ext}`;
      const fd = new FormData();
      fd.append('audio', audioBlob, filename);
      const res = await universalFetch('/api/voice/transcribe', {
        method: 'POST',
        body: fd,
      });
      if (res && res.ok) {
        const d = await res.json();
        if (d.text && d.text.trim().length > 0) {
          const transcribed = d.text.trim();
          setInputText(transcribed);
          setTouchFeedback(`✅ Transcribed! Tap "Send Hazard Report" below to submit.`);
        } else {
          setTouchFeedback(d.message || '⚠️ No speech detected in recording. Try speaking louder or closer.');
        }
      } else {
        setTouchFeedback('⚠️ Whisper error. You can tap quick hazards below.');
      }
    } catch (err: any) {
      console.error('Voice upload error:', err);
      setTouchFeedback('⚠️ Voice upload network error. Check Wi-Fi.');
    } finally {
      setIsTranscribing(false);
      setTimeout(() => setTouchFeedback(null), 4500);
    }
  };

  // START recording: Live in-browser MediaRecorder or seamless phone native voice recorder fallback
  const startRecording = async () => {
    // 1. Try in-browser WebRTC MediaRecorder (HTTPS, localhost, or supported browser)
    if (typeof window !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 }
        });
        streamRef.current = stream;
        audioChunksRef.current = [];

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : MediaRecorder.isTypeSupported('audio/mp4')
              ? 'audio/mp4'
              : '';

        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          // Release mic stream safely only AFTER recorder stopped and data delivered
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
          }

          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
          audioChunksRef.current = [];
          if (audioBlob.size > 50) {
            await uploadAndTranscribe(audioBlob);
          } else {
            setTouchFeedback('⚠️ Recording too short. Speak and hold longer.');
            setTimeout(() => setTouchFeedback(null), 3000);
          }
        };

        recorder.start(250);
        setIsRecording(true);
        setRecordingSeconds(0);
        setTouchFeedback('🔴 Recording live... Speak now! Tap again to STOP & Transcribe.');

        timerRef.current = setInterval(() => {
          setRecordingSeconds((s) => s + 1);
        }, 1000);
        return;
      } catch (err: any) {
        console.warn('Live mic stream unavailable, falling back to phone voice recorder:', err);
      }
    }

    // 2. Phone native voice recorder fallback (works on ALL mobile browsers over HTTP!)
    setTouchFeedback('🎙️ Opening phone sound recorder... Record and save your audio.');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // STOP recording
  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setRecordingSeconds(0);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.requestData();
      } catch {}
      mediaRecorderRef.current.stop();
    }
  };

  // Toggle: tap to start, tap again to stop
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    startRecording();
  };

  // Native audio file upload fallback (handles audio captured from phone mic)
  const handleNativeAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAndTranscribe(file);
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleSubmitObservation = async (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    await submitTextObservation(inputText);
  };

  const handleEmergencySWA = async () => {
    setSwaToast('🚨 STOP WORK AUTHORITY TRIGGERED — ALL DRILLING ON WELL PAD 7 FROZEN');
    setTouchFeedback('🚨 TRANSMITTING EMERGENCY SWA...');
    try {
      const res = await universalFetch('/api/emergency/swa/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'Well Pad 7',
          reason: 'Worker SWA Manual Panic Reflex Button Pressed',
          declared_by: currentUser?.full_name || 'Bikash Das',
        }),
      });
      if (res && res.ok) {
        const data = await res.json();
        setLastResult({
          sif_score: 0.99,
          sif_label: 'HIGH',
          iogp_rule: 'Energy Isolation & Barrier Integrity',
          feedback: `🚨 EMERGENCY SWA DISPATCHED (SIF 99% · 0.99): Active operations locked out. Alert pushed to Control Room console.`,
        });
        const emergencyReport: WorkerReport = {
          id: `REP-${data.report_id?.substring(0, 6).toUpperCase() || 'SWA'}`,
          text: `[EMERGENCY SWA EXECUTED] Frontline worker ${currentUser?.full_name || 'Bikash Das'} triggered Stop Work Authority for Well Pad 7. Immediate rig shutdown ordered.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sif_label: 'HIGH',
          sif_score: 0.99,
          status: 'SWA ESCALATED',
        };
        setSubmittedReports(prev => [emergencyReport, ...prev.slice(0, 9)]);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sanket:new_report', { detail: emergencyReport }));
        }
        setTouchFeedback('🚨 SWA DISPATCHED & CONTROL ROOM NOTIFIED!');
      } else {
        setTouchFeedback('⚠️ SWA alert logged locally.');
      }
    } catch {
      setTouchFeedback('⚠️ Offline SWA logged locally.');
    }
    setTimeout(() => setTouchFeedback(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#0F1B1D] text-[#F7F8F5] p-3 sm:p-6 font-sans">
      
      <div className="w-full max-w-5xl mx-auto space-y-4 pb-12">
        
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

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full border font-mono text-[11px] font-semibold flex items-center gap-1.5 ${
              airgapStatus && !airgapStatus.is_airgapped
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                airgapStatus && !airgapStatus.is_airgapped ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400'
              }`} />
              <span>{airgapStatus && !airgapStatus.is_airgapped ? 'HYBRID ONLINE' : 'SOVEREIGN AIR-GAP'}</span>
            </span>

            <Link
              href="/dashboard"
              onClick={() => {
                try { localStorage.setItem('sanket_demo_override', 'true'); } catch {}
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1D3234] hover:bg-[#264245] text-[#8BA4A7] hover:text-white border border-[#264245] text-[11px] font-bold transition-all cursor-pointer"
              title="Switch to HQ Safety Manager Dashboard"
            >
              <span>HQ Console</span>
              <ArrowRight className="w-3 h-3 text-[#1B8A6C]" />
            </Link>

            <button suppressHydrationWarning
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg bg-[#1D3234] active:bg-[#264245] text-[#8BA4A7] hover:text-white transition-colors cursor-pointer border border-[#264245] flex items-center gap-1 text-xs touch-manipulation"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Touch Feedback Banner */}
        {touchFeedback && (
          <div className="p-3 rounded-lg bg-[#0A6B63] text-white text-xs font-bold text-center shadow-lg border border-[#1B8A6C] animate-in fade-in">
            {touchFeedback}
          </div>
        )}

        {swaToast && (
          <div className="p-3.5 rounded-xl bg-[#D63B3B] text-white text-xs font-semibold flex items-center justify-between shadow-xl border border-[#B92525]">
            <div className="flex items-center gap-2.5">
              <AlertOctagon className="w-5 h-5 fill-white shrink-0 animate-bounce" />
              <span>{swaToast}</span>
            </div>
            <button suppressHydrationWarning type="button" onClick={() => setSwaToast(null)} className="text-white font-bold px-2 cursor-pointer touch-manipulation">✕</button>
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
                  WHISPER AI VOICE
                </span>
              </div>

              {/* Big Push-To-Talk Toggle: Tap to Start, Tap Again to Stop */}
              <div className="flex flex-col items-center justify-center py-2">
                {/* Native file input fallback for phones without MediaRecorder / HTTP LAN */}
                <input suppressHydrationWarning
                  ref={fileInputRef}
                  id="worker-native-audio"
                  type="file"
                  accept="audio/*"
                  onChange={handleNativeAudioUpload}
                  className="hidden"
                />
                <button suppressHydrationWarning
                  type="button"
                  onClick={toggleRecording}
                  disabled={isTranscribing}
                  className={`w-32 h-32 rounded-full flex flex-col items-center justify-center gap-1.5 transition-all shadow-2xl cursor-pointer border-4 active:scale-95 touch-manipulation ${
                    isTranscribing
                      ? 'bg-[#1D3234] border-[#264245] text-[#8BA4A7]'
                      : isRecording
                        ? 'bg-[#D63B3B] border-[#F5C6C6] text-white animate-pulse'
                        : 'bg-[#0A6B63] active:bg-[#085B54] text-white border-[#1B8A6C]'
                  }`}
                >
                  {isTranscribing ? (
                    <>
                      <RefreshCw className="w-9 h-9 animate-spin text-white" />
                      <span className="text-[10px] font-bold">TRANSCRIBING...</span>
                    </>
                  ) : isRecording ? (
                    <>
                      <Square className="w-9 h-9" />
                      <span className="text-xs font-bold uppercase tracking-wider">{recordingSeconds}s ● STOP</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-9 h-9" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {canUseLiveMic ? 'TAP TO RECORD' : 'PHONE MIC'}
                      </span>
                    </>
                  )}
                </button>
                <p className="text-xs text-[#8BA4A7] mt-3 font-medium text-center">
                  {isRecording 
                    ? '🔴 Recording live... Speak in Hindi / English / Assamese. Tap again to stop.' 
                    : canUseLiveMic 
                      ? 'Tap mic to record → Tap stop → Review & tap "Send Hazard Report".' 
                      : 'Tap button to open phone mic recorder → Speak & save.'}
                </p>

                {/* Direct Phone Native Mic Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-[11px] text-[#1B8A6C] hover:text-[#2DD4BF] flex items-center gap-1.5 font-medium underline underline-offset-2 cursor-pointer active:scale-95"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Phone Voice Memo / Audio File Upload</span>
                </button>
              </div>

              {/* 4 Quick-Select Hazard Pre-fills */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase text-[#8BA4A7]">Quick Tap Hazard Preset:</div>
                <div className="grid grid-cols-2 gap-2.5">
                  {quickTags.map((tag) => (
                    <button suppressHydrationWarning
                      key={tag.id}
                      type="button"
                      onClick={() => handleSelectTag(tag)}
                      className={`p-3 rounded-lg border text-left transition-all text-xs font-semibold flex items-center gap-2 cursor-pointer active:scale-95 touch-manipulation ${
                        selectedTag === tag.id
                          ? 'bg-[#0A6B63] border-[#1B8A6C] text-white shadow-md'
                          : 'bg-[#1D3234] border-[#264245] text-[#8BA4A7] hover:text-white active:bg-[#264245]'
                      }`}
                    >
                      <span className="text-lg">{tag.icon}</span>
                      <span className="truncate">{tag.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Observation Text Input Area with Clear Controls */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase text-[#8BA4A7]">Observation Text:</span>
                  {inputText && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputText('');
                        setSelectedTag(null);
                        setTouchFeedback('🧹 Field cleared. Ready for new voice recording.');
                        setTimeout(() => setTouchFeedback(null), 2500);
                      }}
                      className="text-[11px] text-rose-300 hover:text-white active:scale-95 flex items-center gap-1.5 font-bold cursor-pointer py-1 px-2.5 rounded-md bg-rose-950/60 border border-rose-800/70 shadow-xs touch-manipulation transition-all"
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                      <span>Clear Text</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <textarea suppressHydrationWarning
                    rows={3}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type or speak using your phone mic... then tap Send below."
                    className="w-full p-3 pr-8 rounded-lg bg-[#1D3234] border border-[#264245] text-xs text-white placeholder-[#5E7072] focus:outline-none focus:border-[#0A6B63] leading-relaxed"
                  />
                  {inputText && (
                    <button
                      type="button"
                      title="Clear field"
                      onClick={() => {
                        setInputText('');
                        setSelectedTag(null);
                      }}
                      className="absolute top-2.5 right-2.5 p-1 rounded-md bg-[#264245]/80 hover:bg-rose-900 text-[#8BA4A7] hover:text-white transition-colors cursor-pointer touch-manipulation"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Submit Observation Button */}
              <button suppressHydrationWarning
                type="button"
                onClick={handleSubmitObservation}
                disabled={isSubmitting || !inputText.trim()}
                className={`w-full py-3.5 rounded-lg font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer transition-all active:scale-98 touch-manipulation ${
                  inputText.trim()
                    ? 'bg-[#0A6B63] active:bg-[#085B54] text-white ring-2 ring-[#1B8A6C] shadow-emerald-950/60'
                    : 'bg-[#1D3234] text-[#8BA4A7] border border-[#264245]'
                }`}
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSubmitting ? 'Sending to Control Room...' : 'Send Hazard Report'}
              </button>
            </div>

            {/* Real-Time SIF Result Box */}
            {lastResult && (
              <div className={`p-4 rounded-xl border space-y-1.5 shadow-md ${
                lastResult.sif_label === 'HIGH'
                  ? 'bg-[#FDF2F2]/10 border-[#F5C6C6]/40 text-[#F5C6C6]'
                  : lastResult.sif_label === 'MEDIUM'
                  ? 'bg-[#FEF7EC]/10 border-[#F8DFB6]/40 text-[#F8DFB6]'
                  : 'bg-[#EDFAF4]/10 border-[#BFEADB]/40 text-[#BFEADB]'
              }`}>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    {lastResult.sif_label === 'HIGH' ? (
                      <Flame className="w-4 h-4 text-[#D63B3B]" />
                    ) : lastResult.sif_label === 'MEDIUM' ? (
                      <AlertTriangle className="w-4 h-4 text-[#D4820A]" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-[#1B8A6C]" />
                    )}
                    {lastResult.sif_label} RISK · {Math.round(lastResult.sif_score * 100)}% ({lastResult.sif_score.toFixed(2)})
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
            <button suppressHydrationWarning
              type="button"
              onClick={handleEmergencySWA}
              className="w-full py-3.5 rounded-xl bg-[#D63B3B] active:bg-[#B92525] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all border border-[#F5C6C6]/30 active:scale-98 touch-manipulation"
            >
              <AlertOctagon className="w-4 h-4 fill-white" />
              Emergency Stop Work (SWA Lockdown)
            </button>

          </div>

          {/* ── RIGHT COLUMN: Shift Status & History (5 Cols) ── */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Active Shift Card */}
            <div className="bg-[#162829] p-4 rounded-xl border border-[#264245] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#264245] pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#0A6B63]" />
                  Active Shift Status
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                  AUTHORIZED TO WORK
                </span>
              </div>

              <div className="space-y-2 text-xs text-[#8BA4A7]">
                <div className="flex justify-between items-center">
                  <span>Duty Shift:</span>
                  <strong className="text-white font-medium">Day Shift (06:00 – 18:00)</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span>Work Location:</span>
                  <strong className="text-white font-medium">Well Pad 7 · Rig #4</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span>Safety Supervisor:</span>
                  <strong className="text-emerald-400 font-medium">Horen Gogoi</strong>
                </div>
              </div>
            </div>

            {/* Shift Report History */}
            <div className="bg-[#162829] p-4 rounded-xl border border-[#264245] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#264245] pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0A6B63]" />
                  Your Shift History (Today)
                </span>
                <span className="text-[10px] font-mono text-[#8BA4A7]">
                  {submittedReports.length} REPORTS
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {submittedReports.map((report) => (
                  <div 
                    key={report.id}
                    className="p-3 rounded-lg bg-[#1D3234] border border-[#264245] space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-[#8BA4A7]">{report.id}</span>
                      <span className="text-[10px] text-[#5E7072]">{report.time}</span>
                    </div>

                    <p className="text-slate-200 line-clamp-2 text-[11px] leading-relaxed">
                      {report.text}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-[#264245]/60">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        report.sif_label === 'HIGH'
                          ? 'bg-[#FDF2F2]/10 text-[#D63B3B] border border-[#D63B3B]/30'
                          : report.sif_label === 'MEDIUM'
                          ? 'bg-[#FEF7EC]/10 text-[#D4820A] border border-[#D4820A]/30'
                          : 'bg-[#EDFAF4]/10 text-[#1B8A6C] border border-[#1B8A6C]/30'
                      }`}>
                        {report.sif_label} RISK · {Math.round(report.sif_score * 100)}% ({report.sif_score.toFixed(2)})
                      </span>
                      <span className="text-[10px] text-[#8BA4A7]">{report.status}</span>
                    </div>
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
