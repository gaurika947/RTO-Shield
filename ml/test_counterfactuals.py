"""
Phase 2 Counterfactual Inference and Invariance Tests.
Verifies that baseline and mutated transactions use the exact same authoritative model artifact,
and validates mutation behaviors, missing-feature handling, and fallback behavior.
"""

import copy
import os
import sys
import unittest
from unittest.mock import patch
import joblib

sys.path.insert(0, os.path.dirname(__file__))

from predict import predict_batch, predict_single
from model_manifest import MANIFEST_NAME, MODELS_DIR, sha256_file
from feature_contract import FEATURE_SCHEMA_VERSION

ARTIFACT_PATH = os.path.join(MODELS_DIR, "rto_model.joblib")


class CounterfactualInferenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.artifact_hash = sha256_file(ARTIFACT_PATH)
        cls.base_order = {
            "previous_orders": 8,
            "previous_delivered_orders": 3,
            "previous_rto_orders": 5,
            "customer_rto_rate": 0.625,
            "order_value": 3499,
            "payment_method": "COD",
            "pincode_rto_rate": 0.28,
            "address_completeness": 0.50,
            "device_linked_accounts": 3,
            "intent_score": 35.0,
        }

    def test_same_transaction_produces_identical_authoritative_prediction(self):
        """Proof: Same transaction produces exact same prediction."""
        pred1 = predict_single(self.base_order, require_artifact=True)
        pred2 = predict_single(copy.deepcopy(self.base_order), require_artifact=True)

        self.assertEqual(pred1["rtoProbability"], pred2["rtoProbability"])
        self.assertEqual(pred1["riskScore"], pred2["riskScore"])
        self.assertEqual(pred1["modelSource"], "artifact")
        self.assertEqual(pred1["artifactHash"], self.artifact_hash)
        self.assertEqual(pred2["artifactHash"], self.artifact_hash)

    def test_mutated_transaction_uses_same_authoritative_artifact(self):
        """Proof: Mutated transaction uses same authoritative model with changed features."""
        baseline = predict_single(self.base_order, require_artifact=True)

        mutated = copy.deepcopy(self.base_order)
        mutated["payment_method"] = "UPI"
        mutated["cod_selected"] = 0.0

        counterfactual = predict_single(mutated, require_artifact=True)

        # Must be from the exact same artifact
        self.assertEqual(baseline["modelSource"], "artifact")
        self.assertEqual(counterfactual["modelSource"], "artifact")
        self.assertEqual(baseline["artifactHash"], counterfactual["artifactHash"])
        self.assertEqual(counterfactual["artifactHash"], self.artifact_hash)

        # Switching to prepaid must reduce RTO probability significantly
        self.assertLess(counterfactual["rtoProbability"], baseline["rtoProbability"])
        self.assertLess(counterfactual["riskScore"], baseline["riskScore"])
        delta = baseline["riskScore"] - counterfactual["riskScore"]
        self.assertGreater(delta, 20)

    def test_valid_mutation_address_verification(self):
        """Valid mutation: improving address completeness lowers risk."""
        baseline = predict_single(self.base_order, require_artifact=True)

        verified = copy.deepcopy(self.base_order)
        verified["address_completeness"] = 1.0
        verified["address_changes"] = 0

        res = predict_single(verified, require_artifact=True)
        self.assertEqual(res["modelSource"], "artifact")
        self.assertLessEqual(res["rtoProbability"], baseline["rtoProbability"])

    def test_invalid_mutation_raises_error(self):
        """Invalid mutation: malformed type must raise error, not fail silently."""
        invalid = copy.deepcopy(self.base_order)
        invalid["order_value"] = "not-a-valid-number"
        with self.assertRaises(ValueError):
            predict_single(invalid, require_artifact=True)

    def test_mutation_with_no_meaningful_change(self):
        """Mutation with no meaningful change produces 0 delta."""
        baseline = predict_single(self.base_order, require_artifact=True)

        unrelated = copy.deepcopy(self.base_order)
        unrelated["random_untracked_field"] = "some_value"

        res = predict_single(unrelated, require_artifact=True)
        self.assertEqual(res["rtoProbability"], baseline["rtoProbability"])
        self.assertEqual(res["riskScore"], baseline["riskScore"])

    def test_multiple_simultaneous_mutations(self):
        """Multiple mutations compound risk reduction."""
        baseline = predict_single(self.base_order, require_artifact=True)

        # Apply all protective toggles: Prepaid + Verified Address + Disassociated Cluster
        multi_mutated = copy.deepcopy(self.base_order)
        multi_mutated["payment_method"] = "UPI"
        multi_mutated["cod_selected"] = 0.0
        multi_mutated["address_completeness"] = 1.0
        multi_mutated["device_linked_accounts"] = 1
        multi_mutated["intent_score"] = 75.0

        res = predict_single(multi_mutated, require_artifact=True)
        self.assertEqual(res["modelSource"], "artifact")
        self.assertLess(res["riskScore"], baseline["riskScore"])
        self.assertLess(res["rtoProbability"], 0.20)
        self.assertEqual(res["riskLevel"], "LOW")

    def test_missing_features_impute_canonical_defaults(self):
        """Missing features adopt explicit canonical defaults."""
        sparse_order = {"order_value": 1500, "payment_method": "COD"}
        res = predict_single(sparse_order, require_artifact=True)
        self.assertEqual(res["modelSource"], "artifact")
        self.assertGreaterEqual(res["rtoProbability"], 0.0)
        self.assertLessEqual(res["rtoProbability"], 1.0)

    def test_artifact_unavailable_behavior(self):
        """When artifact is missing, require_artifact=True raises FileNotFoundError; otherwise falls back."""
        with patch("predict.os.path.exists", return_value=False):
            with self.assertRaises(FileNotFoundError):
                predict_single(self.base_order, require_artifact=True)

            fallback_res = predict_single(self.base_order, require_artifact=False)
            self.assertEqual(fallback_res["modelSource"], "deterministic_fallback")
            self.assertIsNone(fallback_res["artifactHash"])

    def test_vectorized_batch_prediction_matches_single_predictions(self):
        """Batch prediction returns exact same results as single predictions."""
        p1 = copy.deepcopy(self.base_order)
        p2 = copy.deepcopy(self.base_order)
        p2["payment_method"] = "UPI"

        single1 = predict_single(p1, require_artifact=True)
        single2 = predict_single(p2, require_artifact=True)

        batch = predict_batch([p1, p2], require_artifact=True)
        self.assertEqual(len(batch), 2)
        self.assertEqual(batch[0]["rtoProbability"], single1["rtoProbability"])
        self.assertEqual(batch[0]["riskScore"], single1["riskScore"])
        self.assertEqual(batch[1]["rtoProbability"], single2["rtoProbability"])
        self.assertEqual(batch[1]["riskScore"], single2["riskScore"])


if __name__ == "__main__":
    unittest.main()
