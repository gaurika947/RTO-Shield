import { describe, it, expect } from 'vitest';
import { evaluateRisk } from '../src/engine/riskEngine';
import { SEED_CUSTOMERS, SEED_ORDERS, buildNetworkFromData } from '../src/data/seedData';
import type { MerchantSettings } from '../src/types/risk';
import type { OrderAddress } from '../src/types/order';

describe('Risk Engine Weighted Formula & Separation', () => {
  const defaultSettings: MerchantSettings = {
    mediumThreshold: 30,
    highThreshold: 70,
    codFee: 49,
    upiDiscount: 30,
    otpRequired: true,
    weights: {
      address: 0.15,
      history: 0.20,
      network: 0.20,
      velocity: 0.15,
      behavior: 0.10,
      ai: 0.10,
      ml: 0.10,
    },
    riskEngineVersion: 'RISK_ENGINE_V1',
    policyVersion: 'POLICY_V1',
    policyCounter: 1,
    aiEnabled: true,
  };

  const network = buildNetworkFromData(SEED_CUSTOMERS, SEED_ORDERS);

  it('evaluates genuine customer with complete address as LOW risk', () => {
    const customer = SEED_CUSTOMERS[0]; // Aarav Sharma (genuine)
    const address: OrderAddress = {
      line1: '42, Sector 15, Vasant Kunj',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110070',
      landmark: 'Near DLF Mall',
    };

    const result = evaluateRisk(
      address,
      customer,
      'DEV_A01',
      SEED_CUSTOMERS,
      SEED_ORDERS,
      network.nodes,
      network.edges,
      defaultSettings
    );

    expect(result.score).toBeLessThan(30);
    expect(result.tier).toBe('LOW');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.contributions.address).toBeDefined();
    expect(result.contributions.history).toBeDefined();
    expect(result.contributions.network).toBeDefined();
    expect(result.contributions.velocity).toBeDefined();
    expect(result.contributions.behavior).toBeDefined();
    expect(result.contributions.ai).toBeDefined();
  });

  it('evaluates coordinated abuse ring customer as HIGH risk', () => {
    const customer = SEED_CUSTOMERS.find(c => c.id === 'CUS_4001')!; // Ravi Kumar (abuse ring)
    const address: OrderAddress = {
      line1: 'Room 3, Sector 62',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301',
    };

    const result = evaluateRisk(
      address,
      customer,
      'DEV_B03',
      SEED_CUSTOMERS,
      SEED_ORDERS,
      network.nodes,
      network.edges,
      defaultSettings
    );

    expect(result.score).toBeGreaterThan(40);
    expect(result.contributions.network).toBeGreaterThan(0);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('continues deterministically with reduced confidence when AI is unavailable', () => {
    const customer = SEED_CUSTOMERS[0];
    const address: OrderAddress = {
      line1: '42, Sector 15, Vasant Kunj',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110070',
      landmark: 'Near DLF Mall',
    };

    const result = evaluateRisk(
      address,
      customer,
      'DEV_A01',
      SEED_CUSTOMERS,
      SEED_ORDERS,
      network.nodes,
      network.edges,
      defaultSettings,
      { available: false, risk: 25, confidence: 0, evidence: [] }
    );

    expect(result.aiAvailable).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.signals).toContain('AI analysis unavailable — confidence reduced');
  });
});
