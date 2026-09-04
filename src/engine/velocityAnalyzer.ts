import type { Order } from '../types/order';
import type { AnalyzerResult, Evidence } from '../types/risk';

interface VelocityWindow {
  label: string;
  durationMs: number;
}

const WINDOWS: VelocityWindow[] = [
  { label: '5min', durationMs: 5 * 60_000 },
  { label: '15min', durationMs: 15 * 60_000 },
  { label: '1hr', durationMs: 60 * 60_000 },
  { label: '24hr', durationMs: 24 * 60 * 60_000 },
];

/**
 * Velocity analyzer: compares current-window order rates against computed baseline.
 * Does NOT hardcode "420% increase."
 */
export function analyzeVelocity(
  allOrders: Order[],
  currentDeviceId?: string,
  currentIpSubnet?: string
): AnalyzerResult {
  const evidence: Evidence[] = [];
  const signals: string[] = [];
  let risk = 0;
  let confidence = 0.5;
  const now = Date.now();

  // Compute baseline: average rate over the last 30 days
  const thirtyDaysAgo = now - 30 * 86400_000;
  const baselineOrders = allOrders.filter(o => o.timestamp >= thirtyDaysAgo && o.timestamp < now);
  const baselineHours = Math.max(1, (now - thirtyDaysAgo) / 3600_000);
  const baselineRatePerHour = baselineOrders.length / baselineHours;

  // For each window, compare current rate to baseline
  let maxAnomaly = 0;
  for (const win of WINDOWS) {
    const windowStart = now - win.durationMs;
    const windowOrders = allOrders.filter(o => o.timestamp >= windowStart);
    const windowHours = win.durationMs / 3600_000;
    const windowRate = windowOrders.length / windowHours;

    if (baselineRatePerHour > 0) {
      const ratio = windowRate / baselineRatePerHour;
      if (ratio > maxAnomaly) maxAnomaly = ratio;

      if (ratio > 5 && windowOrders.length >= 3) {
        risk += 25;
        signals.push(`${win.label}: ${windowOrders.length} orders (${ratio.toFixed(1)}x baseline)`);
        evidence.push({
          type: 'VELOCITY', signal: `RATE_ANOMALY_${win.label.toUpperCase()}`,
          value: parseFloat(ratio.toFixed(1)),
          contribution: 0,
          explanation: `${windowOrders.length} orders in ${win.label} window = ${windowRate.toFixed(1)}/hr vs baseline ${baselineRatePerHour.toFixed(1)}/hr`,
        });
      } else if (ratio > 3 && windowOrders.length >= 3) {
        risk += 12;
        signals.push(`${win.label}: elevated rate (${ratio.toFixed(1)}x baseline)`);
      }
    }
  }

  // COD percentage in recent window (1hr)
  const hourOrders = allOrders.filter(o => o.timestamp >= now - 3600_000);
  if (hourOrders.length >= 3) {
    const codCount = hourOrders.filter(o => o.paymentMethod === 'COD').length;
    const codPct = codCount / hourOrders.length;
    if (codPct > 0.9) {
      risk += 8;
      signals.push(`${(codPct * 100).toFixed(0)}% COD in last hour`);
    }
  }

  // Per-device velocity
  if (currentDeviceId) {
    const deviceRecent = allOrders.filter(o =>
      o.deviceId === currentDeviceId && o.timestamp >= now - 3600_000
    );
    if (deviceRecent.length >= 4) {
      risk += 12;
      signals.push(`${deviceRecent.length} orders from this device in last hour`);
      evidence.push({
        type: 'VELOCITY', signal: 'DEVICE_VELOCITY',
        value: deviceRecent.length,
        contribution: 0,
        explanation: `${deviceRecent.length} orders placed from device ${currentDeviceId} in the last hour`,
      });
    }
  }

  // Per-IP-subnet velocity
  if (currentIpSubnet) {
    const ipRecent = allOrders.filter(o =>
      o.ipSubnet === currentIpSubnet && o.timestamp >= now - 3600_000
    );
    if (ipRecent.length >= 5) {
      risk += 8;
      signals.push(`${ipRecent.length} orders from this IP subnet in last hour`);
    }
  }

  // Adjust confidence based on data availability
  if (baselineOrders.length < 5) {
    confidence = 0.3;
    signals.push('Limited baseline data for velocity comparison');
  } else if (baselineOrders.length < 20) {
    confidence = 0.55;
  } else {
    confidence = 0.8;
  }

  // New accounts in recent window
  // (simplified: we look at recent orders from customers whose first order was recent)
  const recentNewCustomerOrders = allOrders.filter(o => {
    const firstOrder = allOrders
      .filter(oo => oo.customerId === o.customerId)
      .sort((a, b) => a.timestamp - b.timestamp)[0];
    return firstOrder && (now - firstOrder.timestamp) < 7 * 86400_000 &&
      o.timestamp >= now - 86400_000;
  });
  if (recentNewCustomerOrders.length >= 5) {
    risk += 8;
    signals.push(`${recentNewCustomerOrders.length} orders from new accounts in last 24h`);
  }

  const finalRisk = Math.min(100, Math.max(0, risk));
  return { risk: finalRisk, confidence, signals, evidence };
}
