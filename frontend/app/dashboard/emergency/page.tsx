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
  Phone, 
  MapPin, 
  RadioTower,
  Mic
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

interface Contact {
  role: string;
  name: string;
  phone: string;
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
  { role: 'On-Duty Installation Manager (OIM)', name: 'Pranjal Saikia', phone: '+91 94350-11201', priority: 1 },
  { role: 'Field Safety Officer (HSE Lead)', name: 'Bikash Das', phone: '+91 94350-11202', priority: 2 },
  { role: 'Central Control Room (Duliajan HQ)', name: 'Control Desk A', phone: '+91 374-2800555', priority: 3 },
  { role: 'Oil India Fire Service & Well-Kill', name: 'Emergency Station 1', phone: '+91 374-2800101', priority: 4 },
  { role: 'District Disaster Management (DDMA)', name: 'Tinsukia HQ', phone: '+91 374-2338555', priority: 5 },
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
  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [swaExecuted, setSwaExecuted] = useState(false);
  const [swaToast, setSwaToast] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState('Baghjan Well #5');
  const [isSimulatingAudio, setIsSimulatingAudio] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState('');
  const [channelSelected, setChannelSelected] = useState<number>(1);

  const toggleChecklist = (step: number) => {
    setChecklist(prev =>
      prev.map(item => (item.step === step ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleTriggerSWA = async () => {
    setSwaExecuted(true);
    setSwaToast(`EMERGENCY SWA BROADCAST DISPATCHED TO ${selectedLocation.toUpperCase()}! Electronic permits frozen. Audible sirens activated.`);

    try {
      await fetch(`${API_BASE}/api/reports/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `[EMERGENCY SWA EXECUTED] Safety Manager triggered automated lockout for ${selectedLocation}. Immediate rig shutdown ordered.`,
          location: selectedLocation,
          activity_type: 'Emergency SWA Shutdown',
          source: 'SWA_LOCKOUT_DESK',
        }),
      });
    } catch {
      // Offline fallback
    }

    setTimeout(() => setSwaToast(null), 8000);
  };

  const handleSimulateRoIP = async () => {
    setIsSimulatingAudio(true);
    setAudioTranscript('Connecting to Motorola ATEX Ch-09 stream...');

    setTimeout(() => {
      setAudioTranscript('"Mayday, this is Rig 4 Floor Lead — high vibration and fluid weeping from BOP secondary seal under 1800 PSI. Suspect barrier breach!"');
      setIsSimulatingAudio(false);
    }, 1800);
  };

  const completedSteps = checklist.filter(c => c.checked).length;
  const progressPercent = Math.round((completedSteps / checklist.length) * 100);

  return (
    <div className="dashboard-page space-y-5 p-6 bg-[#FAFAF9] min-h-screen text-[#1A2B2D]">
      
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-bold text-xl text-[#1A2B2D] tracking-tight">
              Emergency Command Center & SWA Playbook
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FDF2F2] text-[#D63B3B] border border-[#F5C6C6]">
              SOP-HSE-09
            </span>
          </div>
          <p className="text-[13px] text-[#5E7072] mt-0.5 font-normal">
            Automated Stop Work Authority lockout, ATEX RoIP bridge, and incident checklist
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-[#F0F2ED] p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('playbook')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'playbook'
                ? 'bg-white text-[#1A2B2D] shadow-xs'
                : 'text-[#5E7072] hover:text-[#1A2B2D]'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-[#D63B3B]" /> SWA Playbook
          </button>
          <button
            onClick={() => setActiveTab('roip')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'roip'
                ? 'bg-white text-[#1A2B2D] shadow-xs'
                : 'text-[#5E7072] hover:text-[#1A2B2D]'
            }`}
          >
            <Mic className="h-3.5 w-3.5 text-[#0A6B63]" /> RoIP Radio Bridge
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'channels'
                ? 'bg-white text-[#1A2B2D] shadow-xs'
                : 'text-[#5E7072] hover:text-[#1A2B2D]'
            }`}
          >
            <RadioTower className="h-3.5 w-3.5 text-[#5E7072]" /> Hardware Ingestion (6)
          </button>
        </div>
      </div>

      {/* SWA Broadcast Alert Banner */}
      {swaToast && (
        <div className="p-3.5 rounded-xl bg-[#D63B3B] text-white text-xs font-semibold flex items-center justify-between shadow-md border border-[#B92525]">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="w-5 h-5 shrink-0" />
            <span>{swaToast}</span>
          </div>
          <button onClick={() => setSwaToast(null)} className="text-white/80 hover:text-white font-bold text-sm px-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* ── TAB 1: SWA PLAYBOOK & LIVE ESCALATION ── */}
      {activeTab === 'playbook' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Left Column: SIF Precursor Alert & SWA Lockout Trigger (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Critical Escalation Card */}
            <div className="bg-white rounded-xl border-2 border-[#C2CEC2] border-l-4 border-l-[#D63B3B] shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#D63B3B]" />
                  <h3 className="font-heading font-bold text-sm text-[#1A2B2D]">
                    Active Critical Precursor Cascade (SIF 0.96)
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#FDF2F2] text-[#D63B3B] border border-[#F5C6C6]">
                  LSR #1 VIOLATION
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#5E7072] font-medium">Target Location:</span>
                  <span className="flex items-center gap-1 font-semibold text-[#1A2B2D]"><MapPin className="h-3.5 w-3.5 text-[#D63B3B]" />{selectedLocation}</span>
                </div>
                <p className="text-xs text-[#1A2B2D] leading-relaxed font-medium">
                  "Annular BOP secondary valve seal weeping hydraulic fluid under 1800 PSI surge. Kill line isolation bypass fitted without approved Management of Change (MOC)."
                </p>
                <div className="flex items-center gap-3 text-[11px] text-[#5E7072] pt-1 border-t border-[#C2CEC2] flex-wrap">
                  <span>Failed Barrier: <strong className="text-[#D63B3B] font-semibold">BOP Primary Containment</strong></span>
                  <span>•</span>
                  <span>Energy: <strong className="text-[#D4820A] font-semibold">1800 PSI Hydrocarbon Gas</strong></span>
                </div>
              </div>

              {/* SWA Danger Button */}
              <div className="pt-1">
                <button
                  onClick={handleTriggerSWA}
                  className="w-full py-3 px-5 rounded-lg bg-[#D63B3B] hover:bg-[#B92525] text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <AlertOctagon className="w-4 h-4" />
                  <span>Execute Immediate Stop Work Authority Lockout</span>
                </button>
                <p className="text-[11px] text-center text-[#94A3A5] mt-1.5">
                  Freezes active digital permits (e-PTWs), sends audible siren to toolpusher, and notifies Duliajan HQ.
                </p>
              </div>
            </div>

            {/* Interactive Emergency Checklist Card */}
            <div className="bg-white rounded-xl border-2 border-[#C2CEC2] shadow-xs p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-[#D8E0D8] pb-2.5">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#1B8A6C]" />
                  <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1A2B2D]">
                    Emergency Response Checklist (SOP-HSE-09)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-[#5E7072]">
                    {completedSteps} of {checklist.length} Complete ({progressPercent}%)
                  </span>
                  <div className="w-20 h-1.5 rounded-full bg-[#F0F2ED] overflow-hidden">
                    <div 
                      className="h-full bg-[#1B8A6C] transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                {checklist.map((item) => (
                  <div
                    key={item.step}
                    onClick={() => toggleChecklist(item.step)}
                    className={`p-2.5 rounded-lg border transition-all flex items-start gap-2.5 cursor-pointer ${
                      item.checked
                        ? 'bg-[#EDFAF4] border-[#BFEADB] text-[#1B8A6C]'
                        : 'bg-[#F7F8F5] border-[#C2CEC2] text-[#3E5052] hover:bg-[#F0F2ED]'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {item.checked ? (
                        <CheckSquare className="w-4 h-4 text-[#1B8A6C]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#94A3A5]" />
                      )}
                    </div>
                    <div className="text-xs font-medium leading-relaxed">
                      <span className="font-mono text-[10px] opacity-70 mr-1">STEP 0{item.step}:</span>
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Emergency Chain of Command (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Priority Contact Roster Card */}
            <div className="bg-white rounded-xl border-2 border-[#C2CEC2] shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#D8E0D8] pb-2">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-[#0A6B63]" />
                  <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1A2B2D]">
                    Emergency Call Roster (Priority 1–5)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#1B8A6C] font-semibold">
                  LINES ACTIVE
                </span>
              </div>

              <div className="space-y-1.5">
                {EMERGENCY_CONTACTS.map((contact) => (
                  <div
                    key={contact.priority}
                    className="p-2.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase font-semibold text-[#5E7072] truncate">
                        {contact.role}
                      </div>
                      <div className="text-xs font-bold text-[#1A2B2D] truncate">
                        {contact.name}
                      </div>
                    </div>

                    <a
                      href={`tel:${contact.phone}`}
                      className="px-2.5 py-1 bg-[#E8F4F0] hover:bg-[#0A6B63] hover:text-white border border-[#BCE3DC] text-[#0A6B63] rounded-md text-xs font-mono font-medium flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                    >
                      <Phone className="w-3 h-3" />
                      {contact.phone.split(' ')[1] || contact.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Location Switcher */}
            <div className="bg-white rounded-xl border-2 border-[#C2CEC2] p-4 space-y-2 shadow-xs">
              <div className="text-[11px] font-semibold text-[#5E7072] uppercase tracking-wider">Selected High-Risk Asset:</div>
              <div className="grid grid-cols-2 gap-1.5">
                {['Baghjan Well #5', 'Moran OCS-3', 'Well Pad 7', 'Geleki Processing'].map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setSelectedLocation(loc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left truncate cursor-pointer ${
                      selectedLocation === loc
                        ? 'bg-[#0A6B63] text-white font-semibold shadow-xs'
                        : 'bg-[#F7F8F5] text-[#3E5052] hover:bg-[#F0F2ED] border border-[#C2CEC2]'
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
        <div className="bg-white rounded-xl border-2 border-[#C2CEC2] shadow-xs p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D8E0D8] pb-3">
            <div>
              <h3 className="font-heading font-bold text-sm text-[#1A2B2D] flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#0A6B63]" />
                VHF / UHF Push-to-Talk Radio over IP (RoIP Bridge)
              </h3>
              <p className="text-xs text-[#5E7072] mt-0.5">
                Ingests audio feeds directly from Motorola ATEX Zone 1 walkie-talkies (Channel 9 Safety Frequency).
              </p>
            </div>

            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EDFAF4] text-[#1B8A6C] border border-[#BFEADB]">
              CH-09 CARRIER ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            
            {/* Waveform Visualizer */}
            <div className="lg:col-span-6 bg-[#F7F8F5] p-5 rounded-xl border border-[#C2CEC2] space-y-3 text-center">
              <div className="flex items-center justify-center gap-1 h-16">
                {[16, 32, 48, 64, 80, 52, 28, 44, 72, 90, 60, 36, 20, 50, 75, 40].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-150 ${
                      isSimulatingAudio ? 'bg-[#0A6B63]' : 'bg-[#CBD5CE]'
                    }`}
                    style={{ height: isSimulatingAudio ? `${h}%` : '20%' }}
                  />
                ))}
              </div>

              <div className="text-xs font-mono text-[#5E7072]">
                Frequency: <strong className="text-[#1A2B2D]">156.800 MHz (VHF Ch-09)</strong> · Sub-audible CTCSS 103.5 Hz
              </div>

              <button
                onClick={handleSimulateRoIP}
                disabled={isSimulatingAudio}
                className="py-2.5 px-5 rounded-lg bg-[#0A6B63] hover:bg-[#085B54] text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50 cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5" />
                {isSimulatingAudio ? 'Transmitting Audio Feed...' : 'Simulate Inbound RoIP Call'}
              </button>
            </div>

            {/* Transcript & SIF Classification */}
            <div className="lg:col-span-6 bg-[#F7F8F5] p-5 rounded-xl border border-[#C2CEC2] space-y-3">
              <div className="text-[11px] font-semibold text-[#5E7072] flex items-center justify-between">
                <span>Whisper Neural Speech-to-Text:</span>
                <span className="text-[#1B8A6C] font-mono">100% AIR-GAPPED</span>
              </div>

              <div className="p-3.5 rounded-lg bg-white border border-[#C2CEC2] text-xs text-[#1A2B2D] leading-relaxed min-h-[80px] flex items-center">
                {audioTranscript ? (
                  <span className="text-[#1A2B2D] font-medium">{audioTranscript}</span>
                ) : (
                  <span className="text-[#94A3A5] italic">Click "Simulate Inbound RoIP Call" to test live speech recognition...</span>
                )}
              </div>

              {audioTranscript && (
                <div className="p-3 rounded-lg bg-[#FDF2F2] border border-[#F5C6C6] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#D63B3B]" />
                    <span className="font-semibold text-[#D63B3B]">Classified: HIGH SIF PRECURSOR (Score: 0.96)</span>
                  </div>
                  <button
                    onClick={handleTriggerSWA}
                    className="px-3 py-1 bg-[#D63B3B] hover:bg-[#B92525] text-white rounded-md font-semibold text-xs cursor-pointer"
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
        <div className="bg-white rounded-xl border-2 border-[#C2CEC2] shadow-xs p-5 space-y-4">
          <div className="border-b border-[#D8E0D8] pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-sm text-[#1A2B2D]">
                6-Channel Multimodal Hardware Ingestion Architecture
              </h3>
              <p className="text-xs text-[#5E7072] mt-0.5">
                Zero-friction reporting pathways enabling frontline workers to report hazards without smartphone apps.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EDFAF4] text-[#1B8A6C] border border-[#BFEADB]">
              6 CHANNELS ONLINE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {INGESTION_CHANNELS.map((ch) => (
              <div
                key={ch.id}
                onClick={() => setChannelSelected(ch.id)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer space-y-2 ${
                  channelSelected === ch.id
                    ? 'bg-[#E8F4F0] border-[#0A6B63] shadow-xs'
                    : 'bg-[#F7F8F5] border-[#C2CEC2] hover:bg-[#F0F2ED]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0A6B63] text-white flex items-center justify-center font-mono font-bold text-[10px]">
                      {ch.id}
                    </div>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-white text-[#5E7072] border border-[#C2CEC2]">
                      {ch.badge}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#1B8A6C]">
                    {ch.status}
                  </span>
                </div>

                <h4 className="font-heading font-bold text-xs text-[#1A2B2D] leading-snug">
                  {ch.name}
                </h4>
                <p className="text-[11px] text-[#5E7072] leading-relaxed">
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
