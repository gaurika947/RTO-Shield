import { describe, it, expect } from 'vitest';
import {
  FEATURE_SCHEMA_VERSION,
  CANONICAL_FEATURE_NAMES,
  CANONICAL_FEATURE_SPECS,
  CANONICAL_FEATURE_COUNT,
} from '../src/types/features';

describe('Canonical 28-Feature Contract Parity', () => {
  it('enforces schema version rto-features-v1', () => {
    expect(FEATURE_SCHEMA_VERSION).toBe('rto-features-v1');
  });

  it('contains exactly 28 canonical features', () => {
    expect(CANONICAL_FEATURE_COUNT).toBe(28);
    expect(CANONICAL_FEATURE_NAMES.length).toBe(28);
    expect(CANONICAL_FEATURE_SPECS.length).toBe(28);
  });

  it('matches canonical feature ordering exactly', () => {
    const expected = [
      'previous_orders',
      'previous_delivered_orders',
      'previous_rto_orders',
      'previous_cancelled_orders',
      'customer_rto_rate',
      'customer_success_rate',
      'days_since_first_order',
      'order_value',
      'number_of_items',
      'discount_percentage',
      'cod_selected',
      'pincode_rto_rate',
      'address_completeness',
      'address_changes',
      'city_state_match',
      'checkout_attempts',
      'checkout_duration',
      'cart_revisions',
      'quantity_changes',
      'payment_attempts',
      'session_duration',
      'intent_score',
      'device_linked_accounts',
      'cat_ELECTRONICS',
      'cat_FASHION',
      'cat_BEAUTY',
      'cat_HOME',
      'cat_ACCESSORIES',
    ];

    expect([...CANONICAL_FEATURE_NAMES]).toEqual(expected);
  });

  it('verifies index mapping in specs matches feature array indices', () => {
    CANONICAL_FEATURE_SPECS.forEach((spec, idx) => {
      expect(spec.index).toBe(idx);
      expect(spec.name).toBe(CANONICAL_FEATURE_NAMES[idx]);
      expect(spec.defaultValue).toBeDefined();
      expect(spec.minValue).toBeLessThanOrEqual(spec.maxValue);
    });
  });
});
