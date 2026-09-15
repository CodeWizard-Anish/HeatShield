import { Thermometer, Droplets, Sun, Wind, ShieldAlert, ShieldCheck, ShieldX, Zap } from 'lucide-react';
import type { AnalysisResult } from '../hooks/useHeatAnalysis';

const RISK_CONFIG = {
  1: {
    label: 'Low Risk',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-900/40',
    bar: 'bg-emerald-400',
    icon: ShieldCheck,
    description: 'Conditions are safe for your planned activity.',
  },
  2: {
    label: 'Moderate Risk',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    glow: 'shadow-yellow-900/40',
    bar: 'bg-yellow-400',
    icon: ShieldAlert,
    description: 'Proceed with caution and standard heat-safety practices.',
  },
  3: {
    label: 'High Risk',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    glow: 'shadow-orange-900/40',
    bar: 'bg-orange-400',
    icon: ShieldAlert,
    description: 'Serious heat exhaustion risk. Modify or postpone your activity.',
  },
  4: {
    label: 'Extreme Risk',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    glow: 'shadow-red-900/40',
    bar: 'bg-red-400',
    icon: ShieldX,
    description: 'Life-threatening heat conditions. Suspend outdoor activity.',
  },
};

interface RiskDisplayProps {
  result: AnalysisResult;
}

function WeatherCard({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number | string;
  unit: string;
}) {
  return (
    <div className="bg-[#0f1623] rounded-xl p-4 border border-[#2d3f5e] flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[#8ea4c8] text-xs font-medium">
        <Icon size={13} />
        {label}
      </div>
      <div className="text-xl font-bold text-[#e8edf5]">
        {value}<span className="text-sm font-normal text-[#8ea4c8] ml-0.5">{unit}</span>
      </div>
    </div>
  );
}

export function RiskDisplay({ result }: RiskDisplayProps) {
  const { riskLevel, riskLabel, weatherSnapshot } = result;
  const cfg = RISK_CONFIG[riskLevel];
  const Icon = cfg.icon;
  const barWidth = `${(riskLevel / 4) * 100}%`;

  return (
    <div className="space-y-4">
      {/* Risk Badge */}
      <div
        className={`rounded-2xl p-6 border ${cfg.bg} ${cfg.border} shadow-xl ${cfg.glow} flex items-center gap-5`}
      >
        <div className={`p-4 rounded-2xl ${cfg.bg} border ${cfg.border}`}>
          <Icon size={36} className={cfg.color} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className={`text-3xl font-black ${cfg.color}`}>{cfg.label}</span>
            <span className="text-[#8ea4c8] text-sm font-medium">(Level {riskLevel}/4)</span>
          </div>
          <p className="text-[#8ea4c8] text-sm">{cfg.description}</p>
          {/* Risk bar */}
          <div className="mt-3 h-2 bg-[#0f1623] rounded-full overflow-hidden">
            <div
              className={`h-full ${cfg.bar} rounded-full transition-all duration-700`}
              style={{ width: barWidth }}
            />
          </div>
        </div>
      </div>

      {/* Apparent Temperature Callout */}
      <div className="bg-[#1e2a40] rounded-xl px-5 py-4 border border-[#2d3f5e] flex items-center justify-between">
        <div>
          <p className="text-xs text-[#8ea4c8] font-medium uppercase tracking-wide">Apparent Temperature</p>
          <p className={`text-4xl font-black mt-0.5 ${cfg.color}`}>
            {weatherSnapshot.apparentTemperatureC}°C
          </p>
        </div>
        <div className="flex items-center gap-1 text-[#8ea4c8]">
          <Zap size={14} className={cfg.color} />
          <span className="text-sm">Feels Like</span>
        </div>
      </div>

      {/* Weather Snapshot Cards */}
      <div className="grid grid-cols-2 gap-3">
        <WeatherCard icon={Thermometer} label="Air Temp" value={weatherSnapshot.temperatureC} unit="°C" />
        <WeatherCard icon={Droplets} label="Humidity" value={weatherSnapshot.humidityPercent} unit="%" />
        <WeatherCard icon={Sun} label="UV Index" value={weatherSnapshot.uvIndex} unit="" />
        <WeatherCard icon={Wind} label="Wind" value={weatherSnapshot.windSpeedKmh} unit=" km/h" />
      </div>
    </div>
  );
}
