import type { Customer } from '../types/customer';
import type { Order } from '../types/order';
import type { AnalyzerResult, Evidence } from '../types/risk';

export function analyzeHistory(
  customer: Customer,
  recentOrders: Order[]
): AnalyzerResult {
  const evidence: Evidence[] = [];
  const signals: string[] = [];
  let risk = 0;
  let confidence = 0;

  const totalOrders = customer.totalOrders;

  // --- No/low history: low evidence, low confidence ---
  if (totalOrders === 0) {
    signals.push('New customer — no order history');
    evidence.push({
      type: 'HISTORY', signal: 'NEW_CUSTOMER', value: 0,
      contribution: 0,
      explanation: 'No historical orders available — insufficient evidence for history-based risk',
    });
    // New customer should NOT be automatically HIGH risk
    return { risk: 10, confidence: 0.15, signals, evidence };
  }

  if (totalOrders <= 2) {
    signals.push('Very limited order history');
    confidence = 0.3;
  } else if (totalOrders <= 5) {
    confidence = 0.55;
  } else if (totalOrders <= 15) {
    confidence = 0.75;
  } else {
    confidence = 0.9;
  }

  // --- RTO Rate ---
  const rtoRate = customer.rtoOrders / Math.max(totalOrders, 1);
  if (rtoRate > 0.5) {
    risk += 40;
    signals.push(`Very high RTO rate (${(rtoRate * 100).toFixed(0)}%)`);
  } else if (rtoRate > 0.3) {
    risk += 25;
    signals.push(`Elevated RTO rate (${(rtoRate * 100).toFixed(0)}%)`);
  } else if (rtoRate > 0.15) {
    risk += 12;
    signals.push(`Moderate RTO rate (${(rtoRate * 100).toFixed(0)}%)`);
  } else if (rtoRate > 0) {
    risk += 3;
  }

  evidence.push({
    type: 'HISTORY', signal: 'RTO_RATE', value: parseFloat(rtoRate.toFixed(2)),
    contribution: 0,
    explanation: `${customer.rtoOrders} of ${totalOrders} historical orders resulted in RTO`,
  });

  // --- Cancellation Rate ---
  const cancelRate = customer.cancelledOrders / Math.max(totalOrders, 1);
  if (cancelRate > 0.3) {
    risk += 10;
    signals.push(`High cancellation rate (${(cancelRate * 100).toFixed(0)}%)`);
  } else if (cancelRate > 0.15) {
    risk += 5;
  }

  // --- COD Ratio ---
  const codRatio = customer.codOrders / Math.max(totalOrders, 1);
  if (codRatio > 0.85) {
    risk += 12;
    signals.push(`Very high COD dependence (${(codRatio * 100).toFixed(0)}%)`);
  } else if (codRatio > 0.7) {
    risk += 6;
    signals.push(`High COD ratio (${(codRatio * 100).toFixed(0)}%)`);
  }

  evidence.push({
    type: 'HISTORY', signal: 'COD_RATIO', value: parseFloat(codRatio.toFixed(2)),
    contribution: 0,
    explanation: `${customer.codOrders} of ${totalOrders} orders were COD (${(codRatio * 100).toFixed(0)}%)`,
  });

  // --- Successful Delivery Rate ---
  const deliveryRate = customer.successfulDeliveries / Math.max(totalOrders, 1);
  if (deliveryRate < 0.4) {
    risk += 15;
    signals.push(`Low successful delivery rate (${(deliveryRate * 100).toFixed(0)}%)`);
  }

  // --- Recent RTO Frequency (from recent orders) ---
  const recent = recentOrders.filter(o => o.customerId === customer.id);
  const recentRTOs = recent.filter(o => o.outcome === 'RTO').length;
  if (recent.length >= 3 && recentRTOs / recent.length > 0.5) {
    risk += 15;
    signals.push(`Recent RTO streak: ${recentRTOs} of last ${recent.length} orders`);
    evidence.push({
      type: 'HISTORY', signal: 'RECENT_RTO_STREAK', value: recentRTOs,
      contribution: 0,
      explanation: `${recentRTOs} of ${recent.length} recent orders resulted in RTO`,
    });
  }

  const finalRisk = Math.min(100, Math.max(0, risk));
  return { risk: finalRisk, confidence, signals, evidence };
}
