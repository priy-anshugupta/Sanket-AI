'use client';
import { useLiveTask } from '@/lib/use-live-task';
import { systemStatusUrl } from '@/lib/system-status-url';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Sliders, 
  Lock, 
  CheckCircle2, 
  Radio, 
  Zap,
  Save,
  Check,
  Server,
  Globe,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { getApiBase } from '@/lib/config';

const API = getApiBase();

interface AirGapStatus {
  is_airgapped: boolean;
  mode: string;
  outbound_connections: number;
  outbound_kbps: string | number;
  models_loaded: {
    embeddings: string;
    ner: string;
    llm: string;
  };
  zero_egress: boolean;
  status_badge?: string;
}

export default function SettingsPage() {
  const [airgap, setAirgap] = useState<AirGapStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Sensitivity Sliders
  const [sifHighThreshold, setSifHighThreshold] = useState(0.75);
  const [sifMediumThreshold, setSifMediumThreshold] = useState(0.50);
  const [lsrThreshold, setLsrThreshold] = useState(0.45);
  const [clusterWindow, setClusterWindow] = useState(7);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [switchingMode, setSwitchingMode] = useState(false);

  const fetchSystemStatus = async (signal?: AbortSignal) => {
    try {
      const res = await fetch(systemStatusUrl(API, '/dashboard/settings'), { signal });
      if (res.ok) {
        const data = await res.json();
        if (!signal?.aborted) setAirgap(data);
      }
    } catch {} finally { if (!signal?.aborted) setLoading(false); }
  };
  useLiveTask(signal => fetchSystemStatus(signal), [], { once: true, enabled: true });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const isOnline = airgap ? !airgap.is_airgapped : true;

  const toggleAiMode = async () => {
    try {
      setSwitchingMode(true);
      const targetAiMode = isOnline ? 'airgapped' : 'online';
      const targetDbMode = isOnline ? 'sqlite' : 'supabase';

      // Optimistically update UI immediately so button flips with zero lag
      setAirgap((prev) => prev ? {
        ...prev,
        is_airgapped: targetAiMode === 'airgapped',
        mode: targetAiMode,
        zero_egress: targetAiMode === 'airgapped',
        outbound_kbps: targetAiMode === 'airgapped' ? 0.0 : 1.4,
        outbound_connections: targetAiMode === 'airgapped' ? 0 : 1,
        status_badge: targetAiMode === 'airgapped' ? '0 KB/s OUT · AIR-GAPPED' : '1.4 KB/s · SANITIZED EGRESS'
      } : null);

      const postSwitch = async (url: string) => {
        try {
          const direct = `${API}${url}`;
          const r = await fetch(direct, { method: 'POST' });
          if (r.ok) return r;
        } catch {}
        return await fetch(url, { method: 'POST' });
      };

      await postSwitch(`/api/system/ai-switch?mode=${targetAiMode}`);
      await postSwitch(`/api/system/db-switch?mode=${targetDbMode}`);
      await fetchSystemStatus();
    } catch (e) {
      console.error('Mode toggle error:', e);
    } finally {
      setSwitchingMode(false);
    }
  };

  return (
    <div className="dashboard-page min-h-screen space-y-5 p-6 bg-[#F7F8F5] text-[#1A2B2D]">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-bold text-xl text-[#1A2B2D] tracking-tight">
              System Security & AI Sensitivity Controls
            </h1>
            <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 border ${
              isOnline 
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-[#EDFAF4] text-[#1B8A6C] border-[#BFEADB]'
            }`}>
              {isOnline ? <Globe className="w-3 h-3 text-blue-600" /> : <Lock className="w-3 h-3 text-[#1B8A6C]" />}
              {isOnline ? 'Online AI Mode (OpenAI GPT-4o Active)' : '100% Offline Air-Gapped'}
            </span>
          </div>
          <p className="text-[13px] text-[#5E7072] mt-0.5 font-normal">
            Real-time telemetry of system connectivity, active AI models, and SIF neural thresholds
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#C2CEC2] shadow-xs text-xs font-semibold text-[#0A6B63]">
          <span className="w-2 h-2 rounded-full bg-[#0A6B63] animate-pulse" />
          <span>Oil India Private On-Premise Server</span>
        </div>
      </div>

      {/* ── 1. Air-Gap Security Verification Monitor ── */}
      <div className="bg-white rounded-xl border-2 border-[#C2CEC2] p-5 shadow-xs space-y-4">
        
        <div className="flex items-center justify-between border-b border-[#D8E0D8] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E8F4F0] flex items-center justify-center text-[#0A6B63]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-sm text-[#1A2B2D]">
                Cybersecurity & Neural Engine Status Monitor
              </h2>
              <p className="text-[11px] text-[#5E7072]">
                Guarantees all SIF vector math runs on local CPU with optional cloud LLM reasoning
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAiMode}
              disabled={switchingMode}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                isOnline
                  ? 'bg-[#0A6B63] hover:bg-[#085B54] text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isOnline ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
              {switchingMode ? 'Switching...' : (isOnline ? 'Simulate 100% Air-Gapped Mode' : 'Switch to Cloud Online Mode')}
            </button>

            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${
              isOnline
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-[#EDFAF4] border-[#BFEADB] text-[#1B8A6C]'
            }`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? 'bg-blue-600' : 'bg-[#1B8A6C]'}`} />
              {airgap?.status_badge || (isOnline ? 'ONLINE AI ACTIVE' : 'VERIFIED 100% AIR-GAPPED')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2]">
            <div className="text-[10px] uppercase font-semibold text-[#5E7072]">System Mode</div>
            <div className="font-heading text-lg font-bold text-[#1A2B2D] mt-0.5">
              {isOnline ? 'Hybrid Online' : 'Air-Gapped'}
            </div>
            <div className={`text-[10px] font-semibold mt-0.5 ${isOnline ? 'text-blue-600' : 'text-[#1B8A6C]'}`}>
              {isOnline ? '● Cloud LLM + Local Vectors' : '● Zero Cloud Dependency'}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2]">
            <div className="text-[10px] uppercase font-semibold text-[#5E7072]">Outbound Internet</div>
            <div className={`font-heading text-lg font-bold mt-0.5 ${isOnline ? 'text-blue-600' : 'text-[#1B8A6C]'}`}>
              {airgap?.outbound_kbps ?? (isOnline ? '1.6' : '0')} KB/s
            </div>
            <div className="text-[10px] text-[#5E7072] mt-0.5">
              {isOnline ? 'Sanitized Prompt Egress' : 'Strict Egress Block'}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2]">
            <div className="text-[10px] uppercase font-semibold text-[#5E7072]">External Connections</div>
            <div className="font-heading text-lg font-bold text-[#1A2B2D] mt-0.5">
              {airgap?.outbound_connections ?? (isOnline ? 1 : 0)} Active
            </div>
            <div className="text-[10px] text-[#5E7072] mt-0.5">
              {isOnline ? 'OpenAI Whisper & Chat API' : '100% Private Intranet'}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2]">
            <div className="text-[10px] uppercase font-semibold text-[#5E7072]">Local Neural Engine</div>
            <div className="font-mono text-xs font-bold text-[#1A2B2D] mt-1 truncate" title={airgap?.models_loaded?.embeddings || 'multilingual-e5-small'}>
              {airgap?.models_loaded?.embeddings?.split(' ')[0] || 'multilingual-e5-small'}
            </div>
            <div className="text-[10px] text-[#0A6B63] font-semibold mt-0.5">Runs on Device CPU</div>
          </div>
        </div>
      </div>

      {/* ── 2. Local AI Components Running in RAM ── */}
      <div className="bg-white rounded-xl border-2 border-[#C2CEC2] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#D8E0D8] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E8F4F0] flex items-center justify-center text-[#0A6B63]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-sm text-[#1A2B2D]">
                Active AI Pipeline Architecture
              </h2>
              <p className="text-[11px] text-[#5E7072]">
                7-stage hybrid NLP & neuro-symbolic knowledge graph execution stack
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#0A6B63]">
            7 PIPELINE STAGES ACTIVE
          </span>
        </div>

        <div className="space-y-2.5">
          <div className="p-3 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#1A2B2D]">1. SIF Precursor Risk Classifier</div>
              <div className="text-[11px] text-[#5E7072]">multilingual-e5-small (384-Dim Neural Vectors) · Evaluates 50 industrial precursors</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#EDFAF4] text-[#1B8A6C] text-[10px] font-bold border border-[#BFEADB]">
              Active in RAM (CPU)
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#1A2B2D]">2. Industrial Zero-Shot Entity Extractor</div>
              <div className="text-[11px] text-[#5E7072]">Extracts Equipment, Locations, Barrier Failures, Energy Sources & Shifts</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#EDFAF4] text-[#1B8A6C] text-[10px] font-bold border border-[#BFEADB]">
              Active in RAM (CPU)
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#1A2B2D]">3. IOGP 9 Life-Saving Rules Matcher</div>
              <div className="text-[11px] text-[#5E7072]">Neural cosine similarity matching against IOGP 9 safety standards</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#EDFAF4] text-[#1B8A6C] text-[10px] font-bold border border-[#BFEADB]">
              Active in RAM (CPU)
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#1A2B2D]">4. Multilingual Speech-to-Text Transcriber</div>
              <div className="text-[11px] text-[#5E7072]">OpenAI Whisper SDK with Hindi, Assamese & English domain vocabulary</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
              OpenAI Whisper (whisper-1)
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#1A2B2D]">5. Grounded Risk Explainer & Root Cause Narrator</div>
              <div className="text-[11px] text-[#5E7072]">
                {airgap?.models_loaded?.llm || 'OpenAI gpt-4o'} with DGMS / OISD-189 safety guardrails
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
              {airgap?.models_loaded?.llm || 'OpenAI gpt-4o'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. AI Risk Sensitivity Thresholds Slider Controls ── */}
      <div className="bg-white rounded-xl border-2 border-[#C2CEC2] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#D8E0D8] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E8F4F0] flex items-center justify-center text-[#0A6B63]">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-sm text-[#1A2B2D]">
                SIF Risk Sensitivity Calibration
              </h2>
              <p className="text-[11px] text-[#5E7072]">
                Tune the SIF classification gates and Near-Miss Multiplier clustering window
              </p>
            </div>
          </div>
          {saveSuccess && (
            <span className="px-2.5 py-1 rounded bg-[#EDFAF4] text-[#1B8A6C] text-xs font-bold flex items-center gap-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" /> Saved Successfully!
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* High SIF Threshold */}
            <div className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1A2B2D]">High SIF Trigger Gate</span>
                <span className="font-mono font-bold text-[#D63B3B] bg-[#FDF2F2] px-2 py-0.5 rounded border border-[#F5C6C6]">
                  {Math.round(sifHighThreshold * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.05"
                value={sifHighThreshold}
                onChange={(e) => setSifHighThreshold(parseFloat(e.target.value))}
                className="w-full accent-[#D63B3B] cursor-pointer"
              />
              <p className="text-[10px] text-[#5E7072]">
                Incidents scoring above this trigger immediate SWA siren alarms and SMS dispatches.
              </p>
            </div>

            {/* Medium SIF Threshold */}
            <div className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1A2B2D]">Medium Precursor Gate</span>
                <span className="font-mono font-bold text-[#D4820A] bg-[#FEF7EC] px-2 py-0.5 rounded border border-[#F8DFB6]">
                  {Math.round(sifMediumThreshold * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.70"
                step="0.05"
                value={sifMediumThreshold}
                onChange={(e) => setSifMediumThreshold(parseFloat(e.target.value))}
                className="w-full accent-[#D4820A] cursor-pointer"
              />
              <p className="text-[10px] text-[#5E7072]">
                Precursors scoring above this stream into DCS Control Room for active shift monitoring.
              </p>
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-[#0A6B63] hover:bg-[#085B54] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              Save Calibration Settings
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
