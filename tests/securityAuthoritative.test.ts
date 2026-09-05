import { describe, it, expect, beforeAll, afterAll } from 'vitest';
// @ts-expect-error server/index.js is in pure ESM JS
import app, { signDecisionToken } from '../server/index.js';

describe('Security & Server-Authoritative Hardening (Step 15)', () => {
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    // Start temporary test server
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        const port = typeof addr === 'object' && addr ? addr.port : 3001;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('ATTACK TEST 1 — Client Risk Manipulation: Server enforces HIGH risk and rejects COD regardless of client claims', async () => {
    // Attacker tries to force approval on high-risk Aarav Mehta (ORD_10518) by sending riskLevel: 'LOW'
    const attackPayload = {
      orderId: 'ORD_10518',
      orderAmount: 12999,
      paymentMethod: 'COD',
      riskLevel: 'LOW',
      riskScore: 0,
      rtoProbability: 0,
      decision: 'APPROVED',
    };

    const res = await fetch(`${baseUrl}/api/checkout/validate-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attackPayload),
    });

    const data = await res.json();
    // Server must reject COD and enforce authoritative HIGH risk tier!
    expect(res.status).toBe(403);
    expect(data.valid).toBe(false);
    expect(data.riskLevel).toBe('HIGH');
    expect(data.error).toContain("Cash on Delivery isn't available for this order");
  });

  it('ATTACK TEST 2 — Amount Integrity: Rejects manipulated amounts (1 vs 1899 and 999999 vs 1899)', async () => {
    // Priya Sharma authoritative amount is 1899
    // Attack 2a: Client attempts to pay ₹1 instead of ₹1899
    const resLow = await fetch(`${baseUrl}/api/checkout/validate-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'ORD_10491',
        orderAmount: 1,
        paymentMethod: 'UPI',
      }),
    });
    const dataLow = await resLow.json();
    expect(resLow.status).toBe(400);
    expect(dataLow.valid).toBe(false);
    expect(dataLow.error).toContain('Amount manipulation detected');

    // Attack 2b: Client attempts to pay ₹999999 instead of ₹1899
    const resHigh = await fetch(`${baseUrl}/api/checkout/validate-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'ORD_10491',
        orderAmount: 999999,
        paymentMethod: 'UPI',
      }),
    });
    const dataHigh = await resHigh.json();
    expect(resHigh.status).toBe(400);
    expect(dataHigh.valid).toBe(false);
    expect(dataHigh.error).toContain('Amount manipulation detected');

    // Legit 2c: Exactly matches ₹1899 -> PASS
    const resLegit = await fetch(`${baseUrl}/api/checkout/validate-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'ORD_10491',
        orderAmount: 1899,
        paymentMethod: 'UPI',
      }),
    });
    const dataLegit = await resLegit.json();
    expect(resLegit.status).toBe(200);
    expect(dataLegit.valid).toBe(true);
    expect(dataLegit.finalAmount).toBe(1899);
  });

  it('ATTACK TEST 3 — Decision Replay Protection: Token issued for Order A cannot be used for Order B', async () => {
    // Legitimate token issued for low-risk Priya Sharma (ORD_10491)
    const legitTokenOrderA = signDecisionToken({
      orderId: 'ORD_10491',
      amount: 1899,
      riskLevel: 'LOW',
      riskScore: 12,
      rtoProbability: 0.08,
      codAvailable: true,
      codFee: 0,
      policyVersion: 'PAYMENT_POLICY_V2',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 900000,
    });

    // Attacker tries to replay Order A token on high-risk Order B (ORD_10518)
    const replayRes = await fetch(`${baseUrl}/api/checkout/validate-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'ORD_10518',
        orderAmount: 1899,
        paymentMethod: 'COD',
        decisionToken: legitTokenOrderA,
      }),
    });

    const replayData = await replayRes.json();
    expect(replayRes.status).toBe(400);
    expect(replayData.valid).toBe(false);
    expect(replayData.code).toBe('ORDER_BINDING_MISMATCH');
    expect(replayData.error).toContain('Decision replay attack detected');
  });

  it('ATTACK TEST 4 — Tampered Token Signature: Modified token payload is rejected', async () => {
    const validToken = signDecisionToken({
      orderId: 'ORD_10518',
      amount: 12999,
      riskLevel: 'HIGH',
      codAvailable: false,
      codFee: 0,
      expiresAt: Date.now() + 900000,
    });

    // Attacker modifies the signature part of the token
    const tamperedToken = validToken.substring(0, validToken.length - 4) + 'XXXX';

    const res = await fetch(`${baseUrl}/api/checkout/validate-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'ORD_10518',
        orderAmount: 12999,
        paymentMethod: 'COD',
        decisionToken: tamperedToken,
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.valid).toBe(false);
    expect(data.code).toBe('INVALID_TOKEN_SIGNATURE');
  });

  it('ATTACK TEST 5 — Expired Decision Token: Rejects stale tokens', async () => {
    const expiredToken = signDecisionToken({
      orderId: 'ORD_10491',
      amount: 1899,
      riskLevel: 'LOW',
      codAvailable: true,
      codFee: 0,
      issuedAt: Date.now() - 1000000,
      expiresAt: Date.now() - 5000, // Expired 5 seconds ago
    });

    const res = await fetch(`${baseUrl}/api/checkout/validate-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'ORD_10491',
        orderAmount: 1899,
        paymentMethod: 'COD',
        decisionToken: expiredToken,
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.valid).toBe(false);
    expect(data.code).toBe('TOKEN_EXPIRED');
  });

  it('TEST 6 — Idempotency: Same key + identical payload succeeds; modified payload conflicts', async () => {
    const key = `TEST_IDEMP_${Date.now()}`;
    const payload = {
      orderId: 'ORD_10491',
      orderAmount: 1899,
      paymentMethod: 'UPI',
    };

    // First request
    const res1 = await fetch(`${baseUrl}/api/checkout/validate-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': key,
      },
      body: JSON.stringify(payload),
    });
    const data1 = await res1.json();
    expect(res1.status).toBe(200);
    expect(data1.valid).toBe(true);

    // Repeated identical request with same key
    const res2 = await fetch(`${baseUrl}/api/checkout/validate-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': key,
      },
      body: JSON.stringify(payload),
    });
    const data2 = await res2.json();
    expect(res2.status).toBe(200);
    expect(data2).toEqual(data1);

    // Repeated request with modified payload under same key -> 409 Conflict
    const res3 = await fetch(`${baseUrl}/api/checkout/validate-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': key,
      },
      body: JSON.stringify({
        ...payload,
        paymentMethod: 'CARD', // Modified parameter
      }),
    });
    const data3 = await res3.json();
    expect(res3.status).toBe(409);
    expect(data3.code).toBe('IDEMPOTENCY_CONFLICT');
  });

  it('TEST 7 — Input Validation: Cleanly rejects malformed requests', async () => {
    // Missing orderId
    const resNoId = await fetch(`${baseUrl}/api/checkout/validate-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderAmount: 1000, paymentMethod: 'UPI' }),
    });
    expect(resNoId.status).toBe(400);

    // Invalid payment method
    const resBadMethod = await fetch(`${baseUrl}/api/checkout/validate-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: 'ORD_10491', orderAmount: 1899, paymentMethod: 'CRYPTO' }),
    });
    expect(resBadMethod.status).toBe(400);

    // Negative amount
    const resNegAmount = await fetch(`${baseUrl}/api/checkout/validate-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: 'ORD_10491', orderAmount: -50, paymentMethod: 'UPI' }),
    });
    expect(resNegAmount.status).toBe(400);
  });
});
