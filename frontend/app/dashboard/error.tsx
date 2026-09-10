'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard Error Boundary caught exception:', error);
  }, [error]);

  return (
    <div className="dashboard-page flex items-center justify-center min-h-[60vh] p-6">
      <div className="max-w-md w-full bg-white p-6 rounded-2xl border-2 border-[#C2CEC2] shadow-md text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-xl bg-[#FEF7EC] border border-[#F8DFB6] flex items-center justify-center text-[#D4820A]">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-heading font-bold text-[#1A2B2D]">
            Dashboard Module Interruption
          </h2>
          <p className="text-xs text-[#5E7072] leading-relaxed">
            This module encountered an issue while rendering live metrics. Other command center modules remain active.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#0A6B63] hover:bg-[#085B54] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reload This Module
          </button>
        </div>
      </div>
    </div>
  );
}
