import type { Customer } from '../types/customer';
import type { CustomerTrustPassport, OrderOutcome, PaymentMethod } from '../types/common';

/**
 * Customer Trust Engine
 *
 * Core Concept: "Order Risk ≠ Customer Trust"
 *
 * A single unusual order (e.g. gifting to a different city or a high-ticket item)
 * should NOT automatically penalize a verified, long-standing customer.
 */

export function computeCustomerTrustPassport(
  customer: Customer,
  suspiciousNetworkLinks: number = 0
): CustomerTrustPassport {
  const total = customer.totalOrders || 0;
  const delivered = customer.successfulDeliveries || 0;
  const rto = customer.rtoOrders || 0;
  const cancelled = customer.cancelledOrders || 0;

  const successRate = total > 0 ? delivered / total : 0.0;
  const cancelRate = total > 0 ? cancelled / total : 0.0;

  // Derive account age in months (from customer.createdAt)
  const now = Date.now();
  const accountAgeMs = Math.max(0, now - (customer.createdAt || (now - 90 * 86400_000)));
  const accountAgeMonths = Math.min(36, Math.max(1, Math.round(accountAgeMs / (30 * 86400_000))));

  // Address stability: based on number of known addresses relative to order volume
  const knownAddrs = customer.knownAddresses?.length || 1;
  const addressStabilityMonths = Math.max(1, Math.min(accountAgeMonths, Math.round(accountAgeMonths / knownAddrs)));

  // If customer has a stored trustScore, blend with dynamic calculation
  let score = 50.0;

  if (total === 0) {
    // New customer with neutral trust
    score = 55.0;
  } else {
    // Delivery track record
    score += Math.min(35, delivered * 2.5);
    score -= rto * 15.0;

    // Delivery success percentage impact
    if (total >= 3) {
      if (successRate >= 0.90) {
        score += 15.0;
      } else if (successRate >= 0.75) {
        score += 6.0;
      } else if (successRate < 0.50) {
        score -= 22.0;
      }
    }

    // Account longevity & stability
    score += Math.min(12, accountAgeMonths * 0.8);
    score += Math.min(8, addressStabilityMonths * 0.7);

    // Abuse network penalty
    if (suspiciousNetworkLinks > 0) {
      score -= Math.min(40, suspiciousNetworkLinks * 18.0);
    }

    // Cancellation penalty
    if (cancelRate > 0.30) {
      score -= 10.0;
    }
  }

  // Bound to 5 .. 98
  const finalScore = Math.max(5, Math.min(98, Math.round(score)));

  let trustLevel: CustomerTrustPassport['trustLevel'];
  if (finalScore >= 85) {
    trustLevel = 'VERY_HIGH';
  } else if (finalScore >= 70) {
    trustLevel = 'HIGH';
  } else if (finalScore >= 45) {
    trustLevel = 'MODERATE';
  } else {
    trustLevel = 'LOW';
  }

  let summary = '';
  if (trustLevel === 'VERY_HIGH') {
    summary = `Exemplary delivery track record with ${delivered} successful orders and zero abuse graph signals.`;
  } else if (trustLevel === 'HIGH') {
    summary = `Established verified customer with ${(successRate * 100).toFixed(0)}% delivery completion rate.`;
  } else if (trustLevel === 'MODERATE') {
    summary = total === 0 ? 'New customer profile with neutral baseline trust parameters.' : 'Moderate return frequency requiring standard soft confirmation.';
  } else {
    summary = `Elevated RTO frequency (${rto} returns) or suspicious multi-account device cluster connection.`;
  }

  return {
    customerId: customer.id,
    customerName: customer.name,
    trustScore: finalScore,
    trustLevel,
    successfulDeliveries: delivered,
    rtoOrders: rto,
    totalOrders: total,
    deliverySuccessRate: Math.round(successRate * 100) / 100,
    cancellationRate: Math.round(cancelRate * 100) / 100,
    averageOrderValue: customer.averageOrderValue || 2499,
    accountAgeMonths,
    addressStabilityMonths,
    suspiciousNetworkLinks,
    behaviorScore: Math.max(10, Math.min(95, Math.round(finalScore * 0.95))),
    summary,
  };
}

/**
 * Simulates / updates the persistent customer trust profile after an order lifecycle outcome.
 */
export function evolveCustomerTrustOnOutcome(
  customer: Customer,
  outcome: OrderOutcome,
  paymentMethod: PaymentMethod
): Customer {
  const updated = { ...customer };
  updated.totalOrders = (updated.totalOrders || 0) + 1;

  let delta = 0;
  if (outcome === 'DELIVERED') {
    updated.successfulDeliveries = (updated.successfulDeliveries || 0) + 1;
    delta = 4;
    if (paymentMethod !== 'COD') delta += 2; // Prepaid delivery bonus
  } else if (outcome === 'RTO') {
    updated.rtoOrders = (updated.rtoOrders || 0) + 1;
    delta = -16;
  } else if (outcome === 'CANCELLED') {
    updated.cancelledOrders = (updated.cancelledOrders || 0) + 1;
    delta = -3;
  }

  const currentTrust = updated.trustScore ?? computeCustomerTrustPassport(customer).trustScore;
  updated.trustScore = Math.max(5, Math.min(98, currentTrust + delta));

  return updated;
}
