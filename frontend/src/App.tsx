import { useState } from 'react';
import { Shield, Github } from 'lucide-react';
import { InputForm } from './components/InputForm';
import { RiskDisplay } from './components/RiskDisplay';
import { AIRecommendation } from './components/AIRecommendation';
import { WhatIfSlider } from './components/WhatIfSlider';
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

  const handleWhatIfChange = (updatedReq: AnalysisRequest) => {
    analyze(updatedReq);
  };

  return (
    <div className="min-h-screen bg-[#0f1623] text-[#e8edf5]">
      {/* Header */}
      <header className="border-b border-[#2d3f5e] bg-[#0f1623]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
              <Shield size={22} className="text-orange-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#e8edf5] leading-tight">HeatShield</h1>
              <p className="text-xs text-[#8ea4c8] leading-tight">Heat Risk Calculator</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-[#8ea4c8] bg-[#1e2a40] border border-[#2d3f5e] px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Powered by Open-Meteo + NDMA Guidelines
            </span>
            <a
              href="https://github.com"
              aria-label="GitHub"
              className="p-2 rounded-xl border border-[#2d3f5e] text-[#8ea4c8] hover:text-[#e8edf5] hover:border-[#3b82f6] transition-colors"
            >
              <Github size={16} />
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full mb-4">
            <Shield size={12} />
            Decision-support tool · Not a medical device
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#e8edf5] mb-3 leading-tight">
            Is your outdoor activity{' '}
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              heat-safe?
            </span>
          </h2>
          <p className="text-[#8ea4c8] text-base leading-relaxed">
            Enter your location, activity, and timing. HeatShield runs a deterministic risk
            calculation using real weather data — then explains it with AI grounded in
            NDMA &amp; WHO guidelines.
          </p>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
          {/* Left: Input Form */}
          <div className="space-y-4">
            <InputForm onSubmit={handleSubmit} loading={loading} />

            {/* Methodology note */}
            <div className="bg-[#1e2a40]/60 rounded-xl p-4 border border-[#2d3f5e] text-xs text-[#8ea4c8] space-y-1">
              <p className="font-medium text-[#e8edf5]">How it works</p>
              <p>① Real-time weather fetched from Open-Meteo</p>
              <p>② Heat Index computed via Rothfusz formula</p>
              <p>③ Modifiers applied for intensity, duration &amp; time-of-day</p>
              <p>④ Risk Level 1–4 determined — <span className="text-orange-400 font-medium">AI never alters this</span></p>
              <p>⑤ AI synthesizes explanation from NDMA/WHO guidelines</p>
            </div>
          </div>

          {/* Right: Results Panel */}
          <div className="space-y-4">
            {loading && <LoadingState />}

            {!loading && error && (
              <ErrorState message={error} onRetry={() => { if (lastRequest) analyze(lastRequest); else reset(); }} />
            )}

            {!loading && !error && result && (
              <>
                <RiskDisplay result={result} />
                <AIRecommendation result={result} />
                {lastRequest && (
                  <WhatIfSlider
                    baseRequest={lastRequest}
                    onTimeChange={handleWhatIfChange}
                    loading={loading}
                  />
                )}
              </>
            )}

            {!loading && !error && !result && (
              <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
                <div className="p-5 rounded-2xl bg-[#1e2a40] border border-[#2d3f5e]">
                  <Shield size={40} className="text-[#2d3f5e]" />
                </div>
                <div>
                  <p className="text-[#e8edf5] font-medium mb-1">Ready to analyze</p>
                  <p className="text-[#8ea4c8] text-sm">
                    Fill in your activity details and click <strong>Analyze Heat Risk</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#2d3f5e] mt-16 py-6 text-center text-xs text-[#8ea4c8]">
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
