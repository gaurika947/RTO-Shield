export type RiskEventType =
  | 'ORDER_RECEIVED'
  | 'ADDRESS_ANALYZED'
  | 'HISTORY_ANALYZED'
  | 'NETWORK_ANALYZED'
  | 'VELOCITY_ANALYZED'
  | 'BEHAVIOR_ANALYZED'
  | 'AI_ANALYSIS_COMPLETE'
  | 'AI_ANALYSIS_FAILED'
  | 'RISK_CALCULATED'
  | 'DECISION_MADE'
  | 'CHECKOUT_MODIFIED'
  | 'ORDER_COMPLETED'
  | 'FEEDBACK_RECORDED'
  | 'OTP_VERIFIED'
  | 'OTP_FAILED';

export interface RiskEvent {
  id: string;
  timestamp: number;
  orderId?: string;
  evaluationId?: string;
  type: RiskEventType;
  riskContribution?: number;
  description: string;
  metadata?: Record<string, unknown>;
}
