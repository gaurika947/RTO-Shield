"""Phase 1 provenance and artifact parity checks."""

import json
import os
import sys
import unittest
from unittest.mock import patch

import joblib

sys.path.insert(0, os.path.dirname(__file__))

from model_manifest import MANIFEST_NAME, MODELS_DIR, sha256_file
from predict import predict_single
from preprocess import FEATURE_NAMES, FEATURE_SCHEMA_VERSION, extract_features_from_dict


ARTIFACT_PATH = os.path.join(MODELS_DIR, "rto_model.joblib")
MANIFEST_PATH = os.path.join(MODELS_DIR, MANIFEST_NAME)


class ModelProvenanceTests(unittest.TestCase):
    def test_artifact_and_manifest_exist(self):
        self.assertTrue(os.path.isfile(ARTIFACT_PATH))
        self.assertTrue(os.path.isfile(MANIFEST_PATH))

    def test_artifact_hash_schema_and_feature_count_match_manifest(self):
        with open(MANIFEST_PATH, "r", encoding="utf-8") as manifest_file:
            manifest = json.load(manifest_file)
        model = joblib.load(ARTIFACT_PATH)

        self.assertEqual(sha256_file(ARTIFACT_PATH), manifest["artifact"]["sha256"])
        self.assertEqual(manifest["feature_schema_version"], FEATURE_SCHEMA_VERSION)
        self.assertEqual(manifest["feature_count"], len(FEATURE_NAMES))
        self.assertEqual(len(manifest["feature_names"]), model.n_features_in_)
        self.assertEqual(model.n_features_in_, len(FEATURE_NAMES))

    def test_runtime_prediction_uses_artifact(self):
        payload = {
            "previous_orders": 8,
            "previous_delivered_orders": 5,
            "previous_rto_orders": 3,
            "order_value": 2499,
            "payment_method": "COD",
            "pincode_rto_rate": 0.18,
            "address_completeness": 0.8,
            "device_linked_accounts": 2,
            "intent_score": 45,
        }
        result = predict_single(payload, require_artifact=True)
        self.assertEqual(result["modelSource"], "artifact")
        self.assertEqual(result["featureSchemaVersion"], FEATURE_SCHEMA_VERSION)
        self.assertEqual(result["artifactHash"], sha256_file(ARTIFACT_PATH))
        self.assertGreaterEqual(result["rtoProbability"], 0)
        self.assertLessEqual(result["rtoProbability"], 1)

    def test_malformed_input_fails_safely(self):
        with self.assertRaises((TypeError, ValueError)):
            extract_features_from_dict({"order_value": "not-a-number"})

    def test_fallback_is_only_used_when_artifact_is_unavailable(self):
        payload = {"order_value": 2499, "payment_method": "COD"}
        with patch("predict.os.path.exists", return_value=False):
            result = predict_single(payload)
        self.assertEqual(result["modelSource"], "deterministic_fallback")
        self.assertIsNone(result["artifactHash"])


if __name__ == "__main__":
    unittest.main()