import type { Customer } from './customer';
import type { OrderAddress, PaymentMethod } from './order';

export type RiskDataSource = 'simulation' | 'merchant' | 'payment' | 'logistics';

export interface NormalizedRiskInput {
  source: RiskDataSource;
  customer: Customer;
  address: OrderAddress;
  orderAmount: number;
  paymentMethod: PaymentMethod;
  deviceId: string;
  checkoutDuration?: number;
  checkoutAttempts?: number;
  addressChanges?: number;
  deviceLinkedAccounts?: number;
  productCategory?: string;
  numberOfItems?: number;
  discountPercentage?: number;
}