'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Entity {
  id: string;
  entity_type: string;
  entity_value: string;
  confidence: number;
}

interface LSRTag {
  id: string;
  rule_name: string;
  rule_id: string;
  similarity: number;
}

interface Action {
  id: string;
  action_type: string;
  priority: string;
  assigned_to?: string;
  due_date?: string;
  status: string;
  notes?: string;
  created_at: string;
}

interface ReportDetail {
  id: string;
  raw_text: string;
  preprocessed_text?: string;
  language?: string;
  sif_score?: number;
  sif_label?: string;
  is_sif_precursor?: boolean;
  matched_anchor_id?: string;
  matched_anchor_text?: string;
  iogp_rule?: string;
  location?: string;
  asset_id?: string;
  activity_type?: string;
  shift?: string;
  explanation?: string;
  status: string;
  source?: string;
  created_at: string;
  entities: Entity[];
  lsr_tags: LSRTag[];
  actions: Action[];
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const ENTITY_BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  EQUIPMENT: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  LOCATION: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  BARRIER_FAILURE: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  ENERGY_SOURCE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  SHIFT_TIME: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  WEATHER_CONDITION: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  PPE_STATUS: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  BODY_PART: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
};

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const reportId = resolvedParams.id;
  const router = useRouter();

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isCreatingAction, setIsCreatingAction] = useState(false);

  // Action form state
  const [actionType, setActionType] = useState('INVESTIGATION');
  const [actionPriority, setActionPriority] = useState('HIGH');
  const [actionAssignee, setActionAssignee] = useState('Field Safety Lead');
  const [actionNotes, setActionNotes] = useState('');

  // Feedback reason
  const [feedbackReason, setFeedbackReason] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/reports/${reportId}`);
      if (!res.ok) throw new Error('Report not found');
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const handleFeedback = async (action: 'AGREE' | 'UPGRADE' | 'DOWNGRADE', correctedLabel: 'HIGH' | 'MEDIUM' | 'LOW') => {
    try {
      setIsSubmittingFeedback(true);
      setFeedbackSuccess(null);
      const res = await fetch(`${API}/api/reports/${reportId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          corrected_label: correctedLabel,
          action,
          reason: feedbackReason || `Officer human-in-the-loop decision: ${action}`,
          officer_id: 'officer-current-session',
        }),
      });
      if (res.ok) {
        setFeedbackSuccess(`Feedback recorded: Label adjusted to ${correctedLabel}`);
        await fetchReport();
      }
    } catch (err) {
      console.error('Feedback error:', err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreatingAction(true);
      setActionSuccess(null);
      const res = await fetch(`${API}/api/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: reportId,
          action_type: actionType,
          priority: actionPriority,
          assigned_to: actionAssignee,
          notes: actionNotes,
        }),
      });
      if (res.ok) {
        setActionSuccess('CAPA Work Order generated and dispatched!');
        setActionNotes('');
        await fetchReport();
      }
    } catch (err) {
      console.error('Action creation error:', err);
    } finally {
      setIsCreatingAction(false);
    }
  };

  const handleDownloadPDF = () => {
    window.open(`${API}/api/reports/${reportId}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-40 bg-gray-200 rounded-xl" />
          <div className="grid grid-cols-3 gap-6">
            <div className="h-60 bg-gray-200 rounded-xl" />
            <div className="h-60 bg-gray-200 rounded-xl" />
            <div className="h-60 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Report Not Found</h2>
        <p className="text-gray-500 mb-6">The requested safety report ID does not exist or has been archived.</p>
        <Link href="/dashboard" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">
          Return to Triage Queue
        </Link>
      </div>
    );
  }

  const sifScore = report.sif_score ?? 0;
  const sifLabel = report.sif_label ?? 'LOW';

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-gray-900 flex items-center gap-1 font-medium">
            ← Triage Queue
          </Link>
          <span>/</span>
          <span className="font-mono text-gray-700">{report.id.substring(0, 13)}...</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 shadow-sm transition-colors"
          >
            <span>📄</span> Download Executive PDF Brief
          </button>
        </div>
      </div>

      {/* SIF Severity Banner */}
      <div className={`p-6 rounded-2xl border ${
        sifLabel === 'HIGH' ? 'bg-red-50/70 border-red-200' :
        sifLabel === 'MEDIUM' ? 'bg-amber-50/70 border-amber-200' :
        'bg-emerald-50/70 border-emerald-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-display font-black text-2xl shadow-inner ${
              sifLabel === 'HIGH' ? 'bg-red-600 text-white animate-pulse-red' :
              sifLabel === 'MEDIUM' ? 'bg-amber-500 text-white' :
              'bg-emerald-600 text-white'
            }`}>
              {sifLabel === 'HIGH' ? '🔴' : sifLabel === 'MEDIUM' ? '🟡' : '🟢'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-white/80 border text-gray-800">
                  SIF PRECURSOR POTENTIAL
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  {new Date(report.created_at).toLocaleString()}
                </span>
              </div>
              <h1 className="text-2xl font-display font-extrabold text-gray-900 mt-1">
                {sifLabel} RISK LEVEL ({ (sifScore * 100).toFixed(1) }%)
              </h1>
            </div>
          </div>

          {/* Quick Stats in Banner */}
          <div className="flex items-center gap-6 bg-white/80 backdrop-blur px-5 py-3 rounded-xl border border-gray-200/60 shadow-sm">
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-400">Location</div>
              <div className="font-semibold text-gray-900 text-sm">{report.location || 'Unassigned'}</div>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-400">Activity</div>
              <div className="font-semibold text-gray-900 text-sm">{report.activity_type || 'General Ops'}</div>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-400">Shift</div>
              <div className="font-semibold text-gray-900 text-sm">{report.shift || 'DAY'}</div>
            </div>
          </div>
        </div>

        {/* Score Meter */}
        <div className="mt-4 pt-4 border-t border-gray-200/60">
          <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
            <span>Deterministic Anchor Cosine Similarity + Negation-Aware Keyword Boost</span>
            <span className="font-mono font-bold">{sifScore.toFixed(4)} / 1.0000</span>
          </div>
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                sifLabel === 'HIGH' ? 'bg-red-600' :
                sifLabel === 'MEDIUM' ? 'bg-amber-500' :
                'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(5, sifScore * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Narrative + Stage 5 Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Raw Narrative & Linguistic/NER Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Narrative Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-gray-900 flex items-center gap-2">
                <span>📝</span> Unstructured Incident Narrative
              </h2>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-gray-100 text-gray-600 border">
                Lang: {report.language?.toUpperCase() || 'EN'} · Stage 1 Preprocessed
              </span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 text-base leading-relaxed font-normal">
              &ldquo;{report.raw_text}&rdquo;
            </div>

            {/* Matched SIF Reference Anchor */}
            {report.matched_anchor_text && (
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase">
                  <span>🎯</span> Nearest Precomputed SIF Anchor Reference ({report.matched_anchor_id})
                </div>
                <p className="text-sm text-blue-950 font-medium">
                  {report.matched_anchor_text}
                </p>
              </div>
            )}
          </div>

          {/* Stage 3: Extracted Industrial Entities */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-gray-900 flex items-center gap-2">
                <span>🏷️</span> Stage 3 Extracted Industrial Entities ({report.entities?.length || 0})
              </h2>
              <span className="text-xs text-gray-400">Zero-Shot NER & Spatial Normalization</span>
            </div>

            {report.entities && report.entities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {report.entities.map((ent, idx) => {
                  const style = ENTITY_BADGE_COLORS[ent.entity_type] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}
                    >
                      <span className="text-[10px] uppercase opacity-75 font-mono">{ent.entity_type}:</span>
                      <span>{ent.entity_value}</span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No specific industrial entities flagged in this narrative.</p>
            )}
          </div>

          {/* Stage 4: IOGP Life-Saving Rules Tagging */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-gray-900 flex items-center gap-2">
                <span>🛡️</span> Stage 4 IOGP Life-Saving Rules Mapping
              </h2>
              <span className="text-xs text-gray-400">IOGP 9 Life-Saving Rules Framework</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.lsr_tags && report.lsr_tags.length > 0 ? (
                report.lsr_tags.map((tag, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-blue-900">{tag.rule_name}</div>
                      <div className="text-[11px] text-blue-700 font-mono">Rule ID: {tag.rule_id}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-blue-800 bg-white px-2 py-1 rounded border border-blue-200">
                        {(tag.similarity * 100).toFixed(0)}% Match
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic col-span-2">No direct IOGP Life-Saving Rule violation triggered.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 span): AI Explanation, Human Feedback & CAPA Action */}
        <div className="space-y-6">
          {/* Stage 5: Grounded Plain-English AI Explanation */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="font-display font-bold text-gray-900 text-sm uppercase tracking-wide">
                Stage 5 Grounded AI Explanation
              </h2>
            </div>
            <div className="p-4 rounded-xl bg-gray-900 text-gray-100 text-sm leading-relaxed font-sans shadow-inner">
              {report.explanation ? (
                <p>{report.explanation}</p>
              ) : (
                <p className="text-gray-400 italic">
                  {sifScore >= 0.50
                    ? 'AI Explanation is being generated in sovereign background queue...'
                    : 'Report SIF score is below 0.50 threshold; automatic executive explanation omitted to preserve local compute.'}
                </p>
              )}
            </div>
          </div>

          {/* Human-in-the-Loop Feedback Widget */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="font-display font-bold text-gray-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <span>⚖️</span> Officer Review (Human-in-the-Loop)
            </h2>
            <p className="text-xs text-gray-500">
              Validate or override AI classification. Decisions are logged with officer timestamp for continuous audit.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={feedbackReason}
                onChange={(e) => setFeedbackReason(e.target.value)}
                placeholder="Optional justification note..."
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-red-500"
              />
              <div className="grid grid-cols-3 gap-2">
                <button
                  disabled={isSubmittingFeedback}
                  onClick={() => handleFeedback('AGREE', sifLabel as any)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  ✓ Confirm
                </button>
                <button
                  disabled={isSubmittingFeedback}
                  onClick={() => handleFeedback('UPGRADE', 'HIGH')}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  ▲ Upgrade
                </button>
                <button
                  disabled={isSubmittingFeedback}
                  onClick={() => handleFeedback('DOWNGRADE', 'LOW')}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  ▼ Downgrade
                </button>
              </div>
            </div>

            {feedbackSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
                {feedbackSuccess}
              </div>
            )}
          </div>

          {/* CAPA Work Order Dispatch */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="font-display font-bold text-gray-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <span>🔧</span> Dispatch CAPA Work Order
            </h2>
            <form onSubmit={handleCreateAction} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Action Type</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                >
                  <option value="INVESTIGATION">Root Cause Investigation</option>
                  <option value="REPAIR">Immediate Equipment Repair</option>
                  <option value="SHUTDOWN">Emergency Isolation / Shutdown</option>
                  <option value="INSPECTION">Safety Barrier Inspection</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Priority</label>
                  <select
                    value={actionPriority}
                    onChange={(e) => setActionPriority(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="CRITICAL">Critical (24h SLA)</option>
                    <option value="HIGH">High (48h SLA)</option>
                    <option value="ROUTINE">Routine (7d SLA)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Assignee</label>
                  <input
                    type="text"
                    value={actionAssignee}
                    onChange={(e) => setActionAssignee(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Action Instructions / SLA Notes</label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="e.g. Inspect flange seal, calibrate detector, re-tag LOTO..."
                  rows={2}
                  className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg"
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingAction}
                className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isCreatingAction ? 'Dispatching...' : '⚡ Generate CAPA Work Order'}
              </button>
            </form>

            {actionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
                {actionSuccess}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
