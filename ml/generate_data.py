"""
RTO Shield — Synthetic RTO Training Data Generator
Generates realistic COD e-commerce orders with non-linear multi-signal interactions,
realistic noise, customer archetypes, and customer-grouped 70/15/15 train/val/test splits.
"""

import os
import random
import math
import json
import csv

# Set random seed for reproducible benchmark dataset
RANDOM_SEED = 42
random.seed(RANDOM_SEED)

TOTAL_ORDERS = 75000
TOTAL_CUSTOMERS = 18000

# High & medium risk pincode database simulation (Tier 1 vs Tier 2/3 remote zones)
PINCODE_RISK_MAP = {
    "110001": 0.09, "110070": 0.08, "110016": 0.07, "560001": 0.08, "560038": 0.09,
    "400001": 0.09, "400050": 0.08, "600001": 0.10, "700001": 0.12, "500001": 0.11,
    "201301": 0.22, "201309": 0.19, "201017": 0.28, "226010": 0.24, "302001": 0.18,
    "800001": 0.34, "842001": 0.38, "247001": 0.36, "282001": 0.32, "452001": 0.21,
    "380001": 0.14, "411001": 0.11, "141001": 0.26, "160017": 0.12, "834001": 0.33,
}
DEFAULT_PINCODE_RISK = 0.18

PRODUCT_CATEGORIES = ["ELECTRONICS", "FASHION", "BEAUTY", "HOME", "ACCESSORIES"]
CATEGORY_BASE_RTO = {
    "ELECTRONICS": 0.24,
    "FASHION": 0.29,
    "BEAUTY": 0.14,
    "HOME": 0.18,
    "ACCESSORIES": 0.21,
}

ARCHETYPES = ["LEGITIMATE", "OCCASIONAL_RTO", "SERIAL_RETURNER", "ABUSE_RING"]
ARCHETYPE_WEIGHTS = [0.60, 0.20, 0.12, 0.08]


def generate_customer_profiles(num_customers):
    customers = []
    # Shared device/subnet pool for abuse ring clustering
    shared_abuse_devices = [f"DEV_RING_{i:02d}" for i in range(1, 15)]
    shared_abuse_addresses = [f"ADDR_CLUSTER_{i:02d}" for i in range(1, 20)]
    shared_abuse_subnets = [f"192.168.4.{i}" for i in range(1, 8)]

    for c_id in range(1, num_customers + 1):
        archetype = random.choices(ARCHETYPES, weights=ARCHETYPE_WEIGHTS)[0]
        customer_id = f"CUS_{c_id:05d}"
        days_since_first_order = random.randint(1, 730)

        if archetype == "LEGITIMATE":
            total_orders = random.randint(2, 35)
            rto_orders = random.choices([0, 1, 2], weights=[0.82, 0.15, 0.03])[0]
            rto_orders = min(rto_orders, total_orders - 1) if total_orders > 1 else 0
            cancelled = random.randint(0, 1)
            delivered = max(0, total_orders - rto_orders - cancelled)
            preferred_pincode = random.choice(list(PINCODE_RISK_MAP.keys())[:10])
            device_id = f"DEV_LEG_{c_id:05d}"
            address_token = f"ADDR_LEG_{c_id:05d}"
            ip_subnet = f"10.0.{random.randint(1, 250)}.{random.randint(1, 250)}"
            device_links = 1

        elif archetype == "OCCASIONAL_RTO":
            total_orders = random.randint(3, 20)
            rto_rate_target = random.uniform(0.12, 0.26)
            rto_orders = max(1, int(total_orders * rto_rate_target))
            cancelled = random.randint(0, 2)
            delivered = max(0, total_orders - rto_orders - cancelled)
            preferred_pincode = random.choice(list(PINCODE_RISK_MAP.keys()))
            device_id = f"DEV_OCC_{c_id:05d}"
            address_token = f"ADDR_OCC_{c_id:05d}"
            ip_subnet = f"172.16.{random.randint(1, 250)}.{random.randint(1, 250)}"
            device_links = random.choice([1, 1, 2])

        elif archetype == "SERIAL_RETURNER":
            total_orders = random.randint(4, 25)
            rto_rate_target = random.uniform(0.40, 0.75)
            rto_orders = max(2, int(total_orders * rto_rate_target))
            cancelled = random.randint(0, 3)
            delivered = max(0, total_orders - rto_orders - cancelled)
            preferred_pincode = random.choice(list(PINCODE_RISK_MAP.keys())[10:])
            device_id = f"DEV_SER_{c_id:05d}"
            address_token = f"ADDR_SER_{c_id:05d}"
            ip_subnet = f"192.168.{random.randint(10, 50)}.{random.randint(1, 250)}"
            device_links = random.randint(1, 3)

        else:  # ABUSE_RING
            total_orders = random.randint(1, 15)
            rto_rate_target = random.uniform(0.60, 0.90)
            rto_orders = max(1, int(total_orders * rto_rate_target))
            cancelled = random.randint(0, 2)
            delivered = max(0, total_orders - rto_orders - cancelled)
            preferred_pincode = random.choice(list(PINCODE_RISK_MAP.keys())[15:])
            device_id = random.choice(shared_abuse_devices)
            address_token = random.choice(shared_abuse_addresses)
            ip_subnet = random.choice(shared_abuse_subnets)
            device_links = random.randint(3, 9)

        rto_rate = rto_orders / total_orders if total_orders > 0 else 0.0
        success_rate = delivered / total_orders if total_orders > 0 else 0.0

        customers.append({
            "customer_id": customer_id,
            "archetype": archetype,
            "previous_orders": total_orders,
            "previous_delivered_orders": delivered,
            "previous_rto_orders": rto_orders,
            "previous_cancelled_orders": cancelled,
            "customer_rto_rate": round(rto_rate, 4),
            "customer_success_rate": round(success_rate, 4),
            "days_since_first_order": days_since_first_order,
            "preferred_pincode": preferred_pincode,
            "device_id": device_id,
            "address_token": address_token,
            "ip_subnet": ip_subnet,
            "device_linked_accounts": device_links,
        })
    return customers


def calculate_intent_score(prev_delivered, prev_rto, rto_rate, address_comp, duration, attempts, pincode_risk):
    """
    Calculates derived behavioral intent score (0-100).
    Higher means positive, trustworthy behavioral intent.
    Lower means friction / return-risk signals.
    """
    score = 50.0

    # History factor (+/- 25)
    if prev_delivered >= 5 and rto_rate < 0.10:
        score += 20.0
    elif prev_delivered >= 2 and rto_rate < 0.20:
        score += 10.0
    elif rto_rate >= 0.50:
        score -= 22.0
    elif rto_rate >= 0.30:
        score -= 14.0

    # Address completeness factor (+/- 12)
    if address_comp >= 0.85:
        score += 8.0
    elif address_comp < 0.50:
        score -= 12.0

    # Checkout duration / friction factor (+/- 10)
    if 45 <= duration <= 240:
        score += 6.0
    elif duration < 20 or duration > 500:
        score -= 8.0

    # Checkout attempts
    if attempts == 1:
        score += 4.0
    elif attempts >= 3:
        score -= 10.0

    # Pincode baseline
    if pincode_risk > 0.30:
        score -= 8.0
    elif pincode_risk < 0.12:
        score += 5.0

    return max(5.0, min(95.0, round(score, 1)))


def generate_orders(customers, total_orders):
    orders = []
    for i in range(1, total_orders + 1):
        cust = random.choice(customers)
        order_id = f"ORD_{i:06d}"
        category = random.choice(PRODUCT_CATEGORIES)
        num_items = random.choices([1, 2, 3, 4, 5], weights=[0.55, 0.25, 0.12, 0.05, 0.03])[0]

        # Order value based on category
        if category == "ELECTRONICS":
            order_value = random.randint(999, 8999)
        elif category == "FASHION":
            order_value = random.randint(499, 4500)
        elif category == "BEAUTY":
            order_value = random.randint(299, 2200)
        else:
            order_value = random.randint(399, 3500)

        discount_pct = random.choice([0, 5, 10, 15, 20, 30, 40])

        # Payment method selection
        if cust["archetype"] == "SERIAL_RETURNER":
            payment_method = random.choices(["COD", "UPI", "CARD"], weights=[0.88, 0.08, 0.04])[0]
        elif cust["archetype"] == "ABUSE_RING":
            payment_method = random.choices(["COD", "UPI", "CARD"], weights=[0.94, 0.04, 0.02])[0]
        elif cust["archetype"] == "OCCASIONAL_RTO":
            payment_method = random.choices(["COD", "UPI", "CARD"], weights=[0.65, 0.25, 0.10])[0]
        else:
            payment_method = random.choices(["COD", "UPI", "CARD"], weights=[0.40, 0.42, 0.18])[0]

        cod_selected = 1 if payment_method == "COD" else 0

        # Address & location features
        pincode = cust["preferred_pincode"]
        pincode_rto_rate = PINCODE_RISK_MAP.get(pincode, DEFAULT_PINCODE_RISK)

        if cust["archetype"] == "LEGITIMATE":
            address_completeness = round(random.uniform(0.78, 1.0), 2)
            address_changes = random.choices([0, 1], weights=[0.92, 0.08])[0]
            city_state_match = 1
            checkout_duration = random.randint(45, 210)
            checkout_attempts = random.choices([1, 2], weights=[0.90, 0.10])[0]
            cart_revisions = random.choices([0, 1, 2], weights=[0.70, 0.22, 0.08])[0]
            quantity_changes = random.choices([0, 1], weights=[0.85, 0.15])[0]
            payment_attempts = 1
            session_duration = checkout_duration + random.randint(60, 400)
        elif cust["archetype"] == "OCCASIONAL_RTO":
            address_completeness = round(random.uniform(0.55, 0.90), 2)
            address_changes = random.choices([0, 1, 2], weights=[0.75, 0.20, 0.05])[0]
            city_state_match = random.choices([1, 0], weights=[0.94, 0.06])[0]
            checkout_duration = random.randint(30, 320)
            checkout_attempts = random.choices([1, 2, 3], weights=[0.78, 0.17, 0.05])[0]
            cart_revisions = random.choices([0, 1, 2, 3], weights=[0.55, 0.28, 0.12, 0.05])[0]
            quantity_changes = random.choices([0, 1, 2], weights=[0.70, 0.22, 0.08])[0]
            payment_attempts = random.choices([1, 2], weights=[0.85, 0.15])[0]
            session_duration = checkout_duration + random.randint(50, 600)
        elif cust["archetype"] == "SERIAL_RETURNER":
            address_completeness = round(random.uniform(0.40, 0.80), 2)
            address_changes = random.choices([0, 1, 2, 3], weights=[0.50, 0.30, 0.14, 0.06])[0]
            city_state_match = random.choices([1, 0], weights=[0.88, 0.12])[0]
            checkout_duration = random.randint(18, 180)
            checkout_attempts = random.choices([1, 2, 3, 4], weights=[0.55, 0.25, 0.14, 0.06])[0]
            cart_revisions = random.randint(0, 4)
            quantity_changes = random.randint(0, 3)
            payment_attempts = random.choices([1, 2, 3], weights=[0.70, 0.20, 0.10])[0]
            session_duration = checkout_duration + random.randint(30, 350)
        else:  # ABUSE_RING
            address_completeness = round(random.uniform(0.30, 0.70), 2)
            address_changes = random.choices([0, 1, 2, 3, 4], weights=[0.35, 0.30, 0.20, 0.10, 0.05])[0]
            city_state_match = random.choices([1, 0], weights=[0.80, 0.20])[0]
            checkout_duration = random.randint(12, 120)  # Very fast / automated
            checkout_attempts = random.choices([1, 2, 3, 4, 5], weights=[0.40, 0.25, 0.18, 0.12, 0.05])[0]
            cart_revisions = random.randint(0, 5)
            quantity_changes = random.randint(0, 4)
            payment_attempts = random.choices([1, 2, 3], weights=[0.60, 0.25, 0.15])[0]
            session_duration = checkout_duration + random.randint(20, 200)

        # Derived intent score
        intent_score = calculate_intent_score(
            cust["previous_delivered_orders"],
            cust["previous_rto_orders"],
            cust["customer_rto_rate"],
            address_completeness,
            checkout_duration,
            checkout_attempts,
            pincode_rto_rate
        )

        # --- MULTI-FACTOR LATENT RTO PROBABILITY CALCULATION ---
        # Logistic latent score combines historical fulfillment, payment method, category,
        # location risk, behavioral intent score, and network cluster abuse signals.
        logit = -2.20  # Base intercept

        # Payment & COD factor
        if cod_selected == 1:
            logit += 1.35
            if order_value > 3000:
                logit += 0.45  # High-ticket COD interaction
        else:
            logit -= 1.60  # Prepaid orders have dramatically lower RTO

        # Customer history factor
        if cust["previous_orders"] == 0:
            logit += 0.20  # Baseline mild uncertainty for brand new customer
        else:
            logit += (cust["customer_rto_rate"] - 0.20) * 3.5
            if cust["previous_delivered_orders"] >= 8:
                logit -= 0.60  # Strong loyalty dampener

        # Location / Address factor
        logit += (pincode_rto_rate - 0.15) * 2.8
        logit += (1.0 - address_completeness) * 0.90
        if address_changes >= 2:
            logit += 0.35
        if city_state_match == 0:
            logit += 0.40

        # Category factor
        logit += (CATEGORY_BASE_RTO[category] - 0.20) * 1.8

        # Behavioral & Intent score factor
        logit -= ((intent_score - 50.0) / 50.0) * 0.95
        if checkout_attempts >= 3:
            logit += 0.35
        if checkout_duration < 25:
            logit += 0.30

        # Network / Abuse-Ring factor
        if cust["device_linked_accounts"] >= 4:
            logit += 1.40
        elif cust["device_linked_accounts"] >= 2:
            logit += 0.40

        # Add Gaussian noise for realistic irreducible real-world variance
        noise = random.gauss(0.0, 0.40)
        total_logit = logit + noise

        # Sigmoid activation
        prob = 1.0 / (1.0 + math.exp(-total_logit))
        is_rto = 1 if prob >= 0.50 else 0

        orders.append({
            "order_id": order_id,
            "customer_id": cust["customer_id"],
            "archetype": cust["archetype"],
            "previous_orders": cust["previous_orders"],
            "previous_delivered_orders": cust["previous_delivered_orders"],
            "previous_rto_orders": cust["previous_rto_orders"],
            "previous_cancelled_orders": cust["previous_cancelled_orders"],
            "customer_rto_rate": cust["customer_rto_rate"],
            "customer_success_rate": cust["customer_success_rate"],
            "days_since_first_order": cust["days_since_first_order"],
            "order_value": order_value,
            "number_of_items": num_items,
            "product_category": category,
            "discount_percentage": discount_pct,
            "payment_method": payment_method,
            "cod_selected": cod_selected,
            "pincode": pincode,
            "pincode_rto_rate": round(pincode_rto_rate, 4),
            "address_completeness": address_completeness,
            "address_changes": address_changes,
            "city_state_match": city_state_match,
            "checkout_attempts": checkout_attempts,
            "checkout_duration": checkout_duration,
            "cart_revisions": cart_revisions,
            "quantity_changes": quantity_changes,
            "payment_attempts": payment_attempts,
            "session_duration": session_duration,
            "intent_score": intent_score,
            "device_linked_accounts": cust["device_linked_accounts"],
            "true_rto_probability": round(prob, 4),
            "is_rto": is_rto,
        })
    return orders


def export_dataset_splits(orders, output_dir):
    os.makedirs(output_dir, exist_ok=True)

    # Customer-grouped split to prevent data leakage across train/val/test
    all_cust_ids = list(set(o["customer_id"] for o in orders))
    random.shuffle(all_cust_ids)

    n_cust = len(all_cust_ids)
    n_train = int(n_cust * 0.70)
    n_val = int(n_cust * 0.15)

    train_custs = set(all_cust_ids[:n_train])
    val_custs = set(all_cust_ids[n_train:n_train + n_val])
    test_custs = set(all_cust_ids[n_train + n_val:])

    train_orders = [o for o in orders if o["customer_id"] in train_custs]
    val_orders = [o for o in orders if o["customer_id"] in val_custs]
    test_orders = [o for o in orders if o["customer_id"] in test_custs]

    fieldnames = list(orders[0].keys())

    for name, data in [("train.csv", train_orders), ("val.csv", val_orders), ("test.csv", test_orders)]:
        path = os.path.join(output_dir, name)
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        print(f"Exported {name}: {len(data)} rows (RTO rate: {sum(o['is_rto'] for o in data) / len(data):.2%})")

    meta = {
        "dataset_name": "RTO Shield Synthetic Demo Dataset",
        "version": "1.0",
        "total_orders": len(orders),
        "total_customers": n_cust,
        "train_rows": len(train_orders),
        "val_rows": len(val_orders),
        "test_rows": len(test_orders),
        "overall_rto_rate": round(sum(o["is_rto"] for o in orders) / len(orders), 4),
        "features_count": len(fieldnames) - 2,
    }
    with open(os.path.join(output_dir, "dataset_meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print(f"\n[OK] Dataset generation complete in {output_dir}")


def main():
    print("=" * 60)
    print("RTO SHIELD — DATASET GENERATOR")
    print(f"Generating {TOTAL_ORDERS} orders across {TOTAL_CUSTOMERS} customers...")
    print("=" * 60)

    customers = generate_customer_profiles(TOTAL_CUSTOMERS)
    orders = generate_orders(customers, TOTAL_ORDERS)
    export_dataset_splits(orders, os.path.join(os.path.dirname(__file__), "data"))


if __name__ == "__main__":
    main()
