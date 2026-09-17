/**
 * WeatherService.js
 * 
 * Primary: Open-Meteo API
 * Fallback: OpenWeather API (triggered on 429 Rate Limits)
 */
import axios from 'axios';

const OPEN_METEO_BASE = process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com/v1';
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

export async function fetchWeather(lat, lon, plannedTime) {
  const targetDate = new Date(plannedTime);
  const targetTs = targetDate.getTime();

  try {
    // ── PRIMARY: Open-Meteo ──────────────────────────────────────────────
    const dateStr = targetDate.toISOString().split('T')[0];
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
      timeout: 5000,
    });

    const data = response.data;
    if (!data.hourly || !data.hourly.time) throw new Error('Unexpected Open-Meteo response shape');

    const times = data.hourly.time;
    let closestIndex = 0;
    let minDiff = Infinity;
    for (let i = 0; i < times.length; i++) {
      const diff = Math.abs(new Date(times[i]).getTime() - targetTs);
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
    // ── FALLBACK: OpenWeather ────────────────────────────────────────────
    if (error.response?.status === 429 || error.code === 'ECONNABORTED') {
      console.warn("⚠️ Open-Meteo rate limit hit. Switching to OpenWeather API.");

      if (!OPENWEATHER_API_KEY) {
        console.error("❌ OPENWEATHER_API_KEY missing. Cannot use OpenWeather fallback.");
        throw error;
      }

      try {
        const owResponse = await axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
          params: { lat, lon, appid: OPENWEATHER_API_KEY, units: 'metric' },
          timeout: 5000
        });

        // Find the closest 3-hour forecast interval
        let closest = owResponse.data.list[0];
        let minDiff = Infinity;
        for (const item of owResponse.data.list) {
          const diff = Math.abs((item.dt * 1000) - targetTs);
          if (diff < minDiff) {
            minDiff = diff;
            closest = item;
          }
        }

        // Standard free OpenWeather lacks UV; calculate a time-based heuristic
        const hour = targetDate.getHours();
        const isNight = hour >= 18 || hour < 7;
        const estimatedUvIndex = isNight ? 0 : 7.5;

        return {
          temperatureC: closest.main.temp,
          humidityPercent: closest.main.humidity,
          windSpeedKmh: closest.wind.speed * 3.6, // Convert m/s to km/h
          uvIndex: estimatedUvIndex,
        };

      } catch (owError) {
        console.error("❌ OpenWeather fallback also failed:", owError.message);
        throw owError;
      }
    }

    throw error;
  }
}