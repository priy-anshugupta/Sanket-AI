'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Plus, 
  RefreshCw, 
  Search, 
  ShieldAlert, 
  Sparkles, 
  Layers, 
  FileText, 
  ArrowUpRight,
  ChevronRight,
  Flame,
  Zap,
  Activity
} from 'lucide-react';

interface Report {
  id: string;
  raw_text: string;
  sif_score: number | null;
  sif_label: string | null;
  iogp_rule: string | null;
  location: string | null;
  status: string;
  created_at: string;
  entities: Array<{ entity_type: string; entity_value: string }>;
  lsr_tags: Array<{ rule_name: string; similarity: number }>;
}

interface Summary {
  total_reports: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  pending_count: number;
}

const API = 'http://localhost:8000';

function SIFBadge({ label, score }: { label: string | null; score: number | null }) {
  const isHigh = label === 'HIGH' || (score !== null && score >= 0.75);
  const isMedium = label === 'MEDIUM' || (score !== null && score >= 0.5 && score < 0.75);

  if (isHigh) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
        HIGH
        {score !== null && <span className="font-mono text-[11px] font-semibold text-red-800 opacity-90">{score.toFixed(2)}</span>}
      </span>
    );
  }

  if (isMedium) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        MED
        {score !== null && <span className="font-mono text-[11px] font-semibold text-amber-800 opacity-90">{score.toFixed(2)}</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      LOW
      {score !== null && <span className="font-mono text-[11px] font-semibold text-emerald-800 opacity-90">{score.toFixed(2)}</span>}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const isCompleted = status === 'COMPLETED';
  const isProcessing = status === 'PROCESSING';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${
        isCompleted ? 'bg-emerald-500' : isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
      }`} />
      <span className="text-xs font-medium text-slate-600 capitalize">
        {status?.toLowerCase() || 'completed'}
      </span>
    </span>
  );
}

export default function TriageQueuePage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showIngest, setShowIngest] = useState(false);
  const [ingestText, setIngestText] = useState('');
  const [ingesting, setIngesting] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filter) params.set('sif_label', filter);
      if (search) params.set('search', search);

      const res = await fetch(`${API}/api/reports?${params}`);
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      setReports(data.reports || []);
      setTotal(data.total || 0);
    } catch {
      // Demo mock fallback if needed
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [page, filter, search]);

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${API}/api/analytics/summary`);
      if (res.ok) {
        setSummary(await res.json());
      }
    } catch (e) {
      console.error('Summary fetch failed:', e);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchSummary();
  }, [fetchReports]);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestText.trim()) return;
    setIngesting(true);
    try {
      const res = await fetch(`${API}/api/reports/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: ingestText,
          source: 'manual',
          location: 'Well Pad 7 (Live Inspection)',
          activity_type: 'Drilling',
        }),
      });
      if (res.ok) {
        setIngestText('');
        setShowIngest(false);
        fetchReports();
        fetchSummary();
      }
    } catch (e) {
      console.error('Ingestion failed:', e);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="p-8 max-w-[1500px] mx-auto space-y-6">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl lg:text-3xl text-slate-900 tracking-tight">
              Triage Queue Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-mono font-bold">
              SIF Precursor AI
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Real-time unstructured safety observations prioritized by Serious Injury & Fatality (SIF) potential
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchReports(); fetchSummary(); }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => setShowIngest(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold tracking-wide shadow-md shadow-red-950/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            + Ingest New Report
          </button>
        </div>
      </div>

      {/* ── 5 Executive KPI Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-slate-400" />
          <div className="text-[11px] font-mono font-bold uppercase text-slate-400">Total Reports Ingested</div>
          <div className="font-mono text-3xl font-extrabold text-slate-900 mt-1">
            {summary?.total_reports ?? total}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium flex items-center gap-1">
            <Activity className="w-3 h-3 text-slate-400" /> Across 50 Well Pads
          </div>
        </div>

        <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-red-50/40">
          <div className="absolute top-0 inset-x-0 h-1 bg-red-600" />
          <div className="text-[11px] font-mono font-bold uppercase text-red-600 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> 🔴 HIGH SIF Precursors
          </div>
          <div className="font-mono text-3xl font-extrabold text-red-700 mt-1">
            {summary?.high_count ?? reports.filter(r => r.sif_label === 'HIGH').length}
          </div>
          <div className="text-[10px] text-red-600/80 mt-1 font-semibold">Immediate HSE Action Required</div>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-amber-50/40">
          <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />
          <div className="text-[11px] font-mono font-bold uppercase text-amber-600 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> 🟡 MEDIUM Risk
          </div>
          <div className="font-mono text-3xl font-extrabold text-amber-700 mt-1">
            {summary?.medium_count ?? 0}
          </div>
          <div className="text-[10px] text-amber-600/80 mt-1 font-medium">Degraded Secondary Barriers</div>
        </div>

        <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/40">
          <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500" />
          <div className="text-[11px] font-mono font-bold uppercase text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 🟢 LOW / Non-SIF
          </div>
          <div className="font-mono text-3xl font-extrabold text-emerald-700 mt-1">
            {summary?.low_count ?? 0}
          </div>
          <div className="text-[10px] text-emerald-600/80 mt-1 font-medium">Standard Housekeeping & PPE</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-blue-500" />
          <div className="text-[11px] font-mono font-bold uppercase text-blue-600 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> ⚡ 2-Stage Latency
          </div>
          <div className="font-mono text-3xl font-extrabold text-slate-800 mt-1">&lt; 5s</div>
          <div className="text-[10px] text-blue-600/80 mt-1 font-medium">Fast multilingual batch scoring</div>
        </div>
      </div>

      {/* ── Filter & Search Control Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-400 uppercase font-mono mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { id: '', label: 'All Incidents' },
            { id: 'HIGH', label: '🔴 HIGH Risk' },
            { id: 'MEDIUM', label: '🟡 MEDIUM' },
            { id: 'LOW', label: '🟢 LOW' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search equipment, location, hazard..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 w-72 focus:outline-none focus:border-red-500 focus:bg-white transition-all font-medium"
          />
        </div>
      </div>

      {/* ── High-Contrast Triage Data Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="triage-table">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                <th className="text-left min-w-[380px]">Report Incident Narrative</th>
                <th className="text-left w-36">SIF Score</th>
                <th className="text-left w-44">IOGP Life-Saving Rule</th>
                <th className="text-left w-40">Asset / Location</th>
                <th className="text-left w-28">Status</th>
                <th className="text-left w-36">Timestamp</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="text-center font-mono text-xs text-slate-300">{i + 1}</td>
                    <td><div className="h-4 bg-slate-100 rounded w-3/4" /></td>
                    <td><div className="h-6 bg-slate-100 rounded-full w-24" /></td>
                    <td><div className="h-5 bg-slate-100 rounded w-28" /></td>
                    <td><div className="h-4 bg-slate-100 rounded w-24" /></td>
                    <td><div className="h-4 bg-slate-100 rounded w-16" /></td>
                    <td><div className="h-4 bg-slate-100 rounded w-20" /></td>
                    <td></td>
                  </tr>
                ))
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No safety reports matched your filter criteria.
                  </td>
                </tr>
              ) : (
                reports.map((report, idx) => (
                  <tr key={report.id} className="group cursor-pointer hover:bg-slate-50/80">
                    <td className="text-center font-mono text-xs text-slate-400 font-semibold">
                      {(page - 1) * 20 + idx + 1}
                    </td>

                    {/* Report Text */}
                    <td className="max-w-md">
                      <Link href={`/dashboard/report/${report.id}`} className="block">
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                          {report.raw_text}
                        </p>
                      </Link>
                    </td>

                    {/* SIF Score Badge */}
                    <td>
                      <SIFBadge label={report.sif_label} score={report.sif_score} />
                    </td>

                    {/* IOGP Life-Saving Rule */}
                    <td>
                      {report.iogp_rule ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <ShieldAlert className="w-3 h-3 text-blue-500" />
                          {report.iogp_rule}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">None mapped</span>
                      )}
                    </td>

                    {/* Location */}
                    <td>
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        {report.location || 'Well Pad 7'}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <StatusDot status={report.status} />
                    </td>

                    {/* Time */}
                    <td className="text-xs text-slate-500 font-mono">
                      {new Date(report.created_at || Date.now()).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Detail Arrow */}
                    <td className="text-right pr-4">
                      <Link href={`/dashboard/report/${report.id}`} className="text-slate-400 group-hover:text-red-600 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Ingest Modal ── */}
      {showIngest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading font-extrabold text-lg text-slate-900">Ingest Safety Observation</h3>
                <p className="text-xs text-slate-500">Live AI analysis via SANKET multilingual pipeline</p>
              </div>
              <button onClick={() => setShowIngest(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleIngest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1.5">Observation Narrative (Hindi / English / Assamese)</label>
                <textarea
                  rows={4}
                  value={ingestText}
                  onChange={(e) => setIngestText(e.target.value)}
                  placeholder="e.g. Pump-04 casing flange weeping hydraulic fluid under 1800 PSI vibration. Temporary clamp fitted."
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIngest(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ingesting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-950/20 disabled:opacity-50"
                >
                  {ingesting ? 'Scoring Incident...' : 'Run SIF Analysis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
