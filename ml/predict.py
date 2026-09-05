"""
RTO Shield — Standalone Python Prediction & Inference Service
Can be executed via CLI, sub-process, or imported as a module.
"""

import os
import sys
import json
import math
import time
import pathlib
from preprocess import FEATURE_NAMES, FEATURE_SCHEMA_VERSION, extract_features_from_dict
from explain import explain_prediction
from model_manifest import DATASET_NAME, MANIFEST_NAME, MODEL_VERSION, sha256_file

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
_CACHED_ARTIFACT_HASH = None


def get_artifact_hash(path: str) -> str:
    global _CACHED_ARTIFACT_HASH
    if _CACHED_ARTIFACT_HASH is None:
        _CACHED_ARTIFACT_HASH = sha256_file(path)
    return _CACHED_ARTIFACT_HASH


def load_manifest_dataset_version():
    manifest_path = pathlib.Path(MODELS_DIR) / "model_manifest.json"
    if not manifest_path.exists():
        return None
    with manifest_path.open("r", encoding="utf-8") as manifest_file:
        return json.load(manifest_file)["dataset"]["version"]


def classify_risk_tier(score):
    if score >= 75:
        return "CRITICAL", "PREPAID_REQUIRED"
    elif score >= 50:
        return "HIGH", "VERIFY_OR_PREPAID"
    elif score >= 25:
        return "MODERATE", "SOFT_VERIFICATION"
    else:
        return "LOW", "ALLOW_COD"


def predict_single(order_payload, require_artifact=False, model=None):
    """
    Computes RTO probability, risk score, risk level, intent score, and explainable reasons.
    """
    if not isinstance(order_payload, dict):
        raise ValueError("Prediction payload must be an object")
    features = extract_features_from_dict(order_payload)
    if len(features) != len(FEATURE_NAMES):
        raise ValueError(f"Expected {len(FEATURE_NAMES)} features, got {len(features)}")
    artifact_path = os.path.join(MODELS_DIR, "rto_model.joblib")
    if require_artifact and not os.path.exists(artifact_path):
        raise FileNotFoundError("rto_model.joblib is required for authoritative evaluation")

    intent_score = features[21]
    device_links = int(features[22])
    prev_orders = features[0]
    rto_rate = features[4]

    ring_detected = device_links >= 3 or (prev_orders > 0 and rto_rate > 0.5 and device_links >= 2)
    ring_score = min(95, int(device_links * 18 + rto_rate * 40)) if ring_detected else int(device_links * 8)
    signals = []
    if device_links >= 3:
        signals.append(f"{device_links} accounts share device fingerprint")
    if ring_detected and rto_rate > 0.4:
        signals.append(f"Cluster return rate is elevated ({rto_rate:.0%})")

    ring_risk_dict = {
        "ringRiskScore": ring_score,
        "ringDetected": ring_detected,
        "clusterSize": device_links,
        "signals": signals if signals else ["No abuse cluster anomalies detected"],
    }

    if os.path.exists(artifact_path):
        try:
            import joblib
            start = time.perf_counter()
            loaded_model = model or joblib.load(artifact_path)
            if not hasattr(loaded_model, "predict_proba") or getattr(loaded_model, "n_features_in_", None) != len(FEATURE_NAMES):
                raise ValueError("Model artifact does not match the feature schema")
            probability = float(loaded_model.predict_proba([features])[0][1])
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            risk_score = max(0, min(100, int(round(probability * 100))))
            risk_level, action = classify_risk_tier(risk_score)
            reasons = explain_prediction(order_payload, probability, risk_score)
            return {
                "rtoProbability": round(probability, 4),
                "riskScore": risk_score,
                "riskLevel": risk_level,
                "riskBand": "LOW" if risk_score <= 30 else ("MEDIUM" if risk_score <= 70 else "HIGH"),
                "intentScore": round(intent_score, 1),
                "recommendedAction": action,
                "reasons": reasons,
                "ringRisk": ring_risk_dict,
                "modelVersion": MODEL_VERSION,
                "modelSource": "artifact",
                "featureSchemaVersion": FEATURE_SCHEMA_VERSION,
                "artifactHash": get_artifact_hash(artifact_path),
                "evaluationDataset": DATASET_NAME,
                "evaluationDatasetVersion": load_manifest_dataset_version(),
                "evaluationManifest": MANIFEST_NAME,
                "inferenceLatencyMs": elapsed_ms,
                "probabilityLabel": "Predicted RTO Probability",
            }
        except Exception as exc:
            raise RuntimeError(f"Model artifact is present but unusable: {exc}") from exc
    else:
        artifact_error = "rto_model.joblib not found"

    # Fallback logit calculation
    prev_del = features[1]
    order_val = features[7]
    cod_selected = features[10]
    pincode_rate = features[11]
    addr_comp = features[12]
    addr_changes = features[13]
    city_match = features[14]
    chk_attempts = features[15]
    chk_dur = features[16]

    logit = -2.20

    if cod_selected == 1:
        logit += 1.35
        if order_val > 3000:
            logit += 0.45
    else:
        logit -= 1.60

    if prev_orders == 0:
        logit += 0.20
    else:
        logit += (rto_rate - 0.20) * 3.5
        if prev_del >= 8:
            logit -= 0.60

    logit += (pincode_rate - 0.15) * 2.8
    logit += (1.0 - addr_comp) * 0.90
    if addr_changes >= 2:
        logit += 0.35
    if city_match == 0:
        logit += 0.40

    logit -= ((intent_score - 50.0) / 50.0) * 0.95
    if chk_attempts >= 3:
        logit += 0.35
    if chk_dur < 25:
        logit += 0.30

    if device_links >= 4:
        logit += 1.40
    elif device_links >= 2:
        logit += 0.40

    prob = 1.0 / (1.0 + math.exp(-logit))
    risk_score = int(round(prob * 100))
    risk_score = max(0, min(100, risk_score))

    risk_level, action = classify_risk_tier(risk_score)
    reasons = explain_prediction(order_payload, prob, risk_score)

    return {
        "rtoProbability": round(prob, 4),
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "riskBand": "LOW" if risk_score <= 30 else ("MEDIUM" if risk_score <= 70 else "HIGH"),
        "intentScore": round(intent_score, 1),
        "recommendedAction": action,
        "reasons": reasons,
        "ringRisk": ring_risk_dict,
        "modelVersion": "RTO Shield Deterministic Fallback v1",
        "modelSource": "deterministic_fallback",
        "featureSchemaVersion": FEATURE_SCHEMA_VERSION,
        "artifactHash": None,
        "evaluationDataset": None,
        "probabilityLabel": "Predicted RTO Probability (fallback approximation)",
        "artifactError": artifact_error,
    }


def predict_batch(payload_list, require_artifact=False, model=None):
    """
    Performs vectorized batch prediction over an array of transaction payloads.
    Loads artifact once and evaluates all instances in a single predict_proba pass.
    """
    if not isinstance(payload_list, list):
        raise ValueError("Batch payload must be a list of objects")
    if not payload_list:
        return []

    artifact_path = os.path.join(MODELS_DIR, "rto_model.joblib")
    if require_artifact and not os.path.exists(artifact_path):
        raise FileNotFoundError("rto_model.joblib is required for authoritative batch evaluation")

    features_matrix = [extract_features_from_dict(p) for p in payload_list]

    if os.path.exists(artifact_path):
        try:
            import joblib
            start = time.perf_counter()
            loaded_model = model or joblib.load(artifact_path)
            probs = loaded_model.predict_proba(features_matrix)[:, 1]
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

            results = []
            for i, p in enumerate(payload_list):
                prob = float(probs[i])
                risk_score = max(0, min(100, int(round(prob * 100))))
                risk_level, action = classify_risk_tier(risk_score)
                reasons = explain_prediction(p, prob, risk_score)
                feats = features_matrix[i]
                dev_links = int(feats[22])
                p_orders = feats[0]
                r_rate = feats[4]
                r_det = dev_links >= 3 or (p_orders > 0 and r_rate > 0.5 and dev_links >= 2)
                r_score = min(95, int(dev_links * 18 + r_rate * 40)) if r_det else int(dev_links * 8)

                results.append({
                    "rtoProbability": round(prob, 4),
                    "riskScore": risk_score,
                    "riskLevel": risk_level,
                    "riskBand": "LOW" if risk_score <= 30 else ("MEDIUM" if risk_score <= 70 else "HIGH"),
                    "intentScore": round(feats[21], 1),
                    "recommendedAction": action,
                    "reasons": reasons,
                    "ringRisk": {
                        "ringRiskScore": r_score,
                        "ringDetected": r_det,
                        "clusterSize": dev_links,
                        "signals": [f"{dev_links} accounts share device fingerprint"] if dev_links >= 3 else ["No abuse cluster anomalies detected"],
                    },
                    "modelVersion": MODEL_VERSION,
                    "modelSource": "artifact",
                    "featureSchemaVersion": FEATURE_SCHEMA_VERSION,
                    "artifactHash": get_artifact_hash(artifact_path),
                    "inferenceLatencyMs": round(elapsed_ms / len(payload_list), 2),
                    "probabilityLabel": "Predicted RTO Probability",
                })
            return results
        except Exception as exc:
            raise RuntimeError(f"Model artifact is present but unusable in batch: {exc}") from exc

    # Fallback: predict each individually
    return [predict_single(p) for p in payload_list]


def main():
    if len(sys.argv) > 1:
        if sys.argv[1] == "--batch":
            raw_input = sys.stdin.read() if (len(sys.argv) <= 2 or sys.argv[2] == "-") else sys.argv[2]
            payload_list = json.loads(raw_input)
            res = predict_batch(payload_list)
            print(json.dumps(res))
            return
        raw_input = sys.stdin.read() if sys.argv[1] == "-" else sys.argv[1]
        payload = json.loads(raw_input)
    else:

        # Default test payload (Serial Returner sample)
        payload = {
            "previous_orders": 12,
            "previous_delivered_orders": 7,
            "previous_rto_orders": 5,
            "customer_rto_rate": 0.417,
            "order_value": 2499,
            "payment_method": "COD",
            "pincode_rto_rate": 0.22,
            "address_completeness": 0.85,
            "device_linked_accounts": 3,
            "intent_score": 38.0,
        }

    res = predict_single(payload)
    print(json.dumps(res, indent=2))


if __name__ == "__main__":
    main()

