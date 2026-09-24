'use client';

import { useState, useEffect } from 'react';
import { 
  History, 
  Play, 
  Pause, 
  AlertOctagon, 
  Flame, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Info, 
  RotateCcw, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  Building2, 
  HeartHandshake, 
  TreePine, 
  Sparkles, 
  Radio, 
  PhoneCall, 
  FileText,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { getApiBase } from '@/lib/config';

const API = getApiBase();

interface BaghjanEvent {
  day: number;
  date: string;
  report: string;
  sif_score: number;
  sif_label: string;
  energy_type: string;
  barrier: string;
  status: string;
  multiplier_event?: boolean;
  legacy_action: string;
  sanket_action: string;
  counterfactual: string;
  lives_at_stake: number;
}

const HISTORIC_BAGHJAN_TIMELINE: BaghjanEvent[] = [
  {
    day: -14,
    date: '2020-05-13',
    report: 'Minor drilling mud fluid leak detected during drill pipe extraction.',
    sif_score: 0.22,
    sif_label: 'LOW',
    energy_type: 'Underground Well Pressure',
    barrier: 'Drilling Mud Column',
    status: 'NORMAL',
    multiplier_event: false,
    legacy_action: 'Logged as minor fluid top-up in paper shift register. Drilling continued normally without return flow testing.',
    sanket_action: 'Flagged initial fluid loss as Stage-1 precursor. Initiated automated barrier tracking (Low Risk: 0.22 SIF).',
    counterfactual: 'Early precursor detected. No shutdown needed yet, but flagged on the dashboard watch-list.',
    lives_at_stake: 0,
  },
  {
    day: -10,
    date: '2020-05-17',
    report: 'Pressure surged by 80 PSI on BOP manifold. Safety gauge needle shaking violently.',
    sif_score: 0.58,
    sif_label: 'MEDIUM',
    energy_type: 'Pressurized Reservoir Gas',
    barrier: 'BOP Pressure Monitoring',
    status: 'WARNING',
    multiplier_event: false,
    legacy_action: 'Gauge glass wiped clean. Supervisor assumed vibration was pump vibration and deferred sensor calibration.',
    sanket_action: 'Correlated pressure surge with Day -14 mud loss. Elevated SIF danger score to 0.58 (Medium Risk) and flagged barrier degradation.',
    counterfactual: 'Early warning sent to Toolpusher requiring pressure test and sensor calibration before further drilling.',
    lives_at_stake: 0,
  },
  {
    day: -6,
    date: '2020-05-21',
    report: 'Methane gas bubbles and strong odor detected directly beneath the rig floor in cellar pit.',
    sif_score: 0.68,
    sif_label: 'MEDIUM',
    energy_type: 'Flammable Gas Reservoir',
    barrier: 'Kill-Line Isolation Valve',
    status: 'ELEVATED RISK',
    multiplier_event: true,
    legacy_action: 'Cellar pit flushed with water. No Stop Work called; crew instructed to rush pipe removal to finish shift.',
    sanket_action: 'Detected active gas migration beneath rig floor. Multiplier activated (3 precursors in 7 days). Flagged IOGP Rule #1 violation.',
    counterfactual: 'Issued Yellow Alert. Triggered automated permit freeze warning for all non-essential personnel.',
    lives_at_stake: 6,
  },
  {
    day: -3,
    date: '2020-05-24',
    report: 'CRITICAL PRECURSOR: Blowout Preventer leaking hydraulic oil. Unapproved makeshift bypass fitted to keep working.',
    sif_score: 0.96,
    sif_label: 'HIGH',
    energy_type: 'High-Pressure Gas Surge (1800 PSI)',
    barrier: 'Blowout Preventer (BOP) Barrier',
    status: 'SIF PRECURSOR TRIGGER',
    multiplier_event: true,
    legacy_action: 'Work continued with uncertified bypass while waiting days for replacement seals from warehouse.',
    sanket_action: '🚨 AUTONOMOUS STOP WORK AUTHORITY (SWA) EXECUTED: Multi-barrier cascade confirmed (0.96 SIF). Locked all digital work permits, triggered acoustic siren, and ordered immediate heavy brine well-kill circulation!',
    counterfactual: '🛑 BLOWOUT FULLY AVERTED 5 DAYS EARLY! Well killed and stabilized, and all 24 rig crew members safely evacuated.',
    lives_at_stake: 24,
  },
  {
    day: 0,
    date: '2020-05-27',
    report: 'HISTORIC BLOWOUT DISASTER: Uncontrolled 1800 PSI gas eruption from wellhead. Massive blowout occurred without AI.',
    sif_score: 1.00,
    sif_label: 'CATASTROPHIC',
    energy_type: 'Uncontrolled Explosive Blowout',
    barrier: 'ALL PHYSICAL BARRIERS DESTROYED',
    status: 'DISASTER OCCURRED',
    multiplier_event: true,
    legacy_action: 'Rig abandoned in panic. Gas erupted 40 meters into the sky for 14 days before catching fire on June 9.',
    sanket_action: 'Disaster completely averted on Day -3 by SANKET AI early intervention.',
    counterfactual: 'In 2020 without SANKET AI: 3 Firefighters died, 9,000 residents displaced, ₹580 Crores economic & ecological loss.',
    lives_at_stake: 27,
  },
];

export default function BaghjanReplayPage() {
  const [activeIdx, setActiveIdx] = useState(3); // Default to Day -3 where AI intervenes!
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(3000);

  // Auto-play timeline loop
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      setActiveIdx(prev => {
        if (prev >= HISTORIC_BAGHJAN_TIMELINE.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeed);
  }, [isPlaying, activeIdx, playbackSpeed]);

  const activeEvent = HISTORIC_BAGHJAN_TIMELINE[activeIdx];

  return (
    <div className="dashboard-page space-y-5 p-6 bg-[#F7F8F5] min-h-screen text-[#1A2B2D]">
      
      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-bold text-xl text-[#1A2B2D] tracking-tight">
              Baghjan 2020 Disaster Replay: Reality vs SANKET AI
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FDF2F2] text-[#D63B3B] border border-[#F5C6C6]">
              Historical Disaster Simulation
            </span>
          </div>
          <p className="text-[13px] text-[#5E7072] mt-0.5 font-normal">
            Proves how SANKET AI detects cascading barrier breakdown signals 14 days before the Well #5 blowout
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button type="button" suppressHydrationWarning
            onClick={() => {
              if (activeIdx >= HISTORIC_BAGHJAN_TIMELINE.length - 1) setActiveIdx(0);
              setIsPlaying(!isPlaying);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer ${
              isPlaying 
                ? 'bg-[#D4820A] text-white' 
                : 'bg-[#0A6B63] hover:bg-[#085B54] text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            {isPlaying ? 'Pause Timeline' : 'Auto-Play 14-Day Replay'}
          </button>

          <button type="button" suppressHydrationWarning
            onClick={() => { setIsPlaying(false); setActiveIdx(0); }}
            className="p-1.5 rounded-lg bg-white hover:bg-[#F0F2ED] text-[#5E7072] border border-[#C2CEC2] transition-colors cursor-pointer"
            title="Reset Timeline to Day -14"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── HERO TIMELINE SCRUBBER RIBBON ── */}
      <div className="bg-white p-4 rounded-xl border-2 border-[#C2CEC2] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#0A6B63]" />
            <span className="text-xs font-heading font-bold uppercase tracking-wider text-[#1A2B2D]">
              14-Day Precursor Progression (May 13 – May 27, 2020)
            </span>
          </div>
          <span className="text-xs font-mono font-semibold bg-[#F0F2ED] text-[#1A2B2D] px-2.5 py-0.5 rounded-md border border-[#C2CEC2]">
            Selected: Day {activeEvent.day} ({activeEvent.date})
          </span>
        </div>

        {/* 5-Node Interactive Stepper */}
        <div className="grid grid-cols-5 gap-2 relative">
          {HISTORIC_BAGHJAN_TIMELINE.map((evt, idx) => {
            const isSelected = idx === activeIdx;
            const isHigh = evt.sif_score >= 0.75;
            const isMed = evt.sif_score >= 0.5 && evt.sif_score < 0.75;

            return (
              <button type="button" suppressHydrationWarning
                key={idx}
                onClick={() => { setIsPlaying(false); setActiveIdx(idx); }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#0A6B63] text-white border-[#0A6B63] shadow-xs'
                    : isHigh
                    ? 'bg-[#FDF2F2] border-[#F5C6C6] text-[#D63B3B]'
                    : isMed
                    ? 'bg-[#FEF7EC] border-[#F8DFB6] text-[#D4820A]'
                    : 'bg-[#F7F8F5] border-[#C2CEC2] hover:bg-[#F0F2ED] text-[#1A2B2D]'
                }`}
              >
                {evt.day === -3 && (
                  <span className="absolute -top-2 right-2 px-1.5 py-0.2 bg-[#D63B3B] text-white text-[8px] font-mono font-bold rounded-md uppercase tracking-tight shadow-xs">
                    AI SWA LOCKOUT
                  </span>
                )}

                <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                  <span className={isSelected ? 'text-[#E8F4F0]' : 'text-[#5E7072]'}>
                    DAY {evt.day === 0 ? '0 (BLOWOUT)' : evt.day}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded font-mono font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : isHigh
                      ? 'bg-[#F5C6C6] text-[#D63B3B]'
                      : isMed
                      ? 'bg-[#F8DFB6] text-[#D4820A]'
                      : 'bg-[#BFEADB] text-[#1B8A6C]'
                  }`}>
                    SIF {evt.sif_score.toFixed(2)}
                  </span>
                </div>

                <div className={`text-xs font-bold truncate mt-1 ${isSelected ? 'text-white' : 'text-[#1A2B2D]'}`}>
                  {evt.barrier.split(' ')[0]} {evt.barrier.split(' ')[1] || ''}
                </div>

                <div className={`text-[10px] font-mono truncate mt-0.5 ${isSelected ? 'text-[#E8F4F0]' : 'text-[#5E7072]'}`}>
                  {evt.date}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── DUAL REALITY COMPARISON GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* LEFT COLUMN: REALITY IN 2020 WITHOUT SANKET */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-[#F5C6C6] shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* Top Red Header */}
            <div className="px-4 py-2.5 bg-[#D63B3B] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4" />
                <h3 className="font-heading font-bold text-xs uppercase tracking-wider">
                  Reality in May 2020: Legacy System (No AI)
                </h3>
              </div>
              <span className="text-[10px] font-mono font-semibold bg-white/20 px-2 py-0.5 rounded text-white">
                PAPER & EXCEL LOGS
              </span>
            </div>

            <div className="p-4 space-y-3">
              
              {/* Historical Incident Shift Log */}
              <div className="p-3 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] space-y-1">
                <div className="text-[10px] font-semibold uppercase text-[#5E7072] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#5E7072]" />
                  Historical Shift Observation (Day {activeEvent.day} · {activeEvent.date}):
                </div>
                <p className="text-xs font-semibold text-[#1A2B2D] leading-relaxed italic">
                  "{activeEvent.report}"
                </p>
              </div>

              {/* Barrier Breakdown Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#FDF2F2] border border-[#F5C6C6]">
                  <div className="text-[10px] text-[#D63B3B] font-semibold uppercase">Degraded Barrier</div>
                  <div className="font-semibold text-[#1A2B2D] mt-0.5">{activeEvent.barrier}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2]">
                  <div className="text-[10px] text-[#5E7072] font-semibold uppercase">Energy Source</div>
                  <div className="font-semibold text-[#1A2B2D] mt-0.5">{activeEvent.energy_type}</div>
                </div>
              </div>

              {/* What Legacy Management Did */}
              <div className="p-3 rounded-lg bg-[#FDF2F2] border border-[#F5C6C6] space-y-1">
                <div className="text-[10px] font-bold uppercase text-[#D63B3B] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D63B3B]" />
                  What Actually Happened in 2020:
                </div>
                <p className="text-xs text-[#1A2B2D] leading-relaxed">
                  {activeEvent.legacy_action}
                </p>
              </div>

            </div>
          </div>

          {/* Bottom Reality Footer */}
          <div className="px-4 py-2.5 bg-[#FDF2F2] border-t border-[#F5C6C6] text-xs font-semibold text-[#D63B3B] flex items-center justify-between">
            <span>Historical Result:</span>
            <span className="font-mono font-bold">BLOWOUT & EXPLOSION (14-DAY FIRE)</span>
          </div>
        </div>

        {/* RIGHT COLUMN: SANKET AI REVOLUTION */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-[#BCE3DC] shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* Top Emerald Header */}
            <div className="px-4 py-2.5 bg-[#0A6B63] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-white" />
                <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-white">
                  Predictive Defense: With SANKET AI
                </h3>
              </div>
              <span className="text-[10px] font-mono font-semibold bg-white/20 text-white px-2 py-0.5 rounded">
                AUTONOMOUS SAFETY DEFENSE
              </span>
            </div>

            <div className="p-4 space-y-3">
              
              {/* AI SIF Score */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2]">
                <div>
                  <div className="text-[10px] font-semibold uppercase text-[#5E7072]">Neural SIF Risk Score</div>
                  <div className="font-heading text-xl font-bold mt-0.5 text-[#0A6B63]">
                    {activeEvent.sif_score.toFixed(2)} / 1.00 ({activeEvent.sif_label})
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                    activeEvent.sif_score >= 0.75 
                      ? 'bg-[#FDF2F2] text-[#D63B3B] border border-[#F5C6C6]' 
                      : activeEvent.sif_score >= 0.5 
                      ? 'bg-[#FEF7EC] text-[#D4820A] border border-[#F8DFB6]' 
                      : 'bg-[#EDFAF4] text-[#1B8A6C] border border-[#BFEADB]'
                  }`}>
                    {activeEvent.sif_score >= 0.75 ? 'HIGH SIF TRIGGER' : 'MONITORING'}
                  </span>
                </div>
              </div>

              {/* What SANKET AI Does */}
              <div className="p-3 rounded-lg bg-[#EDFAF4] border border-[#BFEADB] space-y-1">
                <div className="text-[10px] font-bold uppercase text-[#1B8A6C] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#1B8A6C]" />
                  SANKET AI Action on Day {activeEvent.day}:
                </div>
                <p className="text-xs text-[#1A2B2D] leading-relaxed">
                  {activeEvent.sanket_action}
                </p>
              </div>

              {/* Counterfactual Impact Note */}
              <div className="p-3 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] text-xs space-y-0.5">
                <div className="text-[10px] font-semibold uppercase text-[#5E7072] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#0A6B63]" /> Predicted Safety Outcome:
                </div>
                <p className="text-[#1A2B2D] leading-relaxed">
                  {activeEvent.counterfactual}
                </p>
              </div>

            </div>
          </div>

          {/* Bottom Success Action Bar */}
          <div className="px-4 py-2.5 bg-[#EDFAF4] border-t border-[#BFEADB] text-xs font-semibold text-[#1B8A6C] flex items-center justify-between">
            <span>SANKET Result:</span>
            <span className="font-mono font-bold">
              {activeIdx >= 3 ? 'BLOWOUT AVERTED 5 DAYS EARLY (MAY 24)' : 'PRECURSORS TRACKED IN REAL TIME'}
            </span>
          </div>
        </div>

      </div>

      {/* ── CUMULATIVE VALUE METRIC SCOREBOARD ── */}
      <div className="bg-white p-4 rounded-xl border-2 border-[#C2CEC2] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#D8E0D8] pb-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#0A6B63]" />
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1A2B2D]">
              Total Impact Metrics Prevented at Baghjan Well #5
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-[#1B8A6C] bg-[#EDFAF4] px-2 py-0.5 rounded-md border border-[#BFEADB]">
            PROVEN PSU VALUE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          <div className="p-3 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2]">
            <div className="text-[10px] font-medium text-[#5E7072] uppercase flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5 text-[#D63B3B]" /> Human Lives Protected
            </div>
            <div className="font-heading text-xl font-bold text-[#1A2B2D] mt-1">
              3 Firefighters
            </div>
            <div className="text-[10px] text-[#1B8A6C] font-medium mt-0.5">Zero Fatalities with SANKET</div>
          </div>

          <div className="p-3 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2]">
            <div className="text-[10px] font-medium text-[#5E7072] uppercase flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-[#0A6B63]" /> PSU Asset Loss Avoided
            </div>
            <div className="font-heading text-xl font-bold text-[#1A2B2D] mt-1">
              ₹580 Crores
            </div>
            <div className="text-[10px] text-[#1B8A6C] font-medium mt-0.5">Rig, Well-Kill & Compensation Saved</div>
          </div>

          <div className="p-3 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2]">
            <div className="text-[10px] font-medium text-[#5E7072] uppercase flex items-center gap-1">
              <TreePine className="w-3.5 h-3.5 text-[#1B8A6C]" /> Environmental Ecology
            </div>
            <div className="font-heading text-xl font-bold text-[#1A2B2D] mt-1">
              10,000 Hectares
            </div>
            <div className="text-[10px] text-[#1B8A6C] font-medium mt-0.5">Dibru-Saikhowa National Park Preserved</div>
          </div>

          <div className="p-3 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2]">
            <div className="text-[10px] font-medium text-[#5E7072] uppercase flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#D4820A]" /> Early Warning Window
            </div>
            <div className="font-heading text-xl font-bold text-[#1A2B2D] mt-1">
              5 Full Days
            </div>
            <div className="text-[10px] text-[#1B8A6C] font-medium mt-0.5">Intervened May 24 vs May 27 Blowout</div>
          </div>

        </div>
      </div>

    </div>
  );
}
