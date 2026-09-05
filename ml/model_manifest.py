"""Reproducible metadata and integrity helpers for the runtime model artifact."""

from __future__ import annotations

import hashlib
import json
import os
import platform
from datetime import datetime, timezone

from preprocess import FEATURE_NAMES, FEATURE_SCHEMA_VERSION

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
ARTIFACT_NAME = "rto_model.joblib"
MANIFEST_NAME = "model_manifest.json"
MODEL_VERSION = "RTO Shield GBDT v1"
DATASET_NAME = "RTO Shield Synthetic Demo Dataset"


def sha256_file(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as artifact:
        for chunk in iter(lambda: artifact.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_dataset_metadata() -> dict:
    with open(os.path.join(DATA_DIR, "dataset_meta.json"), "r", encoding="utf-8") as metadata:
        return json.load(metadata)


def build_manifest(artifact_path: str, metrics: dict, threshold_analysis: list[dict]) -> dict:
    import joblib
    import sklearn

    dataset = load_dataset_metadata()
    return {
        "model_type": "sklearn.ensemble.GradientBoostingClassifier",
        "model_version": MODEL_VERSION,
        "training_timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "dataset": {
            "name": DATASET_NAME,
            "version": dataset["version"],
            "target_disclosure": "Synthetic is_rto labels are generated from overlapping historical, payment, address, behavior, network, and category signals; metrics are not production evidence.",
            "train_rows": dataset["train_rows"],
            "validation_rows": dataset["val_rows"],
            "held_out_test_rows": dataset["test_rows"],
        },
        "feature_schema_version": FEATURE_SCHEMA_VERSION,
        "feature_count": len(FEATURE_NAMES),
        "feature_names": FEATURE_NAMES,
        "dependencies": {
            "python": platform.python_version(),
            "scikit_learn": sklearn.__version__,
            "joblib": joblib.__version__,
        },
        "artifact": {
            "file": ARTIFACT_NAME,
            "sha256": sha256_file(artifact_path),
        },
        "evaluation": {
            "metrics": metrics,
            "threshold_analysis": threshold_analysis,
            "source": "ml/evaluate.py using this artifact and held-out test split",
        },
    }


def write_manifest(manifest: dict) -> str:
    path = os.path.join(MODELS_DIR, MANIFEST_NAME)
    with open(path, "w", encoding="utf-8") as output:
        json.dump(manifest, output, indent=2)
    return path