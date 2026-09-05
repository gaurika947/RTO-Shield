import { describe, it, expect } from 'vitest';
import {
  simulateCounterfactualRisk,
  simulateCounterfactualRiskAuthoritative,
} from '../src/engine/counterfactualEngine';
import {
  CANONICAL_POLICY_CONFIG,
  RISK_THRESHOLDS,
  getRiskLevelFromScore,
  resolveConflictingSignals,
} from '../src/engine/riskPolicy';
import { makeDecision } from '../src/engine/decisionEngine';
import type { Customer } from '../src/types/customer';
import type { OrderAddress } from '../src/types/order';
import type { RiskResult, MerchantSettings } from '../src/types/risk';
import { DEFAULT_SETTINGS } from '../src/store/settingsStore';

describe('Authoritative Counterfactual and Policy Integration', () => {
  const customer: Customer = {
    id: 'CUST_CF_1',
    name: 'Vikram Singh',
    phoneHash: 'phone_hash_cf1',
    emailHash: 'email_hash_cf1',
    totalOrders: 10,
    successfulDeliveries: 4,
    rtoOrders: 6,
    cancelledOrders: 0,
    codOrders: 8,
    prepaidOrders: 2,
    averageOrderValue: 2500,
    knownDevices: ['DEV_CF_1', 'DEV_CF_2', 'DEV_CF_3'],
    knownAddresses: ['ADDR_CF_1'],
    createdAt: Date.now() - 90 * 86400_000,
  };

  const address: OrderAddress = {
    line1: 'Flat 402, Ganga Tower',
    city: 'Patna',
    state: 'Bihar',
    pincode: '800001',
  };

  it('evaluates counterfactual baseline and mutates correctly', () => {
    const baseline = simulateCounterfactualRisk(customer, address, 3999, 'COD', 'DEV_CF_1', {
      phoneVerification: false,
      prepaidPayment: false,
      verifiedAddress: false,
      removeSuspiciousNetwork: false,
    });

    const prepaid = simulateCounterfactualRisk(customer, address, 3999, 'COD', 'DEV_CF_1', {
      phoneVerification: false,
      prepaidPayment: true,
      verifiedAddress: false,
      removeSuspiciousNetwork: false,
    });

    expect(baseline.currentRiskScore).toBeGreaterThan(RISK_THRESHOLDS.MEDIUM_MAX);
    expect(prepaid.projectedRiskScore).toBeLessThan(baseline.currentRiskScore);
    expect(prepaid.pointsReduction).toBeGreaterThan(0);
    expect(prepaid.direction).toBe('DECREASE');
    expect(prepaid.toggles.prepaidPayment).toBe(true);
  });

  it('evaluates simulateCounterfactualRiskAuthoritative async contract gracefully', async () => {
    const res = await simulateCounterfactualRiskAuthoritative(customer, address, 3999, 'COD', 'DEV_CF_1', {
      phoneVerification: false,
      prepaidPayment: true,
      verifiedAddress: false,
      removeSuspiciousNetwork: false,
    });

    expect(res).toBeDefined();
    expect(res.projectedRiskScore).toBeLessThan(res.currentRiskScore);
    expect(res.pointsReduction).toBeGreaterThan(0);
    expect(['artifact', 'deterministic_fallback']).toContain(res.modelSource);
  });

  it('produces 0 points reduction when no toggles are active', () => {
    const noChange = simulateCounterfactualRisk(customer, address, 3999, 'COD', 'DEV_CF_1', {
      phoneVerification: false,
      prepaidPayment: false,
      verifiedAddress: false,
      removeSuspiciousNetwork: false,
    });

    expect(noChange.pointsReduction).toBe(0);
    expect(noChange.direction).toBe('NEUTRAL');
  });

  it('produces structured canonical decision object in decisionEngine', () => {
    const mockRiskResult: RiskResult = {
      score: 85,
      tier: 'HIGH',
      confidence: 0.92,
      rtoProbability: 0.88,
      mlModelVersion: 'RTO Shield GBDT v1',
      mlConfidence: 0,
      mlAvailable: true,
      intentScore: 40,
      signals: ['High RTO rate', 'Shared device cluster'],
      reasons: ['Elevated historical return rate'],
      contributions: {
        address: 12,
        history: 20,
        network: 20,
        velocity: 15,
        behavior: 8,
        ml: 18,
        ai: 5,
      },
      evidence: [],
      evaluationId: 'EVAL_TEST_1',
      timestamp: Date.now(),
      riskEngineVersion: 'RISK_ENGINE_V3',
      aiAvailable: true,
      ringRisk: {
        ringDetected: true,
        ringRiskScore: 88,
        clusterSize: 3,
        signals: ['3 accounts share device fingerprint'],
      },
    };

    const defaultSettings: MerchantSettings = {
      ...DEFAULT_SETTINGS,
      mediumThreshold: 30,
      highThreshold: 70,
      codFee: 50,
      upiDiscount: 0,
      otpRequired: true,
      weights: { address: 0.12, history: 0.20, network: 0.20, velocity: 0.15, behavior: 0.08, ml: 0.20, ai: 0.05 },
    };

    const decision = makeDecision(mockRiskResult, defaultSettings);

    expect(decision.action).toBe('PREPAID_ONLY');
    expect(decision.paymentPolicy.codAvailable).toBe(false);
    expect(decision.canonicalDecision).toBeDefined();

    const cd = decision.canonicalDecision!;
    expect(cd.riskScore).toBe(85);
    expect(cd.rtoProbability).toBe(0.88);
    expect(cd.riskBand).toBe('HIGH');
    expect(cd.abuseRisk.ringDetected).toBe(true);
    expect(cd.abuseRisk.ringRiskScore).toBe(88);
    expect(cd.policyVersion).toBe('PAYMENT_POLICY_V2');
    expect(cd.predictionSource).toBe('artifact');
  });

  it('applies deterministic signal conflict resolution correctly', () => {
    // 1. Abuse Ring High overrides low ML score
    const ringOverride = resolveConflictingSignals({
      rawCalculatedScore: 25,
      mlProbability: 0.10,
      mlAvailable: true,
      deterministicHigh: false,
      abuseRingDetected: true,
      abuseRingScore: 92,
      aiAvailable: false,
    });
    expect(ringOverride.resolvedTier).toBe('HIGH');
    expect(ringOverride.resolvedScore).toBeGreaterThanOrEqual(92);

    // 2. Critical ML High on otherwise low profile enforces safety floor
    const mlSafetyFloor = resolveConflictingSignals({
      rawCalculatedScore: 22,
      mlProbability: 0.90,
      mlAvailable: true,
      deterministicHigh: false,
      abuseRingDetected: false,
      abuseRingScore: 0,
      aiAvailable: false,
    });
    expect(mlSafetyFloor.resolvedScore).toBeGreaterThanOrEqual(CANONICAL_POLICY_CONFIG.sentinel.mlCriticalSafetyFloorScore);
    expect(mlSafetyFloor.resolvedTier).toBe('MEDIUM');

    // 3. Low ML + High Deterministic -> Deterministic High dominates
    const detDom = resolveConflictingSignals({
      rawCalculatedScore: 78,
      mlProbability: 0.15,
      mlAvailable: true,
      deterministicHigh: true,
      abuseRingDetected: false,
      abuseRingScore: 0,
      aiAvailable: false,
    });
    expect(detDom.resolvedTier).toBe('HIGH');
  });

  it('maps scores to unified risk levels per canonical thresholds', () => {
    expect(getRiskLevelFromScore(0)).toBe('LOW');
    expect(getRiskLevelFromScore(30)).toBe('LOW');
    expect(getRiskLevelFromScore(31)).toBe('MEDIUM');
    expect(getRiskLevelFromScore(70)).toBe('MEDIUM');
    expect(getRiskLevelFromScore(71)).toBe('HIGH');
    expect(getRiskLevelFromScore(100)).toBe('HIGH');
  });
});
