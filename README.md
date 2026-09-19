# 🛡️ HeatShield

**A deterministic heat-risk calculator with an AI explanation layer.**

HeatShield tells you — in seconds — whether a planned outdoor activity at a given time, location, and duration is safe. If it isn't, it explains *why* and suggests what to do instead. It achieves this by combining hard physiological/meteorological math with retrieval-grounded AI synthesis.

> ⚠️ **HeatShield is a decision-support tool. It is NOT a medical device.**  
> It outputs risk-informed guidance, never clinical diagnoses.

---

## ✨ Features

- **Deterministic Risk Scoring** — A pure JavaScript rule engine computes a Heat Index and assigns a Risk Level (1–4) from temperature, humidity, UV index, wind speed, time of day, duration, and activity intensity. No LLM involvement in this step.
- **AI-Powered Explanations** — An LLM synthesizes a plain-language explanation, actionable precautions, and safer alternatives — all grounded in retrieved NDMA/WHO guideline excerpts.
- **RAG-Grounded Advice** — Every AI sentence traces back to a pre-vetted, authoritative public-health source. No hallucinated numbers or fabricated citations.
- **Graceful Degradation** — If the LLM is unavailable, the deterministic risk score and a pre-written static explanation are always returned. The AI layer never blocks the core pipeline.
- **Dual Weather Source** — Primary: Open-Meteo (free, no key required). Fallback: OpenWeatherMap (triggered on rate-limit errors).
- **High UV Alert** — An independent UV alert banner fires at UV Index > 6, regardless of the thermal risk score.

---

## 🏗️ Architecture

The pipeline is strictly **linear and unidirectional**. No step can be skipped or reordered by the LLM.

```
User UI Payload
      │
      ▼
Express Route (validates payload)
      │
      ▼
Open-Meteo API → weather snapshot (temp, humidity, UV, wind)
      │
      ▼
Rule Engine (pure JS, deterministic math)
  → Apparent Temperature / Heat Index
  → Time-of-day / Duration / Activity Intensity modifiers
  → Risk Level (1–4)  ← FINAL, LLM cannot change this
      │
      ▼
RAG Retrieval (NDMA / WHO guideline excerpts)
      │
      ▼
LLM Synthesis (explanation + precautions + alternatives)
      │
      ▼
JSON Response → Frontend
```

See [`articecture.md`](./articecture.md) for the full architectural constitution.

---

## 🗂️ Project Structure

```
HeatShield/
├── backend/
│   ├── src/
│   │   ├── engine/          # Deterministic rule engine (Heat Index, Risk Level)
│   │   ├── routes/          # Express routes (POST /api/analyze-exposure)
│   │   ├── services/
│   │   │   ├── WeatherService.js    # Open-Meteo (primary) + OpenWeather (fallback)
│   │   │   └── SynthesisService.js  # LangChain + LLM synthesis + RAG
│   │   └── index.js         # Express entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── RiskDisplay.tsx   # Risk badge, weather cards, UV alert
│   │   │   └── LoadingState.tsx  # Loading skeleton
│   │   └── hooks/
│   │       └── useHeatAnalysis.ts
│   ├── index.html
│   └── package.json
├── articecture.md           # Authoritative system architecture doc
└── package.json             # Root scripts (runs both services concurrently)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** v9+

### 1. Clone the repository

```bash
git clone <repo-url>
cd HeatShield
```

### 2. Install all dependencies

```bash
npm run install:all
```

### 3. Configure the backend environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=3001

# LLM Configuration (OpenAI-compatible endpoint)
LLM_MODEL=gpt-4o-mini
LLM_API_KEY=your_api_key_here

# Optional: override Open-Meteo base URL
OPEN_METEO_BASE_URL=

# Optional: OpenWeather fallback API key (used on 429 rate-limit errors)
OPENWEATHER_API_KEY=
```

> **No LLM key?** Leave `LLM_API_KEY` as `your_api_key_here`. The app will still return deterministic risk scores with pre-written static explanations.

### 4. Run the dev server

```bash
npm run dev
```

This starts both servers concurrently:
- **Backend** → `http://localhost:3001`
- **Frontend** → `http://localhost:5173` (Vite)

---

## 🔌 API Reference

### `POST /api/analyze-exposure`

Analyze heat risk for a planned outdoor activity.

**Request Body**

```json
{
  "location": {
    "lat": 30.3165,
    "lon": 78.0322,
    "label": "Dehradun, Uttarakhand"
  },
  "activity": "running",
  "activityIntensity": "moderate",
  "plannedTime": "2026-09-13T14:00:00+05:30",
  "durationMinutes": 45
}
```

| Field | Type | Description |
|---|---|---|
| `location` | object | `lat`, `lon` (required); `label` (optional display name) |
| `activity` | string | Activity type (e.g. `running`, `cycling`, `walking`) |
| `activityIntensity` | enum | `low` \| `moderate` \| `high` |
| `plannedTime` | ISO 8601 | Target datetime for weather forecast lookup |
| `durationMinutes` | integer | Planned activity duration in minutes |

**Response**

```json
{
  "riskLevel": 3,
  "riskLabel": "High",
  "weatherSnapshot": {
    "temperatureC": 36.2,
    "humidityPercent": 58,
    "apparentTemperatureC": 42.7,
    "uvIndex": 8,
    "windSpeedKmh": 12
  },
  "explanation": "Conditions at 2:00 PM combine high humidity with peak UV exposure...",
  "precautions": [
    "Hydrate with electrolytes before and during activity",
    "Wear light-colored, breathable clothing"
  ],
  "recommendedAlternatives": [
    "Shift activity to before 9:00 AM or after 6:00 PM",
    "Reduce duration to under 25 minutes"
  ],
  "citations": [
    { "source": "NDMA Heat Wave Guidelines 2019", "excerptRef": "chunk_014" },
    { "source": "WHO Heat and Health Factsheet", "excerptRef": "chunk_031" }
  ]
}
```

### `GET /health`

Returns `{ "status": "ok", "service": "heatshield-backend" }`.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 |
| Frontend Styling | Tailwind CSS v4 |
| Frontend Icons | Lucide React |
| Frontend Language | TypeScript |
| Backend | Node.js + Express 5 |
| Weather Data | Open-Meteo (primary), OpenWeatherMap (fallback) |
| AI Orchestration | LangChain.js (`@langchain/openai`) |
| LLM | Configurable — any OpenAI-compatible endpoint |
| Vector Store | Mock RAG (production: Pinecone / ChromaDB) |

---

## 🔒 Risk Levels

| Level | Label | Description |
|---|---|---|
| 1 | 🟢 Low | Safe for most activities. Standard hydration advised. |
| 2 | 🟡 Moderate | Proceed with caution. Reduce intensity, hydrate frequently. |
| 3 | 🟠 High | Serious heat exhaustion risk. Modify or postpone activity. |
| 4 | 🔴 Extreme | Life-threatening. Suspend all non-emergency outdoor activity. |

---

## ❌ Out of Scope

Per the architecture constitution, the following are explicitly **not** part of HeatShield:

- User authentication or profiles
- Chat history or conversation memory
- Medical diagnosis or treatment claims
- Open-ended weather Q&A chatbot features
- Native mobile apps (iOS / Android)

---

## 📄 License

Designed and developed by Anish Raj.
