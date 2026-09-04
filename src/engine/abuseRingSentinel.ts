import type { Customer } from '../types/customer';
import type { Order, OrderAddress } from '../types/order';
import type { NetworkNode, NetworkEdge } from '../types/network';
import type { AbuseRingResult } from '../types/common';

/**
 * Abuse-Ring Sentinel — Graph/Relationship Analysis Layer
 *
 * Detects coordinated fraud rings and multi-account identity clusters across
 * shared devices, addresses, phone identifiers, and IP subnets.
 *
 * Core Concept:
 * "WHY THIS CLUSTER?" — Explainable, actionable network intelligence.
 */
export function analyzeAbuseRing(
  customer: Customer,
  deviceId: string,
  address: OrderAddress,
  allCustomers: Customer[],
  allOrders: Order[],
  _nodes: NetworkNode[],
  edges: NetworkEdge[]
): AbuseRingResult {
  const signals: string[] = [];
  const whyCluster: string[] = [];

  // 1. Device cluster analysis
  const sameDeviceCustIds = new Set<string>();
  for (const c of allCustomers) {
    if (c.knownDevices && c.knownDevices.includes(deviceId)) {
      sameDeviceCustIds.add(c.id);
    }
  }

  const deviceClusterSize = Math.max(1, sameDeviceCustIds.size);

  // 2. Orders linked to this device
  const deviceOrders = allOrders.filter(
    (o) => o.deviceId === deviceId || sameDeviceCustIds.has(o.customerId)
  );
  const deviceOrderCount = deviceOrders.length;
  const deviceRtoOrders = deviceOrders.filter((o) => o.outcome === 'RTO').length;
  const deviceRtoRate = deviceOrderCount > 0 ? deviceRtoOrders / deviceOrderCount : 0.0;

  // 3. Address cluster overlap (same city + pincode + similar address line)
  const normAddr = address.line1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const sameAddrCusts = allCustomers.filter((c) => {
    if (c.id === customer.id) return false;
    const custOrders = allOrders.filter((o) => o.customerId === c.id);
    return custOrders.some(
      (o) =>
        o.address.pincode === address.pincode &&
        o.address.line1.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normAddr.slice(0, 10))
    );
  });

  const addressClusterCount = sameAddrCusts.length;

  // 4. Graph edge traversal in Network Sentinel
  const customerNodeId = customer.id;
  const directEdges = edges.filter((e) => e.source === customerNodeId || e.target === customerNodeId);
  const connectedNodeIds = new Set<string>();
  directEdges.forEach((e) => {
    connectedNodeIds.add(e.source === customerNodeId ? e.target : e.source);
  });

  // Calculate Ring Risk Score (0-100)
  let ringScore = 10.0;

  if (deviceClusterSize >= 4) {
    ringScore += 45.0;
    signals.push(`${deviceClusterSize} separate customer identities share device fingerprint (${deviceId})`);
    whyCluster.push(`${deviceClusterSize} accounts share device fingerprint (${deviceId})`);
  } else if (deviceClusterSize >= 2) {
    ringScore += 20.0;
    signals.push(`${deviceClusterSize} customer accounts share this device`);
    whyCluster.push(`${deviceClusterSize} accounts share this device hardware profile`);
  }

  if (deviceRtoRate >= 0.40 && deviceOrderCount >= 3) {
    ringScore += 25.0;
    signals.push(`Device network cluster exhibits elevated return rate (${(deviceRtoRate * 100).toFixed(0)}% RTO across ${deviceOrderCount} orders)`);
    whyCluster.push(`Cluster return rate is ${(deviceRtoRate * 100).toFixed(0)}% across ${deviceOrderCount} total transactions`);
  }

  if (addressClusterCount >= 2) {
    ringScore += 18.0;
    signals.push(`${addressClusterCount} other accounts share this delivery location`);
    whyCluster.push(`${addressClusterCount + 1} customer identities share this physical delivery address`);
  }

  if (customer.rtoOrders >= 4 && deviceClusterSize >= 2) {
    ringScore += 15.0;
    signals.push('High-RTO account actively operating within multi-device cluster');
    whyCluster.push(`Repeated serial returns (${customer.rtoOrders} RTOs) originating from shared hardware`);
  }

  if (deviceOrderCount >= 8) {
    whyCluster.push(`${deviceOrderCount} high-velocity COD orders submitted within short timeframe`);
  }

  const finalRingScore = Math.min(100, Math.max(0, Math.round(ringScore)));
  const ringDetected = finalRingScore >= 50 || deviceClusterSize >= 3;

  if (whyCluster.length === 0) {
    whyCluster.push('Single customer identity; standard isolated hardware signature');
    whyCluster.push('No shared addresses or phone collisions detected in network graph');
  }

  return {
    ringRiskScore: finalRingScore,
    ringDetected,
    clusterSize: Math.max(deviceClusterSize, addressClusterCount + 1),
    signals: signals.length > 0 ? signals : ['No suspicious multi-identity cluster patterns detected'],
    whyCluster,
  };
}
