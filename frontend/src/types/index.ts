// SANKET · AI — TypeScript Types
// Mirrors backend Pydantic schemas

export interface Entity {
  id: string;
  entity_type: string;
  entity_value: string;
  confidence: number;
}

export interface LSRTag {
  id: string;
  rule_name: string;
  rule_id: string;
  similarity: number;
}

export interface Action {
  id: string;
  action_type: string;
  priority: string;
  assigned_to?: string;
  due_date?: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface Report {
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

export interface ReportListResponse {
  reports: Report[];
  total: number;
  page: number;
  limit: number;
}

export interface AnalyticsSummary {
  total_reports: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  pending_count: number;
}

export interface HeatmapCell {
  site: string;
  activity: string;
  sif_count: number;
  total_count: number;
  density: number;
  label: string;
}

export interface HeatmapData {
  sites: string[];
  activities: string[];
  cells: HeatmapCell[];
  site_densities: Record<string, number>;
}

export interface GraphNode {
  data: {
    id: string;
    label: string;
    type: string;
    report_count: number;
    severity: string;
  };
}

export interface GraphEdge {
  data: {
    id: string;
    source: string;
    target: string;
    weight: number;
    edge_type: string;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface BaghjanEvent {
  day: number;
  date: string;
  report: string;
  sif_score: number;
  sif_label: string;
  energy_type: string;
  barrier: string;
  status: string;
  multiplier_event?: boolean;
  recommendation?: string;
  counterfactual?: string;
}

export interface AirGapStatus {
  is_airgapped: boolean;
  mode: string;
  outbound_connections: number;
  zero_egress: boolean;
  models_loaded: {
    embeddings: string;
    ner: string;
    llm: string;
  };
}

export type SIFLabel = 'HIGH' | 'MEDIUM' | 'LOW';
export type ReportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type UserRole = 'admin' | 'hse_manager' | 'site_officer' | 'field_worker';

export interface SwarmTraceResponse {
  report_id: string;
  sif_score: number;
  sif_label: 'HIGH' | 'MEDIUM' | 'LOW';
  is_sif_precursor: boolean;
  matched_anchor_id?: string | null;
  matched_anchor_text?: string | null;
  entities: Array<{
    type: string;
    value: string;
    confidence?: number;
    start?: number;
    end?: number;
  }>;
  primary_iogp_rule?: string | null;
  explanation?: string | null;
  consensus_confidence?: number | null;
  guardrail_status?: string | null;
  audit_notes?: string | null;
  action_recommendation?: {
    action_type: string;
    priority: string;
    suggested_assignee: string;
    recommended_sla: string;
  } | null;
  agent_trace: string[];
}
