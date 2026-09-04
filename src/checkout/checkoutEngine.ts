import type { PaymentMethod, OrderOutcome } from '../types/order';
import type { RiskResult, DecisionResult } from '../types/risk';

/**
 * Checkout Engine — Order lifecycle management
 *
 * Features:
 * - Idempotent evaluation (same checkout state → same evaluation, no duplicates)
 * - Idempotent order creation (prevents double-click duplicates)
 * - OTP simulation (demo, clearly labeled)
 * - Outcome simulation
 * - Payment method validation
 */

let orderCounter = 100;

// --- Idempotency tracking ---
const evaluationCache = new Map<string, { riskResult: RiskResult; decision: DecisionResult }>();
const pendingOrders = new Set<string>();

function makeCheckoutKey(customerId: string, address: string, amount: number, deviceId: string): string {
  return `${customerId}|${address}|${amount}|${deviceId}`;
}

export function getCachedEvaluation(customerId: string, address: string, amount: number, deviceId: string) {
  const key = makeCheckoutKey(customerId, address, amount, deviceId);
  return evaluationCache.get(key) || null;
}

export function cacheEvaluation(
  customerId: string, address: string, amount: number, deviceId: string,
  riskResult: RiskResult, decision: DecisionResult
) {
  const key = makeCheckoutKey(customerId, address, amount, deviceId);
  evaluationCache.set(key, { riskResult, decision });
}

export function clearEvaluationCache() {
  evaluationCache.clear();
}

// --- Order creation (idempotent) ---
export function createOrderId(): string {
  orderCounter++;
  return `ORD_${String(orderCounter).padStart(4, '0')}`;
}

export function canCreateOrder(evaluationId: string): boolean {
  return !pendingOrders.has(evaluationId);
}

export function markOrderPending(evaluationId: string): void {
  pendingOrders.add(evaluationId);
}

export function clearPendingOrders(): void {
  pendingOrders.clear();
}

// --- Payment method validation ---
export function validatePaymentMethod(
  method: PaymentMethod,
  allowedMethods: PaymentMethod[]
): { valid: boolean; reason?: string } {
  if (allowedMethods.includes(method)) {
    return { valid: true };
  }
  return {
    valid: false,
    reason: method === 'COD'
      ? 'Cash on Delivery isn\'t available for this order.'
      : `${method} is not available for this order.`,
  };
}

// --- OTP Simulation (DEMO) ---
let currentOTP: string | null = null;

export function generateOTP(): string {
  currentOTP = String(Math.floor(100000 + Math.random() * 900000));
  return currentOTP;
}

export function verifyOTP(input: string): boolean {
  return currentOTP !== null && input === currentOTP;
}

// --- Outcome simulation ---
export const POSSIBLE_OUTCOMES: OrderOutcome[] = [
  'DELIVERED', 'RTO', 'CANCELLED',
];

// --- Payment Gateway Abstraction ---
export interface PaymentGateway {
  name: string;
  processPayment(orderId: string, amount: number, method: PaymentMethod): Promise<{ success: boolean; transactionId: string }>;
}

export class MockPaymentGateway implements PaymentGateway {
  name = 'Mock Payment Gateway';

  async processPayment(orderId: string, _amount: number, _method: PaymentMethod) {
    // Simulate processing delay
    await new Promise(r => setTimeout(r, 500));
    return {
      success: true,
      transactionId: `TXN_${Date.now()}_${orderId}`,
    };
  }
}

/**
 * RazorpayPaymentGateway — Stub for future integration.
 */
export class RazorpayPaymentGateway implements PaymentGateway {
  name = 'Razorpay (Not Connected)';

  async processPayment(_orderId: string, _amount: number, _method: PaymentMethod): Promise<{ success: boolean; transactionId: string }> {
    throw new Error(
      'Razorpay integration requires valid credentials. ' +
      'Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env and implement server-side integration.'
    );
  }
}
