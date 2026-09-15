import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import type { AnalysisRequest } from '../hooks/useHeatAnalysis';

interface WhatIfSliderProps {
  baseRequest: AnalysisRequest;
  onTimeChange: (updatedReq: AnalysisRequest) => void;
  loading: boolean;
}

export function WhatIfSlider({ baseRequest, onTimeChange, loading }: WhatIfSliderProps) {
  const [offsetHours, setOffsetHours] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When offset changes, debounce and re-trigger analysis
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const baseMs = new Date(baseRequest.plannedTime).getTime();
      const adjustedMs = baseMs + offsetHours * 60 * 60 * 1000;
      onTimeChange({
        ...baseRequest,
        plannedTime: new Date(adjustedMs).toISOString(),
      });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [offsetHours]);

  const adjustedTime = new Date(
    new Date(baseRequest.plannedTime).getTime() + offsetHours * 60 * 60 * 1000
  );

  const formattedTime = adjustedTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const offsetLabel =
    offsetHours === 0
      ? 'Original time'
      : offsetHours > 0
      ? `+${offsetHours}h later`
      : `${offsetHours}h earlier`;

  return (
    <div className="bg-[#1e2a40] rounded-2xl p-5 border border-[#2d3f5e]">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#8ea4c8] mb-4 uppercase tracking-wide">
        <Clock size={15} className="text-[#3b82f6]" />
        What-If Time Explorer
      </h3>

      <div className="flex items-center justify-between mb-3">
        <span className="text-[#8ea4c8] text-sm">{offsetLabel}</span>
        <span className="text-[#e8edf5] font-semibold flex items-center gap-1.5">
          {loading && (
            <span className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
          )}
          {formattedTime}
        </span>
      </div>

      <input
        id="whatif-slider"
        type="range"
        min={-4}
        max={8}
        step={1}
        value={offsetHours}
        onChange={(e) => setOffsetHours(Number(e.target.value))}
        className="w-full accent-[#3b82f6]"
      />

      <div className="flex justify-between text-xs text-[#8ea4c8] mt-1.5">
        <span>−4h earlier</span>
        <span className="text-[#3b82f6] font-medium">Now</span>
        <span>+8h later</span>
      </div>

      <p className="text-xs text-[#8ea4c8] mt-3 opacity-70">
        Drag to explore how heat risk changes at different times. Re-analysis triggers automatically.
      </p>
    </div>
  );
}
