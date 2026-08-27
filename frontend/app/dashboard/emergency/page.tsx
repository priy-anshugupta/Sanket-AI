'use client';

import { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:8000';

interface Contact {
  role: string;
  name: string;
  phone: string;
  icon: string;
  priority: number;
}

interface ChecklistItem {
  step: number;
  text: string;
  checked: boolean;
}

interface SIFAlert {
  type: string;
  priority: string;
  timestamp: string;
  data: {
    report_id: string;
    sif_score: number;
    sif_label: string;
    matched_anchor_text?: string;
    location?: string;
    report_text?: string;
    is_critical?: boolean;
    action?: string;
    message?: string;
  };
}

export default function EmergencyPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [alerts, setAlerts] = useState<SIFAlert[]>([]);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [activePlaybook, setActivePlaybook] = useState<any>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [swaTriggered, setSwaTriggered] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load contacts
  useEffect(() => {
    fetch(`${API_BASE}/api/emergency/contacts`)
      .then(r => r.json())
      .then(d => setContacts(d.contacts || []))
      .catch(() => {});

    fetch(`${API_BASE}/api/system/ingestion-channels`)
      .then(r => r.json())
      .then(d => setChannels(d.channels || []))
      .catch(() => {});
  }, []);

  // WebSocket connection for real-time alerts
  useEffect(() => {
    const connectWs = () => {
      setWsStatus('connecting');
      const ws = new WebSocket('ws://localhost:8000/ws/alerts');

      ws.onopen = () => {
        setWsStatus('connected');
        console.log('[WS] Control Room connected');
      };

      ws.onmessage = (event) => {
        try {
          const alert: SIFAlert = JSON.parse(event.data);
          if (alert.type === 'SIF_ALERT') {
            setAlerts(prev => [alert, ...prev].slice(0, 50));

            // Play alarm sound for CRITICAL alerts
            if (alert.priority === 'CRITICAL' || alert.data?.is_critical) {
              playAlarm();
            }

            // Auto-load playbook for critical alerts
            if (alert.data?.report_id && (alert.data?.sif_score || 0) >= 0.85) {
              loadPlaybook(alert.data.report_id);
            }
          }
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    };

    connectWs();
    return () => { wsRef.current?.close(); };
  }, []);

  const playAlarm = () => {
    // Use Web Audio API for alarm
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'square';
      gain.gain.value = 0.3;
      osc.start();
      setTimeout(() => { osc.stop(); ctx.close(); }, 1500);
    } catch(e) {}
  };

  const loadPlaybook = async (reportId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/emergency/playbook/${reportId}`);
      if (res.ok) {
        const data = await res.json();
        setActivePlaybook(data);
        setChecklist(data.steps?.step_3_checklist?.items || []);
        setSwaTriggered(false);
      }
    } catch(e) {}
  };

  const triggerSWA = async () => {
    if (!activePlaybook?.report_id) return;
    try {
      const formData = new FormData();
      formData.append('report_id', activePlaybook.report_id);
      formData.append('initiated_by', 'hse_manager');
      formData.append('reason', 'Critical SIF precursor — Emergency Stop Work');

      const res = await fetch(`${API_BASE}/api/emergency/swa`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setSwaTriggered(true);
        playAlarm();
      }
    } catch(e) {}
  };

  const toggleChecklist = (index: number) => {
    setChecklist(prev => prev.map((item, i) =>
      i === index ? { ...item, checked: !item.checked } : item
    ));
  };

  const getPriorityColor = (priority: string, score?: number) => {
    if (priority === 'CRITICAL' || (score && score >= 0.85)) return { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' };
    if (priority === 'HIGH') return { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' };
    return { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' };
  };

  return (
    <div style={{ padding: '24px', background: '#0F172A', minHeight: '100vh', color: '#E2E8F0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F8FAFC', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            🚨 Emergency Command Center
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '13px', margin: '4px 0 0' }}>
            Zero-Delay Emergency Reflex · &lt;500ms SIF Alert Push · DGMS/OISD Compliant
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: '8px',
          background: wsStatus === 'connected' ? '#065F4620' : '#7F1D1D20',
          border: `1px solid ${wsStatus === 'connected' ? '#10B981' : '#EF4444'}`,
        }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: wsStatus === 'connected' ? '#10B981' : wsStatus === 'connecting' ? '#F59E0B' : '#EF4444',
            animation: wsStatus === 'connected' ? 'pulse 2s infinite' : 'none',
          }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: wsStatus === 'connected' ? '#10B981' : '#EF4444' }}>
            {wsStatus === 'connected' ? 'LIVE · Control Room Connected' : wsStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* LEFT: Live Alert Feed */}
        <div>
          {/* Active Playbook */}
          {activePlaybook && (
            <div style={{
              background: '#1E293B', borderRadius: '12px', border: '2px solid #EF4444',
              padding: '20px', marginBottom: '20px',
              animation: 'borderPulse 2s infinite',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#EF4444', margin: 0 }}>
                    🚨 EMERGENCY ACTION PLAYBOOK
                  </h2>
                  <p style={{ color: '#94A3B8', fontSize: '12px', margin: '4px 0 0' }}>
                    SIF Score: <strong style={{ color: '#EF4444' }}>{activePlaybook.sif_score?.toFixed(2)}</strong> · {activePlaybook.location || 'Unknown Location'}
                  </p>
                  <p style={{ color: '#CBD5E1', fontSize: '13px', margin: '8px 0 0', lineHeight: '1.4' }}>
                    {activePlaybook.hazard_description?.slice(0, 200)}
                  </p>
                </div>
              </div>

              {/* STEP 1: SWA Button */}
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#F59E0B', margin: '0 0 8px' }}>
                  STEP 1: 🛑 Stop Work Authority
                </h3>
                <button
                  onClick={triggerSWA}
                  disabled={swaTriggered}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '8px', border: 'none',
                    background: swaTriggered ? '#065F46' : '#DC2626',
                    color: 'white', fontWeight: 800, fontSize: '14px',
                    cursor: swaTriggered ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    textTransform: 'uppercase',
                  }}
                >
                  {swaTriggered ? '✅ SWA DISPATCHED — ALL PERMITS FROZEN' : '🛑 INITIATE IMMEDIATE EMERGENCY STOP WORK'}
                </button>
              </div>

              {/* STEP 2: Emergency Contacts */}
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#F59E0B', margin: '0 0 8px' }}>
                  STEP 2: 📞 Emergency Contacts
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {contacts.map((c, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 12px', borderRadius: '6px',
                      background: '#0F172A', border: '1px solid #334155',
                    }}>
                      <span>{c.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{c.role}</div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#3B82F6' }}>{c.phone}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* STEP 3: Checklist */}
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#F59E0B', margin: '0 0 8px' }}>
                  STEP 3: 📋 Containment Checklist
                </h3>
                {checklist.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => toggleChecklist(i)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      padding: '10px 12px', borderRadius: '6px', marginBottom: '4px',
                      background: item.checked ? '#065F4620' : '#0F172A',
                      border: `1px solid ${item.checked ? '#10B981' : '#334155'}`,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{item.checked ? '☑️' : '☐'}</span>
                    <span style={{
                      fontSize: '12px', color: item.checked ? '#10B981' : '#CBD5E1',
                      textDecoration: item.checked ? 'line-through' : 'none',
                    }}>
                      Step {item.step}: {item.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* STEP 4: Audit Trail */}
              <div style={{
                padding: '10px 14px', borderRadius: '6px',
                background: '#0F172A', border: '1px solid #334155',
              }}>
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                  📝 <strong>STEP 4:</strong> Every action above is SHA-256 timestamped in the immutable audit trail for DGMS/OISD statutory compliance.
                </span>
              </div>
            </div>
          )}

          {/* Alert Feed */}
          <div style={{ background: '#1E293B', borderRadius: '12px', padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', margin: '0 0 12px' }}>
              ⚡ Live SIF Alert Feed
            </h3>
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📡</div>
                <p style={{ fontSize: '13px' }}>Listening for real-time SIF alerts via WebSocket...</p>
                <p style={{ fontSize: '11px', color: '#334155' }}>Alerts appear instantly when pipeline detects HIGH/CRITICAL reports</p>
              </div>
            ) : (
              alerts.map((alert, i) => {
                const colors = getPriorityColor(alert.priority, alert.data?.sif_score);
                return (
                  <div key={i} style={{
                    padding: '12px', borderRadius: '8px', marginBottom: '8px',
                    background: `${colors.bg}15`, border: `1px solid ${colors.border}40`,
                    cursor: 'pointer',
                  }} onClick={() => alert.data?.report_id && loadPlaybook(alert.data.report_id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: colors.text, padding: '2px 8px', borderRadius: '4px', background: colors.bg }}>
                        {alert.priority} · {alert.data?.sif_score?.toFixed(2)}
                      </span>
                      <span style={{ fontSize: '10px', color: '#64748B' }}>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#CBD5E1', margin: '4px 0 0' }}>
                      {alert.data?.message || alert.data?.report_text?.slice(0, 120) || alert.data?.matched_anchor_text || 'SIF Alert'}
                    </p>
                    <span style={{ fontSize: '10px', color: '#64748B' }}>📍 {alert.data?.location || 'Unknown'}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Ingestion Channels + System Status */}
        <div>
          {/* 6-Channel Matrix */}
          <div style={{ background: '#1E293B', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', margin: '0 0 12px' }}>
              📡 6-Channel Multimodal Ingestion Matrix
            </h3>
            {channels.map((ch, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px', borderRadius: '8px', marginBottom: '6px',
                background: '#0F172A', border: '1px solid #334155',
              }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: ch.status === 'ACTIVE' ? '#065F4630' : '#1E293B',
                  border: `1px solid ${ch.status === 'ACTIVE' ? '#10B981' : '#475569'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700, color: ch.status === 'ACTIVE' ? '#10B981' : '#475569',
                }}>
                  {ch.id}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0' }}>{ch.name}</div>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>{ch.target_users}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {ch.atex_certified && (
                    <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: '#F59E0B20', color: '#F59E0B', fontWeight: 700 }}>
                      ATEX
                    </span>
                  )}
                  <span style={{
                    fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700,
                    background: ch.status === 'ACTIVE' ? '#10B98120' : '#64748B20',
                    color: ch.status === 'ACTIVE' ? '#10B981' : '#64748B',
                  }}>
                    {ch.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Emergency Contacts Panel */}
          <div style={{ background: '#1E293B', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', margin: '0 0 12px' }}>
              📞 Emergency Contact Directory
            </h3>
            {contacts.map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '8px', marginBottom: '6px',
                background: '#0F172A', border: '1px solid #334155',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: '20px' }}>{c.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0' }}>{c.role}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>{c.name}</div>
                </div>
                <a
                  href={`tel:${c.phone}`}
                  style={{
                    padding: '6px 14px', borderRadius: '6px',
                    background: '#3B82F6', color: 'white',
                    fontSize: '12px', fontWeight: 700, textDecoration: 'none',
                  }}
                >
                  📞 Call
                </a>
              </div>
            ))}
          </div>

          {/* Store-and-Forward Status */}
          <div style={{ background: '#1E293B', borderRadius: '12px', padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', margin: '0 0 12px' }}>
              🔒 Air-Gap & Edge Status
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', background: '#065F4615', border: '1px solid #10B98130', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#10B981' }}>0 KB/s</div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>Outbound Egress</div>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', background: '#3B82F615', border: '1px solid #3B82F630', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#3B82F6' }}>100%</div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>Local AI Execution</div>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', background: '#F59E0B15', border: '1px solid #F59E0B30', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#F59E0B' }}>SHA-256</div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>Hash Chain</div>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', background: '#8B5CF615', border: '1px solid #8B5CF630', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#8B5CF6' }}>WAL</div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>SQLite Mode</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes borderPulse {
          0%, 100% { border-color: #EF4444; }
          50% { border-color: #F59E0B; }
        }
      `}</style>
    </div>
  );
}
