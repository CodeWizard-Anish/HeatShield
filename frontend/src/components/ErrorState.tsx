import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col items-center gap-4 text-center shadow-sm shadow-red-100">
      <div className="p-3 rounded-full bg-red-100 border border-red-200">
        <AlertTriangle size={28} className="text-red-600" />
      </div>
      <div>
        <h3 className="text-red-700 font-semibold mb-1">Analysis Failed</h3>
        <p className="text-stone-500 text-sm leading-relaxed max-w-sm">{message}</p>
      </div>
      <button
        id="retry-btn"
        onClick={onRetry}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-red-200 text-stone-700 text-sm font-medium hover:border-orange-400 hover:text-orange-600 transition-colors"
      >
        <RefreshCw size={14} />
        Try Again
      </button>
    </div>
  );
}
