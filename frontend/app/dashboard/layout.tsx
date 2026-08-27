'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Shield, 
  ClipboardList, 
  Map, 
  Network, 
  History, 
  Mic, 
  Settings, 
  LogOut, 
  Radio, 
  ShieldAlert,
  Flame,
  LayoutDashboard
} from 'lucide-react';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Triage Queue', icon: ClipboardList, shortcut: 'F9' },
  { href: '/dashboard/heatmap', label: 'SIF Heatmap', icon: Map, shortcut: 'F8' },
  { href: '/dashboard/emergency', label: 'Emergency Playbook', icon: ShieldAlert, shortcut: 'F1', badge: 'CRITICAL' },
  { href: '/dashboard/control-room', label: 'DCS Control Room', icon: Radio, shortcut: 'F2', badge: 'LIVE' },
  { href: '/dashboard/graph', label: 'Signal Graph', icon: Network, shortcut: 'F6' },
  { href: '/dashboard/replay', label: 'Baghjan Replay', icon: History, shortcut: 'F10' },
  { href: '/dashboard/voice', label: 'Field Reporter', icon: Mic, shortcut: 'F13' },
  { href: '/dashboard/settings', label: 'System Control', icon: Settings, shortcut: 'F16' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ full_name: string; role: string; username: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sanket_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        setCurrentUser({ full_name: 'Rajesh Kumar', role: 'hse_manager', username: 'rajesh' });
      }
    } catch {
      setCurrentUser({ full_name: 'Rajesh Kumar', role: 'hse_manager', username: 'rajesh' });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('sanket_token');
    localStorage.removeItem('sanket_user');
    router.push('/login');
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden">
      
      {/* ── Left Executive Sidebar ── */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 z-20 shadow-sm">
        
        {/* Brand Header */}
        <div>
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-md shadow-red-900/30 border border-red-500/30 group-hover:scale-105 transition-transform">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1 leading-none">
                  <span className="font-heading font-black text-base tracking-tight text-slate-900">SANKET</span>
                  <span className="font-heading font-black text-base text-red-600">· AI</span>
                </div>
                <p className="text-[9px] uppercase font-mono tracking-widest text-slate-400 mt-1 font-semibold">
                  Oil India Limited
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Section */}
          <div className="px-3 py-3 overflow-y-auto max-h-[calc(100vh-210px)]">
            <div className="px-3 py-1.5 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-400 font-bold">
                Safety Command Center
              </span>
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
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                      active
                        ? 'bg-red-600 text-white shadow-md shadow-red-950/20'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && !active && (
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          item.badge === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700 animate-pulse'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        active ? 'bg-red-700 text-red-100' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'
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
        <div className="p-3 border-t border-slate-100 space-y-2">
          {/* Sovereign Air-Gap Badge */}
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="text-[10px] font-bold text-emerald-800 uppercase font-mono">Air-Gapped Sovereign</div>
                <div className="text-[9px] font-mono text-emerald-600 font-semibold">0 KB/s Zero-Egress</div>
              </div>
            </div>
            <Radio className="w-3.5 h-3.5 text-emerald-600" />
          </div>

          {/* User Profile Pill */}
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {currentUser?.full_name?.charAt(0) || 'R'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {currentUser?.full_name || 'Rajesh Kumar'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono capitalize truncate">
                  {currentUser?.role?.replace('_', ' ') || 'HSE Manager'}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main App Content ── */}
      <main className="flex-1 h-screen overflow-y-auto bg-[#F8FAFC]">
        {children}
      </main>
    </div>
  );
}
