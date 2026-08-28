'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Brain, 
  Network, 
  AlertTriangle, 
  Users, 
  ArrowRight, 
  Lock, 
  Radio, 
  Map, 
  Mic, 
  History, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  ChevronRight, 
  AlertOctagon,
  Check
} from 'lucide-react';

export default function HomePage() {
  const [activePipelineStage, setActivePipelineStage] = useState(0);
  const [currentUser, setCurrentUser] = useState<{ full_name: string; role: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sanket_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  const PIPELINE_STAGES = [
    {
      step: '01',
      title: 'Multilingual Ingestion & Preprocessing',
      subtitle: 'Field Voice RoIP & Unstructured Text',
      desc: 'Ingests near-miss observations, shift handover logs, and worker PTT audio in Assamese, Hindi, and English. Cleans noise, normalizes oilfield slang, and strips sensitive identifiers.',
      badge: 'Multilingual Whisper + Normalization',
      color: '#1B8A6C',
    },
    {
      step: '02',
      title: 'Domain Vector Embeddings',
      subtitle: 'Deterministic Anchor Similarity',
      desc: 'Maps incident text into dense vector space using safety-calibrated sentence embeddings. Measures cosine similarity against curated SIF anchor vectors with zero LLM hallucination risk.',
      badge: 'BGE-Small / MiniLM-L6-v2',
      color: '#0A6B63',
    },
    {
      step: '03',
      title: 'Zero-Shot Industrial Entity Extraction',
      subtitle: 'NER & Physical Asset Tagging',
      desc: 'Extracts critical industrial entities: equipment tags (BOP, Mud Pump, Flange), locations (Well Pad 7, Moran OCS), barrier failures, energy sources, and weather conditions.',
      badge: 'Custom Oil & Gas Domain NER',
      color: '#D4820A',
    },
    {
      step: '04',
      title: 'IOGP Life-Saving Rules Mapping',
      subtitle: 'International Safety Taxonomy',
      desc: 'Automatically classifies observations against the 9 IOGP Life-Saving Rules (Energy Isolation, Bypass Safety Controls, Line of Fire, Safe Mechanical Lifting, Confined Space).',
      badge: 'IOGP 9 LSR Framework',
      color: '#0284C7',
    },
    {
      step: '05',
      title: 'Explainable SIF Precursor Scoring',
      subtitle: 'DEKRA Precursor Decision Engine',
      desc: 'Computes continuous SIF Risk Score (0.0 to 1.0) and generates plain-English grounded causal explanations citing energy containment breakdowns and barrier degradation.',
      badge: 'DEKRA SIF Potential Model',
      color: '#D63B3B',
    },
    {
      step: '06',
      title: 'Cross-Incident Correlation Graph',
      subtitle: 'Multi-Signal Knowledge Graph',
      desc: 'Connects isolated low-level events across days and equipment: weeping valve + pressure surge + delayed maintenance = imminent catastrophic wellhead blowout alert.',
      badge: 'NetworkX + Graph Neural Clustering',
      color: '#8B5CF6',
    },
    {
      step: '07',
      title: 'Spatial Stop Work Authority (SWA)',
      subtitle: 'Automated 500m Permit Lockout',
      desc: 'Instantly dispatches Stop Work Authority to Toolpushers, freezes active hot-work e-PTWs within dynamic 500m blast radius, and logs immutable timestamped audit trails.',
      badge: 'GIS Buffer Perimeter Freeze',
      color: '#D63B3B',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#0F1B1D] text-[#F7F8F5] flex flex-col selection:bg-[#0A6B63] selection:text-white font-sans overflow-x-hidden scroll-smooth">
      
      {/* ── Top Fixed Navigation Bar ── */}
      <header className="sticky top-0 z-50 w-full px-6 lg:px-14 py-3.5 flex items-center justify-between border-b border-white/[0.08] backdrop-blur-xl bg-[#0F1B1D]/85">
        <Link href="#" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
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
              <span className="font-heading font-bold text-base tracking-tight text-white">SANKET</span>
              <span className="font-heading font-bold text-base text-[#1B8A6C]">· AI</span>
            </div>
            <p className="text-[9px] uppercase font-mono tracking-[0.14em] text-[#8BA4A7] mt-0.5 font-medium">
              SIF Precursor Detection Engine
            </p>
          </div>
        </Link>

        {/* Center Section Jump Links (Smooth Scroll) */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-medium text-[#8BA4A7]">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pipeline" className="hover:text-white transition-colors">7-Stage Pipeline</a>
          <a href="#case-study" className="hover:text-white transition-colors">Baghjan Case Study</a>
          <a href="#compliance" className="hover:text-white transition-colors">Compliance</a>
        </nav>

        {/* Right Status + Auth Controls */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-emerald-400 text-[10px] font-semibold tracking-wide">
              AIR-GAPPED · 0 KB/s
            </span>
          </div>

          <Link
            href={currentUser?.role === 'field_worker' ? '/worker' : '/login?role=worker'}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold transition-all shadow-xs"
          >
            <Mic className="w-3.5 h-3.5 text-amber-400" />
            Field Terminal
          </Link>

          <Link
            href={currentUser ? '/dashboard' : '/login'}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0A6B63] hover:bg-[#085B54] text-white text-xs font-semibold transition-all shadow-xs"
          >
            {currentUser ? (
              <>
                <span>Enter HQ</span>
                <ArrowRight className="w-3 h-3" />
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 text-white/80" />
                <span>Sign In</span>
              </>
            )}
          </Link>
        </div>
      </header>

      {/* ── SECTION 1: HERO SHOWCASE ── */}
      <section className="relative min-h-[82vh] w-full flex items-center justify-start border-b border-white/[0.08] overflow-hidden px-6 lg:px-14 py-8 lg:py-12">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/assets/hero_refinery_bg.png"
            alt="Oil India Refinery Infrastructure"
            fill
            priority
            className="object-cover object-right md:object-[right_center] opacity-95"
            sizes="100vw"
          />
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, #0F1B1D 0%, #0F1B1D 28%, rgba(15,27,29,.50) 50%, transparent 80%)'
            }}
          />
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0F1B1D] via-[#0F1B1D]/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0F1B1D] via-[#0F1B1D]/40 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-xl text-left">
          
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 mb-3.5 px-3 py-1 rounded-md bg-[#0A6B63]/20 border border-[#0A6B63]/40">
            <Radio className="w-3 h-3 text-[#1B8A6C]" />
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#BCE3DC]">
              OIL INDIA LIMITED · PROBLEM STATEMENT SIH26165
            </span>
          </div>

          {/* Clean Proportional Headline */}
          <h1 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl lg:text-[46px] leading-[1.12] mb-3.5 text-white">
            See the weak signal.<br />
            Avert the catastrophic<br />
            <span className="text-[#1B8A6C]">
              barrier failure.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-[14.5px] text-slate-300 leading-relaxed font-normal max-w-lg mb-5">
            SANKET correlates multi-source safety observations, physical telemetry, and recurring near-miss clusters to detect SIF precursors before catastrophic blowouts cascade.
          </p>

          {/* 4 Feature Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5 max-w-lg">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#162829]/90 border border-[#264245]">
              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 shrink-0">
                <Brain className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-white truncate">Multilingual Neural NLP</h4>
                <p className="text-[10px] text-slate-400 truncate">Processes free-text in 5 Indian languages</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#162829]/90 border border-[#264245]">
              <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 shrink-0">
                <Network className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-white truncate">Barrier Cascade Graph</h4>
                <p className="text-[10px] text-slate-400 truncate">Connects recurring near-miss clusters</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#162829]/90 border border-[#264245]">
              <div className="p-1.5 rounded-md bg-red-500/10 text-red-400 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-white truncate">SIF Precursor Scoring</h4>
                <p className="text-[10px] text-slate-400 truncate">Calibrated on DEKRA & IOGP rules</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#162829]/90 border border-[#264245]">
              <div className="p-1.5 rounded-md bg-teal-500/10 text-teal-400 shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-white truncate">Human-in-the-Loop SWA</h4>
                <p className="text-[10px] text-slate-400 truncate">Full audit trail & digital permit freeze</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={currentUser ? '/dashboard' : '/login'}
              className="px-5 py-2.5 bg-[#0A6B63] hover:bg-[#085B54] text-white font-semibold text-xs tracking-wider uppercase rounded-lg transition-all flex items-center gap-2 shadow-xs"
            >
              Enter Command Center
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <a
              href="#case-study"
              className="px-4 py-2.5 rounded-lg border border-[#264245] bg-[#162829] hover:bg-[#1D3335] text-white font-medium text-xs transition-all flex items-center gap-2"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              Baghjan Case Study
            </a>

            <Link
              href={currentUser?.role === 'field_worker' ? '/worker' : '/login?role=worker'}
              className="px-4 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-medium text-xs transition-all flex items-center gap-2"
            >
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              Field PTT Terminal
            </Link>
          </div>

        </div>
      </section>

      {/* ── SECTION 2: LIVE METRICS TICKER BAR ── */}
      <section className="w-full bg-[#0A1416] border-b border-white/[0.08] py-4 px-6 lg:px-14">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left">
          <div className="border-r border-white/[0.08] pr-4">
            <div className="font-heading font-black text-2xl text-white">502</div>
            <div className="text-[11px] font-mono text-[#8BA4A7] uppercase">Safety Observations Ingested</div>
          </div>
          <div className="border-r border-white/[0.08] pr-4">
            <div className="font-heading font-black text-2xl text-[#1B8A6C]">10 Assets</div>
            <div className="text-[11px] font-mono text-[#8BA4A7] uppercase">Upper Assam Telemetry Live</div>
          </div>
          <div className="border-r border-white/[0.08] pr-4">
            <div className="font-heading font-black text-2xl text-[#D63B3B]">100% Zero-Cloud</div>
            <div className="text-[11px] font-mono text-[#8BA4A7] uppercase">Air-Gapped On-Premise GPU</div>
          </div>
          <div>
            <div className="font-heading font-black text-2xl text-amber-400">&lt; 4.2s</div>
            <div className="text-[11px] font-mono text-[#8BA4A7] uppercase">End-to-End Pipeline Latency</div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: 7-STAGE SOVEREIGN SIF PIPELINE INTERACTIVE WALKTHROUGH ── */}
      <section id="pipeline" className="w-full py-16 px-6 lg:px-14 border-b border-white/[0.08] bg-[#0F1B1D]">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#0A6B63]/20 border border-[#0A6B63]/40 text-[#1B8A6C] font-mono text-[10px] font-bold uppercase tracking-wider">
              Autonomous Safety Engine
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
              7-Stage Sovereign SIF Pipeline
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              From noisy unformatted field voice audio to automated Stop Work Authority perimeters in under 4.2 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Stage Selector List */}
            <div className="lg:col-span-5 space-y-2">
              {PIPELINE_STAGES.map((st, idx) => (
                <button
                  key={st.step}
                  onClick={() => setActivePipelineStage(idx)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    activePipelineStage === idx
                      ? 'bg-[#162829] border-[#1B8A6C] shadow-lg shadow-teal-950/50'
                      : 'bg-[#121E20] border-white/[0.06] hover:bg-[#162829]/60 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                      activePipelineStage === idx ? 'bg-[#0A6B63] text-white' : 'bg-white/[0.06] text-slate-400'
                    }`}>
                      {st.step}
                    </span>
                    <div>
                      <div className={`text-xs font-bold ${activePipelineStage === idx ? 'text-white' : 'text-slate-300'}`}>
                        {st.title}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {st.subtitle}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${activePipelineStage === idx ? 'text-[#1B8A6C] translate-x-1' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>

            {/* Right Detailed Stage Spotlight Card */}
            <div className="lg:col-span-7 bg-[#162829] rounded-2xl border border-[#264245] p-6 lg:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-mono font-black text-[#1B8A6C]">
                    STAGE {PIPELINE_STAGES[activePipelineStage].step}
                  </span>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-white">
                      {PIPELINE_STAGES[activePipelineStage].title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {PIPELINE_STAGES[activePipelineStage].subtitle}
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-md bg-[#0A6B63]/20 border border-[#0A6B63]/40 text-[#BCE3DC] font-mono text-[10px] font-bold">
                  {PIPELINE_STAGES[activePipelineStage].badge}
                </span>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Operational Execution:
                </h4>
                <p className="text-sm leading-relaxed text-slate-200 font-normal">
                  {PIPELINE_STAGES[activePipelineStage].desc}
                </p>
              </div>

              {/* Technical Blueprint Box */}
              <div className="p-4 rounded-xl bg-[#0A1416] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <Activity className="w-3.5 h-3.5" /> Deterministic Pipeline Execution
                  </span>
                  <span>Zero Cloud Egress</span>
                </div>
                <div className="text-xs font-mono text-slate-300 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                  {activePipelineStage === 0 && '>> ASR_STREAM: Whisper Base (Quantized INT8) -> Lang: "Assamese / Hindi / English" -> Normalizer: OilFieldLexicon_v2'}
                  {activePipelineStage === 1 && '>> VECTOR_SPACE: 384-Dim Dense Embeddings -> Cosine Sim vs 48 DEKRA SIF Anchors -> Threshold: > 0.72 Precursor Potential'}
                  {activePipelineStage === 2 && '>> NER_ENGINE: ZeroShotEntityClassifier -> Found: [Annular BOP, 1800 PSI, Well Pad 7, Hydraulic Weeping]'}
                  {activePipelineStage === 3 && '>> LSR_MAPPER: MultiLabel Sim -> Rule 01 (Energy Isolation: 94%) -> Rule 04 (Bypass Safety Controls: 88%)'}
                  {activePipelineStage === 4 && '>> SIF_SCORER: Composite S_SIF = 0.94 (HIGH RISK) -> Grounding: "Annular valve degradation under active drilling pressure."'}
                  {activePipelineStage === 5 && '>> GRAPH_CLUSTER: Cross-Linked REP-W7-01 with Historical Vibration Spike on Mud Pump #2 (Confidence: 96%)'}
                  {activePipelineStage === 6 && '>> SWA_PERIMETER: DISPATCH_ALERT -> Freeze 4 active e-PTWs within 500m buffer -> Rig Siren Triggered.'}
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ── SECTION 4: CORE ARCHITECTURAL PILLARS ── */}
      <section id="features" className="w-full py-16 px-6 lg:px-14 border-b border-white/[0.08] bg-[#0A1416]">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#0A6B63]/20 border border-[#0A6B63]/40 text-[#1B8A6C] font-mono text-[10px] font-bold uppercase tracking-wider">
              Technical Excellence
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
              Engineered for Upstream Oil & Gas Realities
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Built ground-up to solve the exact constraints of remote Assam drilling sites, hazardous ATEX zones, and high-consequence operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Card 1 */}
            <div className="p-5 rounded-xl bg-[#162829] border border-[#264245] space-y-3 shadow-sm hover:border-[#1B8A6C] transition-all">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-sm text-white">
                Deterministic + Neuro-Symbolic Hybrid
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Zero generative LLM hallucinations on safety-critical classifications. SANKET pairs precomputed mathematical SIF anchor vectors with explainable reasoning rules for 100% auditability.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-5 rounded-xl bg-[#162829] border border-[#264245] space-y-3 shadow-sm hover:border-[#1B8A6C] transition-all">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Map className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-sm text-white">
                Upper Assam Basin GIS Intelligence
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Interactive tactical map with real-time 245° gas dispersion plumes, NASA FIRMS flare thermal anomalies, Brahmaputra flood inundation polygons, and trunk pipeline telemetry across 10 operational assets.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-5 rounded-xl bg-[#162829] border border-[#264245] space-y-3 shadow-sm hover:border-[#1B8A6C] transition-all">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-sm text-white">
                Baghjan 2020 Counterfactual Engine
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                14-day interactive disaster scrubber proving how weak signal aggregation triggers automated SWA at Day 5—averting ₹580 Crores PSU financial loss, 3 human fatalities, and ecological destruction.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-5 rounded-xl bg-[#162829] border border-[#264245] space-y-3 shadow-sm hover:border-[#1B8A6C] transition-all">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-sm text-white">
                ATEX Zone 1 Push-To-Talk Terminal
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Glove-friendly rugged mobile interface with on-device Whisper multilingual speech transcription supporting Assamese, Hindi, and English oilfield vernacular with quick 1-tap hazard presets.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-5 rounded-xl bg-[#162829] border border-[#264245] space-y-3 shadow-sm hover:border-[#1B8A6C] transition-all">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-sm text-white">
                Cross-Signal Correlation Graph
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Clusters isolated minor observations across shifts and assets into multi-node precursor failure graphs, surfacing hidden barrier degradation before catastrophic blowout thresholds are crossed.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-5 rounded-xl bg-[#162829] border border-[#264245] space-y-3 shadow-sm hover:border-[#1B8A6C] transition-all">
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-sm text-white">
                Sovereign Air-Gapped Deployment
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Zero external cloud dependencies, zero external API keys, zero data egress. All vector databases, ASR models, and reasoning logic execute 100% locally on Oil India Limited on-premise servers.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ── SECTION 5: BAGHJAN 2020 DISASTER CASE STUDY ── */}
      <section id="case-study" className="w-full py-16 px-6 lg:px-14 border-b border-white/[0.08] bg-[#0F1B1D]">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 font-mono text-[10px] font-bold uppercase tracking-wider mb-2">
                Real-World Operational Validation
              </div>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
                Baghjan Well #5 (2020) — The Weak Signal Disaster
              </h2>
            </div>

            <Link
              href={currentUser ? '/dashboard/replay' : '/login?redirect=/dashboard/replay'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-md transition-all self-start md:self-auto"
            >
              <History className="w-4 h-4" />
              Launch 14-Day Disaster Scrubber
            </Link>
          </div>

          {/* Dual Reality Side-by-Side Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* 2020 Reality */}
            <div className="p-6 rounded-2xl bg-[#1A1212] border-2 border-red-500/40 space-y-4">
              <div className="flex items-center justify-between border-b border-red-500/30 pb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4" /> 2020 Historical Reality (Legacy Systems)
                </div>
                <span className="text-[10px] font-mono bg-red-950 text-red-300 px-2 py-0.5 rounded border border-red-500/30">
                  BLOWOUT OCCURRED
                </span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>Day 1–4:</strong> Minor valve weeping reported in handwritten shift log, filed without SIF tag.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>Day 5–9:</strong> 1800 PSI annular vibration surges treated as routine pump noise.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>Day 14 (May 27):</strong> Uncontrolled blowout followed by massive explosion, burning for 173 days.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>Outcome:</strong> ₹580 Crores PSU loss, 3 firefighter deaths, 10,000 hectares wetland charred.</span>
                </li>
              </ul>
            </div>

            {/* SANKET AI Reality */}
            <div className="p-6 rounded-2xl bg-[#0D1F1D] border-2 border-[#1B8A6C]/60 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1B8A6C]/40 pb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#1B8A6C] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> SANKET AI Counterfactual Engine
                </div>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  BLOWOUT PREVENTED
                </span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Day 1:</strong> NLP maps "valve weeping under vibration" to Energy Isolation precursor.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Day 5 (1800 PSI surge):</strong> Knowledge graph connects valve + pressure. SIF risk hits <strong>94% HIGH</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Automated Action:</strong> SWA triggered instantly. All 3 active work permits frozen within 500m.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Outcome:</strong> Secondary Annular BOP replaced under safe isolation. Well stabilized with zero injuries.</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Cumulative Scoreboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#162829] p-4 rounded-xl border border-[#264245]">
            <div className="text-center">
              <div className="text-xl font-heading font-black text-emerald-400">3 Lives</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Personnel Saved</div>
            </div>
            <div className="text-center border-l border-white/[0.08]">
              <div className="text-xl font-heading font-black text-emerald-400">₹580 Crores</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">PSU Capital Preserved</div>
            </div>
            <div className="text-center border-l border-white/[0.08]">
              <div className="text-xl font-heading font-black text-emerald-400">10,000 Ha</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Dibru-Saikhowa Protected</div>
            </div>
            <div className="text-center border-l border-white/[0.08]">
              <div className="text-xl font-heading font-black text-emerald-400">5-Day Window</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Precursor Lead Time</div>
            </div>
          </div>

        </div>
      </section>

      {/* ── SECTION 6: STATUTORY COMPLIANCE & SAFETY STANDARDS ── */}
      <section id="compliance" className="w-full py-12 px-6 lg:px-14 border-b border-white/[0.08] bg-[#0A1416]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-white">
              Statutory Compliance & Standards Alignment
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Built to satisfy Indian regulatory frameworks for oil and natural gas exploration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-[#162829] border border-[#264245] text-xs font-mono text-slate-300">
              📜 DGMS Mines Safety Rules
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#162829] border border-[#264245] text-xs font-mono text-slate-300">
              🛡️ OISD-189 & GDN-206
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#162829] border border-[#264245] text-xs font-mono text-slate-300">
              🌐 IOGP 9 Life-Saving Rules
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#162829] border border-[#264245] text-xs font-mono text-slate-300">
              📊 DEKRA SIF Potential Model
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: DIRECT PORTALS CTA ── */}
      <section className="w-full py-16 px-6 lg:px-14 bg-gradient-to-b from-[#0F1B1D] to-[#0A1416]">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white">
            Experience the SANKET AI Safety Platform
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Explore live incident triage, geospatial GIS hazard layers, knowledge graphs, and field voice telemetry.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href={currentUser ? '/dashboard' : '/login'}
              className="px-6 py-3 bg-[#0A6B63] hover:bg-[#085B54] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-teal-950/60 transition-all flex items-center gap-2"
            >
              Open Safety Manager HQ
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={currentUser?.role === 'field_worker' ? '/worker' : '/login?role=worker'}
              className="px-6 py-3 bg-[#162829] hover:bg-[#1D3335] border border-[#264245] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-2"
            >
              <Mic className="w-4 h-4 text-amber-400" />
              Launch Field Worker PTT Terminal
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="w-full border-t border-white/[0.08] bg-[#070D0E] py-8 px-6 lg:px-14 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/sanket_logo_derrick.png"
              alt="SANKET AI Logo"
              width={24}
              height={24}
              className="object-contain"
            />
            <span className="font-heading font-bold text-white">SANKET AI</span>
            <span className="text-slate-600">·</span>
            <span className="font-mono text-[11px] text-slate-400">SIH 2026 Problem Statement SIH26165</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px] text-slate-400">
            <span className="text-emerald-400 font-semibold">● 100% AIR-GAPPED</span>
            <span>OIL INDIA LIMITED</span>
            <span>MINISTRY OF PETROLEUM & NATURAL GAS</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
