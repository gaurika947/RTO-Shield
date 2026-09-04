import { describe, it, expect } from 'vitest';
import { computeCustomerTrustPassport, evolveCustomerTrustOnOutcome } from '../src/engine/trustEngine';
import { simulateCounterfactualRisk } from '../src/engine/counterfactualEngine';
import { optimizeIntervention } from '../src/engine/interventionEngine';
import { runPolicySimulation, DEFAULT_SIMULATION_INPUTS } from '../src/engine/simulationEngine';
import type { Customer } from '../src/types/customer';
import type { OrderAddress } from '../src/types/order';
import type { MerchantSettings } from '../src/types/risk';

describe('Customer Trust Engine', () => {
  const verifiedCustomer: Customer = {
    id: 'CUS_TEST_1',
    name: 'Priya Sharma',
    phoneHash: 'phone_1',
    emailHash: 'email_1',
    totalOrders: 15,
    successfulDeliveries: 14,
    rtoOrders: 0,
    cancelledOrders: 1,
    codOrders: 5,
    prepaidOrders: 10,
    averageOrderValue: 2100,
    knownDevices: ['DEV_1'],
    knownAddresses: ['ADDR_1'],
    createdAt: Date.now() - 240 * 86400_000,
  };

  it('computes very high trust score for verified loyal buyer', () => {
    const passport = computeCustomerTrustPassport(verifiedCustomer, 0);
    expect(passport.trustScore).toBeGreaterThanOrEqual(85);
    expect(passport.trustLevel).toBe('VERY_HIGH');
    expect(passport.deliverySuccessRate).toBeCloseTo(0.93, 1);
  });

  it('evolves trust dynamically on delivery (+trust) and RTO (-trust)', () => {
    const deliveredCustomer = evolveCustomerTrustOnOutcome(verifiedCustomer, 'DELIVERED', 'COD');
    expect(deliveredCustomer.successfulDeliveries).toBe(15);
    expect(deliveredCustomer.trustScore).toBeGreaterThanOrEqual(verifiedCustomer.trustScore || 85);

    const rtoCustomer = evolveCustomerTrustOnOutcome(verifiedCustomer, 'RTO', 'COD');
    expect(rtoCustomer.rtoOrders).toBe(1);
    expect(rtoCustomer.trustScore).toBeLessThan(deliveredCustomer.trustScore || 90);
  });
});

describe('AI Counterfactual Risk Engine', () => {
  const customer: Customer = {
    id: 'CUS_TEST_2',
    name: 'Rahul Verma',
    phoneHash: 'phone_2',
    emailHash: 'email_2',
    totalOrders: 7,
    successfulDeliveries: 2,
    rtoOrders: 5,
    cancelledOrders: 0,
    codOrders: 7,
    prepaidOrders: 0,
    averageOrderValue: 3100,
    knownDevices: ['DEV_1', 'DEV_2'],
    knownAddresses: ['ADDR_1'],
    createdAt: Date.now() - 60 * 86400_000,
  };

  const address: OrderAddress = {
    line1: 'House 88, Raj Nagar Extension',
    city: 'Ghaziabad',
    state: 'Uttar Pradesh',
    pincode: '201017',
  };

  it('reduces projected risk significantly when switching to prepaid', () => {
    const baselineSim = simulateCounterfactualRisk(customer, address, 3299, 'COD', 'DEV_1', {
      phoneVerification: false,
      prepaidPayment: false,
      verifiedAddress: false,
      removeSuspiciousNetwork: false,
    });

    const prepaidSim = simulateCounterfactualRisk(customer, address, 3299, 'COD', 'DEV_1', {
      phoneVerification: false,
      prepaidPayment: true,
      verifiedAddress: false,
      removeSuspiciousNetwork: false,
    });

    expect(prepaidSim.projectedRiskScore).toBeLessThan(baselineSim.currentRiskScore);
    expect(prepaidSim.pointsReduction).toBeGreaterThan(20);
  });
});

describe('AI Intervention Optimizer', () => {
  const defaultSettings: MerchantSettings = {
    mediumThreshold: 25,
    highThreshold: 50,
    criticalThreshold: 75,
    codFee: 49,
    upiDiscount: 50,
    otpRequired: true,
    weights: { address: 0.15, history: 0.20, network: 0.20, velocity: 0.15, behavior: 0.10, ai: 0.10, ml: 0.10 },
    riskEngineVersion: 'V2',
    policyVersion: 'V2',
    policyCounter: 1,
    aiEnabled: true,
  };

  it('downgrades friction for high-trust customer with elevated order risk', () => {
    const highTrustPassport = {
      customerId: 'CUS_1',
      customerName: 'Priya',
      trustScore: 92,
      trustLevel: 'VERY_HIGH' as const,
      successfulDeliveries: 14,
      rtoOrders: 0,
      totalOrders: 15,
      deliverySuccessRate: 0.93,
      cancellationRate: 0.05,
      averageOrderValue: 2500,
      accountAgeMonths: 8,
      addressStabilityMonths: 8,
      suspiciousNetworkLinks: 0,
      behaviorScore: 90,
      summary: 'High trust',
    };

    const cleanRing = { ringRiskScore: 10, ringDetected: false, clusterSize: 1, signals: [] };

    // Order risk score 65 (HIGH risk tier, above highThresh + 10)
    const intervention = optimizeIntervention(65, 'HIGH', highTrustPassport, cleanRing, defaultSettings, 'balanced');
    // For high trust, it should NOT block (LEVEL_4), it should downgrade to step-up verification (LEVEL_3)
    expect(intervention.recommendedLevel).toBe('LEVEL_3_VERIFY_AND_PREPAID_INCENTIVE');
    expect(intervention.allowedPaymentMethods).toContain('COD');
  });
});

describe('RTO Policy Simulator', () => {
  it('calculates exposure reduction when tighter policies are applied', () => {
    const sim = runPolicySimulation([], DEFAULT_SIMULATION_INPUTS);
    expect(sim.currentPolicy.totalOrders).toBe(10000);
    expect(sim.simulatedPolicy.totalOrders).toBe(10000);
    expect(sim.potentialExposureReduction).toBeGreaterThan(0);
    expect(sim.aiRecommendation.title).toBeDefined();
  });
});
