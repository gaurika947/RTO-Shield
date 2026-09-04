import { describe, it, expect } from 'vitest';
import { makeDecision } from '../src/engine/decisionEngine';
import { classifyOutcome, computeMetrics } from '../src/engine/feedbackEngine';
import type { RiskResult, MerchantSettings, FeedbackRecord } from '../src/types/risk';

describe('Decision Engine', () => {
  const defaultSettings: MerchantSettings = {
    mediumThreshold: 30,
    highThreshold: 70,
    codFee: 49,
    upiDiscount: 30,
    otpRequired: true,
    weights: { address: 0.15, history: 0.20, network: 0.20, velocity: 0.15, behavior: 0.10, ai: 0.10, ml: 0.10 },
    riskEngineVersion: 'RISK_ENGINE_V1',
    policyVersion: 'POLICY_V1',
    policyCounter: 1,
    aiEnabled: true,
  };

  const mockRisk = (score: number): RiskResult => ({
    score,
    tier: score >= 70 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW',
    confidence: 0.85,
    rtoProbability: 0.25,
    mlModelVersion: 'RTO-XGB-v1',
    mlConfidence: 0.88,
    mlAvailable: true,
    intentScore: 50,
    signals: [],
    reasons: [],
    contributions: { address: 0, history: 0, network: 0, velocity: 0, behavior: 0, ai: 0, ml: 0 },
    evidence: [],
    evaluationId: 'EVAL_TEST_1',
    timestamp: Date.now(),
    riskEngineVersion: 'RISK_ENGINE_V1',
    aiAvailable: true,
  });

  it('allows all payment methods for LOW risk', () => {
    const dec = makeDecision(mockRisk(15), defaultSettings);
    expect(dec.action).toBe('ALLOW_ALL');
    expect(dec.paymentMethods).toContain('COD');
    expect(dec.paymentMethods).toContain('UPI');
    expect(dec.paymentMethods).toContain('CARD');
  });

  it('applies soft nudges (COD fee, UPI discount, OTP) for MEDIUM risk', () => {
    const dec = makeDecision(mockRisk(45), defaultSettings);
    expect(dec.action).toBe('SOFT_NUDGE');
    expect(dec.paymentMethods).toContain('COD');
    expect(dec.codFee).toBe(50);
    expect(dec.upiDiscount).toBe(30);
    expect(dec.otpRequired).toBe(true);
  });

  it('disables COD for HIGH risk without customer accusation', () => {
    const dec = makeDecision(mockRisk(85), defaultSettings);
    expect(dec.action).toBe('PREPAID_ONLY');
    expect(dec.paymentMethods).not.toContain('COD');
    expect(dec.paymentMethods).toContain('UPI');
    expect(dec.paymentMethods).toContain('CARD');
    // Ensure no accusatory words
    expect(dec.nudgeMessages.some(m => m.toLowerCase().includes('fraud'))).toBe(false);
  });
});

describe('Feedback Engine', () => {
  it('correctly classifies TP, FP, TN, FN', () => {
    expect(classifyOutcome('HIGH', 'RTO')).toBe('TRUE_POSITIVE');
    expect(classifyOutcome('HIGH', 'DELIVERED')).toBe('FALSE_POSITIVE');
    expect(classifyOutcome('LOW', 'DELIVERED')).toBe('TRUE_NEGATIVE');
    expect(classifyOutcome('MEDIUM', 'RTO')).toBe('FALSE_NEGATIVE');
  });

  it('flags insufficient data when fewer than 5 observations exist', () => {
    const records: FeedbackRecord[] = [
      { id: '1', orderId: 'O1', evaluationId: 'E1', predictedScore: 80, predictedTier: 'HIGH', actualOutcome: 'RTO', classification: 'TRUE_POSITIVE', timestamp: Date.now() },
    ];
    const metrics = computeMetrics(records);
    expect(metrics.sufficient).toBe(false);
    expect(metrics.precision).toBeNull();
  });

  it('computes mathematical precision, recall, F1 when sufficient data exists', () => {
    const records: FeedbackRecord[] = [
      { id: '1', orderId: 'O1', evaluationId: 'E1', predictedScore: 80, predictedTier: 'HIGH', actualOutcome: 'RTO', classification: 'TRUE_POSITIVE', timestamp: Date.now() },
      { id: '2', orderId: 'O2', evaluationId: 'E2', predictedScore: 85, predictedTier: 'HIGH', actualOutcome: 'RTO', classification: 'TRUE_POSITIVE', timestamp: Date.now() },
      { id: '3', orderId: 'O3', evaluationId: 'E3', predictedScore: 75, predictedTier: 'HIGH', actualOutcome: 'DELIVERED', classification: 'FALSE_POSITIVE', timestamp: Date.now() },
      { id: '4', orderId: 'O4', evaluationId: 'E4', predictedScore: 20, predictedTier: 'LOW', actualOutcome: 'DELIVERED', classification: 'TRUE_NEGATIVE', timestamp: Date.now() },
      { id: '5', orderId: 'O5', evaluationId: 'E5', predictedScore: 35, predictedTier: 'MEDIUM', actualOutcome: 'RTO', classification: 'FALSE_NEGATIVE', timestamp: Date.now() },
    ];
    const metrics = computeMetrics(records);
    expect(metrics.sufficient).toBe(true);
    expect(metrics.tp).toBe(2);
    expect(metrics.fp).toBe(1);
    expect(metrics.tn).toBe(1);
    expect(metrics.fn).toBe(1);
    // Precision: 2 / (2 + 1) = 0.667
    expect(metrics.precision).toBeCloseTo(0.667, 2);
    // Recall: 2 / (2 + 1) = 0.667
    expect(metrics.recall).toBeCloseTo(0.667, 2);
  });
});
