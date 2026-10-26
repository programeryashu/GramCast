# GRAMCAST AI

Voice-based **agro-meteorological advisory assistant** that converts localized
Panchayat-level weather forecasts into simple, spoken, actionable advisories
for farmers and rural users.

GRAMCAST AI runs as a **Sarvam voice agent** connecting telephony (Exotel)
to an LLM, and answers questions like *"Aaj baarish hogi?"* or
*"Kal kheti mein kya karna chahiye?"* only with **verified forecast data
fetched live from a tool call** — never invented.

## Live deployment

| | |
|---|---|
| Agent | `GRAMCAST-AI-f7c7a63d-8219` |
| Phone number | `+91 11 4118 9624` (dial **011 4118 9624**) |
| Deployment | `GRAMCAST-AI-cf467d95-cf03` — active, inbound + outbound, 24/7 |
| Telephony | Exotel connection, Asia/Kolkata |
| Voice | `shubh` (Sarvam TTS), default language `hi-IN` |

## Architecture

```
Caller ⇄ Exotel (+91 11 4118 9624) ⇄ Sarvam voice agent
                                        │
                              states.start.tool_names
                                        │
              ┌─────────────────────────┴─────────────────────────┐
        find_place                                          get_weather
        Open-Meteo geocoding                                Open-Meteo forecast
        (place → lat/lon/district)                          (lat/lon → 5-day weather)
```

1. The agent asks for the village/Panchayat **first**.
2. `find_place` geocodes it (India-restricted); unknown places are never guessed.
3. `get_weather` fetches the real forecast at those coordinates.
4. The agent may speak numbers **only** those tools returned — see
   [prompts/GRAMCAST_PROMPT.md](prompts/GRAMCAST_PROMPT.md) for the full
   guardrail set (no invented data, no fake IMD warnings, confidence-aware phrasing).

## Repo layout

| path | what it is |
|---|---|
| [prompts/GRAMCAST_PROMPT.md](prompts/GRAMCAST_PROMPT.md) | The agent's full prompt spec (verbatim) |
| [config/agent_setup.md](config/agent_setup.md) | Intro multilingual config, interaction/nudge config, state bindings |
| [tools/find_place.md](tools/find_place.md) | Geocoding tool definition (Open-Meteo) |
| [tools/get_weather.md](tools/get_weather.md) | Forecast tool definition (Open-Meteo) |
| [scripts/forecast.js](scripts/forecast.js) | Standalone CLI: geocode + 5-day forecast, agent's own data path |
| [history/engineering_log.md](history/engineering_log.md) | Bugs found, fixes applied, verification evidence |

## Quickstart (outside the phone)

```bash
node scripts/forecast.js Bhondsi
node scripts/forecast.js Gurugram 5
```

No API key required — Open-Meteo is keyless. The same two endpoints the
voice agent's tools call are exercised here, so any number the CLI prints
is traceable to `api.open-meteo.com` / `geocoding-api.open-meteo.com`.

## Data sourcing & honesty rules

- **Open-Meteo model data is the only source.** The agent explicitly identifies
  it as model forecast data and never claims IMD/government provenance.
- A location name is not data. Without a returned forecast block, the agent
  responds with the NO DATA message — it never fabricates numbers.
- WMO weather codes are translated to plain speech ("halki baarish", "tez baarish").
- Rain is always expressed as *probability + intensity*, never guaranteed.
- If Open-Meteo is later replaced by an official IMD API key
  (`https://api.imd.gov.in`), only `tools/get_weather.md` and the sourcing
  paragraph of the prompt change — the caller-facing arcs stay the same.
