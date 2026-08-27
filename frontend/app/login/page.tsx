'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, User, Mic, ArrowLeft, ArrowRight, CheckCircle, Radio, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'manager' | 'worker'>('manager');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [badgeId, setBadgeId] = useState('1042');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');

  const handleManagerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
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
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Is backend running on localhost:8000?');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const quickLogin = async (u: string, p: string, targetPath = '/dashboard') => {
    setUsername(u);
    setPassword(p);
    setIsLoggingIn(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });

      if (!res.ok) {
        // Fallback for offline demo mode
        const mockUser = {
          token: 'mock-jwt-token-demo',
          username: u,
          role: u === 'bikash' ? 'field_worker' : 'hse_manager',
          full_name: u === 'rajesh' ? 'Rajesh Kumar (HSE GM)' : u === 'priya' ? 'Priya Singh (Site Officer)' : u === 'bikash' ? 'Bikash (Rig Floor Tech)' : 'Admin'
        };
        localStorage.setItem('sanket_token', mockUser.token);
        localStorage.setItem('sanket_user', JSON.stringify(mockUser));
        router.push(targetPath);
        return;
      }

      const data = await res.json();
      localStorage.setItem('sanket_token', data.token);
      localStorage.setItem('sanket_user', JSON.stringify(data));
      router.push(targetPath);
    } catch {
      // Offline fallback for smooth demo presentation
      const mockUser = {
        token: 'mock-jwt-token-demo',
        username: u,
        role: u === 'bikash' ? 'field_worker' : 'hse_manager',
        full_name: u === 'rajesh' ? 'Rajesh Kumar (HSE GM)' : u === 'bikash' ? 'Bikash (Rig Floor Tech)' : 'Site Officer'
      };
      localStorage.setItem('sanket_token', mockUser.token);
      localStorage.setItem('sanket_user', JSON.stringify(mockUser));
      router.push(targetPath);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#05080E] text-white flex flex-col justify-between selection:bg-red-500 selection:text-white">
      {/* Background Image Container */}
      <div 
        className="absolute inset-0 z-0 bg-no-repeat bg-cover bg-center opacity-40 filter blur-[1px]"
        style={{
          backgroundImage: 'url(/assets/hero_refinery_bg.png), url(/hero_refinery_bg.png)',
        }}
      >
        <div className="absolute inset-0 bg-[#05080E]/80" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full px-6 lg:px-16 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 text-gray-400 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </Link>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-emerald-400 text-xs font-semibold">AIR-GAP ACTIVE</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0A0D14]/90 backdrop-blur-xl p-8 shadow-2xl shadow-black/80">
          {/* Logo & Heading */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-950/60 border border-red-500/40">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-display font-black text-2xl tracking-tight text-white">
              SANKET <span className="text-red-500">· AI</span>
            </h1>
            <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mt-1">
              Oil India Limited — Safety Authentication Portal
            </p>
          </div>

          {/* 2-Portal Tab Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10 mb-8">
            <button
              onClick={() => { setActiveTab('manager'); setError(''); }}
              className={`py-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'manager'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              👔 Safety Manager
            </button>

            <button
              onClick={() => { setActiveTab('worker'); setError(''); }}
              className={`py-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'worker'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4" />
              👷 Field Worker
            </button>
          </div>

          {/* ── PORTAL 1: SAFETY MANAGER / OFFICER ── */}
          {activeTab === 'manager' && (
            <div>
              <form onSubmit={handleManagerLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-400 mb-1.5">Username / Employee ID</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="e.g. rajesh or priya"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-gray-400 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-500" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors text-sm"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-red-950/60 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoggingIn ? 'Authenticating...' : 'Sign In to Command Center'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Demo 1-Click Quick Access Pills for Evaluators */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Demo 1-Click Judge Profiles:
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => quickLogin('rajesh', 'rajesh123', '/dashboard')}
                    className="p-2.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-red-500/40 text-left transition-all group"
                  >
                    <div className="text-xs font-bold text-white group-hover:text-red-400">Rajesh Kumar</div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">HSE GM (HQ)</div>
                  </button>

                  <button
                    onClick={() => quickLogin('priya', 'priya123', '/dashboard')}
                    className="p-2.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-red-500/40 text-left transition-all group"
                  >
                    <div className="text-xs font-bold text-white group-hover:text-red-400">Priya Singh</div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">Site Safety Officer</div>
                  </button>

                  <button
                    onClick={() => quickLogin('admin', 'admin123', '/dashboard')}
                    className="p-2.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-red-500/40 text-left transition-all group"
                  >
                    <div className="text-xs font-bold text-white group-hover:text-red-400">Administrator</div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">Full System Access</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── PORTAL 2: FIELD WORKER QUICK-ACCESS ── */}
          {activeTab === 'worker' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
                👷 <strong>Field Reporting Mode:</strong> Simplified, touch-optimized interface for rig floor technicians. Instant multilingual voice recording (Hindi / Assamese / English) and quick text fallback.
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-400 mb-1.5">Enter 4-Digit Rig Badge ID</label>
                <input
                  type="text"
                  maxLength={4}
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-center font-mono text-2xl tracking-[0.5em] text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <button
                onClick={() => quickLogin('bikash', 'bikash123', '/dashboard/voice')}
                disabled={isLoggingIn}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-sm tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2.5"
              >
                <Mic className="w-5 h-5 animate-pulse" />
                Start Voice / Text Field Report
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-gray-500 font-mono">
                  Default Worker: Bikash (Upper Assam Well Pad 7)
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 py-4 text-center text-xs text-gray-500 font-mono">
        © 2026 SANKET · AI | Oil India Limited Industrial Safety Intelligence
      </footer>
    </div>
  );
}
