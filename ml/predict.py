"""
RTO Shield — Standalone Python Prediction & Inference Service
Can be executed via CLI, sub-process, or imported as a module.
"""

import os
import sys
import json
import math
import time
from preprocess import extract_features_from_dict
from explain import explain_prediction

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


def classify_risk_tier(score):
    if score >= 75:
        return "CRITICAL", "PREPAID_REQUIRED"
    elif score >= 50:
        return "HIGH", "VERIFY_OR_PREPAID"
    elif score >= 25:
        return "MODERATE", "SOFT_VERIFICATION"
    else:
        return "LOW", "ALLOW_COD"


def predict_single(order_payload):
    """
    Computes RTO probability, risk score, risk level, intent score, and explainable reasons.
    """
    features = extract_features_from_dict(order_payload)
    artifact_path = os.path.join(MODELS_DIR, "rto_model.joblib")
    if os.path.exists(artifact_path):
        try:
            import joblib
            start = time.perf_counter()
            model = joblib.load(artifact_path)
            probability = float(model.predict_proba([features])[0][1])
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            risk_score = max(0, min(100, int(round(probability * 100))))
            risk_level, action = classify_risk_tier(risk_score)
            return {
                "rtoProbability": round(probability, 4),
                "riskScore": risk_score,
                "riskLevel": risk_level,
                "recommendedAction": action,
                "modelVersion": "RTO Shield GBDT v1",
                "modelSource": "primary_artifact",
                "inferenceLatencyMs": elapsed_ms,
                "probabilityLabel": "Predicted RTO Probability",
            }
        except Exception as exc:
            artifact_error = str(exc)
        else:
            artifact_error = None
    else:
        artifact_error = "rto_model.joblib not found"

    # Feature mapping
    prev_orders = features[0]
    prev_del = features[1]
    prev_rto = features[2]
    rto_rate = features[4]
    order_val = features[7]
    cod_selected = features[10]
    pincode_rate = features[11]
    addr_comp = features[12]
    addr_changes = features[13]
    city_match = features[14]
    chk_attempts = features[15]
    chk_dur = features[16]
    intent_score = features[21]
    device_links = features[22]

    # Calculate probabilistic model score
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

    ring_detected = device_links >= 3 or (prev_orders > 0 and rto_rate > 0.5 and device_links >= 2)
    ring_score = min(95, int(device_links * 18 + rto_rate * 40)) if ring_detected else int(device_links * 8)

    signals = []
    if device_links >= 3:
        signals.append(f"{device_links} accounts share device fingerprint")
    if ring_detected and rto_rate > 0.4:
        signals.append(f"Cluster return rate is elevated ({rto_rate:.0%})")

    return {
        "rtoProbability": round(prob, 4),
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "intentScore": round(intent_score, 1),
        "recommendedAction": action,
        "reasons": reasons,
        "ringRisk": {
            "ringRiskScore": ring_score,
            "ringDetected": ring_detected,
            "clusterSize": device_links,
            "signals": signals,
        },
        "modelVersion": "RTO Shield Deterministic Fallback v1",
        "modelSource": "deterministic_fallback",
        "probabilityLabel": "Predicted RTO Probability (fallback approximation)",
        "artifactError": artifact_error,
    }


def main():
    # If run with JSON input via stdin or arg
    if len(sys.argv) > 1:
        payload = json.loads(sys.argv[1])
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
