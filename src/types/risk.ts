import type {
  PaymentMethod,
  OrderOutcome,
  RiskTier,
  DecisionAction,
  FeatureReason,
  AbuseRingResult,
  MLPredictionResult,
  CustomerTrustPassport,
  InterventionResult,
  CounterfactualResult,
  PolicySimulationResult,
  InterventionStrategy,
} from './common';

export type {
  RiskTier,
  DecisionAction,
  FeatureReason,
  AbuseRingResult,
  MLPredictionResult,
  CustomerTrustPassport,
  InterventionResult,
  CounterfactualResult,
  PolicySimulationResult,
  InterventionStrategy,
};

// --- Evidence (traceable from actual calculations) ---
export interface Evidence {
  type: 'ADDRESS' | 'HISTORY' | 'NETWORK' | 'VELOCITY' | 'BEHAVIOR' | 'AI' | 'ML_MODEL';
  signal: string;
  value: number | string;
  contribution: number;  // weighted points added to final score
  explanation: string;   // derived from actual calculation, NOT arbitrary
}

// --- Individual Analyzer Result ---
export interface AnalyzerResult {
  risk: number;          // 0–100 normalized
  confidence: number;    // 0–1, evidence quality for this signal
  signals: string[];
  evidence: Evidence[];
}

// --- Address Analyzer (extended) ---
export interface AddressAnalyzerResult extends AnalyzerResult {
  quality: number;       // 0–100, address completeness
}

// --- AI Analyzer Result ---
export interface AIAnalyzerResult {
  available: boolean;
  addressQuality: number;
  intentRisk: number;
  behaviorIndicators: string[];
  riskExplanation: string;
  confidence: number;    // 0–1
  risk: number;          // 0–100 normalized
  evidence: Evidence[];
}

// --- Signal Contributions ---
export interface SignalContributions {
  address: number;
  history: number;
  network: number;
  velocity: number;
  behavior: number;
  ml: number;
  ai: number;
}

// --- Final Risk Result (from Risk Engine) ---
export interface RiskResult {
  score: number;         // 0–100 integer
  tier: RiskTier;
  confidence: number;    // 0–1, overall evidence quality (SEPARATE from score)
  rtoProbability: number; // 0.00 to 1.00 from ML Model — SEPARATE from score
  mlModelVersion: string; // e.g. 'RTO-XGB-v1'
  mlConfidence: number;  // 0–1, model confidence
  mlAvailable: boolean;  // whether ML inference succeeded
  intentScore: number;   // 0 to 100 derived behavioral score
  signals: string[];
  reasons: string[];
  mlReasons?: FeatureReason[];
  ringRisk?: AbuseRingResult;
  customerTrust?: CustomerTrustPassport;
  intervention?: InterventionResult;
  contributions: SignalContributions;
  evidence: Evidence[];
  evaluationId: string;
  timestamp: number;
  riskEngineVersion: string;
  aiAvailable: boolean;
}

import type { PaymentPolicy } from '../engine/paymentPolicy';
export type { PaymentPolicy };

export interface CachedAnalysis {
  transactionId: string;
  orderNumber: string;
  customerName: string;
  orderAmount: number;
  rtoProbability: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  signalScores: Record<string, number>;
  riskResult: RiskResult;
  decision: DecisionResult;
  paymentPolicy: PaymentPolicy;
  modelVersion: string;
  timestamp: number;
  aiExplanation?: string;
}

// --- Decision Result (from Decision Engine) ---
export interface DecisionResult {
  action: DecisionAction;
  paymentMethods: PaymentMethod[];
  paymentPolicy: PaymentPolicy;
  otpRequired: boolean;
  codFee: number;
  upiDiscount: number;
  nudgeMessages: string[];
  policyVersion: string;
  interventionLevel?: string;
}

// --- Audit Record ---
export interface AuditRecord {
  id: string;
  orderId?: string;
  evaluationId: string;
  timestamp: number;
  riskScore: number;
  riskTier: RiskTier;
  confidence: number;
  rtoProbability?: number;
  intentScore?: number;
  customerTrustScore?: number;
  riskEngineVersion: string;
  policyVersion: string;
  paymentPolicy?: PaymentPolicy;
  signalContributions: SignalContributions;
  evidence: Evidence[];
  decision: DecisionAction;
  paymentMethods: PaymentMethod[];
  outcome?: OrderOutcome;
  aiAvailable: boolean;
  ringRisk?: AbuseRingResult;
  intervention?: InterventionResult;
}

// --- Feedback Classification ---
export type FeedbackClassification =
  | 'TRUE_POSITIVE'   // HIGH/CRITICAL + RTO
  | 'FALSE_POSITIVE'  // HIGH/CRITICAL + DELIVERED
  | 'TRUE_NEGATIVE'   // LOW/MODERATE + DELIVERED
  | 'FALSE_NEGATIVE'; // LOW/MODERATE + RTO

export interface FeedbackRecord {
  id: string;
  orderId: string;
  evaluationId: string;
  predictedScore: number;
  predictedTier: RiskTier;
  actualOutcome: OrderOutcome;
  classification: FeedbackClassification;
  timestamp: number;
}

// --- Model Metrics ---
export interface ModelMetrics {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  precision: number | null;
  recall: number | null;
  f1: number | null;
  fpr: number | null;
  roc_auc?: number | null;
  sufficient: boolean;
  totalObservations: number;
}

// --- Risk Weights ---
export interface RiskWeights {
  address: number;   // 0.12
  history: number;   // 0.23
  network: number;   // 0.23
  velocity: number;  // 0.14
  behavior: number;  // 0.08
  ml: number;        // 0.10 — RTO ML prediction
  ai: number;        // 0.10 — Gemini contextual
}

// --- Merchant Settings ---
export interface MerchantSettings {
  mediumThreshold: number;    // default 25 (MODERATE)
  highThreshold: number;      // default 50 (HIGH)
  criticalThreshold?: number; // default 75 (CRITICAL)
  codFee: number;             // default 49
  upiDiscount: number;        // default 50
  otpRequired: boolean;       // default true for MODERATE/HIGH
  weights: RiskWeights;
  riskEngineVersion: string;  // RISK_ENGINE_V2_ML
  policyVersion: string;      // POLICY_V2
  policyCounter: number;      // increments on any policy change
  aiEnabled: boolean;         // true = live Gemini, false = simulate unavailable
  interventionStrategy?: InterventionStrategy; // 'conversion_first' | 'balanced' | 'conservative'
  averageForwardShippingCost?: number;
  averageReverseShippingCost?: number;
  averageRtoProcessingCost?: number;
  averageHandlingCost?: number;
}
