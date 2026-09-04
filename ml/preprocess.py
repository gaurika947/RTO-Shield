"""
RTO Shield — ML Feature Engineering and Preprocessing Pipeline
"""

import os
import json
import csv

FEATURE_NAMES = [
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

CATEGORIES = ["ELECTRONICS", "FASHION", "BEAUTY", "HOME", "ACCESSORIES"]


def extract_features_from_dict(row):
    """
    Transforms a raw order / transaction dict into a flat numeric feature vector.
    """
    prev_orders = float(row.get("previous_orders", 0))
    prev_del = float(row.get("previous_delivered_orders", 0))
    prev_rto = float(row.get("previous_rto_orders", 0))
    prev_can = float(row.get("previous_cancelled_orders", 0))

    rto_rate = float(row.get("customer_rto_rate", prev_rto / prev_orders if prev_orders > 0 else 0.0))
    succ_rate = float(row.get("customer_success_rate", prev_del / prev_orders if prev_orders > 0 else 0.0))

    category = row.get("product_category", "ELECTRONICS").upper()
    cat_flags = [1.0 if category == c else 0.0 for c in CATEGORIES]

    cod_selected = 1.0 if str(row.get("payment_method", "COD")).upper() == "COD" or row.get("cod_selected") in (1, "1", True) else 0.0

    return [
        prev_orders,
        prev_del,
        prev_rto,
        prev_can,
        rto_rate,
        succ_rate,
        float(row.get("days_since_first_order", 30)),
        float(row.get("order_value", 1999)),
        float(row.get("number_of_items", 1)),
        float(row.get("discount_percentage", 0)),
        cod_selected,
        float(row.get("pincode_rto_rate", 0.18)),
        float(row.get("address_completeness", 0.85)),
        float(row.get("address_changes", 0)),
        float(row.get("city_state_match", 1)),
        float(row.get("checkout_attempts", 1)),
        float(row.get("checkout_duration", 60)),
        float(row.get("cart_revisions", 0)),
        float(row.get("quantity_changes", 0)),
        float(row.get("payment_attempts", 1)),
        float(row.get("session_duration", 180)),
        float(row.get("intent_score", 50.0)),
        float(row.get("device_linked_accounts", 1)),
    ] + cat_flags


def load_dataset(csv_path):
    """
    Loads dataset without requiring external dependencies if numpy/pandas are loading.
    Returns (X, y, records)
    """
    X = []
    y = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            feats = extract_features_from_dict(row)
            target = int(row.get("is_rto", 0))
            X.append(feats)
            y.append(target)
    return X, y
