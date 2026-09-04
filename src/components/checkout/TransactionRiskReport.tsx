import React from 'react';
import {
  Cpu,
  Network,
  History,
  Activity,
  MapPin,
  UserCheck,
  Sparkles,
  Layers,
} from 'lucide-react';
import type { RiskResult, DecisionResult } from '../../types/risk';
import type { DemoTransaction } from '../../data/demoTransactions';

interface Props {
  transaction: DemoTransaction;
  riskResult: RiskResult;
  decision: DecisionResult;
  aiExplanation?: string;
  aiLoading?: boolean;
}

export const TransactionRiskReport: React.FC<Props> = ({
  transaction,
  riskResult,
  decision,
  aiExplanation,
  aiLoading = false,
}) => {
  const policy = decision.paymentPolicy;
  const isHigh = policy.riskLevel === 'HIGH';
  const isMedium = policy.riskLevel === 'MEDIUM';
  const isLow = policy.riskLevel === 'LOW';

  const rtoPercent = Math.round((riskResult.rtoProbability ?? 0.5) * 100);
  const overallRisk = riskResult.score;

  // Extract raw or contribution signal scores
  const signalScores = {
    network: riskResult.ringRisk?.ringDetected
      ? Math.max(riskResult.contributions.network * 4, riskResult.ringRisk.ringRiskScore)
      : Math.min(100, Math.round(riskResult.contributions.network * 4.5)),
    history: Math.min(100, Math.round(riskResult.contributions.history * 4.5)),
    velocity: Math.min(100, Math.round(riskResult.contributions.velocity * 5.5)),
    address: Math.min(100, Math.round(riskResult.contributions.address * 7)),
    behavior: Math.min(100, Math.round(riskResult.contributions.behavior * 10)),
    rtoModel: rtoPercent,
    aiContext: aiLoading ? null : riskResult.aiAvailable ? Math.round(riskResult.contributions.ai * 16) : 25,
  };

  // Derive Top 3 Risk Drivers dynamically from real signals & evidence
  const candidateDrivers: { title: string; score: number; type: string }[] = [];

  if (transaction.deviceLinkedOrdersCount >= 3 || (riskResult.ringRisk?.ringDetected)) {
    candidateDrivers.push({
      title: `Device linked to ${transaction.deviceLinkedOrdersCount || riskResult.ringRisk?.clusterSize || 4} customer accounts`,
      score: 95,
      type: 'network',
    });
  }
  if (transaction.customer.totalOrders > 0 && (transaction.customer.rtoOrders / transaction.customer.totalOrders) >= 0.3) {
    const rate = Math.round((transaction.customer.rtoOrders / transaction.customer.totalOrders) * 100);
    candidateDrivers.push({
      title: `Elevated historical RTO rate (${rate}% of prior orders returned)`,
      score: 90,
      type: 'history',
    });
  }
  if (transaction.recentOrdersCount >= 4 || signalScores.velocity >= 40) {
    candidateDrivers.push({
      title: 'Recent COD velocity spike above baseline window',
      score: 85,
      type: 'velocity',
    });
  }
  if (transaction.address.line1.toLowerCase().includes('metro') || !/\d/.test(transaction.address.line1) || transaction.address.pincode === '842001') {
    candidateDrivers.push({
      title: `Weak or unnumbered address structure in zone ${transaction.address.pincode}`,
      score: 75,
      type: 'address',
    });
  }
  if (transaction.paymentMethod === 'COD' && transaction.orderAmount >= 2400) {
    candidateDrivers.push({
      title: `High-value COD order intent (₹${transaction.orderAmount.toLocaleString('en-IN')})`,
      score: 70,
      type: 'behavior',
    });
  }
  if (transaction.checkoutDuration && transaction.checkoutDuration < 30) {
    candidateDrivers.push({
      title: `Abnormally fast automated checkout session (${transaction.checkoutDuration}s)`,
      score: 65,
      type: 'behavior',
    });
  }

  // Fallbacks for genuine / low risk
  if (candidateDrivers.length === 0) {
    candidateDrivers.push(
      { title: 'Consistent delivery completion track record', score: 10, type: 'history' },
      { title: 'Isolated single-user verified device fingerprint', score: 5, type: 'network' },
      { title: 'Complete postal premise and landmark structure', score: 5, type: 'address' }
    );
  }

  const top3Drivers = candidateDrivers.slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Transaction Risk Assessment
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              TRANSACTION RISK REPORT
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
              ORDER #{transaction.orderNumber}
            </span>
          </div>
        </div>

        {/* Order Details Header Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-medium">Customer</span>
            <span className="font-semibold text-slate-800 text-sm">{transaction.customer.name}</span>
            <span className="text-slate-500 block">{transaction.address.city}, {transaction.address.state}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-medium">Order Value</span>
            <span className="font-bold text-slate-900 text-sm">₹{transaction.orderAmount.toLocaleString('en-IN')}</span>
            <span className="text-slate-500 block">{transaction.paymentMethod === 'COD' ? 'Cash on Delivery' : transaction.paymentMethod}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-medium">Evaluation Status</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Analyzed Successfully
            </span>
            <span className="text-slate-400 block font-mono text-[11px]">{riskResult.evaluationId}</span>
          </div>
        </div>
      </div>

      {/* Hero Dual Metrics: RTO PROBABILITY vs OVERALL RISK */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Metric 1: RTO Probability */}
        <div className={`p-6 rounded-xl border relative overflow-hidden ${
          isHigh
            ? 'bg-red-50/70 border-red-200'
            : isMedium
            ? 'bg-amber-50/70 border-amber-200'
            : 'bg-emerald-50/70 border-emerald-200'
        }`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                RTO Probability
              </span>
              <span className="text-xs text-slate-500">
                Machine Learning Raw Return Likelihood
              </span>
            </div>
            <span className={`px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider border ${
              isHigh
                ? 'bg-red-600 text-white border-red-700'
                : isMedium
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-emerald-600 text-white border-emerald-700'
            }`}>
              {policy.riskLevel} RISK
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-5xl font-black font-mono tracking-tight tabular-nums ${
              isHigh ? 'text-red-700' : isMedium ? 'text-amber-700' : 'text-emerald-700'
            }`}>
              {rtoPercent}%
            </span>
          </div>

          <div className="w-full bg-slate-200/80 h-2.5 rounded-full mt-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isHigh ? 'bg-red-600' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${rtoPercent}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Model: <strong className="font-mono text-slate-700">{riskResult.mlModelVersion || 'RTO-XGB-v1'}</strong></span>
            <span>Confidence: <strong className="text-slate-700">{Math.round((riskResult.mlConfidence || 0.88) * 100)}%</strong></span>
          </div>
        </div>

        {/* Metric 2: Overall RTO Sense Risk */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Overall RTO Sense Risk
                </span>
                <span className="text-xs text-slate-500">
                  Synthesized Multi-Signal Risk Score
                </span>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Scale 0–100
              </span>
            </div>

            <div className="mt-3 flex items-center gap-5">
              <div
                className={`relative h-24 w-24 shrink-0 rounded-full ${
                  overallRisk > 70 ? 'text-red-600' : overallRisk > 30 ? 'text-amber-600' : 'text-emerald-600'
                }`}
                style={{ background: `conic-gradient(currentColor 0 ${overallRisk}%, #e2e8f0 ${overallRisk}% 100%)` }}
              >
                <div className="absolute inset-[7px] flex flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-2xl font-black font-mono tracking-tight tabular-nums text-slate-900">{overallRisk}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">/ 100</span>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                <span className="block font-semibold text-slate-700">Deterministic policy score</span>
                <span className="mt-1 block leading-relaxed">Combines the evaluated network, history, velocity, address, behavior, and model signals.</span>
              </div>
            </div>

            <div className="w-full bg-slate-100 h-2.5 rounded-full mt-4 overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  overallRisk > 70 ? 'bg-red-500' : overallRisk > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${overallRisk}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
              <span>0 (Safe)</span>
              <span>30 (Low Max)</span>
              <span>70 (Med Max)</span>
              <span>100 (Critical)</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <strong>Key Distinction:</strong> RTO Probability ({rtoPercent}%) is the raw ML statistical likelihood. Overall Risk ({overallRisk}/100) incorporates address, network ring, velocity burst, and behavioral signals.
          </div>
        </div>
      </div>

      {/* Top 3 Risk Drivers */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Top Risk Drivers
          </h3>
        </div>

        <div className="space-y-2">
          {top3Drivers.map((driver, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[11px]">
                  {idx + 1}
                </span>
                <span className="font-semibold text-slate-800">{driver.title}</span>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-500 uppercase">
                {driver.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Signal Calculated Breakdown & Compact ML Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Signal Bars (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Calculated Signal Breakdown (7 Signals)
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Empirical Signal Attribution</span>
          </div>

          <div className="space-y-3">
            {/* 1. Network */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-red-500" />
                  NETWORK / CLUSTER
                </span>
                <span className="font-mono font-bold text-slate-800">{signalScores.network} / 100</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${signalScores.network}%` }} />
              </div>
            </div>

            {/* 2. History */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-violet-500" />
                  CUSTOMER HISTORY
                </span>
                <span className="font-mono font-bold text-slate-800">{signalScores.history} / 100</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: `${signalScores.history}%` }} />
              </div>
            </div>

            {/* 3. Velocity */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                  VELOCITY ANOMALY
                </span>
                <span className="font-mono font-bold text-slate-800">{signalScores.velocity} / 100</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${signalScores.velocity}%` }} />
              </div>
            </div>

            {/* 4. Address */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  ADDRESS INTELLIGENCE
                </span>
                <span className="font-mono font-bold text-slate-800">{signalScores.address} / 100</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${signalScores.address}%` }} />
              </div>
            </div>

            {/* 5. Behavior */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-500" />
                  BEHAVIORAL FRICTION
                </span>
                <span className="font-mono font-bold text-slate-800">{signalScores.behavior} / 100</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${signalScores.behavior}%` }} />
              </div>
            </div>

            {/* 6. RTO Model */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                  RTO MODEL PROBABILITY
                </span>
                <span className="font-mono font-bold text-slate-800">{signalScores.rtoModel}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${signalScores.rtoModel}%` }} />
              </div>
            </div>

            {/* 7. AI Context */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  AI CONTEXTUAL REASONING
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {aiLoading ? 'Analyzing...' : `${signalScores.aiContext ?? 25} / 100`}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${signalScores.aiContext ?? 25}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Compact ML Card (1 col) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                RTO Classification Model
              </h4>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg mb-4">
              <span className="text-[11px] text-slate-500 block">Predicted RTO probability</span>
              <span className="text-3xl font-black font-mono text-slate-900">{rtoPercent}%</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Model Architecture</span>
                <span className="font-mono font-semibold text-slate-800">{riskResult.mlModelVersion || 'RTO-XGB-v1'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Inference Engine</span>
                <span className="font-semibold text-slate-800">Singleton (In-Memory)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Inference Latency</span>
                <span className="font-mono font-semibold text-emerald-600">&lt; 15 ms</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Status</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  ✓ Active
                </span>
              </div>
            </div>
          </div>

          {/* AI Context Snippet if available */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded">
            <span className="font-bold text-slate-800 block mb-0.5">Contextual Reasoning:</span>
            {aiLoading ? (
              <span className="text-slate-400 italic">Synthesizing delivery zone and buyer context...</span>
            ) : aiExplanation ? (
              <span>{aiExplanation}</span>
            ) : (
              <span>Customer demonstrates typical COD transaction characteristics for this category.</span>
            )}
          </div>
        </div>
      </div>

      {/* Decision Engine Output & Dynamic Policy Card */}
      <div className={`p-5 rounded-xl border ${
        isHigh
          ? 'bg-rose-50 border-rose-200'
          : isMedium
          ? 'bg-amber-50 border-amber-200'
          : 'bg-emerald-50 border-emerald-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-current/10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Decision Engine Policy
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {isHigh && 'PREPAID ONLY — CASH ON DELIVERY RESTRICTED'}
              {isMedium && 'ADAPTIVE COD CONVENIENCE FEE APPLIED (+₹50)'}
              {isLow && 'FRICTIONLESS CHECKOUT — COD AVAILABLE AT ₹0 FEE'}
            </h3>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-white rounded border border-slate-200 shadow-sm text-slate-800">
            Policy: {policy.policyVersion}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
          <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
            <span className="font-semibold text-slate-700">UPI</span>
            <span className="font-bold text-emerald-600">Available ✓</span>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
            <span className="font-semibold text-slate-700">Credit / Debit Card</span>
            <span className="font-bold text-emerald-600">Available ✓</span>
          </div>
          <div className={`p-3 bg-white rounded-lg border ${
            isHigh ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
          } flex items-center justify-between`}>
            <span className="font-semibold text-slate-700">Cash on Delivery</span>
            {isHigh ? (
              <span className="font-bold text-rose-600">Unavailable ✕</span>
            ) : isMedium ? (
              <span className="font-bold text-amber-600">+₹50 Convenience Fee</span>
            ) : (
              <span className="font-bold text-emerald-600">₹0 Fee ✓</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
