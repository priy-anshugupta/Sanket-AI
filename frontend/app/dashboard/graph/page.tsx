'use client';

import { useState, useEffect, useRef } from 'react';

const API = 'http://localhost:8000';

interface GraphNode {
  data: { id: string; label: string; type: string; report_count: number; severity: string };
}
interface GraphEdge {
  data: { id: string; source: string; target: string; weight: number; edge_type: string };
}

const TYPE_COLORS: Record<string, string> = {
  EQUIPMENT: '#3B82F6',
  LOCATION: '#8B5CF6',
  BARRIER_FAILURE: '#EF4444',
  ENERGY_SOURCE: '#F59E0B',
  LSR_VIOLATION: '#DC2626',
  SHIFT_TIME: '#6B7280',
  WEATHER_CONDITION: '#06B6D4',
  PPE_STATUS: '#10B981',
  BODY_PART: '#EC4899',
};

export default function GraphPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch(`${API}/api/graph/signals`)
      .then(r => r.json())
      .then(d => {
        setNodes(d.nodes || []);
        setEdges(d.edges || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Simple force-directed layout visualization
  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    // Assign random positions
    const positions: Record<string, { x: number; y: number }> = {};
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      const radius = Math.min(w, h) * 0.35;
      positions[node.data.id] = {
        x: w / 2 + radius * Math.cos(angle) + (Math.random() - 0.5) * 40,
        y: h / 2 + radius * Math.sin(angle) + (Math.random() - 0.5) * 40,
      };
    });

    // Simple force simulation (a few iterations)
    for (let iter = 0; iter < 50; iter++) {
      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = positions[nodes[i].data.id];
          const b = positions[nodes[j].data.id];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 500 / (dist * dist);
          a.x -= (dx / dist) * force;
          a.y -= (dy / dist) * force;
          b.x += (dx / dist) * force;
          b.y += (dy / dist) * force;
        }
      }

      // Attraction (edges)
      edges.forEach(edge => {
        const a = positions[edge.data.source];
        const b = positions[edge.data.target];
        if (!a || !b) return;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = dist * 0.01;
        a.x += (dx / dist) * force;
        a.y += (dy / dist) * force;
        b.x -= (dx / dist) * force;
        b.y -= (dy / dist) * force;
      });

      // Center gravity
      nodes.forEach(node => {
        const p = positions[node.data.id];
        p.x += (w / 2 - p.x) * 0.01;
        p.y += (h / 2 - p.y) * 0.01;
        // Bound
        p.x = Math.max(40, Math.min(w - 40, p.x));
        p.y = Math.max(40, Math.min(h - 40, p.y));
      });
    }

    // Draw
    ctx.clearRect(0, 0, w, h);

    // Draw edges
    edges.forEach(edge => {
      const a = positions[edge.data.source];
      const b = positions[edge.data.target];
      if (!a || !b) return;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = 'rgba(148,163,184,0.3)';
      ctx.lineWidth = Math.min(edge.data.weight, 4);
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach(node => {
      const p = positions[node.data.id];
      const color = TYPE_COLORS[node.data.type] || '#6B7280';
      const size = 6 + Math.min(node.data.report_count * 2, 12);

      // Glow for high severity
      if (node.data.severity === 'HIGH') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, size + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(220,38,38,0.15)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#374151';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.data.label, p.x, p.y + size + 12);
    });

    // Click handler
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      for (const node of nodes) {
        const p = positions[node.data.id];
        const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
        if (dist < 15) {
          setSelectedNode(node);
          return;
        }
      }
      setSelectedNode(null);
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [nodes, edges]);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-display font-bold text-gray-900">Safety Signal Knowledge Graph</h1>
        <p className="text-sm text-gray-500 mt-1">
          Interactive network showing connections between equipment, locations, barriers, and IOGP rule violations.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-600">{type.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Canvas */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 relative overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">Loading graph...</div>
          ) : nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <span className="text-4xl mb-3">🕸️</span>
              <p className="text-sm">No graph data yet. Process reports to build the knowledge graph.</p>
            </div>
          ) : (
            <canvas ref={canvasRef} className="w-full h-full" style={{ minHeight: 500 }} />
          )}
        </div>

        {/* Side Panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {selectedNode ? 'Node Details' : 'Graph Stats'}
          </h3>

          {selectedNode ? (
            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold">Node</div>
                <div className="text-sm font-medium text-gray-900">{selectedNode.data.label}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold">Type</div>
                <div className="text-xs px-2 py-1 rounded-full inline-block" style={{
                  backgroundColor: TYPE_COLORS[selectedNode.data.type] + '20',
                  color: TYPE_COLORS[selectedNode.data.type],
                }}>
                  {selectedNode.data.type}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold">Report Count</div>
                <div className="font-mono text-lg font-bold text-gray-900">{selectedNode.data.report_count}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold">Severity</div>
                <div className={`text-xs font-semibold ${
                  selectedNode.data.severity === 'HIGH' ? 'text-red-600' :
                  selectedNode.data.severity === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'
                }`}>{selectedNode.data.severity}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-gray-50">
                <div className="font-mono text-xl font-bold text-gray-900">{nodes.length}</div>
                <div className="text-xs text-gray-500">Total Nodes</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <div className="font-mono text-xl font-bold text-gray-900">{edges.length}</div>
                <div className="text-xs text-gray-500">Total Edges</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
