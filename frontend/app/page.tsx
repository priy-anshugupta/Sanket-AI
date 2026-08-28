'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Shield, Brain, Network, AlertTriangle, Users, ArrowRight, Play, Lock, Radio } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="relative min-h-screen h-screen w-full bg-[#05080E] text-white flex flex-col justify-between overflow-hidden selection:bg-red-500 selection:text-white font-sans">
      
      {/* ── Background Image Layer (Un-zoomed & Right-Anchored) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/assets/hero_refinery_bg.png"
          alt="Oil India Refinery Infrastructure"
          fill
          priority
          className="object-cover object-right md:object-[right_center] opacity-80"
          sizes="100vw"
        />
        {/* Master Studio Dark Gradient Overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, #05080E 0%, #05080E 35%, rgba(5,8,14,0.7) 65%, rgba(5,8,14,0.3) 100%)'
          }}
        />
        {/* Top and Bottom subtle vignetting */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#05080E] via-[#05080E]/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#05080E] via-[#05080E]/70 to-transparent" />
      </div>

      {/* ── Top Navigation Bar ── */}
      <header className="relative z-20 w-full px-8 lg:px-14 py-5 flex items-center justify-between border-b border-white/[0.07] backdrop-blur-md bg-[#05080E]/40">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-b from-red-600 to-red-700 flex items-center justify-center shadow-md shadow-red-950/60 border border-red-500/30">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-heading font-extrabold text-xl tracking-tight text-white">SANKET</span>
              <span className="font-heading font-extrabold text-xl text-red-500">· AI</span>
            </div>
            <p className="text-[9px] uppercase font-mono tracking-[0.18em] text-slate-400 mt-1 font-medium">
              AI Safety Intelligence Platform
            </p>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <Link href="/dashboard" className="hover:text-white transition-colors">Product</Link>
          <Link href="/dashboard/heatmap" className="hover:text-white transition-colors">SIF Heatmap</Link>
          <Link href="/dashboard/graph" className="hover:text-white transition-colors">Signal Graph</Link>
          <Link href="/dashboard/replay" className="hover:text-white transition-colors">Disaster Replay</Link>
        </nav>

        {/* Right Status + Auth */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-emerald-400 text-[11px] font-medium tracking-wide">
              AIR-GAPPED · 0 KB/s OUT
            </span>
          </div>

          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-white/15 bg-white/[0.04] hover:bg-white/10 text-white text-xs font-semibold tracking-wider uppercase transition-all hover:border-white/30"
          >
            <Lock className="w-3 h-3 text-slate-400" />
            LOGIN
          </Link>
        </div>
      </header>

      {/* ── Main Hero Content (Plus Jakarta Sans Luxury Typography) ── */}
      <main className="relative z-10 w-full px-8 lg:px-14 py-4 lg:py-6 max-w-7xl flex-1 flex flex-col justify-center">
        <div className="max-w-2xl">
          
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-md bg-red-500/10 border border-red-500/25">
            <Radio className="w-3 h-3 text-red-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-red-400">
              INDUSTRIAL SAFETY. REIMAGINED.
            </span>
          </div>

          {/* Clean, Sculpted Plus Jakarta Sans Headline */}
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-[52px] leading-[1.08] mb-4 text-white">
            SEE THE SANKET<br />
            BEFORE IT BECOMES<br />
            <span className="text-red-600 drop-shadow-[0_0_25px_rgba(220,38,38,0.45)]">
              THE INCIDENT.
            </span>
          </h1>

          {/* Elegant Subheadline */}
          <p className="text-sm sm:text-[15px] text-slate-300 max-w-lg leading-relaxed mb-6 font-normal">
            SANKET analyzes thousands of safety reports in real-time, detecting hidden patterns,
            degraded barriers, and SIF precursors before catastrophic failure cascades occur.
          </p>

          {/* 4 Sleek Micro Feature Cards (2x2 Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7 max-w-lg">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.06] transition-colors">
              <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                <Brain className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] font-bold font-mono uppercase tracking-wider text-white truncate">AI / NLP Engine</h4>
                <p className="text-[10px] text-slate-400 truncate">Understands free-text safety reports</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.06] transition-colors">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <Network className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] font-bold font-mono uppercase tracking-wider text-white truncate">Pattern Intelligence</h4>
                <p className="text-[10px] text-slate-400 truncate">Connects related incidents across time</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.06] transition-colors">
              <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] font-bold font-mono uppercase tracking-wider text-white truncate">SIF Precursor Detection</h4>
                <p className="text-[10px] text-slate-400 truncate">Identifies high-potential risks early</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.06] transition-colors">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] font-bold font-mono uppercase tracking-wider text-white truncate">Human-In-The-Loop</h4>
                <p className="text-[10px] text-slate-400 truncate">Empowering HSE teams with audit trails</p>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3.5">
            <Link
              href="/login"
              className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all duration-200 flex items-center gap-2.5 shadow-lg shadow-red-950/60 border border-red-500/40 hover:scale-[1.02]"
            >
              ENTER COMMAND CENTER
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/dashboard/replay"
              className="px-5 py-3 rounded-xl border border-white/20 hover:border-white/40 text-white font-semibold text-xs tracking-wider uppercase transition-all duration-200 backdrop-blur-md hover:bg-white/10 flex items-center gap-2"
            >
              <Network className="w-3.5 h-3.5 text-amber-400" />
              EXPLORE ARCHITECTURE
            </Link>
          </div>
        </div>
      </main>

      {/* ── Footer Sovereign Status Bar ── */}
      <footer className="relative z-20 w-full px-8 lg:px-14 py-3.5 border-t border-white/[0.07] bg-[#05080E]/70 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-semibold">AIR-GAPPED SYSTEM</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">0 KB/s OUT</span>
        </div>

        <div className="font-mono text-[10px] text-slate-400 tracking-wider">
          SECURE. PRIVATE. COMPLIANT. | BUILT FOR OIL INDIA. POWERED FOR SAFETY.
        </div>

        <div className="font-mono text-slate-500 text-[10px]">
          SIH26165 · MINISTRY OF PETROLEUM & NATURAL GAS
        </div>
      </footer>
    </div>
  );
}
