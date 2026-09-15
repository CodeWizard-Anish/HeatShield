import { useState, useCallback } from 'react';
import axios from 'axios';

export interface WeatherSnapshot {
  temperatureC: number;
  humidityPercent: number;
  apparentTemperatureC: number;
  uvIndex: number;
  windSpeedKmh: number;
}

export interface Citation {
  source: string;
  excerptRef: string;
}

export interface AnalysisResult {
  riskLevel: 1 | 2 | 3 | 4;
  riskLabel: string;
  weatherSnapshot: WeatherSnapshot;
  explanation: string;
  precautions: string[];
  recommendedAlternatives: string[];
  citations: Citation[];
}

export interface AnalysisRequest {
  location: { lat: number; lon: number; label: string };
  activity: string;
  activityIntensity: 'low' | 'moderate' | 'high';
  plannedTime: string;
  durationMinutes: number;
}

interface UseHeatAnalysisReturn {
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  analyze: (req: AnalysisRequest) => Promise<void>;
  reset: () => void;
}

export function useHeatAnalysis(): UseHeatAnalysisReturn {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (req: AnalysisRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post<AnalysisResult>('/api/analyze-exposure', req);
      setResult(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.error ?? err.response?.data?.detail ?? err.message;
        setError(detail || 'An unexpected error occurred. Please try again.');
      } else {
        setError('Failed to connect to the HeatShield server. Is the backend running?');
      }
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, analyze, reset };
}
