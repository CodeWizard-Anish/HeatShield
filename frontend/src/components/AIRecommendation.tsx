import { Brain, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';
import type { AnalysisResult } from '../hooks/useHeatAnalysis';

interface AIRecommendationProps {
  result: AnalysisResult;
}

export function AIRecommendation({ result }: AIRecommendationProps) {
  const { explanation, precautions, recommendedAlternatives, citations } = result;

  return (
    <div className="space-y-4">
      {/* Explanation */}
      <div className="bg-[#1e2a40] rounded-2xl p-5 border border-[#2d3f5e]">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#8ea4c8] mb-3 uppercase tracking-wide">
          <Brain size={15} className="text-[#3b82f6]" />
          AI Analysis
        </h3>
        <p className="text-[#e8edf5] leading-relaxed">{explanation}</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-[#8ea4c8]">
          <BookOpen size={12} />
          Grounded in {citations.length} authoritative source{citations.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Precautions */}
      <div className="bg-[#1e2a40] rounded-2xl p-5 border border-[#2d3f5e]">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#8ea4c8] mb-3 uppercase tracking-wide">
          <CheckCircle2 size={15} className="text-emerald-400" />
          Precautions
        </h3>
        <ul className="space-y-2.5">
          {precautions.map((p, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-[#e8edf5] text-sm leading-relaxed">{p}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Alternatives */}
      <div className="bg-[#1e2a40] rounded-2xl p-5 border border-[#2d3f5e]">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#8ea4c8] mb-3 uppercase tracking-wide">
          <ArrowRight size={15} className="text-[#6366f1]" />
          Safer Alternatives
        </h3>
        <ul className="space-y-2">
          {recommendedAlternatives.map((alt, i) => (
            <li
              key={i}
              className="flex items-start gap-3 py-2.5 px-3 rounded-xl bg-[#0f1623] border border-[#2d3f5e]"
            >
              <ArrowRight size={14} className="mt-0.5 flex-shrink-0 text-[#6366f1]" />
              <span className="text-[#e8edf5] text-sm leading-relaxed">{alt}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Citations */}
      <div className="bg-[#1e2a40] rounded-2xl p-5 border border-[#2d3f5e]">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#8ea4c8] mb-3 uppercase tracking-wide">
          <BookOpen size={15} className="text-[#8ea4c8]" />
          Citations
        </h3>
        <ul className="space-y-2">
          {citations.map((c, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span className="text-[#8ea4c8] font-mono text-xs bg-[#0f1623] px-2 py-0.5 rounded border border-[#2d3f5e]">
                {c.excerptRef}
              </span>
              <span className="text-[#8ea4c8]">{c.source}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
