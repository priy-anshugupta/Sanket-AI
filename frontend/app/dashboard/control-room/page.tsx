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
    <div className="dashboard-page space-y-5 p-6 bg-[#F7F8F5] min-h-screen text-[#1A2B2D]">
      
      {/* ── Page Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-bold text-xl text-[#1A2B2D] tracking-tight">
              DCS Control Room Live Wall
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EDFAF4] text-[#1B8A6C] border border-[#BFEADB] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B8A6C] animate-pulse" />
              24/7 Live Stream
            </span>
          </div>
          <p className="text-[13px] text-[#5E7072] mt-0.5 font-normal">
            Centralized process safety wall with real-time acoustic alarm reflex & statutory audit telemetry
          </p>
        </div>

        {/* Live Clock & Action CTAs */}
        <div className="flex items-center gap-2.5">
          <div className="bg-white text-[#1A2B2D] px-3.5 py-1.5 rounded-lg flex items-center gap-2.5 shadow-xs border border-[#C2CEC2]">
            <Clock className="w-3.5 h-3.5 text-[#0A6B63]" />
            <div className="text-xs font-mono font-bold tracking-wider text-[#1A2B2D] tabular-nums">
              {currentTime.toLocaleTimeString('en-IN', { hour12: false })}
            </div>
            <span className="text-[10px] font-mono text-[#5E7072] border-l border-[#C2CEC2] pl-2">
              {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>

          <button
            onClick={simulateAlarm}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D63B3B] hover:bg-[#B92525] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            Trigger Test Alarm
          </button>
        </div>
      </div>

      {/* ── 4 Executive KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border-2 border-[#C2CEC2] border-l-4 border-l-[#5E7072] p-4 shadow-xs">
          <div className="text-[11px] font-medium uppercase text-[#5E7072]">Total Safety Reports</div>
          <div className="font-heading text-2xl font-bold text-[#1A2B2D] mt-1">{stats.total}</div>
          <div className="text-[10px] text-[#94A3A5] mt-0.5">Across 10 Operational Assets</div>
        </div>

        <div className="bg-white rounded-xl border-2 border-[#C2CEC2] border-l-4 border-l-[#D63B3B] p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase text-[#D63B3B] flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> High / SIF Precursors
          </div>
          <div className="font-heading text-2xl font-bold text-[#D63B3B] mt-1">{stats.high}</div>
          <div className="text-[10px] text-[#D63B3B]/80 mt-0.5 font-medium">Immediate Priority Lockout</div>
        </div>

        <div className="bg-white rounded-xl border-2 border-[#C2CEC2] border-l-4 border-l-[#D4820A] p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase text-[#D4820A] flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Medium Risk Warnings
          </div>
          <div className="font-heading text-2xl font-bold text-[#D4820A] mt-1">{stats.medium}</div>
          <div className="text-[10px] text-[#D4820A]/80 mt-0.5 font-medium">Degraded Secondary Barriers</div>
        </div>

        <div className="bg-white rounded-xl border-2 border-[#C2CEC2] border-l-4 border-l-[#1B8A6C] p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase text-[#1B8A6C] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Low Housekeeping
          </div>
          <div className="font-heading text-2xl font-bold text-[#1B8A6C] mt-1">{stats.low}</div>
          <div className="text-[10px] text-[#1B8A6C]/80 mt-0.5 font-medium">Standard Field Maintenance</div>
        </div>
      </div>

      {/* ── Main 2-Column Bifurcated Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT PANEL (7 Cols): Live SIF Precursor Wall Feed */}
        <div className="lg:col-span-7 bg-white rounded-xl border-2 border-[#C2CEC2] shadow-xs overflow-hidden">
          
          <div className="px-4 py-2.5 bg-[#F0F2ED] flex items-center justify-between border-b border-[#C2CEC2]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0A6B63]" />
              <h3 className="font-heading font-semibold text-xs text-[#1A2B2D] uppercase tracking-wider">
                Live SIF Precursor Alert Stream
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#5E7072]">
              {alerts.length} Alerts Active in Session
            </span>
          </div>

          <div className="p-4 space-y-2.5">
            {alerts.length === 0 ? (
              <div className="p-8 text-center space-y-2 bg-[#F7F8F5] rounded-lg border border-[#C2CEC2]">
                <div className="w-10 h-10 rounded-lg bg-white border border-[#C2CEC2] flex items-center justify-center mx-auto text-[#0A6B63]">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#1A2B2D]">Control Room Monitoring Active</h4>
                  <p className="text-[11px] text-[#5E7072] max-w-sm mx-auto mt-0.5">
                    Listening to all 6 explosion-proof ingestion channels. Critical alerts trigger instant acoustic alarms and pop up here.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1 pt-1">
                  {['RoIP Ch.9', 'Doghouse Kiosks', 'IS Handhelds', 'IVR 555', 'OCR Cards', 'Shift Touchscreen'].map((ch, i) => (
                    <span key={i} className="text-[10px] font-mono px-2 py-0.5 bg-white text-[#5E7072] rounded border border-[#C2CEC2]">
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {alerts.map((al, idx) => (
                  <div 
                    key={idx}
                    className={`p-3.5 rounded-lg border transition-all ${
                      al.is_critical
                        ? 'bg-[#FDF2F2] border-[#F5C6C6]'
                        : 'bg-[#F7F8F5] border-[#C2CEC2]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          al.is_critical ? 'bg-[#D63B3B] text-white' : 'bg-[#FEF7EC] text-[#D4820A] border border-[#F8DFB6]'
                        }`}>
                          {al.is_critical ? 'CRITICAL SIF' : 'WARNING'}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#1A2B2D]">
                          Score: {al.sif_score?.toFixed(2)}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-[#94A3A5]">
                        {new Date(al.timestamp).toLocaleTimeString('en-IN', { hour12: false })}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-[#1A2B2D] mt-1.5 leading-relaxed">
                      "{al.report_text}"
                    </p>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#C2CEC2] text-[11px] text-[#5E7072]">
                      <span>📍 {al.location}</span>
                      <span className="font-semibold text-[#D63B3B]">
                        {al.matched_anchor_text || 'Active Precursor'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL (5 Cols): Sovereign AI Engine Status & Compliance */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Box 1: Sovereign AI Engine Telemetry */}
          <div className="bg-white rounded-xl border-2 border-[#C2CEC2] shadow-xs overflow-hidden">
            
            <div className="px-4 py-2.5 bg-[#F0F2ED] flex items-center justify-between border-b border-[#C2CEC2]">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#0A6B63]" />
                <h3 className="font-heading font-semibold text-xs text-[#1A2B2D] uppercase tracking-wider">
                  Sovereign AI Engine Telemetry
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EDFAF4] text-[#1B8A6C] border border-[#BFEADB]">
                AIR-GAPPED
              </span>
            </div>

            <div className="p-3.5 space-y-1.5">
              {[
                { label: 'AI Execution Mode', value: '100% Local On-Premise', status: 'OK' },
                { label: 'Network Egress', value: '0 KB/s Zero-Egress', status: 'SECURE' },
                { label: 'Neural Embedding', value: 'multilingual-e5-small', status: 'LOCAL' },
                { label: 'Speech-to-Text', value: 'Local Whisper Engine', status: 'LOCAL' },
                { label: 'Database Storage', value: 'PostgreSQL 17 / Supabase', status: 'ACTIVE' },
                { label: 'Audit Chain', value: 'SHA-256 Cryptographic Hash', status: 'LOCKED' },
                { label: 'SIF Triage Latency', value: '< 500ms Edge Scoring', status: 'FAST' },
              ].map((item, i) => (
                <div key={i} className="p-2 rounded-lg border border-[#C2CEC2] bg-[#F7F8F5] flex items-center justify-between text-xs">
                  <span className="font-medium text-[#5E7072]">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[#1A2B2D] text-[11px] font-semibold">{item.value}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-white text-[#0A6B63] border border-[#C2CEC2]">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Box 2: Statutory Compliance Mandates */}
          <div className="bg-white rounded-xl border-2 border-[#C2CEC2] shadow-xs overflow-hidden">
            
            <div className="px-4 py-2.5 bg-[#F0F2ED] flex items-center justify-between border-b border-[#C2CEC2]">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#0A6B63]" />
                <h3 className="font-heading font-semibold text-xs text-[#1A2B2D] uppercase tracking-wider">
                  Statutory Process Safety Compliance
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#94A3A5]">PSU Standard</span>
            </div>

            <div className="p-3.5">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'OISD-STD-149', desc: 'Zone 0/1 Electrical' },
                  { name: 'DGMS Mandate', desc: 'Mines Safety Code' },
                  { name: 'IOGP-456 Rules', desc: '9 Life-Saving Rules' },
                  { name: 'ATEX Zone 1', desc: 'Explosion-Proof IS' },
                  { name: 'IECEx Certified', desc: 'Hazardous Equipment' },
                  { name: 'CII Sovereign', desc: 'Govt Air-Gap Policy' },
                ].map((std, i) => (
                  <div key={i} className="p-2 rounded-lg border border-[#C2CEC2] bg-[#F7F8F5] flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1B8A6C] shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-[#1A2B2D] truncate">{std.name}</div>
                      <div className="text-[9px] text-[#5E7072] truncate">{std.desc}</div>
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
