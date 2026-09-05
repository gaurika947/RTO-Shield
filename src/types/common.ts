export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'MODERATE' | 'CRITICAL';

export type DecisionAction =
  | 'ALLOW_COD'
  | 'SOFT_VERIFICATION'
  | 'VERIFY_OR_PREPAID'
  | 'PREPAID_REQUIRED'
  | 'ALLOW_ALL'
  | 'SOFT_NUDGE'
  | 'PREPAID_ONLY';

export type PaymentMethod = 'UPI' | 'CARD' | 'COD';

export type OrderOutcome =
  | 'DELIVERED'
  | 'RTO'
  | 'CANCELLED'
  | 'PAYMENT_SUCCESS'
  | 'OTP_FAILED'
  | 'PENDING';

export type InterventionLevel =
  | 'LEVEL_0_NONE'
  | 'LEVEL_1_SOFT_NUDGE'
  | 'LEVEL_2_OTP_VERIFICATION'
  | 'LEVEL_3_VERIFY_AND_PREPAID_INCENTIVE'
  | 'LEVEL_4_PREPAID_REQUIRED';

export type InterventionStrategy = 'conversion_first' | 'balanced' | 'conservative';

export interface FeatureReason {
  feature: string;
  impact: 'high' | 'medium' | 'low' | 'positive';
  points: number;
  message: string;
}

export interface AbuseRingResult {
  ringRiskScore: number;
  ringDetected: boolean;
  clusterSize: number;
  signals: string[];
  whyCluster?: string[];
}

export interface MLPredictionResult {
  rtoProbability: number;
  riskScore: number;
  riskLevel: RiskTier;
  intentScore: number;
  recommendedAction: DecisionAction;
  reasons: FeatureReason[];
  ringRisk: AbuseRingResult;
  modelSource: 'artifact' | 'deterministic_fallback';
  featureSchemaVersion: string;
  artifactHash?: string;
  evaluationDataset?: string;
  inferenceLatencyMs?: number;
}

export interface CustomerTrustPassport {
  customerId: string;
  customerName: string;
  trustScore: number;                 // 0–100
  trustLevel: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW';
  successfulDeliveries: number;
  rtoOrders: number;
  totalOrders: number;
  deliverySuccessRate: number;        // e.g. 0.93 for 93%
  cancellationRate: number;
  averageOrderValue: number;
  accountAgeMonths: number;
  addressStabilityMonths: number;
  suspiciousNetworkLinks: number;
  behaviorScore: number;              // 0-100
  summary: string;
}

export interface InterventionResult {
  recommendedLevel: InterventionLevel;
  action: DecisionAction;
  frictionLevel: 'ZERO' | 'LOW' | 'MODERATE' | 'HIGH';
  title: string;
  customerMessage: string;
  merchantRationale: string;
  estimatedRiskImpact: {
    beforeScore: number;
    projectedScore: number;
    pointsReduction: number;
  };
  allowedPaymentMethods: PaymentMethod[];
  otpRequired: boolean;
  codFee: number;
  upiDiscount: number;
  strategy: InterventionStrategy;
  impactSource: 'business_simulation';
}

export interface CounterfactualToggleState {
  phoneVerification: boolean;
  prepaidPayment: boolean;
  verifiedAddress: boolean;
  removeSuspiciousNetwork: boolean;
}

export interface CounterfactualResult {
  currentRiskScore: number;
  currentRiskTier: RiskTier;
  currentRtoProbability?: number;
  projectedRiskScore: number;
  projectedRiskTier: RiskTier;
  projectedRtoProbability?: number;
  pointsReduction: number;
  direction?: 'DECREASE' | 'INCREASE' | 'NEUTRAL';
  toggles: CounterfactualToggleState;
  detailedDeltas: Array<{ factor: string; deltaPoints: number; active: boolean }>;
  modelSource?: 'artifact' | 'deterministic_fallback';
  modelVersion?: string;
  featureSchemaVersion?: string;
  artifactHash?: string;
}

export interface PolicySimulationInputs {
  codRiskThreshold: number;          // e.g. 40
  verificationThreshold: number;     // e.g. 55
  prepaidThreshold: number;          // e.g. 75
  prepaidIncentive: number;          // e.g. 50 (INR)
  codFee: number;                    // e.g. 49 (INR)
  verificationStrictness: 'LENIENT' | 'STANDARD' | 'STRICT';
  highRiskPincodeTreatment: 'PREPAID_ONLY' | 'STEP_UP_OTP' | 'STANDARD';
  trustOverrideEnabled: boolean;     // Downgrade friction for high-trust customers
}

export interface PolicySimulationMetrics {
  totalOrders: number;
  estimatedRTO: number;
  rtoRate: number;                   // percentage 0..100
  conversionRate: number;            // percentage 0..100
  estimatedLoss: number;             // in INR
  verifiedOrdersCount: number;
  prepaidConvertedCount: number;
}

export interface PolicySimulationResult {
  currentPolicy: PolicySimulationMetrics;
  simulatedPolicy: PolicySimulationMetrics;
  potentialExposureReduction: number; // in INR
  rtoRateDelta: number;               // e.g. -4.0%
  conversionDelta: number;            // e.g. -2.1%
  aiRecommendation: {
    title: string;
    suggestion: string;
    projectedRtoDrop: string;
    projectedConversionImpact: string;
    estimatedMonthlyLossReduction: string;
    recommendedSettings: Partial<PolicySimulationInputs>;
  };
}
