import React from 'react';
import {
  CheckCircle2,
  PackageCheck,
  RotateCcw,
  ShieldAlert,
  ClipboardList,
  Cpu
} from 'lucide-react';
import type { RiskResult, DecisionResult } from '../../types/risk';
import type { PaymentMethod, OrderOutcome as OutcomeType } from '../../types/order';

interface Props {
  orderNumber: string;
  customerName: string;
  paymentMethod: PaymentMethod;
  finalAmount: number;
  riskResult: RiskResult;
  decision: DecisionResult;
  onSimulateOutcome: (outcome: OutcomeType) => void;
  onReset: () => void;
}

export const OrderOutcome: React.FC<Props> = ({
  orderNumber,
  customerName,
  paymentMethod,
  finalAmount,
  riskResult,
  decision,
  onSimulateOutcome,
  onReset,
}) => {
  const rtoPercent = Math.round((riskResult.rtoProbability ?? 0.5) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-fade-in space-y-6">
      <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
            Checkout Complete
          </span>
          <h3 className="text-xl font-bold text-slate-900">ORDER PROCESSED</h3>
        </div>
      </div>

      {/* Structured Order Processed Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
        <div>
          <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-medium">Transaction</span>
          <span className="font-mono font-bold text-slate-900 text-sm">#{orderNumber}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-medium">Risk Score</span>
          <span className="font-mono font-bold text-slate-900 text-sm">{riskResult.score} / 100</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-medium">RTO Probability</span>
          <span className="font-mono font-bold text-indigo-600 text-sm">{rtoPercent}%</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-medium">Decision</span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {decision.paymentPolicy.riskLevel === 'HIGH' ? 'PREPAID ONLY' : decision.paymentPolicy.riskLevel === 'MEDIUM' ? 'ADAPTIVE COD' : 'STANDARD'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-medium">Payment</span>
          <span className="font-bold text-slate-900 text-sm">{paymentMethod}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-medium">Amount</span>
          <span className="font-mono font-black text-slate-900 text-sm">₹{finalAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Immutable Audit Log Record */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800 pb-1 border-b border-slate-100">
            <ClipboardList className="w-4 h-4 text-indigo-600" />
            <span>Telemetry & Audit Record</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
            <div>
              <span className="text-slate-400 block">Evaluation ID:</span>
              <span className="font-mono text-slate-800 truncate block">{riskResult.evaluationId}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Customer:</span>
              <span className="font-semibold text-slate-800 block">{customerName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Policy Rule:</span>
              <span className="font-mono text-slate-800 block">{decision.paymentPolicy.policyVersion}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Audit Log Status:</span>
              <span className="text-emerald-600 font-semibold block">Recorded ✓</span>
            </div>
          </div>
        </div>

        {/* Closed-loop Delivery Feedback */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-2 text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-800 pb-1 border-b border-slate-100">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>Closed-Loop Delivery Outcome Simulator</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Simulate final carrier delivery status to update model confusion matrix and customer trust history.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => onSimulateOutcome('DELIVERED')}
              className="py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mark Delivered</span>
            </button>
            <button
              onClick={() => onSimulateOutcome('RTO')}
              className="py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Mark RTO (Returned)</span>
            </button>
          </div>
        </div>
      </div>

      {/* CTA Button: ANALYZE ANOTHER TRANSACTION */}
      <div className="flex justify-end pt-2 border-t border-slate-100">
        <button
          onClick={onReset}
          className="py-2.5 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors uppercase tracking-wider"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Analyze Another Transaction</span>
        </button>
      </div>
    </div>
  );
};
