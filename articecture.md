# HeatShield — System Architecture

**Document Type:** Master System Prompt / Architectural Constitution
**Audience:** All AI coding agents and human contributors working on this repository
**Status:** Authoritative — supersedes ad-hoc instructions given in individual coding sessions

> Any AI agent operating on this codebase MUST read this document in full before writing or modifying code. If a request conflicts with this document, this document wins. Flag the conflict instead of silently resolving it in favor of the request.

---

## 1. Project Identity & Philosophy

### 1.1 One-Line USP

**HeatShield is a deterministic heat-risk calculator with an AI explanation layer — not an AI that guesses your risk.**

It tells a user, in seconds, whether a planned outdoor activity at a given time, location, and duration is safe — and if not, why, and what to do instead — by combining hard physiological/meteorological math with retrieval-grounded AI explanation.

### 1.2 The Golden Rule

> **HeatShield is a decision-support tool. It is NOT a medical device, and it is NOT a generic weather chatbot.**

This rule governs every architectural and product decision in this repository. Concretely:

- HeatShield does **not** diagnose, treat, or claim clinical accuracy. It never outputs medical advice framed as a diagnosis (e.g. "you have heat exhaustion"). It outputs **risk-informed guidance** (e.g. "conditions at this time carry elevated heat risk for this activity").
- HeatShield does **not** answer arbitrary weather questions ("will it rain in Paris next week?"). It only answers the one question it exists to answer: *is this specific activity, at this specific time/place/duration, heat-safe?*
- Every AI-generated sentence must trace back to (a) a deterministic risk score it did not invent, and (b) a retrieved authoritative source it did not invent. The AI is a **synthesizer and explainer**, never an **originator** of risk data.
- If an agent is asked to add features that violate this rule (symptom checkers, diagnosis flows, open-ended weather Q&A, general health chat), it must refuse and point to Section 7 (Anti-Goals).

---

## 2. Tech Stack & Infrastructure

| Layer | Technology | Notes |
|---|---|---|
| Frontend | **React (Vite)** | SPA, no SSR needed for MVP |
| Styling | **Tailwind CSS** | Utility-first; no separate CSS-in-JS library |
| Icons | **Lucide Icons** | Single icon set, no mixing with other icon libraries |
| Backend | **Node.js + Express** | Single REST-style service; no GraphQL for MVP |
| Weather Data | **Open-Meteo API** | Free, no-key. This is the single source of truth for all weather data. No paid weather API is to be introduced without explicit product sign-off. |
| AI Orchestration | **LangChain.js** | Used strictly for RAG retrieval + prompt assembly, not for agentic tool-calling loops |
| Vector Store | **Pinecone or ChromaDB** (local/free tier) | Stores embedded chunks of authoritative heat-safety guidance documents only |
| LLM | Configurable — Gemini / Claude / Granite (or equivalent) | Treated as a swappable synthesis engine, never as the source of risk truth |

**Infrastructure principle:** Every dependency added must be justifiable against Section 1.2. If a library exists to make the AI "smarter" or "more conversational" rather than to make the deterministic pipeline more accurate or the RAG grounding more faithful, it does not belong in this stack.

---

## 3. The System Pipeline (Data Flow)

The pipeline is strictly linear and unidirectional. No step may be skipped, reordered, or short-circuited by an LLM call.

```
User UI Payload
      │
      ▼
Express Route (validates payload shape)
      │
      ▼
Open-Meteo API Fetch (raw weather: temp, humidity, UV, wind)
      │
      ▼
JavaScript Rule Engine (deterministic math)
  → Heat Index / Apparent Temperature
  → Time / Duration / Activity Intensity modifiers
  → Risk Level (1–4)
      │
      ▼
Vector DB Retrieval (RAG)
  → Query built from Risk Level + Activity + Conditions
  → Retrieves relevant chunks from NDMA/WHO guideline embeddings
      │
      ▼
LLM Synthesis
  → Input: Risk Level (fixed), weather data (fixed), retrieved chunks (fixed)
  → Output: explanation + precautions + alternatives, all citation-anchored
      │
      ▼
Final JSON Response → Frontend
```

**Non-negotiable constraint:** the Risk Level entering the LLM Synthesis step is already final. The LLM receives it as a read-only input, exactly like the weather data. It is architecturally identical in status to a temperature reading — the LLM narrates it, it does not compute it.

---

## 4. Strict Logic Separation (CRITICAL)

This is the single most important section of this document. Violating it is considered a critical architectural defect, not a style issue.

### 4.1 The Deterministic Layer

- Implemented as **pure JavaScript functions** — no LLM calls, no network calls beyond the initial Open-Meteo fetch, no randomness.
- Responsible for:
  1. Computing **Heat Index / Apparent Temperature** from temperature + humidity (standard meteorological formula).
  2. Applying **hard-coded modifiers** for:
     - **Time of day** (e.g. peak sun hours 11:00–16:00 increase risk)
     - **Duration** (longer exposure increases risk on a defined step function)
     - **Activity Intensity** (sedentary vs. moderate vs. vigorous, mapped to fixed multipliers)
  3. Producing a single integer **Risk Level: 1 (Low) → 4 (Extreme)** via clearly defined, testable thresholds.
- This layer must be **unit-testable in isolation**, with no dependency on the LLM or vector store. Given the same inputs, it must always produce the same Risk Level.
- **The LLM must never invent, override, adjust, round, soften, or re-derive this score.** If the LLM's natural-language output implies a different risk level than the one computed here, that is a bug in the prompt/synthesis layer, not a reason to let the LLM "correct" the number.

### 4.2 The AI Synthesis Layer

- Receives exactly three inputs, all already finalized upstream:
  1. The computed **Risk Level** (1–4)
  2. The raw **weather data** used to compute it
  3. The **retrieved RAG documents** (NDMA/WHO guideline excerpts) relevant to that risk level and activity
- Its **only** job is to:
  - Explain, in plain language, *why* the conditions produced this risk level.
  - Generate actionable, activity-specific precautions.
  - Suggest safer alternatives (e.g. reschedule to earlier time, shorten duration, reduce intensity) — where these must be grounded in the same deterministic modifiers from Section 4.1, not freely invented.
- The LLM is explicitly **forbidden** from:
  - Stating or implying a different risk level than the one it was given.
  - Fabricating medical claims not present in the retrieved documents.
  - Answering questions unrelated to the current risk assessment (see Section 7).

---

## 5. Data Models & API Contract (MVP)

### 5.1 Request Payload (Frontend → Backend)

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

- `location`: required, coordinates preferred; `label` optional for display.
- `activity`: string enum from a fixed, curated list (no free-text activity parsing by the LLM in MVP).
- `activityIntensity`: enum — `low | moderate | high`.
- `plannedTime`: ISO 8601, used to fetch/interpolate the relevant Open-Meteo forecast slot.
- `durationMinutes`: integer, feeds the duration modifier in the rule engine.

### 5.2 Response Payload (Backend → Frontend)

```json
{
  "riskLevel": 3,
  "riskLabel": "High",
  "weatherSnapshot": {
    "temperatureC": 36.2,
    "humidityPercent": 58,
    "apparentTemperatureC": 42.7,
    "uvIndex": 8
  },
  "explanation": "Conditions at 2:00 PM combine high humidity with peak UV exposure, pushing apparent temperature well above safe thresholds for moderate-intensity activity.",
  "precautions": [
    "Hydrate with electrolytes before and during activity",
    "Wear light-colored, breathable clothing",
    "Take shaded breaks every 15 minutes"
  ],
  "recommendedAlternatives": [
    "Shift activity to before 9:00 AM or after 6:00 PM",
    "Reduce duration to under 25 minutes",
    "Switch to low-intensity activity (e.g. walking)"
  ],
  "citations": [
    {
      "source": "NDMA Heat Wave Guidelines 2019",
      "excerptRef": "chunk_014"
    },
    {
      "source": "WHO Heat and Health Factsheet",
      "excerptRef": "chunk_031"
    }
  ]
}
```

- `riskLevel` / `riskLabel`: sourced **only** from the Deterministic Layer (Section 4.1).
- `explanation`, `precautions`, `recommendedAlternatives`: sourced from the AI Synthesis Layer (Section 4.2), grounded in `citations`.
- `citations`: mandatory, non-empty when `explanation` is LLM-generated. See Section 6.2.

---

## 6. AI & RAG Strategy

### 6.1 Knowledge Base Construction

- The vector store is built **exclusively** from authoritative, pre-vetted documents — e.g. NDMA (National Disaster Management Authority) heatwave guidelines, WHO heat-and-health factsheets, and equivalent government/public-health sources.
- Construction pipeline: source PDFs → text extraction → semantic chunking (sized for retrieval precision, not maximal context stuffing) → embedding → upsert into Pinecone/ChromaDB with metadata (`source`, `sectionTitle`, `publicationYear`).
- No web-scraped, crowd-sourced, or unverified content is permitted in the knowledge base. Adding a new source requires the source to be an official public-health or disaster-management body.
- The knowledge base is **static content for retrieval**, not a place to store user data, logs, or conversation history (see Section 7).

### 6.2 Responsible AI Guardrails

- **Mandatory citation requirement:** every explanatory or advisory sentence generated by the LLM must be traceable to a retrieved chunk. If the retrieval step returns no relevant chunks for a given risk level/activity combination, the LLM must say so explicitly rather than generating unsourced advice.
- **Graceful degradation:** if the LLM call fails, times out, or returns malformed output, the backend must still return the deterministic `riskLevel`, `riskLabel`, and `weatherSnapshot` fields with a fallback `explanation` (a pre-written, risk-level-indexed static string) rather than failing the entire request. **The deterministic pipeline must never be blocked by, or dependent on, the AI layer's availability.**
- **No hallucinated numbers:** the LLM must not introduce any new numeric claims (temperatures, percentages, time thresholds) beyond what was supplied to it in the weather snapshot and rule engine output.
- **No scope creep in output:** the LLM's response must stay within the JSON contract in Section 5.2. It does not free-write additional advice categories.

---

## 7. Anti-Goals (What NOT to Build)

The following are explicitly **out of scope** for HeatShield. Any AI agent asked — directly or indirectly — to implement these must decline and reference this section.

- ❌ **User authentication** (login, signup, OAuth, sessions) — HeatShield is a stateless, single-use assessment tool.
- ❌ **User databases or user profiles** — no persisted personal data, no saved history of past assessments.
- ❌ **Mobile app development** (native iOS/Android, React Native) — MVP is web-only, responsive via Tailwind.
- ❌ **Chat history / conversation memory** — every request is evaluated independently; there is no multi-turn conversational state.
- ❌ **Generic conversational AI features** — no open-ended chatbot UI, no "ask me anything about weather," no personality/persona layer for the LLM.
- ❌ **Medical diagnosis or treatment claims** — reinforces the Golden Rule in Section 1.2.
- ❌ **Any feature that lets the LLM alter, override, or bypass the deterministic Risk Level** — reinforces Section 4.1.

If a proposed feature does not clearly serve the One-Line USP in Section 1.1, it does not belong in this repository.

---

*End of ARCHITECTURE.md — treat as binding for all future development and AI coding sessions on HeatShield.*