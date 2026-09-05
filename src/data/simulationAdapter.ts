import type { DemoTransaction } from './demoTransactions';
import type { NormalizedRiskInput } from '../types/normalized';

export function normalizeSimulationTransaction(transaction: DemoTransaction): NormalizedRiskInput {
  return {
    source: 'simulation',
    customer: transaction.customer,
    address: transaction.address,
    orderAmount: transaction.orderAmount,
    paymentMethod: transaction.paymentMethod,
    deviceId: transaction.deviceId,
    checkoutDuration: transaction.checkoutDuration,
    checkoutAttempts: transaction.checkoutAttempts,
    addressChanges: transaction.addressChanges,
    deviceLinkedAccounts: transaction.deviceLinkedOrdersCount,
  };
}