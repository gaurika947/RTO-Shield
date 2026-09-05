"""
RTO Shield — Canonical 28-Feature Contract (rto-features-v1)
Authoritative specification for all model input features.
Every layer (data generation, training, Python inference, API, and TypeScript integration)
must adhere strictly to this contract.
"""

from __future__ import annotations
from typing import Any, Dict, List, Tuple

FEATURE_SCHEMA_VERSION = "rto-features-v1"

# Ordered list of 28 feature definitions:
# (name, type, min_val, max_val, default_val, semantic_description)
CANONICAL_FEATURES: List[Tuple[str, str, float, float, float, str]] = [
    ("previous_orders", "int", 0.0, 500.0, 0.0, "Total historical orders placed by customer"),
    ("previous_delivered_orders", "int", 0.0, 500.0, 0.0, "Total historical successfully delivered orders"),
    ("previous_rto_orders", "int", 0.0, 500.0, 0.0, "Total historical returned-to-origin orders"),
    ("previous_cancelled_orders", "int", 0.0, 500.0, 0.0, "Total historical cancelled orders"),
    ("customer_rto_rate", "float", 0.0, 1.0, 0.0, "Ratio of previous RTO orders to total previous orders (0.0 if new)"),
    ("customer_success_rate", "float", 0.0, 1.0, 0.0, "Ratio of delivered orders to total previous orders (0.0 if new)"),
    ("days_since_first_order", "float", 0.0, 3650.0, 30.0, "Account age in days since first observed transaction"),
    ("order_value", "float", 0.0, 1000000.0, 1999.0, "Gross total transaction amount in INR"),
    ("number_of_items", "int", 1.0, 50.0, 1.0, "Total quantity of items in cart"),
    ("discount_percentage", "float", 0.0, 100.0, 0.0, "Promotional discount applied as percentage"),
    ("cod_selected", "binary", 0.0, 1.0, 1.0, "Binary indicator: 1.0 if Cash on Delivery, 0.0 for prepaid (UPI/Card)"),
    ("pincode_rto_rate", "float", 0.0, 1.0, 0.18, "Regional return frequency for destination postal pincode"),
    ("address_completeness", "float", 0.0, 1.0, 0.85, "Completeness quality score of delivery address line, landmark, city"),
    ("address_changes", "int", 0.0, 20.0, 0.0, "Count of address edits made during the checkout session"),
    ("city_state_match", "binary", 0.0, 1.0, 1.0, "Binary indicator: 1.0 if city matches postal state directory, 0.0 otherwise"),
    ("checkout_attempts", "int", 1.0, 50.0, 1.0, "Count of checkout submission attempts in current session"),
    ("checkout_duration", "float", 1.0, 3600.0, 60.0, "Time in seconds spent on checkout page before order placement"),
    ("cart_revisions", "int", 0.0, 50.0, 0.0, "Number of item additions, deletions, or swaps in cart"),
    ("quantity_changes", "int", 0.0, 50.0, 0.0, "Number of cart item quantity alterations"),
    ("payment_attempts", "int", 1.0, 20.0, 1.0, "Count of payment authorization attempts in current session"),
    ("session_duration", "float", 5.0, 7200.0, 180.0, "Total session duration across website browsing in seconds"),
    ("intent_score", "float", 0.0, 100.0, 50.0, "Heuristic intent confidence score based on browsing speed and friction"),
    ("device_linked_accounts", "int", 1.0, 100.0, 1.0, "Count of distinct customer accounts associated with device hardware ID"),
    ("cat_ELECTRONICS", "binary", 0.0, 1.0, 1.0, "One-hot indicator: Product category is Electronics (default)"),
    ("cat_FASHION", "binary", 0.0, 1.0, 0.0, "One-hot indicator: Product category is Fashion"),
    ("cat_BEAUTY", "binary", 0.0, 1.0, 0.0, "One-hot indicator: Product category is Beauty & Personal Care"),
    ("cat_HOME", "binary", 0.0, 1.0, 0.0, "One-hot indicator: Product category is Home & Living"),
    ("cat_ACCESSORIES", "binary", 0.0, 1.0, 0.0, "One-hot indicator: Product category is Accessories"),
]

FEATURE_NAMES: List[str] = [feat[0] for feat in CANONICAL_FEATURES]
FEATURE_COUNT = len(FEATURE_NAMES)
assert FEATURE_COUNT == 28, f"Canonical feature contract MUST contain exactly 28 features, got {FEATURE_COUNT}"

FEATURE_INDEX_MAP: Dict[str, int] = {name: i for i, name in enumerate(FEATURE_NAMES)}
CATEGORIES: List[str] = ["ELECTRONICS", "FASHION", "BEAUTY", "HOME", "ACCESSORIES"]


def validate_and_transform_features(raw_dict: Dict[str, Any]) -> List[float]:
    """
    Transforms any raw input dict into the canonical 28-feature numeric vector.
    Enforces types, missing-value defaults, derived ratios, and strict bounds.
    """
    if not isinstance(raw_dict, dict):
        raise TypeError(f"Expected dict for feature extraction, got {type(raw_dict).__name__}")

    # 1. Base order history
    try:
        prev_orders = max(0.0, float(raw_dict.get("previous_orders", 0.0)))
        prev_del = max(0.0, float(raw_dict.get("previous_delivered_orders", 0.0)))
        prev_rto = max(0.0, float(raw_dict.get("previous_rto_orders", 0.0)))
        prev_can = max(0.0, float(raw_dict.get("previous_cancelled_orders", 0.0)))
    except (ValueError, TypeError) as exc:
        raise ValueError(f"Order history fields must be numeric: {exc}") from exc

    # Derived rates (canonical transformation rule)
    if "customer_rto_rate" in raw_dict and raw_dict["customer_rto_rate"] is not None:
        rto_rate = float(raw_dict["customer_rto_rate"])
    else:
        rto_rate = prev_rto / prev_orders if prev_orders > 0 else 0.0
    rto_rate = max(0.0, min(1.0, rto_rate))

    if "customer_success_rate" in raw_dict and raw_dict["customer_success_rate"] is not None:
        succ_rate = float(raw_dict["customer_success_rate"])
    else:
        succ_rate = prev_del / prev_orders if prev_orders > 0 else 0.0
    succ_rate = max(0.0, min(1.0, succ_rate))

    # Payment method indicator
    pm = str(raw_dict.get("payment_method", "COD")).strip().upper()
    if "cod_selected" in raw_dict and raw_dict["cod_selected"] is not None:
        cod_selected = 1.0 if raw_dict["cod_selected"] in (1, 1.0, "1", True) else 0.0
    else:
        cod_selected = 1.0 if pm == "COD" else 0.0

    # Category one-hot flags
    cat = str(raw_dict.get("product_category", "ELECTRONICS")).strip().upper()
    cat_flags = [1.0 if cat == c else 0.0 for c in CATEGORIES]
    # If category not recognized, fallback to ELECTRONICS
    if sum(cat_flags) == 0.0:
        cat_flags[0] = 1.0

    # Numeric conversions with explicit default fallbacks
    def num(key: str, default: float, min_v: float, max_v: float) -> float:
        val = raw_dict.get(key)
        if val is None or val == "":
            return default
        try:
            f = float(val)
            return max(min_v, min(max_v, f))
        except (ValueError, TypeError) as exc:
            raise ValueError(f"Feature '{key}' must be numeric, got: {val!r}") from exc

    features: List[float] = [
        prev_orders,
        prev_del,
        prev_rto,
        prev_can,
        rto_rate,
        succ_rate,
        num("days_since_first_order", 30.0, 0.0, 3650.0),
        num("order_value", 1999.0, 0.0, 1000000.0),
        num("number_of_items", 1.0, 1.0, 50.0),
        num("discount_percentage", 0.0, 0.0, 100.0),
        cod_selected,
        num("pincode_rto_rate", 0.18, 0.0, 1.0),
        num("address_completeness", 0.85, 0.0, 1.0),
        num("address_changes", 0.0, 0.0, 20.0),
        num("city_state_match", 1.0, 0.0, 1.0),
        num("checkout_attempts", 1.0, 1.0, 50.0),
        num("checkout_duration", 60.0, 1.0, 3600.0),
        num("cart_revisions", 0.0, 0.0, 50.0),
        num("quantity_changes", 0.0, 0.0, 50.0),
        num("payment_attempts", 1.0, 1.0, 20.0),
        num("session_duration", 180.0, 5.0, 7200.0),
        num("intent_score", 50.0, 0.0, 100.0),
        num("device_linked_accounts", 1.0, 1.0, 100.0),
    ] + cat_flags

    assert len(features) == 28, f"Expected 28 transformed features, got {len(features)}"
    return features
