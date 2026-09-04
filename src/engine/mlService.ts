import type { Customer } from '../types/customer';
import type { OrderAddress, PaymentMethod } from '../types/order';
import { predictRTO, type RawOrderContext } from './mlModelEngine';

/**
 * ML Inference Service — Clean contract for RTO prediction.
 *
 * Priority:
 *   1. Backend API (POST /api/ml/rto-predict)
 *   2. Client-side logistic model (mlModelEngine.ts)
 *   3. Neutral fallback ({ available: false })
 *
 * The ML prediction is ONE SIGNAL in the risk engine — not the final score.
 */
import type { FeatureReason } from '../types/common';

export interface MLInferenceResult {
  available: boolean;
  rtoProbability: number;     // 0–1
  predictedClass: number;     // 0 or 1
  modelVersion: string;       // e.g. 'RTO-XGB-v1'
  confidence: number;         // 0–1
  riskScore: number;          // 0–100 (ML-only score, NOT final score)
  intentScore: number;
  reasons: FeatureReason[];
  source: 'backend' | 'client' | 'fallback';
}

const ML_API_URL = '/api/ml/rto-predict';

export async function runMLInference(
  customer: Customer,
  address: OrderAddress,
  orderAmount: number,
  paymentMethod: PaymentMethod,
  deviceId: string,
  opts?: {
    checkoutDuration?: number;
    checkoutAttempts?: number;
    addressChanges?: number;
    deviceLinkedAccounts?: number;
  }
): Promise<MLInferenceResult> {
  // Try backend API first
  try {
    const response = await fetch(ML_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          previous_orders: customer.totalOrders,
          previous_delivered_orders: customer.successfulDeliveries,
          previous_rto_orders: customer.rtoOrders,
          device_linked_accounts: opts?.deviceLinkedAccounts ?? customer.knownDevices?.length ?? 1,
        },
        order: {
          order_value: orderAmount,
          payment_method: paymentMethod,
        },
        address: {
          line1: address.line1,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          landmark: address.landmark,
        },
        behavior: {
          checkout_duration: opts?.checkoutDuration,
          checkout_attempts: opts?.checkoutAttempts,
          address_changes: opts?.addressChanges,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        available: true,
        rtoProbability: data.rtoProbability ?? 0.5,
        predictedClass: data.rtoProbability >= 0.5 ? 1 : 0,
        modelVersion: 'RTO-XGB-v1',
        confidence: Math.min(1, Math.max(0, 1 - Math.abs(data.rtoProbability - 0.5) * 0.5 + 0.5)),
        riskScore: data.riskScore ?? Math.round((data.rtoProbability ?? 0.5) * 100),
        intentScore: data.intentScore ?? 50,
        reasons: data.reasons ?? [],
        source: 'backend',
      };
    }
  } catch {
    // Backend unavailable — fall through to client-side
  }

  // Fallback: client-side model
  try {
    const context: RawOrderContext = {
      customer,
      address,
      orderAmount,
      paymentMethod,
      deviceId,
      checkoutDuration: opts?.checkoutDuration,
      checkoutAttempts: opts?.checkoutAttempts,
      addressChanges: opts?.addressChanges,
      deviceLinkedAccounts: opts?.deviceLinkedAccounts,
    };

    const result = predictRTO(context);

    return {
      available: true,
      rtoProbability: result.rtoProbability,
      predictedClass: result.rtoProbability >= 0.5 ? 1 : 0,
      modelVersion: 'RTO-XGB-v1',
      confidence: Math.min(1, Math.max(0, 1 - Math.abs(result.rtoProbability - 0.5) * 0.5 + 0.5)),
      riskScore: result.riskScore,
      intentScore: result.intentScore,
      reasons: result.reasons,
      source: 'client',
    };
  } catch {
    // Both failed
  }

  // Final fallback: neutral
  return {
    available: false,
    rtoProbability: 0.5,
    predictedClass: 0,
    modelVersion: 'UNAVAILABLE',
    confidence: 0,
    riskScore: 50,
    intentScore: 50,
    reasons: [{ feature: 'ml_unavailable', impact: 'low', points: 0, message: 'ML model unavailable — using deterministic risk signals only' }],
    source: 'fallback',
  };
}
