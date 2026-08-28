'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Network, 
  Activity, 
  RefreshCw, 
  Filter, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Flame,
  Info
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

const TYPE_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  EQUIPMENT: { color: '#2563EB', label: 'Equipment & Components', icon: '⚙️' },
  LOCATION: { color: '#7C3AED', label: 'Well Pads & Facilities', icon: '📍' },
  'LSR RULE': { color: '#DC2626', label: 'IOGP Life-Saving Rules', icon: '🛡️' },
  LSR_VIOLATION: { color: '#DC2626', label: 'Life-Saving Rules', icon: '🚨' },
  BARRIER_FAILURE: { color: '#E11D48', label: 'Barrier Failures', icon: '🛑' },
  ENERGY_SOURCE: { color: '#D97706', label: 'Energy Sources', icon: '⚡' },
  ACTIVITY: { color: '#0284C7', label: 'Activities', icon: '🏗️' },
};

export default function StaticInteractiveGraphPage() {
  const [rawNodes, setRawNodes] = useState<any[]>([]);
  const [rawEdges, setRawEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<NodeData[]>([]);
  const edgesRef = useRef<EdgeData[]>([]);
  const draggingNodeRef = useRef<NodeData | null>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const pulseParticlesRef = useRef<{ edgeIdx: number; progress: number; speed: number }[]>([]);

  // Fetch initial graph data
  const loadGraph = () => {
    setLoading(true);
    fetch(`${API}/api/graph/signals`)
      .then(r => r.json())
      .then(d => {
        const nList = d.nodes || [];
        const eList = d.edges || [];
        setRawNodes(nList);
        setRawEdges(eList);
        initializeDeterministicLayout(nList, eList);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadGraph();
  }, []);

  // Multi-Ring Deterministic Clustered Layout (100% Rock-Solid Stable)
  const initializeDeterministicLayout = (nList: any[], eList: any[]) => {
    const canvas = canvasRef.current;
    const w = canvas ? canvas.offsetWidth : 850;
    const h = canvas ? canvas.offsetHeight : 560;
    const cx = w / 2;
    const cy = h / 2;

    // Group nodes by category
    const categorized: Record<string, any[]> = {
      'LSR RULE': [],
      EQUIPMENT: [],
      LOCATION: [],
      ACTIVITY: [],
      OTHER: [],
    };

    nList.forEach((n) => {
      const typeKey = (n.data?.type || 'EQUIPMENT').toUpperCase();
      if (typeKey.includes('LSR') || typeKey.includes('RULE')) {
        categorized['LSR RULE'].push(n);
      } else if (typeKey.includes('EQUIP') || typeKey.includes('VALVE') || typeKey.includes('PUMP') || typeKey.includes('BOP')) {
        categorized.EQUIPMENT.push(n);
      } else if (typeKey.includes('LOC') || typeKey.includes('PAD') || typeKey.includes('STATION')) {
        categorized.LOCATION.push(n);
      } else if (typeKey.includes('ACT')) {
        categorized.ACTIVITY.push(n);
      } else {
        categorized.OTHER.push(n);
      }
    });

    const initialized: NodeData[] = [];

    // Ring 1: High SIF Rules (Inner Core) - Radius 110px
    const innerRing = categorized['LSR RULE'];
    innerRing.forEach((n, i) => {
      const angle = (i / Math.max(innerRing.length, 1)) * 2 * Math.PI - Math.PI / 2;
      const r = 110;
      const cfg = TYPE_CONFIG['LSR RULE'];
      const rCount = n.data?.report_count || 1;
      initialized.push({
        id: n.data.id,
        label: n.data.label || n.data.id,
        type: 'LSR RULE',
        report_count: rCount,
        severity: 'HIGH',
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        radius: 14 + Math.min(rCount * 2, 8),
        color: cfg.color,
      });
    });

    // Ring 2: Equipment (Middle Ring) - Radius 200px
    const midRing = categorized.EQUIPMENT;
    midRing.forEach((n, i) => {
      const angle = (i / Math.max(midRing.length, 1)) * 2 * Math.PI;
      const r = 195;
      const cfg = TYPE_CONFIG.EQUIPMENT;
      const rCount = n.data?.report_count || 1;
      initialized.push({
        id: n.data.id,
        label: n.data.label || n.data.id,
        type: 'EQUIPMENT',
        report_count: rCount,
        severity: rCount >= 3 ? 'HIGH' : 'STANDARD',
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        radius: 12 + Math.min(rCount * 2, 6),
        color: cfg.color,
      });
    });

    // Ring 3: Locations & Activities (Outer Ring) - Radius 280px
    const outerRing = [...categorized.LOCATION, ...categorized.ACTIVITY, ...categorized.OTHER];
    outerRing.forEach((n, i) => {
      const angle = (i / Math.max(outerRing.length, 1)) * 2 * Math.PI + 0.3;
      const r = 275;
      const typeKey = (n.data?.type || 'LOCATION').toUpperCase();
      const cfg = TYPE_CONFIG[typeKey] || { color: '#7C3AED' };
      const rCount = n.data?.report_count || 1;
      initialized.push({
        id: n.data.id,
        label: n.data.label || n.data.id,
        type: typeKey,
        report_count: rCount,
        severity: rCount >= 4 ? 'HIGH' : 'STANDARD',
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        radius: 11 + Math.min(rCount * 2, 6),
        color: cfg.color,
      });
    });

    const parsedEdges: EdgeData[] = eList.map((e, i) => ({
      id: e.data?.id || `e-${i}`,
      source: e.data?.source,
      target: e.data?.target,
      weight: e.data?.weight || 1,
      edge_type: e.data?.edge_type || 'CONNECTED_TO',
    }));

    nodesRef.current = initialized;
    edgesRef.current = parsedEdges;

    // Create 30 animated pulse particles along the fixed edges
    const particles = [];
    for (let i = 0; i < Math.min(parsedEdges.length * 2, 35); i++) {
      particles.push({
        edgeIdx: Math.floor(Math.random() * parsedEdges.length),
        progress: Math.random(),
        speed: 0.004 + Math.random() * 0.004,
      });
    }
    pulseParticlesRef.current = particles;
  };

  // 60 FPS Render Loop (Draws fixed stable nodes + gliding data particles)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (canvas.width !== w * 2 || canvas.height !== h * 2) {
        canvas.width = w * 2;
        canvas.height = h * 2;
      }

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(2, 2);

      // Pan & Zoom
      ctx.translate(w / 2 + panOffset.x, h / 2 + panOffset.y);
      ctx.scale(zoomLevel, zoomLevel);
      ctx.translate(-w / 2, -h / 2);

      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      // Determine active highlight neighbors
      const activeNode = hoveredNode || selectedNode;
      const neighborIds = new Set<string>();
      if (activeNode) {
        neighborIds.add(activeNode.id);
        edges.forEach(e => {
          if (e.source === activeNode.id) neighborIds.add(e.target);
          if (e.target === activeNode.id) neighborIds.add(e.source);
        });
      }

      // 1. Draw subtle background coordinate grid
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.4)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let gx = -w; gx < w * 2; gx += gridSize) {
        ctx.beginPath();
        ctx.moveTo(gx, -h);
        ctx.lineTo(gx, h * 2);
        ctx.stroke();
      }
      for (let gy = -h; gy < h * 2; gy += gridSize) {
        ctx.beginPath();
        ctx.moveTo(-w, gy);
        ctx.lineTo(w * 2, gy);
        ctx.stroke();
      }

      // 2. Draw Connecting Edges
      edges.forEach(e => {
        const a = nodes.find(n => n.id === e.source);
        const b = nodes.find(n => n.id === e.target);
        if (!a || !b) return;

        const isHighlighted = activeNode && (a.id === activeNode.id || b.id === activeNode.id);
        const isDimmed = activeNode && !isHighlighted;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);

        if (isHighlighted) {
          ctx.strokeStyle = 'rgba(37, 99, 235, 0.85)';
          ctx.lineWidth = 2.5;
        } else if (isDimmed) {
          ctx.strokeStyle = 'rgba(203, 213, 225, 0.18)';
          ctx.lineWidth = 1;
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
          ctx.lineWidth = 1.2;
        }
        ctx.stroke();
      });

      // 3. Draw Gliding Data Particles along Edges
      pulseParticlesRef.current.forEach(p => {
        p.progress += p.speed;
        if (p.progress >= 1) p.progress = 0;

        const edge = edges[p.edgeIdx];
        if (!edge) return;
        const a = nodes.find(n => n.id === edge.source);
        const b = nodes.find(n => n.id === edge.target);
        if (!a || !b) return;

        const px = a.x + (b.x - a.x) * p.progress;
        const py = a.y + (b.y - a.y) * p.progress;

        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#38BDF8';
        ctx.shadowColor = '#0284C7';
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 4. Draw Nodes (Rock-Solid Fixed Positions)
      nodes.forEach(n => {
        const isSelected = selectedNode?.id === n.id;
        const isHovered = hoveredNode?.id === n.id;
        const isNeighbor = neighborIds.has(n.id);
        const isDimmed = activeNode && !isNeighbor;

        // Category filter
        const matchesFilter = filterType === 'ALL' || n.type === filterType;
        if (!matchesFilter) return;

        // Glow Aura
        if (n.severity === 'HIGH' || isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + (isSelected ? 8 : 5), 0, Math.PI * 2);
          ctx.fillStyle = isSelected 
            ? 'rgba(37, 99, 235, 0.22)' 
            : n.severity === 'HIGH' 
            ? 'rgba(220, 38, 38, 0.2)' 
            : 'rgba(59, 130, 246, 0.12)';
          ctx.fill();
        }

        // Main Node Circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDimmed ? '#94A3B8' : n.color;
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#0F172A' : '#FFFFFF';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

        // Core White Dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Label
        if (!isDimmed || isHovered) {
          ctx.font = isSelected ? 'bold 11px Plus Jakarta Sans, sans-serif' : '600 10px Plus Jakarta Sans, sans-serif';
          ctx.textAlign = 'center';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.lineWidth = 3;
          ctx.strokeText(n.label, n.x, n.y + n.radius + 12);
          ctx.fillStyle = isSelected ? '#0F172A' : '#1E293B';
          ctx.fillText(n.label, n.x, n.y + n.radius + 12);
        }
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [filterType, hoveredNode, selectedNode, zoomLevel, panOffset]);

  // Mouse Coordinates Translation
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    const normX = (rawX - (w / 2 + panOffset.x)) / zoomLevel + w / 2;
    const normY = (rawY - (h / 2 + panOffset.y)) / zoomLevel + h / 2;

    return { x: normX, y: normY, rawX, rawY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y, rawX, rawY } = getCanvasCoords(e);
    const nodes = nodesRef.current;

    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dist = Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2);
      if (dist <= n.radius + 6) {
        draggingNodeRef.current = n;
        setSelectedNode(n);
        return;
      }
    }

    isPanningRef.current = true;
    panStartRef.current = { x: rawX - panOffset.x, y: rawY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y, rawX, rawY } = getCanvasCoords(e);

    if (draggingNodeRef.current) {
      draggingNodeRef.current.x = x;
      draggingNodeRef.current.y = y;
      return;
    }

    if (isPanningRef.current) {
      setPanOffset({
        x: rawX - panStartRef.current.x,
        y: rawY - panStartRef.current.y,
      });
      return;
    }

    const nodes = nodesRef.current;
    let found: NodeData | null = null;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dist = Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2);
      if (dist <= n.radius + 6) {
        found = n;
        break;
      }
    }
    setHoveredNode(found);
  };

  const handleMouseUp = () => {
    draggingNodeRef.current = null;
    isPanningRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoomLevel(prev => Math.min(Math.max(prev * zoomFactor, 0.5), 2.5));
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    initializeDeterministicLayout(rawNodes, rawEdges);
  };

  const connectedNeighbors = useMemo(() => {
    if (!selectedNode) return [];
    const nIds = new Set<string>();
    edgesRef.current.forEach(e => {
      if (e.source === selectedNode.id) nIds.add(e.target);
      if (e.target === selectedNode.id) nIds.add(e.source);
    });
    return nodesRef.current.filter(n => nIds.has(n.id));
  }, [selectedNode]);

  const topHub = useMemo(() => {
    if (nodesRef.current.length === 0) return null;
    return [...nodesRef.current].sort((a, b) => b.report_count - a.report_count)[0];
  }, [rawNodes]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-[#F1F5F9]/70 min-h-screen">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md">
            <Network className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
                Safety Signal Knowledge Graph
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                DETERMINISTIC CLUSTER TOPOLOGY
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Uncovers cross-asset systemic risk clusters between equipment, well pads, activities, and Life-Saving Rules
            </p>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomLevel(z => Math.min(z + 0.2, 2.5))}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(z => Math.max(z - 0.2, 0.5))}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
            title="Reset Canvas Position"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Layout
          </button>
        </div>
      </div>

      {/* ── Category Filters & Hub Spotlight ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-2xl border border-slate-300 shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 px-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {['ALL', 'LSR RULE', 'EQUIPMENT', 'LOCATION', 'ACTIVITY'].map(ft => (
            <button
              key={ft}
              onClick={() => setFilterType(ft)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filterType === ft
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {ft === 'ALL' ? '🌟 All Nodes' : ft.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {topHub && (
          <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-2xl flex items-center gap-2.5 text-xs shadow-xs">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span className="text-red-900 font-bold">
              Critical Hub Spotlight: <span className="font-mono underline">{topHub.label}</span> ({topHub.report_count} Incidents)
            </span>
          </div>
        )}
      </div>

      {/* ── Main Graph & Inspector Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT CANVAS (8 Cols): Rock-Solid Stable Interactive Canvas */}
        <div className="lg:col-span-8 bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden relative">
          
          <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shadow-sm select-none">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-white">
                Deterministic Risk Topology Canvas
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-slate-300">
              <span>{rawNodes.length} Nodes</span>
              <span>•</span>
              <span>{rawEdges.length} Causal Edges</span>
              <span>•</span>
              <span className="text-emerald-300">100% Stable (Click to Inspect / Drag)</span>
            </div>
          </div>

          <div className="relative bg-slate-50/60" style={{ height: 560 }}>
            {loading ? (
              <div className="flex items-center justify-center h-full text-slate-400 font-mono text-xs animate-pulse">
                Mapping Deterministic Cross-Asset Knowledge Graph...
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                className="w-full h-full cursor-grab active:cursor-grabbing"
              />
            )}

            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 text-[10px] font-mono text-slate-600 shadow-sm pointer-events-none">
              💡 <strong>Left-Click</strong>: Select Node | <strong>Drag</strong>: Move Node / Pan | <strong>Wheel</strong>: Zoom
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (4 Cols): Deep Node Telemetry */}
        <div className="lg:col-span-4 bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden">
          
          <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shadow-sm">
            <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-white">
              Signal Node Telemetry
            </h3>
            <span className="text-[10px] font-mono text-slate-400">CYTOSCAPE</span>
          </div>

          <div className="p-5 space-y-4 bg-slate-50/50">
            {selectedNode ? (
              <div className="space-y-4 animate-fadeIn">
                
                <div className="p-4 rounded-xl bg-white border-2 border-slate-300 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase text-white shadow-xs" style={{ backgroundColor: selectedNode.color }}>
                      {selectedNode.type}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      ID: {selectedNode.id}
                    </span>
                  </div>

                  <h4 className="font-heading font-black text-xl text-slate-900 mt-1">
                    {selectedNode.label}
                  </h4>

                  <div className="flex items-center gap-2 pt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                      selectedNode.severity === 'HIGH' ? 'bg-red-100 text-red-900 border border-red-300' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {selectedNode.severity === 'HIGH' ? '🚨 HIGH SIF CONCENTRATION' : 'STANDARD RISK NODE'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Incident Count</div>
                    <div className="font-mono text-lg font-black text-slate-900 mt-0.5">
                      {selectedNode.report_count} Reports
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Connected Links</div>
                    <div className="font-mono text-lg font-black text-blue-600 mt-0.5">
                      {connectedNeighbors.length} Edges
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="text-[10px] font-mono uppercase font-bold text-slate-500">
                    Directly Linked Safety Entities:
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {connectedNeighbors.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">No direct connections</div>
                    ) : (
                      connectedNeighbors.map(nb => (
                        <button
                          key={nb.id}
                          onClick={() => setSelectedNode(nb)}
                          className="w-full p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left transition-all flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: nb.color }} />
                            <span className="font-bold text-slate-800 truncate">{nb.label}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </button>
                      ))
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-3 bg-white rounded-xl border border-slate-300 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
                  <Network className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Select Any Node on Canvas</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Click and drag any bubble to explore causal equipment pathways and cross-site failure cascades.
                  </p>
                </div>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs space-y-1.5 shadow-xs">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Network Architecture</div>
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-slate-300">Layout Engine</span>
                <span className="text-emerald-400 font-bold">Concentric Ring Clusters</span>
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-slate-300">Frame Stability</span>
                <span className="text-blue-300 font-bold">100% Rock-Solid (0 Jitter)</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
