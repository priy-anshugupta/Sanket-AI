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

const API = 'http://localhost:8000';

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
    report: 'Slight drilling mud fluid loss (15 bbls) observed during pipe tripping. Mud weight maintained at 1.18 SG.',
    sif_score: 0.22,
    sif_label: 'LOW',
    energy_type: 'Hydrostatic Pressure',
    barrier: 'Drilling Mud Column',
    status: 'NORMAL',
    multiplier_event: false,
    legacy_action: 'Logged as minor fluid top-up in paper shift register. Operations continued normally without testing return flow.',
    sanket_action: 'Baselined baseline hydrostatic loss. Initiated low-priority automated mud weight monitoring tracking.',
    counterfactual: 'Initial precursor identified. No shutdown needed yet, but flagged as Stage-1 watch condition.',
    lives_at_stake: 0,
  },
  {
    day: -10,
    date: '2020-05-17',
    report: 'Annular pressure fluctuation of 80 PSI logged on BOP manifold. Secondary pressure gauge needle vibrating violently.',
    sif_score: 0.58,
    sif_label: 'MEDIUM',
    energy_type: 'Pneumatic / Reservoir Gas',
    barrier: 'BOP Pressure Monitoring & Transducers',
    status: 'WARNING',
    multiplier_event: false,
    legacy_action: 'Gauge glass wiped clean. Supervisor assumed vibration was caused by mud pump harmonics and deferred calibration.',
    sanket_action: 'Correlated pressure fluctuation with Day -14 mud loss. Elevated SIF risk from 0.22 → 0.58 and flagged secondary barrier degradation.',
    counterfactual: 'Early warning dispatched to Toolpusher requiring manifold pressure recalibration before next tripping sequence.',
    lives_at_stake: 0,
  },
  {
    day: -6,
    date: '2020-05-21',
    report: 'Gas bubble surging observed in cellar pit during kill-line valve test. Strong methane vapor odor detected by floor hands.',
    sif_score: 0.68,
    sif_label: 'MEDIUM',
    energy_type: 'Flammable Gas Reservoir',
    barrier: 'Kill Line Isolation Valve',
    status: 'ELEVATED RISK',
    multiplier_event: true,
    legacy_action: 'Cellar pit flushed with fresh water. No SWA called; workover crew instructed to speed up tubing removal to finish shift.',
    sanket_action: 'Detected active gas migration into cellar pit. Multiplier activated (3 correlated precursors in 7 days). Flagged critical LSR Rule #1 Violation.',
    counterfactual: 'Triggered Yellow Alert. System generated automated work permit freeze warning for non-essential personnel.',
    lives_at_stake: 6,
  },
  {
    day: -3,
    date: '2020-05-24',
    report: 'CRITICAL PRECURSOR: BOP annular blind ram hydraulic actuator leaking fluid. Temporary mechanical valve bypass fitted without MOC approval.',
    sif_score: 0.96,
    sif_label: 'HIGH',
    energy_type: 'High Pressure Gas Kick (1800 PSI)',
    barrier: 'Blowout Preventer (BOP) Actuator & Barrier Management',
    status: 'SIF PRECURSOR TRIGGER',
    multiplier_event: true,
    legacy_action: 'Workover continued using uncertified mechanical bypass while waiting for replacement hydraulic seals from Duliajan store.',
    sanket_action: '🚨 AUTONOMOUS STOP WORK AUTHORITY (SWA) EXECUTED: Multi-barrier cascade confirmed (0.96 SIF). Locked all active work permits, triggered acoustic siren, and ordered immediate heavy brine well-kill circulation!',
    counterfactual: '🛑 BLOWOUT FULLY AVERTED 5 DAYS EARLY! Heavy mud pumped, well stabilized, and all 24 personnel safely secured.',
    lives_at_stake: 24,
  },
  {
    day: 0,
    date: '2020-05-27',
    report: 'HISTORIC BLOWOUT DISASTER: Uncontrolled gas and condensate geyser erupted from wellhead at 1800 PSI during tubing pulling. Full blowout occurred.',
    sif_score: 1.00,
    sif_label: 'CATASTROPHIC',
    energy_type: 'Uncontrolled Explosive Blowout',
    barrier: 'ALL PHYSICAL BARRIERS DESTROYED',
    status: 'DISASTER OCCURRED',
    multiplier_event: true,
    legacy_action: 'Rig abandoned in panic. Gas erupted 40 meters into the sky for 14 days before catching fire on June 9.',
    sanket_action: 'Prevented in SANKET AI simulation by Day -3 intervention.',
    counterfactual: 'In 2020 without SANKET: 3 Firefighters killed, 9,000 residents displaced, ₹580 Crores economic & environmental loss.',
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
    return () => clearTimeout(timer);
  }, [isPlaying, activeIdx, playbackSpeed]);

  const activeEvent = HISTORIC_BAGHJAN_TIMELINE[activeIdx];
  const isInterventionDay = activeEvent.day === -3;
  const isBlowoutDay = activeEvent.day === 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-[#F1F5F9]/70 min-h-screen">
      
      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-md text-white font-bold">
              <History className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
                  Baghjan 2020 Disaster Replay & Counterfactual AI
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                  REAL PSU DISASTER REPLAY
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Proves how SANKET·AI detects cascading barrier breakdown signals 14 days before the Well #5 blowout
              </p>
            </div>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeIdx >= HISTORIC_BAGHJAN_TIMELINE.length - 1) setActiveIdx(0);
              setIsPlaying(!isPlaying);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-heading font-extrabold shadow-md transition-all cursor-pointer ${
              isPlaying 
                ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            {isPlaying ? 'Pause Timeline' : '▶ Auto-Play 14-Day Replay'}
          </button>

          <button
            onClick={() => { setIsPlaying(false); setActiveIdx(0); }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Reset Timeline to Day -14"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── HERO TIMELINE SCRUBBER RIBBON (Interactive Horizontal Bar) ── */}
      <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-900">
              14-Day Precursor Progression Scrubber (May 13 – May 27, 2020)
            </span>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200">
            Selected: <strong className="text-slate-900 font-mono">Day {activeEvent.day} ({activeEvent.date})</strong>
          </span>
        </div>

        {/* 5-Node Interactive Stepper */}
        <div className="grid grid-cols-5 gap-2 relative">
          {HISTORIC_BAGHJAN_TIMELINE.map((evt, idx) => {
            const isSelected = idx === activeIdx;
            const isHigh = evt.sif_score >= 0.75;
            const isMed = evt.sif_score >= 0.5 && evt.sif_score < 0.75;

            return (
              <button
                key={idx}
                onClick={() => { setIsPlaying(false); setActiveIdx(idx); }}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-[1.03] z-10 ring-4 ring-blue-500/20'
                    : isHigh
                    ? 'bg-red-50/70 border-red-200 hover:bg-red-100 text-red-950'
                    : isMed
                    ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100 text-amber-950'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                {evt.day === -3 && (
                  <span className="absolute -top-2.5 right-2 px-1.5 py-0.2 bg-red-600 text-white text-[8px] font-mono font-black rounded-full uppercase tracking-tight shadow-xs animate-bounce">
                    AI SWA LOCKOUT
                  </span>
                )}

                <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                  <span className={isSelected ? 'text-amber-400' : 'text-slate-500'}>
                    DAY {evt.day === 0 ? '0 (BLOWOUT)' : evt.day}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded font-mono font-black ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : isHigh
                      ? 'bg-red-200 text-red-900'
                      : isMed
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-emerald-200 text-emerald-900'
                  }`}>
                    SIF {evt.sif_score.toFixed(2)}
                  </span>
                </div>

                <div className={`text-xs font-extrabold truncate mt-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {evt.barrier.split(' ')[0]} {evt.barrier.split(' ')[1] || ''}
                </div>

                <div className={`text-[10px] font-mono truncate mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {evt.date}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── DUAL REALITY COMPARISON GRID (The Heart of the Demonstration) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: REALITY IN 2020 WITHOUT SANKET (DISASTER OCCURRED) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border-2 border-red-300 shadow-lg overflow-hidden flex flex-col justify-between">
          <div>
            {/* Top Red Header */}
            <div className="px-5 py-3.5 bg-red-600 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 fill-white" />
                <h3 className="font-heading font-black text-xs uppercase tracking-wider">
                  Reality in May 2020: Legacy System (No AI)
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-red-950/40 px-2 py-0.5 rounded text-red-100">
                PAPER & EXCEL LOGS
              </span>
            </div>

            <div className="p-5 space-y-4">
              
              {/* Historical Incident Shift Log */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="text-[10px] font-mono font-bold uppercase text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Historical Shift Observation (Day {activeEvent.day} · {activeEvent.date}):
                </div>
                <p className="text-sm font-bold text-slate-900 leading-relaxed italic">
                  "{activeEvent.report}"
                </p>
              </div>

              {/* Barrier Breakdown Meta */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-red-50/60 border border-red-200">
                  <div className="text-[10px] font-mono text-red-700 font-bold uppercase">Degraded Physical Barrier</div>
                  <div className="font-extrabold text-red-950 mt-1">{activeEvent.barrier}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-mono text-slate-500 font-bold uppercase">Energy Source Involved</div>
                  <div className="font-extrabold text-slate-900 mt-1">{activeEvent.energy_type}</div>
                </div>
              </div>

              {/* What Legacy Management Did */}
              <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200 space-y-1.5">
                <div className="text-[10px] font-mono font-black uppercase text-red-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  What Actually Happened in 2020:
                </div>
                <p className="text-xs text-red-950 font-bold leading-relaxed">
                  {activeEvent.legacy_action}
                </p>
              </div>

            </div>
          </div>

          {/* Bottom Reality Footer */}
          <div className="px-5 py-3 bg-red-100/70 border-t border-red-200 text-xs font-bold text-red-900 flex items-center justify-between">
            <span>Historical Result:</span>
            <span className="font-mono font-black text-red-950">BLOWOUT & EXPLOSION ON MAY 27 (14-DAY FIRE)</span>
          </div>
        </div>

        {/* RIGHT COLUMN: SANKET·AI REVOLUTION (DISASTER PREVENTED) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border-2 border-emerald-400 shadow-xl overflow-hidden flex flex-col justify-between">
          <div>
            {/* Top Emerald Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-heading font-black text-xs uppercase tracking-wider text-white">
                  Counterfactual Reality: With SANKET·AI
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                AUTONOMOUS SAFETY DEFENSE
              </span>
            </div>

            <div className="p-5 space-y-4">
              
              {/* AI SIF Score & Multiplier Badge */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white shadow-md">
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Neural SIF Precursor Score</div>
                  <div className="font-mono text-2xl font-black mt-0.5 text-amber-400">
                    {activeEvent.sif_score.toFixed(2)} / 1.00 ({activeEvent.sif_label})
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black ${
                    activeEvent.sif_score >= 0.75 
                      ? 'bg-red-600 text-white animate-pulse' 
                      : activeEvent.sif_score >= 0.5 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {activeEvent.sif_score >= 0.75 ? '🚨 HIGH SIF TRIGGER' : 'MONITORING'}
                  </span>
                </div>
              </div>

              {/* What SANKET AI Does */}
              <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 space-y-1.5 shadow-2xs">
                <div className="text-[10px] font-mono font-black uppercase text-emerald-800 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  SANKET AI Autonomous Action on Day {activeEvent.day}:
                </div>
                <p className="text-xs text-emerald-950 font-bold leading-relaxed">
                  {activeEvent.sanket_action}
                </p>
              </div>

              {/* Counterfactual Impact Note */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <div className="text-[10px] font-mono font-bold uppercase text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Counterfactual Outcome:
                </div>
                <p className="font-bold text-slate-900 leading-relaxed">
                  {activeEvent.counterfactual}
                </p>
              </div>

            </div>
          </div>

          {/* Bottom Success Action Bar */}
          <div className="px-5 py-3 bg-emerald-600 text-white text-xs font-bold flex items-center justify-between shadow-md">
            <span>SANKET Counterfactual Result:</span>
            <span className="font-mono font-black">
              {activeIdx >= 3 ? '✅ BLOWOUT AVERTED 5 DAYS EARLY (MAY 24)' : 'PRE-CURSORS TRACKED IN REAL TIME'}
            </span>
          </div>
        </div>

      </div>

      {/* ── CUMULATIVE VALUE METRIC SCOREBOARD (Why SANKET Saves Oil India) ── */}
      <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-slate-900">
              Total Impact Metrics Prevented at Baghjan Well #5
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            PROVEN PSU RECOVERY
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5 text-red-600" /> Human Lives Protected
            </div>
            <div className="font-mono text-2xl font-black text-slate-900 mt-1">
              3 Firefighters
            </div>
            <div className="text-[10px] text-emerald-700 font-bold mt-0.5">Zero Fatalities with SANKET</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-600" /> PSU Asset & Financial Loss
            </div>
            <div className="font-mono text-2xl font-black text-slate-900 mt-1">
              ₹580 Crores
            </div>
            <div className="text-[10px] text-emerald-700 font-bold mt-0.5">Rig, Well-Kill & Compensation Saved</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center gap-1">
              <TreePine className="w-3.5 h-3.5 text-emerald-600" /> Environmental Ecology
            </div>
            <div className="font-mono text-2xl font-black text-slate-900 mt-1">
              10,000 Hectares
            </div>
            <div className="text-[10px] text-emerald-700 font-bold mt-0.5">Dibru-Saikhowa National Park Preserved</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Early Warning Window
            </div>
            <div className="font-mono text-2xl font-black text-slate-900 mt-1">
              5 Full Days
            </div>
            <div className="text-[10px] text-emerald-700 font-bold mt-0.5">Intervened on May 24 vs May 27 Blowout</div>
          </div>

        </div>
      </div>

    </div>
  );
}
