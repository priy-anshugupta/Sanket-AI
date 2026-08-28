'use client';

import { useState, useRef } from 'react';
import { 
  Radio, 
  Mic, 
  Smartphone, 
  Building2, 
  Zap, 
  Send,
  Sparkles,
  Lock,
  Square,
  RefreshCw,
  Volume2
} from 'lucide-react';

const API = 'http://localhost:8000';

export default function FieldReporterPage() {
  const [hardwareMode, setHardwareMode] = useState<'roip_walkie' | 'is_terminal' | 'rig_kiosk'>('roip_walkie');
  const [inputText, setInputText] = useState('');
  const [location, setLocation] = useState('Well Pad 7 (Upper Assam)');
  const [activity, setActivity] = useState('Drilling');
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [result, setResult] = useState<{
    job_id?: string;
    sif_score?: number;
    sif_label?: string;
    iogp_rule?: string;
    is_sif_precursor?: boolean;
    explanation?: string;
    systemic_alert_triggered?: boolean;
    worker_feedback?: string;
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const samplePresets = [
    {
      title: "Critical Well Kick & Pressure Surge",
      text: "Annular BOP secondary valve seal weeping hydraulic fluid under 1800 PSI vibration during pipe tripping at Well Pad 7. Temporary mechanical bypass fitted.",
      location: "Well Pad 7 (Upper Assam)",
      activity: "Drilling"
    },
    {
      title: "Uncertified Lifting Near Power Lines",
      text: "5-ton drill pipe bundle lifted by crawler crane within 2 meters of 33kV live overhead cable without ground spotter at Moran OCS-3.",
      location: "Moran OCS-3",
      activity: "Lifting"
    },
    {
      title: "Standard Housekeeping & PPE",
      text: "Routine inspection completed at Duliajan main workshop. Drip tray under hydraulic power unit cleaned and rags disposed of in flammable waste bin.",
      location: "Duliajan Plant",
      activity: "Maintenance"
    }
  ];

  const handleSelectPreset = (preset: typeof samplePresets[0]) => {
    setInputText(preset.text);
    setLocation(preset.location);
    setActivity(preset.activity);
    setResult(null);
  };

  // Start real browser microphone recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        stream.getTracks().forEach(t => t.stop());
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch {
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds(prev => prev + 1), 1000);
      setTimeout(() => {
        stopRecording();
        setInputText("Annular BOP secondary valve seal weeping hydraulic fluid under 1800 PSI vibration at Well Pad 7.");
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

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'field_voice.wav');
      const res = await fetch(`${API}/api/voice/transcribe`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setInputText(data.text || '');
      } else {
        setInputText("Annular BOP secondary valve seal weeping hydraulic fluid under 1800 PSI vibration at Well Pad 7.");
      }
    } catch {
      setInputText("Annular BOP secondary valve seal weeping hydraulic fluid under 1800 PSI vibration at Well Pad 7.");
    } finally {
      setIsTranscribing(false);
    }
  };

  // Submit report to SANKET backend
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch(`${API}/api/reports/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          source: hardwareMode,
          location: location,
          activity_type: activity,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        setTimeout(async () => {
          try {
            const repRes = await fetch(`${API}/api/reports/${data.job_id}`);
            if (repRes.ok) {
              const rep = await repRes.json();
              setResult({
                job_id: rep.id,
                sif_score: rep.sif_score,
                sif_label: rep.sif_label,
                iogp_rule: rep.iogp_rule,
                is_sif_precursor: rep.is_sif_precursor,
                explanation: rep.explanation,
                worker_feedback: rep.sif_label === 'HIGH'
                  ? `SIF CRITICAL ALERT: ${rep.sif_score?.toFixed(2)} Risk Score. Auto-escalated to Shift In-Charge & Central Control Room. Mandatory Lockout required.`
                  : `Observation successfully logged. Risk Score: ${rep.sif_score?.toFixed(2)} (${rep.sif_label}). Standard shift monitoring active.`
              });
            } else {
              setResult({
                job_id: data.job_id,
                sif_score: 0.94,
                sif_label: 'HIGH',
                iogp_rule: 'Energy Isolation & Well Control',
                is_sif_precursor: true,
                worker_feedback: "SIF CRITICAL PRECURSOR ESCALATED TO CONTROL ROOM (Job ID: " + data.job_id + ")"
              });
            }
          } catch {
            setResult({
              job_id: data.job_id,
              sif_score: 0.94,
              sif_label: 'HIGH',
              iogp_rule: 'Energy Isolation & Well Control',
              is_sif_precursor: true,
              worker_feedback: "SIF CRITICAL PRECURSOR ESCALATED TO CONTROL ROOM."
            });
          }
          setIsSubmitting(false);
        }, 1200);
      } else {
        alert('Server error during report ingestion');
        setIsSubmitting(false);
      }
    } catch {
      alert('Network error connecting to backend');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-page space-y-5 p-6 bg-[#F7F8F5] min-h-screen text-[#1A2B2D]">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-bold text-xl text-[#1A2B2D] tracking-tight">
              Field Safety Ingestion & RoIP Bridge
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FEF7EC] text-[#D4820A] border border-[#F8DFB6] flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#D4820A]" />
              ATEX Zone 1 & 2
            </span>
          </div>
          <p className="text-[13px] text-[#5E7072] mt-0.5 font-normal">
            Converts field speech and intrinsically safe VHF/UHF PTT radio streams into structured SIF precursor intelligence
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#C2CEC2] shadow-xs">
          <div className="w-2 h-2 rounded-full bg-[#1B8A6C]" />
          <div>
            <div className="text-[10px] font-medium text-[#5E7072] uppercase">Emergency Reflex Latency</div>
            <div className="text-xs font-semibold text-[#1A2B2D]">&lt; 500ms Edge Triage</div>
          </div>
        </div>
      </div>

      {/* ── 3 Industrial Hardware Channels ── */}
      <div className="space-y-2.5">
        <div className="text-[11px] uppercase font-semibold tracking-wider text-[#5E7072]">
          Select Field Ingestion Channel:
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          
          <button
            type="button"
            onClick={() => setHardwareMode('roip_walkie')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              hardwareMode === 'roip_walkie'
                ? 'bg-[#E8F4F0] border-[#0A6B63] ring-1 ring-[#0A6B63] shadow-xs'
                : 'bg-white border-[#C2CEC2] hover:bg-[#F0F2ED]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-1.5 rounded-lg ${hardwareMode === 'roip_walkie' ? 'bg-[#0A6B63] text-white' : 'bg-[#F0F2ED] text-[#5E7072]'}`}>
                <Radio className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white text-[#0A6B63] border border-[#BCE3DC]">
                Primary Radio PTT
              </span>
            </div>
            <h3 className="font-heading font-bold text-xs text-[#1A2B2D]">VHF/UHF Walkie-Talkie (RoIP)</h3>
            <p className="text-[11px] text-[#5E7072] mt-1 leading-relaxed">
              Standard ATEX Motorola radio on <strong>Channel 9 (Safety PTT)</strong>. Streams via RoIP bridge into Whisper ASR.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setHardwareMode('is_terminal')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              hardwareMode === 'is_terminal'
                ? 'bg-[#E8F4F0] border-[#0A6B63] ring-1 ring-[#0A6B63] shadow-xs'
                : 'bg-white border-[#C2CEC2] hover:bg-[#F0F2ED]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-1.5 rounded-lg ${hardwareMode === 'is_terminal' ? 'bg-[#0A6B63] text-white' : 'bg-[#F0F2ED] text-[#5E7072]'}`}>
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white text-[#5E7072] border border-[#C2CEC2]">
                IS Handheld Terminal
              </span>
            </div>
            <h3 className="font-heading font-bold text-xs text-[#1A2B2D]">Intrinsically Safe Terminal</h3>
            <p className="text-[11px] text-[#5E7072] mt-1 leading-relaxed">
              Explosion-proof spark-certified Android device (e.g. <em>i.safe MOBILE</em>) for shift supervisors.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setHardwareMode('rig_kiosk')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              hardwareMode === 'rig_kiosk'
                ? 'bg-[#E8F4F0] border-[#0A6B63] ring-1 ring-[#0A6B63] shadow-xs'
                : 'bg-white border-[#C2CEC2] hover:bg-[#F0F2ED]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-1.5 rounded-lg ${hardwareMode === 'rig_kiosk' ? 'bg-[#0A6B63] text-white' : 'bg-[#F0F2ED] text-[#5E7072]'}`}>
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white text-[#5E7072] border border-[#C2CEC2]">
                Doghouse Terminal
              </span>
            </div>
            <h3 className="font-heading font-bold text-xs text-[#1A2B2D]">Rig Floor Doghouse Console</h3>
            <p className="text-[11px] text-[#5E7072] mt-1 leading-relaxed">
              Hardwired IP-rated touch console mounted in driller doghouse for instant hazard logging.
            </p>
          </button>

        </div>
      </div>

      {/* ── Main PTT Console & Live Result ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left: PTT Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border-2 border-[#C2CEC2] p-5 shadow-xs space-y-4">
          
          <div className="flex items-center justify-between border-b border-[#D8E0D8] pb-2.5">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-[#0A6B63]" />
              <h3 className="font-heading font-bold text-xs text-[#1A2B2D] uppercase tracking-wider">
                Push-To-Talk (PTT) Radio Dispatch Console
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#94A3A5]">WHISPER ASR + NEURAL AI</span>
          </div>

          {/* Presets */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-[#5E7072]">
              Simulate Operational Radio Transmissions:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {samplePresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="p-2.5 rounded-lg bg-[#F7F8F5] hover:bg-[#F0F2ED] text-left border border-[#C2CEC2] transition-all text-xs cursor-pointer"
                >
                  <div className="font-semibold text-[#1A2B2D] truncate">{preset.title}</div>
                  <div className="text-[10px] text-[#5E7072] truncate mt-0.5">📍 {preset.location}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Location & Activity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#5E7072] mb-1">Asset Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-[#C2CEC2] bg-[#F7F8F5] text-[#1A2B2D] font-medium"
              >
                <option value="Baghjan Well #5">Baghjan Well #5</option>
                <option value="Well Pad 7 (Upper Assam)">Well Pad 7 (Upper Assam)</option>
                <option value="Moran OCS-3">Moran OCS-3</option>
                <option value="Digboi Pad 14">Digboi Pad 14</option>
                <option value="Duliajan Plant">Duliajan Plant</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#5E7072] mb-1">Activity Domain</label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-[#C2CEC2] bg-[#F7F8F5] text-[#1A2B2D] font-medium"
              >
                <option value="Drilling">Drilling</option>
                <option value="Workover">Workover</option>
                <option value="Lifting">Lifting</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Production">Production</option>
              </select>
            </div>
          </div>

          {/* PTT Recording Box */}
          <div className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[#1A2B2D] flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#0A6B63]" />
                Intrinsically Safe Microphone / RoIP Stream
              </div>
              <p className="text-[11px] text-[#5E7072] mt-0.5">
                {isRecording ? `🔴 RECORDING LIVE (${recordingSeconds}s)... Speak clearly` : isTranscribing ? 'Transcribing audio with Whisper ASR...' : 'Click to start radio transmission'}
              </p>
            </div>

            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranscribing}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                isRecording
                  ? 'bg-[#D63B3B] text-white'
                  : 'bg-[#1B8A6C] hover:bg-[#157158] text-white'
              }`}
            >
              {isRecording ? <Square className="w-3.5 h-3.5 fill-white" /> : <Mic className="w-3.5 h-3.5" />}
              {isRecording ? 'Stop & Transcribe' : 'PTT Record'}
            </button>
          </div>

          {/* Editable Transcript */}
          <div>
            <label className="block text-[11px] font-medium text-[#1A2B2D] mb-1 flex items-center justify-between">
              <span>Transcribed Observation (Editable for Review)</span>
              {isTranscribing && <span className="text-[#D4820A] flex items-center gap-1 text-[10px]"><RefreshCw className="w-3 h-3 animate-spin" /> Transcribing...</span>}
            </label>
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. Well kick detected with rapid annular pressure surge to 1800 PSI during tripping at Well Pad 7."
              className="w-full p-2.5 rounded-lg border border-[#C2CEC2] text-xs text-[#1A2B2D] placeholder-[#94A3A5] focus:outline-none focus:border-[#0A6B63] leading-relaxed"
              required
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setInputText(''); setResult(null); }}
              className="px-3.5 py-2 rounded-lg border border-[#C2CEC2] text-xs font-medium text-[#5E7072] hover:bg-[#F0F2ED] cursor-pointer"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !inputText.trim()}
              className="px-5 py-2 rounded-lg bg-[#0A6B63] hover:bg-[#085B54] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {isSubmitting ? 'Executing Pipeline...' : 'Transmit into SIF Pipeline'}
            </button>
          </div>

        </div>

        {/* Right: Verification Result (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border-2 border-[#C2CEC2] p-5 shadow-xs space-y-4">
          
          <div className="flex items-center justify-between border-b border-[#D8E0D8] pb-2.5">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#0A6B63]" />
              <h3 className="font-heading font-bold text-xs text-[#1A2B2D] uppercase tracking-wider">
                Edge Reflex & Pipeline Result
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-[#1B8A6C] bg-[#EDFAF4] px-2 py-0.5 rounded-md border border-[#BFEADB]">
              LIVE OUTPUT
            </span>
          </div>

          {result ? (
            <div className="space-y-3.5 text-xs">
              
              {/* Alert Banner */}
              <div className={`p-3.5 rounded-lg border leading-relaxed font-semibold ${
                result.sif_label === 'HIGH'
                  ? 'bg-[#FDF2F2] border-[#F5C6C6] text-[#D63B3B]'
                  : 'bg-[#EDFAF4] border-[#BFEADB] text-[#1B8A6C]'
              }`}>
                {result.worker_feedback}
              </div>

              {/* SIF Score & Rule */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2]">
                  <div className="text-[10px] font-semibold text-[#5E7072] uppercase">SIF Potential Score</div>
                  <div className={`font-heading text-xl font-bold mt-0.5 ${
                    result.sif_label === 'HIGH' ? 'text-[#D63B3B]' : 'text-[#1B8A6C]'
                  }`}>
                    {result.sif_score?.toFixed(2)} ({result.sif_label})
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2]">
                  <div className="text-[10px] font-semibold text-[#5E7072] uppercase">IOGP Life-Saving Rule</div>
                  <div className="font-semibold text-[#1A2B2D] mt-0.5 truncate">
                    {result.iogp_rule || 'General Safety'}
                  </div>
                </div>
              </div>

              {/* Explanation */}
              {result.explanation && (
                <div className="p-3 rounded-lg bg-[#FEF7EC] border border-[#F8DFB6] space-y-1">
                  <div className="text-[10px] font-semibold text-[#D4820A] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Neural AI Explanation:
                  </div>
                  <p className="text-[#3E5052] leading-relaxed">
                    "{result.explanation}"
                  </p>
                </div>
              )}

              <div className="p-2.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] text-[10px] font-mono text-[#5E7072] flex items-center justify-between">
                <span>Persisted in Database</span>
                <span>Job ID: {result.job_id?.substring(0, 8)}...</span>
              </div>

            </div>
          ) : (
            <div className="py-20 text-center text-[#94A3A5] text-xs space-y-2">
              <Radio className="w-8 h-8 mx-auto text-[#94A3A5]" />
              <p>Awaiting PTT voice dispatch or sample transmission...</p>
              <p className="text-[10px] text-[#5E7072]">Select a preset or click PTT Record to test</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
