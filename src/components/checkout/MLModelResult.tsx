import React from 'react';
import { Cpu, CheckCircle, AlertTriangle, Activity, Info } from 'lucide-react';
import type { RiskResult } from '../../types/risk';

interface Props {
  result: RiskResult;
}

export const MLModelResult: React.FC<Props> = ({ result }) => {
  const prob = result.rtoProbability ?? 0;
  const probPercent = Math.round(prob * 100);
  const confPercent = Math.round((result.mlConfidence ?? 0.85) * 100);
  const isHighRisk = prob >= 0.5;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-100">RTO Machine Learning Model</h4>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-950 text-blue-300 border border-blue-800">
                {result.mlModelVersion || 'RTO-XGB-v1'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Supervised gradient boosted return predictor (Signal 1 of 7)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {result.mlAvailable ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Inference Active
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
              <AlertTriangle className="w-3 h-3" />
              Fallback Model
            </span>
          )}
        </div>
      </div>

      {/* Probability vs Score Distinction Banner */}
      <div className="mb-4 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2 text-[11px] text-slate-400">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Probability ≠ Final Risk Score: </span>
          The ML model estimates raw return likelihood (<span className="text-blue-300 font-mono font-medium">{probPercent}%</span>). The final score combines this with 6 other deterministic signals (address, history, network, velocity, behavior, AI context).
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* ML Return Probability */}
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
          <div className="text-[11px] text-slate-400 mb-1">RTO Probability</div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${
              isHighRisk ? 'text-rose-400' : prob >= 0.3 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {prob.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-mono">({probPercent}%)</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ${
                isHighRisk ? 'bg-rose-500' : prob >= 0.3 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${probPercent}%` }}
            />
          </div>
        </div>

        {/* Model Confidence */}
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
          <div className="text-[11px] text-slate-400 mb-1">Model Confidence</div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-slate-100">{confPercent}%</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <Activity className="w-3 h-3 text-blue-400" />
            Empirical confidence interval
          </div>
        </div>

        {/* Intent Score */}
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
          <div className="text-[11px] text-slate-400 mb-1">Estimated Intent Index</div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold font-mono ${
              result.intentScore >= 70 ? 'text-emerald-400' : result.intentScore >= 40 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {result.intentScore ?? 50}
            </span>
            <span className="text-xs text-slate-400">/100</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-2">
            {result.intentScore >= 70 ? 'High delivery intent' : 'Tentative buyer intent'}
          </div>
        </div>
      </div>

      {/* Key Model Drivers / Explainability */}
      {result.mlReasons && result.mlReasons.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="text-xs font-semibold text-slate-300">Model Feature Attribution</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {result.mlReasons.slice(0, 4).map((r, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded bg-slate-950/50 border border-slate-800/60 text-xs">
                {r.impact === 'high' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-300 truncate">{r.feature}</span>
                    <span className={`font-mono ${r.points > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {r.points > 0 ? `+${r.points}` : r.points} pts
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{r.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
