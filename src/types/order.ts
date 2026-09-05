import type { RiskTier, DecisionAction, PaymentMethod, OrderOutcome } from './common';
export type { PaymentMethod, OrderOutcome };

export interface OrderAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface Order {
  id: string;                  // ORD_xxxx
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  address: OrderAddress;
  deviceId: string;            // DEV_xxxx
  ipSubnet: string;            // ip_subnet_xxxx
  timestamp: number;
  riskScore?: number;
  rtoProbability?: number;
  riskTier?: RiskTier;
  decision?: DecisionAction;
  evaluationId?: string;
  policyVersion?: string;
  outcome: OrderOutcome;
}
