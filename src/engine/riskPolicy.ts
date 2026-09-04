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
