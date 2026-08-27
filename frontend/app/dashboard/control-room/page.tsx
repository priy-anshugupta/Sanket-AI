'use client';

import { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:8000';

interface LiveReport {
  report_id: string;
  sif_score: number;
  sif_label: string;
  location: string;
  report_text: string;
  matched_anchor_text: string;
  timestamp: string;
  is_critical: boolean;
}

export default function ControlRoomPage() {
  const [alerts, setAlerts] = useState<LiveReport[]>([]);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({ total: 0, high: 0, medium: 0, low: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load initial stats
  useEffect(() => {
    fetch(`${API_BASE}/api/analytics/summary`)
      .then(r => r.json())
      .then(d => {
        setStats({
          total: d.total_reports || 0,
          high: d.high_count || 0,
          medium: d.medium_count || 0,
          low: d.low_count || 0,
        });
      })
      .catch(() => {});
  }, []);

  // WebSocket
  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket('ws://localhost:8000/ws/alerts');
      ws.onopen = () => setWsStatus('connected');
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'SIF_ALERT' && msg.data) {
            const alert: LiveReport = {
              report_id: msg.data.report_id || '',
              sif_score: msg.data.sif_score || 0,
              sif_label: msg.data.sif_label || 'UNKNOWN',
              location: msg.data.location || 'Unknown',
              report_text: msg.data.report_text || msg.data.message || '',
              matched_anchor_text: msg.data.matched_anchor_text || '',
              timestamp: msg.timestamp,
              is_critical: msg.data.is_critical || msg.data.sif_score >= 0.85,
            };
            setAlerts(prev => [alert, ...prev].slice(0, 20));

            // Audio alarm for critical
            if (alert.is_critical) {
              try {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 660;
                osc.type = 'sawtooth';
                gain.gain.value = 0.25;
                osc.start();
                setTimeout(() => { osc.stop(); ctx.close(); }, 2000);
              } catch {}
            }
          }
        } catch {}
      };
      ws.onclose = () => {
        setWsStatus('disconnected');
        setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
      wsRef.current = ws;
    };
    connect();
    return () => wsRef.current?.close();
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.85) return '#EF4444';
    if (score >= 0.75) return '#F59E0B';
    if (score >= 0.50) return '#3B82F6';
    return '#10B981';
  };

  return (
    <div style={{
      padding: '20px', background: '#020617', minHeight: '100vh', color: '#E2E8F0',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #1E293B',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC' }}>
            🎛️ SANKET · AI — CONTROL ROOM
          </div>
          <div style={{
            padding: '4px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
            background: wsStatus === 'connected' ? '#065F4630' : '#7F1D1D30',
            color: wsStatus === 'connected' ? '#10B981' : '#EF4444',
            border: `1px solid ${wsStatus === 'connected' ? '#10B981' : '#EF4444'}`,
          }}>
            {wsStatus === 'connected' ? '● LIVE' : '○ OFFLINE'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#3B82F6', fontVariantNumeric: 'tabular-nums' }}>
            {currentTime.toLocaleTimeString('en-IN', { hour12: false })}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B' }}>
            {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <button onClick={toggleFullscreen} style={{
            padding: '6px 12px', borderRadius: '4px', background: '#1E293B',
            border: '1px solid #334155', color: '#94A3B8', cursor: 'pointer', fontSize: '11px',
          }}>
            {isFullscreen ? '⊡ Exit' : '⊞ Fullscreen'}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'TOTAL REPORTS', value: stats.total, color: '#3B82F6' },
          { label: 'HIGH / CRITICAL', value: stats.high, color: '#EF4444' },
          { label: 'MEDIUM', value: stats.medium, color: '#F59E0B' },
          { label: 'LOW', value: stats.low, color: '#10B981' },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '16px', borderRadius: '8px', background: '#0F172A',
            border: `1px solid ${s.color}30`, textAlign: 'center',
          }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, letterSpacing: '1px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* Left: Live Alert Feed with DCS Override display */}
        <div style={{
          background: '#0F172A', borderRadius: '10px', padding: '16px',
          border: alerts.length > 0 && alerts[0]?.is_critical ? '2px solid #EF4444' : '1px solid #1E293B',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
              ⚡ LIVE SIF PRECURSOR FEED
            </h3>
            <span style={{ fontSize: '10px', color: '#64748B' }}>{alerts.length} alerts in session</span>
          </div>

          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#334155' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎛️</div>
              <p style={{ fontSize: '14px', color: '#475569' }}>Control Room Active — Monitoring All Channels</p>
              <p style={{ fontSize: '11px' }}>Real-time SIF alerts will appear here instantly via WebSocket</p>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {['RoIP Ch.9', 'Kiosks', 'IS Handhelds', 'IVR', 'OCR', 'Touchscreen'].map((ch, i) => (
                  <span key={i} style={{
                    fontSize: '9px', padding: '3px 8px', borderRadius: '4px',
                    background: '#1E293B', border: '1px solid #334155', color: '#64748B',
                  }}>{ch}</span>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
              {alerts.map((alert, i) => (
                <div key={i} style={{
                  padding: '14px', borderRadius: '8px', marginBottom: '8px',
                  background: alert.is_critical ? '#7F1D1D15' : '#1E293B',
                  border: `1px solid ${alert.is_critical ? '#EF444450' : '#334155'}`,
                  borderLeft: `4px solid ${getScoreColor(alert.sif_score)}`,
                  animation: i === 0 ? 'fadeIn 0.3s ease-in' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '20px', fontWeight: 900, color: getScoreColor(alert.sif_score),
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {alert.sif_score.toFixed(2)}
                      </span>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                        background: alert.is_critical ? '#EF444425' : '#F59E0B25',
                        color: alert.is_critical ? '#EF4444' : '#F59E0B',
                      }}>
                        {alert.is_critical ? '⚠ CRITICAL' : alert.sif_label}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#64748B', fontVariantNumeric: 'tabular-nums' }}>
                      {new Date(alert.timestamp).toLocaleTimeString('en-IN', { hour12: false })}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#CBD5E1', margin: '0 0 4px', lineHeight: '1.5' }}>
                    {alert.report_text.slice(0, 180)}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#64748B' }}>📍 {alert.location}</span>
                    {alert.matched_anchor_text && (
                      <span style={{ fontSize: '10px', color: '#475569' }}>· 🎯 {alert.matched_anchor_text.slice(0, 60)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: System Vitals */}
        <div>
          <div style={{
            background: '#0F172A', borderRadius: '10px', padding: '16px', marginBottom: '12px',
            border: '1px solid #1E293B',
          }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC', margin: '0 0 12px' }}>
              🔒 SOVEREIGN AI STATUS
            </h3>
            <div style={{ display: 'grid', gap: '8px' }}>
              {[
                { label: 'AI Execution', value: '100% LOCAL', color: '#10B981' },
                { label: 'Network Egress', value: '0 KB/s OUT', color: '#10B981' },
                { label: 'Embedding Model', value: 'E5-Small', color: '#3B82F6' },
                { label: 'STT Engine', value: 'Whisper', color: '#3B82F6' },
                { label: 'Database', value: 'SQLite WAL', color: '#8B5CF6' },
                { label: 'Hash Chain', value: 'SHA-256', color: '#F59E0B' },
                { label: 'Alert Latency', value: '<500ms', color: '#10B981' },
                { label: 'Edge Sync', value: 'Store & Forward', color: '#3B82F6' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: '6px', background: '#1E293B',
                }}>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>{item.label}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Badges */}
          <div style={{
            background: '#0F172A', borderRadius: '10px', padding: '16px',
            border: '1px solid #1E293B',
          }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC', margin: '0 0 12px' }}>
              📜 COMPLIANCE
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['OISD-STD-149', 'DGMS', 'IOGP-456', 'ATEX Zone 1', 'IECEx', 'ISO 45001', 'CII Sovereign'].map((badge, i) => (
                <span key={i} style={{
                  padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                  background: '#065F4620', border: '1px solid #10B98130', color: '#10B981',
                }}>
                  ✓ {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
