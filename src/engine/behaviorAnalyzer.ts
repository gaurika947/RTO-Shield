import type { Customer } from '../types/customer';
import type { Order } from '../types/order';
import type { AnalyzerResult, Evidence } from '../types/risk';

/**
 * Behavior analyzer: COD dependence, order frequency, repeat cancellations,
 * recent RTO streaks, order value anomalies, new-account burst.
 */
export function analyzeBehavior(
  customer: Customer,
  recentOrders: Order[],
  allOrders: Order[]
): AnalyzerResult {
  const evidence: Evidence[] = [];
  const signals: string[] = [];
  let risk = 0;
  let confidence = 0.5;

  const total = customer.totalOrders;

  // --- Very new customer: limited behavioral data ---
  if (total === 0) {
    return {
      risk: 5,
      confidence: 0.15,
      signals: ['No behavioral history available'],
      evidence: [{
        type: 'BEHAVIOR', signal: 'NO_HISTORY', value: 0,
        contribution: 0,
        explanation: 'Customer has no order history — insufficient behavioral data',
      }],
    };
  }

  // --- COD dependence ---
  const codRatio = customer.codOrders / Math.max(total, 1);
  if (codRatio > 0.9 && total >= 5) {
    risk += 20;
    signals.push(`Extremely high COD dependence (${(codRatio * 100).toFixed(0)}%)`);
    evidence.push({
      type: 'BEHAVIOR', signal: 'COD_DEPENDENCE', value: parseFloat(codRatio.toFixed(2)),
      contribution: 0,
      explanation: `${customer.codOrders} of ${total} orders are COD — very high dependence`,
    });
  } else if (codRatio > 0.75 && total >= 3) {
    risk += 10;
    signals.push(`High COD preference (${(codRatio * 100).toFixed(0)}%)`);
  }

  // --- Order frequency (orders per month) ---
  const accountAgeDays = Math.max(1, (Date.now() - customer.createdAt) / 86400_000);
  const ordersPerMonth = total / (accountAgeDays / 30);
  if (ordersPerMonth > 10) {
    risk += 15;
    signals.push(`Very high order frequency (${ordersPerMonth.toFixed(1)}/month)`);
  } else if (ordersPerMonth > 5) {
    risk += 5;
  }

  // --- Repeat cancellations ---
  const cancelRate = customer.cancelledOrders / Math.max(total, 1);
  if (cancelRate > 0.25 && customer.cancelledOrders >= 3) {
    risk += 12;
    signals.push(`High cancellation rate (${customer.cancelledOrders} of ${total})`);
  }

  // --- Recent RTO streak ---
  const custRecent = recentOrders
    .filter(o => o.customerId === customer.id)
    .sort((a, b) => b.timestamp - a.timestamp);
  let rtoStreak = 0;
  for (const o of custRecent) {
    if (o.outcome === 'RTO') rtoStreak++;
    else break;
  }
  if (rtoStreak >= 3) {
    risk += 20;
    signals.push(`${rtoStreak} consecutive recent RTO outcomes`);
    evidence.push({
      type: 'BEHAVIOR', signal: 'RTO_STREAK', value: rtoStreak,
      contribution: 0,
      explanation: `Last ${rtoStreak} orders were returned to origin in sequence`,
    });
  } else if (rtoStreak >= 2) {
    risk += 8;
    signals.push(`${rtoStreak} recent consecutive RTOs`);
  }

  // --- Order value anomaly ---
  if (customer.averageOrderValue > 0 && allOrders.length > 0) {
    const custOrders = allOrders.filter(o => o.customerId === customer.id);
    if (custOrders.length >= 3) {
      const latest = custOrders.sort((a, b) => b.timestamp - a.timestamp)[0];
      if (latest && latest.amount > customer.averageOrderValue * 3) {
        risk += 10;
        signals.push(`Latest order value (₹${latest.amount}) significantly above average (₹${customer.averageOrderValue})`);
      }
    }
  }

  // --- New-account burst ---
  if (accountAgeDays <= 7 && total >= 3) {
    risk += 15;
    signals.push(`${total} orders within ${Math.ceil(accountAgeDays)} days of account creation`);
    evidence.push({
      type: 'BEHAVIOR', signal: 'NEW_ACCOUNT_BURST', value: total,
      contribution: 0,
      explanation: `${total} orders placed within ${Math.ceil(accountAgeDays)} days of creating account`,
    });
  }

  // --- Confidence from data volume ---
  if (total >= 10) confidence = 0.85;
  else if (total >= 5) confidence = 0.7;
  else if (total >= 2) confidence = 0.5;
  else confidence = 0.3;

  const finalRisk = Math.min(100, Math.max(0, risk));
  return { risk: finalRisk, confidence, signals, evidence };
}
