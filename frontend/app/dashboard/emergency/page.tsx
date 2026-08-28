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
  AlertCircle,
  Sparkles,
  Waves,
  Mic
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
    status: 'ONLINE',
  },
  {
    id: 2,
    name: 'Fixed Flameproof Call Pillars (Kiosks)',
    desc: 'Wall-mounted explosion-proof pillars in compressor & manifold areas',
    badge: 'ATEX ZONE 1',
    status: 'ONLINE',
  },
  {
    id: 3,
    name: 'Company-Issued Zone 1 IS Handhelds',
    desc: 'Rugged spark-proof Android terminals for maintenance leads',
    badge: 'ATEX ZONE 1',
    status: 'ONLINE',
  },
  {
    id: 4,
    name: 'Plant Landline Extension (IVR "555")',
    desc: 'Desk phone audio recording for control room & substation techs',
    badge: 'EPABX TRUNK',
    status: 'ONLINE',
  },
  {
    id: 5,
    name: 'Paper Shift Log OCR Ingestion',
    desc: 'Scanned handwritten shift turnover logsheets batch-OCR processed',
    badge: 'BATCH OCR',
    status: 'READY',
  },
  {
    id: 6,
    name: 'Muster Point Tablet / Kiosk Mode',
    desc: 'Toolbox talk kiosks & pre-shift JSA safety check-ins',
    badge: 'OFFLINE SYNC',
    status: 'ONLINE',
  },
];

const EMERGENCY_CONTACTS: Contact[] = [
  { role: 'On-Duty Installation Manager (OIM)', name: 'Pranjal Saikia', phone: '+91 94350-11201', icon: '👷', priority: 1 },
  { role: 'Field Safety Officer (HSE Lead)', name: 'Bikash Das', phone: '+91 94350-11202', icon: '🦺', priority: 2 },
  { role: 'Central Control Room (Duliajan HQ)', name: 'Control Desk A', phone: '+91 374-2800555', icon: '🏢', priority: 3 },
  { role: 'Oil India Fire Service & Well-Kill', name: 'Emergency Station 1', phone: '+91 374-2800101', icon: '🚒', priority: 4 },
  { role: 'District Disaster Management (DDMA)', name: 'Tinsukia HQ', phone: '+91 374-2338555', icon: '🚨', priority: 5 },
];

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { step: 1, text: 'Confirm Stop Work Authority (SWA) broadcast received by Rig Floor Toolpusher', checked: true },
  { step: 2, text: 'Isolate annular hydraulic valve on BOP manifold (Lock-Out / Tag-Out)', checked: true },
  { step: 3, text: 'Order non-essential personnel evacuation to Primary Muster Point B (500m Upwind)', checked: false },
  { step: 4, text: 'Engage heavy mud kill-line pump circulation to stabilize annular surge', checked: false },
  { step: 5, text: 'Notify Duliajan HQ Crisis Management Team & log timestamped regulatory audit trail', checked: false },
];

export default function EmergencyCommandPage() {
  const [activeTab, setActiveTab] = useState<'playbook' | 'roip' | 'channels'>('playbook');
  const [alerts, setAlerts] = useState<SIFAlert[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [swaExecuted, setSwaExecuted] = useState(false);
  const [swaToast, setSwaToast] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState('Baghjan Well #5');
  const [isSimulatingAudio, setIsSimulatingAudio] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState('');
  const [channelSelected, setChannelSelected] = useState<number>(1);
  const [connectingWs, setConnectingWs] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Connect to live WebSocket alert stream
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket('ws://localhost:8000/api/reports/ws/alerts');
      wsRef.current = ws;

      ws.onopen = () => setConnectingWs(false);
      ws.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          if (payload.type === 'SIF_PRECURSOR_ALERT') {
            setAlerts(prev => [payload, ...prev.slice(0, 9)]);
          }
        } catch {}
      };
      ws.onerror = () => setConnectingWs(false);
    } catch {}

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const toggleChecklist = (step: number) => {
    setChecklist(prev =>
      prev.map(item => item.step === step ? { ...item, checked: !item.checked } : item)
    );
  };

  const handleTriggerSWA = () => {
    setSwaExecuted(true);
    setSwaToast(`🛑 EMERGENCY STOP WORK AUTHORITY DISPATCHED: All active hot-work & tripping permits FROZEN at ${selectedLocation}. Rig floor siren activated.`);
    setTimeout(() => setSwaToast(null), 7000);
  };

  const handleSimulateRoIP = () => {
    setIsSimulatingAudio(true);
    setAudioTranscript('Transmitting from Ch-9 RoIP: "Baghjan Rig Floor to Control — Annular BOP secondary seal weeping hydraulic fluid under 1800 PSI surge! Mud return bubbling in cellar pit, request immediate SWA!"');
    setTimeout(() => {
      setIsSimulatingAudio(false);
    }, 2800);
  };

  const completedSteps = checklist.filter(c => c.checked).length;
  const progressPercent = Math.round((completedSteps / checklist.length) * 100);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-[#0B0F19] text-slate-100 min-h-screen">
      
      {/* ── Top Executive Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] p-5 rounded-2xl border border-white/[0.08] shadow-2xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shadow-md shadow-red-950/50">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-2xl text-white tracking-tight">
                  Emergency Command Center & SWA Playbook
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  ISA-101 SCADA DEFENSE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Standard Operating Procedure (SOP-HSE-09) · Automated Stop Work Authority & ATEX RoIP Bridge
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-[#0B0F19] p-1.5 rounded-xl border border-white/[0.08]">
          <button
            onClick={() => setActiveTab('playbook')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-heading font-extrabold transition-all cursor-pointer ${
              activeTab === 'playbook'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            🛡️ SWA Playbook
          </button>
          <button
            onClick={() => setActiveTab('roip')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-heading font-extrabold transition-all cursor-pointer ${
              activeTab === 'roip'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            🎙️ RoIP Radio Bridge
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-heading font-extrabold transition-all cursor-pointer ${
              activeTab === 'channels'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            📡 Ingestion Channels (6)
          </button>
        </div>
      </div>

      {/* SWA Broadcast Alert Banner */}
      {swaToast && (
        <div className="p-4 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center justify-between shadow-2xl shadow-red-950/60 border border-red-400 animate-fadeIn">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-6 h-6 fill-white animate-bounce shrink-0" />
            <span className="text-sm font-bold leading-snug">{swaToast}</span>
          </div>
          <button onClick={() => setSwaToast(null)} className="text-white/80 hover:text-white font-black text-lg cursor-pointer px-2">✕</button>
        </div>
      )}

      {/* ── TAB 1: SWA PLAYBOOK & LIVE ESCALATION ── */}
      {activeTab === 'playbook' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: SIF Precursor Alert & SWA Lockout Trigger (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Critical Escalation Card (Dark Glass with Red Left Accent) */}
            <div className="bg-[#111827] rounded-2xl border border-white/[0.08] border-l-4 border-l-red-500 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                  <h3 className="font-heading font-black text-sm uppercase tracking-wider text-white">
                    Active Critical Precursor Cascade (SIF 0.96)
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-red-500/20 text-red-400 border border-red-500/30">
                  LIFE-SAVING RULE #1 VIOLATION
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#0B0F19] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono font-bold uppercase">Target Location:</span>
                  <span className="font-heading font-black text-white text-sm">📍 {selectedLocation}</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                  "Annular BOP secondary valve seal weeping hydraulic fluid under 1800 PSI surge. Kill line isolation bypass fitted without approved Management of Change (MOC)."
                </p>
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 pt-1 border-t border-white/[0.06] flex-wrap">
                  <span>Failed Barrier: <strong className="text-red-400">BOP Primary Containment</strong></span>
                  <span>•</span>
                  <span>Energy: <strong className="text-amber-400">1800 PSI Hydrocarbon Gas</strong></span>
                </div>
              </div>

              {/* SWA Big Red Button on Dark Glass */}
              <div className="pt-1">
                <button
                  onClick={handleTriggerSWA}
                  className="w-full py-4 px-6 rounded-xl bg-red-600 hover:bg-red-500 text-white font-heading font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-red-950/80 transition-all hover:scale-[1.01] active:scale-[0.99] border border-red-400 cursor-pointer animate-pulse"
                >
                  <AlertOctagon className="w-5 h-5 fill-white" />
                  <span>🛑 EXECUTE IMMEDIATE STOP WORK AUTHORITY (SWA) LOCKOUT</span>
                </button>
                <p className="text-[10px] font-mono text-center text-slate-400 mt-2">
                  Automatically freezes active digital permits (e-PTWs), sends audible siren to toolpusher, and notifies Duliajan HQ.
                </p>
              </div>
            </div>

            {/* Interactive Emergency Checklist Card */}
            <div className="bg-[#111827] rounded-2xl border border-white/[0.08] shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-heading font-black text-xs uppercase tracking-wider text-white">
                    Emergency Response Checklist (SOP-HSE-09)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {completedSteps} of {checklist.length} Complete ({progressPercent}%)
                  </span>
                  <div className="w-20 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {checklist.map((item) => (
                  <div
                    key={item.step}
                    onClick={() => toggleChecklist(item.step)}
                    className={`p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                      item.checked
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-100'
                        : 'bg-[#0B0F19] border-white/[0.06] text-slate-300 hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {item.checked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                    <div className="text-xs font-semibold leading-relaxed">
                      <span className="font-mono text-[10px] font-bold opacity-60 mr-1.5">STEP 0{item.step}:</span>
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Emergency Chain of Command & Radio Telemetry (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Priority Contact Roster Card */}
            <div className="bg-[#111827] rounded-2xl border border-white/[0.08] shadow-2xl p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-blue-400" />
                  <h3 className="font-heading font-black text-xs uppercase tracking-wider text-white">
                    Emergency Call Roster (Priority 1–5)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LINES ACTIVE
                </span>
              </div>

              <div className="space-y-2">
                {EMERGENCY_CONTACTS.map((contact) => (
                  <div
                    key={contact.priority}
                    className="p-3 rounded-xl bg-[#0B0F19] border border-white/[0.06] flex items-center justify-between gap-2 hover:border-white/[0.15] transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg shrink-0">{contact.icon}</span>
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono text-slate-400 font-bold uppercase truncate">
                          {contact.role}
                        </div>
                        <div className="text-xs font-black text-white truncate">
                          {contact.name}
                        </div>
                      </div>
                    </div>

                    <a
                      href={`tel:${contact.phone}`}
                      className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-300 hover:text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                    >
                      <Phone className="w-3 h-3" />
                      {contact.phone.split(' ')[1] || contact.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Location Switcher */}
            <div className="bg-[#111827] rounded-2xl border border-white/[0.08] p-4 space-y-2 shadow-2xl">
              <div className="text-[10px] font-mono uppercase font-bold text-slate-400">Selected High-Risk Asset:</div>
              <div className="grid grid-cols-2 gap-1.5">
                {['Baghjan Well #5', 'Moran OCS-3', 'Well Pad 7', 'Geleki Processing'].map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setSelectedLocation(loc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all text-left truncate cursor-pointer ${
                      selectedLocation === loc
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-[#0B0F19] text-slate-300 hover:bg-slate-800 border border-white/[0.06]'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ── TAB 2: RoIP WALKIE-TALKIE RADIO BRIDGE ── */}
      {activeTab === 'roip' && (
        <div className="bg-[#111827] rounded-2xl border border-white/[0.08] shadow-2xl p-6 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
            <div>
              <h3 className="font-heading font-black text-base text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
                VHF / UHF Push-to-Talk Radio over IP (RoIP Bridge)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ingests audio feeds directly from Motorola ATEX Zone 1 walkie-talkies (Channel 9 Safety Frequency).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                CH-09 CARRIER ACTIVE
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Radio Waveform Visualizer */}
            <div className="lg:col-span-6 bg-[#0B0F19] p-6 rounded-2xl border border-white/[0.08] space-y-4 text-center">
              <div className="flex items-center justify-center gap-1 h-20">
                {[16, 32, 48, 64, 80, 52, 28, 44, 72, 90, 60, 36, 20, 50, 75, 40].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-150 ${
                      isSimulatingAudio ? 'bg-red-500 animate-pulse' : 'bg-blue-500/40'
                    }`}
                    style={{ height: isSimulatingAudio ? `${h}%` : '25%' }}
                  />
                ))}
              </div>

              <div className="text-xs font-mono text-slate-400">
                Frequency: <strong className="text-white">156.800 MHz (VHF Ch-16 / Ch-09)</strong> · Sub-audible CTCSS 103.5 Hz
              </div>

              <button
                onClick={handleSimulateRoIP}
                disabled={isSimulatingAudio}
                className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-heading font-black text-xs uppercase tracking-wider shadow-xl shadow-blue-950/60 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                {isSimulatingAudio ? 'Transmitting Audio Feed...' : '▶ Simulate Inbound RoIP Audio Call'}
              </button>
            </div>

            {/* Live STT Transcript & SIF Classification */}
            <div className="lg:col-span-6 bg-[#0B0F19] p-6 rounded-2xl border border-white/[0.08] space-y-3">
              <div className="text-[10px] font-mono uppercase font-bold text-slate-400 flex items-center justify-between">
                <span>Real-Time Whisper Neural Speech-to-Text:</span>
                <span className="text-emerald-400 font-mono font-bold">100% AIR-GAPPED</span>
              </div>

              <div className="p-4 rounded-xl bg-[#111827] border border-white/[0.06] text-xs font-mono text-slate-200 leading-relaxed min-h-[90px] flex items-center">
                {audioTranscript ? (
                  <span className="text-amber-300 font-bold">{audioTranscript}</span>
                ) : (
                  <span className="text-slate-500 italic">Click "Simulate Inbound RoIP Audio Call" to test live speech recognition...</span>
                )}
              </div>

              {audioTranscript && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-500" />
                    <span className="font-bold text-red-300">Classified: HIGH SIF PRECURSOR (Score: 0.96)</span>
                  </div>
                  <button
                    onClick={handleTriggerSWA}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-[11px] cursor-pointer"
                  >
                    Trigger SWA
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── TAB 3: 6-CHANNEL HARDWARE INGESTION PANEL ── */}
      {activeTab === 'channels' && (
        <div className="bg-[#111827] rounded-2xl border border-white/[0.08] shadow-2xl p-6 space-y-4 animate-fadeIn">
          <div className="border-b border-white/[0.08] pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-heading font-black text-base text-white">
                6-Channel Multimodal Hardware Ingestion Architecture
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Zero-friction reporting pathways enabling frontline workers to report hazards without typing or smartphone apps.
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
              ALL 6 CHANNELS ONLINE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INGESTION_CHANNELS.map((ch) => (
              <div
                key={ch.id}
                onClick={() => setChannelSelected(ch.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                  channelSelected === ch.id
                    ? 'bg-blue-950/30 border-blue-500/50 shadow-xl ring-2 ring-blue-500/20'
                    : 'bg-[#0B0F19] border-white/[0.06] hover:border-white/[0.15]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-xs shadow-sm">
                      {ch.id}
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {ch.badge}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {ch.status}
                  </span>
                </div>

                <h4 className="font-heading font-black text-sm text-white leading-tight">
                  {ch.name}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {ch.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
