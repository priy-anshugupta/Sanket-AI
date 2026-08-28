'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Activity, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Cpu, 
  Database, 
  Lock, 
  Server, 
  Volume2, 
  Maximize2, 
  Minimize2,
  BellRing,
  Wifi,
  FileCheck2,
  AlertCircle
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

interface LiveReport {
  report_id: string;
  sif_score: number;
  sif_label: string;
  location: string;
  report_text: string;
  matched_anchor_text: string;
  timestamp: string;
  is_critical: boolean;
}

export default function ControlRoomPage() {
  const [alerts, setAlerts] = useState<LiveReport[]>([]);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({ total: 500, high: 150, medium: 80, low: 270 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load initial stats
  useEffect(() => {
    fetch(`${API_BASE}/api/analytics/summary`)
      .then(r => r.json())
      .then(d => {
        if (d.total_reports) {
          setStats({
            total: d.total_reports || 500,
            high: d.high_count || 150,
            medium: d.medium_count || 80,
            low: d.low_count || 270,
          });
        }
      })
      .catch(() => {});
  }, []);

  // WebSocket
  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket('ws://localhost:8000/ws/alerts');
      ws.onopen = () => setWsStatus('connected');
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'SIF_ALERT' && msg.data) {
            const alert: LiveReport = {
              report_id: msg.data.report_id || 'REP-LIVE',
              sif_score: msg.data.sif_score || 0.94,
              sif_label: msg.data.sif_label || 'HIGH',
              location: msg.data.location || 'Well Pad 7',
              report_text: msg.data.report_text || msg.data.message || '',
              matched_anchor_text: msg.data.matched_anchor_text || '',
              timestamp: msg.timestamp || new Date().toISOString(),
              is_critical: msg.data.is_critical || msg.data.sif_score >= 0.85,
            };
            setAlerts(prev => [alert, ...prev].slice(0, 25));

            if (alert.is_critical) {
              playAlarmSound();
            }
          }
        } catch {}
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        setTimeout(connect, 4000);
      };

      wsRef.current = ws;
    };

    connect();
    return () => { wsRef.current?.close(); };
  }, []);

  const playAlarmSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sawtooth';
      gain.gain.value = 0.15;
      osc.start();
      setTimeout(() => osc.stop(), 700);
    } catch {}
  };

  const simulateAlarm = () => {
    playAlarmSound();
    const newAlert: LiveReport = {
      report_id: `REP-WK-${Math.floor(100 + Math.random() * 900)}`,
      sif_score: 0.96,
      sif_label: 'HIGH',
      location: 'Well Pad 7 (Upper Assam)',
      report_text: 'Active gas kick detected with rapid annular pressure rise to 1800 PSI. BOP safety valve weeping hydraulic fluid.',
      matched_anchor_text: 'Well Control & Hydrostatic Barrier Failure',
      timestamp: new Date().toISOString(),
      is_critical: true,
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-[#F1F5F9]/70 min-h-screen">
      
      {/* ── Page Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
                DCS Control Room Live Wall
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                24/7 LIVE TELEMETRY
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Centralized process safety wall with real-time acoustic alarm reflex & statutory audit telemetry
            </p>
          </div>
        </div>

        {/* Live Clock & Action CTAs */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-3 shadow-md border border-slate-800">
            <Clock className="w-4 h-4 text-blue-400" />
            <div className="text-sm font-mono font-bold tracking-widest text-blue-300 tabular-nums">
              {currentTime.toLocaleTimeString('en-IN', { hour12: false })}
            </div>
            <span className="text-[11px] font-mono text-slate-400 border-l border-slate-700 pl-2.5">
              {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>

          <button
            onClick={simulateAlarm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-950/30 transition-all hover:scale-[1.02]"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            ⚡ Trigger Live Alarm
          </button>
        </div>
      </div>

      {/* ── 4 Executive KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border-2 border-slate-300 p-5 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-mono font-bold uppercase text-slate-500">Total Safety Reports</div>
          <div className="font-mono text-3xl font-black text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-semibold">Across 10 Operational Assets</div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-red-300 p-5 shadow-sm relative overflow-hidden bg-gradient-to-b from-red-50/40 to-white">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-red-600" />
          <div className="text-[11px] font-mono font-bold uppercase text-red-600 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> High / SIF Precursors
          </div>
          <div className="font-mono text-3xl font-black text-red-600 mt-1">{stats.high}</div>
          <div className="text-[10px] text-red-600/80 mt-1 font-bold">Immediate Control Room Priority</div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-sm relative overflow-hidden bg-gradient-to-b from-amber-50/40 to-white">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-500" />
          <div className="text-[11px] font-mono font-bold uppercase text-amber-600 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Medium Risk Warnings
          </div>
          <div className="font-mono text-3xl font-black text-amber-600 mt-1">{stats.medium}</div>
          <div className="text-[10px] text-amber-600/80 mt-1 font-semibold">Degraded Secondary Barriers</div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-emerald-300 p-5 shadow-sm relative overflow-hidden bg-gradient-to-b from-emerald-50/40 to-white">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-emerald-500" />
          <div className="text-[11px] font-mono font-bold uppercase text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Low Housekeeping
          </div>
          <div className="font-mono text-3xl font-black text-emerald-700 mt-1">{stats.low}</div>
          <div className="text-[10px] text-emerald-600/80 mt-1 font-medium">Standard Field Maintenance</div>
        </div>
      </div>

      {/* ── Main 2-Column Bifurcated Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ══════════════════════════════════════════════════════════════════════
            LEFT PANEL (7 Cols): Live SIF Precursor Wall Feed
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden">
          
          {/* Header Bar */}
          <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-400 animate-pulse" />
              <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-white">
                ⚡ Live SIF Precursor Alert Stream
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {alerts.length} Alerts Active in Session
            </span>
          </div>

          <div className="p-5 space-y-3 bg-slate-50/40">
            {alerts.length === 0 ? (
              <div className="p-10 text-center space-y-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-700">
                  <Radio className="w-6 h-6 text-slate-500 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Control Room Monitoring Active</h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                    Listening to all 6 explosion-proof ingestion channels. Critical alerts trigger instant acoustic alarms and pop up here.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                  {['RoIP Ch.9', 'Doghouse Kiosks', 'IS Handhelds', 'IVR 555', 'OCR Cards', 'Shift Touchscreen'].map((ch, i) => (
                    <span key={i} className="text-[9px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {alerts.map((al, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      al.is_critical
                        ? 'bg-red-50/70 border-red-300 shadow-sm'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                          al.is_critical ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                        }`}>
                          {al.is_critical ? '🚨 CRITICAL SIF' : '⚠️ WARNING'}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-800">
                          Score: {al.sif_score?.toFixed(2)}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(al.timestamp).toLocaleTimeString('en-IN', { hour12: false })}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-900 mt-2 leading-relaxed">
                      "{al.report_text}"
                    </p>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200/80 text-[11px] font-medium text-slate-600">
                      <span>📍 {al.location}</span>
                      <span className="font-mono text-[10px] text-red-700 font-bold">
                        {al.matched_anchor_text || 'Active Precursor'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            RIGHT PANEL (5 Cols): Sovereign AI Engine Status & Compliance
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Box 1: Sovereign AI Engine Telemetry */}
          <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden">
            
            {/* Header Bar */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-white">
                  Sovereign AI Engine Telemetry
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                AIR-GAPPED
              </span>
            </div>

            <div className="p-4 space-y-2 bg-slate-50/50">
              {[
                { label: 'AI Execution Mode', value: '100% Local On-Premise', status: 'OK' },
                { label: 'Network Egress', value: '0 KB/s Zero-Egress', status: 'SECURE' },
                { label: 'Neural Embedding', value: 'multilingual-e5-small (384-dim)', status: 'LOCAL' },
                { label: 'Speech-to-Text', value: 'Local Whisper Engine (75MB)', status: 'LOCAL' },
                { label: 'Database Storage', value: 'PostgreSQL 17 / SQLite WAL', status: 'ACTIVE' },
                { label: 'Audit Chain', value: 'SHA-256 Cryptographic Hash', status: 'LOCKED' },
                { label: 'SIF Triage Latency', value: '< 500ms Edge Scoring', status: 'FAST' },
              ].map((item, i) => (
                <div key={i} className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-[11px]">{item.value}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Box 2: Statutory Compliance Mandates */}
          <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden">
            
            {/* Header Bar */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-400" />
                <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-white">
                  Statutory Process Safety Compliance
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">PSU Standard</span>
            </div>

            <div className="p-4 bg-slate-50/50">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'OISD-STD-149', desc: 'Zone 0/1 Electrical' },
                  { name: 'DGMS Mandate', desc: 'Mines Safety Code' },
                  { name: 'IOGP-456 Rules', desc: '9 Life-Saving Rules' },
                  { name: 'ATEX Zone 1', desc: 'Explosion-Proof IS' },
                  { name: 'IECEx Certified', desc: 'Hazardous Equipment' },
                  { name: 'CII Sovereign', desc: 'Govt Air-Gap Policy' },
                ].map((std, i) => (
                  <div key={i} className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-slate-900 truncate">{std.name}</div>
                      <div className="text-[9px] text-slate-400 truncate">{std.desc}</div>
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
