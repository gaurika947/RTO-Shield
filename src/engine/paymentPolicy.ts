import { getRiskLevelFromScore } from './riskPolicy';
import type { RiskLevel } from './riskPolicy';
export type { RiskLevel };

export interface PaymentPolicy {
  riskLevel: RiskLevel;
  codAvailable: boolean;
  codFee: number;
  upiAvailable: boolean;
  cardAvailable: boolean;
  message: string;
  checkoutMessage: string;
  policyVersion: string;
}

export function getPaymentPolicy(
  classification: RiskLevel | number,
  _rtoProbability?: number
): PaymentPolicy {
  const riskLevel: RiskLevel = typeof classification === 'number'
    ? getRiskLevelFromScore(classification)
    : classification;

  switch (riskLevel) {
    case 'LOW':
      return {
        riskLevel: 'LOW',
        codAvailable: true,
        codFee: 0,
        upiAvailable: true,
        cardAvailable: true,
        message: 'COD available',
        checkoutMessage: 'The checkout should remain completely frictionless.',
        policyVersion: 'PAYMENT_POLICY_V2',
      };

    case 'MEDIUM':
      return {
        riskLevel: 'MEDIUM',
        codAvailable: true,
        codFee: 50,
        upiAvailable: true,
        cardAvailable: true,
        message: 'Cash on Delivery + ₹50 convenience fee',
        checkoutMessage: 'UPI / Card recommended — No additional fee. COD requires ₹50 convenience fee.',
        policyVersion: 'PAYMENT_POLICY_V2',
      };

    case 'HIGH':
    default:
      return {
        riskLevel: 'HIGH',
        codAvailable: false,
        codFee: 0,
        upiAvailable: true,
        cardAvailable: true,
        message: "Cash on Delivery isn't available for this order.",
        checkoutMessage: 'COD is unavailable for this transaction based on current risk assessment.',
        policyVersion: 'PAYMENT_POLICY_V2',
      };
  }
}

/**
 * Dynamic Order Total Calculation:
 *
 * Base: subtotal = productPrice
 * If selectedPaymentMethod === "COD" AND riskLevel === "MEDIUM" -> total = subtotal + 50
 * Otherwise -> total = subtotal
 */
export function calculateOrderTotal(
  productPrice: number,
  selectedPaymentMethod: 'UPI' | 'CARD' | 'COD',
  policy: PaymentPolicy
): { subtotal: number; codFee: number; total: number } {
  const codFee = selectedPaymentMethod === 'COD' && policy.riskLevel === 'MEDIUM' ? 50 : 0;
  return {
    subtotal: productPrice,
    codFee,
    total: productPrice + codFee,
  };
}

/**
 * Central Security Rule & Enforcement:
 * Prevents client-side tampering:
 * - If riskLevel === HIGH and paymentMethod === COD -> reject payment attempt.
 * - If riskLevel === MEDIUM and paymentMethod === COD -> enforce ₹50 fee.
 */
export function validatePaymentAttempt(
  policy: PaymentPolicy,
  paymentMethod: 'UPI' | 'CARD' | 'COD',
  subtotal: number
): { valid: boolean; error?: string; finalAmount: number; appliedFee: number } {
  if (paymentMethod === 'COD') {
    if (!policy.codAvailable || policy.riskLevel === 'HIGH') {
      return {
        valid: false,
        error: "Cash on Delivery isn't available for this order.",
        finalAmount: subtotal,
        appliedFee: 0,
      };
    }
    const fee = policy.riskLevel === 'MEDIUM' ? 50 : 0;
    return {
      valid: true,
      finalAmount: subtotal + fee,
      appliedFee: fee,
    };
  }

  // UPI or CARD
  return {
    valid: true,
    finalAmount: subtotal,
    appliedFee: 0,
  };
}
