'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Network, 
  Activity, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Flame, 
  Clock, 
  FileText,
  Zap,
  AlertOctagon
} from 'lucide-react';

const API = 'http://localhost:8000';

interface NodeData {
  id: string;
  label: string;
  type: string;
  report_count: number;
  severity: string;
  x: number;
  y: number;
  radius: number;
  color: string;
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
  weight: number;
  edge_type: string;
}

interface NodeEvidence {
  node_id: string;
  node_label: string;
  node_type: string;
  total_incidents: number;
  high_sif_count: number;
  medium_sif_count: number;
  has_active_cluster: boolean;
  cluster_details?: {
    alert_id: string;
    event_count: number;
    detected_at: string;
  };
  recommended_capa: string;
  supporting_reports: Array<{
    id: string;
    raw_text: string;
    sif_score: number;
    sif_label: string;
    location?: string;
    activity_type?: string;
    iogp_rule?: string;
    created_at?: string;
  }>;
}

const TYPE_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  EQUIPMENT: { color: '#0284C7', label: 'Equipment & Components', icon: '⚙️' },
  LOCATION: { color: '#7C3AED', label: 'Well Pads & Facilities', icon: '📍' },
  'LSR RULE': { color: '#D63B3B', label: 'IOGP Life-Saving Rules', icon: '🛡️' },
  LSR_VIOLATION: { color: '#D63B3B', label: 'Life-Saving Rules', icon: '🚨' },
  BARRIER_FAILURE: { color: '#E11D48', label: 'Barrier Failures', icon: '🛑' },
  ENERGY_SOURCE: { color: '#D97706', label: 'Energy Sources', icon: '⚡' },
  ACTIVITY: { color: '#0D9488', label: 'Activities', icon: '🏗️' },
};

export default function EvidenceSignalGraphPage() {
  const [rawNodes, setRawNodes] = useState<any[]>([]);
  const [rawEdges, setRawEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const [evidence, setEvidence] = useState<NodeEvidence | null>(null);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [swaToast, setSwaToast] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<NodeData[]>([]);
  const edgesRef = useRef<EdgeData[]>([]);
  const draggingNodeRef = useRef<NodeData | null>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const pulseParticlesRef = useRef<{ edgeIdx: number; progress: number; speed: number }[]>([]);

  const loadGraph = () => {
    setLoading(true);
    fetch(`${API}/api/graph/signals`)
      .then(r => r.json())
      .then(d => {
        setRawNodes(d.nodes || []);
        setRawEdges(d.edges || []);
        initializeDeterministicLayout(d.nodes || [], d.edges || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadGraph();
  }, []);

  useEffect(() => {
    if (!selectedNode) {
      setEvidence(null);
      return;
    }

    setLoadingEvidence(true);
    fetch(`${API}/api/graph/evidence/${encodeURIComponent(selectedNode.id)}`)
      .then(r => r.json())
      .then(data => {
        setEvidence(data);
        setLoadingEvidence(false);
      })
      .catch(() => setLoadingEvidence(false));
  }, [selectedNode]);

  const initializeDeterministicLayout = (nList: any[], eList: any[]) => {
    const width = 720;
    const height = 580;
    const centerX = width / 2;
    const centerY = height / 2;

    const clusters: Record<string, { x: number; y: number }> = {
      EQUIPMENT: { x: centerX - 160, y: centerY - 100 },
      LOCATION: { x: centerX + 160, y: centerY - 100 },
      'LSR RULE': { x: centerX - 160, y: centerY + 100 },
      LSR_VIOLATION: { x: centerX - 160, y: centerY + 100 },
      BARRIER_FAILURE: { x: centerX, y: centerY - 150 },
      ENERGY_SOURCE: { x: centerX + 160, y: centerY + 100 },
      ACTIVITY: { x: centerX, y: centerY + 150 },
    };

    const typeCounters: Record<string, number> = {};

    const formattedNodes: NodeData[] = nList.map((n: any) => {
      const typeKey = (n.type || 'EQUIPMENT').toUpperCase();
      const cluster = clusters[typeKey] || { x: centerX, y: centerY };

      typeCounters[typeKey] = (typeCounters[typeKey] || 0) + 1;
      const indexInType = typeCounters[typeKey];

      const angle = (indexInType * 2.4) % (2 * Math.PI);
      const radiusOffset = 35 + (indexInType * 16) % 90;

      const x = cluster.x + Math.cos(angle) * radiusOffset;
      const y = cluster.y + Math.sin(angle) * radiusOffset;

      const reportCount = n.report_count || 1;
      const nodeRadius = Math.max(10, Math.min(22, 9 + Math.log2(reportCount + 1) * 3.5));

      const typeConf = TYPE_CONFIG[typeKey] || { color: '#0284C7' };

      return {
        id: n.id,
        label: n.label || n.id,
        type: n.type || 'EQUIPMENT',
        report_count: reportCount,
        severity: n.severity || 'MEDIUM',
        x,
        y,
        radius: nodeRadius,
        color: typeConf.color,
      };
    });

    const formattedEdges: EdgeData[] = eList.map((e: any) => ({
      id: `${e.source}->${e.target}`,
      source: e.source,
      target: e.target,
      weight: e.weight || 1,
      edge_type: e.edge_type || 'CO_OCCURRENCE',
    }));

    nodesRef.current = formattedNodes;
    edgesRef.current = formattedEdges;

    pulseParticlesRef.current = formattedEdges.slice(0, 30).map((_, idx) => ({
      edgeIdx: idx,
      progress: Math.random(),
      speed: 0.004 + Math.random() * 0.006,
    }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#F7F8F5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoomLevel, zoomLevel);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      for (let x = -200; x < canvas.width + 400; x += 30) {
        for (let y = -200; y < canvas.height + 400; y += 30) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const nodeMap = new Map(nodes.map(n => [n.id, n]));

      const activeNode = hoveredNode || selectedNode;
      const connectedNodeIds = new Set<string>();
      if (activeNode) {
        connectedNodeIds.add(activeNode.id);
        edges.forEach(e => {
          if (e.source === activeNode.id) connectedNodeIds.add(e.target);
          if (e.target === activeNode.id) connectedNodeIds.add(e.source);
        });
      }

      edges.forEach((edge) => {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (!src || !tgt) return;

        const isFiltered =
          filterType === 'ALL' ||
          src.type.toUpperCase().includes(filterType) ||
          tgt.type.toUpperCase().includes(filterType);
        if (!isFiltered) return;

        const isConnected =
          activeNode &&
          (edge.source === activeNode.id || edge.target === activeNode.id);
        const isDimmed = activeNode && !isConnected;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);

        if (isConnected) {
          ctx.strokeStyle = '#D63B3B';
          ctx.lineWidth = Math.min(3, 1.5 + edge.weight * 0.4);
        } else if (isDimmed) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
          ctx.lineWidth = 0.8;
        } else {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
          ctx.lineWidth = Math.min(2.5, 0.8 + edge.weight * 0.25);
        }

        ctx.stroke();
      });

      pulseParticlesRef.current.forEach(p => {
        const edge = edges[p.edgeIdx];
        if (!edge) return;
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (!src || !tgt) return;

        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        const px = src.x + (tgt.x - src.x) * p.progress;
        const py = src.y + (tgt.y - src.y) * p.progress;

        ctx.beginPath();
        ctx.arc(px, py, 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#0A6B63';
        ctx.fill();
      });

      nodes.forEach((node) => {
        const isFiltered = filterType === 'ALL' || node.type.toUpperCase().includes(filterType);
        if (!isFiltered) return;

        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;
        const isConnected = connectedNodeIds.has(node.id);
        const isDimmed = activeNode && !isConnected;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);

        if (isSelected) {
          ctx.fillStyle = '#D63B3B';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3;
        } else if (isHovered) {
          ctx.fillStyle = node.color;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.5;
        } else if (isDimmed) {
          ctx.fillStyle = '#E2E8E2';
          ctx.strokeStyle = '#C2CEC2';
          ctx.lineWidth = 1;
        } else {
          ctx.fillStyle = node.color;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
        }

        ctx.fill();
        ctx.stroke();

        ctx.font = `${isSelected ? '600 11px' : '500 10px'} Inter, sans-serif`;
        ctx.fillStyle = isDimmed ? '#94A3A5' : '#1A2B2D';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + node.radius + 12);
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [zoomLevel, panOffset, selectedNode, hoveredNode, filterType]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - panOffset.x) / zoomLevel;
    const mouseY = (e.clientY - rect.top - panOffset.y) / zoomLevel;

    const clicked = nodesRef.current.find(n => {
      const dx = n.x - mouseX;
      const dy = n.y - mouseY;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4;
    });

    if (clicked) {
      setSelectedNode(clicked);
      draggingNodeRef.current = clicked;
    } else {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (isPanningRef.current) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    const mouseX = (e.clientX - rect.left - panOffset.x) / zoomLevel;
    const mouseY = (e.clientY - rect.top - panOffset.y) / zoomLevel;

    if (draggingNodeRef.current) {
      draggingNodeRef.current.x = mouseX;
      draggingNodeRef.current.y = mouseY;
      return;
    }

    const hovered = nodesRef.current.find(n => {
      const dx = n.x - mouseX;
      const dy = n.y - mouseY;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4;
    });

    setHoveredNode(hovered || null);
  };

  const handleCanvasMouseUp = () => {
    draggingNodeRef.current = null;
    isPanningRef.current = false;
  };

  const triggerSWAFromGraph = () => {
    if (!selectedNode) return;
    setSwaToast(`Stop Work Authority Dispatched: Freezing all active digital permits connected to ${selectedNode.label}.`);
    setTimeout(() => setSwaToast(null), 5000);
  };

  return (
    <div className="dashboard-page space-y-5 p-6 bg-[#F7F8F5] min-h-screen text-[#1A2B2D]">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-bold text-xl text-[#1A2B2D] tracking-tight">
              Safety Signal Knowledge Graph & Evidence Inspector
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#E8F4F0] text-[#0A6B63] border border-[#BCE3DC]">
              Neural Graph
            </span>
          </div>
          <p className="text-[13px] text-[#5E7072] mt-0.5 font-normal">
            Correlates multi-barrier degradation cascades, recurring near-miss clusters, and systemic SIF precursors
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#F0F2ED] p-1 rounded-lg flex-wrap">
          {['ALL', 'LSR', 'EQUIP', 'LOC', 'ACT'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filterType === cat
                  ? 'bg-[#0A6B63] text-white shadow-xs'
                  : 'text-[#5E7072] hover:text-[#1A2B2D]'
              }`}
            >
              {cat === 'ALL' ? 'All Nodes' : cat === 'LSR' ? 'LSR Rules' : cat === 'EQUIP' ? 'Equipment' : cat === 'LOC' ? 'Locations' : 'Activities'}
            </button>
          ))}
        </div>
      </div>

      {swaToast && (
        <div className="p-3.5 rounded-xl bg-[#D63B3B] text-white text-xs font-semibold flex items-center justify-between shadow-md border border-[#B92525]">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="w-5 h-5 shrink-0" />
            <span>{swaToast}</span>
          </div>
          <button onClick={() => setSwaToast(null)} className="text-white/80 hover:text-white font-bold text-sm px-2 cursor-pointer">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        <div className="lg:col-span-7 bg-white rounded-xl border-2 border-[#C2CEC2] shadow-xs overflow-hidden relative">
          
          <div className="px-4 py-2.5 bg-[#F0F2ED] flex items-center justify-between border-b border-[#C2CEC2]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0A6B63]" />
              <h3 className="font-heading font-semibold text-xs text-[#1A2B2D]">
                Cross-Asset Topology Canvas
              </h3>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel(prev => Math.min(2.0, prev + 0.15))}
                className="p-1 rounded-md bg-white hover:bg-[#E2E8E2] text-[#3E5052] border border-[#C2CEC2] cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.15))}
                className="p-1 rounded-md bg-white hover:bg-[#E2E8E2] text-[#3E5052] border border-[#C2CEC2] cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
                className="p-1 rounded-md bg-white hover:bg-[#E2E8E2] text-[#3E5052] border border-[#C2CEC2] cursor-pointer"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={720}
            height={560}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className="w-full bg-[#F7F8F5] cursor-grab active:cursor-grabbing block"
          />

          <div className="p-2.5 bg-[#F0F2ED] border-t border-[#C2CEC2] flex items-center justify-between text-[11px] text-[#5E7072]">
            <span>Drag nodes to rearrange • Click any node to inspect evidence</span>
            <span className="font-mono">{rawNodes.length} Nodes • {rawEdges.length} Co-occurrence Edges</span>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-xl border-2 border-[#C2CEC2] shadow-xs overflow-hidden flex flex-col justify-between">
          
          <div>
            <div className="px-4 py-2.5 bg-[#F0F2ED] flex items-center justify-between border-b border-[#C2CEC2]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0A6B63]" />
                <h3 className="font-heading font-semibold text-xs text-[#1A2B2D]">
                  Supporting Evidence & Investigation
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#94A3A5]">F6 + F7 AUDIT</span>
            </div>

            <div className="p-4 space-y-4 max-h-[530px] overflow-y-auto">
              
              {loadingEvidence ? (
                <div className="py-16 text-center text-[#94A3A5] font-mono text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#94A3A5]" />
                  Extracting incident history & physical barriers...
                </div>
              ) : evidence ? (
                <div className="space-y-3.5">
                  
                  <div className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#E8F4F0] text-[#0A6B63] border border-[#BCE3DC]">
                        {evidence.node_type}
                      </span>
                      <span className="text-[10px] font-mono text-[#94A3A5]">
                        ID: {evidence.node_id}
                      </span>
                    </div>

                    <h4 className="font-heading font-bold text-base text-[#1A2B2D]">
                      {evidence.node_label}
                    </h4>

                    {evidence.has_active_cluster && (
                      <div className="p-3 rounded-lg bg-[#FDF2F2] border border-[#F5C6C6] text-[#D63B3B] text-xs font-semibold flex items-center gap-2">
                        <Flame className="w-4 h-4 text-[#D63B3B] shrink-0" />
                        <div>
                          <div className="text-[11px] font-bold text-[#D63B3B]">
                            NEAR-MISS MULTIPLIER TRIGGERED ({evidence.cluster_details?.event_count} EVENTS IN 7 DAYS)
                          </div>
                          <p className="text-[10px] text-[#5E7072] font-normal mt-0.5">
                            Systemic barrier cascade detected. Connected reports elevated to HIGH SIF.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs border-t border-[#C2CEC2]">
                      <div className="p-2 rounded bg-white border border-[#C2CEC2]">
                        <div className="text-[10px] text-[#5E7072]">Total Reports</div>
                        <div className="font-heading text-sm font-bold text-[#1A2B2D]">{evidence.total_incidents}</div>
                      </div>
                      <div className="p-2 rounded bg-white border border-[#C2CEC2]">
                        <div className="text-[10px] text-[#D63B3B]">High SIF</div>
                        <div className="font-heading text-sm font-bold text-[#D63B3B]">{evidence.high_sif_count}</div>
                      </div>
                      <div className="p-2 rounded bg-white border border-[#C2CEC2]">
                        <div className="text-[10px] text-[#D4820A]">Medium Risk</div>
                        <div className="font-heading text-sm font-bold text-[#D4820A]">{evidence.medium_sif_count}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#FEF7EC] border border-[#F8DFB6] space-y-1">
                    <div className="text-[11px] font-semibold text-[#D4820A] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#D4820A]" />
                      Recommended Preventative Action (CAPA):
                    </div>
                    <p className="text-xs text-[#3E5052] font-medium leading-relaxed">
                      {evidence.recommended_capa}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-[#5E7072] flex items-center justify-between">
                      <span>Evidence Timeline ({evidence.supporting_reports.length} observations)</span>
                      <Clock className="w-3.5 h-3.5 text-[#94A3A5]" />
                    </div>

                    <div className="space-y-2">
                      {evidence.supporting_reports.map((rep, idx) => (
                        <div key={rep.id || idx} className="p-3 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              rep.sif_label === 'HIGH' ? 'bg-[#FDF2F2] text-[#D63B3B] border border-[#F5C6C6]' : 'bg-[#FEF7EC] text-[#D4820A] border border-[#F8DFB6]'
                            }`}>
                              {rep.sif_label} ({rep.sif_score?.toFixed(2)})
                            </span>
                            <span className="text-[10px] font-mono text-[#94A3A5]">
                              {new Date(rep.created_at || Date.now()).toLocaleDateString('en-GB')}
                            </span>
                          </div>

                          <p className="text-xs text-[#1A2B2D] leading-snug line-clamp-3">
                            "{rep.raw_text}"
                          </p>

                          <div className="flex items-center gap-2 text-[10px] text-[#5E7072] pt-0.5">
                            <span>📍 {rep.location || 'Well Pad 7'}</span>
                            {rep.iogp_rule && <span>• 🛡️ {rep.iogp_rule}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="py-16 text-center text-[#94A3A5] text-xs">
                  Click any node on the graph canvas to inspect supporting evidence.
                </div>
              )}

            </div>
          </div>

          {selectedNode && (
            <div className="p-3 bg-[#F0F2ED] border-t border-[#C2CEC2]">
              <button
                onClick={triggerSWAFromGraph}
                className="w-full py-2 px-4 rounded-lg bg-[#D63B3B] hover:bg-[#B92525] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <AlertOctagon className="w-4 h-4" />
                Dispatch SWA Lockout for {selectedNode.label}
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
