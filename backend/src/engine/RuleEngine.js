/**
 * RuleEngine.js — The Deterministic Layer (ARCHITECTURE §4.1)
 *
 * CRITICAL RULES (enforced by architecture):
 * - Pure JavaScript math. No async, no network, no LLM calls.
 * - Given the same inputs, ALWAYS produces the same riskLevel.
 * - The LLM MUST NEVER alter, override, or re-derive this output.
 * - Unit-testable in complete isolation.
 *
 * Pipeline:
 *   1. Compute Heat Index (Rothfusz regression) from temp + humidity
 *   2. Apply modifiers for activity intensity, duration, and hour-of-day
 *   3. Map adjusted apparent temperature to risk level 1–4
 */

// ── Constants ─────────────────────────────────────────────────────────────────

/** Risk level thresholds based on adjusted apparent temperature (°C) */
const RISK_THRESHOLDS = {
  LOW: 32,       // < 32°C  → Level 1
  MODERATE: 40,  // 32–40°C → Level 2
  HIGH: 54,      // 41–54°C → Level 3
  // > 54°C → Level 4 (Extreme)
};

/** Activity intensity multipliers — step function, no LLM input */
const INTENSITY_MODIFIER = {
  low: 0,       // adds 0°C effective load
  moderate: 4,  // adds 4°C effective load
  high: 9,      // adds 9°C effective load
};

/** Duration step-function modifier (minutes → added °C) */
function durationModifier(durationMinutes) {
  if (durationMinutes <= 20) return 0;
  if (durationMinutes <= 45) return 2;
  if (durationMinutes <= 90) return 5;
  return 8; // > 90 min
}

/** Peak sun hours (11:00–16:00 local) add additional heat load */
function timeOfDayModifier(hour) {
  if (hour >= 11 && hour <= 16) return 3;
  if (hour >= 9 && hour <= 18) return 1;
  return 0;
}

// ── Heat Index Formula (Rothfusz Regression) ──────────────────────────────────

/**
 * Compute the apparent temperature (Heat Index) using the full Rothfusz
 * regression in Celsius. Converts to/from Fahrenheit internally as the
 * formula is defined in °F.
 *
 * @param {number} tempC - Air temperature in Celsius
 * @param {number} rh    - Relative humidity (0–100)
 * @returns {number}     - Apparent temperature in Celsius
 */
export function computeHeatIndex(tempC, rh) {
  // Rothfusz is defined in Fahrenheit
  const T = tempC * 9 / 5 + 32;
  const H = rh;

  const HI =
    -42.379 +
    2.04901523 * T +
    10.14333127 * H +
    -0.22475541 * T * H +
    -0.00683783 * T * T +
    -0.05481717 * H * H +
    0.00122874 * T * T * H +
    0.00085282 * T * H * H +
    -0.00000199 * T * T * H * H;

  // Convert back to Celsius
  return parseFloat(((HI - 32) * 5 / 9).toFixed(1));
}

// ── Modifier Application ──────────────────────────────────────────────────────

/**
 * Apply deterministic modifiers to the base heat index.
 *
 * @param {number} heatIndexC
 * @param {{ durationMinutes: number, activityIntensity: string, hour: number }} opts
 * @returns {number} adjusted apparent temperature in Celsius
 */
export function applyModifiers(heatIndexC, { durationMinutes, activityIntensity, hour }) {
  const intensity = INTENSITY_MODIFIER[activityIntensity] ?? INTENSITY_MODIFIER.moderate;
  const duration = durationModifier(durationMinutes);
  const timeOfDay = timeOfDayModifier(hour);
  return parseFloat((heatIndexC + intensity + duration + timeOfDay).toFixed(1));
}

// ── Risk Level Mapping ────────────────────────────────────────────────────────

/**
 * Map adjusted apparent temperature to a strict integer risk level 1–4.
 *
 * @param {number} adjustedTempC
 * @returns {{ riskLevel: number, riskLabel: string }}
 */
export function getRiskLevel(adjustedTempC) {
  if (adjustedTempC < RISK_THRESHOLDS.LOW) {
    return { riskLevel: 1, riskLabel: 'Low' };
  }
  if (adjustedTempC < RISK_THRESHOLDS.MODERATE) {
    return { riskLevel: 2, riskLabel: 'Moderate' };
  }
  if (adjustedTempC < RISK_THRESHOLDS.HIGH) {
    return { riskLevel: 3, riskLabel: 'High' };
  }
  return { riskLevel: 4, riskLabel: 'Extreme' };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Top-level function: take raw weather + activity params, return risk assessment.
 *
 * @param {object} params
 * @param {number} params.temperatureC
 * @param {number} params.humidityPercent
 * @param {number} params.uvIndex
 * @param {string} params.activityIntensity - 'low' | 'moderate' | 'high'
 * @param {number} params.durationMinutes
 * @param {string} params.plannedTime - ISO 8601 string (used to extract hour)
 * @returns {{ riskLevel: number, riskLabel: string, apparentTemperatureC: number }}
 */
export function assess(params) {
  const { temperatureC, humidityPercent, activityIntensity, durationMinutes, plannedTime } = params;

  const hour = new Date(plannedTime).getHours();
  const heatIndex = computeHeatIndex(temperatureC, humidityPercent);
  const adjusted = applyModifiers(heatIndex, { durationMinutes, activityIntensity, hour });
  const { riskLevel, riskLabel } = getRiskLevel(adjusted);

  return { riskLevel, riskLabel, apparentTemperatureC: adjusted };
}
