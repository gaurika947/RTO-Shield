# RTO-Shield Final Submission Readiness Checklist

Verified Date: 2026-09-05  
Verified Artifact Hash: `921353523dda484b9e87afc6e9efd934dc30dd12c179baf03ebf3caa3181f39c`  
Feature Schema: `rto-features-v1` (28 canonical features)  
Policy Version: `PAYMENT_POLICY_V2`  

---

## 1. Product & Architecture

| Item | Status | Verification Evidence |
|---|:---:|---|
| **Core End-to-End Flow** | **PASS** | Transaction → 28 features → GBDT inference → 7-signal aggregation → policy decision → checkout. |
| **Adaptive Checkout** | **PASS** | Private merchant risk intelligence paired with customer-safe, neutral payment nudges. |
| **Risk Intelligence** | **PASS** | Transparent signal attribution across Address, History, Network, Velocity, Behavior, ML, and AI. |
| **Abuse Sentinel** | **PASS** | Multi-entity constellation graph clustering; explicitly labeled as DEMO SCENARIO. |
| **Authoritative Counterfactuals** | **PASS** | `POST /api/ml/counterfactual` executes batch mutations through authoritative GBDT artifact. |

---

## 2. Machine Learning & Provenance

| Item | Status | Verification Evidence |
|---|:---:|---|
| **Artifact Exists** | **PASS** | `ml/models/rto_model.joblib` exists in repository. |
| **Artifact Hash Verified** | **PASS** | Evaluated SHA-256 matches `921353523dda484b9e87afc6e9efd934dc30dd12c179baf03ebf3caa3181f39c` identically. |
| **28-Feature Schema Parity** | **PASS** | Verified across `feature_contract.py`, `preprocess.py`, `predict.py`, and `server/index.js`. |
| **Runtime / Evaluation Parity** | **PASS** | Held-out test split (11,360 rows) evaluated by `ml/evaluate.py`; matches manifest metrics. |
| **Provenance Visible in UI** | **PASS** | Model Status page (`/model-status`) dynamically loads and displays hash, schema, and manifest metadata. |
| **Fallback Explicitly Labeled** | **PASS** | Fallback explicitly returns `modelSource: 'deterministic_fallback'` and is only used when the artifact file is absent. |

---

## 3. Security & Checkout Integrity

| Item | Status | Verification Evidence |
|---|:---:|---|
| **Server-Authoritative Risk** | **PASS** | `/api/checkout/validate-payment` ignores client-controlled riskLevel. Tested via automated attack tests. |
| **Client Risk Manipulation Blocked** | **PASS** | Sending `riskLevel: 'LOW'` on a high-risk order is rejected with HTTP 403. Verified in test suite. |
| **Amount Manipulation Blocked** | **PASS** | Rejects amount tampering (₹1 or ₹999,999 vs ₹1,899). Tested via `securityAuthoritative.test.ts`. |
| **HMAC Decision Tokens** | **PASS** | Tokens signed with SHA-256 HMAC, carrying orderId, amount, risk tier, and 15-minute expiration. |
| **Decision Replay Protection** | **PASS** | Order A token cannot be replayed on Order B (`ORDER_BINDING_MISMATCH`). Tested in test suite. |
| **Token Tampering Protection** | **PASS** | Altered token payloads or forged signatures are rejected with HTTP 401 (`INVALID_TOKEN_SIGNATURE`). |
| **Idempotency Protection** | **PASS** | Server-side idempotency store caches responses by key; rejects modified payload with HTTP 409 Conflict. |
| **Input Validation** | **PASS** | Types, positive amounts, and allowed payment methods ('COD', 'UPI', 'CARD') strictly enforced. |
| **CORS Configured** | **PASS** | Environment-aware allowlist with local development origins. |
| **Rate Limiting** | **PASS** | Sliding-window rate limiters active on checkout (60/min), ML (120/min), and AI (40/min). |
| **No Secrets Committed** | **PASS** | `.env` ignored by `.gitignore`; `.env.example` contains placeholders only. |

---

## 4. Artificial Intelligence (Gemini)

| Item | Status | Verification Evidence |
|---|:---:|---|
| **Gemini is Optional** | **PASS** | System functions seamlessly when `GEMINI_API_KEY` is missing or AI is toggled off. |
| **Hard Timeout Handled** | **PASS** | 5-second `Promise.race` timeout prevents checkout hanging. |
| **Invalid Output Handled** | **PASS** | JSON parsing guarded; bounded numeric ranges enforced; safe fallback on error. |
| **PII Minimized & Sanitized** | **PASS** | Phone numbers, emails, and street specifics redacted server-side before calling Gemini API. |
| **Prompt Injection Defense** | **PASS** | System boundaries enforce JSON schema and instruct model to ignore user commands in data. |
| **AI Role Accurately Represented** | **PASS** | Labeled as an advisory qualitative signal (5% weight), not a single point of failure. |

---

## 5. Testing & Verification

| Item | Status | Verification Evidence |
|---|:---:|---|
| **TypeScript / Vitest Tests** | **PASS** | 43 tests across 10 test files pass (`npm test`). |
| **Python Unit Tests** | **PASS** | 22 tests pass (`python -m unittest discover -s ml`). |
| **Security Attack Tests** | **PASS** | 7 automated attack tests pass (`tests/securityAuthoritative.test.ts`). |
| **Acceptance Criteria Tests** | **PASS** | Acceptance criteria tests pass (`tests/acceptanceCriteria.test.ts`). |
| **Feature Parity Tests** | **PASS** | Python and TypeScript feature vector parity verified (`tests/featureParity.test.ts`). |
| **Authoritative Counterfactual Tests** | **PASS** | Verified in `tests/counterfactualAuthoritative.test.ts`. |
| **Production Build** | **PASS** | `npm run build` succeeds cleanly with zero TypeScript errors. |

---

## 6. User Experience & Accessibility

| Item | Status | Verification Evidence |
|---|:---:|---|
| **Responsive Layout** | **PASS** | Usable across desktop and mobile screen sizes. |
| **Accessible UI & High Contrast** | **PASS** | Slate/neutral typography, semantic HTML, ARIA attributes. |
| **No Fake Live Telemetry Claims** | **PASS** | Labeled with clear `SIMULATION MODE`, `ESTIMATED`, and `DEMO SCENARIO` badges. |
| **Loading & Error States** | **PASS** | Non-blocking analysis pipelines, friendly error cards on payment failure. |

---

## 7. Documentation & Disclosures

| Item | Status | Verification Evidence |
|---|:---:|---|
| **Accurate README** | **PASS** | Updated to document authoritative checkout, HMAC tokens, 28 features, and metrics. |
| **Setup Instructions Work** | **PASS** | Documented installation, `.env.example`, running instructions, and testing commands. |
| **Limitations Documented** | **PASS** | Explicitly discloses synthetic data, non-live payment rails, and in-memory serving. |
| **Responsible AI Page** | **PASS** | Explains 7 signals, false positives/negatives, customer-safe language, and PII minimization. |

---

## 8. Razorpay Alignment

| Item | Status | Verification Evidence |
|---|:---:|---|
| **RTO Problem Clarity** | **PASS** | Clearly explains COD logistics costs, return rates, and capital lockup for Indian merchants. |
| **Checkout Layer Connection** | **PASS** | Models the decision intelligence layer that sits directly between buyer intent and payment gateway. |
| **Merchant Margin Value** | **PASS** | Demonstrates how fee nudges and targeted verification preserve margin without killing conversion. |
| **Customer Friction Reduction** | **PASS** | Legitimate buyers experience zero friction; no false fraud accusations. |
| **No False Integration Claims** | **PASS** | Transparently clarifies prototype status; no fake claims of live bank webhooks. |

---

## Overall Recommendation

**READY TO SUBMIT** (All P0, P1, and P2 criteria verified and passing).
