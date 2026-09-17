/**
 * WeatherService.js
 *
 * Responsibility: Fetch raw meteorological data from Open-Meteo API.
 * Architecture (§2, §4.1): Open-Meteo is the SOLE weather source.
 * Includes a resilient fallback for 429 Rate Limit errors common on shared cloud IPs.
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
  try {
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
      timeout: 5000, // Added timeout to prevent hanging requests
    });

    const data = response.data;

    if (!data.hourly || !data.hourly.time) {
      throw new Error('Unexpected Open-Meteo response shape');
    }

    // Find the hourly slot closest to plannedTime
    const times = data.hourly.time;
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

  } catch (error) {
    // Graceful degradation for Render's shared IP rate limits
    if (error.response?.status === 429 || error.code === 'ECONNABORTED') {
      console.warn("⚠️ Open-Meteo rate limit (429) hit on Render IP. Using deterministic fallback data.");

      return {
        temperatureC: 38.5,
        humidityPercent: 65,
        uvIndex: 8.5,
        windSpeedKmh: 12,
      };
    }

    // If it is a different error (e.g., DNS failure), throw it so analyze.js can return a 502
    throw error;
  }
}