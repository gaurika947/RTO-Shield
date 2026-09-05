import { describe, it, expect } from 'vitest';
import { DEMO_TRANSACTIONS } from '../src/data/demoTransactions';
import { evaluateRisk } from '../src/engine/riskEngine';
import { predictRTO } from '../src/engine/mlModelEngine';
import { SEED_CUSTOMERS, SEED_ORDERS, buildNetworkFromData } from '../src/data/seedData';
import type { MerchantSettings } from '../src/types/risk';

describe('Demo Transactions Distribution Test', () => {
  const defaultSettings: MerchantSettings = {
    mediumThreshold: 30,
    highThreshold: 70,
    codFee: 50,
    upiDiscount: 30,
    otpRequired: true,
    weights: {
      ml: 0.20,
      history: 0.20,
      network: 0.20,
      velocity: 0.15,
      address: 0.12,
      behavior: 0.08,
      ai: 0.05,
    },
    riskEngineVersion: 'RISK_ENGINE_V3',
    policyVersion: 'POLICY_V3',
    policyCounter: 1,
    aiEnabled: true,
  };

  const network = buildNetworkFromData(SEED_CUSTOMERS, SEED_ORDERS);

  it('prints distribution of demo transactions', () => {
    console.log('--- EVALUATING ALL DEMO TRANSACTIONS WITH NATIVE SEED DATA ---');
    const results: any[] = [];
    for (const tx of DEMO_TRANSACTIONS) {
      const mlOutput = predictRTO({
        customer: tx.customer,
        address: tx.address,
        orderAmount: tx.orderAmount,
        paymentMethod: tx.paymentMethod,
        deviceId: tx.deviceId,
        checkoutDuration: tx.checkoutDuration,
        checkoutAttempts: tx.checkoutAttempts,
        addressChanges: tx.addressChanges,
        deviceLinkedAccounts: tx.deviceLinkedOrdersCount,
      });

      const riskResult = evaluateRisk(
        tx.address,
        tx.customer,
        tx.deviceId,
        SEED_CUSTOMERS,
        SEED_ORDERS,
        network.nodes,
        network.edges,
        defaultSettings,
        undefined,
        {
          available: true,
          rtoProbability: mlOutput.rtoProbability,
          predictedClass: mlOutput.rtoProbability >= 0.5 ? 1 : 0,
          modelVersion: 'RTO-XGB-v1',
          confidence: 0.88,
          riskScore: mlOutput.riskScore,
          intentScore: mlOutput.intentScore,
          reasons: mlOutput.reasons,
          source: 'client',
          modelSource: 'deterministic_fallback',
          featureSchemaVersion: 'rto-features-v1',
        }
      );

      results.push({
        id: tx.orderNumber,
        customer: tx.customer.name,
        payment: tx.paymentMethod,
        mlProb: `${Math.round(mlOutput.rtoProbability * 100)}%`,
        finalRisk: riskResult.score,
        tier: riskResult.tier,
      });
    }

    console.table(results);
    const lowCount = results.filter((r) => r.tier === 'LOW').length;
    const medCount = results.filter((r) => r.tier === 'MEDIUM').length;
    const highCount = results.filter((r) => r.tier === 'HIGH').length;
    console.log(`Summary: LOW=${lowCount}, MEDIUM=${medCount}, HIGH=${highCount}`);
    expect(lowCount).toBeGreaterThanOrEqual(3);
    expect(medCount).toBeGreaterThanOrEqual(3);
    expect(highCount).toBeGreaterThanOrEqual(3);
  });
});
