import { Thermometer, Droplets, Sun, Wind, ShieldAlert, ShieldCheck, ShieldX, Zap, AlertTriangle } from 'lucide-react';
import type { AnalysisResult } from '../hooks/useHeatAnalysis';

const RISK_CONFIG = {
  1: {
    label: 'Low Risk',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    shadow: 'shadow-emerald-100',
    bar: 'bg-emerald-500',
    badgeBg: 'bg-emerald-500',
    icon: ShieldCheck,
    description: 'Conditions are safe for your planned activity.',
  },
  2: {
    label: 'Moderate Risk',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    shadow: 'shadow-amber-100',
    bar: 'bg-amber-500',
    badgeBg: 'bg-amber-500',
    icon: ShieldAlert,
    description: 'Proceed with caution and standard heat-safety practices.',
  },
  3: {
    label: 'High Risk',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    shadow: 'shadow-orange-100',
    bar: 'bg-orange-500',
    badgeBg: 'bg-orange-500',
    icon: ShieldAlert,
    description: 'Serious heat exhaustion risk. Modify or postpone your activity.',
  },
  4: {
    label: 'Extreme Risk',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    shadow: 'shadow-red-100',
    bar: 'bg-red-500',
    badgeBg: 'bg-red-600',
    icon: ShieldX,
    description: 'Life-threatening heat conditions. Suspend outdoor activity.',
  },
};

const UV_HIGH_THRESHOLD = 6;

interface RiskDisplayProps {
  result: AnalysisResult;
}

function WeatherCard({
  icon: Icon,
  label,
  value,
  unit,
  highlight,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number | string;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border flex flex-col gap-1 transition-colors ${
        highlight
          ? 'bg-red-50 border-red-200'
          : 'bg-white border-orange-100 shadow-sm shadow-orange-900/5'
      }`}
    >
      <div className={`flex items-center gap-1.5 text-xs font-medium ${highlight ? 'text-red-600' : 'text-stone-500'}`}>
        <Icon size={13} />
        {label}
      </div>
      <div className={`text-xl font-bold ${highlight ? 'text-red-700' : 'text-stone-800'}`}>
        {value}
        <span className={`text-sm font-normal ml-0.5 ${highlight ? 'text-red-500' : 'text-stone-400'}`}>{unit}</span>
      </div>
    </div>
  );
}

export function RiskDisplay({ result }: RiskDisplayProps) {
  const { riskLevel, weatherSnapshot } = result;
  const cfg = RISK_CONFIG[riskLevel];
  const Icon = cfg.icon;
  const barWidth = `${(riskLevel / 4) * 100}%`;
  const highUV = weatherSnapshot.uvIndex > UV_HIGH_THRESHOLD;

  return (
    <div className="space-y-4">
      {/* ── High UV Alert (independent of temperature risk) ── */}
      {highUV && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600 text-white shadow-md shadow-red-500/30">
          <AlertTriangle size={18} className="flex-shrink-0" />
          <div>
            <span className="font-semibold text-sm">High UV Alert</span>
            <span className="text-red-100 text-xs ml-2">
              UV Index {weatherSnapshot.uvIndex} — wear SPF 50+ sunscreen and protective clothing
            </span>
          </div>
        </div>
      )}

      {/* ── Risk Badge ── */}
      <div
        className={`rounded-2xl p-6 border ${cfg.bg} ${cfg.border} shadow-lg ${cfg.shadow} flex items-center gap-5`}
      >
        <div className={`p-4 rounded-2xl ${cfg.badgeBg} shadow-md`}>
          <Icon size={36} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className={`text-3xl font-black ${cfg.color}`}>{cfg.label}</span>
            <span className="text-stone-400 text-sm font-medium">(Level {riskLevel}/4)</span>
          </div>
          <p className="text-stone-500 text-sm">{cfg.description}</p>
          {/* Risk bar */}
          <div className="mt-3 h-2.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${cfg.bar} rounded-full transition-all duration-700`}
              style={{ width: barWidth }}
            />
          </div>
          <div className="flex justify-between text-xs text-stone-400 mt-1">
            <span>Low</span>
            <span>Moderate</span>
            <span>High</span>
            <span>Extreme</span>
          </div>
        </div>
      </div>

      {/* ── Apparent Temperature Callout ── */}
      <div
        className={`rounded-xl px-5 py-4 border ${cfg.border} ${cfg.bg} flex items-center justify-between`}
      >
        <div>
          <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">
            Apparent Temperature (Feels Like)
          </p>
          <p className={`text-5xl font-black mt-1 ${cfg.color}`}>
            {weatherSnapshot.apparentTemperatureC}°C
          </p>
          <p className="text-xs text-stone-400 mt-0.5">
            Air: {weatherSnapshot.temperatureC}°C + Activity &amp; Humidity Load
          </p>
        </div>
        <div className={`p-3 rounded-xl ${cfg.bg} border ${cfg.border}`}>
          <Zap size={24} className={cfg.color} />
        </div>
      </div>

      {/* ── Weather Snapshot Cards ── */}
      <div className="grid grid-cols-2 gap-3">
        <WeatherCard icon={Thermometer} label="Air Temperature" value={weatherSnapshot.temperatureC} unit="°C" />
        <WeatherCard icon={Droplets} label="Humidity" value={weatherSnapshot.humidityPercent} unit="%" />
        <WeatherCard
          icon={Sun}
          label="UV Index"
          value={weatherSnapshot.uvIndex}
          unit={highUV ? ' ⚠' : ''}
          highlight={highUV}
        />
        <WeatherCard icon={Wind} label="Wind Speed" value={weatherSnapshot.windSpeedKmh} unit=" km/h" />
      </div>
    </div>
  );
}
