'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ClipboardList, 
  Map, 
  Network, 
  History, 
  Mic, 
  Settings, 
  LogOut, 
  Radio, 
  ShieldAlert,
  Menu,
  X,
  Bell,
  BellOff,
  AlertTriangle,
  ArrowRight,
  User,
  MapPin,
  Flame,
  CheckCircle2,
  Clock,
  ExternalLink,
  Shield,
  HardHat
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

const API_BASE = typeof window !== 'undefined' ? `http://${window.location.hostname}:8000` : 'http://localhost:8000';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Triage Queue', icon: ClipboardList, shortcut: 'F9' },
  { href: '/dashboard/heatmap', label: 'SIF Heatmap', icon: Map, shortcut: 'F8' },
  { href: '/dashboard/emergency', label: 'Emergency Playbook', icon: ShieldAlert, shortcut: 'F1', badge: 'SWA' },
  { href: '/dashboard/control-room', label: 'DCS Control Room', icon: Radio, shortcut: 'F2', badge: 'LIVE' },
  { href: '/dashboard/graph', label: 'Signal Graph', icon: Network, shortcut: 'F6' },
  { href: '/dashboard/replay', label: 'Baghjan Replay', icon: History, shortcut: 'F10' },
  { href: '/dashboard/voice', label: 'Field Reporter', icon: Mic, shortcut: 'F13' },
  { href: '/dashboard/settings', label: 'System Control', icon: Settings, shortcut: 'F16' },
];

interface LiveAlert {
  id: string;
  raw_text: string;
  sif_score: number;
  sif_label: string;
  location?: string;
  iogp_rule?: string;
  reporter?: string;
  created_at?: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ full_name: string; role: string; username: string } | null>(null);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  
  // Real-time live alert & sound state
  const [activeAlert, setActiveAlert] = useState<LiveAlert | null>(null);
  const [alertSoundEnabled, setAlertSoundEnabled] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<LiveAlert[]>([
    {
      id: 'REP-DEMO-01',
      raw_text: 'Annular BOP secondary valve seal weeping hydraulic fluid under 1800 PSI vibration at Well Pad 7.',
      sif_score: 0.94,
      sif_label: 'HIGH',
      location: 'Well Pad 7 (Upper Assam)',
      iogp_rule: 'Energy Isolation',
      reporter: 'Bikash Das (Rig Floor Operator)',
      created_at: 'Just now'
    },
    {
      id: 'REP-DEMO-02',
      raw_text: 'High vibration 42mm/s detected on mud pump #2 during high-pressure circulation test.',
      sif_score: 0.82,
      sif_label: 'HIGH',
      location: 'Baghjan Well #5',
      iogp_rule: 'Equipment Integrity',
      reporter: 'Horen Gogoi (Toolpusher)',
      created_at: '12m ago'
    },
    {
      id: 'REP-DEMO-03',
      raw_text: 'Cellar pit gas detector reading 15 PPM H2S during drain line flush.',
      sif_score: 0.78,
      sif_label: 'HIGH',
      location: 'Moran OCS-3',
      iogp_rule: 'Toxic Gas Exposure',
      reporter: 'Debojit Saikia (Site Tech)',
      created_at: '28m ago'
    }
  ]);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(3);
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  const lastSeenIdRef = useRef<string | null>(null);
  const isInitialFetchRef = useRef<boolean>(true);
  const notificationDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const checkScreen = () => {
      const isMob = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobileScreen(isMob);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sanket_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        setCurrentUser({ full_name: 'Rajesh Kumar', role: 'hse_manager', username: 'rajesh' });
      }

      const storedSound = localStorage.getItem('sanket_alert_sound');
      if (storedSound !== null) {
        setAlertSoundEnabled(storedSound === 'true');
      }
    } catch {
      setCurrentUser({ full_name: 'Rajesh Kumar', role: 'hse_manager', username: 'rajesh' });
    }
  }, []);

  useEffect(() => {
    const fetchSys = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/system/airgap`);
        if (res.ok) {
          const d = await res.json();
          setSystemStatus(d);
        }
      } catch {}
    };
    fetchSys();
    const interval = setInterval(fetchSys, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target as Node)
      ) {
        setIsNotificationDrawerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSound = () => {
    const nextVal = !alertSoundEnabled;
    setAlertSoundEnabled(nextVal);
    try {
      localStorage.setItem('sanket_alert_sound', String(nextVal));
    } catch {
      // Ignore
    }
    if (nextVal) {
      playChime(880, 1174, 0.15);
    }
  };

  // Pure Web Audio API Tone Synthesizer
  const playChime = (freq1 = 880, freq2 = 1174, duration = 0.25) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq1, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + duration);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq2, now + 0.12);
      gain2.gain.setValueAtTime(0.22, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + duration + 0.2);
    } catch {
      // AudioContext blocked
    }
  };

  // Live polling listener for instant cross-terminal sync
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const checkLatestReports = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/reports?limit=1&page=1&sort_by=latest`);
        if (!res.ok) return;
        const data = await res.json();
        const latest = data.reports?.[0];

        if (!latest) return;

        if (isInitialFetchRef.current) {
          lastSeenIdRef.current = latest.id;
          isInitialFetchRef.current = false;
          return;
        }

        if (latest.id !== lastSeenIdRef.current) {
          lastSeenIdRef.current = latest.id;
          
          const isHighSif = latest.sif_label === 'HIGH' || (latest.sif_score && latest.sif_score >= 0.70);

          const newAlert: LiveAlert = {
            id: latest.id,
            raw_text: latest.raw_text,
            sif_score: latest.sif_score || 0.88,
            sif_label: latest.sif_label || (isHighSif ? 'HIGH' : 'MEDIUM'),
            location: latest.location || 'Well Pad 7 (Upper Assam)',
            iogp_rule: latest.iogp_rule || 'Energy Isolation & Barrier Integrity',
            reporter: 'Bikash Das (OIL-OP-4491 · Rig Floor)',
            created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          // Always add to notification bell dropdown & increment unread counter
          setNotifications(prev => [newAlert, ...prev.filter(n => n.id !== newAlert.id).slice(0, 29)]);
          setUnreadCount(c => c + 1);

          // Pop up floating alert banner
          setActiveAlert(newAlert);
          if (alertSoundEnabled) {
            playChime(880, 1174, 0.35);
          }

          window.dispatchEvent(new CustomEvent('sanket:new_report', { detail: latest }));
        }
      } catch {
        // Silent catch
      }
    };

    checkLatestReports();
    timer = setInterval(checkLatestReports, 3000);

    return () => clearInterval(timer);
  }, [alertSoundEnabled]);

  const handleLogout = () => {
    localStorage.removeItem('sanket_token');
    localStorage.removeItem('sanket_user');
    router.push('/login');
  };

  const currentNav = NAV_ITEMS.find(i => pathname === i.href || (i.href !== '/dashboard' && pathname?.startsWith(i.href))) || NAV_ITEMS[0];

  // ── MOBILE LOCKOUT SCREEN FOR SAFETY MANAGER DASHBOARD ──
  if (isMobileScreen) {
    return (
      <div className="min-h-screen w-full bg-[#0F1B1D] text-white p-6 flex flex-col items-center justify-center text-center space-y-5 selection:bg-[#0A6B63]">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Shield className="w-8 h-8" />
        </div>
        
        <div className="space-y-2 max-w-sm">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/30">
            🔒 OISD-189 Security Restriction
          </span>
          <h1 className="text-lg font-heading font-bold text-white mt-1">
            HQ Command Center Restricted on Mobile
          </h1>
          <p className="text-xs text-[#8BA4A7] leading-relaxed">
            Per Oil India Limited Operational Safety Standards, the <strong>Safety Manager Command Dashboard</strong> is restricted to authorized Desktop & Control Room workstations.
          </p>
        </div>

        <div className="w-full max-w-xs space-y-3 pt-2">
          <Link
            href="/worker"
            className="w-full py-3 bg-[#0A6B63] hover:bg-[#085B54] text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <HardHat className="w-4 h-4" />
            Switch to Field Worker Terminal
          </Link>

          <Link
            href="/login"
            className="w-full py-2.5 bg-[#1D3234] hover:bg-[#233D3F] text-[#8BA4A7] hover:text-white font-semibold text-xs rounded-xl border border-[#264245] flex items-center justify-center gap-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Return to Login Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F7F8F5] overflow-hidden text-[#1A2B2D]">
      
      {/* ── REAL-TIME HIGH SIF POP-UP NOTIFICATION TOAST ── */}
      {activeAlert && (
        <div className="fixed top-16 right-6 z-50 max-w-md w-full animate-in slide-in-from-top-3 fade-in duration-300">
          <div className={`p-4 rounded-xl border-2 shadow-2xl backdrop-blur-md ${
            activeAlert.sif_label === 'HIGH'
              ? 'bg-[#162829] border-[#D63B3B] text-white shadow-red-950/40'
              : 'bg-[#162829] border-[#D4820A] text-white shadow-amber-950/40'
          }`}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="font-heading font-black text-xs uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {activeAlert.sif_label === 'HIGH' ? 'CRITICAL SIF PRECURSOR INGESTED' : 'SAFETY INCIDENT DETECTED'}
                </span>
              </div>
              <button type="button" suppressHydrationWarning 
                onClick={() => setActiveAlert(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-md hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono border-b border-white/10 pb-1.5">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <User className="w-3 h-3" /> {activeAlert.reporter}
                </span>
                <span className="px-2 py-0.5 rounded font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                  SIF {(activeAlert.sif_score * 100).toFixed(0)}% · {activeAlert.sif_label}
                </span>
              </div>

              <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed font-normal bg-black/30 p-2 rounded-lg border border-white/5">
                "{activeAlert.raw_text}"
              </p>

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <MapPin className="w-3 h-3 text-[#0A6B63]" />
                  <span className="truncate">{activeAlert.location}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button type="button" suppressHydrationWarning
                    onClick={() => {
                      setActiveAlert(null);
                      router.push(`/dashboard/report/${activeAlert.id}`);
                    }}
                    className="px-3 py-1 bg-[#0A6B63] hover:bg-[#085B54] text-white text-xs font-bold rounded-md transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span>View in Triage</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Backdrop ── */}
      {isNavigationOpen && (
        <button type="button" suppressHydrationWarning
          aria-label="Close navigation"
          onClick={() => setIsNavigationOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* ── Left Executive Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col justify-between border-r-2 border-[#B8C5B8] bg-white shadow-[2px_0_6px_rgba(0,0,0,0.04)] transition-transform duration-200 lg:static lg:w-64 lg:translate-x-0 ${isNavigationOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full lg:shadow-[2px_0_6px_rgba(0,0,0,0.04)]'}`}>
        
        {/* Brand Header */}
        <div>
          <div className="flex items-center justify-between border-b border-[#E2E8E2] px-5 py-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-8 h-8 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Image
                  src="/assets/sanket_logo_derrick.png"
                  alt="SANKET AI Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <div className="flex items-center gap-1 leading-none">
                  <span className="font-heading font-bold text-[15px] tracking-tight text-[#1A2B2D]">SANKET</span>
                  <span className="font-heading font-bold text-[15px] text-[#0A6B63]">· AI</span>
                </div>
                <p className="text-[11px] text-[#5E7072] mt-0.5 font-medium">
                  Oil India Limited
                </p>
              </div>
            </Link>
            <button type="button" suppressHydrationWarning
              aria-label="Close navigation"
              onClick={() => setIsNavigationOpen(false)}
              className="rounded-lg p-1.5 text-[#5E7072] hover:bg-[#F0F2ED] lg:hidden cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Section */}
          <div className="px-3 py-3 overflow-y-auto max-h-[calc(100vh-270px)]">
            <div className="px-3 py-1.5 mb-1 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-[#94A3A5] font-semibold">
                Safety Operations
              </span>
              
              <button type="button" suppressHydrationWarning
                onClick={toggleSound}
                title={alertSoundEnabled ? "Mute audio alarms" : "Enable audio alarms"}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                  alertSoundEnabled
                    ? 'bg-[#EDFAF4] text-[#1B8A6C] border border-[#BFEADB]'
                    : 'bg-[#F0F2ED] text-[#94A3A5] border border-[#DDE3DD]'
                }`}
              >
                {alertSoundEnabled ? <Bell className="w-2.5 h-2.5" /> : <BellOff className="w-2.5 h-2.5" />}
                <span>{alertSoundEnabled ? 'CHIME' : 'MUTED'}</span>
              </button>
            </div>

            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                const isExactDashboard = item.href === '/dashboard' && pathname === '/dashboard';
                const active = isActive || isExactDashboard;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsNavigationOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group ${
                      active
                        ? 'bg-[#0A6B63] text-white shadow-xs font-semibold'
                        : 'text-[#3E5052] hover:bg-[#F0F2ED] hover:text-[#1A2B2D]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-white' : 'text-[#5E7072] group-hover:text-[#1A2B2D]'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && !active && (
                        item.badge === 'SWA' ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#FDF2F2] text-[#D63B3B] border border-[#F5C6C6]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D63B3B]" />
                            SWA
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#EDFAF4] text-[#1B8A6C] border border-[#BFEADB]">
                            {item.badge}
                          </span>
                        )
                      )}
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        active ? 'bg-white/20 text-white' : 'bg-[#F0F2ED] text-[#94A3A5] group-hover:text-[#5E7072]'
                      }`}>
                        {item.shortcut}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Status & Profile */}
        <div className="p-3 border-t border-[#E2E8E2] space-y-2">
          {/* Live Ingest Telemetry Pill */}
          <div className="px-3 py-1.5 rounded-lg bg-[#F0F2ED] border border-[#C2CEC2] flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-[#0A6B63] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#0A6B63] animate-pulse" />
              <span>LIVE INGESTION</span>
            </div>
            <span className="text-[#5E7072]">3s POLL SYNC</span>
          </div>

          {/* Dynamic System Mode Badge */}
          <div className={`px-3 py-2 rounded-lg border flex items-center justify-between ${
            systemStatus && !systemStatus.is_airgapped
              ? 'bg-blue-50/70 border-blue-200 text-blue-800'
              : 'bg-[#EDFAF4] border-[#BFEADB] text-[#1B8A6C]'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                systemStatus && !systemStatus.is_airgapped ? 'bg-blue-600 animate-pulse' : 'bg-[#1B8A6C]'
              }`} />
              <div>
                <div className="text-[11px] font-semibold">
                  {systemStatus && !systemStatus.is_airgapped ? 'HYBRID ONLINE' : 'SOVEREIGN AIR-GAP'}
                </div>
                <div className="text-[10px] font-mono opacity-80">
                  {systemStatus && !systemStatus.is_airgapped ? `${systemStatus.outbound_kbps || '1.6'} KB/s · GPT-4O` : '0 KB/s OUT · LOCAL'}
                </div>
              </div>
            </div>
            <Radio className="w-3.5 h-3.5" />
          </div>

          {/* User Profile Pill */}
          <div className="px-3 py-2 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#0A6B63] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {currentUser?.full_name?.charAt(0) || 'R'}
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-[#1A2B2D] truncate">
                  {currentUser?.full_name || 'Rajesh Kumar'}
                </div>
                <div className="text-[11px] text-[#5E7072] capitalize truncate font-normal">
                  {currentUser?.role?.replace('_', ' ') || 'HSE Manager'}
                </div>
              </div>
            </div>

            <button type="button" suppressHydrationWarning
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-[#5E7072] hover:text-[#D63B3B] hover:bg-[#FDF2F2] rounded-md transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main App Content ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F7F8F5]">
        
        {/* ── Top Executive Header Bar (Desktop & Mobile) ── */}
        <header className="h-14 shrink-0 border-b border-[#C2CEC2] bg-white px-5 flex items-center justify-between z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          
          {/* Left Title & Mobile Menu */}
          <div className="flex items-center gap-3">
            <button type="button" suppressHydrationWarning
              aria-label="Open navigation"
              onClick={() => setIsNavigationOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#C2CEC2] text-[#3E5052] lg:hidden cursor-pointer hover:bg-[#F0F2ED]"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-[#5E7072] hidden sm:inline">Operations</span>
              <span className="text-[#94A3A5] hidden sm:inline">/</span>
              <span className="font-heading font-bold text-sm text-[#1A2B2D] tracking-tight">
                {currentNav.label}
              </span>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0F2ED] border border-[#C2CEC2] text-[10px] font-mono text-[#5E7072]">
                <MapPin className="w-2.5 h-2.5 text-[#0A6B63]" /> Upper Assam Basin
              </span>
            </div>
          </div>

          {/* Right Executive Actions & Notification Tray */}
          <div className="flex items-center gap-2.5">
            
            {/* Sound Switch Button */}
            <button type="button" suppressHydrationWarning
              onClick={toggleSound}
              title={alertSoundEnabled ? "Audio chime active" : "Audio chime muted"}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all border cursor-pointer ${
                alertSoundEnabled
                  ? 'bg-[#EDFAF4] border-[#BFEADB] text-[#1B8A6C]'
                  : 'bg-[#F7F8F5] border-[#C2CEC2] text-[#5E7072]'
              }`}
            >
              {alertSoundEnabled ? <Bell className="w-3.5 h-3.5 text-[#1B8A6C]" /> : <BellOff className="w-3.5 h-3.5 text-[#94A3A5]" />}
              <span>{alertSoundEnabled ? 'CHIME ON' : 'MUTED'}</span>
            </button>

            {/* Notification Center Dropdown */}
            <div className="relative" ref={notificationDropdownRef}>
              <button type="button" suppressHydrationWarning
                onClick={() => {
                  setIsNotificationDrawerOpen(!isNotificationDrawerOpen);
                  if (!isNotificationDrawerOpen) setUnreadCount(0);
                }}
                className={`relative p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                  isNotificationDrawerOpen
                    ? 'bg-[#0A6B63] border-[#0A6B63] text-white shadow-xs'
                    : 'bg-white border-[#C2CEC2] text-[#1A2B2D] hover:bg-[#F0F2ED]'
                }`}
                title="Field Safety Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#D63B3B] text-white text-[9px] font-mono font-bold animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {isNotificationDrawerOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border-2 border-[#B8C5B8] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  
                  {/* Dropdown Header */}
                  <div className="p-3.5 bg-[#F0F2ED] border-b border-[#C2CEC2] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#0A6B63]" />
                      <span className="font-heading font-bold text-xs text-[#1A2B2D]">
                        Field Safety Live Notifications
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white text-[#0A6B63] border border-[#C2CEC2]">
                      {notifications.length} Alerts
                    </span>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#E2E8E2]">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#5E7072]">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                        No active safety precursor alerts.
                      </div>
                    ) : (
                      notifications.map((notif, idx) => (
                        <div 
                          key={`${notif.id}-${idx}`}
                          onClick={() => {
                            setIsNotificationDrawerOpen(false);
                            router.push(`/dashboard/report/${notif.id}`);
                          }}
                          className="p-3 hover:bg-[#F7F8F5] transition-colors cursor-pointer space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 font-bold text-[#1A2B2D]">
                              <span className="w-2 h-2 rounded-full bg-[#D63B3B]" />
                              <span>{notif.reporter || 'Field Worker'}</span>
                            </div>
                            <span className="text-[10px] font-mono text-[#94A3A5] flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" /> {notif.created_at}
                            </span>
                          </div>

                          <p className="text-xs text-[#3E5052] line-clamp-2 leading-relaxed">
                            "{notif.raw_text}"
                          </p>

                          <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                            <span className="text-[#5E7072] flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#0A6B63]" /> {notif.location}
                            </span>
                            <span className="px-1.5 py-0.5 rounded font-bold bg-[#FDF2F2] text-[#D63B3B] border border-[#F5C6C6]">
                              SIF {(notif.sif_score * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="p-2.5 bg-[#F0F2ED] border-t border-[#C2CEC2] flex items-center justify-between text-xs">
                    <button type="button" suppressHydrationWarning
                      onClick={() => setNotifications([])}
                      className="text-[11px] text-[#5E7072] hover:text-[#D63B3B] font-semibold cursor-pointer"
                    >
                      Clear All
                    </button>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsNotificationDrawerOpen(false)}
                      className="text-[11px] font-bold text-[#0A6B63] hover:underline flex items-center gap-1"
                    >
                      <span>Open Full Triage Queue</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                </div>
              )}
            </div>

            {/* Dynamic System Status Pill */}
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold ${
              systemStatus && !systemStatus.is_airgapped
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-[#EDFAF4] border-[#BFEADB] text-[#1B8A6C]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                systemStatus && !systemStatus.is_airgapped ? 'bg-blue-600' : 'bg-[#1B8A6C]'
              }`} />
              <span>{systemStatus && !systemStatus.is_airgapped ? 'HYBRID ONLINE · GPT-4O' : 'AIR-GAPPED'}</span>
            </div>

          </div>

        </header>

        {/* ── Main Workspace Canvas ── */}
        <main className="flex-1 overflow-y-auto bg-[#F7F8F5]">
          {children}
        </main>
      </div>

    </div>
  );
}
