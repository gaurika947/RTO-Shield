"""
RTO Shield — Model Evaluation Suite
Validates model performance on the held-out test dataset (11,360 orders).
"""

import os
import json
import joblib
from preprocess import FEATURE_NAMES, FEATURE_SCHEMA_VERSION, load_dataset
from train import calculate_metrics, calculate_threshold_analysis
from model_manifest import MANIFEST_NAME, sha256_file

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


def main():
    test_path = os.path.join(DATA_DIR, "test.csv")
    meta_path = os.path.join(MODELS_DIR, "model_meta.json")

    print("=" * 60)
    print("RTO SHIELD — MODEL EVALUATION SUITE")
    print("=" * 60)

    if not os.path.exists(test_path):
        raise FileNotFoundError(f"Test dataset not found at {test_path}")

    artifact_path = os.path.join(MODELS_DIR, "rto_model.joblib")
    if not os.path.exists(artifact_path):
        raise FileNotFoundError("rto_model.joblib is required; evaluation refuses to use fallback inference")
    manifest_path = os.path.join(MODELS_DIR, MANIFEST_NAME)
    if not os.path.exists(manifest_path):
        raise FileNotFoundError("model_manifest.json is required for evaluation provenance")
    with open(manifest_path, "r", encoding="utf-8") as manifest_file:
        manifest = json.load(manifest_file)
    if manifest["artifact"]["sha256"] != sha256_file(artifact_path):
        raise RuntimeError("Artifact SHA-256 does not match model_manifest.json")
    if manifest["feature_schema_version"] != FEATURE_SCHEMA_VERSION or manifest["feature_count"] != len(FEATURE_NAMES):
        raise RuntimeError("Model manifest feature schema does not match preprocessing")

    from predict import predict_single
    import csv

    X_test_preds = []
    X_test_probs = []
    y_test = []
    model = joblib.load(artifact_path)

    with open(test_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            target = int(row.get("is_rto", 0))
            pred = predict_single(row, require_artifact=True, model=model)
            if pred["modelSource"] != "artifact":
                raise RuntimeError("Evaluation received a non-artifact prediction")
            prob = pred["rtoProbability"]
            binary_pred = 1 if prob >= 0.5 else 0

            y_test.append(target)
            X_test_probs.append(prob)
            X_test_preds.append(binary_pred)

    metrics = calculate_metrics(y_test, X_test_preds, X_test_probs)
    threshold_analysis = calculate_threshold_analysis(y_test, X_test_probs)

    print(f"Evaluated on {len(y_test)} test transactions:")
    print(f"  • ROC-AUC:    {metrics['roc_auc']:.4f}")
    print(f"  • Precision:  {metrics['precision']:.4f}")
    print(f"  • Recall:     {metrics['recall']:.4f}")
    print(f"  • F1-Score:   {metrics['f1']:.4f}")
    print(f"  • Accuracy:   {metrics['accuracy']:.4f}")
    print(f"  • FPR:        {metrics['fpr']:.4f}")
    cm = metrics["confusion_matrix"]
    print(f"  • FNR:        {cm['fn'] / (cm['fn'] + cm['tp']):.4f}" if (cm['fn'] + cm['tp']) else "  • FNR:        n/a")
    print("\nConfusion Matrix:")
    cm = metrics["confusion_matrix"]
    print(f"  TN: {cm['tn']} | FP: {cm['fp']}")
    print(f"  FN: {cm['fn']} | TP: {cm['tp']}")
    print("\nThreshold analysis:")
    for row in threshold_analysis:
        print(f"  {row['threshold']:.2f}: precision={row['precision']:.4f} recall={row['recall']:.4f} f1={row['f1']:.4f} fpr={row['fpr']:.4f} fnr={row['fnr']:.4f}")
    print("=" * 60)


if __name__ == "__main__":
    main()
