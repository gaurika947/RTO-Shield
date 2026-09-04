"""
RTO Shield — Model Evaluation Suite
Validates model performance on the held-out test dataset (11,360 orders).
"""

import os
import json
from preprocess import load_dataset
from train import calculate_metrics

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


def main():
    test_path = os.path.join(DATA_DIR, "test.csv")
    meta_path = os.path.join(MODELS_DIR, "model_meta.json")

    print("=" * 60)
    print("RTO SHIELD — MODEL EVALUATION SUITE")
    print("=" * 60)

    if not os.path.exists(test_path):
        print(f"[!] Test dataset not found at {test_path}")
        return

    from predict import predict_single
    import csv

    X_test_preds = []
    X_test_probs = []
    y_test = []

    with open(test_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            target = int(row.get("is_rto", 0))
            pred = predict_single(row)
            prob = pred["rtoProbability"]
            binary_pred = 1 if prob >= 0.5 else 0

            y_test.append(target)
            X_test_probs.append(prob)
            X_test_preds.append(binary_pred)

    metrics = calculate_metrics(y_test, X_test_preds, X_test_probs)

    print(f"Evaluated on {len(y_test)} test transactions:")
    print(f"  • ROC-AUC:    {metrics['roc_auc']:.4f}")
    print(f"  • Precision:  {metrics['precision']:.4f}")
    print(f"  • Recall:     {metrics['recall']:.4f}")
    print(f"  • F1-Score:   {metrics['f1']:.4f}")
    print(f"  • Accuracy:   {metrics['accuracy']:.4f}")
    print(f"  • FPR:        {metrics['fpr']:.4f}")
    print("\nConfusion Matrix:")
    cm = metrics["confusion_matrix"]
    print(f"  TN: {cm['tn']} | FP: {cm['fp']}")
    print(f"  FN: {cm['fn']} | TP: {cm['tp']}")
    print("=" * 60)


if __name__ == "__main__":
    main()
