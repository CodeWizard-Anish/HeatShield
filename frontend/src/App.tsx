import { useState } from 'react';
import { Code, Shield } from 'lucide-react';
import { InputForm } from './components/InputForm';
import { RiskDisplay } from './components/RiskDisplay';
import { AIRecommendation } from './components/AIRecommendation';
import { HourlyTimeline } from './components/HourlyTimeline';
import { ErrorState } from './components/ErrorState';
import { LoadingState } from './components/LoadingState';
import { useHeatAnalysis } from './hooks/useHeatAnalysis';
import type { AnalysisRequest } from './hooks/useHeatAnalysis';

function App() {
  const { result, loading, error, analyze, reset } = useHeatAnalysis();
  const [lastRequest, setLastRequest] = useState<AnalysisRequest | null>(null);

  const handleSubmit = (req: AnalysisRequest) => {
    setLastRequest(req);
    analyze(req);
  };

  const handleTimeChange = (updatedReq: AnalysisRequest) => {
    analyze(updatedReq);
  };

  return (
    <div className="min-h-screen bg-amber-50 text-stone-800">
      {/* ── Header ── */}
      <header className="border-b border-orange-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm shadow-orange-900/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-md shadow-orange-500/30">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-900 leading-tight">HeatShield</h1>
              <p className="text-xs text-stone-500 leading-tight">Heat Risk Calculator</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500 bg-white border border-orange-100 px-3 py-1.5 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Powered by Open-Meteo + NDMA Guidelines
            </span>
            <a
              href="https://github.com"
              aria-label="View source code"
              className="p-2 rounded-xl border border-orange-100 text-stone-500 hover:text-orange-600 hover:border-orange-300 transition-colors bg-white shadow-sm"
            >
              <Code size={16} />
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full mb-4">
            <Shield size={12} />
            Decision-support tool · Not a medical device
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900 mb-3 leading-tight">
            Is your outdoor activity{' '}
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              heat-safe?
            </span>
          </h2>
          <p className="text-stone-500 text-base leading-relaxed">
            Enter your location, activity, and timing. HeatShield runs a deterministic risk
            calculation using real weather data — then explains it with AI grounded in
            NDMA &amp; WHO guidelines.
          </p>
        </div>

        {/* ── Main Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
          {/* Left: Input Form */}
          <div className="space-y-4">
            <InputForm onSubmit={handleSubmit} loading={loading} />

            {/* Methodology note */}
            <div className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm shadow-orange-900/5 text-xs text-stone-500 space-y-1.5">
              <p className="font-semibold text-stone-700">How it works</p>
              <p>① Real-time weather fetched from Open-Meteo</p>
              <p>② Heat Index computed via Rothfusz formula</p>
              <p>③ Modifiers applied for intensity, duration &amp; time-of-day</p>
              <p>
                ④ Risk Level 1–4 determined —{' '}
                <span className="text-orange-600 font-semibold">AI never alters this</span>
              </p>
              <p>⑤ AI synthesizes explanation from NDMA/WHO guidelines</p>
            </div>
          </div>

          {/* Right: Results Panel */}
          <div className="space-y-4">
            {/* Skeleton — initial load only */}
            {loading && !result && <LoadingState />}

            {!loading && error && (
              <ErrorState
                message={error}
                onRetry={() => { if (lastRequest) analyze(lastRequest); else reset(); }}
              />
            )}

            {/* Keep results mounted; dim while re-fetching (What-If / timeline) */}
            {result && (
              <div
                className={`space-y-4 transition-opacity duration-200 ${
                  loading ? 'opacity-50 pointer-events-none' : 'opacity-100'
                }`}
              >
                <RiskDisplay result={result} />
                <AIRecommendation result={result} />
                {lastRequest && (
                  <HourlyTimeline
                    baseRequest={lastRequest}
                    onHourSelect={handleTimeChange}
                    loading={loading}
                  />
                )}
              </div>
            )}

            {/* Initial empty state */}
            {!loading && !error && !result && (
              <div className="flex flex-col items-center justify-center h-72 text-center gap-4 rounded-2xl border-2 border-dashed border-orange-200 bg-white/50">
                <div className="p-5 rounded-2xl bg-orange-50 border border-orange-200">
                  <Shield size={36} className="text-orange-300" />
                </div>
                <div>
                  <p className="text-stone-700 font-semibold mb-1">Ready to analyze</p>
                  <p className="text-stone-500 text-sm">
                    Fill in your activity details and click{' '}
                    <strong className="text-orange-600">Analyze Heat Risk</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-orange-100 mt-16 py-6 text-center text-xs text-stone-400 bg-white/60">
        <p>
          HeatShield uses deterministic meteorological formulas + NDMA/WHO guideline excerpts.
          <br />
          This tool does not provide medical advice. Consult a healthcare professional in emergencies.
        </p>
      </footer>
    </div>
  );
}

export default App;