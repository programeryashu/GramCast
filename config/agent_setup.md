# GRAMCAST AI — agent setup

Live agent: `GRAMCAST-AI-f7c7a63d-8219` (Sarvam Voice Agents MCP).
This file records the configuration alongside the prompt so it can be
re-applied to a fresh workspace or audited later.

## Identity

| key | value |
|---|---|
| name | `GRAMCAST AI` |
| channel_type | `v2v` |
| default_language | `hi-IN` |
| speaker_id / provider | `shubh` / `sarvam` |
| states | single state `start` (holds the whole prompt) |
| initial_state_name | `start` |
| user_name (agent variable) | *(blank)* |

## Intro message (multilingual, all variants regenerated)

English master line:

> Namaste! Main GRAMCAST AI hoon. Main aapke Panchayat ke local weather forecast
> aur kheti se judi jankari samajhne mein madad kar sakta hoon. Bataiye, aaj main
> aapki kya madad karun?

- Written to `intro_message_config.multilingual_audio.language_text_mapping` for
  **3 voice variants × 12 languages** (Assamese, Bengali, English, Gujarati, Hindi,
  Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil, Telugu).
- Identity rule enforced: no "Sarvam" and no template voice name ("Shubh")
  anywhere in spoken audio.

## Interaction / nudge config

| setting | value | why |
|---|---|---|
| `nudge_config.user_nudge_message_configs[0].timeout_seconds` | **10** | default 5s nudged silent callers too early and hung up on them |
| `nudge_config.end_interaction_after_consecutive_nudges` | **false** | default `true` auto-ended the call at ~13s; the agent must never hang up on a silent caller by itself |

## State tool bindings

```
llm_config.agent_config.states.start.tool_names = ["find_place", "get_weather"]
```

Both tools must be bound here — a tool that exists but is not in `tool_names`
returns "Tool not found" at runtime.

## Deployment

| key | value |
|---|---|
| deployment id | `GRAMCAST-AI-cf467d95-cf03` |
| status | active, inbound + outbound |
| number | `+911141189624` (Exotel connection); dial 011 4118 9624 |
| hours | 24/7 (inbound_config omitted per provider default) |
