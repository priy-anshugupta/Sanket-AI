"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  User,
  Clock,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Terminal,
  Activity
} from "lucide-react";

const API_BASE = typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://localhost:8000";

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
  "Baghjan Well #5": {
    location: "Baghjan Well #5",
    sifPercent: 96,
    lsrRule: "LSR #1: BYPASSING CONTROLS",
    hazard: "Annular BOP valve seal weeping hydraulic fluid under 1800 PSI gas surge.",
    rootCause: "Kill-line isolation bypass fitted without authorized change approval.",
    failedBarrier: "BOP Primary Containment",
    energy: "1800 PSI Gas Surge",
    checklist: [
      { step: 1, text: "Broadcast SWA shutdown to Rig Floor Toolpusher", checked: true },
      { step: 2, text: "Isolate BOP hydraulic valve (Lock-Out / Tag-Out)", checked: true },
      { step: 3, text: "Evacuate crew to Upwind Muster Point B (500m)", checked: false },
      { step: 4, text: "Pump heavy mud to kill well and stabilize pressure", checked: false },
      { step: 5, text: "Notify Duliajan HQ and complete HSE verification", checked: false },
    ],
    contacts: [
      { role: "Rig Manager (OIM)", name: "Pranjal Saikia", phone: "+91 94350-11201", priority: 1 },
      { role: "Safety Lead (HSE)", name: "Bikash Das", phone: "+91 94350-11202", priority: 2 },
      { role: "Central Control Desk", name: "Duliajan HQ (Desk A)", phone: "+91 374-2800555", priority: 3 },
      { role: "Well-Kill Emergency Squad", name: "Emergency Station 1", phone: "+91 374-2800101", priority: 4 },
      { role: "Disaster Management (DDMA)", name: "Tinsukia HQ", phone: "+91 374-2338555", priority: 5 },
    ]
  },
  "Well Pad 7": {
    location: "Well Pad 7",
    sifPercent: 92,
    lsrRule: "LSR #3: WORKING AT HEIGHT",
    hazard: "Worker standing on 12-meter scaffold without safety harness over active manifold.",
    rootCause: "Scaffold guardrail missing and 100% harness tie-off anchor bypassed.",
    failedBarrier: "Fall Arrest & Scaffold Barrier",
    energy: "12m Gravity Drop & Live Piping",
    checklist: [
      { step: 1, text: "Order immediate work stoppage on 12m scaffold tower", checked: true },
      { step: 2, text: "Ground all workers until 100% harness anchors are inspected", checked: true },
      { step: 3, text: "Cordon off 10m drop-zone underneath high-pressure manifold", checked: false },
      { step: 4, text: "Inspect scaffold green-tag certificate with Rig Safety Lead", checked: false },
      { step: 5, text: "Re-issue Working at Height permit before resumption", checked: false },
    ],
    contacts: [
      { role: "Toolpusher Lead", name: "Horen Gogoi", phone: "+91 94350-11204", priority: 1 },
      { role: "Rig HSE Inspector", name: "Deben Dutta", phone: "+91 94350-66778", priority: 2 },
      { role: "Area Superintendent", name: "Rajesh Kumar (GM)", phone: "+91 374-2800555", priority: 3 },
      { role: "Pad 7 First Aid Bay", name: "Emergency Medical Post", phone: "+91 94350-99881", priority: 4 },
      { role: "Dibrugarh Disaster Unit", name: "Dibrugarh Control Desk", phone: "+91 374-2338555", priority: 5 },
    ]
  },
  "Moran OCS-3": {
    location: "Moran OCS-3",
    sifPercent: 88,
    lsrRule: "LSR #5: MECHANICAL LIFTING",
    hazard: "Crawler crane swinging 5-ton drill pipe dangerously close to 33kV overhead power lines.",
    rootCause: "Crane lift started without a certified ground spotter or blind-spot guide.",
    failedBarrier: "Overhead Electrical Clearance & Spotter",
    energy: "33,000V Power Grid & 5-Ton Suspended Load",
    checklist: [
      { step: 1, text: "Signal crane operator for emergency horn & freeze boom position", checked: true },
      { step: 2, text: "Request substation 33kV line isolation if clearance < 5 meters", checked: false },
      { step: 3, text: "Clear all rigger crew from 15m radius load swing zone", checked: false },
      { step: 4, text: "Assign certified ground spotter with dedicated radio channel", checked: false },
      { step: 5, text: "Re-verify crane load chart and lift plan before resuming", checked: false },
    ],
    contacts: [
      { role: "Station In-Charge", name: "Pranjal Saikia", phone: "+91 94351-44552", priority: 1 },
      { role: "Lifting & Rigging Lead", name: "Anup Baruah", phone: "+91 94352-77119", priority: 2 },
      { role: "Moran Electrical Substation", name: "Power Grid Desk 2", phone: "+91 374-2800222", priority: 3 },
      { role: "Charaideo Fire Tender Unit", name: "Station 4 Rapid Squad", phone: "+91 374-2800101", priority: 4 },
      { role: "Disaster Management Desk", name: "Charaideo HQ", phone: "+91 374-2338555", priority: 5 },
    ]
  },
  "Geleki Processing": {
    location: "Geleki Processing",
    sifPercent: 85,
    lsrRule: "LSR #8: CONFINED SPACE & GAS",
    hazard: "High-speed heavy forklift maneuvering near pressurized flammable gas cylinder storage.",
    rootCause: "Vehicle speed governor disabled and safety crash barrier knocked over.",
    failedBarrier: "Physical Crash Barrier & Speed Governor",
    energy: "Pressurized Flammable Gas Cylinders",
    checklist: [
      { step: 1, text: "Halt all forklift traffic inside Gas Processing Zone B", checked: true },
      { step: 2, text: "Inspect manifold valves on cylinder bank for impact damage", checked: false },
      { step: 3, text: "Re-erect physical crash barriers and pedestrian exclusion zone", checked: false },
      { step: 4, text: "Enforce 10 km/h vehicle speed limit with security lead", checked: false },
      { step: 5, text: "Log near-miss precursor in OIL SIF audit register", checked: false },
    ],
    contacts: [
      { role: "Plant Safety Manager", name: "Nayan Chutia", phone: "+91 94354-11223", priority: 1 },
      { role: "Gas Plant Superintendent", name: "Bhaskar Konwar", phone: "+91 94353-88990", priority: 2 },
      { role: "Central Control Desk", name: "Sivasagar Desk S-1", phone: "+91 374-2800555", priority: 3 },
      { role: "Geleki Industrial Fire Squad", name: "Plant Tender Unit", phone: "+91 374-2800101", priority: 4 },
      { role: "District Disaster Unit", name: "Sivasagar HQ", phone: "+91 374-2338555", priority: 5 },
    ]
  }
};

const INGESTION_CHANNELS = [
  {
    id: 1,
    name: "Walkie-Talkie Bridge (RoIP Ch-09)",
    desc: "Rig floor drillers & pump operators via Channel 9 PTT",
    badge: "ATEX ZONE 1",
    status: "ONLINE",
  },
  {
    id: 2,
    name: "Flameproof Call Pillars",
    desc: "Wall-mounted emergency call stations in compressor areas",
    badge: "ATEX ZONE 1",
    status: "ONLINE",
  },
  {
    id: 3,
    name: "Zone 1 Rugged Handhelds",
    desc: "Intrinsically safe mobile terminals for maintenance leads",
    badge: "ATEX ZONE 1",
    status: "ONLINE",
  },
  {
    id: 4,
    name: "Plant Landline IVR (Ext. 555)",
    desc: "Control room & substation direct phone line recording",
    badge: "EPABX TRUNK",
    status: "ONLINE",
  },
  {
    id: 5,
    name: "Paper Shift Log OCR Scanner",
    desc: "Handwritten shift turnover sheets scanned with edge OCR",
    badge: "BATCH OCR",
    status: "READY",
  },
  {
    id: 6,
    name: "Muster Point Safety Kiosks",
    desc: "Toolbox talk & pre-shift JSA safety check-in terminals",
    badge: "OFFLINE SYNC",
    status: "ONLINE",
  },
];

function EmergencyCommandContent() {
  const searchParams = useSearchParams();
  const queryLocation = searchParams?.get("location") || searchParams?.get("site");

  const [activeTab, setActiveTab] = useState<"playbook" | "roip" | "channels">("playbook");
  const [selectedLocation, setSelectedLocation] = useState(() => {
    if (queryLocation) {
      const q = queryLocation.toLowerCase();
      if (q.includes("well pad") || q.includes("pad 7") || q.includes("wellpad")) return "Well Pad 7";
      if (q.includes("moran")) return "Moran OCS-3";
      if (q.includes("digboi")) return "Digboi Rig #2";
      if (q.includes("geleki")) return "Geleki GGS-1";
      if (q.includes("lakwa")) return "Lakwa Well #12";
      if (q.includes("baghjan")) return "Baghjan Well #5";
    }
    return "Well Pad 7";
  });

  useEffect(() => {
    if (queryLocation) {
      const q = queryLocation.toLowerCase();
      if (q.includes("well pad") || q.includes("pad 7") || q.includes("wellpad")) setSelectedLocation("Well Pad 7");
      else if (q.includes("moran")) setSelectedLocation("Moran OCS-3");
      else if (q.includes("digboi")) setSelectedLocation("Digboi Rig #2");
      else if (q.includes("geleki")) setSelectedLocation("Geleki GGS-1");
      else if (q.includes("lakwa")) setSelectedLocation("Lakwa Well #12");
      else if (q.includes("baghjan")) setSelectedLocation("Baghjan Well #5");
    }
  }, [queryLocation]);

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
  const [audioTranscript, setAudioTranscript] = useState("");
  const [channelSelected, setChannelSelected] = useState<number>(1);

  /* ── ⏱️ AUTONOMOUS DEAD-MAN ESCALATION ENGINE STATE ── */
  const [escalationStatus, setEscalationStatus] = useState<"IDLE" | "COUNTDOWN" | "AUTO_EXECUTED" | "MANUAL_ACKNOWLEDGED">("IDLE");
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [maxTime, setMaxTime] = useState<number>(15);
  const [callingProgress, setCallingProgress] = useState<{
    p1: "IDLE" | "DIALING" | "CONNECTED" | "VOICE_TRANSMITTING";
    p2: "IDLE" | "DIALING" | "CONNECTED" | "VOICE_TRANSMITTING";
    p3: "IDLE" | "DIALING" | "CONNECTED" | "VOICE_TRANSMITTING";
  }>({ p1: "IDLE", p2: "IDLE", p3: "IDLE" });

  const [auditLogs, setAuditLogs] = useState<string[]>([
    "System Initialized: OISD-189 Section 7.4 Fail-Safe Auto-Escalation Engine Armed.",
    "SIP Telephony Trunk: Connected to Oil India Private EPABX (+91 374-2800555).",
    "RoIP Radio Bridge: Listening on Motorola ATEX VHF Channel 9 (156.450 MHz)."
  ]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Latest Live Report
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/reports?limit=15&sort_by=latest`);
        if (res.ok) {
          const data = await res.json();
          const reports: any[] = data.reports || [];
          const matched = reports.find(r => 
            r.location && r.location.toLowerCase().includes(selectedLocation.split(" ")[0].toLowerCase())
          );
          if (matched && (matched.sif_score >= 0.50 || matched.sif_label === "HIGH" || matched.sif_label === "MEDIUM")) {
            setLiveWorkerReport({
              id: matched.id,
              text: matched.raw_text,
              sif_score: matched.sif_score,
              sif_label: matched.sif_label || (matched.sif_score >= 0.75 ? "HIGH" : "MEDIUM"),
              created_at: "LIVE SYNC",
              iogp_rule: matched.iogp_rule || "Critical SIF Precursor"
            });
          } else {
            setLiveWorkerReport(null);
          }
        }
      } catch {
        // Fallback
      }
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 3000);
    return () => clearInterval(interval);
  }, [selectedLocation]);

  const activeThreat = LOCATION_THREATS[selectedLocation] || LOCATION_THREATS["Baghjan Well #5"];
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

  const speakTextAloud = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  // ── SWA LOCKOUT TRIGGER ──
  const handleTriggerSWA = async (autoTriggered = false) => {
    setSwaExecuted(true);
    const msg = autoTriggered 
      ? `🛑 [AUTONOMOUS FAIL-SAFE] 500m SWA Lockout executed for ${selectedLocation.toUpperCase()}! Manager unresponsiveness threshold reached.`
      : `🛑 [MANUAL SWA EXECUTED] Safety Manager triggered shutdown for ${selectedLocation.toUpperCase()}! Active permits frozen.`;
    
    setSwaToast(msg);

    try {
      await fetch(`${API_BASE}/api/reports/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `[EMERGENCY SWA EXECUTED] ${autoTriggered ? "AUTONOMOUS FAIL-SAFE" : "Safety Manager"} triggered lockout for ${selectedLocation}. Immediate rig shutdown ordered.`,
          location: selectedLocation,
          activity_type: "Emergency SWA Shutdown",
          source: autoTriggered ? "AUTONOMOUS_DEAD_MAN_ENGINE" : "SWA_LOCKOUT_DESK",
        }),
      });
    } catch {
      // Offline fallback
    }

    setTimeout(() => setSwaToast(null), 10000);
  };

  // ── START DEAD-MAN BUFFER COUNTDOWN SIMULATION ──
  const startDeadManSimulation = (durationSeconds = 15) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    setTimeLeft(durationSeconds);
    setMaxTime(durationSeconds);
    setEscalationStatus("COUNTDOWN");
    setSwaExecuted(false);
    setCallingProgress({ p1: "IDLE", p2: "IDLE", p3: "IDLE" });

    const nowStr = new Date().toLocaleTimeString();
    setAuditLogs(prev => [
      `[${nowStr}] 🚨 CRITICAL ALARM: High SIF precursor at ${selectedLocation}. 60s Dead-Man Buffer Timer STARTED.`,
      `[${nowStr}] ⚠️ Waiting for on-duty Safety Officer response at console...`,
      ...prev
    ]);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          triggerAutonomousPrecautions();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── ACKNOWLEDGE & TAKE MANUAL COMMAND ──
  const handleAcknowledgeManualCommand = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setEscalationStatus("MANUAL_ACKNOWLEDGED");
    const nowStr = new Date().toLocaleTimeString();
    setAuditLogs(prev => [
      `[${nowStr}] 🛡️ MANUAL ACKNOWLEDGMENT: On-Duty Safety Officer assumed direct command. Autonomous timer HALTED.`,
      `[${nowStr}] 📋 Officer navigating OISD-189 Step-by-Step Isolation Checklist.`,
      ...prev
    ]);
  };

  // ── AUTONOMOUS PRECAUTIONS EXECUTION (BUFFER REACHES 0) ──
  const triggerAutonomousPrecautions = () => {
    setEscalationStatus("AUTO_EXECUTED");
    handleTriggerSWA(true);

    const nowStr = new Date().toLocaleTimeString();
    setAuditLogs(prev => [
      `[${nowStr}] 🛑 BUFFER EXPIRED (0s): Zero response from desk. AUTONOMOUS FAIL-SAFE EXECUTED.`,
      `[${nowStr}] 📡 SWA 500m Digital Perimeter Freeze broadcasted to all worker terminals (/worker).`,
      `[${nowStr}] 📞 SIP Auto-Dialer dispatched to Priority 1 Rig Manager (+91 94350-11201) & Priority 2 HSE Lead.`,
      `[${nowStr}] 📻 RoIP VHF Channel 9 automated text-to-speech evacuation broadcast TRANSMITTED.`,
      `[${nowStr}] 📜 OISD-189 Section 7.4 Compliance Audit Record permanently locked to PostgreSQL database.`,
      ...prev
    ]);

    // Animate Auto-Dialing Progress
    setCallingProgress({ p1: "DIALING", p2: "IDLE", p3: "IDLE" });
    setTimeout(() => {
      setCallingProgress({ p1: "CONNECTED", p2: "DIALING", p3: "IDLE" });
      setTimeout(() => {
        setCallingProgress({ p1: "VOICE_TRANSMITTING", p2: "CONNECTED", p3: "DIALING" });
        setTimeout(() => {
          setCallingProgress({ p1: "VOICE_TRANSMITTING", p2: "VOICE_TRANSMITTING", p3: "CONNECTED" });
        }, 1500);
      }, 1500);
    }, 1200);

    // Speak voice dispatch aloud in real-time
    const alertMessage = `Emergency Stop Work Authority alert from SANKET AI. High SIF Precursor detected at ${selectedLocation}. Zero response from site desk within buffer window. Autonomous 500-meter digital freeze has been initiated. All operations halt immediately.`;
    speakTextAloud(alertMessage);
  };

  const handleResetSimulation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setEscalationStatus("IDLE");
    setTimeLeft(15);
    setSwaExecuted(false);
    setCallingProgress({ p1: "IDLE", p2: "IDLE", p3: "IDLE" });
  };

  const handleSimulateRoIP = async () => {
    setIsSimulatingAudio(true);
    setAudioTranscript(`Connecting to Motorola ATEX Ch-09 safety stream at ${selectedLocation}...`);

    setTimeout(() => {
      if (liveWorkerReport) {
        setAudioTranscript(`"Mayday, this is ${selectedLocation} field operator — ${liveWorkerReport.text}"`);
      } else if (selectedLocation === "Well Pad 7") {
        setAudioTranscript('"Mayday, Rig 4 Safety — worker on 12m scaffold tower without harness over manifold. Immediate halt requested!"');
      } else if (selectedLocation === "Moran OCS-3") {
        setAudioTranscript('"Mayday, Moran OCS Crane Yard — 5-ton drill collar swinging within 3m of 33kV live power lines. Freeze boom!"');
      } else if (selectedLocation === "Geleki Processing") {
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
              OISD-189 SWA PROTOCOL
            </span>
          </div>
          <p className="text-[13px] text-[#5E7072] mt-0.5 font-normal">
            Autonomous Dead-Man Escalation Engine, Stop Work Authority lockout, and multi-channel fail-safe dispatch
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-[#F0F2ED] p-1 rounded-lg">
          <button type="button" suppressHydrationWarning
            onClick={() => setActiveTab("playbook")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "playbook"
                ? "bg-white text-[#1A2B2D] shadow-xs"
                : "text-[#5E7072] hover:text-[#1A2B2D]"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-[#D63B3B]" /> SWA Playbook & Fail-Safe
          </button>
          <button type="button" suppressHydrationWarning
            onClick={() => setActiveTab("roip")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "roip"
                ? "bg-white text-[#1A2B2D] shadow-xs"
                : "text-[#5E7072] hover:text-[#1A2B2D]"
            }`}
          >
            <Mic className="h-3.5 w-3.5 text-[#0A6B63]" /> RoIP Radio Bridge
          </button>
          <button type="button" suppressHydrationWarning
            onClick={() => setActiveTab("channels")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "channels"
                ? "bg-white text-[#1A2B2D] shadow-xs"
                : "text-[#5E7072] hover:text-[#1A2B2D]"
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
          <button type="button" suppressHydrationWarning onClick={() => setSwaToast(null)} className="text-white/80 hover:text-white font-bold text-sm px-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* ── 🌟 AUTONOMOUS DEAD-MAN ESCALATION ENGINE (OISD-189 BUFFER DEMO) ── */}
      <div className={`rounded-xl border-2 transition-all p-5 shadow-xs ${
        escalationStatus === "COUNTDOWN" 
          ? "bg-[#FFF9F2] border-[#F08C00] ring-2 ring-[#F08C00]/20" 
          : escalationStatus === "AUTO_EXECUTED"
          ? "bg-[#FFF5F5] border-[#D63B3B] ring-2 ring-[#D63B3B]/20"
          : escalationStatus === "MANUAL_ACKNOWLEDGED"
          ? "bg-[#F0FAF7] border-[#0A6B63]"
          : "bg-white border-[#C2CEC2]"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Clock className={`w-5 h-5 ${
                escalationStatus === "COUNTDOWN" 
                  ? "text-[#F08C00] animate-spin" 
                  : escalationStatus === "AUTO_EXECUTED"
                  ? "text-[#D63B3B] animate-pulse"
                  : "text-[#0A6B63]"
              }`} />
              <h2 className="font-heading font-bold text-base text-[#1A2B2D]">
                Autonomous Dead-Man Escalation Engine (OISD-189 Fail-Safe)
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                escalationStatus === "COUNTDOWN"
                  ? "bg-[#FFF3E0] text-[#D97706] border border-[#FCD34D] animate-pulse"
                  : escalationStatus === "AUTO_EXECUTED"
                  ? "bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]"
                  : escalationStatus === "MANUAL_ACKNOWLEDGED"
                  ? "bg-[#D1FAE5] text-[#059669] border border-[#6EE7B7]"
                  : "bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]"
              }`}>
                {escalationStatus === "COUNTDOWN" && "⏱️ BUFFER RUNNING (OFFICER AWAY)"}
                {escalationStatus === "AUTO_EXECUTED" && "🚨 AUTONOMOUS FAIL-SAFE TRIGGERED"}
                {escalationStatus === "MANUAL_ACKNOWLEDGED" && "✓ MANUAL COMMAND ACTIVE"}
                {escalationStatus === "IDLE" && "STANDBY ARMED"}
              </span>
            </div>
            <p className="text-xs text-[#5E7072]">
              Simulates what happens if a critical emergency occurs when the Safety Manager is away from the desk (in the washroom or occupied).
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center flex-wrap gap-2">
            {escalationStatus === "IDLE" && (
              <>
                <button
                  type="button"
                  onClick={() => startDeadManSimulation(15)}
                  className="px-3.5 py-2 rounded-lg bg-[#D63B3B] hover:bg-[#B92525] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" /> Simulate Unresponsive Manager (15s Buffer)
                </button>
                <button
                  type="button"
                  onClick={() => startDeadManSimulation(60)}
                  className="px-3 py-2 rounded-lg bg-[#F0F2ED] hover:bg-[#E2E6DC] text-[#1A2B2D] text-xs font-semibold transition-all border border-[#C2CEC2] cursor-pointer"
                >
                  60s Standard OISD Buffer
                </button>
              </>
            )}

            {escalationStatus === "COUNTDOWN" && (
              <>
                <button
                  type="button"
                  onClick={handleAcknowledgeManualCommand}
                  className="px-4 py-2 rounded-lg bg-[#0A6B63] hover:bg-[#08524C] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer animate-pulse"
                >
                  <ShieldCheck className="w-4 h-4" /> Acknowledge & Assume Manual Command
                </button>
                <button
                  type="button"
                  onClick={handleResetSimulation}
                  className="p-2 rounded-lg bg-white text-[#5E7072] hover:text-[#1A2B2D] border border-[#C2CEC2] text-xs transition-all cursor-pointer"
                  title="Reset Simulation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}

            {(escalationStatus === "AUTO_EXECUTED" || escalationStatus === "MANUAL_ACKNOWLEDGED") && (
              <button
                type="button"
                onClick={handleResetSimulation}
                className="px-3.5 py-2 rounded-lg bg-white hover:bg-[#F0F2ED] text-[#1A2B2D] text-xs font-bold transition-all border border-[#C2CEC2] shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Emergency Scenario
              </button>
            )}
          </div>
        </div>

        {/* Active Countdown Progress Bar */}
        {escalationStatus === "COUNTDOWN" && (
          <div className="mt-4 p-4 rounded-lg bg-white border border-[#F08C00]/40 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#D97706] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#D97706] animate-bounce" />
                Auto-Escalation Countdown: Officer Has {timeLeft} Seconds to Respond
              </span>
              <span className="font-mono font-bold text-sm text-[#D97706] bg-[#FFF3E0] px-2 py-0.5 rounded border border-[#FCD34D]">
                00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#F0F2ED] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#F08C00] to-[#D63B3B] transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(timeLeft / maxTime) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-[#5E7072] italic">
              If no acknowledgment is received before 00:00, SANKET AI will autonomously execute Stop Work Authority (SWA), trigger RoIP radio voice evacuation, and dispatch automated SIP phone calls to the response roster.
            </p>
          </div>
        )}

        {/* Autonomous Execution Live Telemetry Cards */}
        {escalationStatus === "AUTO_EXECUTED" && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* Card 1: SWA Lockout */}
              <div className="p-3.5 rounded-lg bg-white border-2 border-[#D63B3B] shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#5E7072]">ACTION 1: DIGITAL SWA</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#FEE2E2] text-[#DC2626] rounded">
                    500M FREEZE
                  </span>
                </div>
                <div className="text-xs font-bold text-[#D63B3B] flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-[#D63B3B] animate-pulse" />
                  SWA LOCKOUT BROADCASTED
                </div>
                <p className="text-[11px] text-[#5E7072] leading-tight">
                  All worker terminals at <b>{selectedLocation}</b> locked in Emergency Freeze. Work permits frozen.
                </p>
              </div>

              {/* Card 2: SIP VoIP Phone Auto-Dialer */}
              <div className="p-3.5 rounded-lg bg-white border border-[#C2CEC2] shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#5E7072]">ACTION 2: SIP AUTO-DIALER</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#E8F4F0] text-[#0A6B63] rounded">
                    VOIP DISPATCH
                  </span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#1A2B2D] font-medium truncate">Rig Manager (OIM)</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      callingProgress.p1 === "VOICE_TRANSMITTING"
                        ? "bg-[#D1FAE5] text-[#059669] animate-pulse"
                        : "bg-[#FEF3C7] text-[#D97706]"
                    }`}>
                      {callingProgress.p1 === "VOICE_TRANSMITTING" ? "VOICE PLAYING" : "CONNECTING..."}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#1A2B2D] font-medium truncate">HSE Safety Lead</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      callingProgress.p2 === "VOICE_TRANSMITTING"
                        ? "bg-[#D1FAE5] text-[#059669]"
                        : "bg-[#FEF3C7] text-[#D97706]"
                    }`}>
                      {callingProgress.p2 === "VOICE_TRANSMITTING" ? "VOICE PLAYING" : "DIALING"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: RoIP Radio Voice Dispatch */}
              <div className="p-3.5 rounded-lg bg-white border border-[#C2CEC2] shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#5E7072]">ACTION 3: ROIP BROADCAST</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#E8F4F0] text-[#0A6B63] rounded">
                    VHF CH-09
                  </span>
                </div>
                <div className="text-xs font-bold text-[#0A6B63] flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-[#0A6B63] animate-pulse" />
                  AUDIO EVACUATION DISPATCHED
                </div>
                <p className="text-[11px] text-[#5E7072] leading-tight">
                  Automated Text-to-Speech synthesized and transmitted across Motorola ATEX radios.
                </p>
              </div>

            </div>

            {/* Audit Log Terminal Box */}
            <div className="p-3 rounded-lg bg-[#102123] text-[#A3E635] font-mono text-[11px] space-y-1 border border-[#234E52]">
              <div className="flex items-center justify-between text-[#85A2A6] text-[10px] pb-1 border-b border-[#234E52]">
                <span className="flex items-center gap-1 font-bold">
                  <Terminal className="w-3 h-3 text-[#A3E635]" /> OISD-189 SECTION 7.4 AUDIT COMPLIANCE STREAM
                </span>
                <span>STATUS: LOCKED & IMMUTABLE</span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-0.5 pt-1">
                {auditLogs.slice(0, 4).map((log, idx) => (
                  <div key={idx} className="leading-tight">
                    <span className="text-[#85A2A6]">&gt;</span> {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── TAB 1: SWA PLAYBOOK & LIVE ESCALATION ── */}
      {activeTab === "playbook" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Left Column: SIF Precursor Alert & SWA Lockout Trigger (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Critical Escalation Card */}
            <div className="bg-white rounded-xl border-2 border-[#C2CEC2] border-l-4 border-l-[#D63B3B] shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#D63B3B]" />
                  <h3 className="font-heading font-bold text-sm text-[#1A2B2D]">
                    Critical SIF Hazard Alert ({liveWorkerReport ? Math.round(liveWorkerReport.sif_score * 100) : activeThreat.sifPercent}% Risk)
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#FDF2F2] text-[#D63B3B] border border-[#F5C6C6]">
                  {liveWorkerReport ? (liveWorkerReport.iogp_rule || "SIF PRECURSOR") : activeThreat.lsrRule}
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

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#E2E8E2] text-xs">
                  <div>
                    <span className="text-[11px] text-[#5E7072] block font-semibold">Degraded Barrier:</span>
                    <span className="font-bold text-[#D63B3B]">{activeThreat.failedBarrier}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#5E7072] block font-semibold">High-Energy Magnitude:</span>
                    <span className="font-bold text-[#1A2B2D]">{activeThreat.energy}</span>
                  </div>
                </div>
              </div>

              {/* Master SWA Lockout Trigger Action */}
              <div className="pt-2">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => handleTriggerSWA(false)}
                  className={`w-full py-3 px-4 rounded-xl font-heading font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                    swaExecuted
                      ? "bg-[#FDF2F2] border-2 border-[#D63B3B] text-[#D63B3B]"
                      : "bg-[#D63B3B] hover:bg-[#B92525] text-white"
                  }`}
                >
                  <AlertOctagon className={`h-4 w-4 ${swaExecuted ? "text-[#D63B3B]" : "text-white"}`} />
                  {swaExecuted 
                    ? `SWA LOCKOUT ACTIVE (${selectedLocation.toUpperCase()}) — ALL RIG WORK FROZEN` 
                    : "EXECUTE MANUAL STOP WORK AUTHORITY (SWA) LOCKOUT"}
                </button>
              </div>
            </div>

            {/* OISD-189 Standard 5-Step Isolation Checklist */}
            <div className="bg-white rounded-xl border border-[#C2CEC2] shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-sm text-[#1A2B2D]">
                    OISD-189 Standard Isolation Protocol
                  </h3>
                  <p className="text-xs text-[#5E7072] mt-0.5">
                    Regulatory response steps for {selectedLocation}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-xs text-[#0A6B63]">
                    {completedSteps} / {currentChecklist.length} Complete
                  </span>
                  <div className="w-24 h-1.5 bg-[#F0F2ED] rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-[#0A6B63] transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {currentChecklist.map((item) => (
                  <button
                    key={item.step}
                    type="button"
                    suppressHydrationWarning
                    onClick={() => toggleChecklist(item.step)}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-150 flex items-start gap-3 cursor-pointer ${
                      item.checked
                        ? "bg-[#F0FAF7] border-[#A3D9C9] text-[#1A2B2D]"
                        : "bg-white border-[#C2CEC2] hover:bg-[#F7F8F5] text-[#5E7072]"
                    }`}
                  >
                    <div className="mt-0.5">
                      {item.checked ? (
                        <CheckSquare className="h-4 w-4 text-[#0A6B63] shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-[#85A2A6] shrink-0" />
                      )}
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-[#1A2B2D] mr-2">Step {item.step}:</span>
                      <span className={item.checked ? "font-medium text-[#1A2B2D]" : "font-normal"}>
                        {item.text}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Emergency Contacts & Location Selector (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Location Selector Switcher */}
            <div className="bg-white rounded-xl border border-[#C2CEC2] shadow-xs p-4 space-y-3">
              <label className="block text-xs font-bold text-[#1A2B2D]">
                Select Active Operational Location:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.keys(LOCATION_THREATS).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setSelectedLocation(loc)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all text-left truncate cursor-pointer ${
                      selectedLocation === loc
                        ? "bg-[#0A6B63] text-white shadow-xs"
                        : "bg-[#F7F8F5] text-[#5E7072] hover:bg-[#EAECE6] border border-[#C2CEC2]"
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Call Roster */}
            <div className="bg-white rounded-xl border border-[#C2CEC2] shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-sm text-[#1A2B2D]">
                    Emergency Call Roster
                  </h3>
                  <p className="text-xs text-[#5E7072] mt-0.5">
                    Priority contact list for {selectedLocation}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F4F0] text-[#0A6B63] border border-[#A3D9C9]">
                  5 CONTACTS
                </span>
              </div>

              <div className="space-y-2">
                {activeThreat.contacts.map((contact) => (
                  <div
                    key={contact.priority}
                    className="p-3 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] flex items-center justify-between hover:border-[#85A2A6] transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#1A2B2D] text-white">
                          P{contact.priority}
                        </span>
                        <span className="text-xs font-bold text-[#1A2B2D]">{contact.role}</span>
                      </div>
                      <p className="text-[11px] text-[#5E7072]">{contact.name}</p>
                    </div>

                    <a
                      href={`tel:${contact.phone}`}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-[#C2CEC2] hover:border-[#0A6B63] hover:text-[#0A6B63] text-xs font-bold text-[#1A2B2D] transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Phone className="h-3 w-3 text-[#0A6B63]" />
                      <span className="font-mono">{contact.phone}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ── TAB 2: ROIP RADIO BRIDGE ── */}
      {activeTab === "roip" && (
        <div className="bg-white rounded-xl border border-[#C2CEC2] shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#E2E8E2] pb-4">
            <div>
              <h2 className="font-heading font-bold text-base text-[#1A2B2D]">
                Motorola ATEX RoIP Safety Radio Stream
              </h2>
              <p className="text-xs text-[#5E7072] mt-0.5">
                Radio-over-IP bridge capturing real-time VHF Channel 9 rig floor communications
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F0FAF7] text-[#0A6B63] border border-[#A3D9C9] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0A6B63] animate-pulse"></span>
              ROIP GATEWAY ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#F7F8F5] border border-[#C2CEC2] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#1A2B2D]">
                  <span>VHF Base Station: Duliajan Rig-4</span>
                  <span className="font-mono text-[#0A6B63]">156.450 MHz</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#5E7072]">
                  <span>Hardware Mode: E&M 4-Wire RoIP</span>
                  <span>Sample Rate: 16 kHz PCM</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#5E7072]">
                  <span>Active Channel: Channel 09 (Rig Safety)</span>
                  <span>Zone: ATEX Zone 1</span>
                </div>
              </div>

              <button
                type="button"
                suppressHydrationWarning
                onClick={handleSimulateRoIP}
                disabled={isSimulatingAudio}
                className="w-full py-3 px-4 rounded-xl bg-[#0A6B63] hover:bg-[#08524C] text-white font-heading font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Radio className={`h-4 w-4 ${isSimulatingAudio ? "animate-spin" : ""}`} />
                {isSimulatingAudio ? "CAPTURING LIVE RADIO FREQUENCY..." : `SIMULATE VHF CH-09 INGESTION FOR ${selectedLocation.toUpperCase()}`}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#102123] text-white space-y-3 font-mono text-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[#85A2A6] text-[10px] pb-2 border-b border-[#234E52]">
                  <span>LIVE ROIP AUDIO DECODER</span>
                  <span>UDP/SIP 16kHz</span>
                </div>
                <div className="mt-3 text-xs leading-relaxed text-[#D2E7D6]">
                  {audioTranscript || (
                    <span className="text-[#5E7072] italic">
                      Push the button to listen into the live radio stream from {selectedLocation}...
                    </span>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-[#85A2A6] pt-2 border-t border-[#234E52] flex items-center justify-between">
                <span>Latency: 35ms</span>
                <span>Buffer: 0 KB/s Out (Air-Gapped)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: HARDWARE INGESTION CHANNELS ── */}
      {activeTab === "channels" && (
        <div className="bg-white rounded-xl border border-[#C2CEC2] shadow-xs p-6 space-y-6">
          <div className="border-b border-[#E2E8E2] pb-4">
            <h2 className="font-heading font-bold text-base text-[#1A2B2D]">
              Industrial Ingestion Channels (Zone 1 Certified)
            </h2>
            <p className="text-xs text-[#5E7072] mt-0.5">
              Standard operating input modes deployed across Oil India operational assets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INGESTION_CHANNELS.map((ch) => (
              <div
                key={ch.id}
                onClick={() => setChannelSelected(ch.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                  channelSelected === ch.id
                    ? "bg-[#F0FAF7] border-[#0A6B63] shadow-xs"
                    : "bg-[#F7F8F5] border-[#C2CEC2] hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1A2B2D] text-white">
                    CH-0{ch.id}
                  </span>
                  <span className="text-[10px] font-bold text-[#0A6B63] bg-[#E8F4F0] px-2 py-0.5 rounded border border-[#A3D9C9]">
                    {ch.badge}
                  </span>
                </div>
                <h4 className="font-heading font-bold text-xs text-[#1A2B2D]">{ch.name}</h4>
                <p className="text-[11px] text-[#5E7072] leading-tight">{ch.desc}</p>
                <div className="text-[10px] font-bold text-[#0A6B63] pt-1">
                  STATUS: {ch.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default function EmergencyCommandPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-[#5E7072]">Loading Emergency Command Console...</div>}>
      <EmergencyCommandContent />
    </Suspense>
  );
}
