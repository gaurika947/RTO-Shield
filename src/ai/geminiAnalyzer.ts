import type { Evidence } from '../types/risk';

/**
 * Gemini Analyzer — Client-side module that calls the Express backend.
 * The API key NEVER touches the frontend.
 *
 * Architecture:
 *   React → POST /api/ai/analyze → Express Backend → GEMINI_API_KEY → Gemini API
 *
 * Gemini is an INTELLIGENCE SIGNAL — not the decision maker.
 */

export interface GeminiInput {
  address: string;
  addressFeatures: string[];
  customerHistorySummary: string;
  behaviorSummary: string;
  networkSummary: string;
}

export interface GeminiOutput {
  available: boolean;
  addressQuality: number;   // 0-100
  intentRisk: number;       // 0-100
  behaviorIndicators: string[];
  riskExplanation: string;
  confidence: number;       // 0-1
}

const AI_API_URL = '/api/ai/analyze';

export async function callGeminiAnalysis(
  input: GeminiInput,
  aiEnabled: boolean
): Promise<{ available: boolean; risk: number; confidence: number; evidence: Evidence[]; riskExplanation?: string }> {
  // If AI is disabled (simulating unavailable), return fallback immediately
  if (!aiEnabled) {
    return {
      available: false,
      risk: 25, // neutral
      confidence: 0,
      evidence: [{
        type: 'AI', signal: 'AI_UNAVAILABLE', value: 'disabled',
        contribution: 0,
        explanation: 'AI analysis is disabled — using deterministic signals only',
      }],
    };
  }

  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`AI service returned ${response.status}`);
    }

    const data: GeminiOutput = await response.json();

    if (!data.available) {
      return {
        available: false,
        risk: 25,
        confidence: 0,
        evidence: [{
          type: 'AI', signal: 'AI_UNAVAILABLE', value: 'service_error',
          contribution: 0,
          explanation: 'AI service unavailable — deterministic engine continues',
        }],
      };
    }

    // Combine AI signals into a normalized risk score (0-100)
    const aiRisk = Math.round(
      data.intentRisk * 0.6 +
      (100 - data.addressQuality) * 0.4
    );

    const evidence: Evidence[] = [];

    if (data.riskExplanation) {
      evidence.push({
        type: 'AI', signal: 'AI_CONTEXT', value: aiRisk,
        contribution: 0,
        explanation: data.riskExplanation,
      });
    }

    for (const indicator of data.behaviorIndicators) {
      evidence.push({
        type: 'AI', signal: 'AI_INDICATOR', value: indicator,
        contribution: 0,
        explanation: indicator,
      });
    }

    return {
      available: true,
      risk: Math.min(100, Math.max(0, aiRisk)),
      confidence: Math.min(1, Math.max(0, data.confidence)),
      evidence,
      riskExplanation: data.riskExplanation,
    };
  } catch {
    // Gemini failure MUST NOT crash the system
    return {
      available: false,
      risk: 25,
      confidence: 0,
      evidence: [{
        type: 'AI', signal: 'AI_ERROR', value: 'connection_failed',
        contribution: 0,
        explanation: 'AI service connection failed — deterministic engine continues with reduced confidence',
      }],
    };
  }
}
