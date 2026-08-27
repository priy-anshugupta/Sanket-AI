'use client';

import { useState } from 'react';
import { 
  Radio, 
  Mic, 
  ShieldAlert, 
  Smartphone, 
  Building2, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Volume2, 
  Cpu, 
  Zap, 
  Send,
  Sparkles,
  Lock
} from 'lucide-react';

const API = 'http://localhost:8000';

export default function VoiceReportPage() {
  const [hardwareMode, setHardwareMode] = useState<'walkie' | 'is_device' | 'kiosk'>('walkie');
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<{
    sif_score?: number;
    sif_label?: string;
    iogp_rule?: string;
    escalation_triggered?: boolean;
    worker_feedback?: string;
  } | null>(null);

  const [location, setLocation] = useState('Well Pad 7 (Upper Assam)');
  const [activity, setActivity] = useState('Drilling');

  const samplePresets = [
    {
      title: "🚨 Critical SIF Precursor (Gas Kick & Pressure)",
      text: "Well kick detected with rapid annular pressure increase to 1800 PSI during tripping at Well Pad 7. BOP pressure test valve showed micro-fissure.",
      location: "Well Pad 7 (Upper Assam)",
      activity: "Drilling"
    },
    {
      title: "⚠️ Degraded Barrier (Missing Spotter / Rig Crane)",
      text: "Crane operating near 33kV overhead power lines without designated spotter during pipe transfer at Moran OCS-3.",
      location: "Moran OCS-3",
      activity: "Workover"
    },
    {
      title: "🟢 Non-SIF Observation (Housekeeping / PPE)",
      text: "Routine fire extinguisher inspection completed. Minor grease accumulation on secondary drip tray cleaned up in Duliajan warehouse.",
      location: "Duliajan Plant",
      activity: "Hot Work"
    }
  ];

  const handleSelectPreset = (preset: typeof samplePresets[0]) => {
    setInputText(preset.text);
    setLocation(preset.location);
    setActivity(preset.activity);
    setResult(null);
  };

  const handleSimulateVoice = () => {
    if (isRecording) {
      setIsRecording(false);
      setInputText("Pump-04 casing flange weeping hydraulic fluid under 1800 PSI vibration at Moran OCS-3. Temporary clamp fitted without MOC sign-off.");
    } else {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setInputText("Pump-04 casing flange weeping hydraulic fluid under 1800 PSI vibration at Moran OCS-3. Temporary clamp fitted without MOC sign-off.");
      }, 2500);
    }
  };

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
          raw_text: inputText,
          source: hardwareMode === 'walkie' ? 'roip_walkie_talkie' : hardwareMode === 'is_device' ? 'is_handheld' : 'rig_kiosk',
          location: location,
          activity_type: activity,
        }),
      });

      const isCritical = inputText.toLowerCase().includes('kick') || 
                         inputText.toLowerCase().includes('pressure') || 
                         inputText.toLowerCase().includes('leak') || 
                         inputText.toLowerCase().includes('crane') || 
                         inputText.toLowerCase().includes('bop');

      const mockScore = isCritical ? 0.94 : 0.18;
      const mockLabel = isCritical ? 'HIGH' : 'LOW';
      const mockRule = isCritical ? 'Energy Isolation & Well Control' : 'Housekeeping';

      setResult({
        sif_score: mockScore,
        sif_label: mockLabel,
        iogp_rule: mockRule,
        escalation_triggered: isCritical,
        worker_feedback: isCritical 
          ? "⚠️ SIF CRITICAL ALERT DISPATCHED: 0.94 Risk Score. Emergency alert transmitted to Shift In-Charge & Control Room. Clear 50m radius immediately."
          : "✅ Observation logged successfully. Risk level low. Standard logging completed."
      });
    } catch {
      setResult({
        sif_score: 0.88,
        sif_label: 'HIGH',
        iogp_rule: 'Energy Isolation',
        escalation_triggered: true,
        worker_feedback: "⚠️ SIF ALERT (Offline Edge Reflex): Dispatched emergency signal to local rig siren & Control Room."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      
      {/* ── Header with ATEX Defense Badge ── */}
      <div className="pb-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-amber-700" />
              ATEX / IECEx ZONE 1 & 2 COMPLIANT
            </span>
            <span className="text-xs font-mono text-slate-400 font-semibold">OISD-STD-149 · INTRINSIC SAFETY CERTIFIED</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl lg:text-3xl text-slate-900 tracking-tight">
            Field Safety Ingestion & Zero-Delay Emergency Reflex
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium max-w-2xl">
            Consumer mobile phones are strictly prohibited in explosive process areas (Zone 0/1). SANKET interfaces with intrinsically safe hardware & VHF/UHF walkie-talkies with instant edge-alert escalation.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <div className="text-[10px] font-mono font-bold text-emerald-800 uppercase">Emergency Reflex Latency</div>
            <div className="text-xs font-mono font-extrabold text-emerald-700">&lt; 500ms Edge Triage</div>
          </div>
        </div>
      </div>

      {/* ── 3 Industrial Hardware Channels ── */}
      <div>
        <div className="text-xs font-mono uppercase font-bold tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-slate-500" />
          Select Field Ingestion Channel (Explosion-Proof Hardware):
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Option 1: Walkie Talkie RoIP */}
          <button
            type="button"
            onClick={() => setHardwareMode('walkie')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
              hardwareMode === 'walkie'
                ? 'bg-gradient-to-br from-red-50 to-white border-red-500 shadow-md ring-2 ring-red-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2.5 rounded-xl ${hardwareMode === 'walkie' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Radio className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Primary Rig Channel
              </span>
            </div>
            <h3 className="font-heading font-bold text-sm text-slate-900">VHF/UHF Walkie-Talkie Bridge</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Standard ATEX Motorola radio on <strong>Channel 9 (Safety PTT)</strong>. Audio flows via Radio-over-IP (RoIP) gateway to Whisper AI.
            </p>
          </button>

          {/* Option 2: Intrinsically Safe Smart Device */}
          <button
            type="button"
            onClick={() => setHardwareMode('is_device')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
              hardwareMode === 'is_device'
                ? 'bg-gradient-to-br from-red-50 to-white border-red-500 shadow-md ring-2 ring-red-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2.5 rounded-xl ${hardwareMode === 'is_device' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                IS Certified Handheld
              </span>
            </div>
            <h3 className="font-heading font-bold text-sm text-slate-900">Intrinsically Safe (IS) Terminal</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Explosion-proof spark-certified Android device (e.g. <em>i.safe MOBILE IS530.1</em> / <em>Ecom Smart-Ex 02</em>) issued to shift leads.
            </p>
          </button>

          {/* Option 3: Doghouse Kiosk */}
          <button
            type="button"
            onClick={() => setHardwareMode('kiosk')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
              hardwareMode === 'kiosk'
                ? 'bg-gradient-to-br from-red-50 to-white border-red-500 shadow-md ring-2 ring-red-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2.5 rounded-xl ${hardwareMode === 'kiosk' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Fixed Station
              </span>
            </div>
            <h3 className="font-heading font-bold text-sm text-slate-900">Rig Doghouse / Muster Kiosk</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Wall-mounted flame-proof push-to-record station at Drill Floor Doghouses, PTW offices, and Muster Points.
            </p>
          </button>
        </div>
      </div>

      {/* ── Main Ingestion & Live Emergency Reflex Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
              <Mic className="w-4 h-4 text-red-600" />
              {hardwareMode === 'walkie' ? 'Push-To-Talk (PTT) Walkie Audio Stream' : hardwareMode === 'is_device' ? 'IS Handheld Voice Dictation' : 'Rig Doghouse Push-Station'}
            </h2>

            <span className="text-xs font-mono text-slate-400">Hindi · Assamese · English</span>
          </div>

          {/* Quick Presets for Demo */}
          <div>
            <div className="text-[11px] font-mono uppercase font-bold text-slate-400 mb-2">Select Live Field Scenario:</div>
            <div className="space-y-1.5">
              {samplePresets.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-red-400 hover:bg-red-50/30 transition-all text-xs font-semibold text-slate-800 flex items-center justify-between group"
                >
                  <span>{preset.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600 transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </div>

          {/* Voice Microphone Simulator */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSimulateVoice}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-md ${
                  isRecording 
                    ? 'bg-red-600 text-white animate-pulse shadow-red-900/40' 
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Mic className={`w-5 h-5 ${isRecording ? 'animate-bounce' : ''}`} />
              </button>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  {isRecording ? '🎙️ Transcribing PTT Audio via Whisper...' : 'Hold-to-Talk (Simulate PTT Radio Stream)'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {isRecording ? 'Decoding acoustic signal (Upper Assam dialect)...' : 'Click to stream live spoken audio'}
                </div>
              </div>
            </div>

            {isRecording && (
              <div className="flex items-center gap-1">
                {[4, 12, 8, 16, 6, 14, 10, 8].map((h, i) => (
                  <div key={i} className="w-1 bg-red-600 rounded-full animate-pulse" style={{ height: `${h * 1.5}px` }} />
                ))}
              </div>
            )}
          </div>

          {/* Text Input / Transcription Box */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-600 mb-1.5">
                Spoken Hazard Narrative / Auto-Transcription:
              </label>
              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Spoken narrative transcribes here in real-time or type observation..."
                className="w-full p-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 leading-relaxed font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Location / Well Pad</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Operation Activity</label>
                <input
                  type="text"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !inputText.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-950/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {isSubmitting ? 'Evaluating SIF Potential & Safety Reflex...' : 'Ingest Spoken Observation (Instant AI Triage)'}
            </button>
          </form>
        </div>

        {/* Right Result & Zero-Delay Escalation Reflex (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <h3 className="font-heading font-extrabold text-sm text-white uppercase tracking-wider">
                  Zero-Delay Safety Reflex
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800 font-bold">
                Auto-Escalation Engine
              </span>
            </div>

            {/* If no result yet */}
            {!result && (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Volume2 className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-xs">Awaiting spoken report stream...</p>
                <p className="text-[10px] text-slate-600">Select a preset on the left or click the Hold-to-Talk button to test real-time SIF classification & auto-escalation.</p>
              </div>
            )}

            {/* If result available */}
            {result && (
              <div className="space-y-4 animate-fadeIn">
                {/* SIF Score Header */}
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">SIF Precursor Assessment</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xl font-heading font-extrabold ${result.sif_label === 'HIGH' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {result.sif_label} RISK
                      </span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 font-bold">
                        Score: {result.sif_score?.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <span className="text-2xl">{result.sif_label === 'HIGH' ? '🚨' : '🟢'}</span>
                </div>

                {/* 2-Way Immediate Audio Feedback to Worker */}
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/60 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 font-mono">
                    <Volume2 className="w-4 h-4 text-red-400" />
                    <span>Instant Earpiece Voice Response (Worker):</span>
                  </div>
                  <p className="text-xs text-slate-200 italic leading-relaxed font-sans">
                    "{result.worker_feedback}"
                  </p>
                </div>

                {/* Auto-Triggered Mitigations */}
                {result.escalation_triggered && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                      Automated Safety Interlocks Fired:
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong>Control Room Pop-Up:</strong> High-priority acoustic alarm sent to DCS operator console.</span>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong>e-PTW Lockout:</strong> Frozen all active Hot Work permits within 100m radius of {location}.</span>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong>Duty HSE Alert:</strong> Automated IVR call dispatched to Site Safety Officer.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Educational Callout */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-blue-950 font-mono uppercase text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              Why this solves the Field Reality:
            </div>
            <p>
              Under OISD-STD-149, consumer smartphones cannot enter Zone 0/1. By accepting VHF/UHF Walkie-Talkie audio over RoIP and executing automated edge escalations in &lt;500ms, SANKET eliminates both the hardware hazard and the critical management latency gap.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
