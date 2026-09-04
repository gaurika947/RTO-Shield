"""
RTO Shield — Explainability Layer
Calculates dynamic feature impacts and human-readable evidence reasons for any prediction.
"""

from preprocess import FEATURE_NAMES


def explain_prediction(features_dict, rto_prob, risk_score):
    """
    Decomposes an order's prediction into explainable feature impacts and messages.
    """
    reasons = []

    rto_rate = float(features_dict.get("customer_rto_rate", 0))
    prev_orders = int(features_dict.get("previous_orders", 0))
    prev_delivered = int(features_dict.get("previous_delivered_orders", 0))
    cod_selected = int(features_dict.get("cod_selected", 1))
    pincode_rate = float(features_dict.get("pincode_rto_rate", 0.18))
    addr_comp = float(features_dict.get("address_completeness", 0.85))
    addr_changes = int(features_dict.get("address_changes", 0))
    device_links = int(features_dict.get("device_linked_accounts", 1))
    intent_score = float(features_dict.get("intent_score", 50.0))
    checkout_attempts = int(features_dict.get("checkout_attempts", 1))
    order_val = float(features_dict.get("order_value", 1999))

    # 1. Customer history impact
    if prev_orders > 0 and rto_rate >= 0.35:
        reasons.append({
            "feature": "customer_rto_rate",
            "impact": "high" if rto_rate >= 0.50 else "medium",
            "points": round(rto_rate * 30),
            "message": f"Elevated historical return rate ({rto_rate:.1%} of past orders resulted in RTO)",
        })
    elif prev_delivered >= 8 and rto_rate < 0.10:
        reasons.append({
            "feature": "previous_delivered_orders",
            "impact": "positive",
            "points": -15,
            "message": f"Strong verified delivery track record ({prev_delivered} successful deliveries)",
        })

    # 2. Network / Device abuse impact
    if device_links >= 3:
        reasons.append({
            "feature": "device_linked_accounts",
            "impact": "high",
            "points": 24,
            "message": f"Device fingerprint is linked to {device_links} customer accounts with return history",
        })

    # 3. Pincode / Location risk
    if pincode_rate >= 0.25:
        reasons.append({
            "feature": "pincode_rto_rate",
            "impact": "medium",
            "points": round(pincode_rate * 40),
            "message": f"Postal pincode has elevated regional COD return frequency ({pincode_rate:.1%})",
        })

    # 4. Address completeness & changes
    if addr_comp < 0.60 or addr_changes >= 2:
        reasons.append({
            "feature": "address_completeness",
            "impact": "medium",
            "points": 12,
            "message": "Incomplete address structure or multiple address modifications during checkout session",
        })

    # 5. COD + High value
    if cod_selected == 1 and order_val >= 3000:
        reasons.append({
            "feature": "order_value",
            "impact": "low",
            "points": 8,
            "message": f"High-ticket Cash on Delivery transaction (₹{order_val:,.0f})",
        })

    # 6. Behavioral Intent Score
    if intent_score < 40:
        reasons.append({
            "feature": "intent_score",
            "impact": "medium",
            "points": 14,
            "message": f"Behavioral friction signals detected (Intent Confidence: {intent_score:.0f}/100)",
        })

    if not reasons:
        reasons.append({
            "feature": "baseline",
            "impact": "low",
            "points": 5,
            "message": "Standard transaction profile conforming to baseline merchant safety parameters",
        })

    return reasons
