'use client';

import { useState, useEffect } from 'react';
import { Map } from 'lucide-react';

const API = 'http://localhost:8000';

interface HeatmapCell {
  site: string;
  activity: string;
  sif_count: number;
  total_count: number;
  density: number;
  label: string;
}

function DensityCell({ density, sifCount, totalCount }: { density: number; sifCount?: number; totalCount?: number }) {
  const isHigh = density >= 25;
  const isMed = density >= 10 && density < 25;

  let bgClass = "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100";

  if (isHigh) {
    bgClass = "bg-red-50 text-red-800 border-red-200 hover:bg-red-100 font-extrabold";
  } else if (isMed) {
    bgClass = "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 font-bold";
  }

  return (
    <td className={`px-4 py-3.5 text-center border transition-all cursor-pointer ${bgClass}`}>
      <div className="flex items-center justify-center gap-1">
        <span className="font-mono text-sm">{density.toFixed(1)}%</span>
      </div>
      {totalCount !== undefined && totalCount > 0 && (
        <div className="text-[10px] font-mono opacity-70 mt-0.5">
          ({sifCount}/{totalCount} SIFp)
        </div>
      )}
    </td>
  );
}

export default function HeatmapPage() {
  const [data, setData] = useState<{
    sites: string[];
    activities: string[];
    cells: HeatmapCell[];
    site_densities: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/analytics/heatmap`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const getCellData = (site: string, activity: string): HeatmapCell | null => {
    return data?.cells?.find(c => c.site === site && c.activity === activity) || null;
  };

  return (
    <div className="p-8 max-w-[1500px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-red-100 text-red-700 border border-red-200">
              HEADLINE DELIVERABLE
            </span>
            <span className="text-xs font-mono text-slate-400 font-medium">SIH26165 MANDATED OUTCOME</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl lg:text-3xl text-slate-900 tracking-tight">
            SIF-Precursor Density Heatmap Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Ranks corporate well pads and operational activities by SIF-precursor concentration density: (Confirmed SIFp / Total Observations) × 100
          </p>
        </div>

        {/* Legend Pills */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            🔴 HIGH (≥25%)
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            🟡 MEDIUM (10-24%)
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            🟢 LOW (&lt;10%)
          </div>
        </div>
      </div>

      {/* Heatmap Grid Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="py-20 text-center text-slate-400 font-medium animate-pulse">
            Calculating SIF-Precursor density matrix across all sites...
          </div>
        ) : !data || data.sites.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Map className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-lg">No Heatmap Data</h3>
            <p className="text-xs text-slate-400 mt-1">Ingest safety reports to generate risk density calculations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-3.5 px-4 bg-slate-100 text-slate-700 font-bold text-xs uppercase font-mono tracking-wider border border-slate-200 rounded-tl-xl w-64">
                    Site / Asset Name
                  </th>
                  {data.activities.map((act) => (
                    <th key={act} className="text-center py-3.5 px-3 bg-slate-100 text-slate-700 font-bold text-xs uppercase font-mono tracking-wider border border-slate-200">
                      {act}
                    </th>
                  ))}
                  <th className="text-center py-3.5 px-4 bg-slate-200 text-slate-900 font-black text-xs uppercase font-mono tracking-wider border border-slate-300 rounded-tr-xl w-40">
                    SIF Density Rank
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.sites.map((site) => {
                  const siteDensity = data.site_densities?.[site] ?? 0;
                  const isSiteHigh = siteDensity >= 25;
                  const isSiteMed = siteDensity >= 10 && siteDensity < 25;

                  return (
                    <tr key={site} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 text-sm border border-slate-200 bg-white">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          {site}
                        </div>
                      </td>

                      {data.activities.map((act) => {
                        const cell = getCellData(site, act);
                        return (
                          <DensityCell
                            key={act}
                            density={cell?.density || 0}
                            sifCount={cell?.sif_count}
                            totalCount={cell?.total_count}
                          />
                        );
                      })}

                      {/* Summary Site Column */}
                      <td className={`py-3 px-4 text-center font-mono font-black text-sm border border-slate-300 ${
                        isSiteHigh ? 'bg-red-100 text-red-900' : isSiteMed ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {siteDensity.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
