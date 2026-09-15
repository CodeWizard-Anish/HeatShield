/**
 * WeatherService.js
 *
 * Responsibility: Fetch raw meteorological data from Open-Meteo API.
 * Architecture (§2, §4.1): Open-Meteo is the SOLE weather source.
 * This function has NO LLM dependency — pure HTTP + interpolation math.
 */
import axios from 'axios';

const OPEN_METEO_BASE = process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com/v1';

/**
 * Fetch forecasted weather data for a given coordinate and planned time.
 *
 * @param {number} lat
 * @param {number} lon
 * @param {string} plannedTime - ISO 8601 datetime string
 * @returns {Promise<{temperatureC: number, humidityPercent: number, uvIndex: number, windSpeedKmh: number}>}
 */
export async function fetchWeather(lat, lon, plannedTime) {
  const targetDate = new Date(plannedTime);
  const dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD

  const response = await axios.get(`${OPEN_METEO_BASE}/forecast`, {
    params: {
      latitude: lat,
      longitude: lon,
      hourly: 'temperature_2m,relative_humidity_2m,uv_index,wind_speed_10m',
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      timezone: 'auto',
      start_date: dateStr,
      end_date: dateStr,
    },
  });

  const data = response.data;

  if (!data.hourly || !data.hourly.time) {
    throw new Error('Unexpected Open-Meteo response shape');
  }

  // Find the hourly slot closest to plannedTime
  const times = data.hourly.time; // array of "YYYY-MM-DDTHH:00" strings
  const targetTs = targetDate.getTime();

  let closestIndex = 0;
  let minDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const slotTs = new Date(times[i]).getTime();
    const diff = Math.abs(slotTs - targetTs);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }

  return {
    temperatureC: data.hourly.temperature_2m[closestIndex],
    humidityPercent: data.hourly.relative_humidity_2m[closestIndex],
    uvIndex: data.hourly.uv_index[closestIndex],
    windSpeedKmh: data.hourly.wind_speed_10m[closestIndex],
  };
}
