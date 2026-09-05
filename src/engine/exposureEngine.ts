import type { Order } from '../types/order';
import type { MerchantSettings } from '../types/risk';

export interface ExposureResult {
  orderValue: number;
  baselineProbability: number;
  baselineExposure: number;
  projectedProbability?: number;
  projectedExposure?: number;
  potentialReduction?: number;
}

export interface PortfolioExposure {
  ordersAssessed: number;
  highRiskOrders: number;
  interventions: number;
  expectedExposure: number;
  projectedExposure: number;
  potentialReduction: number;
  estimatedMerchantCost: number;
}

export function calculateExpectedRtoExposure(
  orderValue: number,
  baselineProbability: number,
  projectedProbability?: number,
): ExposureResult {
  const safeProbability = Math.min(1, Math.max(0, baselineProbability));
  const baselineExposure = orderValue * safeProbability;
  if (projectedProbability === undefined) {
    return { orderValue, baselineProbability: safeProbability, baselineExposure };
  }

  const projectedExposure = orderValue * Math.min(1, Math.max(0, projectedProbability));
  return {
    orderValue,
    baselineProbability: safeProbability,
    baselineExposure,
    projectedProbability,
    projectedExposure,
    potentialReduction: Math.max(0, baselineExposure - projectedExposure),
  };
}

export function calculatePortfolioExposure(orders: Order[], settings: MerchantSettings): PortfolioExposure {
  const analyzed = orders.filter((order) => order.rtoProbability !== undefined || order.riskScore !== undefined);
  const expectedExposure = analyzed.reduce((total, order) => total + calculateExpectedRtoExposure(order.amount, order.rtoProbability ?? (order.riskScore ?? 0) / 100).baselineExposure, 0);
  const highRiskOrders = analyzed.filter((order) => (order.riskScore ?? 0) >= settings.highThreshold).length;
  const interventions = analyzed.filter((order) => order.decision && !['ALLOW_COD', 'ALLOW_ALL'].includes(order.decision)).length;
  const estimatedMerchantCost = analyzed.reduce((total, order) => {
    const probability = order.rtoProbability ?? (order.riskScore ?? 0) / 100;
    const handling = (settings.averageRtoProcessingCost ?? 0) + (settings.averageReverseShippingCost ?? 0) + (settings.averageHandlingCost ?? 0);
    return total + probability * handling;
  }, 0);

  return {
    ordersAssessed: analyzed.length,
    highRiskOrders,
    interventions,
    expectedExposure,
    projectedExposure: expectedExposure,
    potentialReduction: 0,
    estimatedMerchantCost,
  };
}