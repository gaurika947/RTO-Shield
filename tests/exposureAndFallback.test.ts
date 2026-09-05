import { describe, expect, it } from 'vitest';
import { calculateExpectedRtoExposure } from '../src/engine/exposureEngine';
import { predictRTO } from '../src/engine/mlModelEngine';
import { SEED_CUSTOMERS } from '../src/data/seedData';
import type { OrderAddress } from '../src/types/order';

describe('truthful risk and exposure contracts', () => {
  it('calculates baseline, projected, and potential exposure reduction', () => {
    const result = calculateExpectedRtoExposure(2500, 0.8, 0.4);
    expect(result.baselineExposure).toBe(2000);
    expect(result.projectedExposure).toBe(1000);
    expect(result.potentialReduction).toBe(1000);
  });

  it('labels the client-side path as a deterministic fallback', () => {
    const address: OrderAddress = {
      line1: '14 Main Road',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110070',
    };
    const result = predictRTO({
      customer: SEED_CUSTOMERS[0],
      address,
      orderAmount: 2499,
      paymentMethod: 'COD',
      deviceId: 'DEV_TEST',
    });
    expect(result.modelSource).toBe('deterministic_fallback');
    expect(result.rtoProbability).toBeGreaterThanOrEqual(0);
    expect(result.rtoProbability).toBeLessThanOrEqual(1);
  });
});