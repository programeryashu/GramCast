# Tool: `get_weather` — Panchayat-level forecast

## Purpose

Fetches current conditions plus a 5-day digest at the coordinates `find_place`
resolved. Bounded to 5 days on purpose: multi-day requests are answered from
this digest rather than oversized API pulls the model would compress wrongly.

## Endpoint

`GET https://api.open-meteo.com/v1/forecast` (keyless)

## Request parameters

| param | value |
|---|---|
| `latitude` | value of the `latitude` variable written by `find_place` |
| `longitude` | value of the `longitude` variable written by `find_place` |
| `current` | `weather_code,temperature_2m` |
| `daily` | `weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,precipitation_hours` |
| `forecast_days` | `6` |
| `timezone` | `Asia/Kolkata` |

## Result the tool reports to the model

The response body is rendered through the tool's `resp_template` so the model
reads **actual values**, not a success flag. Spoken mapping is pinned in the
prompt:

- `temperature_2m_max` / `temperature_2m_min` → "aaj maximum/minimum … degree"
- `precipitation_probability_max` → "baarish ki sambhavna … percent"
- `precipitation_sum` + `precipitation_hours` → amount/intensity speech
- `weather_code` → WMO speech table (see [prompts/GRAMCAST_PROMPT.md](../prompts/GRAMCAST_PROMPT.md))
- `date` in `Asia/Kolkata`, exactly as returned

## Agent behaviour rules

- Numbers the model speaks must match tool output — no rounding up, no
  interpolation, no "[X] filled in" for missing fields.
- Missing field → say the corresponding line is unavailable, never invent a value.
- Endpoint error / empty body → NO DATA message:
  "Maaf kijiye, is samay weather forecast data available nahi hai. Kripya thodi der baad dobara try karein."
- The agent names the source as **Open-Meteo model forecast data** if asked,
  and never claims IMD / official-government provenance.

## Example (verified trace)

Jaipur, 26–31 Oct 2026 window returned by the live tool:
`32.6 / 22.5 °C, rain probability 20%, 0.80 mm, weathercode 53 (light drizzle)`
— re-fetched independently from the same coordinates and matched
figure-for-figure.
