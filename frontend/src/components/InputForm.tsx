import { useState, useEffect } from 'react';
import { MapPin, Activity, Clock, Timer, Search, ChevronDown } from 'lucide-react';
import type { AnalysisRequest } from '../hooks/useHeatAnalysis';

// Curated list of major Indian cities — avoids adding a geocoding API dependency (§2 / §7)
const CITY_OPTIONS = [
  { label: 'New Delhi', lat: 28.6139, lon: 77.209 },
  { label: 'Mumbai', lat: 19.076, lon: 72.8777 },
  { label: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  { label: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { label: 'Kolkata', lat: 22.5726, lon: 88.3639 },
  { label: 'Hyderabad', lat: 17.385, lon: 78.4867 },
  { label: 'Pune', lat: 18.5204, lon: 73.8567 },
  { label: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
  { label: 'Jaipur', lat: 26.9124, lon: 75.7873 },
  { label: 'Lucknow', lat: 26.8467, lon: 80.9462 },
  { label: 'Dehradun', lat: 30.3165, lon: 78.0322 },
  { label: 'Chandigarh', lat: 30.7333, lon: 76.7794 },
  { label: 'Bhopal', lat: 23.2599, lon: 77.4126 },
  { label: 'Patna', lat: 25.5941, lon: 85.1376 },
  { label: 'Nagpur', lat: 21.1458, lon: 79.0882 },
];

const ACTIVITIES = [
  'Running', 'Walking', 'Cycling', 'Hiking', 'Football',
  'Cricket', 'Tennis', 'Construction Work', 'Farming', 'Yoga (Outdoor)',
];

const INTENSITY_LABELS = {
  low: 'Low — Leisurely pace, minimal exertion',
  moderate: 'Moderate — Brisk pace, elevated heart rate',
  high: 'High — Vigorous exertion, heavy sweating',
};

interface InputFormProps {
  onSubmit: (req: AnalysisRequest) => void;
  loading: boolean;
}

function getDefaultDateTime(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  // Format as datetime-local compatible string
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`;
}

export function InputForm({ onSubmit, loading }: InputFormProps) {
  const [cityIndex, setCityIndex] = useState(0);
  const [activity, setActivity] = useState('Running');
  const [intensity, setIntensity] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [plannedTime, setPlannedTime] = useState(getDefaultDateTime());
  const [duration, setDuration] = useState(45);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const city = CITY_OPTIONS[cityIndex];
    onSubmit({
      location: { lat: city.lat, lon: city.lon, label: city.label },
      activity: activity.toLowerCase(),
      activityIntensity: intensity,
      plannedTime: new Date(plannedTime).toISOString(),
      durationMinutes: duration,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#1e2a40] rounded-2xl p-6 border border-[#2d3f5e] space-y-5"
    >
      <h2 className="text-lg font-semibold text-[#e8edf5] flex items-center gap-2">
        <Search size={18} className="text-[#3b82f6]" />
        Plan Your Activity
      </h2>

      {/* Location */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-[#8ea4c8]">
          <MapPin size={14} /> Location
        </label>
        <div className="relative">
          <select
            id="city-select"
            value={cityIndex}
            onChange={(e) => setCityIndex(Number(e.target.value))}
            className="w-full bg-[#0f1623] border border-[#2d3f5e] text-[#e8edf5] rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-[#3b82f6] transition-colors"
          >
            {CITY_OPTIONS.map((c, i) => (
              <option key={c.label} value={i}>{c.label}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ea4c8] pointer-events-none" />
        </div>
        <p className="text-xs text-[#8ea4c8]">
          {CITY_OPTIONS[cityIndex].lat.toFixed(4)}°N, {CITY_OPTIONS[cityIndex].lon.toFixed(4)}°E
        </p>
      </div>

      {/* Activity */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-[#8ea4c8]">
          <Activity size={14} /> Activity
        </label>
        <div className="relative">
          <select
            id="activity-select"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="w-full bg-[#0f1623] border border-[#2d3f5e] text-[#e8edf5] rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-[#3b82f6] transition-colors"
          >
            {ACTIVITIES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ea4c8] pointer-events-none" />
        </div>
      </div>

      {/* Intensity */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#8ea4c8]">Intensity</label>
        <div className="grid grid-cols-3 gap-2">
          {(['low', 'moderate', 'high'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              id={`intensity-${lvl}`}
              onClick={() => setIntensity(lvl)}
              className={`py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                intensity === lvl
                  ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-900/30'
                  : 'bg-[#0f1623] text-[#8ea4c8] border border-[#2d3f5e] hover:border-[#3b82f6]'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#8ea4c8]">{INTENSITY_LABELS[intensity]}</p>
      </div>

      {/* Planned Time */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-[#8ea4c8]">
          <Clock size={14} /> Planned Start Time
        </label>
        <input
          id="planned-time"
          type="datetime-local"
          value={plannedTime}
          onChange={(e) => setPlannedTime(e.target.value)}
          className="w-full bg-[#0f1623] border border-[#2d3f5e] text-[#e8edf5] rounded-xl px-4 py-3 focus:outline-none focus:border-[#3b82f6] transition-colors [color-scheme:dark]"
          required
        />
      </div>

      {/* Duration */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-[#8ea4c8]">
          <Timer size={14} /> Duration — <span className="text-[#e8edf5] font-semibold">{duration} min</span>
        </label>
        <input
          id="duration-slider"
          type="range"
          min={5}
          max={180}
          step={5}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full accent-[#3b82f6]"
        />
        <div className="flex justify-between text-xs text-[#8ea4c8]">
          <span>5 min</span><span>3 hrs</span>
        </div>
      </div>

      {/* Submit */}
      <button
        id="analyze-btn"
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analyzing…
          </>
        ) : (
          <><Search size={16} /> Analyze Heat Risk</>
        )}
      </button>
    </form>
  );
}
