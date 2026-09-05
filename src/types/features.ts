/**
 * RTO Shield — Canonical 28-Feature Contract (rto-features-v1)
 * Authoritative TypeScript mirror of the Python model feature specification.
 */

export const FEATURE_SCHEMA_VERSION = 'rto-features-v1' as const;

export const CANONICAL_FEATURE_NAMES = [
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
] as const;

export type CanonicalFeatureName = (typeof CANONICAL_FEATURE_NAMES)[number];

export interface FeatureSpecification {
  name: CanonicalFeatureName;
  index: number;
  type: 'int' | 'float' | 'binary';
  minValue: number;
  maxValue: number;
  defaultValue: number;
  semanticMeaning: string;
}

export const CANONICAL_FEATURE_SPECS: readonly FeatureSpecification[] = [
  { name: 'previous_orders', index: 0, type: 'int', minValue: 0, maxValue: 500, defaultValue: 0, semanticMeaning: 'Total historical orders placed by customer' },
  { name: 'previous_delivered_orders', index: 1, type: 'int', minValue: 0, maxValue: 500, defaultValue: 0, semanticMeaning: 'Total historical delivered orders' },
  { name: 'previous_rto_orders', index: 2, type: 'int', minValue: 0, maxValue: 500, defaultValue: 0, semanticMeaning: 'Total historical RTO orders' },
  { name: 'previous_cancelled_orders', index: 3, type: 'int', minValue: 0, maxValue: 500, defaultValue: 0, semanticMeaning: 'Total historical cancelled orders' },
  { name: 'customer_rto_rate', index: 4, type: 'float', minValue: 0, maxValue: 1, defaultValue: 0, semanticMeaning: 'Ratio of past RTO to total orders' },
  { name: 'customer_success_rate', index: 5, type: 'float', minValue: 0, maxValue: 1, defaultValue: 0, semanticMeaning: 'Ratio of past delivered to total orders' },
  { name: 'days_since_first_order', index: 6, type: 'float', minValue: 0, maxValue: 3650, defaultValue: 30, semanticMeaning: 'Account age in days' },
  { name: 'order_value', index: 7, type: 'float', minValue: 0, maxValue: 1000000, defaultValue: 1999, semanticMeaning: 'Transaction amount in INR' },
  { name: 'number_of_items', index: 8, type: 'int', minValue: 1, maxValue: 50, defaultValue: 1, semanticMeaning: 'Total item quantity' },
  { name: 'discount_percentage', index: 9, type: 'float', minValue: 0, maxValue: 100, defaultValue: 0, semanticMeaning: 'Discount percentage applied' },
  { name: 'cod_selected', index: 10, type: 'binary', minValue: 0, maxValue: 1, defaultValue: 1, semanticMeaning: '1.0 if Cash on Delivery, 0.0 for prepaid' },
  { name: 'pincode_rto_rate', index: 11, type: 'float', minValue: 0, maxValue: 1, defaultValue: 0.18, semanticMeaning: 'Regional return rate for destination pincode' },
  { name: 'address_completeness', index: 12, type: 'float', minValue: 0, maxValue: 1, defaultValue: 0.85, semanticMeaning: 'Structural quality score of address' },
  { name: 'address_changes', index: 13, type: 'int', minValue: 0, maxValue: 20, defaultValue: 0, semanticMeaning: 'Address edits during session' },
  { name: 'city_state_match', index: 14, type: 'binary', minValue: 0, maxValue: 1, defaultValue: 1, semanticMeaning: '1.0 if city matches postal state directory' },
  { name: 'checkout_attempts', index: 15, type: 'int', minValue: 1, maxValue: 50, defaultValue: 1, semanticMeaning: 'Submission attempts count' },
  { name: 'checkout_duration', index: 16, type: 'float', minValue: 1, maxValue: 3600, defaultValue: 60, semanticMeaning: 'Time spent on checkout in seconds' },
  { name: 'cart_revisions', index: 17, type: 'int', minValue: 0, maxValue: 50, defaultValue: 0, semanticMeaning: 'Cart items additions/deletions count' },
  { name: 'quantity_changes', index: 18, type: 'int', minValue: 0, maxValue: 50, defaultValue: 0, semanticMeaning: 'Cart item quantity changes' },
  { name: 'payment_attempts', index: 19, type: 'int', minValue: 1, maxValue: 20, defaultValue: 1, semanticMeaning: 'Payment authorization attempts' },
  { name: 'session_duration', index: 20, type: 'float', minValue: 5, maxValue: 7200, defaultValue: 180, semanticMeaning: 'Total browsing duration in seconds' },
  { name: 'intent_score', index: 21, type: 'float', minValue: 0, maxValue: 100, defaultValue: 50, semanticMeaning: 'Heuristic buyer intent score (0-100)' },
  { name: 'device_linked_accounts', index: 22, type: 'int', minValue: 1, maxValue: 100, defaultValue: 1, semanticMeaning: 'Account identities sharing device hardware' },
  { name: 'cat_ELECTRONICS', index: 23, type: 'binary', minValue: 0, maxValue: 1, defaultValue: 1, semanticMeaning: 'One-hot indicator: Electronics category' },
  { name: 'cat_FASHION', index: 24, type: 'binary', minValue: 0, maxValue: 1, defaultValue: 0, semanticMeaning: 'One-hot indicator: Fashion category' },
  { name: 'cat_BEAUTY', index: 25, type: 'binary', minValue: 0, maxValue: 1, defaultValue: 0, semanticMeaning: 'One-hot indicator: Beauty category' },
  { name: 'cat_HOME', index: 26, type: 'binary', minValue: 0, maxValue: 1, defaultValue: 0, semanticMeaning: 'One-hot indicator: Home category' },
  { name: 'cat_ACCESSORIES', index: 27, type: 'binary', minValue: 0, maxValue: 1, defaultValue: 0, semanticMeaning: 'One-hot indicator: Accessories category' },
];

export const CANONICAL_FEATURE_COUNT = CANONICAL_FEATURE_NAMES.length; // 28
