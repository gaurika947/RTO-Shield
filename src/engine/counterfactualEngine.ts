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
 * Primary Path:
 * Calls authoritative model backend via POST /api/ml/counterfactual,
 * running canonical feature transformations through the authoritative GBDT artifact.
 *
 * Fallback Path:
 * If backend API is unreachable (e.g. offline unit testing), evaluates
 * via deterministic fallback engine with explicit fallback provenance.
 */

export async function simulateCounterfactualRiskAuthoritative(
  customer: Customer,
  address: OrderAddress,
  orderAmount: number,
  paymentMethod: PaymentMethod,
  deviceId: string,
  toggles: CounterfactualToggleState
): Promise<CounterfactualResult> {
  try {
    const response = await fetch('/api/ml/counterfactual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          previous_orders: customer.totalOrders,
          previous_delivered_orders: customer.successfulDeliveries,
          previous_rto_orders: customer.rtoOrders,
          device_linked_accounts: customer.knownDevices?.length || 1,
        },
        order: {
          order_value: orderAmount,
          payment_method: paymentMethod,
        },
        address: {
          line1: address.line1,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          landmark: address.landmark,
        },
        behavior: {
          checkout_duration: 60,
          checkout_attempts: 1,
          address_changes: 0,
        },
        toggles,
      }),
    });

    if (response.ok) {
      const data: CounterfactualResult = await response.json();
      return data;
    }
  } catch {
    // API not reachable, proceed to deterministic fallback
  }

  // Graceful fallback
  return simulateCounterfactualRisk(customer, address, orderAmount, paymentMethod, deviceId, toggles);
}

/**
 * Synchronous simulation function.
 * Used for offline execution, unit tests, and instant fallback calculation.
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
  const direction =
    projected.riskScore < baseline.riskScore
      ? 'DECREASE'
      : projected.riskScore > baseline.riskScore
      ? 'INCREASE'
      : 'NEUTRAL';

  return {
    currentRiskScore: baseline.riskScore,
    currentRiskTier: baseline.riskLevel,
    currentRtoProbability: baseline.rtoProbability,
    projectedRiskScore: projected.riskScore,
    projectedRiskTier: projected.riskLevel,
    projectedRtoProbability: projected.rtoProbability,
    pointsReduction,
    direction,
    toggles,
    detailedDeltas,
    modelSource: 'deterministic_fallback',
    modelVersion: 'RTO Shield Deterministic Fallback v1',
    featureSchemaVersion: 'rto-features-v1',
  };
}
