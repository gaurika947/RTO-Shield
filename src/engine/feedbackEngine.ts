import type { RiskTier, FeedbackClassification, FeedbackRecord, ModelMetrics } from '../types/risk';
import type { OrderOutcome } from '../types/order';

/**
 * Feedback Engine
 *
 * Mathematical definitions:
 *   Positive prediction = HIGH risk tier
 *   Positive actual     = RTO outcome
 *
 *   TP = HIGH + RTO
 *   FP = HIGH + DELIVERED
 *   TN = LOW/MEDIUM + DELIVERED
 *   FN = LOW/MEDIUM + RTO
 *
 * Metrics are computed from actual synthetic labeled transactions.
 * NOT fabricated. If <5 observations, returns { sufficient: false }.
 */

export function classifyOutcome(
  predictedTier: RiskTier,
  actualOutcome: OrderOutcome
): FeedbackClassification | null {
  // Only classify completed orders (DELIVERED or RTO)
  if (actualOutcome !== 'DELIVERED' && actualOutcome !== 'RTO') {
    return null;
  }

  const predictedPositive = predictedTier === 'HIGH';
  const actualPositive = actualOutcome === 'RTO';

  if (predictedPositive && actualPositive) return 'TRUE_POSITIVE';
  if (predictedPositive && !actualPositive) return 'FALSE_POSITIVE';
  if (!predictedPositive && !actualPositive) return 'TRUE_NEGATIVE';
  if (!predictedPositive && actualPositive) return 'FALSE_NEGATIVE';

  return null;
}

export function computeMetrics(feedbackRecords: FeedbackRecord[]): ModelMetrics {
  const MIN_OBSERVATIONS = 5;

  let tp = 0, fp = 0, tn = 0, fn = 0;

  for (const r of feedbackRecords) {
    switch (r.classification) {
      case 'TRUE_POSITIVE': tp++; break;
      case 'FALSE_POSITIVE': fp++; break;
      case 'TRUE_NEGATIVE': tn++; break;
      case 'FALSE_NEGATIVE': fn++; break;
    }
  }

  const total = tp + fp + tn + fn;

  if (total < MIN_OBSERVATIONS) {
    return {
      tp, fp, tn, fn,
      precision: null,
      recall: null,
      f1: null,
      fpr: null,
      sufficient: false,
      totalObservations: total,
    };
  }

  const precision = (tp + fp) > 0 ? tp / (tp + fp) : null;
  const recall = (tp + fn) > 0 ? tp / (tp + fn) : null;
  const f1 = (precision !== null && recall !== null && (precision + recall) > 0)
    ? 2 * (precision * recall) / (precision + recall)
    : null;
  const fpr = (fp + tn) > 0 ? fp / (fp + tn) : null;

  return {
    tp, fp, tn, fn,
    precision: precision !== null ? parseFloat(precision.toFixed(3)) : null,
    recall: recall !== null ? parseFloat(recall.toFixed(3)) : null,
    f1: f1 !== null ? parseFloat(f1.toFixed(3)) : null,
    fpr: fpr !== null ? parseFloat(fpr.toFixed(3)) : null,
    sufficient: true,
    totalObservations: total,
  };
}
