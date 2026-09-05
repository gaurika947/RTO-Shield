import type { Customer } from '../types/customer';
import type { OrderAddress, PaymentMethod } from '../types/order';
import type { CounterfactualToggleState, CounterfactualResult } from '../types/common';
import { predictRTO, type RawOrderContext } from './mlModelEngine';

/**
 * AI Counterfactual Risk Simulation Engine
 *
 * Core Concept:
 * "What would have to change for this order to become safer?"
 *
 * Runs counterfactual feature permutations directly through the existing
 * ML scoring formula to calculate true mathematical risk reductions.
 */

export function simulateCounterfactualRisk(
  customer: Customer,
  address: OrderAddress,
  orderAmount: number,
  paymentMethod: PaymentMethod,
  deviceId: string,
  toggles: CounterfactualToggleState
): CounterfactualResult {
  const baselineContext: RawOrderContext = {
    customer,
    address,
    orderAmount,
    paymentMethod,
    deviceId,
  };
  const baseline = predictRTO(baselineContext);

  const buildContext = (active: CounterfactualToggleState): RawOrderContext => {
    const modifiedCustomer: Customer = { ...customer };
    const modifiedAddress: OrderAddress = { ...address };
    let modifiedPayment: PaymentMethod = paymentMethod;
    let modifiedDeviceLinkedAccounts = customer.knownDevices?.length || 1;

    if (active.prepaidPayment) modifiedPayment = 'UPI';
    if (active.verifiedAddress) {
      if (!modifiedAddress.landmark) modifiedAddress.landmark = 'Verified Landmark Nearby';
      if (modifiedAddress.line1.length < 25) modifiedAddress.line1 = `${modifiedAddress.line1}, Sector 14, Main Road`;
    }
    if (active.removeSuspiciousNetwork) {
      modifiedDeviceLinkedAccounts = 1;
      modifiedCustomer.knownDevices = [deviceId];
    }

    return {
      customer: modifiedCustomer,
      address: modifiedAddress,
      orderAmount,
      paymentMethod: modifiedPayment,
      deviceId,
      checkoutDuration: active.phoneVerification ? 110 : undefined,
      checkoutAttempts: active.phoneVerification ? 1 : undefined,
      addressChanges: active.verifiedAddress ? 0 : undefined,
      deviceLinkedAccounts: modifiedDeviceLinkedAccounts,
    };
  };

  const projected = predictRTO(buildContext(toggles));
  const individualDeltas: Array<{ factor: string; key: keyof CounterfactualToggleState }> = [
    { factor: 'Phone OTP Verification', key: 'phoneVerification' },
    { factor: 'Switch to Prepaid (UPI/Card)', key: 'prepaidPayment' },
    { factor: 'Complete Landmark & Verified Address', key: 'verifiedAddress' },
    { factor: 'Disassociate Multi-Account Cluster', key: 'removeSuspiciousNetwork' },
  ];
  const detailedDeltas = individualDeltas.map(({ factor, key }) => {
    const oneToggle = { phoneVerification: false, prepaidPayment: false, verifiedAddress: false, removeSuspiciousNetwork: false };
    oneToggle[key] = true;
    const oneTogglePrediction = predictRTO(buildContext(oneToggle));
    return {
      factor,
      deltaPoints: Math.max(0, baseline.riskScore - oneTogglePrediction.riskScore),
      active: toggles[key],
    };
  });

  const pointsReduction = Math.max(0, baseline.riskScore - projected.riskScore);

  return {
    currentRiskScore: baseline.riskScore,
    currentRiskTier: baseline.riskLevel,
    projectedRiskScore: projected.riskScore,
    projectedRiskTier: projected.riskLevel,
    pointsReduction,
    toggles,
    detailedDeltas,
  };
}
