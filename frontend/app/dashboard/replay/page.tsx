'use client';

import { useState, useEffect } from 'react';

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
  const color = label === 'CRITICAL' || label === 'ACTUAL' ? 'text-red-600 bg-red-50 border-red-200'
    : label === 'HIGH' ? 'text-red-600 bg-red-50 border-red-200'
    : label === 'MEDIUM' ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-emerald-700 bg-emerald-50 border-emerald-200';

  return (
    <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded border ${color}`}>
      {score.toFixed(2)}
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
    const timer = setTimeout(() => setActiveIdx(i => i + 1), 2500);
    return () => clearTimeout(timer);
  }, [isPlaying, activeIdx, events.length]);

  const activeEvent = events[activeIdx];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-900 text-white">
            ⏪ TIME MACHINE
          </span>
        </div>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Baghjan 2020 Disaster Replay
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Interactive timeline showing how SANKET·AI detects cascading precursor signals 14 days before the Well #5 blowout.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading replay data...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Timeline</h3>
                <button
                  onClick={() => { setIsPlaying(!isPlaying); if (!isPlaying && activeIdx >= events.length - 1) setActiveIdx(0); }}
                  className="px-3 py-1 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800"
                >
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
              </div>

              <div className="space-y-1">
                {events.map((event, idx) => {
                  const isActive = idx === activeIdx;
                  const isPast = idx < activeIdx;
                  const statusColors: Record<string, string> = {
                    routine: 'border-emerald-400',
                    warning: 'border-amber-400',
                    critical: 'border-red-500',
                    multiplier: 'border-red-600',
                    disaster: 'border-red-800',
                  };

                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveIdx(idx)}
                      className={`w-full text-left p-3 rounded-lg border-l-4 transition-all ${
                        statusColors[event.status] || 'border-gray-300'
                      } ${isActive ? 'bg-gray-50 shadow-sm' : isPast ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-gray-600">
                          Day {event.day > 0 ? event.day : event.day}
                        </span>
                        <ScoreBadge score={event.sif_score} label={event.sif_label} />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{event.date}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2">
            {activeEvent && (
              <div className={`rounded-xl border-2 p-6 transition-all ${
                activeEvent.status === 'disaster' ? 'border-red-500 bg-red-50'
                : activeEvent.status === 'multiplier' ? 'border-red-400 bg-red-50/50'
                : activeEvent.status === 'critical' ? 'border-red-300 bg-white'
                : activeEvent.status === 'warning' ? 'border-amber-300 bg-white'
                : 'border-gray-200 bg-white'
              }`}>
                {/* Event Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    activeEvent.status === 'disaster' ? 'bg-red-600 text-white'
                    : activeEvent.status === 'multiplier' ? 'bg-red-500 text-white animate-pulse-red'
                    : activeEvent.status === 'critical' ? 'bg-red-500 text-white'
                    : activeEvent.status === 'warning' ? 'bg-amber-500 text-white'
                    : 'bg-emerald-500 text-white'
                  }`}>
                    Day {activeEvent.day}
                  </div>
                  <span className="font-mono text-sm text-gray-500">{activeEvent.date}</span>
                  <ScoreBadge score={activeEvent.sif_score} label={activeEvent.sif_label} />
                </div>

                {/* Report Text */}
                <p className="text-lg text-gray-900 mb-6 leading-relaxed font-medium">
                  &ldquo;{activeEvent.report}&rdquo;
                </p>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Energy Type</div>
                    <div className="text-sm font-medium text-gray-900">{activeEvent.energy_type}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Barrier Status</div>
                    <div className="text-sm font-medium text-gray-900">{activeEvent.barrier}</div>
                  </div>
                </div>

                {/* Score Gauge */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>SIF Score</span>
                    <span className="font-mono font-bold">{activeEvent.sif_score.toFixed(2)}</span>
                  </div>
                  <div className="score-bar">
                    <div
                      className="score-bar-fill"
                      style={{
                        width: `${activeEvent.sif_score * 100}%`,
                        backgroundColor: activeEvent.sif_score >= 0.75 ? '#DC2626'
                          : activeEvent.sif_score >= 0.50 ? '#D97706' : '#16A34A',
                      }}
                    />
                  </div>
                </div>

                {/* Multiplier Alert */}
                {activeEvent.multiplier_event && (
                  <div className="p-4 rounded-lg bg-red-100 border border-red-300 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-red-600 font-bold text-sm">🚨 NEAR-MISS MULTIPLIER FIRED</span>
                    </div>
                    <p className="text-sm text-red-800">{activeEvent.recommendation}</p>
                  </div>
                )}

                {/* Counterfactual */}
                {activeEvent.counterfactual && (
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="text-sm font-semibold text-emerald-800 mb-1">✅ SANKET Counterfactual</div>
                    <p className="text-sm text-emerald-700">{activeEvent.counterfactual}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
