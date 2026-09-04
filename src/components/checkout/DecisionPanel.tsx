import React from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sliders,
  Users
} from 'lucide-react';
import type { DecisionResult, RiskResult } from '../../types/risk';

interface Props {
  decision: DecisionResult;
  riskResult: RiskResult;
}

export const DecisionPanel: React.FC<Props> = ({ decision, riskResult }) => {
  const policy = decision.paymentPolicy;
  const isLow = policy.riskLevel === 'LOW';
  const isMedium = policy.riskLevel === 'MEDIUM';
  const isHigh = policy.riskLevel === 'HIGH';

  const rtoPercent = Math.round(riskResult.rtoProbability * 100);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
              RTO Risk Assessment & Policy Output
            </h4>
            <p className="text-[11px] text-slate-400">
              Decision Engine translation of ML probability to payment gating
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          {policy.policyVersion}
        </span>
      </div>

      {/* Decision Summary Card */}
      <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
        isLow
          ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
          : isMedium
          ? 'bg-amber-950/40 border-amber-800/80 text-amber-300'
          : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
      }`}>
        <div className="shrink-0 mt-0.5">
          {isLow && <CheckCircle className="w-6 h-6 text-emerald-400" />}
          {isMedium && <AlertTriangle className="w-6 h-6 text-amber-400" />}
          {isHigh && <XCircle className="w-6 h-6 text-rose-400" />}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-bold tracking-wide">
              {isLow && 'LOW RISK — FRICTIONLESS CHECKOUT'}
              {isMedium && 'MEDIUM RISK — ADAPTIVE CHECKOUT APPLIED'}
              {isHigh && 'HIGH RISK — ADAPTIVE CHECKOUT APPLIED'}
            </h5>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900/80 border border-current">
              {policy.riskLevel} RISK
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-current/20 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">RTO Probability:</span>
              <span className="font-mono font-bold text-sm text-slate-100">{rtoPercent}%</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Payment Protection:</span>
              <span className="font-semibold text-slate-200">
                {isLow ? 'Standard checkout' : isMedium ? 'Adaptive checkout (+₹50 COD fee)' : 'COD disabled (Prepaid only)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AVAILABLE PAYMENT METHODS SECTION */}
      <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2.5">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Available Payment Methods</span>
          <span className="text-[10px] font-normal text-slate-400">Dynamically controlled by Decision Engine</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {/* UPI */}
          <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800 flex items-center gap-2 text-emerald-400">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <div>
              <div className="font-semibold text-slate-200">UPI</div>
              <div className="text-[10px] text-slate-400">No additional fee</div>
            </div>
          </div>

          {/* Card */}
          <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800 flex items-center gap-2 text-emerald-400">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <div>
              <div className="font-semibold text-slate-200">Credit / Debit Card</div>
              <div className="text-[10px] text-slate-400">No additional fee</div>
            </div>
          </div>

          {/* COD */}
          {policy.codAvailable ? (
            <div className={`p-2.5 rounded border flex items-center gap-2 ${
              isMedium
                ? 'bg-amber-950/30 border-amber-800/80 text-amber-300'
                : 'bg-slate-900/90 border-slate-800 text-emerald-400'
            }`}>
              <CheckCircle className="w-4 h-4 shrink-0" />
              <div>
                <div className="font-semibold text-slate-200">Cash on Delivery</div>
                <div className="text-[10px] font-mono">
                  {isMedium ? '+ ₹50 convenience fee' : '₹0 fee'}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded bg-rose-950/30 border border-rose-800/60 flex items-center gap-2 text-rose-300">
              <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <div>
                <div className="font-semibold text-slate-300 line-through">Cash on Delivery</div>
                <div className="text-[10px] text-rose-400">Unavailable for this transaction</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Abuse Ring Sentinel Notice */}
      {riskResult.ringRisk && riskResult.ringRisk.ringDetected && (
        <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 flex items-start gap-2.5 text-xs text-rose-300">
          <Users className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-rose-200">Abuse-Ring Sentinel Alert: </span>
            Identified as high-risk node in coordinated syndicate cluster (Score: {riskResult.ringRisk.ringRiskScore}, Cluster Size: {riskResult.ringRisk.clusterSize}).
          </div>
        </div>
      )}
    </div>
  );
};
