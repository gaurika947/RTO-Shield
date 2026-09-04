import { describe, it, expect } from 'vitest';
import { DEMO_TRANSACTIONS } from '../src/data/demoTransactions';
import { evaluateRisk } from '../src/engine/riskEngine';
import { makeDecision } from '../src/engine/decisionEngine';
import { runMLInference } from '../src/engine/mlService';
import { calculateOrderTotal, validatePaymentAttempt, getPaymentPolicy } from '../src/engine/paymentPolicy';
import { SEED_CUSTOMERS, SEED_ORDERS, buildNetworkFromData } from '../src/data/seedData';
import { DEFAULT_SETTINGS } from '../src/store/settingsStore';

describe('RTO-Shield — Acceptance Criteria (Section 37)', () => {
  const network = buildNetworkFromData(SEED_CUSTOMERS, SEED_ORDERS);

  // Helper to evaluate a transaction
  async function evaluateDemoTx(tx: (typeof DEMO_TRANSACTIONS)[0]) {
    const mlResult = await runMLInference(
      tx.customer,
      tx.address,
      tx.orderAmount,
      tx.paymentMethod,
      tx.deviceId,
      {
        checkoutDuration: tx.checkoutDuration,
        checkoutAttempts: tx.checkoutAttempts,
        addressChanges: tx.addressChanges,
        deviceLinkedAccounts: tx.deviceLinkedOrdersCount,
      }
    );

    const riskResult = evaluateRisk(
      tx.address,
      tx.customer,
      tx.deviceId,
      SEED_CUSTOMERS,
      SEED_ORDERS,
      network.nodes,
      network.edges,
      DEFAULT_SETTINGS,
      undefined,
      mlResult
    );

    const decision = makeDecision(riskResult, DEFAULT_SETTINGS);

    return { mlResult, riskResult, decision };
  }

  it('TEST 1 — LOW: Priya Sharma produces LOW risk, COD fee ₹0, all methods valid', async () => {
    const tx = DEMO_TRANSACTIONS.find((t) => t.customer.name === 'Priya Sharma')!;
    expect(tx).toBeDefined();

    const { riskResult, decision } = await evaluateDemoTx(tx);
    expect(decision.paymentPolicy.riskLevel).toBe('LOW');
    expect(riskResult.score).toBeLessThanOrEqual(30);

    expect(decision.paymentPolicy.codAvailable).toBe(true);
    expect(decision.paymentPolicy.codFee).toBe(0);

    // Dynamic totals
    const codTotal = calculateOrderTotal(tx.orderAmount, 'COD', decision.paymentPolicy);
    expect(codTotal.codFee).toBe(0);
    expect(codTotal.total).toBe(tx.orderAmount);

    const upiTotal = calculateOrderTotal(tx.orderAmount, 'UPI', decision.paymentPolicy);
    expect(upiTotal.codFee).toBe(0);
    expect(upiTotal.total).toBe(tx.orderAmount);

    // Validation
    const codVal = validatePaymentAttempt(decision.paymentPolicy, 'COD', tx.orderAmount);
    expect(codVal.valid).toBe(true);
    expect(codVal.finalAmount).toBe(tx.orderAmount);
  });

  it('TEST 2 — MEDIUM: Vikram Malhotra produces MEDIUM risk, COD fee +₹50, dynamic fee toggle without ML', async () => {
    const tx = DEMO_TRANSACTIONS.find((t) => t.customer.name === 'Vikram Malhotra')!;
    expect(tx).toBeDefined();

    const { riskResult, decision } = await evaluateDemoTx(tx);
    expect(decision.paymentPolicy.riskLevel).toBe('MEDIUM');
    expect(riskResult.score).toBeGreaterThan(30);
    expect(riskResult.score).toBeLessThanOrEqual(70);

    expect(decision.paymentPolicy.codAvailable).toBe(true);
    expect(decision.paymentPolicy.codFee).toBe(50);

    // Selecting COD: total +₹50
    const codTotal = calculateOrderTotal(tx.orderAmount, 'COD', decision.paymentPolicy);
    expect(codTotal.codFee).toBe(50);
    expect(codTotal.total).toBe(tx.orderAmount + 50);

    // Selecting UPI: ₹50 fee disappears
    const upiTotal = calculateOrderTotal(tx.orderAmount, 'UPI', decision.paymentPolicy);
    expect(upiTotal.codFee).toBe(0);
    expect(upiTotal.total).toBe(tx.orderAmount);

    // Backend validation for MEDIUM + COD
    const codVal = validatePaymentAttempt(decision.paymentPolicy, 'COD', tx.orderAmount);
    expect(codVal.valid).toBe(true);
    expect(codVal.appliedFee).toBe(50);
    expect(codVal.finalAmount).toBe(tx.orderAmount + 50);
  });

  it('TEST 3 — HIGH: Aarav Mehta produces HIGH risk, COD unavailable, UPI/Card permitted', async () => {
    const tx = DEMO_TRANSACTIONS.find((t) => t.customer.name === 'Aarav Mehta')!;
    expect(tx).toBeDefined();

    const { riskResult, decision } = await evaluateDemoTx(tx);
    expect(decision.paymentPolicy.riskLevel).toBe('HIGH');
    expect(riskResult.score).toBeGreaterThan(70);

    expect(decision.paymentPolicy.codAvailable).toBe(false);
    expect(decision.paymentPolicy.upiAvailable).toBe(true);
    expect(decision.paymentPolicy.cardAvailable).toBe(true);

    // Attempting COD should be rejected
    const codVal = validatePaymentAttempt(decision.paymentPolicy, 'COD', tx.orderAmount);
    expect(codVal.valid).toBe(false);
    expect(codVal.error).toContain("Cash on Delivery isn't available");

    // UPI is valid
    const upiVal = validatePaymentAttempt(decision.paymentPolicy, 'UPI', tx.orderAmount);
    expect(upiVal.valid).toBe(true);
    expect(upiVal.finalAmount).toBe(tx.orderAmount);
  });

  it('TEST 4 — MODEL PERFORMANCE & SINGLETON CACHING: Fast repeated inference', async () => {
    const tx = DEMO_TRANSACTIONS[0];
    const start = performance.now();
    const res1 = await runMLInference(tx.customer, tx.address, tx.orderAmount, tx.paymentMethod, tx.deviceId);
    const res2 = await runMLInference(tx.customer, tx.address, tx.orderAmount, tx.paymentMethod, tx.deviceId);
    const elapsed = performance.now() - start;

    expect(res1.rtoProbability).toBe(res2.rtoProbability);
    expect(elapsed).toBeLessThan(100); // singleton in-memory takes < 100ms
  });

  it('TEST 5 — PAYMENT METHOD CHANGE: Dynamic calculation does not mutate or require ML', () => {
    const highPolicy = getPaymentPolicy('HIGH');
    const mediumPolicy = getPaymentPolicy('MEDIUM');

    // Switching back and forth is purely synchronous math
    const step1 = calculateOrderTotal(2499, 'UPI', mediumPolicy);
    expect(step1.total).toBe(2499);

    const step2 = calculateOrderTotal(2499, 'COD', mediumPolicy);
    expect(step2.total).toBe(2549);

    const step3 = calculateOrderTotal(2499, 'UPI', mediumPolicy);
    expect(step3.total).toBe(2499);

    const highCod = calculateOrderTotal(2499, 'COD', highPolicy);
    expect(highCod.codFee).toBe(0); // COD not available
  });
});
