import type { RiskResult, DecisionResult, MerchantSettings, DecisionAction } from '../types/risk';
import type { PaymentMethod } from '../types/order';
import { getPaymentPolicy, type PaymentPolicy, type RiskLevel } from './paymentPolicy';

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
 *   MEDIUM (30–70%): SOFT_NUDGE    (COD Available with ₹50 fee, UPI/Card ₹0 fee)
 *   HIGH   (70–100%): PREPAID_ONLY (COD Disabled, UPI/Card only)
 */
export function makeDecision(
  riskResult: RiskResult,
  settings: MerchantSettings
): DecisionResult {
  const policyVersion = `PAYMENT_POLICY_V2`;
  const score = riskResult.score;

  let riskLevel: RiskLevel;

  // Derive risk tier classification
  if (score >= settings.highThreshold || (riskResult.ringRisk?.ringDetected && riskResult.ringRisk.ringRiskScore >= 75)) {
    riskLevel = 'HIGH';
  } else if (score >= settings.mediumThreshold) {
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

  return {
    action,
    paymentMethods,
    paymentPolicy,
    otpRequired: riskLevel === 'MEDIUM' ? settings.otpRequired : false,
    codFee: paymentPolicy.codFee,
    upiDiscount: settings.upiDiscount || 0,
    nudgeMessages,
    policyVersion,
  };
}
