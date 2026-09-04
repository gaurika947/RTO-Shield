"""
RTO Shield — 10 Required Test Scenarios Verification Script
"""

from predict import predict_single

scenarios = [
    ("1. Legitimate (Priya)", {
        "previous_orders": 15, "previous_delivered_orders": 14, "previous_rto_orders": 0,
        "customer_rto_rate": 0.0, "payment_method": "COD", "order_value": 1899,
        "pincode_rto_rate": 0.10, "address_completeness": 0.95
    }),
    ("2. Moderate (Neha - New)", {
        "previous_orders": 0, "previous_delivered_orders": 0, "previous_rto_orders": 0,
        "customer_rto_rate": 0.0, "payment_method": "COD", "order_value": 1249,
        "pincode_rto_rate": 0.18, "address_completeness": 0.85
    }),
    ("3. Serial Returner (Rahul)", {
        "previous_orders": 7, "previous_delivered_orders": 2, "previous_rto_orders": 5,
        "customer_rto_rate": 0.71, "payment_method": "COD", "order_value": 3299,
        "pincode_rto_rate": 0.28, "address_completeness": 0.70, "device_linked_accounts": 3
    }),
    ("4. Abuse Ring (Aarav)", {
        "previous_orders": 12, "previous_delivered_orders": 4, "previous_rto_orders": 7,
        "customer_rto_rate": 0.58, "payment_method": "COD", "order_value": 4999,
        "pincode_rto_rate": 0.22, "address_completeness": 0.60, "device_linked_accounts": 5
    }),
    ("5. New Customer Limited History", {
        "previous_orders": 1, "previous_delivered_orders": 1, "previous_rto_orders": 0,
        "customer_rto_rate": 0.0, "payment_method": "COD", "order_value": 1500,
        "pincode_rto_rate": 0.18, "address_completeness": 0.80
    }),
    ("6. High-Value COD (Vikram)", {
        "previous_orders": 8, "previous_delivered_orders": 5, "previous_rto_orders": 2,
        "customer_rto_rate": 0.25, "payment_method": "COD", "order_value": 4199,
        "pincode_rto_rate": 0.18, "address_completeness": 0.85, "device_linked_accounts": 2
    }),
    ("7. High-Risk Pincode (Rohan)", {
        "previous_orders": 4, "previous_delivered_orders": 3, "previous_rto_orders": 1,
        "customer_rto_rate": 0.25, "payment_method": "COD", "order_value": 3499,
        "pincode_rto_rate": 0.38, "address_completeness": 0.75
    }),
    ("8. Address Changes (Sneha)", {
        "previous_orders": 2, "previous_delivered_orders": 2, "previous_rto_orders": 0,
        "customer_rto_rate": 0.0, "payment_method": "COD", "order_value": 2899,
        "pincode_rto_rate": 0.18, "address_completeness": 0.45, "address_changes": 3
    }),
    ("9. High Velocity Bot (Karan)", {
        "previous_orders": 6, "previous_delivered_orders": 1, "previous_rto_orders": 4,
        "customer_rto_rate": 0.67, "payment_method": "COD", "order_value": 2299,
        "pincode_rto_rate": 0.18, "checkout_attempts": 5, "checkout_duration": 12, "device_linked_accounts": 4
    }),
    ("10. Veteran Loyal Buyer (Sunita)", {
        "previous_orders": 28, "previous_delivered_orders": 28, "previous_rto_orders": 0,
        "customer_rto_rate": 0.0, "payment_method": "UPI", "order_value": 4999,
        "pincode_rto_rate": 0.12, "address_completeness": 0.95
    }),
]

print("=" * 85)
print(f"{'Scenario Name':34s} | {'Score':5s} | {'Tier':8s} | {'P(RTO)':7s} | {'Action':18s}")
print("=" * 85)
for name, payload in scenarios:
    res = predict_single(payload)
    print(f"{name:34s} | {res['riskScore']:4d}/100 | {res['riskLevel']:8s} | {res['rtoProbability']:0.3f}   | {res['recommendedAction']:18s}")
print("=" * 85)
