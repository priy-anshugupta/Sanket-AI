'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  ChevronRight, 
  FileText,
  Zap,
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

    const handleLiveReport = (e: any) => {
      fetchSummary();
      fetchReports();
    };

    window.addEventListener('sanket:new_report', handleLiveReport);
    const interval = setInterval(() => {
      fetchSummary();
      fetchReports();
    }, 3000);

    return () => {
      window.removeEventListener('sanket:new_report', handleLiveReport);
      clearInterval(interval);
    };
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
    } catch {
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
        setBatchSuccessMsg(`Ingested & classified ${data.total_ingested} reports in ${data.elapsed_seconds}s`);
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
    } catch {
      clearInterval(timer);
      alert('Network error during batch ingestion.');
      setBatchProgress(0);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="dashboard-page space-y-5">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-bold text-xl text-[#1A2B2D] tracking-tight">
              Triage Queue Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#E8F4F0] text-[#0A6B63] border border-[#BCE3DC]">
              SIF Precursor AI
            </span>
          </div>
          <p className="text-[13px] text-[#5E7072] mt-0.5 font-normal">
            Real-time unstructured safety observations prioritized by Serious Injury & Fatality (SIF) potential
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchSummary(); fetchReports(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#C2CEC2] bg-white hover:bg-[#F0F2ED] text-[#3E5052] text-xs font-semibold shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => setShowIngest(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A6B63] hover:bg-[#085B54] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Ingest Observation
          </button>
        </div>
      </div>

      {/* ── Executive Summary KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-xl border-2 border-[#C2CEC2] p-4 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#5E7072]">Total Ingested</div>
          <div className="font-heading text-2xl font-bold text-[#1A2B2D] mt-1">
            {summary?.total_reports ?? 0}
          </div>
          <div className="text-[11px] text-[#94A3A5] mt-1">Across 10 Oil India Assets</div>
        </div>

        <div className="bg-white rounded-xl border-2 border-[#C2CEC2] border-l-4 border-l-[#D63B3B] p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#D63B3B] flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> High SIF Precursors
          </div>
          <div className="font-heading text-2xl font-bold text-[#D63B3B] mt-1">
            {summary?.high_count ?? 0}
          </div>
          <div className="text-[11px] text-[#5E7072] mt-1 font-medium">Immediate Action Required</div>
        </div>

        <div className="bg-white rounded-xl border-2 border-[#C2CEC2] border-l-4 border-l-[#D4820A] p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#D4820A] flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Medium Risk
          </div>
          <div className="font-heading text-2xl font-bold text-[#D4820A] mt-1">
            {summary?.medium_count ?? 0}
          </div>
          <div className="text-[11px] text-[#5E7072] mt-1 font-medium">Degraded Secondary Barriers</div>
        </div>

        <div className="bg-white rounded-xl border-2 border-[#C2CEC2] border-l-4 border-l-[#1B8A6C] p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#1B8A6C] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Low / Non-SIF
          </div>
          <div className="font-heading text-2xl font-bold text-[#1B8A6C] mt-1">
            {summary?.low_count ?? 0}
          </div>
          <div className="text-[11px] text-[#5E7072] mt-1 font-medium">Standard Housekeeping & PPE</div>
        </div>

        <div className="bg-white rounded-xl border-2 border-[#C2CEC2] border-l-4 border-l-[#0A6B63] p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#0A6B63] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Neural Latency
          </div>
          <div className="font-heading text-2xl font-bold text-[#1A2B2D] mt-1">&lt; 4.5s</div>
          <div className="text-[11px] text-[#5E7072] mt-1 font-medium">7-Stage Pipeline Execution</div>
        </div>
      </div>

      {/* ── Filter & Search Control Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#C2CEC2] shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-[#5E7072] mr-1.5 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#94A3A5]" /> Filter:
          </span>
          {[
            { id: '', label: 'All Incidents' },
            { id: 'HIGH', label: 'High SIF' },
            { id: 'MEDIUM', label: 'Medium' },
            { id: 'LOW', label: 'Low / Non-SIF' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.id
                  ? 'bg-[#0A6B63] text-white font-semibold shadow-xs'
                  : 'bg-[#F0F2ED] text-[#3E5052] hover:bg-[#E2E8E2]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3A5]" />
          <input
            type="text"
            placeholder="Search equipment, location, hazard..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-1.5 bg-[#F7F8F5] border border-[#C2CEC2] rounded-lg text-xs text-[#1A2B2D] placeholder-[#94A3A5] w-72 focus:outline-none focus:border-[#0A6B63] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* ── High-Contrast Triage Data Table ── */}
      <div className="bg-white rounded-xl border-2 border-[#C2CEC2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="triage-table">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                <th className="text-left min-w-[380px]">Report Incident Narrative</th>
                <th className="text-left w-36">SIF Classification</th>
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
                  <td colSpan={8} className="text-center py-12 text-[#94A3A5] font-mono text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#94A3A5]" />
                    Querying Safety Database...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-[#94A3A5] text-xs">
                    <FileText className="mx-auto mb-2 h-5 w-5 text-[#94A3A5]" />
                    <div className="font-semibold text-[#3E5052]">No safety reports match the current view.</div>
                    <button onClick={() => { setFilter(''); setSearch(''); }} className="mt-2 text-xs font-semibold text-[#0A6B63] hover:underline">Clear filters</button>
                  </td>
                </tr>
              ) : (
                reports.map((report, idx) => (
                  <tr key={report.id} className="group hover:bg-[#F4F6F2] transition-colors">
                    <td className="text-center font-mono text-xs text-[#94A3A5]">
                      {(page - 1) * 20 + idx + 1}
                    </td>

                    {/* Narrative */}
                    <td className="py-3">
                      <div className="font-medium text-[#1A2B2D] text-xs leading-snug line-clamp-2">
                        {report.raw_text}
                      </div>
                      <div className="text-[10px] font-mono text-[#94A3A5] mt-0.5">
                        ID: {report.id}
                      </div>
                    </td>

                    {/* SIF Score Pill */}
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium ${
                        report.sif_label === 'HIGH'
                          ? 'bg-[#FDF2F2] text-[#D63B3B] border border-[#F5C6C6]'
                          : report.sif_label === 'MEDIUM'
                          ? 'bg-[#FEF7EC] text-[#D4820A] border border-[#F8DFB6]'
                          : 'bg-[#EDFAF4] text-[#1B8A6C] border border-[#BFEADB]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          report.sif_label === 'HIGH' ? 'bg-[#D63B3B]' : report.sif_label === 'MEDIUM' ? 'bg-[#D4820A]' : 'bg-[#1B8A6C]'
                        }`} />
                        {report.sif_label} {report.sif_score?.toFixed(2)}
                      </span>
                    </td>

                    {/* IOGP Rule */}
                    <td>
                      {report.iogp_rule ? (
                        <span className="text-[11px] font-medium text-[#3E5052] bg-[#F0F2ED] px-2 py-0.5 rounded-md border border-[#C2CEC2] inline-block truncate max-w-[160px]">
                          {report.iogp_rule}
                        </span>
                      ) : (
                        <span className="text-[#94A3A5] text-xs">—</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="text-xs font-medium text-[#3E5052]">
                      {report.location || 'Well Pad 7'}
                    </td>

                    {/* Status */}
                    <td>
                      {report.sif_label === 'HIGH' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FDF2F2] text-[#D63B3B] border border-[#F5C6C6]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D63B3B]" />
                          SWA ACTIVE
                        </span>
                      ) : report.sif_label === 'MEDIUM' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FEF7EC] text-[#D4820A] border border-[#F8DFB6]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4820A]" />
                          IN REVIEW
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EDFAF4] text-[#1B8A6C] border border-[#BFEADB]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1B8A6C]" />
                          RESOLVED
                        </span>
                      )}
                    </td>

                    {/* Time */}
                    <td className="text-xs text-[#5E7072] font-mono">
                      {new Date(report.created_at || Date.now()).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Detail Arrow */}
                    <td className="text-right pr-4">
                      <Link href={`/dashboard/report/${report.id}`} className="text-[#94A3A5] group-hover:text-[#0A6B63] transition-colors">
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

      {/* ── Dual-Tab Ingest Modal ── */}
      {showIngest && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border-2 border-[#C2CEC2] w-full max-w-lg p-6 shadow-xl space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#D8E0D8] pb-3">
              <div>
                <h3 className="font-heading font-bold text-base text-[#1A2B2D]">Ingest Safety Observations</h3>
                <p className="text-xs text-[#5E7072]">Multilingual neural pipeline (Assamese, Hindi, English)</p>
              </div>
              <button onClick={() => setShowIngest(false)} className="text-[#94A3A5] hover:text-[#1A2B2D] font-bold text-base">✕</button>
            </div>

            {/* Ingest Mode Tabs */}
            <div className="grid grid-cols-2 p-1 bg-[#F0F2ED] rounded-lg">
              <button
                type="button"
                onClick={() => setIngestTab('batch')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  ingestTab === 'batch'
                    ? 'bg-white text-[#1A2B2D] shadow-xs'
                    : 'text-[#5E7072] hover:text-[#1A2B2D]'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-[#0A6B63]" />
                Batch Dataset Import
              </button>

              <button
                type="button"
                onClick={() => setIngestTab('single')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  ingestTab === 'single'
                    ? 'bg-white text-[#1A2B2D] shadow-xs'
                    : 'text-[#5E7072] hover:text-[#1A2B2D]'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#5E7072]" />
                Single Observation
              </button>
            </div>

            {/* TAB 1: 1-Click 507 Oil India Demo Dataset */}
            {ingestTab === 'batch' && (
              <div className="space-y-4 py-1">
                <div className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] text-xs text-[#3E5052] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1A2B2D]">Dataset Scope:</span>
                    <span className="font-mono text-[#0A6B63] font-semibold">507 Observations</span>
                  </div>
                  <p className="text-[#5E7072] leading-relaxed">
                    Loads Upper Assam operational dataset spanning 10 assets (Well Pad 7, Moran OCS-3, Digboi, Baghjan) across Drilling, Workover, and Maintenance.
                  </p>
                </div>

                {/* Progress Bar */}
                {ingesting && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono text-[#3E5052]">
                      <span>Processing neural pipeline...</span>
                      <span>{batchProgress}%</span>
                    </div>
                    <div className="w-full bg-[#F0F2ED] rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-[#0A6B63] h-2 rounded-full transition-all duration-300 ease-out" 
                        style={{ width: `${batchProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {batchSuccessMsg && (
                  <div className="p-3 rounded-lg bg-[#EDFAF4] border border-[#BFEADB] text-[#1B8A6C] text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1B8A6C]" />
                    {batchSuccessMsg}
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleBatchIngest500}
                    disabled={ingesting}
                    className="w-full py-2.5 rounded-lg bg-[#0A6B63] hover:bg-[#085B54] text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    {ingesting ? 'Classifying Dataset via Neural Pipeline...' : 'Ingest Safety Dataset (507 Reports)'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Single Manual Ingestion */}
            {ingestTab === 'single' && (
              <form onSubmit={handleSingleIngest} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-[#5E7072] mb-1">Location</label>
                    <select
                      value={ingestLocation}
                      onChange={(e) => setIngestLocation(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-[#C2CEC2] bg-[#F7F8F5] text-[#1A2B2D] font-medium"
                    >
                      <option value="Well Pad 7">Well Pad 7</option>
                      <option value="Moran OCS-3">Moran OCS-3</option>
                      <option value="Digboi Pad 14">Digboi Pad 14</option>
                      <option value="Baghjan Well #5">Baghjan Well #5</option>
                      <option value="Duliajan Plant">Duliajan Plant</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#5E7072] mb-1">Activity</label>
                    <select
                      value={ingestActivity}
                      onChange={(e) => setIngestActivity(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-[#C2CEC2] bg-[#F7F8F5] text-[#1A2B2D] font-medium"
                    >
                      <option value="Drilling">Drilling</option>
                      <option value="Workover">Workover</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Lifting">Lifting</option>
                      <option value="Production">Production</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#5E7072] mb-1">Shift</label>
                    <select
                      value={ingestShift}
                      onChange={(e) => setIngestShift(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-[#C2CEC2] bg-[#F7F8F5] text-[#1A2B2D] font-medium"
                    >
                      <option value="DAY">DAY Shift</option>
                      <option value="NIGHT">NIGHT Shift</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#1A2B2D] mb-1">Observation Narrative (Assamese / Hindi / English)</label>
                  <textarea
                    rows={3}
                    value={ingestText}
                    onChange={(e) => setIngestText(e.target.value)}
                    placeholder="e.g. Pump-04 casing flange weeping hydraulic fluid under 1800 PSI vibration. Temporary clamp fitted."
                    className="w-full p-2.5 rounded-lg border border-[#C2CEC2] text-xs text-[#1A2B2D] placeholder-[#94A3A5] focus:outline-none focus:border-[#0A6B63]"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowIngest(false)}
                    className="px-3.5 py-2 rounded-lg border border-[#C2CEC2] text-xs font-medium text-[#5E7072] hover:bg-[#F0F2ED]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={ingesting}
                    className="px-4 py-2 rounded-lg bg-[#0A6B63] hover:bg-[#085B54] text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {ingesting ? 'Analyzing...' : 'Run Pipeline'}
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
