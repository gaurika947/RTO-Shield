import type {
  RiskTier,
  DecisionAction,
  PaymentMethod,
  InterventionLevel,
  InterventionStrategy,
  InterventionResult,
  CustomerTrustPassport,
  AbuseRingResult,
} from '../types/common';
import type { MerchantSettings } from '../types/risk';

/**
 * AI Intervention Optimizer Engine
 *
 * Product Philosophy:
 * "Minimum friction, maximum protection."
 * "Don't block first. Understand first."
 *
 * Chooses the least-friction intervention that sufficiently reduces RTO risk,
 * while balancing Order Risk against Customer Trust.
 */

export function optimizeIntervention(
  orderRiskScore: number,
  _riskTier: RiskTier,
  customerTrust: CustomerTrustPassport,
  ringRisk: AbuseRingResult,
  settings: MerchantSettings,
  strategy: InterventionStrategy = 'balanced'
): InterventionResult {
  const isHighTrust = customerTrust.trustScore >= 80;
  const isModerateTrust = customerTrust.trustScore >= 60;
  const isAbuseRing = ringRisk.ringDetected && ringRisk.ringRiskScore >= 75;

  // Threshold adjustments based on merchant strategy
  let medThresh = settings.mediumThreshold || 40;
  let highThresh = settings.highThreshold || 75;

  if (strategy === 'conversion_first') {
    medThresh += 10;
    highThresh += 10;
  } else if (strategy === 'conservative') {
    medThresh -= 8;
    highThresh -= 8;
  }

  // --- INTERVENTION LEVEL SELECTION ---
  let level: InterventionLevel = 'LEVEL_0_NONE';
  let action: DecisionAction = 'ALLOW_COD';
  let friction: InterventionResult['frictionLevel'] = 'ZERO';
  let title = 'Frictionless COD Allowed';
  let customerMessage = 'Cash on Delivery is enabled for this order.';
  let merchantRationale = 'Standard order profile conforming to merchant safety parameters.';
  let projectedScore = orderRiskScore;
  let allowedPaymentMethods: PaymentMethod[] = ['UPI', 'CARD', 'COD'];
  let otpRequired = false;
  let codFee = 0;
  let upiDiscount = 0;

  if (isAbuseRing || orderRiskScore >= highThresh + 10) {
    // Critical Abuse or extreme risk
    if (isHighTrust && !isAbuseRing) {
      // High-trust customer with single abnormal high-ticket order -> Soft step-up instead of blocking!
      level = 'LEVEL_3_VERIFY_AND_PREPAID_INCENTIVE';
      action = 'VERIFY_OR_PREPAID';
      friction = 'MODERATE';
      title = 'Trust-Buffered Step-Up Verification';
      customerMessage = 'Complete a quick verification to confirm Cash on Delivery or save ₹50 with UPI.';
      merchantRationale = `Order risk is elevated (${orderRiskScore}/100), but customer has High Trust (${customerTrust.trustScore}/100). Downgraded from block to step-up verification.`;
      projectedScore = Math.round(orderRiskScore * 0.55);
      allowedPaymentMethods = ['UPI', 'CARD', 'COD'];
      otpRequired = true;
      codFee = settings.codFee || 49;
      upiDiscount = settings.upiDiscount || 50;
    } else {
      level = 'LEVEL_4_PREPAID_REQUIRED';
      action = 'PREPAID_REQUIRED';
      friction = 'HIGH';
      title = 'Prepaid Only Required';
      customerMessage = 'Complete your order securely. Online payment is required for this order.';
      merchantRationale = isAbuseRing
        ? `Coordinated abuse network connection detected (Ring Score: ${ringRisk.ringRiskScore}/100). COD strictly disabled.`
        : `Critical risk threshold reached (${orderRiskScore}/100). Online payment required to protect margin.`;
      projectedScore = Math.round(orderRiskScore * 0.25);
      allowedPaymentMethods = ['UPI', 'CARD'];
      otpRequired = false;
      codFee = 0;
      upiDiscount = settings.upiDiscount || 30;
    }
  } else if (orderRiskScore >= medThresh) {
    if (orderRiskScore >= highThresh) {
      // High Risk
      if (isHighTrust) {
        level = 'LEVEL_2_OTP_VERIFICATION';
        action = 'SOFT_VERIFICATION';
        friction = 'LOW';
        title = 'Quick Mobile Verification';
        customerMessage = 'Verify your mobile number to continue with Cash on Delivery.';
        merchantRationale = `Customer trust score (${customerTrust.trustScore}/100) safely mitigates order risk. Simple OTP required.`;
        projectedScore = Math.max(15, orderRiskScore - 30);
        allowedPaymentMethods = ['UPI', 'CARD', 'COD'];
        otpRequired = true;
      } else {
        level = 'LEVEL_3_VERIFY_AND_PREPAID_INCENTIVE';
        action = 'VERIFY_OR_PREPAID';
        friction = 'MODERATE';
        title = 'Verification + Prepaid Incentive';
        customerMessage = 'Almost there. Complete a quick verification or pay online with ₹50 instant discount.';
        merchantRationale = 'Elevated return risk. Offering UPI incentive converts customer to prepaid at minimal friction.';
        projectedScore = Math.max(20, orderRiskScore - 35);
        allowedPaymentMethods = ['UPI', 'CARD', 'COD'];
        otpRequired = true;
        codFee = settings.codFee || 49;
        upiDiscount = settings.upiDiscount || 50;
      }
    } else {
      // Moderate Risk
      if (isHighTrust || (strategy === 'conversion_first' && isModerateTrust)) {
        level = 'LEVEL_1_SOFT_NUDGE';
        action = 'ALLOW_COD';
        friction = 'ZERO';
        title = 'Soft Address / Landmark Nudge';
        customerMessage = 'Cash on Delivery is available. Adding a landmark helps delivery riders locate you faster.';
        merchantRationale = 'Customer trust is sufficient. Standard COD allowed with non-intrusive landmark recommendation.';
        projectedScore = Math.max(10, orderRiskScore - 12);
        allowedPaymentMethods = ['UPI', 'CARD', 'COD'];
      } else {
        level = 'LEVEL_2_OTP_VERIFICATION';
        action = 'SOFT_VERIFICATION';
        friction = 'LOW';
        title = 'Lightweight OTP Verification';
        customerMessage = 'Verify your mobile number with a fast OTP to confirm Cash on Delivery.';
        merchantRationale = 'Moderate return probability. 1-click OTP secures delivery intent without blocking customer.';
        projectedScore = Math.max(15, orderRiskScore - 22);
        allowedPaymentMethods = ['UPI', 'CARD', 'COD'];
        otpRequired = true;
      }
    }
  } else {
    // Low Risk
    level = 'LEVEL_0_NONE';
    action = 'ALLOW_COD';
    friction = 'ZERO';
    title = 'Zero Friction Checkout';
    customerMessage = 'Cash on Delivery available.';
    merchantRationale = 'Low return probability. Frictionless instant checkout.';
    projectedScore = orderRiskScore;
    allowedPaymentMethods = ['UPI', 'CARD', 'COD'];
  }

  return {
    recommendedLevel: level,
    action,
    frictionLevel: friction,
    title,
    customerMessage,
    merchantRationale,
    estimatedRiskImpact: {
      beforeScore: orderRiskScore,
      projectedScore,
      pointsReduction: Math.max(0, orderRiskScore - projectedScore),
    },
    allowedPaymentMethods,
    otpRequired,
    codFee,
    upiDiscount,
    strategy,
    impactSource: 'business_simulation',
  };
}
