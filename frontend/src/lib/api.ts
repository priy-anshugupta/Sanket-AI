// SANKET · AI — API Client
// Typed REST client for all backend endpoints
import { getApiBase } from './config';
const API_BASE = getApiBase();

import type {
  Report, ReportListResponse, AnalyticsSummary,
  HeatmapData, GraphData, AirGapStatus, BaghjanEvent, SwarmTraceResponse,
} from '@/types';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sanket_token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sanket_token');
    }
    return null;
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(error.detail || `API Error: ${res.status}`);
    }

    return res.json();
  }

  // ─── Auth ───
  async login(username: string, password: string) {
    const data = await this.fetch<{ token: string; role: string; username: string; full_name: string }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ username, password }) }
    );
    this.setToken(data.token);
    return data;
  }

  // ─── Reports ───
  async getReports(params: {
    page?: number; limit?: number; sif_label?: string;
    status?: string; location?: string; search?: string;
  } = {}): Promise<ReportListResponse> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, String(v)); });
    return this.fetch(`/api/reports?${query.toString()}`);
  }

  async getReport(id: string): Promise<Report> {
    return this.fetch(`/api/reports/${id}`);
  }

  async ingestReport(text: string, metadata?: {
    location?: string; asset_id?: string; activity_type?: string; shift?: string; source?: string;
  }): Promise<{ job_id: string; count: number; status: string; message: string }> {
    return this.fetch('/api/reports/ingest', {
      method: 'POST',
      body: JSON.stringify({ text, source: 'text', ...metadata }),
    });
  }

  async executeSwarmTrace(
    text: string,
    location = 'Well Pad 7',
    activityType = 'Drilling'
  ): Promise<SwarmTraceResponse> {
    return this.fetch('/api/reports/swarm-trace', {
      method: 'POST',
      body: JSON.stringify({
        text,
        location,
        activity_type: activityType,
      }),
    });
  }

  async ingestCSV(file: File): Promise<{ job_id: string; count: number; status: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${this.baseUrl}/api/reports/ingest/csv`, {
      method: 'POST', body: formData, headers,
    });
    if (!res.ok) throw new Error('CSV upload failed');
    return res.json();
  }

  async submitFeedback(reportId: string, data: {
    corrected_label: string; action: string; reason?: string; officer_id?: string;
  }) {
    return this.fetch(`/api/reports/${reportId}/feedback`, {
      method: 'POST', body: JSON.stringify(data),
    });
  }

  // ─── Analytics ───
  async getSummary(): Promise<AnalyticsSummary> {
    return this.fetch('/api/analytics/summary');
  }

  async getHeatmap(): Promise<HeatmapData> {
    return this.fetch('/api/analytics/heatmap');
  }

  async getBaghjanReplay(): Promise<{ events: BaghjanEvent[] }> {
    return this.fetch('/api/analytics/replay/baghjan');
  }

  // ─── Graph ───
  async getGraphSignals(): Promise<GraphData> {
    return this.fetch('/api/graph/signals');
  }

  async getGraphClusters() {
    return this.fetch('/api/graph/clusters');
  }

  // ─── System ───
  async getAirGapStatus(): Promise<AirGapStatus> {
    return this.fetch('/api/system/airgap');
  }

  async getHealth() {
    return this.fetch('/');
  }
}

export const api = new ApiClient(API_BASE);
export default api;
