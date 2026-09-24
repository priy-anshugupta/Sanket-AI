'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Download, 
  AlertTriangle, 
  Flame, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Activity, 
  FileText, 
  Tag, 
  Scale, 
  Wrench, 
  Check, 
  ArrowUp, 
  ArrowDown, 
  Send 
} from 'lucide-react';

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
import { getApiBase } from '@/lib/config';

const API = getApiBase();

const ENTITY_BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  EQUIPMENT: { bg: 'bg-[#E8F4F0]', text: 'text-[#0A6B63]', border: 'border-[#BCE3DC]' },
  LOCATION: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  BARRIER_FAILURE: { bg: 'bg-[#FDF2F2]', text: 'text-[#D63B3B]', border: 'border-[#F5C6C6]' },
  ENERGY_SOURCE: { bg: 'bg-[#FEF7EC]', text: 'text-[#D4820A]', border: 'border-[#F8DFB6]' },
  SHIFT_TIME: { bg: 'bg-[#F0F2ED]', text: 'text-[#5E7072]', border: 'border-[#C2CEC2]' },
  WEATHER_CONDITION: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  PPE_STATUS: { bg: 'bg-[#EDFAF4]', text: 'text-[#1B8A6C]', border: 'border-[#BFEADB]' },
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

  const [actionType, setActionType] = useState('INVESTIGATION');
  const [actionPriority, setActionPriority] = useState('HIGH');
  const [actionAssignee, setActionAssignee] = useState('Field Safety Lead');
  const [actionNotes, setActionNotes] = useState('');
  const [feedbackReason, setFeedbackReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

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

  const handleResolve = async () => {
    try {
      setIsSubmittingFeedback(true);
      setFeedbackSuccess(null);
      setActionError(null);
      const res = await fetch(`${API}/api/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setFeedbackSuccess('✅ Incident marked as RESOLVED by Safety Officer!');
        if (report) {
          setReport({ ...report, status: 'RESOLVED' });
        }
        window.dispatchEvent(new CustomEvent('sanket:new_report', { detail: { id: reportId, status: 'RESOLVED' } }));
        await fetchReport();
      } else {
        setActionError('Failed to resolve incident. Server returned an error.');
        setTimeout(() => setActionError(null), 5000);
      }
    } catch (err) {
      console.error('Resolve error:', err);
      setActionError('Failed to resolve incident. Please verify server connectivity.');
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleFeedback = async (action: 'AGREE' | 'UPGRADE' | 'DOWNGRADE', correctedLabel: 'HIGH' | 'MEDIUM' | 'LOW') => {
    try {
      setIsSubmittingFeedback(true);
      setFeedbackSuccess(null);
      setActionError(null);
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
        setFeedbackSuccess(`✅ Decision Recorded: Label set to ${correctedLabel} & Incident RESOLVED!`);
        if (report) {
          const newScore = correctedLabel === 'HIGH' 
            ? Math.max(report.sif_score || 0, 0.88) 
            : (correctedLabel === 'LOW' ? Math.min(report.sif_score || 1, 0.18) : 0.55);
          setReport({ ...report, sif_label: correctedLabel, sif_score: newScore, status: 'RESOLVED' });
        }
        window.dispatchEvent(new CustomEvent('sanket:new_report', { detail: { id: reportId, status: 'RESOLVED' } }));
        await fetchReport();
      } else {
        setActionError('Failed to submit decision override. Server returned an error.');
        setTimeout(() => setActionError(null), 5000);
      }
    } catch (err) {
      console.error('Feedback error:', err);
      setActionError('Failed to submit decision override. Please verify server connectivity.');
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreatingAction(true);
      setActionSuccess(null);
      setActionError(null);
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
        setActionSuccess('✅ CAPA Work Order Generated & Dispatched!');
        setActionNotes('');
        if (report) {
          setReport({ ...report, status: 'ACTION_DISPATCHED' });
        }
        window.dispatchEvent(new CustomEvent('sanket:new_report', { detail: { id: reportId, status: 'ACTION_DISPATCHED' } }));
        await fetchReport();
      } else {
        setActionError('Failed to dispatch CAPA work order. Server returned an error.');
        setTimeout(() => setActionError(null), 5000);
      }
    } catch (err) {
      console.error('Action creation error:', err);
      setActionError('Failed to dispatch CAPA work order. Please verify server connectivity.');
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setIsCreatingAction(false);
    }
  };

  const handleDownloadPDF = () => {
    window.open(`${API}/api/reports/${reportId}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="dashboard-page max-w-6xl space-y-5 p-6 bg-[#F7F8F5] min-h-screen text-[#1A2B2D]">
        <div className="animate-pulse space-y-5">
          <div className="h-6 bg-[#E2E8E2] rounded w-1/4" />
          <div className="h-32 bg-[#E2E8E2] rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="h-48 bg-[#E2E8E2] rounded-xl" />
            <div className="h-48 bg-[#E2E8E2] rounded-xl" />
            <div className="h-48 bg-[#E2E8E2] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="dashboard-page max-w-xl mx-auto p-8 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-[#D4820A] mx-auto" />
        <h2 className="text-lg font-bold text-[#1A2B2D]">Report Not Found</h2>
        <p className="text-xs text-[#5E7072]">The requested safety report ID does not exist or has been archived.</p>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0A6B63] hover:bg-[#085B54] text-white rounded-lg text-xs font-semibold shadow-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Triage Queue
        </Link>
      </div>
    );
  }

  const sifScore = report.sif_score ?? 0;
  // Strict consistency safeguard: A low score (< 0.35) must never render as HIGH risk
  let sifLabel = report.sif_label || (sifScore >= 0.70 ? 'HIGH' : sifScore >= 0.35 ? 'MEDIUM' : 'LOW');
  if (sifScore < 0.35 && sifLabel === 'HIGH') {
    sifLabel = 'LOW';
  } else if (sifScore >= 0.70 && sifLabel === 'LOW') {
    sifLabel = 'HIGH';
  }

  return (
    <div className="dashboard-page max-w-6xl space-y-5 p-6 bg-[#F7F8F5] min-h-screen text-[#1A2B2D]">
      
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[#5E7072]">
          <Link href="/dashboard" className="hover:text-[#1A2B2D] flex items-center gap-1 font-semibold text-[#0A6B63]">
            <ArrowLeft className="w-3.5 h-3.5" /> Triage Queue
          </Link>
          <span>/</span>
          <span className="font-mono font-medium text-[#1A2B2D] bg-[#E8EFEA] px-2 py-0.5 rounded text-[11px]" title={report.id}>
            #{report.id.length > 12 ? report.id.slice(0, 8).toUpperCase() : report.id}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button suppressHydrationWarning
            type="button"
            disabled={isSubmittingFeedback || report.status === 'RESOLVED'}
            onClick={handleResolve}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer ${
              report.status === 'RESOLVED'
                ? 'bg-[#EDFAF4] text-[#1B8A6C] border border-[#BFEADB]'
                : 'bg-[#0A6B63] hover:bg-[#085B54] text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {report.status === 'RESOLVED' ? 'Incident Resolved ✓' : 'Mark as Resolved & Close'}
          </button>

          <button type="button" suppressHydrationWarning
            onClick={() => {
              window.open(`${API}/api/reports/${reportId}/dgms-form-iv`, '_blank');
            }}
            title="Generate and print official Government of India DGMS Form IV Legal Notice (Regulation 99 of Oil Mines Regulations 2017)"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FEF2F2] border border-[#FCA5A5] hover:bg-[#FEE2E2] rounded-lg text-xs font-bold text-[#991B1B] shadow-xs transition-all cursor-pointer group active:scale-95"
          >
            <FileText className="w-3.5 h-3.5 text-[#991B1B] group-hover:scale-110 transition-transform" />
            <span>🏛️ DGMS Form IV Notice</span>
          </button>

          <button type="button" suppressHydrationWarning
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#C2CEC2] hover:bg-[#F0F2ED] rounded-lg text-xs font-semibold text-[#1A2B2D] shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#0A6B63]" /> Download Executive PDF Brief
          </button>
        </div>
      </div>

      {/* SIF Severity Banner */}
      <div className={`p-5 rounded-xl border shadow-xs ${
        sifLabel === 'HIGH' ? 'bg-[#FDF2F2] border-[#F5C6C6]' :
        sifLabel === 'MEDIUM' ? 'bg-[#FEF7EC] border-[#F8DFB6]' :
        'bg-[#EDFAF4] border-[#BFEADB]'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-xs ${
              sifLabel === 'HIGH' ? 'bg-[#D63B3B]' :
              sifLabel === 'MEDIUM' ? 'bg-[#D4820A]' :
              'bg-[#1B8A6C]'
            }`}>
              {sifLabel === 'HIGH' ? <Flame className="w-6 h-6" /> : sifLabel === 'MEDIUM' ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-sans font-semibold tracking-wider uppercase px-2 py-0.5 rounded border ${
                  sifLabel === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' :
                  sifLabel === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {sifLabel === 'HIGH' ? '🚨 Potential SIF Precursor' : sifLabel === 'MEDIUM' ? '⚠️ Medium Risk Hazard' : '🛡️ Standard Observation (Non-SIF)'}
                </span>
                <span className="text-xs text-[#5E7072] font-mono">
                  {new Date(report.created_at).toLocaleString()}
                </span>
              </div>
              <h1 className="text-xl font-heading font-bold text-[#1A2B2D] mt-0.5">
                {sifLabel} Risk Level ({ (sifScore * 100).toFixed(1) }%)
              </h1>
            </div>
          </div>

          {/* Quick Stats in Banner */}
          <div className="flex items-center gap-4 bg-white px-4 py-2.5 rounded-lg border border-[#C2CEC2] shadow-xs">
            <div>
              <div className="text-[10px] uppercase font-semibold text-[#5E7072]">Location</div>
              <div className="font-semibold text-[#1A2B2D] text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#0A6B63]" />
                {report.location || 'Unassigned'}
              </div>
            </div>
            <div className="h-6 w-px bg-[#C2CEC2]" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-[#5E7072]">Activity</div>
              <div className="font-semibold text-[#1A2B2D] text-xs flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#0A6B63]" />
                {report.activity_type || 'General Ops'}
              </div>
            </div>
            <div className="h-6 w-px bg-[#C2CEC2]" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-[#5E7072]">Shift</div>
              <div className="font-semibold text-[#1A2B2D] text-xs flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#0A6B63]" />
                {report.shift || 'DAY'}
              </div>
            </div>
            <div className="h-6 w-px bg-[#C2CEC2]" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-[#5E7072]">Status</div>
              <div className="font-semibold text-xs">
                {report.status === 'ACTION_DISPATCHED' ? (
                  <span className="text-[#0A6B63] font-bold flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5" /> CAPA ACTIVE
                  </span>
                ) : report.status === 'RESOLVED' || report.status === 'CLOSED' ? (
                  <span className="text-[#1B8A6C] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> RESOLVED
                  </span>
                ) : (
                  <span className="text-[#D4820A] font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> IN REVIEW
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Score Meter */}
        <div className="mt-3.5 pt-3.5 border-t border-[#C2CEC2]/70">
          <div className="flex justify-between text-xs font-medium text-[#5E7072] mb-1">
            <span>Composite AI Risk Assessment & Precursor Confidence</span>
            <span className="font-mono font-bold text-[#1A2B2D]">{(sifScore * 100).toFixed(1)}% Confidence</span>
          </div>
          <div className="h-2 bg-white/80 rounded-full overflow-hidden border border-[#C2CEC2]">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                sifLabel === 'HIGH' ? 'bg-[#D63B3B]' :
                sifLabel === 'MEDIUM' ? 'bg-[#D4820A]' :
                'bg-[#1B8A6C]'
              }`}
              style={{ width: `${Math.max(5, sifScore * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Narrative + Stage 5 Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Column (2 spans): Raw Narrative & Linguistic/NER Breakdown */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Incident Narrative Card */}
          <div className="bg-white p-5 rounded-xl border-2 border-[#C2CEC2] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1A2B2D] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#0A6B63]" /> Field Incident Report
              </h2>
              <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded bg-[#F0F2ED] text-[#5E7072] border border-[#C2CEC2]">
                {report.language?.toUpperCase() === 'AS' ? 'Assamese' : report.language?.toUpperCase() === 'HI' ? 'Hindi' : 'English'} (Auto-Detected)
              </span>
            </div>
            <div className="p-3.5 bg-[#F7F8F5] rounded-lg border border-[#C2CEC2] text-[#1A2B2D] text-sm leading-relaxed font-medium">
              &ldquo;{report.raw_text}&rdquo;
            </div>

            {/* Matched SIF Reference Anchor */}
            {report.matched_anchor_text && (
              <div className="p-3 rounded-lg bg-[#E8F4F0] border border-[#BCE3DC] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A6B63] uppercase tracking-wide">
                  <span>🎯</span> Matching Historical Benchmark ({report.matched_anchor_id})
                </div>
                <p className="text-xs text-[#1A2B2D] font-normal leading-relaxed">
                  {report.matched_anchor_text}
                </p>
              </div>
            )}
          </div>

          {/* Stage 3: Extracted Industrial Entities */}
          <div className="bg-white p-5 rounded-xl border-2 border-[#C2CEC2] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1A2B2D] flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#0A6B63]" /> Identified Safety & Operational Factors ({report.entities?.length || 0})
              </h2>
              <span className="text-[11px] text-[#5E7072]">Automated Factor Extraction</span>
            </div>

            {report.entities && report.entities.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {report.entities.map((ent, idx) => {
                  const style = ENTITY_BADGE_COLORS[ent.entity_type] || { bg: 'bg-[#F0F2ED]', text: 'text-[#1A2B2D]', border: 'border-[#C2CEC2]' };
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
                    >
                      <span className="text-[10px] capitalize opacity-80 font-medium">{ent.entity_type.replace(/_/g, ' ').toLowerCase()}:</span>
                      <span className="font-semibold">{ent.entity_value}</span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#5E7072] italic">No specific industrial entities flagged in this narrative.</p>
            )}
          </div>

          {/* Stage 4: IOGP Life-Saving Rules Tagging */}
          <div className="bg-white p-5 rounded-xl border-2 border-[#C2CEC2] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1A2B2D] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0A6B63]" /> IOGP Life-Saving Rules Mapping
              </h2>
              <span className="text-[11px] text-[#5E7072]">Global E&P Safety Standard</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {report.lsr_tags && report.lsr_tags.length > 0 ? (
                report.lsr_tags.map((tag, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-[#BCE3DC] bg-[#E8F4F0]/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-[#0A6B63]">{tag.rule_name}</div>
                      <div className="text-[10px] text-[#5E7072] font-mono">Rule ID: {tag.rule_id}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-[#0A6B63] bg-white px-2 py-0.5 rounded border border-[#BCE3DC]">
                        {(tag.similarity * 100).toFixed(0)}% Match
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#5E7072] italic col-span-2">No direct IOGP Life-Saving Rule violation triggered.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 span): AI Explanation, Human Feedback & CAPA Action */}
        <div className="space-y-5">
          
          {/* Stage 5: Grounded Plain-English AI Explanation */}
          <div className="bg-white p-5 rounded-xl border-2 border-[#C2CEC2] shadow-xs space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D63B3B] animate-pulse" />
              <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1A2B2D]">
                AI Safety Analysis & Rationale
              </h2>
            </div>
            <div className="p-3.5 rounded-lg bg-[#0F1B1D] text-[#F7F8F5] text-xs leading-relaxed font-sans">
              {report.explanation ? (
                <p>{report.explanation}</p>
              ) : (
                <p className="text-[#8BA4A7] italic">
                  {sifScore >= 0.50
                    ? 'Analyzing incident against DGMS and IOGP safety protocols...'
                    : 'SIF risk score is within standard baseline; automated executive explanation omitted.'}
                </p>
              )}
            </div>
          </div>

          {/* Human-in-the-Loop Feedback Widget */}
          <div className="bg-white p-5 rounded-xl border-2 border-[#C2CEC2] shadow-xs space-y-3">
            <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1A2B2D] flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#0A6B63]" /> Safety Officer Verification & Override
            </h2>
            <p className="text-xs text-[#5E7072]">
              Validate or adjust the AI assessment. All decisions are logged with officer timestamp for statutory compliance audit.
            </p>

            <div className="space-y-2">
              <input suppressHydrationWarning
                type="text"
                value={feedbackReason}
                onChange={(e) => setFeedbackReason(e.target.value)}
                placeholder="Optional justification note..."
                className="w-full px-3 py-2 text-xs border border-[#C2CEC2] rounded-lg focus:outline-none focus:border-[#0A6B63] bg-[#F7F8F5]"
              />
              <div className="grid grid-cols-3 gap-1.5">
                <button suppressHydrationWarning
                  type="button"
                  disabled={isSubmittingFeedback}
                  onClick={() => handleFeedback('AGREE', sifLabel as any)}
                  className="px-2.5 py-2 bg-[#0A6B63] hover:bg-[#085B54] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="w-3 h-3" /> Confirm
                </button>
                <button suppressHydrationWarning
                  type="button"
                  disabled={isSubmittingFeedback}
                  onClick={() => handleFeedback('UPGRADE', 'HIGH')}
                  className="px-2.5 py-2 bg-[#D63B3B] hover:bg-[#B92525] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowUp className="w-3 h-3" /> Upgrade
                </button>
                <button suppressHydrationWarning
                  type="button"
                  disabled={isSubmittingFeedback}
                  onClick={() => handleFeedback('DOWNGRADE', 'LOW')}
                  className="px-2.5 py-2 bg-[#5E7072] hover:bg-[#475759] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowDown className="w-3 h-3" /> Downgrade
                </button>
              </div>

              {report.status === 'ACTION_DISPATCHED' && (
                <div className="pt-2 text-center text-xs font-semibold text-[#0A6B63] flex items-center justify-center gap-1">
                  <Wrench className="w-3.5 h-3.5" /> CAPA Work Order Dispatched & Active
                </div>
              )}
              {(report.status === 'RESOLVED' || report.status === 'CLOSED') && (
                <div className="pt-2 text-center text-xs font-semibold text-[#1B8A6C] flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Incident Marked as Resolved
                </div>
              )}
            </div>

            {feedbackSuccess && (
              <div className="p-2.5 bg-[#EDFAF4] border border-[#BFEADB] rounded-lg text-xs text-[#1B8A6C] font-semibold">
                {feedbackSuccess}
              </div>
            )}

            {actionError && (
              <div className="p-2.5 bg-[#FDF2F2] border border-[#F5C6C6] rounded-lg text-xs text-[#D63B3B] font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}
          </div>

          {/* CAPA Work Order Dispatch */}
          <div className="bg-white p-5 rounded-xl border-2 border-[#C2CEC2] shadow-xs space-y-3">
            <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1A2B2D] flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-[#0A6B63]" /> Dispatch CAPA Work Order
            </h2>
            <form onSubmit={handleCreateAction} className="space-y-2.5">
              <div>
                <label className="text-[10px] font-semibold text-[#5E7072] uppercase">Action Type</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs border border-[#C2CEC2] rounded-lg bg-white text-[#1A2B2D]"
                >
                  <option value="INVESTIGATION">Root Cause Investigation</option>
                  <option value="REPAIR">Immediate Equipment Repair</option>
                  <option value="SHUTDOWN">Emergency Isolation / Shutdown</option>
                  <option value="INSPECTION">Safety Barrier Inspection</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-[#5E7072] uppercase">Priority</label>
                  <select
                    value={actionPriority}
                    onChange={(e) => setActionPriority(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs border border-[#C2CEC2] rounded-lg bg-white text-[#1A2B2D]"
                  >
                    <option value="CRITICAL">Critical (24h SLA)</option>
                    <option value="HIGH">High (48h SLA)</option>
                    <option value="ROUTINE">Routine (7d SLA)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#5E7072] uppercase">Assignee</label>
                  <input suppressHydrationWarning
                    type="text"
                    value={actionAssignee}
                    onChange={(e) => setActionAssignee(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs border border-[#C2CEC2] rounded-lg bg-white text-[#1A2B2D]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[#5E7072] uppercase">Instructions / SLA Notes</label>
                <textarea suppressHydrationWarning
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="e.g. Inspect flange seal, calibrate detector, re-tag LOTO..."
                  rows={2}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs border border-[#C2CEC2] rounded-lg bg-white text-[#1A2B2D]"
                />
              </div>

              <button suppressHydrationWarning
                type="submit"
                disabled={isCreatingAction}
                className="w-full py-2 bg-[#0A6B63] hover:bg-[#085B54] text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {isCreatingAction ? 'Dispatching...' : 'Generate CAPA Work Order'}
              </button>
            </form>

            {actionSuccess && (
              <div className="p-2.5 bg-[#EDFAF4] border border-[#BFEADB] rounded-lg text-xs text-[#1B8A6C] font-semibold">
                {actionSuccess}
              </div>
            )}

            {/* Dispatched Work Orders List */}
            {report.actions && report.actions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#C2CEC2] space-y-2">
                <div className="text-[10px] uppercase font-bold text-[#5E7072] tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0A6B63]" /> Active Dispatched Orders ({report.actions.length})
                </div>
                <div className="space-y-1.5">
                  {report.actions.map((act) => (
                    <div key={act.id} className="p-2.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] text-xs flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-[#1A2B2D] flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-[#0A6B63] bg-[#E8F4F0] px-1.5 py-0.5 rounded border border-[#BCE3DC]">
                            #{act.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span>{act.action_type.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="text-[11px] text-[#5E7072] mt-0.5">
                          Assigned: <strong className="text-[#1A2B2D]">{act.assigned_to || 'Field Safety Lead'}</strong> · Due: {act.due_date ? new Date(act.due_date).toLocaleDateString() : '48h SLA'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EDFAF4] text-[#1B8A6C] border border-[#BFEADB]">
                          {act.status || 'OPEN'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
