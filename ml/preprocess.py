"""
RTO Shield — ML Feature Engineering and Preprocessing Pipeline
"""

import os
import json
import csv

from feature_contract import (
    CANONICAL_FEATURES,
    CATEGORIES,
    FEATURE_COUNT,
    FEATURE_INDEX_MAP,
    FEATURE_NAMES,
    FEATURE_SCHEMA_VERSION,
    validate_and_transform_features,
)


def extract_features_from_dict(row):
    """
    Transforms a raw order / transaction dict into a flat numeric feature vector
    using the authoritative canonical 28-feature contract.
    """
    return validate_and_transform_features(row)



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
