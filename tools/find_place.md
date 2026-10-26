# Tool: `find_place` — geocode a Panchayat / village / town

## Purpose

Turns a place the caller names into coordinates and admin labels that
`get_weather` can consume. The very first step of every weather answer.

## Endpoint

`GET https://geocoding-api.open-meteo.com/v1/search` (keyless)

## Request parameters

| param | value | notes |
|---|---|---|
| `name` | caller's place name | exact user phrasing first; retry with cleaned-up form before giving up |
| `country` | `IN` | restrict to India — the caller base is rural India |
| `count` | `1` | single best match |

## Result the tool reports to the model

The response body is passed through verbatim in the tool's `resp_template`
(an empty template caused the model to receive only "Request completed
successfully" — see the engineering log). Rendered fields:

| variable written on the agent | source field |
|---|---|
| `latitude` | `results[0].latitude` |
| `longitude` | `results[0].longitude` |
| `place_name` | `results[0].name` |
| `district` | `results[0].admin2` |
| `region` | `results[0].admin1` |

## Agent behaviour on failure

`{"results": []}` → the agent must **not** guess:

> "Maaf kijiye, mujhe is location ka exact Panchayat forecast verify nahi mil raha.
> Kripya gaon ya Panchayat ka naam dobara bata dijiye."

## Example

```
https://geocoding-api.open-meteo.com/v1/search?name=Gurugram&country=IN&count=1
→ {"results":[{"latitude":28.46667,"longitude":77.03333,"name":"Gurugram",
   "admin1":"Haryana","admin2":"Gurugram"}]}
```
