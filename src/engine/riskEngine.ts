import type { Customer } from '../types/customer';
import type { Order, OrderAddress } from '../types/order';
import type { NetworkNode, NetworkEdge } from '../types/network';
import type {
  RiskResult, RiskWeights, Evidence, RiskTier, SignalContributions, MerchantSettings,
} from '../types/risk';
import type { MLInferenceResult } from './mlService';
import { analyzeAddress } from './addressAnalyzer';
import { analyzeHistory } from './historyAnalyzer';
import { analyzeNetwork } from './networkAnalyzer';
import { analyzeVelocity } from './velocityAnalyzer';
import { analyzeBehavior } from './behaviorAnalyzer';
import { analyzeAbuseRing } from './abuseRingSentinel';
import { computeCustomerTrustPassport } from './trustEngine';
import { optimizeIntervention } from './interventionEngine';

const RISK_ENGINE_VERSION = 'RISK_ENGINE_V3';

let evaluationCounter = 0;

function generateEvaluationId(): string {
  evaluationCounter++;
  return `EVAL_${Date.now()}_${evaluationCounter}`;
}

export function evaluateRisk(
  address: OrderAddress,
  customer: Customer,
  deviceId: string,
  allCustomers: Customer[],
  allOrders: Order[],
  networkNodes: NetworkNode[],
  networkEdges: NetworkEdge[],
  settings: MerchantSettings,
  aiResult?: { available: boolean; risk: number; confidence: number; evidence: Evidence[] },
  mlResult?: MLInferenceResult
): RiskResult {
  const weights: RiskWeights = settings.weights;

  // Run core analyzers
  const addressResult = analyzeAddress(address);
  const historyResult = analyzeHistory(customer, allOrders);
  const networkResult = analyzeNetwork(customer, deviceId, allCustomers, allOrders, networkNodes, networkEdges);
  const velocityResult = analyzeVelocity(allOrders, deviceId);
  const behaviorResult = analyzeBehavior(customer, allOrders, allOrders);

  // Run Abuse-Ring Sentinel
  const ringResult = analyzeAbuseRing(
    customer,
    deviceId,
    address,
    allCustomers,
    allOrders,
    networkNodes,
    networkEdges
  );

  // AI signal
  const aiAvailable = aiResult?.available ?? false;
  const aiScore = aiAvailable ? aiResult!.risk : 25;

  // ML signal — SEPARATE from final score
  const mlAvailable = mlResult?.available ?? false;
  const mlScore = mlAvailable ? (mlResult!.rtoProbability * 100) : 25; // neutral when unavailable
  const mlRtoProbability = mlAvailable ? mlResult!.rtoProbability : 0.5;
  const mlModelVersion = mlResult?.modelVersion ?? 'UNAVAILABLE';
  const mlConfidence = mlResult?.confidence ?? 0;

  // Ensure weights have ml field (backward compat)
  const mlWeight = weights.ml ?? 0.20;
  const aiWeight = weights.ai ?? 0.05;

  // --- MULTI-SIGNAL SCORE CALCULATION (7 signals) ---
  const rawScore =
    addressResult.risk * (weights.address ?? 0.12) +
    historyResult.risk * (weights.history ?? 0.20) +
    (ringResult.ringDetected ? Math.max(networkResult.risk, ringResult.ringRiskScore) : networkResult.risk) * (weights.network ?? 0.20) +
    velocityResult.risk * (weights.velocity ?? 0.15) +
    behaviorResult.risk * (weights.behavior ?? 0.08) +
    mlScore * mlWeight +
    (aiAvailable ? aiScore : 25) * aiWeight;

  // Compound synergy for coordinated rings / clusters
  let computedScore = rawScore;
  if (ringResult.ringDetected && ringResult.ringRiskScore >= 75) {
    computedScore = Math.max(computedScore, ringResult.ringRiskScore * 0.85 + computedScore * 0.15);
  }

  const finalScore = Math.round(Math.min(100, Math.max(0, computedScore)));

  // --- CONTRIBUTIONS (transparent signal attribution) ---
  const contributions: SignalContributions = {
    address: Math.round(addressResult.risk * (weights.address ?? 0.12)),
    history: Math.round(historyResult.risk * (weights.history ?? 0.20)),
    network: Math.round((ringResult.ringDetected ? Math.max(networkResult.risk, ringResult.ringRiskScore) : networkResult.risk) * (weights.network ?? 0.20)),
    velocity: Math.round(velocityResult.risk * (weights.velocity ?? 0.15)),
    behavior: Math.round(behaviorResult.risk * (weights.behavior ?? 0.08)),
    ml: Math.round(mlScore * mlWeight),
    ai: Math.round((aiAvailable ? aiScore : 25) * aiWeight),
  };

  // --- 3-TIER RISK CLASSIFICATION ---
  let tier: RiskTier;
  const highThresh = settings.highThreshold ?? 70;
  const medThresh = settings.mediumThreshold ?? 30;

  if (finalScore > highThresh) {
    tier = 'HIGH';
  } else if (finalScore > medThresh) {
    tier = 'MEDIUM';
  } else {
    tier = 'LOW';
  }

  // --- CONFIDENCE (evidence quality) ---
  const confidenceFactors: number[] = [
    addressResult.confidence,
    historyResult.confidence,
    networkResult.confidence,
    velocityResult.confidence,
    behaviorResult.confidence,
  ];
  if (mlAvailable) {
    confidenceFactors.push(mlConfidence);
  } else {
    confidenceFactors.push(0.2);
  }
  if (aiAvailable && aiResult) {
    confidenceFactors.push(aiResult.confidence);
  } else {
    confidenceFactors.push(0.2);
  }

  const confWeights = [weights.address, weights.history, weights.network, weights.velocity, weights.behavior, mlWeight, aiWeight];
  let weightedConfidence = 0;
  for (let i = 0; i < confidenceFactors.length; i++) {
    weightedConfidence += confidenceFactors[i] * (confWeights[i] || 0.1);
  }
  const confidence = Math.min(1, Math.max(0.25, weightedConfidence));

  // --- AGGREGATE SIGNALS & EVIDENCE ---
  const allSignals = [
    ...addressResult.signals,
    ...historyResult.signals,
    ...networkResult.signals,
    ...velocityResult.signals,
    ...behaviorResult.signals,
    ...ringResult.signals,
  ];

  if (!mlAvailable) {
    allSignals.push('RTO ML model unavailable — deterministic signals active');
  }
  if (!aiAvailable) {
    allSignals.push('AI analysis unavailable — confidence reduced');
  }

  const allEvidence: Evidence[] = [];
  for (const e of addressResult.evidence) {
    allEvidence.push({ ...e, contribution: contributions.address });
  }
  for (const e of historyResult.evidence) {
    allEvidence.push({ ...e, contribution: contributions.history });
  }
  for (const e of networkResult.evidence) {
    allEvidence.push({ ...e, contribution: contributions.network });
  }
  for (const e of velocityResult.evidence) {
    allEvidence.push({ ...e, contribution: contributions.velocity });
  }
  for (const e of behaviorResult.evidence) {
    allEvidence.push({ ...e, contribution: contributions.behavior });
  }

  // ML evidence
  if (mlAvailable && mlResult) {
    allEvidence.push({
      type: 'ML_MODEL',
      signal: 'RTO_PREDICTION',
      value: mlRtoProbability,
      contribution: contributions.ml,
      explanation: `RTO ML model predicts ${(mlRtoProbability * 100).toFixed(0)}% probability of return`,
    });
  }

  // AI evidence
  if (aiAvailable && aiResult) {
    for (const e of aiResult.evidence) {
      allEvidence.push({ ...e, contribution: contributions.ai });
    }
  }

  // Derived explainable reasons from top contributing signals
  const reasons: string[] = allEvidence
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 5)
    .map((e) => e.explanation);

  const customerTrust = computeCustomerTrustPassport(customer, ringResult.ringDetected ? ringResult.clusterSize : 0);
  const intervention = optimizeIntervention(finalScore, tier, customerTrust, ringResult, settings, settings.interventionStrategy || 'balanced');

  return {
    score: finalScore,
    tier,
    confidence: parseFloat(confidence.toFixed(2)),
    rtoProbability: mlRtoProbability,
    mlModelVersion,
    mlConfidence: parseFloat(mlConfidence.toFixed(2)),
    mlAvailable,
    intentScore: Math.max(0, 100 - behaviorResult.risk),
    signals: allSignals,
    reasons,
    mlReasons: mlResult?.reasons,
    ringRisk: ringResult,
    customerTrust,
    intervention,
    contributions,
    evidence: allEvidence,
    evaluationId: generateEvaluationId(),
    timestamp: Date.now(),
    riskEngineVersion: RISK_ENGINE_VERSION,
    aiAvailable,
  };
}
