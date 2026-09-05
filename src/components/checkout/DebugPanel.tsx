import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Bug } from 'lucide-react';
import type { RiskResult, DecisionResult } from '../../types/risk';
import type { DemoTransaction } from '../../data/demoTransactions';
import { STANDARD_RISK_WEIGHTS } from '../../engine/riskPolicy';

interface Props {
  transaction?: DemoTransaction;
  riskResult?: RiskResult | null;
  decision?: DecisionResult | null;
}

export const DebugPanel: React.FC<Props> = ({
  transaction,
  riskResult,
  decision,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!transaction) return null;

  return (
    <div className="mt-8 border border-slate-300 bg-slate-900 text-slate-100 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-xs font-mono font-semibold bg-slate-950/80 hover:bg-slate-950 transition-colors border-b border-slate-800"
      >
        <div className="flex items-center gap-2">
          <Bug className="w-3.5 h-3.5 text-amber-400" />
          <span>DEVELOPER DIAGNOSTICS & FEATURE AUDIT</span>
          <span className="text-[10px] text-slate-500 font-normal">
            (Internal Inspection Panel — Raw Inputs & Weights)
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <span>{isOpen ? 'Collapse' : 'Expand'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 space-y-4 text-xs font-mono">
          {/* Section 1: Raw Transaction Features */}
          <div>
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
              1. Extracted Transaction Telemetry
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-3 rounded border border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-500 block">Order Amount:</span>
                <span className="text-slate-200 font-bold">₹{transaction.orderAmount}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Payment Method:</span>
                <span className="text-slate-200 font-bold">{transaction.paymentMethod}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Pincode:</span>
                <span className="text-slate-200 font-bold">{transaction.address.pincode}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Device Fingerprint:</span>
                <span className="text-slate-200 font-bold">{transaction.deviceId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Historical Orders:</span>
                <span className="text-slate-200 font-bold">{transaction.customer.totalOrders}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Historical RTOs:</span>
                <span className="text-slate-200 font-bold">{transaction.customer.rtoOrders}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Linked Devices:</span>
                <span className="text-slate-200 font-bold">{transaction.deviceLinkedOrdersCount}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Checkout Duration:</span>
                <span className="text-slate-200 font-bold">{transaction.checkoutDuration || 45}s</span>
              </div>
            </div>
          </div>

          {/* Section 2: ML Model Prediction */}
          <div>
            <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
              2. ML Classifier Output (RTO Shield GBDT v1)
            </div>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Predicted RTO Prob:</span>
                <span className="text-indigo-400 font-bold">
                  {riskResult ? `${(riskResult.rtoProbability * 100).toFixed(1)}%` : 'Pending'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Probability label:</span>
                <span className="text-slate-200 font-bold">
                  Predicted RTO Probability
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Model Version:</span>
                <span className="text-slate-200 font-bold">{riskResult?.mlModelVersion || 'RTO Shield GBDT v1'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Model Status:</span>
                <span className="text-emerald-400 font-bold">Singleton (In-Memory)</span>
              </div>
            </div>
          </div>

          {/* Section 3: Signal Contributions and Weights */}
          <div>
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
              3. 7-Signal Weights & Attribution
            </div>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5 text-[11px]">
              <div className="grid grid-cols-4 font-bold text-slate-400 border-b border-slate-800 pb-1">
                <span>Signal</span>
                <span>Configured Weight</span>
                <span>Calculated Score</span>
                <span>Weighted Points</span>
              </div>
              <div className="grid grid-cols-4 text-slate-300">
                <span>ML Model</span>
                <span>{(STANDARD_RISK_WEIGHTS.ml * 100)}%</span>
                <span>{riskResult ? Math.round(riskResult.rtoProbability * 100) : '-'}</span>
                <span className="text-emerald-400">+{riskResult?.contributions.ml ?? 0}</span>
              </div>
              <div className="grid grid-cols-4 text-slate-300">
                <span>Customer History</span>
                <span>{(STANDARD_RISK_WEIGHTS.history * 100)}%</span>
                <span>{riskResult ? Math.round(riskResult.contributions.history * 5) : '-'}</span>
                <span className="text-emerald-400">+{riskResult?.contributions.history ?? 0}</span>
              </div>
              <div className="grid grid-cols-4 text-slate-300">
                <span>Network / Ring</span>
                <span>{(STANDARD_RISK_WEIGHTS.network * 100)}%</span>
                <span>{riskResult ? Math.round(riskResult.contributions.network * 5) : '-'}</span>
                <span className="text-emerald-400">+{riskResult?.contributions.network ?? 0}</span>
              </div>
              <div className="grid grid-cols-4 text-slate-300">
                <span>Velocity</span>
                <span>{(STANDARD_RISK_WEIGHTS.velocity * 100)}%</span>
                <span>{riskResult ? Math.round(riskResult.contributions.velocity * 6.5) : '-'}</span>
                <span className="text-emerald-400">+{riskResult?.contributions.velocity ?? 0}</span>
              </div>
              <div className="grid grid-cols-4 text-slate-300">
                <span>Address</span>
                <span>{(STANDARD_RISK_WEIGHTS.address * 100)}%</span>
                <span>{riskResult ? Math.round(riskResult.contributions.address * 8) : '-'}</span>
                <span className="text-emerald-400">+{riskResult?.contributions.address ?? 0}</span>
              </div>
              <div className="grid grid-cols-4 text-slate-300">
                <span>Behavior</span>
                <span>{(STANDARD_RISK_WEIGHTS.behavior * 100)}%</span>
                <span>{riskResult ? Math.round(riskResult.contributions.behavior * 12) : '-'}</span>
                <span className="text-emerald-400">+{riskResult?.contributions.behavior ?? 0}</span>
              </div>
              <div className="grid grid-cols-4 text-slate-300">
                <span>AI Context</span>
                <span>{(STANDARD_RISK_WEIGHTS.ai * 100)}%</span>
                <span>{riskResult?.aiAvailable ? 'Active' : 'Neutral'}</span>
                <span className="text-emerald-400">+{riskResult?.contributions.ai ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Final Decision & Policy Mapping */}
          <div>
            <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-1">
              4. Decision Engine & Payment Policy Enforcement
            </div>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Overall Risk Score:</span>
                <span className="text-slate-100 font-bold">{riskResult?.score ?? '-'}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Classified Risk Tier:</span>
                <span className="text-amber-400 font-bold">{riskResult?.tier ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Policy Output:</span>
                <span className="text-slate-200">
                  {decision?.paymentPolicy.riskLevel} (COD Available: {String(decision?.paymentPolicy.codAvailable)}, Fee: ₹{decision?.paymentPolicy.codFee})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Server Policy Verification:</span>
                <span className="text-emerald-400">POST /api/checkout/validate-payment</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
