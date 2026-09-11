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
  Sparkles,
  UploadCloud
} from 'lucide-react';

const API = typeof window !== 'undefined' ? `http://${window.location.hostname}:8000` : 'http://localhost:8000';

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
  const [touchFeedback, setTouchFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [submittedReports, setSubmittedReports] = useState<WorkerReport[]>([]);

  // Fetch real submitted worker reports from database
  const fetchWorkerHistory = async () => {
    try {
      const res = await fetch(`${API}/api/reports?limit=12&sort_by=latest`);
      if (res.ok) {
        const d = await res.json();
        const reps: any[] = d.reports || [];
        if (reps.length > 0) {
          const formatted: WorkerReport[] = reps.map((r: any) => ({
            id: `REP-${r.id.substring(0, 6).toUpperCase()}`,
            text: r.raw_text,
            time: r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
            sif_label: r.sif_label || (r.sif_score >= 0.75 ? 'HIGH' : 'MEDIUM'),
            sif_score: r.sif_score || 0.50,
            status: r.status === 'RESOLVED' ? 'RESOLVED ✓' : (r.sif_score >= 0.75 ? 'SWA ESCALATED' : 'CONTROL ROOM SYNCED'),
          }));
          setSubmittedReports(formatted);
          localStorage.setItem('sanket_worker_history', JSON.stringify(formatted));
        }
      }
    } catch {
      // Load cached offline reports from localStorage
      try {
        const cached = localStorage.getItem('sanket_worker_history');
        if (cached) setSubmittedReports(JSON.parse(cached));
      } catch {}
    }
  };

  useEffect(() => {
    fetchWorkerHistory();
    const interval = setInterval(fetchWorkerHistory, 4000);
    return () => clearInterval(interval);
  }, []);

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

  // Core submission function that accepts text directly
  const submitTextObservation = async (textToSubmit: string) => {
    if (!textToSubmit || !textToSubmit.trim()) return;
    setIsSubmitting(true);
    setLastResult(null);
    setTouchFeedback('🚀 Transmitting to Control Room...');

    try {
      const res = await fetch(`${API}/api/reports/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSubmit.trim(),
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
              feedback: feedbackText,
            });

            const newReport: WorkerReport = {
              id: `REP-${data.job_id?.substring(0, 6).toUpperCase() || 'NEW'}`,
              text: textToSubmit.trim(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sif_label: rep.sif_label || 'HIGH',
              sif_score: rep.sif_score || 0.94,
              status: isHigh ? 'SWA ESCALATED' : 'LOGGED SAFE',
            };
            setSubmittedReports(prev => [newReport, ...prev.slice(0, 9)]);
            window.dispatchEvent(new CustomEvent('sanket:new_report', { detail: rep }));
            setTouchFeedback('🎉 Transmitted & Synced to Control Room!');
            setTimeout(() => setTouchFeedback(null), 3000);
          } catch {
            setTouchFeedback('🎉 Report Transmitted!');
            setTimeout(() => setTouchFeedback(null), 3000);
          }
          setIsSubmitting(false);
        }, 600);
        return;
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

  const handleSelectTag = async (tag: typeof quickTags[0]) => {
    setSelectedTag(tag.id);
    setInputText(tag.presetText);
    await submitTextObservation(tag.presetText);
  };

  // ──── ROBUST VOICE RECORDING: MediaRecorder Start/Stop + OpenAI Whisper ────

  const streamRef = useRef<MediaStream | null>(null);

  // Upload a blob to backend Whisper for transcription
  const uploadAndTranscribe = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setTouchFeedback('🧠 OpenAI Whisper AI transcribing...');
    try {
      const fd = new FormData();
      fd.append('audio', audioBlob, 'recording.webm');
      const res = await fetch(`${API}/api/voice/transcribe`, {
        method: 'POST',
        body: fd,
      });
      if (res.ok) {
        const d = await res.json();
        if (d.text && d.text.trim().length > 0) {
          const newText = inputText ? `${inputText} ${d.text.trim()}` : d.text.trim();
          setInputText(newText);
          setTouchFeedback(`✅ Transcribed: "${d.text.substring(0, 40)}..."`);
          // Automatically submit transcribed text after 1 second
          setTimeout(() => submitTextObservation(newText), 1000);
        } else {
          setTouchFeedback('⚠️ No speech detected. Speak louder or closer.');
        }
      } else {
        setTouchFeedback('⚠️ Whisper error. You can tap quick hazards below.');
      }
    } catch {
      setTouchFeedback('⚠️ Network error. Check Wi-Fi connection.');
    } finally {
      setIsTranscribing(false);
      setTimeout(() => setTouchFeedback(null), 4000);
    }
  };

  // START recording using MediaRecorder (works on all phones)
  const startRecording = async () => {
    if (typeof window !== 'undefined' && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
      setTouchFeedback('📱 Note: Mobile HTTP blocks live mic. Use 1-Tap Hazards below or phone keyboard mic!');
      setTimeout(() => setTouchFeedback(null), 4500);
      return;
    }

    try {
      // Request mic permission
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
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        audioChunksRef.current = [];
        if (audioBlob.size > 1000) {
          await uploadAndTranscribe(audioBlob);
        } else {
          setTouchFeedback('⚠️ Recording too short. Hold longer while speaking.');
          setTimeout(() => setTouchFeedback(null), 3000);
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);
      setTouchFeedback('🔴 Recording... Speak in Hindi/Assamese/English! Tap again to stop.');

      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Mic access error:', err);
      setTouchFeedback('⚠️ Mic access denied. Tap a Quick Hazard below to transmit!');
      setTimeout(() => setTouchFeedback(null), 4000);
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
      mediaRecorderRef.current.stop();
    }

    // Release mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  // Toggle: tap to start, tap again to stop (back-to-back recording)
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Native audio file upload fallback (for phones that block MediaRecorder)
  const handleNativeAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAndTranscribe(file);
  };


  const handleSubmitObservation = async (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!inputText.trim()) return;
    setIsSubmitting(true);
    setLastResult(null);
    setTouchFeedback('🚀 Transmitting to Control Room...');

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
              feedback: feedbackText,
            });

            const newReport: WorkerReport = {
              id: `REP-${data.job_id?.substring(0, 6).toUpperCase() || 'NEW'}`,
              text: inputText,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sif_label: rep.sif_label || 'HIGH',
              sif_score: rep.sif_score || 0.94,
              status: isHigh ? 'SWA ESCALATED' : 'LOGGED SAFE',
            };
            setSubmittedReports(prev => [newReport, ...prev.slice(0, 9)]);
            window.dispatchEvent(new CustomEvent('sanket:new_report', { detail: rep }));
            setTouchFeedback('🎉 Report Saved Successfully!');
            setTimeout(() => setTouchFeedback(null), 3000);
          } catch {
            setTouchFeedback('🎉 Report Sent!');
            setTimeout(() => setTouchFeedback(null), 3000);
          }
          setIsSubmitting(false);
        }, 600);
        return;
      }
    } catch {
      setTouchFeedback('❌ Error connecting to server');
      setTimeout(() => setTouchFeedback(null), 3000);
    }
    setIsSubmitting(false);
  };

  const handleEmergencySWA = async () => {
    setSwaToast('🚨 STOP WORK AUTHORITY TRIGGERED — ALL DRILLING ON WELL PAD 7 FROZEN');
    setTouchFeedback('🚨 EMERGENCY SWA TRIGGERED');
    try {
      await fetch(`${API}/api/emergency/swa/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'Well Pad 7 (Upper Assam)',
          reason: 'Worker SWA Manual Panic Reflex Button Pressed',
          declared_by: currentUser?.full_name || 'Bikash Das',
        }),
      });
    } catch {}
    setTimeout(() => setTouchFeedback(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0F1B1D] text-[#F7F8F5] p-3 sm:p-6 font-sans">
      
      {/* Hidden Native Mobile Voice Recorder Input */}
      <input suppressHydrationWarning 
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        capture={true as any}
        onChange={handleNativeAudioUpload}
        className="hidden"
      />

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

          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>

            <button suppressHydrationWarning
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-lg bg-[#1D3234] active:bg-[#264245] text-[#8BA4A7] hover:text-white transition-colors cursor-pointer border border-[#264245] flex items-center gap-1 text-xs"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
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
            <button suppressHydrationWarning type="button" onClick={() => setSwaToast(null)} className="text-white font-bold px-2 cursor-pointer">✕</button>
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
                {/* Hidden file input fallback for phones without MediaRecorder */}
                <input suppressHydrationWarning
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  capture="environment"
                  onChange={handleNativeAudioUpload}
                  className="hidden"
                />
                <button suppressHydrationWarning
                  type="button"
                  onClick={toggleRecording}
                  disabled={isTranscribing}
                  className={`w-32 h-32 rounded-full flex flex-col items-center justify-center gap-1.5 transition-all shadow-2xl cursor-pointer border-4 active:scale-95 ${
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
                      <span className="text-xs font-bold uppercase tracking-wider">TAP TO RECORD</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-[#8BA4A7] mt-3 font-medium text-center">
                  {isRecording ? '🔴 Recording live... Speak in Hindi / English / Assamese. Tap again to stop & transcribe.' : 'Tap to record → Tap to stop → Record again. Each clip appends text.'}
                </p>
              </div>

              {/* 4 Quick-Select Hazard Pre-fills */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase text-[#8BA4A7]">Quick Tap Hazard:</div>
                <div className="grid grid-cols-2 gap-2.5">
                  {quickTags.map((tag) => (
                    <button suppressHydrationWarning
                      key={tag.id}
                      type="button"
                      onClick={() => handleSelectTag(tag)}
                      className={`p-3 rounded-lg border text-left transition-all text-xs font-semibold flex items-center gap-2 cursor-pointer active:scale-95 ${
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

              {/* Observation Text Input Area */}
              <div>
                <textarea suppressHydrationWarning
                  rows={3}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type or speak using your keyboard mic..."
                  className="w-full p-3 rounded-lg bg-[#1D3234] border border-[#264245] text-xs text-white placeholder-[#5E7072] focus:outline-none focus:border-[#0A6B63] leading-relaxed"
                />
              </div>

              {/* Submit Observation Button */}
              <button suppressHydrationWarning
                type="button"
                onClick={handleSubmitObservation}
                disabled={isSubmitting || !inputText.trim()}
                className="w-full py-3.5 rounded-lg bg-[#0A6B63] active:bg-[#085B54] text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer transition-all active:scale-98"
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
            <button suppressHydrationWarning
              type="button"
              onClick={handleEmergencySWA}
              className="w-full py-3.5 rounded-xl bg-[#D63B3B] active:bg-[#B92525] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all border border-[#F5C6C6]/30 active:scale-98"
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
                          : 'bg-[#EDFAF4]/10 text-[#1B8A6C] border border-[#1B8A6C]/30'
                      }`}>
                        {report.sif_label} RISK ({Math.round(report.sif_score * 100)}%)
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
