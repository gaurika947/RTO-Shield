"""
Phase 2 Automated Feature Parity and Contract Regression Tests.
Verifies that the canonical 28-feature contract is strictly preserved across
preprocessing, artifact expectations, and schema definitions.
"""

import json
import os
import sys
import unittest
import joblib

sys.path.insert(0, os.path.dirname(__file__))

from feature_contract import (
    CANONICAL_FEATURES,
    FEATURE_COUNT,
    FEATURE_NAMES,
    FEATURE_SCHEMA_VERSION,
    validate_and_transform_features,
)
from model_manifest import MANIFEST_NAME, MODELS_DIR

ARTIFACT_PATH = os.path.join(MODELS_DIR, "rto_model.joblib")
MANIFEST_PATH = os.path.join(MODELS_DIR, MANIFEST_NAME)


class FeatureParityTests(unittest.TestCase):
    def test_feature_count_is_strictly_28(self):
        self.assertEqual(len(CANONICAL_FEATURES), 28)
        self.assertEqual(len(FEATURE_NAMES), 28)
        self.assertEqual(FEATURE_COUNT, 28)

    def test_feature_schema_version(self):
        self.assertEqual(FEATURE_SCHEMA_VERSION, "rto-features-v1")

    def test_model_artifact_features_match_contract(self):
        self.assertTrue(os.path.exists(ARTIFACT_PATH), "Artifact must exist")
        model = joblib.load(ARTIFACT_PATH)
        self.assertEqual(model.n_features_in_, 28)
        self.assertEqual(model.n_features_in_, len(FEATURE_NAMES))

    def test_manifest_matches_canonical_feature_names(self):
        with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
            manifest = json.load(f)
        self.assertEqual(manifest["feature_count"], 28)
        self.assertEqual(manifest["feature_schema_version"], FEATURE_SCHEMA_VERSION)
        self.assertEqual(manifest["feature_names"], FEATURE_NAMES)

    def test_feature_ordering_is_immutable(self):
        expected_order = [
            "previous_orders",
            "previous_delivered_orders",
            "previous_rto_orders",
            "previous_cancelled_orders",
            "customer_rto_rate",
            "customer_success_rate",
            "days_since_first_order",
            "order_value",
            "number_of_items",
            "discount_percentage",
            "cod_selected",
            "pincode_rto_rate",
            "address_completeness",
            "address_changes",
            "city_state_match",
            "checkout_attempts",
            "checkout_duration",
            "cart_revisions",
            "quantity_changes",
            "payment_attempts",
            "session_duration",
            "intent_score",
            "device_linked_accounts",
            "cat_ELECTRONICS",
            "cat_FASHION",
            "cat_BEAUTY",
            "cat_HOME",
            "cat_ACCESSORIES",
        ]
        self.assertEqual(FEATURE_NAMES, expected_order)

    def test_transformation_types_and_defaults(self):
        empty_payload = {}
        vec = validate_and_transform_features(empty_payload)
        self.assertEqual(len(vec), 28)
        self.assertTrue(all(isinstance(v, (int, float)) for v in vec))

        # Check default values
        self.assertEqual(vec[0], 0.0)      # previous_orders
        self.assertEqual(vec[4], 0.0)      # customer_rto_rate
        self.assertEqual(vec[7], 1999.0)   # default order_value
        self.assertEqual(vec[10], 1.0)     # cod_selected (COD is default)
        self.assertEqual(vec[11], 0.18)    # default pincode_rto_rate
        self.assertEqual(vec[12], 0.85)    # default address_completeness
        self.assertEqual(vec[21], 50.0)    # default intent_score
        self.assertEqual(vec[22], 1.0)     # default device_linked_accounts
        self.assertEqual(vec[23], 1.0)     # cat_ELECTRONICS default

    def test_transformation_clamps_valid_ranges(self):
        extreme_payload = {
            "previous_orders": -10,
            "order_value": -500,
            "pincode_rto_rate": 2.5,
            "address_completeness": -0.5,
            "intent_score": 150.0,
        }
        vec = validate_and_transform_features(extreme_payload)
        self.assertGreaterEqual(vec[0], 0.0)
        self.assertGreaterEqual(vec[7], 0.0)
        self.assertLessEqual(vec[11], 1.0)
        self.assertGreaterEqual(vec[12], 0.0)
        self.assertLessEqual(vec[21], 100.0)

    def test_invalid_types_raise_clear_error(self):
        with self.assertRaises(ValueError):
            validate_and_transform_features({"order_value": "invalid_amount"})


if __name__ == "__main__":
    unittest.main()
