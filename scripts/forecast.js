#!/usr/bin/env node
/**
 * forecast.js — GRAMCAST AI's data path as a standalone CLI.
 *
 * Exercises the exact two tools the voice agent uses:
 *   1. find_place  → https://geocoding-api.open-meteo.com/v1/search?…&country=IN&count=1
 *   2. get_weather → https://api.open-meteo.com/v1/forecast?…
 *
 * Usage:
 *   node scripts/forecast.js Bhondsi
 *   node scripts/forecast.js Gurugram 5
 *
 * No API key required.
 */

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

async function findPlace(name) {
  const u = new URL(GEO_URL);
  u.searchParams.set("name", name);
  u.searchParams.set("country", "IN");
  u.searchParams.set("count", "1");
  const res = await fetch(u, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`geocoding HTTP ${res.status}`);
  const body = await res.json();
  const hit = body.results && body.results[0];
  if (!hit) {
    throw new Error(
      `Maaf kijiye, mujhe is location ka exact Panchayat forecast verify nahi mil raha.`
    );
  }
  return {
    latitude: hit.latitude,
    longitude: hit.longitude,
    place_name: hit.name,
    district: hit.admin2,
    region: hit.admin1,
  };
}

async function getWeather(place, days = 5) {
  const u = new URL(FORECAST_URL);
  u.searchParams.set("latitude", String(place.latitude));
  u.searchParams.set("longitude", String(place.longitude));
  u.searchParams.set("current", "weather_code,temperature_2m");
  u.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,precipitation_hours"
  );
  u.searchParams.set("forecast_days", String(days + 1));
  u.searchParams.set("timezone", "Asia/Kolkata");
  const res = await fetch(u, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`forecast HTTP ${res.status}`);
  const body = await res.json();
  if (!body.daily) {
    throw new Error(
      "Maaf kijiye, is samay weather forecast data available nahi hai. Kripya thodi der baad dobara try karein."
    );
  }
  return body;
}

function wmoSpeech(code) {
  if (code == null) return "unknown";
  if (code <= 2) return "saaf / mainly saaf aasmaan";
  if (code === 3) return "badal chhaaye hue";
  if (code <= 48) return "kohra";
  if (code <= 57) return "halki runha / buund";
  if (code <= 65) return "baarish";
  if (code <= 77) return "fauwara / baraf ki larhi";
  if (code <= 82) return "barasi / garaj-chamak";
  if (code <= 86) return "outha hua baarish";
  if (code === 95) return "gajargur-aandhi";
  return "kaada garaj purviandhi";
}

async function main() {
  const name = process.argv[2];
  const days = Math.min(process.argv[3] ? parseInt(process.argv[3], 10) : 3, 5);
  if (!name) {
    console.error("Usage: node scripts/forecast.js <place> [days 1-5]");
    process.exit(2);
  }
  const place = await findPlace(name);
  console.log(
    `${place.place_name}${place.district ? ", " + place.district : ""}` +
      `${place.region ? ", " + place.region : ""} ` +
      `(${place.latitude}, ${place.longitude})`
  );
  const w = await getWeather(place, days);
  const d = w.daily;
  for (let i = 0; i < Math.min(days, (d.time || []).length); i++) {
    console.log(
      `${d.time[i]} — ${wmoSpeech(d.weather_code[i])} — ` +
        `max ${d.temperature_2m_max[i]} / min ${d.temperature_2m_min[i]} °C — ` +
        `rain ${d.precipitation_probability_max[i] ?? "n/a"}% — ` +
        `${d.precipitation_sum[i] ?? "n/a"} mm${d.precipitation_hours != null ? ` over ${d.precipitation_hours[i]}h` : ""}`
    );
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
