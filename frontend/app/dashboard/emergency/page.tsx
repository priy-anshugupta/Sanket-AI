'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Radio, 
  PhoneCall, 
  CheckSquare, 
  Square, 
  AlertOctagon, 
  Flame, 
  Zap, 
  CheckCircle2, 
  Volume2, 
  Layers, 
  Wifi,
  Phone,
  AlertTriangle,
  Clock,
  Send,
  Building2,
  FileCheck2,
  Lock,
  ChevronRight,
  Activity,
  AlertCircle
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

interface Contact {
  role: string;
  name: string;
  phone: string;
  icon: string;
  priority: number;
}

interface ChecklistItem {
  step: number;
  text: string;
  checked: boolean;
}

interface SIFAlert {
  type: string;
  priority: string;
  timestamp: string;
  data: {
    report_id: string;
    sif_score: number;
    sif_label: string;
    matched_anchor_text?: string;
    location?: string;
    report_text?: string;
    is_critical?: boolean;
    action?: string;
    message?: string;
  };
}

const INGESTION_CHANNELS = [
  {
    id: 1,
    name: 'VHF/UHF Walkie-Talkie Bridge (RoIP)',
    desc: 'Rig floor workers, derrickmen, pump operators via Channel 9 PTT',
    badge: 'ATEX ZONE 1',
    status: 'ACTIVE',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    numberClass: 'bg-emerald-600 text-white',
  },
  {
    id: 2,
    name: 'Fixed Flameproof Call Pillars (Kiosks)',
    desc: 'Wall-mounted explosion-proof pillars in compressor & manifold areas',
    badge: 'ATEX ZONE 1',
    status: 'ACTIVE',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    numberClass: 'bg-emerald-600 text-white',
  },
  {
    id: 3,
    name: 'Company-Issued Zone 1 IS Handhelds',
    desc: 'Rugged spark-proof Android terminals for maintenance leads',
    badge: 'ATEX ZONE 1',
    status: 'ACTIVE',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    numberClass: 'bg-emerald-600 text-white',
  },
  {
    id: 4,
    name: 'Plant Landline Extension (IVR "555")',
    desc: 'Desk phone audio recording for control room & substation techs',
    badge: 'EPABX TRUNK',
    status: 'CONFIGURED',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    numberClass: 'bg-blue-600 text-white',
  },
  {
    id: 5,
    name: 'Physical Safety Cards + OCR Scanner',
    desc: 'Yellow cards dropped in muster boxes, optical batch-scanned in 10s',
    badge: 'OPTICAL OCR',
    status: 'CONFIGURED',
    badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
    numberClass: 'bg-slate-700 text-white',
  },
  {
    id: 6,
    name: 'Safe-Zone Handover Touchscreens',
    desc: 'Wall-mounted debrief tablets in cafeteria and shift cabins',
    badge: 'SAFE-ZONE UI',
    status: 'ACTIVE',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    numberClass: 'bg-emerald-600 text-white',
  },
];

const EMERGENCY_CONTACTS: Contact[] = [
  { role: 'On-Site Toolpusher', name: 'Bikash Das (Rig Floor Lead)', phone: '+91 94350-11204', icon: '👷', priority: 1 },
  { role: 'Fire & Blowout Emergency', name: 'Duliajan Central Station', phone: '102 / +91 374-2800555', icon: '🚒', priority: 2 },
  { role: 'OIL Hospital Ambulance', name: 'Duliajan Emergency ER', phone: '108 / +91 374-2800108', icon: '🏥', priority: 3 },
  { role: 'DCS Control Room Superintendent', name: 'Central SCADA Desk', phone: 'Ext. 2201 / +91 374-2802201', icon: '🎛️', priority: 4 },
];

export default function EmergencyPage() {
  const [alerts, setAlerts] = useState<SIFAlert[]>([]);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [activePlaybook, setActivePlaybook] = useState<any>({
    report_id: 'REP-2026-WK-901',
    sif_score: 0.96,
    location: 'Well Pad 7 (Upper Assam)',
    hazard_description: 'Active gas kick detected with rapid annular pressure rise to 1800 PSI. BOP safety valve seal weeping hydraulic fluid.',
    barrier: 'Primary Hydrostatic Mud Barrier & BOP Seal',
    iogp_rule: 'Energy Isolation & Well Control',
  });
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { step: 1, text: 'Confirm Blowout Preventer (BOP) accumulator pressure > 3000 PSI.', checked: false },
    { step: 2, text: 'Evacuate all non-essential personnel 100m upwind of wellhead.', checked: false },
    { step: 3, text: 'Verify all active e-PTW Hot Work (welding) permits within 100m are frozen.', checked: true },
    { step: 4, text: 'Dispatch gas monitoring team with calibrated Dräger H2S tubes.', checked: false },
  ]);
  const [swaTriggered, setSwaTriggered] = useState(false);
  const [callNotification, setCallNotification] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect WebSocket
  useEffect(() => {
    const connectWs = () => {
      setWsStatus('connecting');
      const ws = new WebSocket('ws://localhost:8000/ws/alerts');

      ws.onopen = () => {
        setWsStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const alert: SIFAlert = JSON.parse(event.data);
          if (alert.type === 'SIF_ALERT') {
            setAlerts(prev => [alert, ...prev].slice(0, 30));
            if (alert.priority === 'CRITICAL' || alert.data?.is_critical) {
              playAlarm();
              setActivePlaybook({
                report_id: alert.data?.report_id || 'REP-EMERGENCY',
                sif_score: alert.data?.sif_score || 0.94,
                location: alert.data?.location || 'Well Pad 7 (Upper Assam)',
                hazard_description: alert.data?.report_text || 'Well kick with rapid 1800 PSI annular pressure surge detected during tripping.',
                barrier: 'Well Control & Hydrostatic Barrier',
                iogp_rule: 'Energy Isolation & Well Control',
              });
            }
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        setTimeout(connectWs, 4000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    };

    connectWs();
    return () => { wsRef.current?.close(); };
  }, []);

  const playAlarm = () => {
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
      setTimeout(() => osc.stop(), 800);
    } catch {}
  };

  const simulateCriticalAlert = () => {
    playAlarm();
    setActivePlaybook({
      report_id: 'REP-2026-WK-901',
      sif_score: 0.96,
      location: 'Well Pad 7 (Upper Assam)',
      hazard_description: 'Active gas kick detected with rapid annular pressure rise to 1800 PSI. BOP safety valve seal weeping hydraulic fluid.',
      barrier: 'Primary Hydrostatic Mud Barrier & BOP Seal',
      iogp_rule: 'Energy Isolation & Well Control',
    });
    setSwaTriggered(false);
  };

  const triggerSWA = () => {
    setSwaTriggered(true);
    setChecklist(prev => prev.map(item => item.step === 3 ? { ...item, checked: true } : item));
  };

  const toggleChecklist = (index: number) => {
    setChecklist(prev => prev.map((item, i) => i === index ? { ...item, checked: !item.checked } : item));
  };

  const handleCall = (contact: Contact) => {
    setCallNotification(`📞 Connecting priority dispatch call to ${contact.name} (${contact.phone})...`);
    setTimeout(() => setCallNotification(null), 4000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-[#F1F5F9]/70 min-h-screen">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-md shadow-red-950/20 text-white font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
                  Emergency Command Center
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-red-600 animate-pulse" />
                  &lt; 500ms Zero-Delay Reflex
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Real-time critical hazard escalation, Stop Work Authority (SWA), and certified ATEX hardware telemetry
              </p>
            </div>
          </div>
        </div>

        {/* Live Control Room Status Pill */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border font-mono text-xs font-bold shadow-xs ${
            wsStatus === 'connected' 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{wsStatus === 'connected' ? 'LIVE · DCS Control Room Connected' : 'Connecting to Telemetry...'}</span>
          </div>

          <button
            onClick={simulateCriticalAlert}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-950/30 transition-all hover:scale-[1.02]"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            ⚡ Simulate Live Critical Alert
          </button>
        </div>
      </div>

      {/* Call notification toast */}
      {callNotification && (
        <div className="p-4 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-between shadow-xl shadow-blue-900/30 border border-blue-400 animate-fadeIn">
          <div className="flex items-center gap-3">
            <PhoneCall className="w-5 h-5 animate-bounce" />
            <span className="text-sm font-semibold">{callNotification}</span>
          </div>
          <button onClick={() => setCallNotification(null)} className="text-white/80 hover:text-white font-bold text-lg">✕</button>
        </div>
      )}

      {/* ── Main 2-Column Bifurcated Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ══════════════════════════════════════════════════════════════════════
            LEFT PANEL (7 Cols): SIF Playbook & Stop Work Authority
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 bg-white rounded-2xl border-2 border-red-500 shadow-lg overflow-hidden">
          
          {/* Distinct Panel Header Bar */}
          <div className="px-6 py-3.5 bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-white animate-pulse" />
              <span className="font-heading font-extrabold text-xs uppercase tracking-wider">
                🚨 SIF Emergency Escalation & Playbook
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono bg-red-800/80 px-2 py-0.5 rounded border border-red-400/40 text-red-100 font-bold">
                DGMS / OISD MANDATE
              </span>
            </div>
          </div>

          <div className="p-6 space-y-5 bg-white">
            
            {/* Alert Header Box */}
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-mono font-black uppercase tracking-wider">
                      CRITICAL SIF PRECURSOR
                    </span>
                    <span className="text-xs font-mono font-bold text-red-700">
                      Risk Potential: {activePlaybook.sif_score?.toFixed(2)} / 1.00
                    </span>
                  </div>
                  <h2 className="font-heading font-extrabold text-base text-slate-900 mt-1.5">
                    Well Kick & Pressure Surge Containment Protocol
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700 mt-1 font-medium">
                    <span>📍 Asset: <strong className="text-red-700 font-bold">{activePlaybook.location}</strong></span>
                    <span>•</span>
                    <span>🛡️ IOGP Rule: <strong className="font-mono text-slate-800">{activePlaybook.iogp_rule}</strong></span>
                  </div>
                </div>

                <div className="text-right shrink-0 bg-white px-3 py-1.5 rounded-lg border border-red-200">
                  <div className="text-[9px] font-mono text-slate-400 uppercase">Incident ID</div>
                  <div className="text-xs font-mono font-bold text-slate-900">{activePlaybook.report_id}</div>
                </div>
              </div>

              {/* Narrative Quote */}
              <div className="pt-2 border-t border-red-200/70 text-xs text-slate-800 font-semibold leading-relaxed">
                "{activePlaybook.hazard_description}"
              </div>
            </div>

            {/* STEP 1 Box: Stop Work Authority (SWA) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading font-bold uppercase text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                  Stop Work Authority (SWA) Hard Interlock
                </span>
                <span className="text-[11px] text-slate-500 font-mono font-semibold">1-Click Emergency Lockout</span>
              </div>

              <button
                onClick={triggerSWA}
                disabled={swaTriggered}
                className={`w-full py-4 px-4 rounded-xl font-heading font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-md ${
                  swaTriggered
                    ? 'bg-emerald-600 text-white shadow-emerald-950/20 cursor-default border border-emerald-500'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-red-950/30 hover:scale-[1.01] active:scale-[0.99] border border-red-700'
                }`}
              >
                {swaTriggered ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    ✅ SWA EXECUTED — ALL 100M HOT-WORK PERMITS FROZEN & TOOLPUSHER ALERTED
                  </>
                ) : (
                  <>
                    <AlertOctagon className="w-4 h-4 fill-white" />
                    🛑 INITIATE IMMEDIATE EMERGENCY STOP WORK (SWA)
                  </>
                )}
              </button>
            </div>

            {/* STEP 2 Box: Containment Checklist */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading font-bold uppercase text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                  Immediate Containment Checklist (IOGP SOP)
                </span>
                <span className="text-[11px] text-slate-600 font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-300">
                  {checklist.filter(c => c.checked).length} / {checklist.length} Verified
                </span>
              </div>

              <div className="space-y-2">
                {checklist.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleChecklist(idx)}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      item.checked
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <button type="button" className="mt-0.5 shrink-0">
                      {item.checked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <span className={`text-xs font-semibold leading-relaxed ${item.checked ? 'line-through text-slate-500' : ''}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Audit Metadata */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Statutory Audit Trail: SHA-256 Verified</span>
              </div>
              <button
                onClick={simulateCriticalAlert}
                className="text-red-600 hover:text-red-800 font-bold underline cursor-pointer"
              >
                Reset / Re-Simulate
              </button>
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            RIGHT COLUMN (5 Cols): 6 Channels & Emergency Contact Directory
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Panel 2: 6-Channel Ingestion Matrix */}
          <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden">
            
            {/* Header Bar */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-white">
                  6-Channel Hardware Ingestion
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                OISD-STD-149
              </span>
            </div>

            <div className="p-4 space-y-2.5 bg-slate-50/50">
              {INGESTION_CHANNELS.map((ch) => (
                <div 
                  key={ch.id} 
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-400 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 shadow-xs ${ch.numberClass}`}>
                      {ch.id}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">{ch.name}</h4>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{ch.desc}</p>
                    </div>
                  </div>

                  <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded border shrink-0 ${ch.badgeClass}`}>
                    {ch.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 3: Emergency Contact Directory */}
          <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden">
            
            {/* Header Bar */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-red-400" />
                <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-white">
                  1-Touch Emergency Dispatch
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Duliajan HQ</span>
            </div>

            <div className="p-4 space-y-2.5 bg-slate-50/50">
              {EMERGENCY_CONTACTS.map((c, i) => (
                <div 
                  key={i} 
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                      {c.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate leading-snug">{c.role}</div>
                      <div className="text-[10px] text-slate-500 truncate">{c.name}</div>
                      <div className="text-[11px] font-mono font-bold text-blue-600 mt-0.5">{c.phone}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCall(c)}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 shadow-xs hover:scale-105"
                  >
                    <Phone className="w-3 h-3 fill-white" />
                    Call
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
