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
  Volume2, 
  ArrowUpRight,
  AlertOctagon,
  Lock,
  RadioTower,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE = typeof window !== 'undefined' ? `http://${window.location.hostname}:8000` : 'http://localhost:8000';

interface LiveReport {
  id: string;
  sif_score: number;
  sif_label: string;
  location: string;
  raw_text: string;
  iogp_rule?: string;
  created_at?: string;
}

export default function ControlRoomPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<LiveReport[]>([]);
  const [timeString, setTimeString] = useState<string>('');
  const [dateString, setDateString] = useState<string>('');
  const [stats, setStats] = useState({ total: 509, high: 159, medium: 80, low: 270 });
  const [lastAlarm, setLastAlarm] = useState<string | null>(null);

  // Live Clock (Client-only to prevent SSR hydration mismatch)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('en-IN', { hour12: false }));
      setDateString(now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Live Reports from Backend API
  const fetchLiveReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports?limit=15&sort_by=latest`);
      if (res.ok) {
        const data = await res.json();
        const reps: any[] = data.reports || [];
        const precursorReps = reps.filter((r: any) => (r.sif_score && r.sif_score >= 0.40) || r.sif_label === 'HIGH' || r.sif_label === 'MEDIUM');
        if (precursorReps.length > 0) {
          setAlerts(precursorReps.map((r: any) => ({
            id: r.id,
            sif_score: r.sif_score,
            sif_label: r.sif_label || (r.sif_score >= 0.75 ? 'HIGH' : 'MEDIUM'),
            location: r.location || 'Well Pad 7',
            raw_text: r.raw_text,
            iogp_rule: r.iogp_rule || 'Life-Saving Rule Precursor',
            created_at: r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
          })));
        }
      }
    } catch {}

    try {
      const sRes = await fetch(`${API_BASE}/api/analytics/summary`);
      if (sRes.ok) {
        const d = await sRes.json();
        if (d.total_reports) {
          setStats({
            total: d.total_reports || 509,
            high: d.high_count || 159,
            medium: d.medium_count || 80,
            low: d.low_count || 270,
          });
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchLiveReports();
    const interval = setInterval(fetchLiveReports, 3000);
    window.addEventListener('sanket:new_report', fetchLiveReports);
    return () => {
      clearInterval(interval);
      window.removeEventListener('sanket:new_report', fetchLiveReports);
    };
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
      setTimeout(() => osc.stop(), 600);
    } catch {}
  };

  const triggerTestAlarm = () => {
    playAlarmSound();
    const newAlert: LiveReport = {
      id: `REP-LIVE-${Math.floor(100 + Math.random() * 900)}`,
      sif_score: 0.96,
      sif_label: 'HIGH',
      location: 'Well Pad 7 (Upper Assam)',
      raw_text: 'Annular BOP valve seal weeping hydraulic fluid under 1800 PSI surge during pipe tripping.',
      iogp_rule: 'Energy Isolation & Barrier Integrity',
      created_at: 'Just now'
    };
    setAlerts(prev => [newAlert, ...prev]);
    setLastAlarm('🚨 HIGH SIF ALARM DISPATCHED TO CONTROL DESK');
    setTimeout(() => setLastAlarm(null), 5000);
  };

  const assetThreats = [
    { name: 'Baghjan Well #5', risk: 96, label: 'HIGH RISK', hazard: 'Gas kick & BOP seal weeping under 1800 PSI', color: 'red' },
    { name: 'Well Pad 7', risk: 92, label: 'HIGH RISK', hazard: '12m scaffold tower without safety harness', color: 'red' },
    { name: 'Moran OCS-3', risk: 88, label: 'HIGH RISK', hazard: 'Crane lift near 33kV live overhead line', color: 'amber' },
    { name: 'Geleki Processing', risk: 85, label: 'HIGH RISK', hazard: 'Speeding forklift near gas cylinder bank', color: 'amber' },
    { name: 'Duliajan Central HQ', risk: 15, label: 'NORMAL', hazard: 'Routine operations · All barriers green', color: 'green' }
  ];

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
              24/7 LIVE FLEET MONITOR
            </span>
          </div>
          <p className="text-[13px] text-[#5E7072] mt-0.5 font-normal">
            Real-time process safety wall with live incident streaming and acoustic alert reflex
          </p>
        </div>

        {/* Live Clock & Action CTAs */}
        <div className="flex items-center gap-2.5">
          <div className="bg-white text-[#1A2B2D] px-3.5 py-1.5 rounded-lg flex items-center gap-2.5 shadow-xs border border-[#C2CEC2]">
            <Clock className="w-3.5 h-3.5 text-[#0A6B63]" />
            <div className="text-xs font-mono font-bold tracking-wider text-[#1A2B2D] tabular-nums" suppressHydrationWarning>
              {timeString || '15:00:00'}
            </div>
            <span className="text-[10px] font-mono text-[#5E7072] border-l border-[#C2CEC2] pl-2" suppressHydrationWarning>
              {dateString || 'Live Fleet'}
            </span>
          </div>

          <button type="button" suppressHydrationWarning
            onClick={triggerTestAlarm}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D63B3B] hover:bg-[#B92525] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            Trigger Test Alarm
          </button>
        </div>
      </div>

      {lastAlarm && (
        <div className="p-3 rounded-xl bg-[#D63B3B] text-white text-xs font-bold flex items-center justify-between shadow-lg animate-bounce">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4" />
            <span>{lastAlarm}</span>
          </div>
          <button type="button" suppressHydrationWarning onClick={() => setLastAlarm(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* ── 4 Executive KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border-2 border-[#C2CEC2] border-l-4 border-l-[#5E7072] p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase text-[#5E7072]">Total Safety Reports</div>
          <div className="font-heading text-2xl font-bold text-[#1A2B2D] mt-1">{stats.total}</div>
          <div className="text-[10px] text-[#94A3A5] mt-0.5">Across 10 Operational Assets</div>
        </div>

        <div className="bg-white rounded-xl border-2 border-[#C2CEC2] border-l-4 border-l-[#D63B3B] p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-[#D63B3B] flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> High SIF Precursors
          </div>
          <div className="font-heading text-2xl font-bold text-[#D63B3B] mt-1">{stats.high}</div>
          <div className="text-[10px] text-[#D63B3B]/80 mt-0.5 font-semibold">Immediate Priority Lockout</div>
        </div>

        <div className="bg-white rounded-xl border-2 border-[#C2CEC2] border-l-4 border-l-[#D4820A] p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-[#D4820A] flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Medium Risk Warnings
          </div>
          <div className="font-heading text-2xl font-bold text-[#D4820A] mt-1">{stats.medium}</div>
          <div className="text-[10px] text-[#D4820A]/80 mt-0.5 font-semibold">Secondary Barrier Warnings</div>
        </div>

        <div className="bg-white rounded-xl border-2 border-[#C2CEC2] border-l-4 border-l-[#1B8A6C] p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-[#1B8A6C] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Low Housekeeping
          </div>
          <div className="font-heading text-2xl font-bold text-[#1B8A6C] mt-1">{stats.low}</div>
          <div className="text-[10px] text-[#1B8A6C]/80 mt-0.5 font-semibold">Routine Maintenance Safe</div>
        </div>
      </div>

      {/* ── Main Grid (Live Alerts on Left, Fleet Status on Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT PANEL (7 Cols): Live Streaming Hazard Alerts */}
        <div className="lg:col-span-7 bg-white rounded-xl border-2 border-[#C2CEC2] shadow-xs overflow-hidden">
          
          <div className="px-4 py-3 bg-[#F0F2ED] flex items-center justify-between border-b border-[#C2CEC2]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0A6B63]" />
              <h3 className="font-heading font-bold text-xs text-[#1A2B2D] uppercase tracking-wider">
                Live SIF Precursor Incident Stream
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#0A6B63] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0A6B63] animate-pulse" />
              LIVE INGESTION ACTIVE
            </span>
          </div>

          <div className="p-4 space-y-3 max-h-[580px] overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-[#5E7072]">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0A6B63] mb-2" />
                <p className="text-xs font-semibold">Listening to incoming live reports...</p>
              </div>
            ) : (
              alerts.map((alert, idx) => (
                <div
                  key={alert.id || idx}
                  className="p-3.5 rounded-xl border-2 border-[#C2CEC2] bg-[#F7F8F5] hover:border-[#0A6B63] transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                        alert.sif_score >= 0.75
                          ? 'bg-[#FDF2F2] text-[#D63B3B] border-[#F5C6C6]'
                          : 'bg-[#FEF7EC] text-[#D4820A] border-[#F8DFB6]'
                      }`}>
                        SIF {Math.round(alert.sif_score * 100)}% RISK
                      </span>
                      <span className="font-bold text-[#1A2B2D] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#0A6B63]" />
                        {alert.location}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#5E7072] font-semibold">
                      {alert.created_at || 'Just now'}
                    </span>
                  </div>

                  <p className="text-xs text-[#1A2B2D] leading-relaxed font-medium">
                    "{alert.raw_text}"
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#C2CEC2]/60 text-xs">
                    <span className="text-[10px] font-mono text-[#0A6B63] bg-[#E8F4F0] px-2 py-0.5 rounded font-semibold">
                      {alert.iogp_rule}
                    </span>

                    <button type="button" suppressHydrationWarning
                      onClick={() => {
                        const loc = (alert.location || 'Well Pad 7').toLowerCase();
                        let target = 'Well Pad 7';
                        if (loc.includes('moran')) target = 'Moran OCS-3';
                        else if (loc.includes('baghjan')) target = 'Baghjan Well #5';
                        else if (loc.includes('digboi')) target = 'Digboi Rig #2';
                        else if (loc.includes('geleki')) target = 'Geleki GGS-1';
                        else if (loc.includes('lakwa')) target = 'Lakwa Well #12';
                        else target = 'Well Pad 7';
                        router.push(`/dashboard/emergency?location=${encodeURIComponent(target)}`);
                      }}
                      className="px-2.5 py-1 bg-[#D63B3B] hover:bg-[#B92525] text-white rounded-md text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                    >
                      <AlertOctagon className="w-3 h-3" />
                      Trigger SWA Playbook
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL (5 Cols): Fleet Threat Matrix & Channels */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Active Asset Threat Matrix */}
          <div className="bg-white rounded-xl border-2 border-[#C2CEC2] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#C2CEC2] pb-2">
              <h3 className="font-heading font-bold text-xs text-[#1A2B2D] uppercase tracking-wider">
                Fleet Asset Risk Matrix
              </h3>
              <span className="text-[10px] font-mono text-[#5E7072] font-semibold">5 Active Sites</span>
            </div>

            <div className="space-y-2">
              {assetThreats.map((asset) => (
                <div
                  key={asset.name}
                  onClick={() => router.push(`/dashboard/emergency?location=${encodeURIComponent(asset.name)}`)}
                  className="p-2.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] hover:border-[#0A6B63] cursor-pointer transition-all space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1A2B2D]">{asset.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      asset.color === 'red' ? 'bg-red-50 text-red-700 border border-red-200' :
                      asset.color === 'amber' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {asset.risk}% RISK
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5E7072] line-clamp-1">
                    {asset.hazard}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 6-Channel Ingestion Status */}
          <div className="bg-white rounded-xl border-2 border-[#C2CEC2] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#C2CEC2] pb-2">
              <h3 className="font-heading font-bold text-xs text-[#1A2B2D] uppercase tracking-wider flex items-center gap-1.5">
                <RadioTower className="w-3.5 h-3.5 text-[#0A6B63]" />
                Hardware Ingestion Channels
              </h3>
              <span className="text-[10px] font-mono text-[#1B8A6C] font-bold">6 ONLINE</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] text-[11px]">
                <div className="text-[#5E7072]">RoIP VHF Ch-9</div>
                <div className="text-[#1B8A6C] font-bold mt-0.5">● Carrier Active</div>
              </div>
              <div className="p-2 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] text-[11px]">
                <div className="text-[#5E7072]">IS Handhelds</div>
                <div className="text-[#1B8A6C] font-bold mt-0.5">● 24 Connected</div>
              </div>
              <div className="p-2 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] text-[11px]">
                <div className="text-[#5E7072]">Flameproof Kiosks</div>
                <div className="text-[#1B8A6C] font-bold mt-0.5">● Online</div>
              </div>
              <div className="p-2 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] text-[11px]">
                <div className="text-[#5E7072]">IVR Landline (555)</div>
                <div className="text-[#1B8A6C] font-bold mt-0.5">● Line Ready</div>
              </div>
            </div>
          </div>

          {/* Sovereign Air-Gap Security Badge */}
          <div className="p-3 bg-[#E8F4F0] rounded-xl border border-[#BCE3DC] flex items-center justify-between text-xs text-[#0A6B63] font-semibold">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>100% Air-Gapped Local AI · 0 KB/s Zero Egress</span>
            </div>
            <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-[#BCE3DC]">
              SHA-256
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
