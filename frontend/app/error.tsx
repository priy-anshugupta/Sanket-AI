'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application Error Boundary caught exception:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8F5] p-6">
      <div className="max-w-md w-full bg-white p-6 rounded-2xl border-2 border-[#C2CEC2] shadow-md text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-xl bg-[#FDF2F2] border border-[#F5C6C6] flex items-center justify-center text-[#D63B3B]">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-heading font-bold text-[#1A2B2D]">
            Console Module Interruption
          </h2>
          <p className="text-xs text-[#5E7072] leading-relaxed">
            The operational workstation experienced a temporary rendering condition. Core safety telemetry remains secure.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A6B63] hover:bg-[#085B54] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reload Operational Console
          </button>
        </div>
      </div>
    </div>
  );
}
