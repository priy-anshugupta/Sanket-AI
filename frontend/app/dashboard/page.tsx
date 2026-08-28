'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  ChevronRight, 
  FileText,
  Upload,
  Database,
  Zap,
  Layers,
  Sparkles,
  Flame
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

interface Report {
  id: string;
  raw_text: string;
  sif_score: number;
  sif_label: 'HIGH' | 'MEDIUM' | 'LOW';
  iogp_rule?: string;
  location?: string;
  activity_type?: string;
  status: string;
  created_at: string;
}

interface SummaryStats {
  total_reports: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  pending_count: number;
}

export default function TriageDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Ingest Modal state
  const [showIngest, setShowIngest] = useState(false);
  const [ingestTab, setIngestTab] = useState<'single' | 'batch'>('batch');
  const [ingestText, setIngestText] = useState('');
  const [ingestLocation, setIngestLocation] = useState('Well Pad 7');
  const [ingestActivity, setIngestActivity] = useState('Drilling');
  const [ingestShift, setIngestShift] = useState('DAY');
  const [ingesting, setIngesting] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState('');

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {
      // Fallback
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (filter) params.append('sif_label', filter);
      if (search) params.append('search', search);

      const res = await fetch(`${API_BASE}/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        setTotal(data.total || 0);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchReports();
  }, [page, filter, search]);

  // Handle single manual ingestion
  const handleSingleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestText.trim()) return;
    setIngesting(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ingestText,
          location: ingestLocation,
          activity_type: ingestActivity,
          shift: ingestShift,
          source: 'manual',
        }),
      });
      if (res.ok) {
        setIngestText('');
        setShowIngest(false);
        fetchSummary();
        fetchReports();
      }
    } catch (err) {
      alert('Error ingesting report');
    } finally {
      setIngesting(false);
    }
  };

  // Handle 1-click batch demo dataset ingestion (507 reports)
  const handleBatchIngest500 = async () => {
    setIngesting(true);
    setBatchProgress(10);
    const timer = setInterval(() => {
      setBatchProgress(prev => (prev < 90 ? prev + 15 : prev));
    }, 400);

    try {
      const res = await fetch(`${API_BASE}/api/reports/ingest/demo-500`, {
        method: 'POST',
      });
      clearInterval(timer);
      setBatchProgress(100);

      if (res.ok) {
        const data = await res.json();
        setBatchSuccessMsg(`⚡ Ingested & Classified ${data.total_ingested} reports in ${data.elapsed_seconds}s!`);
        setTimeout(() => {
          setShowIngest(false);
          setBatchProgress(0);
          setBatchSuccessMsg('');
          fetchSummary();
          fetchReports();
        }, 1200);
      } else {
        alert('Batch ingestion failed on server.');
        setBatchProgress(0);
      }
    } catch (err) {
      clearInterval(timer);
      alert('Network error during batch ingestion.');
      setBatchProgress(0);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
              Triage Queue Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-700 border border-red-200">
              SIF Precursor AI
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time unstructured safety observations prioritized by Serious Injury & Fatality (SIF) potential
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { fetchSummary(); fetchReports(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => setShowIngest(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-950/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Ingest Safety Observation
          </button>
        </div>
      </div>

      {/* ── Executive Summary KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-mono font-bold uppercase text-slate-500">Total Reports Ingested</div>
          <div className="font-mono text-3xl font-extrabold text-slate-900 mt-1">
            {summary?.total_reports ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Across 10 Oil India Assets</div>
        </div>

        <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm relative overflow-hidden bg-gradient-to-b from-red-50/30 to-white">
          <div className="absolute top-0 inset-x-0 h-1 bg-red-600" />
          <div className="text-[11px] font-mono font-bold uppercase text-red-600 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> High SIF Precursors
          </div>
          <div className="font-mono text-3xl font-extrabold text-red-600 mt-1">
            {summary?.high_count ?? 0}
          </div>
          <div className="text-[10px] text-red-600/80 mt-1 font-semibold">Immediate HSE Action Required</div>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm relative overflow-hidden bg-gradient-to-b from-amber-50/30 to-white">
          <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />
          <div className="text-[11px] font-mono font-bold uppercase text-amber-600 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Medium Risk
          </div>
          <div className="font-mono text-3xl font-extrabold text-amber-600 mt-1">
            {summary?.medium_count ?? 0}
          </div>
          <div className="text-[10px] text-amber-600/80 mt-1 font-medium">Degraded Secondary Barriers</div>
        </div>

        <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm relative overflow-hidden bg-gradient-to-b from-emerald-50/30 to-white">
          <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500" />
          <div className="text-[11px] font-mono font-bold uppercase text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Low / Non-SIF
          </div>
          <div className="font-mono text-3xl font-extrabold text-emerald-700 mt-1">
            {summary?.low_count ?? 0}
          </div>
          <div className="text-[10px] text-emerald-600/80 mt-1 font-medium">Standard Housekeeping & PPE</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-blue-500" />
          <div className="text-[11px] font-mono font-bold uppercase text-blue-600 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> 2-Stage Latency
          </div>
          <div className="font-mono text-3xl font-extrabold text-slate-800 mt-1">&lt; 4.5s</div>
          <div className="text-[10px] text-blue-600/80 mt-1 font-medium">507 Batch Neural Classification</div>
        </div>
      </div>

      {/* ── Filter & Search Control Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
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
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 font-mono text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-300" />
                    Querying Supabase PostgreSQL...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                    No safety reports found matching filter.
                  </td>
                </tr>
              ) : (
                reports.map((report, idx) => (
                  <tr key={report.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="text-center font-mono text-xs text-slate-400">
                      {(page - 1) * 20 + idx + 1}
                    </td>

                    {/* Narrative */}
                    <td className="py-3">
                      <div className="font-semibold text-slate-800 text-xs leading-snug line-clamp-2">
                        {report.raw_text}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        ID: {report.id}
                      </div>
                    </td>

                    {/* SIF Score Pill */}
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                        report.sif_label === 'HIGH'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : report.sif_label === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          report.sif_label === 'HIGH' ? 'bg-red-600 animate-pulse' : report.sif_label === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        {report.sif_label} {report.sif_score?.toFixed(2)}
                      </span>
                    </td>

                    {/* IOGP Rule */}
                    <td>
                      {report.iogp_rule ? (
                        <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block truncate max-w-[160px]">
                          {report.iogp_rule}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="text-xs font-medium text-slate-700">
                      {report.location || 'Well Pad 7'}
                    </td>

                    {/* Status */}
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {report.status || 'Completed'}
                      </span>
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

      {/* ── Dual-Tab Ingest Modal (Single vs 507 Batch Dataset) ── */}
      {showIngest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl p-6 shadow-2xl space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading font-extrabold text-lg text-slate-900">Ingest Safety Observations</h3>
                <p className="text-xs text-slate-500">Live AI analysis via SANKET multilingual neural pipeline</p>
              </div>
              <button onClick={() => setShowIngest(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            {/* Ingest Mode Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setIngestTab('batch')}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  ingestTab === 'batch'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-red-600" />
                ⚡ Batch Import Dataset
              </button>

              <button
                type="button"
                onClick={() => setIngestTab('single')}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  ingestTab === 'single'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                ✍️ Single Incident
              </button>
            </div>

            {/* TAB 1: 1-Click 507 Oil India Demo Dataset */}
            {ingestTab === 'batch' && (
              <div className="space-y-4 py-1">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 uppercase font-mono">Dataset Scope:</span>
                    <span className="font-mono text-red-600 font-bold">507 Observations</span>
                  </div>
                  <p className="text-slate-500 leading-relaxed">
                    Loads the real Upper Assam operational dataset spanning 10 locations (Well Pad 7, Moran OCS-3, Digboi, Baghjan) across Drilling, Workover, and Maintenance.
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-slate-500">
                    <span>🔴 157 SIF Precursors</span>
                    <span>•</span>
                    <span>🟢 350 Housekeeping</span>
                  </div>
                </div>

                {/* Animated Progress Bar */}
                {ingesting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono font-bold text-slate-700">
                      <span>Executing Local Multilingual Neural Pipeline...</span>
                      <span>{batchProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-red-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                        style={{ width: `${batchProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {batchSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {batchSuccessMsg}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleBatchIngest500}
                    disabled={ingesting}
                    className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-slate-950/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-50 cursor-pointer border border-slate-700"
                  >
                    <Zap className="w-4 h-4 text-blue-400 fill-blue-400" />
                    {ingesting ? 'Processing & Classifying Safety Dataset via Neural AI...' : '⚡ INGEST ENTERPRISE SAFETY DATASET'}
                  </button>
                  <p className="text-[10px] text-center text-slate-400 mt-2 font-mono">
                    Populates Triage Queue, SIF Heatmap Matrix, and Signal Graph in &lt; 4 seconds!
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: Single Manual Ingestion */}
            {ingestTab === 'single' && (
              <form onSubmit={handleSingleIngest} className="space-y-3.5">
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono mb-1">Location</label>
                    <select
                      value={ingestLocation}
                      onChange={(e) => setIngestLocation(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-medium"
                    >
                      <option value="Well Pad 7">Well Pad 7</option>
                      <option value="Moran OCS-3">Moran OCS-3</option>
                      <option value="Digboi Pad 14">Digboi Pad 14</option>
                      <option value="Baghjan Well #5">Baghjan Well #5</option>
                      <option value="Duliajan Plant">Duliajan Plant</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono mb-1">Activity</label>
                    <select
                      value={ingestActivity}
                      onChange={(e) => setIngestActivity(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-medium"
                    >
                      <option value="Drilling">Drilling</option>
                      <option value="Workover">Workover</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Lifting">Lifting</option>
                      <option value="Production">Production</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono mb-1">Shift</label>
                    <select
                      value={ingestShift}
                      onChange={(e) => setIngestShift(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-medium"
                    >
                      <option value="DAY">DAY Shift</option>
                      <option value="NIGHT">NIGHT Shift</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1.5">Observation Narrative (Hindi / English / Assamese)</label>
                  <textarea
                    rows={3}
                    value={ingestText}
                    onChange={(e) => setIngestText(e.target.value)}
                    placeholder="e.g. Pump-04 casing flange weeping hydraulic fluid under 1800 PSI vibration. Temporary clamp fitted."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
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
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-heading font-bold shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {ingesting ? 'Analyzing...' : 'Run Single SIF Analysis'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
