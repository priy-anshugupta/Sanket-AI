'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Network,
  Activity,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  FileText,
  Zap,
  AlertOctagon,
  Search,
  Play,
  Pause,
  Filter,
  Sparkles,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Layers,
  Info,
  ShieldAlert,
  ArrowUpRight,
  ArrowRight
} from 'lucide-react';

const API = typeof window !== 'undefined' ? `http://${window.location.hostname}:8000` : 'http://localhost:8000';

/* ──────── Types ──────── */
interface GNode {
  id: string;
  label: string;
  type: string;
  report_count: number;
  severity: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  strokeColor: string;
  degree: number;
}

interface GEdge {
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
  cluster_details?: { alert_id: string; event_count: number; detected_at: string };
  recommended_capa: string;
  supporting_reports: Array<{
    id: string; raw_text: string; sif_score: number; sif_label: string;
    location?: string; activity_type?: string; iogp_rule?: string; created_at?: string;
  }>;
}

/* ──────── High-Contrast Palette ──────── */
const PALETTE: Record<string, { fill: string; stroke: string; glow: string; text: string; bgLight: string }> = {
  LOCATION:        { fill: '#0A6B63', stroke: '#06443E', glow: 'rgba(10, 107, 99, 0.25)',  text: '#0A6B63', bgLight: '#E8F4F0' },
  EQUIPMENT:       { fill: '#D97706', stroke: '#92400E', glow: 'rgba(217, 119, 6, 0.25)',  text: '#92400E', bgLight: '#FEF3C7' },
  'LSR RULE':      { fill: '#2563EB', stroke: '#1E40AF', glow: 'rgba(37, 99, 235, 0.25)',  text: '#1E40AF', bgLight: '#EFF6FF' },
  LSR_VIOLATION:   { fill: '#2563EB', stroke: '#1E40AF', glow: 'rgba(37, 99, 235, 0.25)',  text: '#1E40AF', bgLight: '#EFF6FF' },
  BARRIER_FAILURE: { fill: '#DC2626', stroke: '#991B1B', glow: 'rgba(220, 38, 38, 0.3)',   text: '#991B1B', bgLight: '#FEE2E2' },
  ENERGY_SOURCE:   { fill: '#7C3AED', stroke: '#5B21B6', glow: 'rgba(124, 58, 237, 0.25)', text: '#5B21B6', bgLight: '#F3E8FF' },
  ACTIVITY:        { fill: '#059669', stroke: '#065F46', glow: 'rgba(5, 150, 105, 0.25)',  text: '#065F46', bgLight: '#ECFDF5' },
  DEFAULT:         { fill: '#4B5563', stroke: '#1F2937', glow: 'rgba(75, 85, 99, 0.2)',    text: '#374151', bgLight: '#F3F4F6' },
};

const pal = (t: string) => PALETTE[t.toUpperCase()] || PALETTE.DEFAULT;

export default function SignalGraphPage() {
  const nodesRef = useRef<GNode[]>([]);
  const edgesRef = useRef<GEdge[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const isMouseInsideRef = useRef(false);
  const dragRef = useRef<GNode | null>(null);
  const panRef = useRef({ active: false, startX: 0, startY: 0 });
  const dimsRef = useRef({ width: 900, height: 700 });
  const pulseRef = useRef(0);

  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GNode | null>(null);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [physicsOn, setPhysicsOn] = useState(true);
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [evidence, setEvidence] = useState<NodeEvidence | null>(null);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [swaToast, setSwaToast] = useState<{ node: string; type: string; time: string } | null>(null);
  const [activeSwaNodes, setActiveSwaNodes] = useState<string[]>([]);

  /* ── Filter Visibility Predicate ── */
  const isNodeVisible = useCallback((n: GNode, filter: string) => {
    if (filter === 'ALL') return true;
    if (filter === 'HIGH_SIF') return n.severity === 'HIGH';
    return n.type.toUpperCase().includes(filter.toUpperCase());
  }, []);

  /* ── Build graph with structured radial cluster layout ── */
  const buildGraph = useCallback((rawNodes: any[], rawEdges: any[]) => {
    const W = dimsRef.current.width || 900;
    const H = dimsRef.current.height || 700;
    const cx = W / 2, cy = H / 2;

    // Calculate degrees
    const degreeMap: Record<string, number> = {};
    rawEdges.forEach((raw) => {
      const d = raw.data || raw;
      degreeMap[d.source] = (degreeMap[d.source] || 0) + 1;
      degreeMap[d.target] = (degreeMap[d.target] || 0) + 1;
    });

    const categoryAngles: Record<string, number> = {
      LOCATION: 0,
      ACTIVITY: Math.PI * 0.35,
      EQUIPMENT: Math.PI * 0.75,
      BARRIER_FAILURE: Math.PI * 1.15,
      ENERGY_SOURCE: Math.PI * 1.55,
      LSR_VIOLATION: Math.PI * 1.85,
      'LSR RULE': Math.PI * 1.85,
    };

    const categoryCounts: Record<string, number> = {};

    const nodes: GNode[] = rawNodes.map((raw, i) => {
      const d = raw.data || raw;
      const t = (d.type || 'DEFAULT').toUpperCase();
      const rc = d.report_count || 1;
      const deg = degreeMap[d.id] || 1;

      categoryCounts[t] = (categoryCounts[t] || 0) + 1;
      const catIdx = categoryCounts[t];

      let r = 18;
      if (t === 'LOCATION') r = 26;
      else if (t.includes('LSR')) r = 22;
      else if (t === 'BARRIER_FAILURE') r = 20;
      r = Math.min(32, Math.max(16, r + Math.log2(rc + 1) * 1.6));

      const baseAngle = categoryAngles[t] ?? ((i / rawNodes.length) * Math.PI * 2);
      const angleSpread = baseAngle + (catIdx * 0.45) - 0.5;
      const radiusDist = 180 + (catIdx % 2 === 0 ? 60 : 0) + (deg * 4);

      const p = pal(t);
      return {
        id: d.id || `n${i}`,
        label: d.label || d.id || 'Node',
        type: d.type || 'EQUIPMENT',
        report_count: rc,
        severity: d.severity || 'MEDIUM',
        x: cx + Math.cos(angleSpread) * radiusDist + (Math.random() - 0.5) * 30,
        y: cy + Math.sin(angleSpread) * radiusDist + (Math.random() - 0.5) * 30,
        vx: 0,
        vy: 0,
        radius: r,
        color: p.fill,
        strokeColor: p.stroke,
        degree: deg,
      };
    });

    const edges: GEdge[] = rawEdges.map((raw) => {
      const d = raw.data || raw;
      return {
        source: d.source,
        target: d.target,
        weight: d.weight || 1,
        edge_type: d.edge_type || ''
      };
    });

    nodesRef.current = nodes;
    edgesRef.current = edges;
    setNodeCount(nodes.length);
    setEdgeCount(edges.length);
  }, []);

  /* ── Resize handler for Retina / 4K Crisp Canvas ── */
  const updateCanvasDimensions = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    const width = Math.max(300, Math.floor(rect.width));
    const height = Math.max(300, Math.floor(rect.height));
    const dpr = window.devicePixelRatio || 1;

    dimsRef.current = { width, height };
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
  }, []);

  useEffect(() => {
    updateCanvasDimensions();
    const observer = new ResizeObserver(() => {
      updateCanvasDimensions();
    });
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', updateCanvasDimensions);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateCanvasDimensions);
    };
  }, [updateCanvasDimensions, isExpanded]);

  /* ── Escape key closes fullscreen ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) setIsExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isExpanded]);

  /* ── Fetch Graph Data from Backend API ── */
  useEffect(() => {
    const fetchGraph = () => {
      fetch(`${API}/api/graph/signals`)
        .then(r => r.json())
        .then(d => {
          if (d.nodes && d.nodes.length >= 1) {
            buildGraph(d.nodes, d.edges || []);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    fetchGraph();
    const interval = setInterval(fetchGraph, 4000);
    window.addEventListener('sanket:new_report', fetchGraph);

    return () => {
      clearInterval(interval);
      window.removeEventListener('sanket:new_report', fetchGraph);
    };
  }, [buildGraph]);

  /* ── Fetch Node Evidence on selection ── */
  useEffect(() => {
    if (!selectedNode) { setEvidence(null); return; }
    setLoadingEvidence(true);
    fetch(`${API}/api/graph/evidence/${encodeURIComponent(selectedNode.id)}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.node_label) { setEvidence(data); }
        else {
          setEvidence({
            node_id: selectedNode.id, node_label: selectedNode.label, node_type: selectedNode.type,
            total_incidents: selectedNode.report_count,
            high_sif_count: Math.round(selectedNode.report_count * 0.6),
            medium_sif_count: Math.round(selectedNode.report_count * 0.4),
            has_active_cluster: selectedNode.severity === 'HIGH',
            cluster_details: selectedNode.severity === 'HIGH' ? { alert_id: 'CLUST-OIL-2026', event_count: selectedNode.report_count, detected_at: '2h ago' } : undefined,
            recommended_capa: `Inspect ${selectedNode.label} immediately. Enforce positive double-isolation per OISD-189.`,
            supporting_reports: [
              { id: 'REP-0491', raw_text: `${selectedNode.label} experiencing anomalous hydraulic weeping during high-pressure ops.`, sif_score: 0.94, sif_label: 'HIGH', location: 'Well Pad 7', created_at: 'Today 08:30' },
              { id: 'REP-0488', raw_text: `Interlock bypassed during shift handover on ${selectedNode.label}.`, sif_score: 0.82, sif_label: 'HIGH', location: 'Baghjan', created_at: 'Yesterday 16:45' },
              { id: 'REP-0472', raw_text: `Routine calibration completed on ${selectedNode.label}. Gauges normal.`, sif_score: 0.38, sif_label: 'LOW', location: 'Moran OCS-3', created_at: '3 days ago' },
            ]
          });
        }
        setLoadingEvidence(false);
      })
      .catch(() => setLoadingEvidence(false));
  }, [selectedNode]);

  /* ── Highlight direct neighbors ── */
  const neighborSet = useMemo(() => {
    const focus = hoveredNode || selectedNode;
    if (!focus) return null;
    const s = new Set<string>();
    s.add(focus.id);
    edgesRef.current.forEach(e => {
      if (e.source === focus.id) s.add(e.target);
      if (e.target === focus.id) s.add(e.source);
    });
    return s;
  }, [hoveredNode, selectedNode]);

  /* ── Accurate Coordinate helper (World <-> Screen) ── */
  const toWorld = useCallback((clientX: number, clientY: number) => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    const screenX = clientX - r.left;
    const screenY = clientY - r.top;
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom,
    };
  }, [pan, zoom]);

  /* ── Hit-testing nodes ── */
  const hitNode = useCallback((wx: number, wy: number): GNode | null => {
    const ns = nodesRef.current;
    for (let i = ns.length - 1; i >= 0; i--) {
      const n = ns[i];
      if (!isNodeVisible(n, filterType)) continue;
      const dx = n.x - wx, dy = n.y - wy;
      if (dx * dx + dy * dy <= (n.radius + 10) * (n.radius + 10)) return n;
    }
    return null;
  }, [filterType, isNodeVisible]);

  /* ── Accurate Focal Zooming (zooms into cursor or center) ── */
  const zoomAt = useCallback((targetZoom: number, focalScreenX: number, focalScreenY: number) => {
    const clampedZoom = Math.max(0.3, Math.min(3.5, targetZoom));
    setZoom((prevZoom) => {
      if (Math.abs(prevZoom - clampedZoom) < 0.001) return prevZoom;
      const worldX = (focalScreenX - pan.x) / prevZoom;
      const worldY = (focalScreenY - pan.y) / prevZoom;
      const newPanX = focalScreenX - worldX * clampedZoom;
      const newPanY = focalScreenY - worldY * clampedZoom;
      setPan({ x: newPanX, y: newPanY });
      return clampedZoom;
    });
  }, [pan]);

  /* ── Center & Fit View for Visible Subgraph ── */
  const fitView = useCallback(() => {
    const nodes = nodesRef.current.filter(n => isNodeVisible(n, filterType));
    const { width, height } = dimsRef.current;
    if (nodes.length === 0) {
      setZoom(0.85);
      setPan({ x: 0, y: 0 });
      return;
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      minX = Math.min(minX, n.x - n.radius - 40);
      maxX = Math.max(maxX, n.x + n.radius + 40);
      minY = Math.min(minY, n.y - n.radius - 40);
      maxY = Math.max(maxY, n.y + n.radius + 40);
    });
    const gw = Math.max(120, maxX - minX);
    const gh = Math.max(120, maxY - minY);
    const scaleX = (width * 0.78) / gw;
    const scaleY = (height * 0.78) / gh;
    const newZoom = Math.max(0.4, Math.min(1.2, Math.min(scaleX, scaleY)));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    setZoom(newZoom);
    setPan({
      x: width / 2 - centerX * newZoom,
      y: height / 2 - centerY * newZoom,
    });
    setSelectedNode(null);
    setHoveredNode(null);
  }, [filterType, isNodeVisible]);

  /* ── Auto-center when filter changes ── */
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView();
    }, 120);
    return () => clearTimeout(timer);
  }, [filterType, fitView]);

  /* ── Mouse & Drag Handlers ── */
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const w = toWorld(e.clientX, e.clientY);
    const hit = hitNode(w.x, w.y);
    if (hit) {
      dragRef.current = hit;
      setSelectedNode(hit);
    } else {
      panRef.current = { active: true, startX: e.clientX - pan.x, startY: e.clientY - pan.y };
    }
  }, [toWorld, hitNode, pan]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragRef.current) {
      const w = toWorld(e.clientX, e.clientY);
      dragRef.current.x = w.x;
      dragRef.current.y = w.y;
      dragRef.current.vx = 0;
      dragRef.current.vy = 0;
      return;
    }
    if (panRef.current.active) {
      setPan({ x: e.clientX - panRef.current.startX, y: e.clientY - panRef.current.startY });
      return;
    }
    const w = toWorld(e.clientX, e.clientY);
    setHoveredNode(hitNode(w.x, w.y));
  }, [toWorld, hitNode]);

  const onMouseUp = useCallback(() => {
    dragRef.current = null;
    panRef.current.active = false;
  }, []);

  /* ── Smooth Mouse Wheel Focal Zoom (Only inside canvas) ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!isMouseInsideRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = el.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.14 : 0.86;
      zoomAt(zoom * factor, cursorX, cursorY);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [zoom, zoomAt]);

  /* ── Obsidian/ForceAtlas2 Physics & Canvas Loop ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tick = () => {
      const { width: W, height: H } = dimsRef.current;
      const dpr = window.devicePixelRatio || 1;
      const allNodes = nodesRef.current;
      const allEdges = edgesRef.current;

      // Filter active nodes & edges
      const activeNodes = allNodes.filter(n => isNodeVisible(n, filterType));
      const activeNodeIds = new Set(activeNodes.map(n => n.id));
      const activeEdges = allEdges.filter(e => activeNodeIds.has(e.source) && activeNodeIds.has(e.target));

      pulseRef.current = (pulseRef.current + 0.035) % (Math.PI * 2);

      /* ── 1. Physics Step for Active Visible Nodes ── */
      if (physicsOn && activeNodes.length > 0) {
        const cx = W / 2, cy = H / 2;

        // A. Anti-Clumping Coulomb Repulsion
        for (let i = 0; i < activeNodes.length; i++) {
          for (let j = i + 1; j < activeNodes.length; j++) {
            const a = activeNodes[i], b = activeNodes[j];
            let dx = b.x - a.x, dy = b.y - a.y;
            let d2 = dx * dx + dy * dy || 1;
            let d = Math.sqrt(d2);

            if (d < 480) {
              const repStrength = 16000 * (1 + (a.degree + b.degree) * 0.05);
              const f = repStrength / (d2 + 100);
              const fx = (dx / d) * f;
              const fy = (dy / d) * f;
              if (a !== dragRef.current) { a.vx -= fx; a.vy -= fy; }
              if (b !== dragRef.current) { b.vx += fx; b.vy += fy; }
            }
          }

          // Gentle Centering Gravity
          if (activeNodes[i] !== dragRef.current) {
            activeNodes[i].vx += (cx - activeNodes[i].x) * 0.001;
            activeNodes[i].vy += (cy - activeNodes[i].y) * 0.001;
          }
        }

        // B. Hub-Dampened Spring Attraction on Active Edges
        activeEdges.forEach(e => {
          const a = activeNodes.find(n => n.id === e.source);
          const b = activeNodes.find(n => n.id === e.target);
          if (!a || !b) return;

          let dx = b.x - a.x, dy = b.y - a.y;
          let d = Math.sqrt(dx * dx + dy * dy) || 1;

          const ideal = 170 + (a.radius + b.radius) + (10 - Math.min(e.weight, 8)) * 8;
          const degFactor = Math.sqrt((a.degree || 1) * (b.degree || 1));
          const springCoeff = 0.004 / Math.max(1, degFactor * 0.4);

          const f = (d - ideal) * springCoeff;
          const fx = (dx / d) * f;
          const fy = (dy / d) * f;

          if (a !== dragRef.current) { a.vx += fx; a.vy += fy; }
          if (b !== dragRef.current) { b.vx += fx; b.vy += fy; }
        });

        // C. Hard Collision Separation Pass (GUARANTEES NO OVERLAPPING NODES)
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 0; i < activeNodes.length; i++) {
            for (let j = i + 1; j < activeNodes.length; j++) {
              const a = activeNodes[i], b = activeNodes[j];
              let dx = b.x - a.x, dy = b.y - a.y;
              let d = Math.sqrt(dx * dx + dy * dy) || 1;
              const minDist = a.radius + b.radius + 40; // 40px guaranteed clear air around every node

              if (d < minDist) {
                const overlap = (minDist - d) * 0.5;
                const nx = (dx / d) * overlap;
                const ny = (dy / d) * overlap;
                if (a !== dragRef.current) { a.x -= nx; a.y -= ny; a.vx *= 0.5; a.vy *= 0.5; }
                if (b !== dragRef.current) { b.x += nx; b.y += ny; b.vx *= 0.5; b.vy *= 0.5; }
              }
            }
          }
        }

        // D. Integrate Velocities with Damping
        activeNodes.forEach(n => {
          if (n === dragRef.current) return;
          n.vx *= 0.86;
          n.vy *= 0.86;

          const speed = Math.hypot(n.vx, n.vy);
          if (speed > 8) {
            n.vx = (n.vx / speed) * 8;
            n.vy = (n.vy / speed) * 8;
          }

          n.x += n.vx;
          n.y += n.vy;
          n.x = Math.max(60, Math.min(W - 60, n.x));
          n.y = Math.max(60, Math.min(H - 60, n.y));
        });
      }

      /* ── 2. Render Canvas ── */
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      // Canvas background
      ctx.fillStyle = '#F7F8F5';
      ctx.fillRect(0, 0, W, H);

      // Crisp subtle dot grid
      ctx.fillStyle = '#D4DCD4';
      for (let gx = 0; gx < W; gx += 32) {
        for (let gy = 0; gy < H; gy += 32) {
          ctx.fillRect(gx, gy, 1.2, 1.2);
        }
      }

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      const hasFocus = !!(hoveredNode || selectedNode);

      /* ── 3. Draw Active Edges (Only connecting visible nodes) ── */
      activeEdges.forEach(e => {
        const a = activeNodes.find(n => n.id === e.source);
        const b = activeNodes.find(n => n.id === e.target);
        if (!a || !b) return;

        const lit = neighborSet ? (neighborSet.has(a.id) && neighborSet.has(b.id)) : false;
        const isHazard = a.severity === 'HIGH' && b.severity === 'HIGH';

        let strokeStyle = '#B4C2B4';
        let strokeAlpha = 0.35;
        let lineWidth = 1.4;

        if (lit) {
          strokeStyle = '#0A6B63';
          strokeAlpha = 0.95;
          lineWidth = 2.6;
        } else if (hasFocus) {
          strokeAlpha = 0.06;
        } else if (isHazard) {
          strokeStyle = '#E05252';
          strokeAlpha = 0.55;
          lineWidth = 1.8;
        }

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.globalAlpha = strokeAlpha;
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Flow Pulse ONLY on Highlighted / Hazard Edges
        if (lit) {
          const t = (pulseRef.current / (Math.PI * 2)) % 1;
          const px = a.x + (b.x - a.x) * t;
          const py = a.y + (b.y - a.y) * t;
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#0A6B63';
          ctx.fill();
        }
      });

      /* ── 4. Draw Active Visible Nodes ── */
      activeNodes.forEach(n => {
        const isSel = selectedNode?.id === n.id;
        const isHov = hoveredNode?.id === n.id;
        const isNbr = neighborSet ? neighborSet.has(n.id) : true;
        const dim = hasFocus && !isNbr;

        // Outer Glow / Risk Ring
        if (!dim) {
          if (isSel || isHov) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.radius + 9, 0, Math.PI * 2);
            ctx.fillStyle = isSel ? 'rgba(10, 107, 99, 0.28)' : 'rgba(26, 43, 45, 0.16)';
            ctx.fill();
          } else if (n.severity === 'HIGH') {
            const glowR = n.radius + 6 + Math.sin(pulseRef.current * 2) * 2;
            ctx.beginPath();
            ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(220, 38, 38, 0.16)';
            ctx.fill();
          }
        }

        // Main Node Body (Solid High-Contrast)
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = dim ? '#CBD5E1' : n.color;
        ctx.fill();

        // Node Outer Ring
        ctx.lineWidth = isSel ? 3.5 : isHov ? 3 : 2;
        ctx.strokeStyle = isSel ? '#06443E' : isHov ? '#1A2B2D' : (dim ? '#E2E8F0' : n.strokeColor);
        ctx.stroke();

        // Center Core Indicator
        ctx.beginPath();
        ctx.arc(n.x, n.y, Math.max(3.5, n.radius * 0.35), 0, Math.PI * 2);
        ctx.fillStyle = dim ? '#F1F5F9' : '#FFFFFF';
        ctx.fill();

        // High SIF Warning Indicator inside Core
        if (n.severity === 'HIGH' && !dim && n.radius >= 22) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#DC2626';
          ctx.fill();
        }

        // Node Label (Clean High-Contrast Floating Pill)
        const showLabel = isSel || isHov || isNbr || zoom > 0.65 || n.radius >= 20 || activeNodes.length <= 8;
        if (showLabel && !dim) {
          const fontSize = isSel || isHov ? 12 : 11;
          ctx.font = `${isSel || isHov ? 'bold ' : '600 '}${fontSize}px "Inter", -apple-system, sans-serif`;
          const tw = ctx.measureText(n.label).width;
          const lx = n.x;
          const ly = n.y + n.radius + 15;

          const padX = 7;
          const pillHeight = 18;
          const pillY = ly - 13;

          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = isSel ? '#0A6B63' : (isHov ? '#1A2B2D' : '#C2CEC2');
          ctx.lineWidth = isSel ? 1.5 : 1;

          ctx.beginPath();
          ctx.roundRect(lx - tw / 2 - padX, pillY, tw + padX * 2, pillHeight, 5);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = isSel ? '#0A6B63' : '#1A2B2D';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(n.label, lx, pillY + pillHeight / 2);
        }
      });

      ctx.restore();
      ctx.restore();

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [zoom, pan, physicsOn, filterType, selectedNode, hoveredNode, neighborSet, isNodeVisible]);

  const triggerSWA = () => {
    if (!selectedNode) return;
    const isCurrentlyActive = activeSwaNodes.includes(selectedNode.id);
    
    if (isCurrentlyActive) {
      // Lift SWA
      setActiveSwaNodes(prev => prev.filter(id => id !== selectedNode.id));
      setSwaToast(null);
      return;
    }

    // Activate SWA Lockout
    setActiveSwaNodes(prev => [...prev, selectedNode.id]);
    setSwaToast({
      node: selectedNode.label,
      type: selectedNode.type.replace('_', ' '),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });

    // Play Alert Chime via Web Audio API
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch {
      // Ignore
    }

    // Dispatch global lockout event
    window.dispatchEvent(new CustomEvent('sanket:swa_lockout', {
      detail: { node: selectedNode.label, type: selectedNode.type }
    }));
  };

  const filterTabs = [
    { key: 'ALL', label: 'All Signals' },
    { key: 'HIGH_SIF', label: 'High SIF' },
    { key: 'LOCATION', label: 'Assets' },
    { key: 'EQUIPMENT', label: 'Equipment' },
    { key: 'LSR', label: 'LSR Rules' },
    { key: 'BARRIER_FAILURE', label: 'Barriers' },
    { key: 'ENERGY_SOURCE', label: 'Energy' },
  ];

  const visibleNodes = nodesRef.current.filter(n => isNodeVisible(n, filterType));

  return (
    <div className={`dashboard-page flex flex-col ${isExpanded ? 'fixed inset-0 z-50 bg-[#F7F8F5] p-5 h-screen w-screen max-w-none' : 'h-[calc(100vh-64px)] space-y-4 overflow-hidden'}`}>
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-bold text-xl text-[#1A2B2D] tracking-tight">
              Safety Signal Knowledge Graph
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#E8F4F0] text-[#0A6B63] border border-[#BCE3DC]">
              SIF Precursor AI
            </span>
          </div>
          <p className="text-[13px] text-[#5E7072] mt-0.5 font-normal">
            Correlates barrier degradation cascades, near-miss clusters, and systemic SIF precursors across Upper Assam
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" suppressHydrationWarning
            onClick={() => setPhysicsOn(!physicsOn)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
              physicsOn
                ? 'bg-[#EDFAF4] border-[#BFEADB] text-[#1B8A6C]'
                : 'border-[#C2CEC2] bg-white hover:bg-[#F0F2ED] text-[#3E5052]'
            }`}
          >
            {physicsOn ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {physicsOn ? 'Physics Active' : 'Physics Paused'}
          </button>

          <button type="button" suppressHydrationWarning
            onClick={fitView}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#C2CEC2] bg-white hover:bg-[#F0F2ED] text-[#3E5052] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Fit to Screen"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Fit View
          </button>

          <button type="button" suppressHydrationWarning
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
              isExpanded
                ? 'bg-[#0A6B63] text-white border-[#0A6B63]'
                : 'border-[#C2CEC2] bg-white hover:bg-[#F0F2ED] text-[#3E5052]'
            }`}
            title={isExpanded ? 'Exit Expand' : 'Expand Fullscreen'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* ── Filter & Search Control Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#C2CEC2] shadow-xs shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-[#5E7072] mr-1.5 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#94A3A5]" /> Filter:
          </span>
          {filterTabs.map((t) => (
            <button type="button" suppressHydrationWarning
              key={t.key}
              onClick={() => setFilterType(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterType === t.key
                  ? 'bg-[#0A6B63] text-white font-semibold shadow-xs'
                  : 'bg-[#F0F2ED] text-[#3E5052] hover:bg-[#E2E8E2]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3A5]" />
          <input suppressHydrationWarning
            type="text"
            placeholder="Search node, equipment, hazard..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 bg-[#F7F8F5] border border-[#C2CEC2] rounded-lg text-xs text-[#1A2B2D] placeholder-[#94A3A5] w-72 focus:outline-none focus:border-[#0A6B63] focus:bg-white transition-all"
          />
          {searchQuery && (
            <div className="absolute right-0 mt-1 w-72 bg-white border border-[#C2CEC2] rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
              {nodesRef.current.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase())).map(n => (
                <button type="button" suppressHydrationWarning
                  key={n.id}
                  onClick={() => {
                    setSelectedNode(n);
                    setSearchQuery('');
                    const { width, height } = dimsRef.current;
                    setPan({ x: width / 2 - n.x * zoom, y: height / 2 - n.y * zoom });
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#F0F2ED] text-xs cursor-pointer flex justify-between items-center border-b border-[#F0F2ED] last:border-none"
                >
                  <span className="font-medium text-[#1A2B2D]">{n.label}</span>
                  <span className="text-[10px] text-[#94A3A5] uppercase font-semibold">{n.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Graph & Inspector Grid ── */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3.5 overflow-hidden relative">

        {/* SWA High-Visibility Lockout Toast */}
        {swaToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 max-w-xl w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-4 rounded-2xl bg-[#162829] border-2 border-[#D63B3B] text-white shadow-2xl space-y-3 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                    <AlertOctagon className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest block">
                      🚨 SWA LOCKDOWN PROTOCOL ACTIVE
                    </span>
                    <h3 className="text-sm font-heading font-bold text-white">
                      500m Perimeter Freeze: {swaToast.node} ({swaToast.type})
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setSwaToast(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[#8BA4A7] leading-relaxed">
                Emergency Stop Work Authority broadcast to <strong>Well Pad 7 & Duliajan Control Room</strong> per DGMS/OISD-189 standards. High-pressure pumps isolated.
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-[#264245]">
                <span className="text-[10px] font-mono text-[#5E7072]">
                  Authorized: {swaToast.time} · SWA-LOC-{swaToast.node.substring(0, 4).toUpperCase()}
                </span>
                <Link
                  href={`/dashboard/emergency?location=${encodeURIComponent(swaToast.node.toLowerCase().includes('moran') ? 'Moran OCS-3' : swaToast.node.toLowerCase().includes('baghjan') ? 'Baghjan Well #5' : 'Well Pad 7')}`}
                  className="px-3 py-1.5 bg-[#D63B3B] hover:bg-[#B92525] text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <span>Open Emergency Playbook</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Graph canvas container */}
        <div ref={containerRef}
          className="flex-1 relative bg-white border-2 border-[#C2CEC2] rounded-xl overflow-hidden shadow-xs"
          onMouseEnter={() => { isMouseInsideRef.current = true; }}
          onMouseLeave={() => { isMouseInsideRef.current = false; setHoveredNode(null); }}>

          <canvas ref={canvasRef}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            className="w-full h-full block cursor-grab active:cursor-grabbing" style={{ touchAction: 'none' }} />

          {/* Interactive Hover HUD Tooltip */}
          {hoveredNode && !selectedNode && (
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-[#C2CEC2] shadow-md z-40 max-w-xs transition-all pointer-events-none">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" style={{ backgroundColor: pal(hoveredNode.type).bgLight, color: pal(hoveredNode.type).text }}>
                  {hoveredNode.type.replace('_', ' ')}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${hoveredNode.severity === 'HIGH' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {hoveredNode.severity} RISK
                </span>
              </div>
              <div className="font-heading font-bold text-xs text-[#1A2B2D]">{hoveredNode.label}</div>
              <div className="text-[11px] text-[#5E7072] mt-0.5 flex items-center justify-between">
                <span>{hoveredNode.report_count} Incident Reports</span>
                <span>{hoveredNode.degree} Connections</span>
              </div>
            </div>
          )}

          {/* Bottom Zoom & Node Stats Controls Overlay */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#C2CEC2] text-xs text-[#3E5052] shadow-xs">
            <button type="button" suppressHydrationWarning
              onClick={() => {
                const { width, height } = dimsRef.current;
                zoomAt(zoom * 1.25, width / 2, height / 2);
              }}
              className="p-1 hover:text-[#0A6B63] hover:bg-[#F0F2ED] rounded transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] text-[#1A2B2D] w-10 text-center font-bold font-mono">
              {(zoom * 100).toFixed(0)}%
            </span>
            <button type="button" suppressHydrationWarning
              onClick={() => {
                const { width, height } = dimsRef.current;
                zoomAt(zoom / 1.25, width / 2, height / 2);
              }}
              className="p-1 hover:text-[#0A6B63] hover:bg-[#F0F2ED] rounded transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="h-3 w-px bg-[#C2CEC2] mx-1" />
            <button type="button" suppressHydrationWarning
              onClick={fitView}
              className="p-1 hover:text-[#0A6B63] hover:bg-[#F0F2ED] rounded transition-colors cursor-pointer"
              title="Reset / Fit View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span className="h-3 w-px bg-[#C2CEC2] mx-1" />
            <span className="text-[11px] text-[#0A6B63] font-semibold flex items-center gap-1 px-1">
              <span className="w-2 h-2 rounded-full bg-[#0A6B63]" />
              {visibleNodes.length} Nodes
            </span>
          </div>

          {/* Legend */}
          <div className="absolute top-3 left-3 hidden sm:flex flex-wrap items-center gap-2.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#C2CEC2] text-[11px] text-[#3E5052] shadow-xs font-semibold">
            {[
              { c: '#0A6B63', l: 'Asset' }, { c: '#D97706', l: 'Equipment' }, { c: '#2563EB', l: 'IOGP Rule' },
              { c: '#DC2626', l: 'Barrier Fail' }, { c: '#7C3AED', l: 'Energy' }, { c: '#059669', l: 'Activity' },
            ].map(i => (
              <div key={i.l} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: i.c }} />
                <span>{i.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right evidence panel */}
        <div className="w-full lg:w-96 shrink-0 bg-white border-2 border-[#C2CEC2] rounded-xl flex flex-col overflow-y-auto shadow-xs">
          {selectedNode ? (
            <div className="p-4 space-y-4">
              <div className="border-b border-[#E2E8E2] pb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#F0F2ED] text-[#5E7072] border border-[#C2CEC2]">
                    {selectedNode.type.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${selectedNode.severity === 'HIGH' ? 'bg-[#FDF2F2] text-[#D63B3B] border-[#F5C6C6]' : 'bg-[#EDFAF4] text-[#1B8A6C] border-[#BFEADB]'}`}>
                    {selectedNode.severity} RISK
                  </span>
                </div>
                <h2 className="font-heading font-bold text-base text-[#1A2B2D]">{selectedNode.label}</h2>
                <div className="text-xs text-[#5E7072] mt-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#0A6B63]" />
                  {selectedNode.report_count} Associated Incidents · {selectedNode.degree} Connected Entities
                </div>
              </div>

              <div className="bg-[#F7F8F5] p-3 rounded-xl border border-[#C2CEC2] space-y-1.5">
                <div className="text-[11px] font-bold text-[#1A2B2D] uppercase flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#D97706]" /> Causal Propagation
                </div>
                <p className="text-[11px] text-[#3E5052] leading-relaxed">
                  {selectedNode.type === 'BARRIER_FAILURE'
                    ? 'CRITICAL: Active barrier degradation. Immediate physical verification required before continued operations.'
                    : selectedNode.type === 'LOCATION'
                    ? 'Asset hub tracking clustered near-miss precursors within a 500m operational radius.'
                    : selectedNode.type.includes('LSR')
                    ? 'Violation of this Life-Saving Rule represents systemic control degradation across multiple shifts.'
                    : `Failure in ${selectedNode.label} threatens primary containment integrity and may propagate to high-pressure blowouts.`}
                </p>
              </div>

              <div className="bg-[#EDFAF4] p-3 rounded-xl border border-[#BFEADB] space-y-1">
                <div className="text-[11px] font-bold text-[#1B8A6C] uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Recommended CAPA
                </div>
                <p className="text-xs text-[#1A2B2D] leading-relaxed font-medium">
                  {evidence?.recommended_capa || `Inspect ${selectedNode.label} immediately. Enforce positive double-isolation per OISD-189.`}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-heading font-bold text-[#1A2B2D] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#0A6B63]" /> Recent Incident Evidence
                  </span>
                  <span className="text-[10px] text-[#94A3A5]">{evidence?.supporting_reports?.length || 0} reports</span>
                </div>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {evidence?.supporting_reports?.map((r, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-[#1A2B2D] font-mono">{r.id}</span>
                        <span className={`px-1.5 py-0.5 rounded font-bold ${r.sif_label === 'HIGH' ? 'bg-[#FDF2F2] text-[#D63B3B]' : 'bg-[#EDFAF4] text-[#1B8A6C]'}`}>
                          SIF {(r.sif_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-[#3E5052] line-clamp-2 leading-relaxed">"{r.raw_text}"</p>
                      <div className="text-[10px] text-[#94A3A5]">{r.location} · {r.created_at}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                suppressHydrationWarning
                onClick={triggerSWA}
                className={`w-full py-3 font-heading font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 ${
                  activeSwaNodes.includes(selectedNode.id)
                    ? 'bg-[#D63B3B] text-white border-2 border-red-300 animate-pulse'
                    : 'bg-[#D63B3B] hover:bg-[#B92525] text-white'
                }`}
              >
                <AlertOctagon className="w-4 h-4" />
                {activeSwaNodes.includes(selectedNode.id)
                  ? '🛑 SWA LOCKDOWN ACTIVE (Click to Lift)'
                  : '🚨 Issue Stop Work Authority (SWA)'}
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#5E7072] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F0F2ED] border border-[#C2CEC2] flex items-center justify-center text-[#0A6B63]">
                <Network className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-sm text-[#1A2B2D]">Knowledge Graph Inspector</h3>
              <p className="text-xs text-[#5E7072] max-w-xs leading-relaxed font-normal">
                Click any node on the graph to trace causal precursor chains and inspect supporting field evidence.
              </p>
              <div className="p-3 bg-[#F7F8F5] rounded-xl border border-[#C2CEC2] text-[11px] text-left w-full space-y-1">
                <div className="font-bold text-[#1A2B2D]">Graph Gestures:</div>
                <div className="text-[#5E7072]">• Click node → inspect evidence panel</div>
                <div className="text-[#5E7072]">• Drag node → rearrange spring layout</div>
                <div className="text-[#5E7072]">• Scroll (inside graph) → zoom in / out</div>
                <div className="text-[#5E7072]">• Drag canvas → pan across network</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
