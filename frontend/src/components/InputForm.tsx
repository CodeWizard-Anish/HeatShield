import { useState, useEffect, useRef } from 'react';
import { MapPin, Activity, Clock, Timer, Search, X, Loader2 } from 'lucide-react';
import type { AnalysisRequest } from '../hooks/useHeatAnalysis';

// ── Activity → Default Intensity Mapping (Phase 2) ───────────────────────────
const ACTIVITY_INTENSITY_MAP: Record<string, 'low' | 'moderate' | 'high'> = {
  'Running':           'high',
  'Walking':           'moderate',
  'Cycling':           'high',
  'Hiking':            'high',
  'Football':          'high',
  'Cricket':           'moderate',
  'Tennis':            'high',
  'Construction Work': 'high',
  'Farming':           'moderate',
  'Yoga (Outdoor)':   'low',
  'Resting':           'low',
};

const ACTIVITIES = Object.keys(ACTIVITY_INTENSITY_MAP);

const INTENSITY_LABELS = {
  low:      'Low — Leisurely pace, minimal exertion',
  moderate: 'Moderate — Brisk pace, elevated heart rate',
  high:     'High — Vigorous exertion, heavy sweating',
};

// ── Default location: Dehradun ────────────────────────────────────────────────
const DEFAULT_LOCATION = { label: 'Dehradun', lat: 30.3165, lon: 78.0322 };

interface GeoResult {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

interface InputFormProps {
  onSubmit: (req: AnalysisRequest) => void;
  loading: boolean;
}

function getDefaultDateTime(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`;
}

export function InputForm({ onSubmit, loading }: InputFormProps) {
  // ── Location autocomplete state ──────────────────────────────────────────
  const [query, setQuery] = useState(DEFAULT_LOCATION.label);
  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_LOCATION);
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ── Activity + auto-intensity state ─────────────────────────────────────
  const [activity, setActivity] = useState('Running');
  const [intensity, setIntensity] = useState<'low' | 'moderate' | 'high'>('high');
  const [manualIntensity, setManualIntensity] = useState(false);

  // ── Other form state ─────────────────────────────────────────────────────
  const [plannedTime, setPlannedTime] = useState(getDefaultDateTime());
  const [duration, setDuration] = useState(45);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced geocode search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Don't re-search if the query matches the already-selected location
    if (trimmed === selectedLocation.label) return;

    debounceRef.current = setTimeout(async () => {
      setGeoLoading(true);
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=5&language=en&format=json`
        );
        const data = await res.json();
        setSuggestions(data.results ?? []);
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
      } finally {
        setGeoLoading(false);
      }
    }, 350);
  }, [query]);

  // Auto-intensity: snap when activity changes (unless user manually overrode)
  useEffect(() => {
    if (!manualIntensity) {
      setIntensity(ACTIVITY_INTENSITY_MAP[activity] ?? 'moderate');
    }
  }, [activity]);

  const handleSelectSuggestion = (geo: GeoResult) => {
    const label = geo.admin1 ? `${geo.name}, ${geo.admin1}, ${geo.country}` : `${geo.name}, ${geo.country}`;
    setQuery(label);
    setSelectedLocation({ label, lat: geo.latitude, lon: geo.longitude });
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleIntensityClick = (lvl: 'low' | 'moderate' | 'high') => {
    setIntensity(lvl);
    setManualIntensity(true); // user explicitly overrode
  };

  const handleActivityChange = (newActivity: string) => {
    setActivity(newActivity);
    setManualIntensity(false); // reset override on activity change
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      location: {
        lat: selectedLocation.lat,
        lon: selectedLocation.lon,
        label: selectedLocation.label,
      },
      activity: activity.toLowerCase(),
      activityIntensity: intensity,
      plannedTime: new Date(plannedTime).toISOString(),
      durationMinutes: duration,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-6 border border-orange-100 shadow-md shadow-orange-900/5 space-y-5"
    >
      <h2 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
        <Search size={18} className="text-orange-500" />
        Plan Your Activity
      </h2>

      {/* ── Location Autocomplete ── */}
      <div className="space-y-1.5" ref={wrapperRef}>
        <label className="flex items-center gap-1.5 text-sm font-medium text-stone-500">
          <MapPin size={14} /> Location
        </label>
        <div className="relative">
          <div className="relative">
            <input
              id="location-search"
              type="text"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              placeholder="Search any city worldwide…"
              className="w-full bg-white border border-orange-200 text-stone-800 rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all placeholder:text-stone-400"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {geoLoading ? (
                <Loader2 size={15} className="text-orange-400 animate-spin" />
              ) : query && query !== selectedLocation.label ? (
                <button
                  type="button"
                  onClick={() => { setQuery(selectedLocation.label); setSuggestions([]); setShowDropdown(false); }}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <X size={15} />
                </button>
              ) : (
                <MapPin size={15} className="text-orange-400" />
              )}
            </div>
          </div>

          {/* Suggestions dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1.5 w-full bg-white border border-orange-100 rounded-xl shadow-lg shadow-orange-900/10 overflow-hidden">
              {suggestions.map((geo) => {
                const label = geo.admin1
                  ? `${geo.name}, ${geo.admin1}, ${geo.country}`
                  : `${geo.name}, ${geo.country}`;
                return (
                  <li key={geo.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectSuggestion(geo)}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-orange-50 transition-colors flex items-center gap-2.5"
                    >
                      <MapPin size={13} className="text-orange-400 flex-shrink-0" />
                      <span className="text-stone-700">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selectedLocation && (
          <p className="text-xs text-stone-400">
            {selectedLocation.lat.toFixed(4)}°N, {selectedLocation.lon.toFixed(4)}°E
          </p>
        )}
      </div>

      {/* ── Activity ── */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-stone-500">
          <Activity size={14} /> Activity
        </label>
        <div className="relative">
          <select
            id="activity-select"
            value={activity}
            onChange={(e) => handleActivityChange(e.target.value)}
            className="w-full bg-white border border-orange-200 text-stone-800 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all"
          >
            {ACTIVITIES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <Activity size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Intensity ── */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-stone-500">
          Intensity
          {!manualIntensity && (
            <span className="ml-2 text-xs text-orange-500 font-normal">auto-matched</span>
          )}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['low', 'moderate', 'high'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              id={`intensity-${lvl}`}
              onClick={() => handleIntensityClick(lvl)}
              className={`py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                intensity === lvl
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/30'
                  : 'bg-orange-50 text-stone-600 border border-orange-200 hover:border-orange-400 hover:bg-orange-100'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-400">{INTENSITY_LABELS[intensity]}</p>
      </div>

      {/* ── Planned Time ── */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-stone-500">
          <Clock size={14} /> Planned Start Time
        </label>
        <input
          id="planned-time"
          type="datetime-local"
          value={plannedTime}
          onChange={(e) => setPlannedTime(e.target.value)}
          className="w-full bg-white border border-orange-200 text-stone-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all [color-scheme:light]"
          required
        />
      </div>

      {/* ── Duration ── */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-stone-500">
          <Timer size={14} /> Duration —{' '}
          <span className="text-stone-800 font-semibold">{duration} min</span>
        </label>
        <input
          id="duration-slider"
          type="range"
          min={5}
          max={180}
          step={5}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full accent-orange-500"
        />
        <div className="flex justify-between text-xs text-stone-400">
          <span>5 min</span>
          <span>3 hrs</span>
        </div>
      </div>

      {/* ── Submit ── */}
      <button
        id="analyze-btn"
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-orange-500/30 flex items-center justify-center gap-2"
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
