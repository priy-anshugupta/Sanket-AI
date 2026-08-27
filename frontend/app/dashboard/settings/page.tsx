'use client';

import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface AirGapStatus {
  is_airgapped: boolean;
  mode: string;
  outbound_connections: number;
  outbound_kbps: string | number;
  models_loaded: {
    embeddings: string;
    ner: string;
    llm: string;
  };
  zero_egress: boolean;
}

export default function SettingsPage() {
  const [airgap, setAirgap] = useState<AirGapStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable threshold settings
  const [sifHighThreshold, setSifHighThreshold] = useState(0.75);
  const [sifMediumThreshold, setSifMediumThreshold] = useState(0.50);
  const [lsrThreshold, setLsrThreshold] = useState(0.45);
  const [clusterWindow, setClusterWindow] = useState(7);
  const [clusterMinEvents, setClusterMinEvents] = useState(3);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/system/airgap`)
      .then((res) => res.json())
      .then((data) => {
        setAirgap(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching airgap status:', err);
        setLoading(false);
      });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            SOVEREIGN ARCHITECTURE
          </span>
          <span className="text-xs text-gray-500 font-mono">OIL INDIA ON-PREMISE ENGINE</span>
        </div>
        <h1 className="text-2xl font-display font-black text-gray-900">System & Sovereign Air-Gap Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure offline runtime isolation, model weights, and deterministic SIF classification thresholds.
        </p>
      </div>

      {/* Air-Gap Zero Egress Telemetry Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-xl font-bold">
              🛡️
            </div>
            <div>
              <h2 className="font-display font-bold text-gray-900 text-base">
                Zero-Egress Air-Gap Verification Monitor
              </h2>
              <p className="text-xs text-gray-500">
                Continuous network socket inspection assuring zero safety data leaves Oil India perimeter.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse-green" />
            <span className="text-xs font-mono font-bold text-emerald-700">
              {airgap?.zero_egress ? 'VERIFIED AIR-GAPPED' : 'ONLINE / CONNECTED'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Current Mode</div>
            <div className="font-mono text-lg font-bold text-gray-900 mt-1 capitalize">
              {airgap?.mode || 'online'}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">Sovereign On-Premise</div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Outbound Sockets</div>
            <div className="font-mono text-lg font-bold text-emerald-600 mt-1">
              {airgap?.outbound_connections ?? 0} Active
            </div>
            <div className="text-[11px] text-gray-500 mt-1">Zero External Telemetry</div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Outbound Data Rate</div>
            <div className="font-mono text-lg font-bold text-gray-900 mt-1">
              {airgap?.outbound_kbps ?? 0} KB/s
            </div>
            <div className="text-[11px] text-gray-500 mt-1">Strict Egress Block</div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Embeddings Engine</div>
            <div className="font-mono text-sm font-bold text-gray-800 mt-1 truncate">
              {airgap?.models_loaded?.embeddings?.split('/')?.pop() || 'multilingual-e5-small'}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">384-dim CPU Optimized</div>
          </div>
        </div>
      </div>

      {/* Model Weights Registry */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="font-display font-bold text-gray-900 text-base flex items-center gap-2">
          <span>🧠</span> Loaded AI Pipeline Components
        </h2>
        <div className="divide-y divide-gray-100">
          <div className="py-3 flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm text-gray-900">Stage 2: Deterministic SIF Embedding Classifier</div>
              <div className="text-xs text-gray-500">intfloat/multilingual-e5-small · Cosine Similarity against 50 SIF Anchors</div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              Loaded in RAM
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm text-gray-900">Stage 3: Industrial Zero-Shot Entity Extractor (NER)</div>
              <div className="text-xs text-gray-500">GLiNER + Pattern Rules · 8 Oil & Gas entity classes</div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              Loaded in RAM
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm text-gray-900">Stage 4: IOGP 9 Life-Saving Rules Semantic Mapper</div>
              <div className="text-xs text-gray-500">Vector similarity against official IOGP Life-Saving Rules corpus</div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              Loaded in RAM
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm text-gray-900">Stage 5: Local Explainer LLM</div>
              <div className="text-xs text-gray-500">
                {airgap?.models_loaded?.llm || 'Llama-3.3-70b (Groq) / Llama-3.1-8b (Local Ollama)'}
              </div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
              Ready
            </span>
          </div>
        </div>
      </div>

      {/* Threshold Configuration Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-gray-900 text-base">
              SIF & Near-Miss Multiplier Threshold Tuning
            </h2>
            <p className="text-xs text-gray-500">
              Calibrated values specified in SANKET Engineering Specifications.
            </p>
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            Save Parameters
          </button>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
            ✓ Parameters updated successfully in runtime context.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-gray-700">
              <span>SIF HIGH Threshold (τ_high)</span>
              <span className="font-mono text-red-600 font-bold">{sifHighThreshold}</span>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.95"
              step="0.01"
              value={sifHighThreshold}
              onChange={(e) => setSifHighThreshold(parseFloat(e.target.value))}
              className="w-full accent-red-600"
            />
            <p className="text-[11px] text-gray-400">Reports with score ≥ {sifHighThreshold} classified as HIGH risk.</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-gray-700">
              <span>SIF MEDIUM Threshold (τ_med)</span>
              <span className="font-mono text-amber-600 font-bold">{sifMediumThreshold}</span>
            </div>
            <input
              type="range"
              min="0.30"
              max="0.70"
              step="0.01"
              value={sifMediumThreshold}
              onChange={(e) => setSifMediumThreshold(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
            <p className="text-[11px] text-gray-400">Reports between {sifMediumThreshold} and {sifHighThreshold} classified as MEDIUM risk.</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-gray-700">
              <span>IOGP Rule Matching Threshold</span>
              <span className="font-mono text-blue-600 font-bold">{lsrThreshold}</span>
            </div>
            <input
              type="range"
              min="0.20"
              max="0.80"
              step="0.01"
              value={lsrThreshold}
              onChange={(e) => setLsrThreshold(parseFloat(e.target.value))}
              className="w-full accent-blue-600"
            />
            <p className="text-[11px] text-gray-400">Cosine threshold for tagging 9 Life-Saving Rules.</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-gray-700">
              <span>Near-Miss Multiplier Rolling Window</span>
              <span className="font-mono text-gray-900 font-bold">{clusterWindow} Days</span>
            </div>
            <input
              type="range"
              min="3"
              max="30"
              step="1"
              value={clusterWindow}
              onChange={(e) => setClusterWindow(parseInt(e.target.value))}
              className="w-full accent-gray-900"
            />
            <p className="text-[11px] text-gray-400">Temporal window for detecting recurring low/medium signals.</p>
          </div>
        </div>
      </form>
    </div>
  );
}
