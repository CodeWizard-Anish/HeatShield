/**
 * SynthesisService.js — AI Synthesis Layer (ARCHITECTURE §4.2)
 *
 * Receives ONLY:
 *   1. The computed riskLevel (final — from RuleEngine, never re-derived here)
 *   2. The raw weatherSnapshot (fixed, from WeatherService)
 *   3. Mocked RAG excerpts from NDMA/WHO guidelines
 *
 * The LLM is a SYNTHESIZER only. It cannot alter riskLevel or invent numbers.
 * Graceful degradation (§6.2): if LLM fails, returns a static fallback
 * so the deterministic data is never blocked by AI availability.
 */
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';

// ── Mock RAG Knowledge Base ───────────────────────────────────────────────────
// In production this would be a Pinecone/ChromaDB retrieval call.
// Each entry reflects actual NDMA / WHO guidance language.

const MOCK_KNOWLEDGE_BASE = {
  1: [
    {
      source: 'NDMA Heat Wave Guidelines 2019',
      excerptRef: 'chunk_002',
      text: 'At low heat stress levels (apparent temperature below 32°C), outdoor physical activity is generally safe for healthy adults. Hydration remains important—drink water regularly even if not feeling thirsty.',
    },
    {
      source: 'WHO Heat and Health Factsheet',
      excerptRef: 'chunk_008',
      text: 'Mild heat conditions present minimal risk for short-duration activities. Wearing light, breathable clothing and scheduling activity in shaded areas further reduces any residual heat load.',
    },
  ],
  2: [
    {
      source: 'NDMA Heat Wave Guidelines 2019',
      excerptRef: 'chunk_011',
      text: 'Moderate heat stress conditions require caution for prolonged outdoor activities. Workers and athletes should reduce exertion intensity, take regular breaks in shade, and consume at least 250 ml of water every 20 minutes.',
    },
    {
      source: 'WHO Heat and Health Factsheet',
      excerptRef: 'chunk_019',
      text: 'Heat exhaustion can develop within 30–45 minutes of moderate exertion in temperatures between 32–40°C apparent temperature. Early warning signs include heavy sweating, weakness, and a fast, weak pulse.',
    },
    {
      source: 'IMD Heatwave Advisory 2023',
      excerptRef: 'chunk_027',
      text: 'Scheduling physical activity before 9 AM or after 6 PM significantly reduces heat exposure during peak solar radiation hours. Postponing activities to cooler parts of the day is the most effective single mitigation.',
    },
  ],
  3: [
    {
      source: 'NDMA Heat Wave Guidelines 2019',
      excerptRef: 'chunk_014',
      text: 'High heat stress (apparent temperature 41–54°C) presents serious risk of heat exhaustion and heat stroke. NDMA recommends suspending non-essential outdoor activities and restricting physical work to the early morning or late evening hours.',
    },
    {
      source: 'WHO Heat and Health Factsheet',
      excerptRef: 'chunk_031',
      text: 'Peak UV index above 7 combined with high humidity substantially elevates heat stroke risk. UV radiation adds an additional physiological heat load independent of air temperature. Protective clothing, sunscreen SPF 50+, and shade are critical.',
    },
    {
      source: 'IMD Heatwave Advisory 2023',
      excerptRef: 'chunk_035',
      text: 'For sustained outdoor activity under high heat stress, reduce planned duration by at least 50% from normal, consume electrolyte fluids, and identify nearby cool-down areas in advance. Companions should monitor for signs of confusion or cessation of sweating.',
    },
  ],
  4: [
    {
      source: 'NDMA Heat Wave Guidelines 2019',
      excerptRef: 'chunk_021',
      text: 'Extreme heat conditions (apparent temperature above 54°C) are life-threatening. NDMA mandates suspension of all non-emergency outdoor activity. Heat stroke can develop within minutes for individuals engaged in physical exertion.',
    },
    {
      source: 'WHO Heat and Health Factsheet',
      excerptRef: 'chunk_044',
      text: 'Heat stroke is a medical emergency characterized by body temperature above 40°C, altered mental status, and cessation of sweating. Immediate cooling, shade, and emergency medical response are required. No outdoor physical activity is advisable under extreme heat conditions.',
    },
    {
      source: 'IMD Heatwave Advisory 2023',
      excerptRef: 'chunk_051',
      text: 'During declared heatwave conditions, all outdoor physical activities should be rescheduled. If emergency outdoor work is unavoidable, continuous buddy monitoring, mandatory rest cycles of 10 minutes per 20 minutes of work, and immediate access to cool water are required.',
    },
  ],
};

/** Static fallback explanations indexed by riskLevel (§6.2 graceful degradation) */
const FALLBACK_EXPLANATIONS = {
  1: 'Conditions are within safe parameters for your planned activity. Standard heat-safety practices apply.',
  2: 'Moderate heat stress detected. Reduce exertion, hydrate frequently, and consider rescheduling to cooler hours.',
  3: 'High heat risk. Apparent temperature combined with activity load creates serious heat exhaustion risk. Consider postponing or significantly modifying your activity.',
  4: 'Extreme heat conditions. This activity poses life-threatening heat stroke risk under current conditions. Suspend all non-emergency outdoor activity immediately.',
};

const FALLBACK_PRECAUTIONS = {
  1: ['Stay hydrated — drink water before, during, and after', 'Wear light, breathable clothing', 'Monitor for early signs of heat discomfort'],
  2: ['Drink 250 ml of water every 20 minutes', 'Take shaded breaks every 15–20 minutes', 'Reduce activity intensity if feeling overheated', 'Wear light-colored, moisture-wicking clothing'],
  3: ['Hydrate with electrolytes before and during activity', 'Wear light-colored, breathable clothing', 'Take shaded breaks every 15 minutes', 'Have a companion monitor for heat exhaustion signs'],
  4: ['Do NOT proceed with outdoor activity under these conditions', 'Seek air-conditioned shelter immediately', 'If emergency exposure occurs, cool down with water immediately and seek medical attention'],
};

const FALLBACK_ALTERNATIVES = {
  1: ['Activity is safe to proceed — maintain standard hydration'],
  2: ['Shift activity to before 9:00 AM or after 6:00 PM', 'Reduce duration by 50%', 'Switch to low-intensity activity'],
  3: ['Reschedule to before 8:00 AM or after 7:00 PM', 'Reduce duration to under 25 minutes', 'Switch to low-intensity activity (e.g. walking)', 'Find an indoor, climate-controlled alternative'],
  4: ['Postpone activity by 24 hours and reassess conditions', 'Find an indoor or climate-controlled alternative', 'Limit any outdoor exposure to under 5 minutes with buddy system'],
};

// ── Mock Retrieval ────────────────────────────────────────────────────────────

/**
 * Mock RAG retrieval — returns relevant guideline excerpts by riskLevel.
 * Replace with real vector DB query in production (§6.1).
 *
 * @param {number} riskLevel
 * @returns {Array<{ source: string, excerptRef: string, text: string }>}
 */
function mockRetrieve(riskLevel) {
  return MOCK_KNOWLEDGE_BASE[riskLevel] ?? MOCK_KNOWLEDGE_BASE[2];
}

// ── LLM Prompt Template ───────────────────────────────────────────────────────

const SYNTHESIS_PROMPT = ChatPromptTemplate.fromTemplate(`
You are a heat-safety information synthesizer for HeatShield, a deterministic risk assessment tool.

FIXED INPUTS — these are authoritative and final. You must NOT restate or imply different values:
- Risk Level: {riskLevel} ({riskLabel}) — THIS SCORE IS FINAL. Do not output a different level.
- Air Temperature: {temperatureC}°C
- Relative Humidity: {humidityPercent}%
- Apparent Temperature (Heat Index): {apparentTemperatureC}°C
- UV Index: {uvIndex}
- Activity: {activity} ({activityIntensity} intensity) for {durationMinutes} minutes

RETRIEVED GUIDELINES — cite ONLY from these excerpts, do not fabricate additional sources:
{ragExcerpts}

YOUR TASK:
Produce ONLY valid JSON — no markdown fences, no prose outside the JSON object.
The JSON must match this exact schema:

{{
  "explanation": "<1-2 sentences explaining why these conditions produce this risk level, grounded in the retrieved guidelines>",
  "precautions": ["<3-4 specific, actionable bullet points>"],
  "recommendedAlternatives": ["<2-3 alternatives grounded in the deterministic modifiers: time-of-day, duration, intensity>"],
  "citations": [{{"source": "<source name>", "excerptRef": "<chunk_id>"}}]
}}

HARD CONSTRAINTS — violating these is a critical bug:
1. Do NOT state or imply a risk level different from {riskLevel} ({riskLabel}).
2. Do NOT introduce numeric temperature, humidity, or UV values not present in FIXED INPUTS above.
3. Do NOT fabricate citations. Use only sources listed in RETRIEVED GUIDELINES.
4. Do NOT include any keys beyond the four listed in the schema.
5. Do NOT wrap the JSON in markdown code blocks.
6. Do NOT make medical diagnoses. Use risk-informed guidance language only.
`);

// ── Synthesis Function ────────────────────────────────────────────────────────

/**
 * Generate the AI explanation layer for a given risk assessment.
 * Returns graceful fallback if LLM is unavailable (§6.2).
 *
 * @param {object} params
 * @param {number} params.riskLevel
 * @param {string} params.riskLabel
 * @param {object} params.weatherSnapshot
 * @param {string} params.activity
 * @param {string} params.activityIntensity
 * @param {number} params.durationMinutes
 * @returns {Promise<{ explanation, precautions, recommendedAlternatives, citations }>}
 */
export async function synthesize({
  riskLevel,
  riskLabel,
  weatherSnapshot,
  activity,
  activityIntensity,
  durationMinutes,
}) {
  const ragDocs = mockRetrieve(riskLevel);
  const ragExcerpts = ragDocs
    .map((d, i) => `[${i + 1}] SOURCE: ${d.source} (ref: ${d.excerptRef})\n    "${d.text}"`)
    .join('\n\n');

  const citations = ragDocs.map(({ source, excerptRef }) => ({ source, excerptRef }));

  // Check if LLM is configured
  if (!process.env.LLM_API_KEY || process.env.LLM_API_KEY === 'your_api_key_here') {
    console.warn('⚠️  LLM_API_KEY not configured — returning deterministic fallback.');
    return buildFallback(riskLevel, citations);
  }

  try {
    const llm = new ChatOpenAI({
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
      apiKey: process.env.LLM_API_KEY,
      temperature: 0.2, // low temperature for factual, grounded output
      maxTokens: 600,
    });

    const chain = SYNTHESIS_PROMPT.pipe(llm);

    const result = await chain.invoke({
      riskLevel,
      riskLabel,
      temperatureC: weatherSnapshot.temperatureC,
      humidityPercent: weatherSnapshot.humidityPercent,
      apparentTemperatureC: weatherSnapshot.apparentTemperatureC,
      uvIndex: weatherSnapshot.uvIndex,
      activity,
      activityIntensity,
      durationMinutes,
      ragExcerpts,
    });

    const rawText = result.content.trim();
    const parsed = JSON.parse(rawText);

    // Validate the response shape — if malformed, fall back
    if (!parsed.explanation || !Array.isArray(parsed.precautions) || !Array.isArray(parsed.citations)) {
      throw new Error('LLM response does not match expected schema');
    }

    // Enforce architecture rule: citations must come from our retrieved docs
    parsed.citations = citations;

    return {
      explanation: parsed.explanation,
      precautions: parsed.precautions,
      recommendedAlternatives: parsed.recommendedAlternatives ?? FALLBACK_ALTERNATIVES[riskLevel],
      citations: parsed.citations,
    };
  } catch (err) {
    console.error('LLM synthesis failed — falling back to static response:', err.message);
    return buildFallback(riskLevel, citations);
  }
}

/** Build the static fallback response (§6.2 graceful degradation) */
function buildFallback(riskLevel, citations) {
  return {
    explanation: FALLBACK_EXPLANATIONS[riskLevel],
    precautions: FALLBACK_PRECAUTIONS[riskLevel],
    recommendedAlternatives: FALLBACK_ALTERNATIVES[riskLevel],
    citations,
  };
}
