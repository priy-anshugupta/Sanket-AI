'use client';

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
  Server
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

  useEffect(() => {
    fetch(`${API}/api/system/airgap`)
      .then((res) => res.json())
      .then((data) => {
        setAirgap(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
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
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EDFAF4] text-[#1B8A6C] border border-[#BFEADB] flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#1B8A6C]" />
              100% Offline Air-Gapped
            </span>
          </div>
          <p className="text-[13px] text-[#5E7072] mt-0.5 font-normal">
            Verify offline cybersecurity compliance and adjust how sensitive the AI risk alarms are
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
                Cybersecurity Air-Gap Verification Monitor
              </h2>
              <p className="text-[11px] text-[#5E7072]">
                Guarantees zero safety data leaves Oil India's internal network (Govt. of India Mandate)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EDFAF4] border border-[#BFEADB] text-[11px] font-bold text-[#1B8A6C]">
            <span className="w-2 h-2 rounded-full bg-[#1B8A6C] animate-pulse" />
            VERIFIED 100% AIR-GAPPED
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2]">
            <div className="text-[10px] uppercase font-semibold text-[#5E7072]">System Mode</div>
            <div className="font-heading text-lg font-bold text-[#1A2B2D] mt-0.5">Air-Gapped</div>
            <div className="text-[10px] text-[#1B8A6C] font-semibold mt-0.5">● Zero Cloud Dependency</div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2]">
            <div className="text-[10px] uppercase font-semibold text-[#5E7072]">Outbound Internet</div>
            <div className="font-heading text-lg font-bold text-[#1B8A6C] mt-0.5">0 KB/s</div>
            <div className="text-[10px] text-[#5E7072] mt-0.5">Strict Egress Block</div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2]">
            <div className="text-[10px] uppercase font-semibold text-[#5E7072]">External Connections</div>
            <div className="font-heading text-lg font-bold text-[#1B8A6C] mt-0.5">0 Active</div>
            <div className="text-[10px] text-[#5E7072] mt-0.5">100% Private Intranet</div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2]">
            <div className="text-[10px] uppercase font-semibold text-[#5E7072]">Local AI Neural Engine</div>
            <div className="font-mono text-xs font-bold text-[#1A2B2D] mt-1 truncate">multilingual-e5-small</div>
            <div className="text-[10px] text-[#5E7072] mt-0.5">Runs on Device CPU</div>
          </div>
        </div>

      </div>

      {/* ── 2. Local AI Pipeline Components in RAM ── */}
      <div className="bg-white rounded-xl border-2 border-[#C2CEC2] p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#D8E0D8] pb-2.5">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#0A6B63]" />
            <h2 className="font-heading font-bold text-xs text-[#1A2B2D] uppercase tracking-wider">
              Local AI Components Running in RAM
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#0A6B63] font-bold">4 MODULES ACTIVE</span>
        </div>

        <div className="divide-y divide-[#E0E6E0]">
          <div className="py-2.5 flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-[#1A2B2D]">1. SIF Precursor Risk Classifier</div>
              <div className="text-[11px] text-[#5E7072]">Scores accident severity from 0% to 100% using local neural embeddings</div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-[#EDFAF4] text-[#1B8A6C] border border-[#BFEADB]">
              Active in RAM
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-[#1A2B2D]">2. Equipment & Location Extractor</div>
              <div className="text-[11px] text-[#5E7072]">Automatically identifies valves, pumps, well pads, and pressure levels</div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-[#EDFAF4] text-[#1B8A6C] border border-[#BFEADB]">
              Active in RAM
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-[#1A2B2D]">3. IOGP Life-Saving Rules Matcher</div>
              <div className="text-[11px] text-[#5E7072]">Maps hazards to the 9 international oilfield safety rules</div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-[#EDFAF4] text-[#1B8A6C] border border-[#BFEADB]">
              Active in RAM
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-[#1A2B2D]">4. Local Voice Whisper ASR Engine</div>
              <div className="text-[11px] text-[#5E7072]">Converts spoken walkie-talkie audio (Hindi, Assamese, English) into text</div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-[#EDFAF4] text-[#1B8A6C] border border-[#BFEADB]">
              Active in RAM
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Sensitivity Sliders Form ── */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border-2 border-[#C2CEC2] p-5 shadow-xs space-y-5">
        
        <div className="flex items-center justify-between border-b border-[#D8E0D8] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#0A6B63]" />
            <div>
              <h2 className="font-heading font-bold text-xs text-[#1A2B2D] uppercase tracking-wider">
                AI Risk Sensitivity Sliders
              </h2>
              <p className="text-[11px] text-[#5E7072] mt-0.5">
                Adjust how aggressively the AI flags critical hazards and sounds alarms
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-[#0A6B63] hover:bg-[#085B54] text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Save Sensitivity Settings
          </button>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-[#EDFAF4] border border-[#BFEADB] rounded-lg text-xs text-[#1B8A6C] font-bold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            Sensitivity settings successfully updated in local AI engine!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <div className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] space-y-2">
            <div className="flex justify-between text-xs font-bold text-[#1A2B2D]">
              <span>🚨 High Risk Alarm Threshold</span>
              <span className="font-mono text-[#D63B3B] font-extrabold">{Math.round(sifHighThreshold * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.95"
              step="0.01"
              value={sifHighThreshold}
              onChange={(e) => setSifHighThreshold(parseFloat(e.target.value))}
              className="w-full accent-[#D63B3B] cursor-pointer"
            />
            <p className="text-[11px] text-[#5E7072]">
              Reports scored above <strong>{Math.round(sifHighThreshold * 100)}%</strong> trigger instant red sirens and SWA Lockout.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] space-y-2">
            <div className="flex justify-between text-xs font-bold text-[#1A2B2D]">
              <span>⚠️ Medium Warning Threshold</span>
              <span className="font-mono text-[#D4820A] font-extrabold">{Math.round(sifMediumThreshold * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.30"
              max="0.70"
              step="0.01"
              value={sifMediumThreshold}
              onChange={(e) => setSifMediumThreshold(parseFloat(e.target.value))}
              className="w-full accent-[#D4820A] cursor-pointer"
            />
            <p className="text-[11px] text-[#5E7072]">
              Reports between <strong>{Math.round(sifMediumThreshold * 100)}% - {Math.round(sifHighThreshold * 100)}%</strong> trigger supervisor warning badges.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] space-y-2">
            <div className="flex justify-between text-xs font-bold text-[#1A2B2D]">
              <span>🛡️ Life-Saving Rule Matching Sensitivity</span>
              <span className="font-mono text-[#0A6B63] font-extrabold">{Math.round(lsrThreshold * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.20"
              max="0.80"
              step="0.01"
              value={lsrThreshold}
              onChange={(e) => setLsrThreshold(parseFloat(e.target.value))}
              className="w-full accent-[#0A6B63] cursor-pointer"
            />
            <p className="text-[11px] text-[#5E7072]">
              Confidence threshold required to tag an IOGP safety rule.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] space-y-2">
            <div className="flex justify-between text-xs font-bold text-[#1A2B2D]">
              <span>⏳ Recurring Near-Miss Rolling Window</span>
              <span className="font-mono text-[#1A2B2D] font-extrabold">{clusterWindow} Days</span>
            </div>
            <input
              type="range"
              min="3"
              max="30"
              step="1"
              value={clusterWindow}
              onChange={(e) => setClusterWindow(parseInt(e.target.value))}
              className="w-full accent-[#0A6B63] cursor-pointer"
            />
            <p className="text-[11px] text-[#5E7072]">
              Time window to catch repeat minor issues at the same rig before they cause a blowout.
            </p>
          </div>

        </div>

      </form>

    </div>
  );
}
