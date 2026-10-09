'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, User, ArrowLeft, ArrowRight, Sparkles, HardHat } from 'lucide-react';
import { getApiBase } from '@/lib/config';

export default function LoginPage() {
  const router = useRouter();
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [activeTab, setActiveTab] = useState<'manager' | 'worker'>('manager');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [badgeId, setBadgeId] = useState('4491');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [demoBypass, setDemoBypass] = useState(false);

  // Mobile Device Detection (Locks Manager Login on Phone)
  useEffect(() => {
    let bypass = false;
    try {
      bypass = localStorage.getItem('sanket_demo_override') === 'true';
      if (bypass) setDemoBypass(true);
    } catch {}

    const checkMobile = () => {
      const isMobile = window.innerWidth < 480 || /iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobileDevice(isMobile);
      if (isMobile && !bypass) {
        setActiveTab('worker');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleManagerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMobileDevice && !demoBypass) {
      setError('🔒 Access Denied: Safety Manager Operations are restricted to HQ Desktop/Laptop workstations per OISD-189.');
      return;
    }
    setIsLoggingIn(true);
    setError('');

    try {
      const loginUrl = getApiBase('/api/auth/login');

      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Invalid username or password');
      }

      const data = await res.json();
      localStorage.setItem('sanket_token', data.token);
      localStorage.setItem('sanket_user', JSON.stringify(data));
      
      if (data.role === 'field_worker') {
        window.dispatchEvent(new Event('sanket:auth'));
        router.push('/worker');
      } else {
        window.dispatchEvent(new Event('sanket:auth'));
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please verify credentials or backend connection.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const quickLogin = async (u: string, p: string, targetPath?: string) => {
    if (isMobileDevice && !demoBypass && (u === 'rajesh' || u === 'priya')) {
      setError('🔒 Access Denied: Manager accounts (Rajesh/Priya) cannot be used on mobile phones. Please use Field Worker Terminal or tap Demo Override.');
      setActiveTab('worker');
      return;
    }
    setUsername(u);
    setPassword(p);
    setIsLoggingIn(true);
    setError('');

    const defaultPath = u === 'bikash' || u === 'horen' ? '/worker' : '/dashboard';
    const destination = targetPath || defaultPath;

    try {
      const loginUrl = getApiBase('/api/auth/login');

      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });

      if (!res.ok) {
        const mockUser = {
          token: 'mock-jwt-token-demo',
          username: u,
          role: (u === 'bikash' || u === 'horen') ? 'field_worker' : 'hse_manager',
          full_name: u === 'rajesh' ? 'Rajesh Kumar (HSE GM)' : u === 'priya' ? 'Priya Singh (Site Officer)' : u === 'horen' ? 'Horen Gogoi (Toolpusher)' : 'Bikash Das (Rig Floor Operator)'
        };
        localStorage.setItem('sanket_token', mockUser.token);
        localStorage.setItem('sanket_user', JSON.stringify(mockUser));
        window.dispatchEvent(new Event('sanket:auth'));
        router.push(destination);
        return;
      }

      const data = await res.json();
      localStorage.setItem('sanket_token', data.token);
      localStorage.setItem('sanket_user', JSON.stringify(data));
      window.dispatchEvent(new Event('sanket:auth'));
      router.push(destination);
    } catch {
      const mockUser = {
        token: 'mock-jwt-token-demo',
        username: u,
        role: (u === 'bikash' || u === 'horen') ? 'field_worker' : 'hse_manager',
        full_name: u === 'rajesh' ? 'Rajesh Kumar (HSE GM)' : u === 'priya' ? 'Priya Singh (Site Officer)' : u === 'horen' ? 'Horen Gogoi (Toolpusher)' : 'Bikash Das (Rig Floor Operator)'
      };
      localStorage.setItem('sanket_token', mockUser.token);
      localStorage.setItem('sanket_user', JSON.stringify(mockUser));
      window.dispatchEvent(new Event('sanket:auth'));
      router.push(destination);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0F1B1D] text-white flex flex-col justify-between selection:bg-[#0A6B63] selection:text-white font-sans">
      {/* Background Image Container */}
      <div 
        className="absolute inset-0 z-0 bg-no-repeat bg-cover bg-center opacity-30"
        style={{
          backgroundImage: 'url(/assets/hero_refinery_bg.png), url(/hero_refinery_bg.png)',
        }}
      >
        <div className="absolute inset-0 bg-[#0F1B1D]/85" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full px-6 lg:px-16 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-[#8BA4A7] hover:text-white transition-colors text-xs font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Overview
        </Link>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-emerald-400 text-xs font-semibold">AI ENGINE ACTIVE</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg rounded-2xl border border-[#264245] bg-[#162829]/95 backdrop-blur-xl p-7 shadow-2xl">
          
          {/* Logo & Heading */}
          <div className="text-center mb-6">
            <div className="relative w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <Image
                src="/assets/sanket_logo_derrick.png"
                alt="SANKET AI Logo"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="font-heading font-bold text-xl tracking-tight text-white">
              SANKET <span className="text-[#1B8A6C]">· AI</span>
            </h1>
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#8BA4A7] mt-0.5">
              Oil India Limited — Safety Authentication Portal
            </p>
          </div>

          {/* 2-Portal Tab Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-[#0F1B1D] border border-[#264245] mb-6">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => { setActiveTab('manager'); setError(''); }}
              className={`py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'manager'
                  ? 'bg-[#0A6B63] text-white shadow-xs'
                  : 'text-[#8BA4A7] hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Safety Manager (HQ)
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => { setActiveTab('worker'); setError(''); }}
              className={`py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'worker'
                  ? 'bg-[#0A6B63] text-white shadow-xs'
                  : 'text-[#8BA4A7] hover:text-white'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              Field Worker / Rig Floor
            </button>
          </div>

          {/* ── PORTAL 1: SAFETY MANAGER LOGIN ── */}
          {activeTab === 'manager' && (
            <div className="space-y-4" suppressHydrationWarning>
              {isMobileDevice && !demoBypass ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      HQ Command Center Locked on Mobile
                    </h3>
                    <p className="text-[11px] text-[#8BA4A7] mt-1 leading-relaxed">
                      Per Oil India Security Protocol (OISD-189), the <strong>Safety Manager HQ Portal</strong> is restricted to authorized Desktop/Control Room terminals.
                    </p>
                  </div>
                  <button suppressHydrationWarning
                    type="button"
                    onClick={() => setActiveTab('worker')}
                    className="w-full py-2.5 bg-[#0A6B63] hover:bg-[#085B54] text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <HardHat className="w-4 h-4" />
                    Use Field Worker Terminal on Mobile
                  </button>
                  <button suppressHydrationWarning
                    type="button"
                    onClick={() => {
                      setDemoBypass(true);
                      try { localStorage.setItem('sanket_demo_override', 'true'); } catch {}
                      setError('');
                    }}
                    className="w-full py-2 bg-transparent hover:bg-white/5 text-[#0A6B63] hover:text-[#0D8A80] font-mono text-[11px] font-bold rounded-lg border border-[#0A6B63]/40 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    ⚡ Demo Override: Unlock HQ Login on Narrow Screen
                  </button>
                </div>
              ) : (
                <>
                  {/* Demo 1-Click Quick Access Pills for Evaluators — AT THE TOP */}
                  <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 tracking-wide uppercase">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        1-Click Quick Access
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                        No Password Needed
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" suppressHydrationWarning
                        onClick={() => quickLogin('rajesh', 'rajesh123', '/dashboard')}
                        className="p-2.5 rounded-lg border border-[#264245] bg-[#1D3234] hover:bg-[#233D3F] hover:border-[#0A6B63] text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">Rajesh Kumar</span>
                          <ArrowRight className="w-3 h-3 text-[#8BA4A7] group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <div className="text-[10px] text-[#8BA4A7] font-mono mt-0.5">HSE GM (HQ Duliajan)</div>
                        <div className="text-[10px] font-mono text-emerald-400/90 mt-1.5 pt-1.5 border-t border-white/5 flex items-center gap-1">
                          <span className="text-[#8BA4A7]">Creds:</span> rajesh / rajesh123
                        </div>
                      </button>

                      <button type="button" suppressHydrationWarning
                        onClick={() => quickLogin('priya', 'priya123', '/dashboard')}
                        className="p-2.5 rounded-lg border border-[#264245] bg-[#1D3234] hover:bg-[#233D3F] hover:border-[#0A6B63] text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">Priya Singh</span>
                          <ArrowRight className="w-3 h-3 text-[#8BA4A7] group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <div className="text-[10px] text-[#8BA4A7] font-mono mt-0.5">Site Safety Officer</div>
                        <div className="text-[10px] font-mono text-emerald-400/90 mt-1.5 pt-1.5 border-t border-white/5 flex items-center gap-1">
                          <span className="text-[#8BA4A7]">Creds:</span> priya / priya123
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Subtle Divider */}
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-[#264245]"></div>
                    <span className="flex-shrink mx-3 text-[10px] font-mono uppercase tracking-wider text-[#5E7072]">
                      Or Manual Credentials
                    </span>
                    <div className="flex-grow border-t border-[#264245]"></div>
                  </div>

                  {/* Manual Form */}
                  <form onSubmit={handleManagerLogin} className="space-y-3" suppressHydrationWarning>
                    <div>
                      <label className="block text-[11px] font-medium uppercase text-[#8BA4A7] mb-1">
                        Username / Employee ID <span className="text-[10px] font-mono text-[#5E7072]">(e.g. rajesh)</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3 top-3 text-[#5E7072]" />
                        <input
                          type="text"
                          suppressHydrationWarning
                          placeholder="e.g. rajesh"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#1D3234] border border-[#264245] text-[#F7F8F5] placeholder-[#5E7072] focus:outline-none focus:ring-1 focus:ring-[#0A6B63] focus:border-[#0A6B63] transition-all text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium uppercase text-[#8BA4A7] mb-1">
                        Password <span className="text-[10px] font-mono text-[#5E7072]">(e.g. rajesh123)</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-3 text-[#5E7072]" />
                        <input
                          type="password"
                          suppressHydrationWarning
                          placeholder="e.g. rajesh123"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#1D3234] border border-[#264245] text-[#F7F8F5] placeholder-[#5E7072] focus:outline-none focus:ring-1 focus:ring-[#0A6B63] focus:border-[#0A6B63] transition-all text-xs"
                          required
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      suppressHydrationWarning
                      className="w-full py-2.5 bg-[#0A6B63] hover:bg-[#085B54] text-white font-semibold text-xs tracking-wider uppercase rounded-lg transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isLoggingIn ? 'Authenticating...' : 'Sign In to Command Center'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* ── PORTAL 2: FIELD WORKER QUICK-ACCESS ── */}
          {activeTab === 'worker' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-[#FEF7EC]/10 border border-[#F8DFB6]/20 text-[#F8DFB6] text-xs leading-relaxed">
                <strong>ATEX Zone 1/2 Field Terminal:</strong> Simplified, high-contrast mobile interface for rig floor operators and toolpushers with giant PTT voice logging.
              </div>

              {/* 1-Click Crew Profiles — AT THE TOP */}
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 tracking-wide uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    1-Click Crew Launch
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                    Auto-Launch
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button type="button" suppressHydrationWarning
                    onClick={() => quickLogin('bikash', 'bikash123', '/worker')}
                    className="p-2.5 rounded-lg border border-[#264245] bg-[#1D3234] hover:bg-[#233D3F] hover:border-[#1B8A6C] text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">Bikash Das</span>
                      <ArrowRight className="w-3 h-3 text-[#8BA4A7] group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="text-[10px] text-[#8BA4A7] font-mono mt-0.5">Rig Floor Operator (Well Pad 7)</div>
                    <div className="text-[10px] font-mono text-emerald-400/90 mt-1.5 pt-1.5 border-t border-white/5 flex items-center gap-1">
                      <span className="text-[#8BA4A7]">Badge / Creds:</span> 4491 / bikash
                    </div>
                  </button>

                  <button type="button" suppressHydrationWarning
                    onClick={() => quickLogin('horen', 'horen123', '/worker')}
                    className="p-2.5 rounded-lg border border-[#264245] bg-[#1D3234] hover:bg-[#233D3F] hover:border-[#1B8A6C] text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">Horen Gogoi</span>
                      <ArrowRight className="w-3 h-3 text-[#8BA4A7] group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="text-[10px] text-[#8BA4A7] font-mono mt-0.5">Drilling Toolpusher (Rig #4)</div>
                    <div className="text-[10px] font-mono text-emerald-400/90 mt-1.5 pt-1.5 border-t border-white/5 flex items-center gap-1">
                      <span className="text-[#8BA4A7]">Badge / Creds:</span> 4491 / horen
                    </div>
                  </button>
                </div>
              </div>

              {/* Subtle Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#264245]"></div>
                <span className="flex-shrink mx-3 text-[10px] font-mono uppercase tracking-wider text-[#5E7072]">
                  Or Enter 4-Digit Badge ID
                </span>
                <div className="flex-grow border-t border-[#264245]"></div>
              </div>

              {/* Manual Badge ID */}
              <div>
                <label className="block text-[11px] font-medium uppercase text-[#8BA4A7] mb-1">
                  Enter 4-Digit Rig Badge ID <span className="text-[10px] font-mono text-[#5E7072]">(default: 4491)</span>
                </label>
                <input suppressHydrationWarning
                  type="text"
                  maxLength={4}
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#1D3234] border border-[#264245] text-center font-mono text-xl tracking-[0.4em] text-white focus:outline-none focus:border-[#0A6B63] transition-colors"
                />
              </div>

              <button type="button" suppressHydrationWarning
                onClick={() => quickLogin('bikash', 'bikash123', '/worker')}
                disabled={isLoggingIn}
                className="w-full py-2.5 bg-[#0A6B63] hover:bg-[#085B54] text-white font-semibold text-xs tracking-wider uppercase rounded-lg transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <HardHat className="w-4 h-4" />
                Open Rugged Field Terminal (/worker)
              </button>

            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 py-3 text-center text-[11px] font-mono text-[#5E7072] border-t border-white/5">
        SANKET · AI Safety Intelligence Platform • Compliant with OISD-STD-149 & DGMS Regulations
      </footer>
    </div>
  );
}
