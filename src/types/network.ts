export type NetworkNodeType =
  | 'CUSTOMER'
  | 'DEVICE'
  | 'PHONE_HASH'
  | 'EMAIL_HASH'
  | 'ADDRESS_HASH'
  | 'IP_SUBNET'
  | 'ORDER';

export type NetworkRelationship =
  | 'USES_DEVICE'
  | 'USES_PHONE'
  | 'USES_EMAIL'
  | 'USES_ADDRESS'
  | 'PLACED_ORDER'
  | 'CONNECTED_TO_IP';

export interface NetworkNode {
  id: string;
  type: NetworkNodeType;
  label: string;
  metadata: Record<string, unknown>;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  relationship: NetworkRelationship;
}

export interface NetworkCluster {
  id: string;
  nodes: string[];
  deviceCount: number;
  customerCount: number;
  orderCount: number;
  highRTOCustomers: number;
  riskLevel: number;          // 0–100
  recentActivity: number;     // orders in last 24h
}
