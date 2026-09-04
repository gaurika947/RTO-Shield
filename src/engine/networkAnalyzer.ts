import type { Customer } from '../types/customer';
import type { Order } from '../types/order';
import type { NetworkNode, NetworkEdge } from '../types/network';
import type { AnalyzerResult, Evidence } from '../types/risk';

/**
 * Network risk is NOT "same device = fraud".
 * Risk comes from: device reuse + abnormal RTO + high account concentration + temporal clustering.
 */
export function analyzeNetwork(
  customer: Customer,
  deviceId: string,
  allCustomers: Customer[],
  allOrders: Order[],
  _networkNodes: NetworkNode[],
  _networkEdges: NetworkEdge[]
): AnalyzerResult {
  const evidence: Evidence[] = [];
  const signals: string[] = [];
  let risk = 0;
  let confidence = 0.5;

  // Find all customers sharing the same device
  const linkedCustomerIds = new Set<string>();
  for (const c of allCustomers) {
    if (c.knownDevices.includes(deviceId)) {
      linkedCustomerIds.add(c.id);
    }
  }
  // Remove the current customer
  linkedCustomerIds.delete(customer.id);

  const linkedCount = linkedCustomerIds.size;

  // Device reuse count
  if (linkedCount === 0) {
    // Single-user device — low network risk signal
    evidence.push({
      type: 'NETWORK', signal: 'SINGLE_USER_DEVICE', value: 1,
      contribution: 0,
      explanation: 'Device is used by only this customer — no sharing detected',
    });
    return { risk: 0, confidence: 0.6, signals: ['Single-user device'], evidence };
  }

  // Linked customers found
  evidence.push({
    type: 'NETWORK', signal: 'DEVICE_SHARING', value: linkedCount,
    contribution: 0,
    explanation: `Device ${deviceId} is shared with ${linkedCount} other customer${linkedCount > 1 ? 's' : ''}`,
  });

  if (linkedCount >= 5) {
    signals.push(`Device linked to ${linkedCount + 1} customer accounts`);
    confidence = 0.85;
  } else if (linkedCount >= 2) {
    signals.push(`Device shared with ${linkedCount} other accounts`);
    confidence = 0.7;
  } else {
    signals.push('Device shared with 1 other account');
    confidence = 0.55;
  }

  // High-RTO linked accounts
  const linkedCustomers = allCustomers.filter(c => linkedCustomerIds.has(c.id));
  const highRTOLinked = linkedCustomers.filter(c => {
    const rate = c.rtoOrders / Math.max(c.totalOrders, 1);
    return rate > 0.3;
  });

  if (highRTOLinked.length > 0) {
    const rtoContrib = Math.min(40, highRTOLinked.length * 10);
    risk += rtoContrib;
    signals.push(`${highRTOLinked.length} linked account${highRTOLinked.length > 1 ? 's' : ''} with elevated RTO behavior`);
    evidence.push({
      type: 'NETWORK', signal: 'HIGH_RTO_LINKED_ACCOUNTS', value: highRTOLinked.length,
      contribution: 0,
      explanation: `Device linked to ${highRTOLinked.length} customer${highRTOLinked.length > 1 ? 's' : ''} with >30% RTO rate`,
    });
  }

  // Account concentration risk
  if (linkedCount >= 5) {
    risk += 20;
    signals.push('High account concentration on single device');
  } else if (linkedCount >= 3) {
    risk += 10;
  }

  // Linked order count
  const linkedOrderIds = new Set<string>();
  for (const o of allOrders) {
    if (linkedCustomerIds.has(o.customerId) || o.customerId === customer.id) {
      if (o.deviceId === deviceId) {
        linkedOrderIds.add(o.id);
      }
    }
  }

  if (linkedOrderIds.size > 20) {
    risk += 15;
    signals.push(`${linkedOrderIds.size} orders from this device cluster`);
  } else if (linkedOrderIds.size > 10) {
    risk += 8;
  }

  evidence.push({
    type: 'NETWORK', signal: 'CLUSTER_ORDER_COUNT', value: linkedOrderIds.size,
    contribution: 0,
    explanation: `${linkedOrderIds.size} total orders placed from device cluster`,
  });

  // Temporal clustering (many orders in recent 7 days)
  const recentWindow = 7 * 86400_000;
  const now = Date.now();
  const recentClusterOrders = allOrders.filter(o =>
    (linkedCustomerIds.has(o.customerId) || o.customerId === customer.id) &&
    o.deviceId === deviceId &&
    (now - o.timestamp) < recentWindow
  );

  if (recentClusterOrders.length >= 5) {
    risk += 15;
    signals.push(`${recentClusterOrders.length} cluster orders in last 7 days — temporal concentration`);
    evidence.push({
      type: 'NETWORK', signal: 'TEMPORAL_CLUSTERING', value: recentClusterOrders.length,
      contribution: 0,
      explanation: `${recentClusterOrders.length} orders from this device cluster in the last 7 days`,
    });
    confidence = Math.max(confidence, 0.85);
  }

  // COD concentration in cluster
  const clusterCOD = allOrders.filter(o =>
    (linkedCustomerIds.has(o.customerId) || o.customerId === customer.id) &&
    o.deviceId === deviceId && o.paymentMethod === 'COD'
  );
  const codClusterRatio = clusterCOD.length / Math.max(linkedOrderIds.size, 1);
  if (codClusterRatio > 0.9 && linkedOrderIds.size > 5) {
    risk += 10;
    signals.push('Near-100% COD usage in device cluster');
  }

  const finalRisk = Math.min(100, Math.max(0, risk));
  return { risk: finalRisk, confidence, signals, evidence };
}
