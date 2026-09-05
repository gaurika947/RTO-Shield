/**
 * Central Risk & Payment Policy Definitions
 * Single source of truth for risk thresholds, tiers, and policy mapping.
 */

export const RISK_THRESHOLDS = {
  LOW_MIN: 0,
  LOW_MAX: 30,
  MEDIUM_MIN: 31,
  MEDIUM_MAX: 70,
  HIGH_MIN: 71,
  HIGH_MAX: 100,
} as const;

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export const CANONICAL_POLICY_CONFIG = {
  version: 'PAYMENT_POLICY_V2',
  thresholds: {
    low: { min: RISK_THRESHOLDS.LOW_MIN, max: RISK_THRESHOLDS.LOW_MAX },
    medium: { min: RISK_THRESHOLDS.MEDIUM_MIN, max: RISK_THRESHOLDS.MEDIUM_MAX },
    high: { min: RISK_THRESHOLDS.HIGH_MIN, max: RISK_THRESHOLDS.HIGH_MAX },
  },
  sentinel: {
    abuseRingCriticalThreshold: 75,
    mlCriticalReturnFloorThreshold: 0.85,
    mlCriticalSafetyFloorScore: 45,
  },
  paymentRules: {
    LOW: {
      codAvailable: true,
      codFee: 0,
      upiAvailable: true,
      cardAvailable: true,
      action: 'ALLOW_ALL' as const,
      defaultAction: 'ALLOW_COD' as const,
      message: 'COD available — frictionless checkout.',
    },
    MEDIUM: {
      codAvailable: true,
      codFee: 50,
      upiAvailable: true,
      cardAvailable: true,
      action: 'SOFT_NUDGE' as const,
      defaultAction: 'SOFT_VERIFICATION' as const,
      message: 'Cash on Delivery: +₹50 convenience fee.',
    },
    HIGH: {
      codAvailable: false,
      codFee: 0,
      upiAvailable: true,
      cardAvailable: true,
      action: 'PREPAID_ONLY' as const,
      defaultAction: 'PREPAID_REQUIRED' as const,
      message: "Cash on Delivery isn't available for this order.",
    },
  },
} as const;

/**
 * Maps a numeric risk score (0-100) or probability to a unified RiskLevel.
 */
export function getRiskLevelFromScore(score: number): RiskLevel {
  const val = score <= 1 ? Math.round(score * 100) : Math.round(score);
  if (val <= RISK_THRESHOLDS.LOW_MAX) return 'LOW';
  if (val <= RISK_THRESHOLDS.MEDIUM_MAX) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Standard signal weights totaling 1.00 (100%)
 */
export const STANDARD_RISK_WEIGHTS = {
  ml: 0.20,        // Primary ML RTO model probability (Signal 1)
  history: 0.20,   // Customer track record, past RTO rate, COD ratio
  network: 0.20,   // Device fingerprint sharing & abuse ring cluster
  velocity: 0.15,  // Short-window order burst vs computed baseline
  address: 0.12,   // Address completeness, premise, pincode risk
  behavior: 0.08,  // Session duration, attempts, address edits
  ai: 0.05,        // Gemini contextual reasoning synthesis
} as const;

/**
 * Deterministic Conflict Resolution Matrix (Phase 2 Step 8)
 * Explicitly resolves divergences between ML, deterministic heuristics, abuse sentinel, and AI.
 */
export interface SignalState {
  rawCalculatedScore: number;
  mlProbability: number;
  mlAvailable: boolean;
  deterministicHigh: boolean;
  abuseRingDetected: boolean;
  abuseRingScore: number;
  aiRiskScore?: number;
  aiAvailable: boolean;
}

export function resolveConflictingSignals(state: SignalState): {
  resolvedScore: number;
  resolvedTier: RiskLevel;
  conflictNotes: string[];
} {
  let score = state.rawCalculatedScore;
  const notes: string[] = [];

  const mlHigh = state.mlAvailable && state.mlProbability >= 0.71;
  const mlCritical = state.mlAvailable && state.mlProbability >= CANONICAL_POLICY_CONFIG.sentinel.mlCriticalReturnFloorThreshold;
  const isAbuseRingHigh = state.abuseRingDetected && state.abuseRingScore >= CANONICAL_POLICY_CONFIG.sentinel.abuseRingCriticalThreshold;

  // 1. Abuse Ring Sentinel overrides all individual order signals
  if (isAbuseRingHigh) {
    score = Math.max(score, state.abuseRingScore);
    notes.push(`Abuse ring cluster active (Score: ${state.abuseRingScore}) — overrides individual order profile.`);
    return {
      resolvedScore: Math.min(100, Math.round(score)),
      resolvedTier: 'HIGH',
      conflictNotes: notes,
    };
  }

  // 2. ML High / Critical + Deterministic Low:
  // If ML indicates severe return probability (>= 0.85), clamp floor to MEDIUM (45) to prevent blind delivery
  if (mlCritical && score <= RISK_THRESHOLDS.LOW_MAX) {
    score = Math.max(score, CANONICAL_POLICY_CONFIG.sentinel.mlCriticalSafetyFloorScore);
    notes.push(`ML predicts critical RTO return risk (${(state.mlProbability * 100).toFixed(0)}%); safety floor clamped to MEDIUM (${score}).`);
  } else if (mlHigh && score <= RISK_THRESHOLDS.LOW_MAX) {
    notes.push(`ML risk elevated (${(state.mlProbability * 100).toFixed(0)}%), balanced by strong merchant customer delivery history.`);
  }

  // 3. ML Low + Deterministic High:
  // Deterministic signals (address abuse, velocity spikes) dominate
  if (state.mlAvailable && state.mlProbability < 0.30 && score >= RISK_THRESHOLDS.HIGH_MIN) {
    notes.push('Deterministic risk signals (identity velocity / address anomalies) dominate low ML baseline.');
  }

  // 4. AI Advisory Signal:
  // AI cannot unilaterally flip LOW to HIGH without corroborating hard signals
  if (state.aiAvailable && state.aiRiskScore && state.aiRiskScore >= 70 && score <= RISK_THRESHOLDS.LOW_MAX) {
    notes.push('AI contextual flag noted in audit trail; primary quantitative signals remain LOW.');
  }

  // Clamping
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  const resolvedTier = getRiskLevelFromScore(finalScore);

  return {
    resolvedScore: finalScore,
    resolvedTier,
    conflictNotes: notes,
  };
}
