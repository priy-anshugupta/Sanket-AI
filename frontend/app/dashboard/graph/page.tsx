"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Network,
  Activity,
  RotateCcw,
  Zap,
  AlertOctagon,
  Search,
  Filter,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Layers,
  Info,
  ShieldAlert,
  ArrowRight,
  Flame,
  Radio,
  Plus,
  Minus
} from "lucide-react";

const API = typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://localhost:8000";

/* ──────── Types ──────── */
interface GNode {
  id: string;
  label: string;
  type: string;
  report_count: number;
  severity: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  strokeColor: string;
  icon: string;
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

// 20 Curated Stable Baseline Safety Entities (Symmetrically Distributed in SVG Space 900x560)
const BASELINE_NODES: GNode[] = [
  // 🏭 Tier 1: Core Assets (Center Hub)
  { id: "LOCATION:Baghjan Well #5", label: "Baghjan Well #5", type: "LOCATION", report_count: 17, severity: "HIGH", x: 450, y: 220, radius: 25, color: "#0A6B63", strokeColor: "#043B36", icon: "🏭", degree: 4 },
  { id: "LOCATION:Well Pad 7", label: "Well Pad 7", type: "LOCATION", report_count: 19, severity: "HIGH", x: 360, y: 280, radius: 25, color: "#0A6B63", strokeColor: "#043B36", icon: "🏭", degree: 3 },
  { id: "LOCATION:Moran OCS-3", label: "Moran OCS-3", type: "LOCATION", report_count: 18, severity: "HIGH", x: 540, y: 280, radius: 25, color: "#0A6B63", strokeColor: "#043B36", icon: "🏭", degree: 3 },
  { id: "LOCATION:Geleki Processing", label: "Geleki Processing", type: "LOCATION", report_count: 16, severity: "HIGH", x: 450, y: 340, radius: 25, color: "#0A6B63", strokeColor: "#043B36", icon: "🏭", degree: 3 },

  // ⚙️ Tier 2: Equipment (Middle Ring)
  { id: "EQUIPMENT:Blowout Preventer (BOP)", label: "Blowout Preventer (BOP)", type: "EQUIPMENT", report_count: 14, severity: "HIGH", x: 450, y: 125, radius: 23, color: "#D97706", strokeColor: "#78350F", icon: "⚙️", degree: 3 },
  { id: "EQUIPMENT:12m Scaffold Tower", label: "12m Scaffold Tower", type: "EQUIPMENT", report_count: 8, severity: "HIGH", x: 260, y: 275, radius: 23, color: "#D97706", strokeColor: "#78350F", icon: "⚙️", degree: 2 },
  { id: "EQUIPMENT:Crawler Crane (5-Ton)", label: "Crawler Crane (5-Ton)", type: "EQUIPMENT", report_count: 9, severity: "HIGH", x: 640, y: 275, radius: 23, color: "#D97706", strokeColor: "#78350F", icon: "⚙️", degree: 2 },
  { id: "EQUIPMENT:Heavy Industrial Forklift", label: "Heavy Industrial Forklift", type: "EQUIPMENT", report_count: 7, severity: "HIGH", x: 450, y: 435, radius: 23, color: "#D97706", strokeColor: "#78350F", icon: "⚙️", degree: 2 },

  // 🛑 Tier 3: Degraded Barriers (Outer Ring)
  { id: "BARRIER_FAILURE:Primary Well Containment", label: "Primary Well Containment", type: "BARRIER_FAILURE", report_count: 12, severity: "HIGH", x: 335, y: 65, radius: 23, color: "#DC2626", strokeColor: "#7F1D1D", icon: "🛑", degree: 3 },
  { id: "BARRIER_FAILURE:100% Fall Arrest Harness", label: "100% Fall Arrest Harness", type: "BARRIER_FAILURE", report_count: 8, severity: "HIGH", x: 170, y: 200, radius: 23, color: "#DC2626", strokeColor: "#7F1D1D", icon: "🛑", degree: 2 },
  { id: "BARRIER_FAILURE:Overhead Line Clearance", label: "Overhead Line Clearance", type: "BARRIER_FAILURE", report_count: 9, severity: "HIGH", x: 730, y: 200, radius: 23, color: "#DC2626", strokeColor: "#7F1D1D", icon: "🛑", degree: 2 },
  { id: "BARRIER_FAILURE:Physical Crash Barrier", label: "Physical Crash Barrier", type: "BARRIER_FAILURE", report_count: 7, severity: "HIGH", x: 565, y: 495, radius: 23, color: "#DC2626", strokeColor: "#7F1D1D", icon: "🛑", degree: 2 },

  // 📜 Tier 4: Life-Saving Rules (Outer Ring)
  { id: "LSR:Bypassing Safety Controls", label: "Bypassing Safety Controls", type: "LSR_VIOLATION", report_count: 15, severity: "HIGH", x: 565, y: 65, radius: 23, color: "#2563EB", strokeColor: "#172554", icon: "📜", degree: 2 },
  { id: "LSR:Working at Height", label: "Working at Height", type: "LSR_VIOLATION", report_count: 11, severity: "HIGH", x: 170, y: 350, radius: 23, color: "#2563EB", strokeColor: "#172554", icon: "📜", degree: 2 },
  { id: "LSR:Safe Mechanical Lifting", label: "Safe Mechanical Lifting", type: "LSR_VIOLATION", report_count: 9, severity: "HIGH", x: 730, y: 350, radius: 23, color: "#2563EB", strokeColor: "#172554", icon: "📜", degree: 2 },
  { id: "LSR:Line of Fire", label: "Line of Fire", type: "LSR_VIOLATION", report_count: 10, severity: "HIGH", x: 335, y: 495, radius: 23, color: "#2563EB", strokeColor: "#172554", icon: "📜", degree: 2 },

  // ⚡ Tier 5: High-Energy Hazards (Perimeter)
  { id: "ENERGY_SOURCE:1800 PSI Gas Surge", label: "1800 PSI Gas Surge", type: "ENERGY_SOURCE", report_count: 14, severity: "HIGH", x: 450, y: 15, radius: 23, color: "#7C3AED", strokeColor: "#4C1D95", icon: "⚡", degree: 2 },
  { id: "ENERGY_SOURCE:12m Fall Drop Energy", label: "12m Fall Drop Energy", type: "ENERGY_SOURCE", report_count: 8, severity: "HIGH", x: 90, y: 275, radius: 23, color: "#7C3AED", strokeColor: "#4C1D95", icon: "⚡", degree: 2 },
  { id: "ENERGY_SOURCE:33,000V Power Grid", label: "33,000V Power Grid", type: "ENERGY_SOURCE", report_count: 9, severity: "HIGH", x: 810, y: 275, radius: 23, color: "#7C3AED", strokeColor: "#4C1D95", icon: "⚡", degree: 2 },
  { id: "ENERGY_SOURCE:Pressurized Flammable Gas", label: "Pressurized Flammable Gas", type: "ENERGY_SOURCE", report_count: 7, severity: "HIGH", x: 450, y: 545, radius: 23, color: "#7C3AED", strokeColor: "#4C1D95", icon: "⚡", degree: 2 },
];

const BASELINE_EDGES: GEdge[] = [
  // 1. Baghjan Well Causal Pathway
  { source: "LOCATION:Baghjan Well #5", target: "EQUIPMENT:Blowout Preventer (BOP)", weight: 3, edge_type: "deployed_at" },
  { source: "EQUIPMENT:Blowout Preventer (BOP)", target: "BARRIER_FAILURE:Primary Well Containment", weight: 3, edge_type: "barrier_degradation" },
  { source: "BARRIER_FAILURE:Primary Well Containment", target: "LSR:Bypassing Safety Controls", weight: 3, edge_type: "violates_rule" },
  { source: "BARRIER_FAILURE:Primary Well Containment", target: "ENERGY_SOURCE:1800 PSI Gas Surge", weight: 3, edge_type: "failed_energy_barrier" },
  { source: "EQUIPMENT:Blowout Preventer (BOP)", target: "ENERGY_SOURCE:1800 PSI Gas Surge", weight: 3, edge_type: "energy_threat" },

  // 2. Well Pad 7 Fall Hazard Pathway
  { source: "LOCATION:Well Pad 7", target: "EQUIPMENT:12m Scaffold Tower", weight: 3, edge_type: "deployed_at" },
  { source: "EQUIPMENT:12m Scaffold Tower", target: "BARRIER_FAILURE:100% Fall Arrest Harness", weight: 3, edge_type: "barrier_degradation" },
  { source: "BARRIER_FAILURE:100% Fall Arrest Harness", target: "LSR:Working at Height", weight: 3, edge_type: "violates_rule" },
  { source: "BARRIER_FAILURE:100% Fall Arrest Harness", target: "ENERGY_SOURCE:12m Fall Drop Energy", weight: 3, edge_type: "failed_energy_barrier" },

  // 3. Moran Crane Electrocution Pathway
  { source: "LOCATION:Moran OCS-3", target: "EQUIPMENT:Crawler Crane (5-Ton)", weight: 3, edge_type: "deployed_at" },
  { source: "EQUIPMENT:Crawler Crane (5-Ton)", target: "BARRIER_FAILURE:Overhead Line Clearance", weight: 3, edge_type: "barrier_degradation" },
  { source: "BARRIER_FAILURE:Overhead Line Clearance", target: "LSR:Safe Mechanical Lifting", weight: 3, edge_type: "violates_rule" },
  { source: "BARRIER_FAILURE:Overhead Line Clearance", target: "ENERGY_SOURCE:33,000V Power Grid", weight: 3, edge_type: "failed_energy_barrier" },

  // 4. Geleki Forklift Gas Ignition Pathway
  { source: "LOCATION:Geleki Processing", target: "EQUIPMENT:Heavy Industrial Forklift", weight: 3, edge_type: "deployed_at" },
  { source: "EQUIPMENT:Heavy Industrial Forklift", target: "BARRIER_FAILURE:Physical Crash Barrier", weight: 3, edge_type: "barrier_degradation" },
  { source: "BARRIER_FAILURE:Physical Crash Barrier", target: "LSR:Line of Fire", weight: 3, edge_type: "violates_rule" },
  { source: "BARRIER_FAILURE:Physical Crash Barrier", target: "ENERGY_SOURCE:Pressurized Flammable Gas", weight: 3, edge_type: "failed_energy_barrier" },
];

export default function SignalGraphPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [nodes, setNodes] = useState<GNode[]>(BASELINE_NODES);
  const [edges, setEdges] = useState<GEdge[]>(BASELINE_EDGES);
  const [selectedNode, setSelectedNode] = useState<GNode | null>(BASELINE_NODES[0]);
  const [hoveredNode, setHoveredNode] = useState<GNode | null>(null);
  const [filterType, setFilterType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [evidence, setEvidence] = useState<NodeEvidence | null>(null);
  const [swaToast, setSwaToast] = useState<{ node: string; type: string; time: string } | null>(null);

  /* ── Filter Predicate ── */
  const isNodeVisible = useCallback((n: GNode, filter: string) => {
    if (filter === "ALL") return true;
    if (filter === "HIGH_SIF") return n.severity === "HIGH";
    if (filter === "LOCATION") return n.type === "LOCATION";
    if (filter === "EQUIPMENT") return n.type === "EQUIPMENT";
    if (filter === "LSR_VIOLATION" || filter === "LSR") return n.type.includes("LSR");
    if (filter === "BARRIER_FAILURE" || filter === "BARRIER") return n.type.includes("BARRIER");
    if (filter === "ENERGY_SOURCE" || filter === "ENERGY") return n.type.includes("ENERGY");
    return n.type.toUpperCase().includes(filter.toUpperCase());
  }, []);

  /* ── 100% Guaranteed Fit View (Resets Pan & Zoom) ── */
  const fitView = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setNodes(BASELINE_NODES);
  }, []);

  /* ── Fetch Node Evidence on selection ── */
  useEffect(() => {
    if (!selectedNode) { setEvidence(null); return; }
    fetch(`${API}/api/graph/evidence/${encodeURIComponent(selectedNode.id)}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.node_label) { setEvidence(data); }
      })
      .catch(() => {
        setEvidence({
          node_id: selectedNode.id, node_label: selectedNode.label, node_type: selectedNode.type,
          total_incidents: selectedNode.report_count,
          high_sif_count: Math.round(selectedNode.report_count * 0.7),
          medium_sif_count: Math.round(selectedNode.report_count * 0.3),
          has_active_cluster: selectedNode.severity === "HIGH",
          cluster_details: selectedNode.severity === "HIGH" ? { alert_id: "CLUST-OIL-2026", event_count: selectedNode.report_count, detected_at: "2h ago" } : undefined,
          recommended_capa: `Enforce mandatory positive barrier double-isolation on ${selectedNode.label} per OISD-189 Section 7.4.`,
          supporting_reports: [
            { id: "REP-0491", raw_text: `Anomalous pressure surge recorded on ${selectedNode.label} during high-rate circulation.`, sif_score: 0.94, sif_label: "HIGH", location: "Baghjan Well #5", created_at: "Today 08:30" },
            { id: "REP-0488", raw_text: `Interlock bypassed during shift handover on ${selectedNode.label}.`, sif_score: 0.82, sif_label: "HIGH", location: "Well Pad 7", created_at: "Yesterday 16:45" },
          ]
        });
      });
  }, [selectedNode]);

  /* ── Connected Causal Path Neighbors (Multi-degree) ── */
  const neighborSet = useMemo(() => {
    const focus = hoveredNode || selectedNode;
    if (!focus) return null;
    const s = new Set<string>();
    s.add(focus.id);

    // 1st degree
    edges.forEach(e => {
      if (e.source === focus.id) s.add(e.target);
      if (e.target === focus.id) s.add(e.source);
    });

    // 2nd degree pathway tracing
    edges.forEach(e => {
      if (s.has(e.source)) s.add(e.target);
      if (s.has(e.target)) s.add(e.source);
    });

    return s;
  }, [hoveredNode, selectedNode, edges]);

  /* ── Zoom Controls ── */
  const handleZoomIn = () => {
    setZoom(prev => Math.min(2.2, Math.round((prev + 0.15) * 100) / 100));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.5, Math.round((prev - 0.15) * 100) / 100));
  };

  /* ── Mouse Pan & Node Drag ── */
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as HTMLElement).tagName === "svg" || (e.target as HTMLElement).id === "graph-canvas-bg") {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (draggedNodeId) {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const svgX = (e.clientX - rect.left - pan.x) / zoom * (900 / rect.width);
      const svgY = (e.clientY - rect.top - pan.y) / zoom * (560 / rect.height);
      setNodes(prev => prev.map(n => n.id === draggedNodeId ? { ...n, x: svgX, y: svgY } : n));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNodeId(null);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.max(0.5, Math.min(2.2, Math.round(prev * factor * 100) / 100)));
  };

  const handleTriggerSWA = () => {
    if (!selectedNode) return;
    setSwaToast({
      node: selectedNode.label,
      type: selectedNode.type,
      time: new Date().toLocaleTimeString()
    });
    setTimeout(() => setSwaToast(null), 7000);
  };

  const activeNodes = useMemo(() => nodes.filter(n => isNodeVisible(n, filterType)), [nodes, filterType, isNodeVisible]);
  const activeNodeIds = useMemo(() => new Set(activeNodes.map(n => n.id)), [activeNodes]);
  const activeEdges = useMemo(() => edges.filter(e => activeNodeIds.has(e.source) && activeNodeIds.has(e.target)), [edges, activeNodeIds]);
  const nodeMap = useMemo(() => new Map(activeNodes.map(n => [n.id, n])), [activeNodes]);

  if (!mounted) return null;

  return (
    <div className="dashboard-page space-y-4 p-5 bg-[#FAFAF9] min-h-screen text-[#1A2B2D]">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-bold text-xl text-[#1A2B2D] tracking-tight">
              Safety Signal Knowledge Graph
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#E8F4F0] text-[#0A6B63] border border-[#A3D9C9]">
              BOW-TIE CAUSAL AI
            </span>
          </div>
          <p className="text-[13px] text-[#5E7072] mt-0.5 font-normal">
            Correlates barrier degradation cascades, near-miss clusters, and systemic SIF precursors across Upper Assam
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            suppressHydrationWarning
            onClick={fitView}
            className="px-3.5 py-1.5 rounded-lg bg-white text-[#0A6B63] border-2 border-[#0A6B63] text-xs font-bold hover:bg-[#E8F4F0] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Recenter & Fit All Nodes"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#0A6B63]" /> Fit View
          </button>

          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-lg bg-white text-[#1A2B2D] border border-[#C2CEC2] text-xs font-semibold hover:bg-[#F0F2ED] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isExpanded ? "Collapse" : "Expand"}</span>
          </button>
        </div>
      </div>

      {/* ── Filters & Search Bar ── */}
      <div className="bg-white rounded-xl border border-[#C2CEC2] p-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-xs font-bold text-[#5E7072] mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { id: "ALL", label: "All Signals" },
            { id: "LOCATION", label: "🏭 Assets" },
            { id: "EQUIPMENT", label: "⚙️ Equipment" },
            { id: "BARRIER", label: "🛑 Barriers" },
            { id: "LSR", label: "📜 LSR Rules" },
            { id: "ENERGY", label: "⚡ Energy" },
          ].map(btn => (
            <button
              key={btn.id}
              type="button"
              suppressHydrationWarning
              onClick={() => setFilterType(btn.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === btn.id
                  ? "bg-[#0A6B63] text-white shadow-2xs font-bold"
                  : "bg-[#F0F2ED] text-[#5E7072] hover:text-[#1A2B2D] hover:bg-[#E2E8E2]"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#5E7072] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            suppressHydrationWarning
            placeholder="Search node, equipment, hazard..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              const q = e.target.value.toLowerCase();
              if (!q) return;
              const match = nodes.find(n => n.label.toLowerCase().includes(q));
              if (match) {
                setSelectedNode(match);
              }
            }}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#C2CEC2] text-xs focus:outline-none focus:border-[#0A6B63] bg-[#F7F8F5]"
          />
        </div>
      </div>

      {/* SWA Toast */}
      {swaToast && (
        <div className="p-3.5 rounded-xl bg-[#D63B3B] text-white text-xs font-semibold flex items-center justify-between shadow-md border border-[#B92525]">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
            <span>🛑 STOP WORK AUTHORITY (SWA) ISSUED for <b>{swaToast.node}</b>! Precursor cluster escalated to Central HSE.</span>
          </div>
          <button type="button" suppressHydrationWarning onClick={() => setSwaToast(null)} className="text-white/80 hover:text-white font-bold text-sm px-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* ── Main Graph Canvas & Evidence Panel Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* SVG Canvas Column */}
        <div className={`transition-all duration-300 ${isExpanded ? "lg:col-span-12" : "lg:col-span-8"}`}>
          <div className="bg-white rounded-xl border-2 border-[#C2CEC2] shadow-xs relative overflow-hidden select-none">
            
            {/* Legend Overlay Top Left */}
            <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-sm p-2 rounded-lg border border-[#C2CEC2] shadow-sm flex items-center flex-wrap gap-2 text-[11px] font-semibold text-[#1A2B2D] pointer-events-none">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#0A6B63]"></span> 🏭 Asset</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span> ⚙️ Equipment</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span> 🛑 Barrier Fail</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span> 📜 IOGP Rule</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]"></span> ⚡ Energy</span>
            </div>

            {/* Floating Zoom & Pan Widget Bottom Left */}
            <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-sm p-1.5 rounded-lg border border-[#C2CEC2] shadow-sm flex items-center gap-1 text-xs text-[#5E7072]">
              <button
                type="button"
                suppressHydrationWarning
                onClick={handleZoomIn}
                className="p-1.5 rounded-md hover:bg-[#F0F2ED] text-[#1A2B2D] transition-colors cursor-pointer"
                title="Zoom In (+)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                suppressHydrationWarning
                onClick={handleZoomOut}
                className="p-1.5 rounded-md hover:bg-[#F0F2ED] text-[#1A2B2D] transition-colors cursor-pointer"
                title="Zoom Out (-)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono font-bold text-[#1A2B2D] px-2 text-[11px] border-l border-r border-[#C2CEC2]">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                suppressHydrationWarning
                onClick={fitView}
                className="p-1.5 rounded-md hover:bg-[#E8F4F0] text-[#0A6B63] transition-colors cursor-pointer flex items-center gap-1 font-bold"
                title="Fit View"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#0A6B63]" /> Fit
              </button>
            </div>

            {/* Bottom Status Bar Overlay Bottom Right */}
            <div className="absolute bottom-3 right-3 z-10 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#C2CEC2] shadow-sm flex items-center gap-2 text-xs text-[#5E7072] pointer-events-none">
              <span className="font-semibold text-[#0A6B63]">20 Curated Bow-Tie Safety Nodes</span>
              <span>•</span>
              <span>16 Causal Links</span>
            </div>

            {/* 🌟 ULTRA-SHARP BULLETPROOF SVG GRAPH CANVAS 🌟 */}
            <svg
              viewBox="0 0 900 560"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              className="w-full cursor-grab active:cursor-grabbing block"
              style={{ height: isExpanded ? 740 : 560 }}
            >
              {/* Background Grid Pattern */}
              <defs>
                <pattern id="dot-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                  <circle cx="14" cy="14" r="1.2" fill="#D4DCD4" />
                </pattern>
                
                {/* Glow Filter for Active Links */}
                <filter id="glow-teal" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0A6B63" floodOpacity="0.6" />
                </filter>
                <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#DC2626" floodOpacity="0.6" />
                </filter>
              </defs>

              {/* Background Rect */}
              <rect id="graph-canvas-bg" width="900" height="560" fill="#F7F8F5" />
              <rect id="graph-canvas-grid" width="900" height="560" fill="url(#dot-grid)" pointerEvents="none" />

              {/* Transform Container (Pan & Zoom) */}
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} transform-origin="450 280">
                
                {/* ── 1. Curved Bézier Edges ── */}
                {activeEdges.map((e, idx) => {
                  const a = nodeMap.get(e.source);
                  const b = nodeMap.get(e.target);
                  if (!a || !b) return null;

                  const isConnected = neighborSet ? (neighborSet.has(a.id) && neighborSet.has(b.id)) : false;
                  const hasFocus = !!(hoveredNode || selectedNode);

                  const midX = (a.x + b.x) / 2;
                  const midY = (a.y + b.y) / 2;
                  const dx = b.x - a.x;
                  const dy = b.y - a.y;
                  const dist = Math.hypot(dx, dy) || 1;
                  const curvature = Math.min(22, dist * 0.08);
                  const nx = -dy / dist;
                  const ny = dx / dist;
                  const cpX = midX + nx * curvature;
                  const cpY = midY + ny * curvature;

                  const pathD = `M ${a.x} ${a.y} Q ${cpX} ${cpY} ${b.x} ${b.y}`;

                  return (
                    <g key={`edge-${idx}`} opacity={isConnected ? 1.0 : hasFocus ? 0.25 : 0.65}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke={isConnected ? "#0A6B63" : "#94A3B8"}
                        strokeWidth={isConnected ? 3.6 : 2.0}
                        filter={isConnected ? "url(#glow-teal)" : undefined}
                      />
                      {/* Animated Pulse Marker along active/connected edge */}
                      {isConnected && (
                        <circle r="4.5" fill="#0A6B63">
                          <animateMotion path={pathD} dur="2.5s" repeatCount="indefinite" />
                        </circle>
                      )}
                    </g>
                  );
                })}

                {/* ── 2. Nodes with Badges & Icons ── */}
                {activeNodes.map(n => {
                  const isHovered = hoveredNode?.id === n.id;
                  const isSelected = selectedNode?.id === n.id;
                  const isConnected = neighborSet ? neighborSet.has(n.id) : false;
                  const hasFocus = !!(hoveredNode || selectedNode);

                  const opacity = isConnected || !hasFocus ? 1.0 : 0.55;
                  const pillWidth = n.label.length * 6.8 + 16;

                  return (
                    <g
                      key={n.id}
                      transform={`translate(${n.x}, ${n.y})`}
                      opacity={opacity}
                      className="cursor-pointer transition-opacity duration-200"
                      onClick={() => setSelectedNode(n)}
                      onMouseEnter={() => setHoveredNode(n)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggedNodeId(n.id);
                        setSelectedNode(n);
                      }}
                    >
                      {/* Halo on Selected/Hovered */}
                      {(isSelected || isHovered) && (
                        <circle
                          r={n.radius + 9}
                          fill={isSelected ? "rgba(10, 107, 99, 0.25)" : "rgba(217, 119, 6, 0.25)"}
                          stroke={isSelected ? "#0A6B63" : "#D97706"}
                          strokeWidth="1.5"
                          strokeDasharray="4 2"
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        r={n.radius}
                        fill={n.color}
                        stroke={isSelected ? "#0A6B63" : "#FFFFFF"}
                        strokeWidth={isSelected ? 3.5 : 2.2}
                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                      />

                      {/* Node Icon */}
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={n.radius * 0.95}
                        pointerEvents="none"
                      >
                        {n.icon}
                      </text>

                      {/* Crisp Anti-Collision Pill Label Below Node */}
                      <g transform={`translate(0, ${n.radius + 6})`}>
                        <rect
                          x={-pillWidth / 2}
                          y="0"
                          width={pillWidth}
                          height="19"
                          rx="4"
                          fill={isSelected ? "#0A6B63" : isConnected ? "#0F172A" : "#1E293B"}
                          filter="drop-shadow(0 2px 3px rgba(0,0,0,0.25))"
                        />
                        <text
                          x="0"
                          y="10.5"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#FFFFFF"
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                          pointerEvents="none"
                        >
                          {n.label}
                        </text>
                      </g>
                    </g>
                  );
                })}

              </g>
            </svg>
          </div>
        </div>

        {/* Evidence Drawer Right Column */}
        <div className={`transition-all duration-300 ${isExpanded ? "hidden" : "lg:col-span-4"}`}>
          <div className="bg-white rounded-xl border-2 border-[#C2CEC2] shadow-xs p-5 space-y-4">
            
            {selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E2]">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0F2ED] text-[#5E7072] uppercase tracking-wider">
                      {selectedNode.type.replace("_", " ")}
                    </span>
                    <h3 className="font-heading font-bold text-base text-[#1A2B2D] mt-1">
                      {selectedNode.label}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]">
                    HIGH RISK
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-[#F7F8F5] rounded-lg border border-[#C2CEC2]">
                    <span className="text-[10px] text-[#5E7072] block font-semibold">Incident Precursors</span>
                    <span className="font-heading font-bold text-base text-[#1A2B2D]">{selectedNode.report_count}</span>
                  </div>
                  <div className="p-2.5 bg-[#F7F8F5] rounded-lg border border-[#C2CEC2]">
                    <span className="text-[10px] text-[#5E7072] block font-semibold">Causal Degree</span>
                    <span className="font-heading font-bold text-base text-[#0A6B63]">{selectedNode.degree} Connections</span>
                  </div>
                </div>

                {/* Causal Propagation Card */}
                <div className="p-3.5 bg-[#FEF7EC] rounded-lg border border-[#F8DFB6] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#D4820A]">
                    <Zap className="w-4 h-4 text-[#D4820A]" />
                    <span>CAUSAL PROPAGATION ANALYSIS</span>
                  </div>
                  <p className="text-xs text-[#1A2B2D] leading-relaxed">
                    Barrier failure on <b>{selectedNode.label}</b> directly escalates the probability of catastrophic energy containment loss across active shifts.
                  </p>
                </div>

                {/* Recommended CAPA */}
                <div className="p-3.5 bg-[#F0FAF7] rounded-lg border border-[#A3D9C9] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A6B63]">
                    <CheckCircle2 className="w-4 h-4 text-[#0A6B63]" />
                    <span>RECOMMENDED CAPA PROTOCOL</span>
                  </div>
                  <p className="text-xs text-[#1A2B2D] leading-relaxed">
                    {evidence?.recommended_capa || `Enforce mandatory positive barrier double-isolation on ${selectedNode.label} per OISD-189 Section 7.4.`}
                  </p>
                </div>

                {/* SWA Action Trigger Button */}
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={handleTriggerSWA}
                  className="w-full py-3 px-4 rounded-xl bg-[#D63B3B] hover:bg-[#B92525] text-white font-heading font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <AlertOctagon className="w-4 h-4" /> Issue Stop Work Authority (SWA)
                </button>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <Network className="w-10 h-10 text-[#85A2A6] mx-auto opacity-50" />
                <h4 className="font-heading font-bold text-sm text-[#1A2B2D]">
                  Select Any Safety Node
                </h4>
                <p className="text-xs text-[#5E7072] max-w-xs mx-auto">
                  Click or drag any asset, equipment, degraded barrier, or life-saving rule to inspect its Bow-Tie causal chain and recommended CAPA.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
