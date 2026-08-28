'use client';

import { useState, useEffect } from 'react';
import { History, Play, Pause, AlertOctagon, Flame, ShieldAlert, CheckCircle2, ArrowRight, Zap, Info } from 'lucide-react';

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
  recommendation?: string;
  counterfactual?: string;
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const isHigh = score >= 0.75;
  const isMed = score >= 0.50 && score < 0.75;

  return (
    <span className={`font-mono text-xs font-black px-2 py-0.5 rounded border ${
      isHigh ? 'bg-red-100 text-red-900 border-red-300' : isMed ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300'
    }`}>
      SIF {score.toFixed(2)}
    </span>
  );
}

export default function BaghjanReplayPage() {
  const [events, setEvents] = useState<BaghjanEvent[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/analytics/replay/baghjan`)
      .then(r => r.json())
      .then(d => { setEvents(d.events || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Auto-play timeline
  useEffect(() => {
    if (!isPlaying || activeIdx >= events.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => setActiveIdx(i => i + 1), 3000);
    return () => clearTimeout(timer);
  }, [isPlaying, activeIdx, events.length]);

  const activeEvent = events[activeIdx];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-[#F1F5F9]/70 min-h-screen">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-md text-white font-bold">
              <History className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
                  Baghjan 2020 Disaster Replay
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  TIME-MACHINE SIMULATION
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Demonstrates how SANKET·AI detects cascading barrier breakdown signals 14 days before the Well #5 blowout
              </p>
            </div>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { setIsPlaying(!isPlaying); if (!isPlaying && activeIdx >= events.length - 1) setActiveIdx(0); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all ${
              isPlaying 
                ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            {isPlaying ? 'Pause Simulation' : '▶ Play 14-Day Timeline'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-mono text-xs animate-pulse">
          Loading Baghjan 2020 historical incident cascade data...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Timeline List (4 Cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shadow-sm">
              <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-white">
                14-Day Incident Timeline
              </h3>
              <span className="text-[10px] font-mono text-slate-400">May 2020</span>
            </div>

            <div className="p-3 space-y-1.5 max-h-[580px] overflow-y-auto bg-slate-50/50">
              {events.map((event, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveIdx(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      isActive 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]' 
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          isActive ? 'bg-slate-700 text-amber-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          Day {event.day}
                        </span>
                        <span className={`text-[11px] font-semibold truncate ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>
                          {event.date}
                        </span>
                      </div>
                      <p className={`text-xs font-bold truncate mt-1 ${isActive ? 'text-white' : 'text-slate-900'}`}>
                        {event.report}
                      </p>
                    </div>

                    <ScoreBadge score={event.sif_score} label={event.sif_label} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Investigation Panel (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {activeEvent && (
              <div className={`bg-white rounded-2xl border-2 shadow-md overflow-hidden transition-all ${
                activeEvent.status === 'disaster' ? 'border-red-600' : 'border-slate-300'
              }`}>
                {/* Header */}
                <div className={`px-6 py-3.5 text-white flex items-center justify-between ${
                  activeEvent.status === 'disaster' ? 'bg-red-700' : 'bg-slate-900'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded bg-white/20 text-white text-[11px] font-mono font-black">
                      DAY {activeEvent.day}
                    </span>
                    <span className="font-heading font-extrabold text-xs uppercase tracking-wider">
                      {activeEvent.date} · Well Pad Investigation
                    </span>
                  </div>
                  <ScoreBadge score={activeEvent.sif_score} label={activeEvent.sif_label} />
                </div>

                <div className="p-6 space-y-5">
                  {/* Observation Quote */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-1">
                    <div className="text-[10px] font-mono uppercase font-bold text-slate-500">Historical Shift Hazard Log</div>
                    <p className="text-sm text-slate-900 font-bold leading-relaxed">
                      "{activeEvent.report}"
                    </p>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                      <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Failed Safety Barrier</div>
                      <div className="font-bold text-red-700 mt-0.5">{activeEvent.barrier || 'Primary Hydrostatic Barrier'}</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                      <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Energy Source Involved</div>
                      <div className="font-bold text-slate-800 mt-0.5">{activeEvent.energy_type || 'High-Pressure Hydrocarbon Gas'}</div>
                    </div>
                  </div>

                  {/* Counterfactual Insight: What SANKET·AI Would Have Done */}
                  <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-2 text-emerald-900 font-heading font-extrabold text-xs uppercase">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      SANKET·AI Preventative Counterfactual Intervention
                    </div>
                    <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                      {activeEvent.counterfactual || 'Automated SIF scoring triggers early Stop Work Authority on Day 7, requiring secondary BOP inspection before tripping and averting the Day 14 blowout disaster.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
