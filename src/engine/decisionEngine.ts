import type { RiskResult, DecisionResult, MerchantSettings, DecisionAction, CanonicalDecision } from '../types/risk';
import type { PaymentMethod } from '../types/order';
import { getPaymentPolicy, type PaymentPolicy } from './paymentPolicy';
import { CANONICAL_POLICY_CONFIG, RISK_THRESHOLDS, type RiskLevel } from './riskPolicy';

/**
 * Policy & Decision Engine — STRICTLY SEPARATE from ML Risk Engine.
 *
 * Flow:
 *   Customer / Order Details
 *          ↓
 *     RTO ML Model
 *          ↓
 *    RTO Probability
 *          ↓
 *   Risk Classification (LOW / MEDIUM / HIGH)
 *          ↓
 *    Decision Engine
 *          ↓
 *    Payment Policy
 *          ↓
 *   Dynamic Checkout
 *
 * 3-Tier Policy Rules:
 *   LOW    (0–30%):  ALLOW_ALL     (COD Available, ₹0 COD fee, Frictionless)
 *   MEDIUM (31–70%): SOFT_NUDGE    (COD Available with ₹50 fee, UPI/Card ₹0 fee)
 *   HIGH   (71–100%): PREPAID_ONLY (COD Disabled, UPI/Card only)
 */
export function makeDecision(
  riskResult: RiskResult,
  settings: MerchantSettings
): DecisionResult {
  const policyVersion = CANONICAL_POLICY_CONFIG.version;
  const score = riskResult.score;

  let riskLevel: RiskLevel;

  const highThresh = settings.highThreshold ?? RISK_THRESHOLDS.MEDIUM_MAX;
  const medThresh = settings.mediumThreshold ?? RISK_THRESHOLDS.LOW_MAX;

  // Derive risk tier classification
  if (score >= highThresh || (riskResult.ringRisk?.ringDetected && riskResult.ringRisk.ringRiskScore >= CANONICAL_POLICY_CONFIG.sentinel.abuseRingCriticalThreshold)) {
    riskLevel = 'HIGH';
  } else if (score >= medThresh) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  // Central Payment Policy evaluation
  const paymentPolicy: PaymentPolicy = getPaymentPolicy(riskLevel, riskResult.rtoProbability);

  let action: DecisionAction;
  const nudgeMessages: string[] = [];

  switch (riskLevel) {
    case 'LOW':
      action = 'ALLOW_ALL';
      nudgeMessages.push('COD available — frictionless checkout.');
      break;

    case 'MEDIUM':
      action = 'SOFT_NUDGE';
      nudgeMessages.push('Cash on Delivery: +₹50 convenience fee.');
      nudgeMessages.push('UPI / Card: Recommended — No additional fee.');
      if (settings.otpRequired) {
        nudgeMessages.push('Mobile verification required for Cash on Delivery.');
      }
      break;

    case 'HIGH':
    default:
      action = 'PREPAID_ONLY';
      nudgeMessages.push("Cash on Delivery isn't available for this order.");
      nudgeMessages.push('Please complete your purchase securely using UPI or Credit/Debit Card.');
      break;
  }

  const paymentMethods: PaymentMethod[] = paymentPolicy.codAvailable
    ? ['UPI', 'CARD', 'COD']
    : ['UPI', 'CARD'];

  const otpRequired = riskLevel === 'MEDIUM' ? Boolean(settings.otpRequired) : false;

  const canonicalDecision: CanonicalDecision = {
    riskScore: score,
    rtoProbability: riskResult.rtoProbability,
    riskBand: riskLevel,
    signalBreakdown: riskResult.contributions,
    abuseRisk: {
      ringDetected: Boolean(riskResult.ringRisk?.ringDetected),
      ringRiskScore: riskResult.ringRisk?.ringRiskScore ?? 0,
      clusterSize: riskResult.ringRisk?.clusterSize ?? 1,
    },
    aiSignal: {
      available: Boolean(riskResult.aiAvailable),
      riskScore: Math.min(100, (riskResult.contributions?.ai ?? 0) * 20),
      confidence: riskResult.confidence,
    },
    predictionSource: riskResult.mlAvailable ? 'artifact' : 'deterministic_fallback',
    modelVersion: riskResult.mlModelVersion || 'RTO Shield GBDT v1',
    featureSchemaVersion: 'rto-features-v1',
    policyVersion,
    recommendedIntervention: {
      action,
      allowedPaymentMethods: paymentMethods,
      codFee: paymentPolicy.codFee,
      otpRequired,
      customerMessage: nudgeMessages.join(' '),
    },
    timestamp: Date.now(),
  };

  return {
    action,
    paymentMethods,
    paymentPolicy,
    otpRequired,
    codFee: paymentPolicy.codFee,
    upiDiscount: settings.upiDiscount || 0,
    nudgeMessages,
    policyVersion,
    canonicalDecision,
  };
}
