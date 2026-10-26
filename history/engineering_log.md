# Engineering log — GRAMCAST AI

Every bug below was found by actually testing the agent, not by inspection.
Kept here so the fixes are auditable and the traps are known before the next
change.

## 1. Template shipped broken

The blank agent template arrived with:

- intro audio saying *"I am Shubh calling from Sarvam"* — violates the identity
  rules (never say Sarvam, no other assistant names);
- `nudge_config` 5s timeout + `end_interaction_after_consecutive_nudges: true` —
  the same config that made a sibling agent (SAARTHI) hang up on silent callers
  at ~13s. Fixed: `timeout_seconds: 10`, auto-end **false**. Verified by read-back,
  including the field's real path — it lives *inside* `nudge_config`, not at
  `interaction_config` level (a first patch at the wrong level was rejected
  with `not_in_config`).

## 2. Hallucinated forecast before any data source existed

On v1, when a location was given but no data source was attached, the agent
invented a forecast — *"60 percent, light rain, 22–32 degrees, confidence
medium"*. The spec's no-data rule alone was not enough.

Fix: added the **CRITICAL — WHERE FORECAST DATA COMES FROM** block
(a place is not data; numbers only from tool output; `[X]` placeholders are
format examples). Re-tested: identical question now yields the exact NO DATA
message.

## 3. "Tool find_place not found"

The tools were created and enabled but the model's runtime could not resolve
them — they were not bound to the state:
`llm_config.agent_config.states.start.tool_names = ["find_place", "get_weather"]`
is a **separate** registration from the tool list. Binding fixed the runtime.

## 4. Empty `resp_template` — the model saw "Request completed successfully"

This was the most dangerous bug. Both tools ran "successfully" with an empty
response template, so the model received no data — and on one "successful" run
it quoted max 32 / min 23 °C for Gurugram: **plausible but invented**.

Fix: theoretical response templates rendering the actual API response body
through to the model. Consequence: there is **no update path for API tools**
on this platform; tools must be cleared from `tool_names`, deleted, recreated
with the template, and rebound (deletion is otherwise refused while a state
references the tool — turn off the binding first).

## 5. Verification: every spoken number traced to source

Agent said for Jaipur: *max 32.6 °C, min 22.5 °C, rain 20%, 0.8 mm, light
drizzle*. An independent `curl` to the same coordinates returned
`32.6 / 22.5 / 20% / 0.80 mm / code 53` — exact match on every figure, plus
correct district/state/date.

Guard behaviour verified:

| probe | expected | got |
|---|---|---|
| weather question, no place | asks for Panchayat first | ✓ |
| *"IMD wali forecast hai? official warning?"* | honest: "no, Open-Meteo model data, no official warnings from me" | ✓ |
| fake village | refuses, asks to re-check | ✓ |

## 6. Deployment binding quirks (sibling-agent experience, relevant here)

- A deployment's `app_id` cannot be effectively rebound by a patch: the patch
  reports `changed` while reads still show the old agent.
- The platform only edits a paused deployment: pause → patch → resume keeps
  the phone-number binding; deleting and recreating **releases the numbers**.
- `inbound_config` on a patch is dropped by the caller layer; omitting it
  yields the provider default (24/7).

## 7. Data source decision

Open-Meteo chosen because it is **keyless** and verifiable:
`api.imd.gov.in` (official IMD gateway) has 7-day city forecast, district
colour-coded warnings and agromet advisories, but every endpoint returns
`401 "API key missing"` until an account is registered — no keyless official
door. The prompt therefore states the source is Open-Meteo model data
(ECMWF/GFS class) and forbids claiming IMD provenance. Swapping to IMD later
means: register at `api.imd.gov.in`, get a key, replace the tool endpoints and
update the sourcing paragraph.
