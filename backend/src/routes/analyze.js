/**
 * analyze.js — Route Handler for POST /api/analyze-exposure
 *
 * Orchestrates the strict linear pipeline (ARCHITECTURE §3):
 *   Validate → WeatherService → RuleEngine → SynthesisService → Response
 *
 * The riskLevel produced by RuleEngine is FINAL before SynthesisService is called.
 * SynthesisService receives it as a read-only narration input.
 */
import { Router } from 'express';
import { fetchWeather } from '../services/WeatherService.js';
import { assess } from '../engine/RuleEngine.js';
import { synthesize } from '../services/SynthesisService.js';

const router = Router();

// ── Input Validation ──────────────────────────────────────────────────────────

const VALID_INTENSITIES = ['low', 'moderate', 'high'];

function validatePayload(body) {
  const errors = [];

  if (!body.location?.lat || !body.location?.lon) {
    errors.push('location.lat and location.lon are required');
  }
  if (typeof body.location?.lat !== 'number' || typeof body.location?.lon !== 'number') {
    errors.push('location.lat and location.lon must be numbers');
  }
  if (!body.activity || typeof body.activity !== 'string') {
    errors.push('activity (string) is required');
  }
  if (!VALID_INTENSITIES.includes(body.activityIntensity)) {
    errors.push(`activityIntensity must be one of: ${VALID_INTENSITIES.join(', ')}`);
  }
  if (!body.plannedTime || isNaN(new Date(body.plannedTime).getTime())) {
    errors.push('plannedTime must be a valid ISO 8601 datetime string');
  }
  if (!Number.isInteger(body.durationMinutes) || body.durationMinutes < 1) {
    errors.push('durationMinutes must be a positive integer');
  }

  return errors;
}

// ── POST /api/analyze-exposure ────────────────────────────────────────────────

router.post('/analyze-exposure', async (req, res) => {
  // Step 1: Validate request payload
  const validationErrors = validatePayload(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Invalid request payload', details: validationErrors });
  }

  const { location, activity, activityIntensity, plannedTime, durationMinutes } = req.body;

  // Step 2: Fetch raw weather data from Open-Meteo (single source of truth)
  let weatherRaw;
  try {
    weatherRaw = await fetchWeather(location.lat, location.lon, plannedTime);
  } catch (err) {
    console.error('WeatherService failed:', err.message);
    return res.status(502).json({
      error: 'Failed to fetch weather data from Open-Meteo. Please try again.',
      detail: err.message,
    });
  }

  // Step 3: Run deterministic rule engine — riskLevel is NOW FINAL
  const { riskLevel, riskLabel, apparentTemperatureC } = assess({
    temperatureC: weatherRaw.temperatureC,
    humidityPercent: weatherRaw.humidityPercent,
    uvIndex: weatherRaw.uvIndex,
    activityIntensity,
    durationMinutes,
    plannedTime,
  });

  // Build the weather snapshot (§5.2 contract)
  const weatherSnapshot = {
    temperatureC: weatherRaw.temperatureC,
    humidityPercent: weatherRaw.humidityPercent,
    apparentTemperatureC,
    uvIndex: weatherRaw.uvIndex,
    windSpeedKmh: weatherRaw.windSpeedKmh,
  };

  // Step 4: AI synthesis — receives riskLevel as READ-ONLY
  // Per §6.2: if this fails, we still return the deterministic data
  const synthesis = await synthesize({
    riskLevel,
    riskLabel,
    weatherSnapshot,
    activity,
    activityIntensity,
    durationMinutes,
  });

  // Step 5: Assemble and return the Section 5.2 response payload
  return res.json({
    riskLevel,
    riskLabel,
    weatherSnapshot,
    explanation: synthesis.explanation,
    precautions: synthesis.precautions,
    recommendedAlternatives: synthesis.recommendedAlternatives,
    citations: synthesis.citations,
  });
});

export default router;
