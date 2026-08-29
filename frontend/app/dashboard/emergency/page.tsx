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
  Mic,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  User
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

interface LocationThreat {
  location: string;
  sifPercent: number;
  lsrRule: string;
  hazard: string;
  rootCause: string;
  failedBarrier: string;
  energy: string;
  checklist: ChecklistItem[];
  contacts: Contact[];
}

const LOCATION_THREATS: Record<string, LocationThreat> = {
  'Baghjan Well #5': {
    location: 'Baghjan Well #5',
    sifPercent: 96,
    lsrRule: 'LSR #1: BYPASSING CONTROLS',
    hazard: 'Annular BOP valve seal weeping hydraulic fluid under 1800 PSI gas surge.',
    rootCause: 'Kill-line isolation bypass fitted without authorized change approval.',
    failedBarrier: 'BOP Primary Containment',
    energy: '1800 PSI Gas Surge',
    checklist: [
      { step: 1, text: 'Broadcast SWA shutdown to Rig Floor Toolpusher', checked: true },
      { step: 2, text: 'Isolate BOP hydraulic valve (Lock-Out / Tag-Out)', checked: true },
      { step: 3, text: 'Evacuate crew to Upwind Muster Point B (500m)', checked: false },
      { step: 4, text: 'Pump heavy mud to kill well and stabilize pressure', checked: false },
      { step: 5, text: 'Notify Duliajan HQ and complete HSE verification', checked: false },
    ],
    contacts: [
      { role: 'Rig Manager (OIM)', name: 'Pranjal Saikia', phone: '+91 94350-11201', priority: 1 },
      { role: 'Safety Lead (HSE)', name: 'Bikash Das', phone: '+91 94350-11202', priority: 2 },
      { role: 'Central Control Desk', name: 'Duliajan HQ (Desk A)', phone: '+91 374-2800555', priority: 3 },
      { role: 'Well-Kill Emergency Squad', name: 'Emergency Station 1', phone: '+91 374-2800101', priority: 4 },
      { role: 'Disaster Management (DDMA)', name: 'Tinsukia HQ', phone: '+91 374-2338555', priority: 5 },
    ]
  },
  'Well Pad 7': {
    location: 'Well Pad 7',
    sifPercent: 92,
    lsrRule: 'LSR #3: WORKING AT HEIGHT',
    hazard: 'Worker standing on 12-meter scaffold without safety harness over active manifold.',
    rootCause: 'Scaffold guardrail missing and 100% harness tie-off anchor bypassed.',
    failedBarrier: 'Fall Arrest & Scaffold Barrier',
    energy: '12m Gravity Drop & Live Piping',
    checklist: [
      { step: 1, text: 'Order immediate work stoppage on 12m scaffold tower', checked: true },
      { step: 2, text: 'Ground all workers until 100% harness anchors are inspected', checked: true },
      { step: 3, text: 'Cordon off 10m drop-zone underneath high-pressure manifold', checked: false },
      { step: 4, text: 'Inspect scaffold green-tag certificate with Rig Safety Lead', checked: false },
      { step: 5, text: 'Re-issue Working at Height permit before resumption', checked: false },
    ],
    contacts: [
      { role: 'Toolpusher Lead', name: 'Horen Gogoi', phone: '+91 94350-11204', priority: 1 },
      { role: 'Rig HSE Inspector', name: 'Deben Dutta', phone: '+91 94350-66778', priority: 2 },
      { role: 'Area Superintendent', name: 'Rajesh Kumar (GM)', phone: '+91 374-2800555', priority: 3 },
      { role: 'Pad 7 First Aid Bay', name: 'Emergency Medical Post', phone: '+91 94350-99881', priority: 4 },
      { role: 'Dibrugarh Disaster Unit', name: 'Dibrugarh Control Desk', phone: '+91 374-2338555', priority: 5 },
    ]
  },
  'Moran OCS-3': {
    location: 'Moran OCS-3',
    sifPercent: 88,
    lsrRule: 'LSR #5: MECHANICAL LIFTING',
    hazard: 'Crawler crane swinging 5-ton drill pipe dangerously close to 33kV overhead power lines.',
    rootCause: 'Crane lift started without a certified ground spotter or blind-spot guide.',
    failedBarrier: 'Overhead Electrical Clearance & Spotter',
    energy: '33,000V Power Grid & 5-Ton Suspended Load',
    checklist: [
      { step: 1, text: 'Signal crane operator for emergency horn & freeze boom position', checked: true },
      { step: 2, text: 'Request substation 33kV line isolation if clearance < 5 meters', checked: false },
      { step: 3, text: 'Clear all rigger crew from 15m radius load swing zone', checked: false },
      { step: 4, text: 'Assign certified ground spotter with dedicated radio channel', checked: false },
      { step: 5, text: 'Re-verify crane load chart and lift plan before resuming', checked: false },
    ],
    contacts: [
      { role: 'Station In-Charge', name: 'Pranjal Saikia', phone: '+91 94351-44552', priority: 1 },
      { role: 'Lifting & Rigging Lead', name: 'Anup Baruah', phone: '+91 94352-77119', priority: 2 },
      { role: 'Moran Electrical Substation', name: 'Power Grid Desk 2', phone: '+91 374-2800222', priority: 3 },
      { role: 'Charaideo Fire Tender Unit', name: 'Station 4 Rapid Squad', phone: '+91 374-2800101', priority: 4 },
      { role: 'Disaster Management Desk', name: 'Charaideo HQ', phone: '+91 374-2338555', priority: 5 },
    ]
  },
  'Geleki Processing': {
    location: 'Geleki Processing',
    sifPercent: 85,
    lsrRule: 'LSR #8: CONFINED SPACE & GAS',
    hazard: 'High-speed heavy forklift maneuvering near pressurized flammable gas cylinder storage.',
    rootCause: 'Vehicle speed governor disabled and safety crash barrier knocked over.',
    failedBarrier: 'Physical Crash Barrier & Speed Governor',
    energy: 'Pressurized Flammable Gas Cylinders',
    checklist: [
      { step: 1, text: 'Halt all forklift traffic inside Gas Processing Zone B', checked: true },
      { step: 2, text: 'Inspect manifold valves on cylinder bank for impact damage', checked: false },
      { step: 3, text: 'Re-erect physical crash barriers and pedestrian exclusion zone', checked: false },
      { step: 4, text: 'Enforce 10 km/h vehicle speed limit with security lead', checked: false },
      { step: 5, text: 'Log near-miss precursor in OIL SIF audit register', checked: false },
    ],
    contacts: [
      { role: 'Plant Safety Manager', name: 'Nayan Chutia', phone: '+91 94354-11223', priority: 1 },
      { role: 'Gas Plant Superintendent', name: 'Bhaskar Konwar', phone: '+91 94353-88990', priority: 2 },
      { role: 'Central Control Desk', name: 'Sivasagar Desk S-1', phone: '+91 374-2800555', priority: 3 },
      { role: 'Geleki Industrial Fire Squad', name: 'Plant Tender Unit', phone: '+91 374-2800101', priority: 4 },
      { role: 'District Disaster Unit', name: 'Sivasagar HQ', phone: '+91 374-2338555', priority: 5 },
    ]
  }
};

const INGESTION_CHANNELS = [
  {
    id: 1,
    name: 'Walkie-Talkie Bridge (RoIP Ch-09)',
    desc: 'Rig floor drillers & pump operators via Channel 9 PTT',
    badge: 'ATEX ZONE 1',
    status: 'ONLINE',
  },
  {
    id: 2,
    name: 'Flameproof Call Pillars',
    desc: 'Wall-mounted emergency call stations in compressor areas',
    badge: 'ATEX ZONE 1',
    status: 'ONLINE',
  },
  {
    id: 3,
    name: 'Zone 1 Rugged Handhelds',
    desc: 'Intrinsically safe mobile terminals for maintenance leads',
    badge: 'ATEX ZONE 1',
    status: 'ONLINE',
  },
  {
    id: 4,
    name: 'Plant Landline IVR (Ext. 555)',
    desc: 'Control room & substation direct phone line recording',
    badge: 'EPABX TRUNK',
    status: 'ONLINE',
  },
  {
    id: 5,
    name: 'Paper Shift Log OCR Scanner',
    desc: 'Handwritten shift turnover sheets scanned with edge OCR',
    badge: 'BATCH OCR',
    status: 'READY',
  },
  {
    id: 6,
    name: 'Muster Point Safety Kiosks',
    desc: 'Toolbox talk & pre-shift JSA safety check-in terminals',
    badge: 'OFFLINE SYNC',
    status: 'ONLINE',
  },
];

export default function EmergencyCommandPage() {
  const [activeTab, setActiveTab] = useState<'playbook' | 'roip' | 'channels'>('playbook');
  const [selectedLocation, setSelectedLocation] = useState('Baghjan Well #5');
  const [checklistsState, setChecklistsState] = useState<Record<string, ChecklistItem[]>>(() => {
    const init: Record<string, ChecklistItem[]> = {};
    Object.keys(LOCATION_THREATS).forEach(loc => {
      init[loc] = LOCATION_THREATS[loc].checklist.map(c => ({ ...c }));
    });
    return init;
  });

  const [liveWorkerReport, setLiveWorkerReport] = useState<{
    id: string;
    text: string;
    sif_score: number;
    sif_label: string;
    created_at?: string;
    iogp_rule?: string;
  } | null>(null);

  const [swaExecuted, setSwaExecuted] = useState(false);
  const [swaToast, setSwaToast] = useState<string | null>(null);
  const [isSimulatingAudio, setIsSimulatingAudio] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState('');
  const [channelSelected, setChannelSelected] = useState<number>(1);

  /* ── Fetch Latest Live Report for Active Location ── */
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/reports?limit=15`);
        if (res.ok) {
          const data = await res.json();
          const reports: any[] = data.reports || [];
          // Find most recent report matching current location
          const matched = reports.find(r => 
            r.location && r.location.toLowerCase().includes(selectedLocation.split(' ')[0].toLowerCase())
          );
          if (matched && matched.sif_score >= 0.7) {
            setLiveWorkerReport({
              id: matched.id,
              text: matched.raw_text,
              sif_score: matched.sif_score,
              sif_label: matched.sif_label || 'HIGH',
              created_at: 'LIVE SYNC',
              iogp_rule: matched.iogp_rule || 'Critical SIF Precursor'
            });
          } else {
            setLiveWorkerReport(null);
          }
        }
      } catch {
        // Keep fallback
      }
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 3000);
    return () => clearInterval(interval);
  }, [selectedLocation]);

  const activeThreat = LOCATION_THREATS[selectedLocation] || LOCATION_THREATS['Baghjan Well #5'];
  const currentChecklist = checklistsState[selectedLocation] || activeThreat.checklist;

  const toggleChecklist = (step: number) => {
    setChecklistsState(prev => {
      const currentList = prev[selectedLocation] || activeThreat.checklist;
      const updated = currentList.map(item =>
        item.step === step ? { ...item, checked: !item.checked } : item
      );
      return { ...prev, [selectedLocation]: updated };
    });
  };

  const handleTriggerSWA = async () => {
    setSwaExecuted(true);
    setSwaToast(`🛑 SWA LOCKOUT EXECUTED: Shutdown broadcast to ${selectedLocation.toUpperCase()}! Active permits frozen.`);

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
    setAudioTranscript(`Connecting to Motorola ATEX Ch-09 safety stream at ${selectedLocation}...`);

    setTimeout(() => {
      if (liveWorkerReport) {
        setAudioTranscript(`"Mayday, this is ${selectedLocation} field operator — ${liveWorkerReport.text}"`);
      } else if (selectedLocation === 'Well Pad 7') {
        setAudioTranscript('"Mayday, Rig 4 Safety — worker on 12m scaffold tower without harness over manifold. Immediate halt requested!"');
      } else if (selectedLocation === 'Moran OCS-3') {
        setAudioTranscript('"Mayday, Moran OCS Crane Yard — 5-ton drill collar swinging within 3m of 33kV live power lines. Freeze boom!"');
      } else if (selectedLocation === 'Geleki Processing') {
        setAudioTranscript('"Mayday, Geleki Plant Gas Zone — speeding forklift damaged crash barrier near pressurized cylinder bank!"');
      } else {
        setAudioTranscript('"Mayday, Rig 4 Floor Lead — BOP valve seal weeping under 1800 PSI surge. Barrier breach suspect!"');
      }
      setIsSimulatingAudio(false);
    }, 1500);
  };

  const completedSteps = currentChecklist.filter(c => c.checked).length;
  const progressPercent = Math.round((completedSteps / currentChecklist.length) * 100);

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
              SWA PROTOCOL
            </span>
          </div>
          <p className="text-[13px] text-[#5E7072] mt-0.5 font-normal">
            Instant Stop Work Authority lockout, field radio bridge, and response protocol
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
            <RadioTower className="h-3.5 w-3.5 text-[#5E7072]" /> Hardware Inputs (6)
          </button>
        </div>
      </div>

      {/* SWA Broadcast Alert Banner */}
      {swaToast && (
        <div className="p-3.5 rounded-xl bg-[#D63B3B] text-white text-xs font-semibold flex items-center justify-between shadow-md border border-[#B92525]">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="w-5 h-5 shrink-0 animate-pulse" />
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
            
            {/* Critical Escalation Card (DYNAMIC AS PER WORKER INGESTION / LOCATION) */}
            <div className="bg-white rounded-xl border-2 border-[#C2CEC2] border-l-4 border-l-[#D63B3B] shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#D63B3B]" />
                  <h3 className="font-heading font-bold text-sm text-[#1A2B2D]">
                    Critical SIF Hazard Alert ({liveWorkerReport ? Math.round(liveWorkerReport.sif_score * 100) : activeThreat.sifPercent}% Risk)
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#FDF2F2] text-[#D63B3B] border border-[#F5C6C6]">
                  {liveWorkerReport ? (liveWorkerReport.iogp_rule || 'SIF PRECURSOR') : activeThreat.lsrRule}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#5E7072] font-semibold">Active Location:</span>
                  <span className="flex items-center gap-1 font-bold text-[#1A2B2D]">
                    <MapPin className="h-3.5 w-3.5 text-[#D63B3B]" />
                    {selectedLocation}
                  </span>
                </div>

                {liveWorkerReport ? (
                  <div className="space-y-1 text-xs text-[#1A2B2D]">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#0A6B63] bg-[#E8F4F0] px-2 py-0.5 rounded w-fit">
                      <User className="w-3 h-3" /> Live Ingestion from Field Terminal ({liveWorkerReport.id})
                    </div>
                    <p className="font-medium text-xs text-[#1A2B2D] italic bg-white p-2.5 rounded border border-[#C2CEC2] leading-relaxed">
                      "{liveWorkerReport.text}"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs text-[#1A2B2D]">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#D63B3B] shrink-0">Hazard:</span>
                      <span className="font-medium leading-relaxed">{activeThreat.hazard}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#D4820A] shrink-0">Root Cause:</span>
                      <span className="font-medium leading-relaxed">{activeThreat.rootCause}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-[#C2CEC2] flex-wrap text-xs">
                  <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[11px] font-medium flex items-center gap-1">
                    🛡️ Failed Barrier: <strong>{activeThreat.failedBarrier}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium flex items-center gap-1">
                    ⚡ Energy: <strong>{activeThreat.energy}</strong>
                  </span>
                </div>
              </div>

              {/* SWA Danger Button */}
              <div className="pt-1">
                <button
                  onClick={handleTriggerSWA}
                  className="w-full py-3 px-5 rounded-lg bg-[#D63B3B] hover:bg-[#B92525] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <AlertOctagon className="w-4 h-4" />
                  <span>Execute Stop Work Authority Lockout</span>
                </button>
                <p className="text-[11px] text-center text-[#5E7072] mt-1.5 font-medium">
                  ⚡ Freezes permits (e-PTWs) · Sounds rig floor siren · Alerts Duliajan HQ
                </p>
              </div>
            </div>

            {/* Interactive Emergency Checklist Card (DYNAMIC AS PER LOCATION) */}
            <div className="bg-white rounded-xl border-2 border-[#C2CEC2] shadow-xs p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-[#D8E0D8] pb-2.5">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#1B8A6C]" />
                  <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1A2B2D]">
                    Emergency Response Checklist
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-[#5E7072]">
                    {completedSteps} of {currentChecklist.length} Complete ({progressPercent}%)
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
                {currentChecklist.map((item) => (
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
                      <span className="font-mono text-[10px] opacity-70 mr-1.5 font-bold">{item.step}.</span>
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Emergency Chain of Command (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Priority Contact Roster Card (DYNAMIC AS PER LOCATION) */}
            <div className="bg-white rounded-xl border-2 border-[#C2CEC2] shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#D8E0D8] pb-2">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-[#0A6B63]" />
                  <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1A2B2D]">
                    Emergency Call Roster ({activeThreat.location.split(' ')[0]})
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#1B8A6C] font-semibold">
                  5 LINES ACTIVE
                </span>
              </div>

              <div className="space-y-1.5">
                {activeThreat.contacts.map((contact) => (
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
              <div className="text-[11px] font-semibold text-[#5E7072] uppercase tracking-wider">
                Select Active Incident Location:
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {['Baghjan Well #5', 'Well Pad 7', 'Moran OCS-3', 'Geleki Processing'].map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setSelectedLocation(loc)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all text-left truncate cursor-pointer ${
                      selectedLocation === loc
                        ? 'bg-[#0A6B63] text-white font-bold shadow-xs ring-2 ring-[#0A6B63]/30'
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
                Radio over IP (RoIP Channel 9 Bridge)
              </h3>
              <p className="text-xs text-[#5E7072] mt-0.5">
                Live audio feed from Motorola ATEX Zone 1 walkie-talkies (Safety Channel 9).
              </p>
            </div>

            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EDFAF4] text-[#1B8A6C] border border-[#BFEADB]">
              CH-09 ACTIVE
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
                Frequency: <strong className="text-[#1A2B2D]">156.800 MHz (VHF Ch-09)</strong> · Location: <strong>{selectedLocation}</strong>
              </div>

              <button
                onClick={handleSimulateRoIP}
                disabled={isSimulatingAudio}
                className="py-2.5 px-5 rounded-lg bg-[#0A6B63] hover:bg-[#085B54] text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50 cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5" />
                {isSimulatingAudio ? 'Receiving Audio...' : `Simulate Radio Call from ${selectedLocation.split(' ')[0]}`}
              </button>
            </div>

            {/* Transcript & SIF Classification */}
            <div className="lg:col-span-6 bg-[#F7F8F5] p-5 rounded-xl border border-[#C2CEC2] space-y-3">
              <div className="text-[11px] font-semibold text-[#5E7072] flex items-center justify-between">
                <span>Whisper Speech-to-Text:</span>
                <span className="text-[#1B8A6C] font-mono font-bold">100% AIR-GAPPED</span>
              </div>

              <div className="p-3.5 rounded-lg bg-white border border-[#C2CEC2] text-xs text-[#1A2B2D] leading-relaxed min-h-[80px] flex items-center">
                {audioTranscript ? (
                  <span className="text-[#1A2B2D] font-medium">{audioTranscript}</span>
                ) : (
                  <span className="text-[#94A3A5] italic">Click "Simulate Radio Call" to test live speech recognition...</span>
                )}
              </div>

              {audioTranscript && (
                <div className="p-3 rounded-lg bg-[#FDF2F2] border border-[#F5C6C6] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#D63B3B]" />
                    <span className="font-bold text-[#D63B3B]">Classified: HIGH SIF ({liveWorkerReport ? Math.round(liveWorkerReport.sif_score * 100) : activeThreat.sifPercent}% Risk)</span>
                  </div>
                  <button
                    onClick={handleTriggerSWA}
                    className="px-3 py-1 bg-[#D63B3B] hover:bg-[#B92525] text-white rounded-md font-bold text-xs cursor-pointer shadow-xs"
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
                6-Channel Multimodal Ingestion Architecture
              </h3>
              <p className="text-xs text-[#5E7072] mt-0.5">
                Frontline hazard reporting channels that require no smartphone apps in hazardous zones.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EDFAF4] text-[#1B8A6C] border border-[#BFEADB]">
              6 ONLINE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {INGESTION_CHANNELS.map((ch) => (
              <div
                key={ch.id}
                onClick={() => setChannelSelected(ch.id)}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer space-y-2 ${
                  channelSelected === ch.id
                    ? 'border-[#0A6B63] bg-[#E8F4F0]/30 shadow-xs'
                    : 'border-[#C2CEC2] bg-[#F7F8F5] hover:bg-[#F0F2ED]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#C2CEC2] text-[#5E7072] font-semibold">
                    CHANNEL 0{ch.id}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EDFAF4] border border-[#BFEADB] text-[#1B8A6C] font-semibold">
                    {ch.status}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#1A2B2D]">{ch.name}</h4>
                  <p className="text-[11px] text-[#5E7072] mt-1 leading-relaxed">{ch.desc}</p>
                </div>
                <div className="text-[10px] font-mono text-[#0A6B63] font-bold">
                  [{ch.badge}]
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
