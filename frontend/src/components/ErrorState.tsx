import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
      <div className="p-3 rounded-full bg-red-500/15 border border-red-500/30">
        <AlertTriangle size={28} className="text-red-400" />
      </div>
      <div>
        <h3 className="text-red-400 font-semibold mb-1">Analysis Failed</h3>
        <p className="text-[#8ea4c8] text-sm leading-relaxed max-w-sm">{message}</p>
      </div>
      <button
        id="retry-btn"
        onClick={onRetry}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e2a40] border border-[#2d3f5e] text-[#e8edf5] text-sm font-medium hover:border-[#3b82f6] transition-colors"
      >
        <RefreshCw size={14} />
        Try Again
      </button>
    </div>
  );
}
