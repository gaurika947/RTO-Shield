import React from 'react';
import { Sparkles, ShieldAlert } from 'lucide-react';
import type { RiskResult } from '../../types/risk';

interface Props {
  result: RiskResult;
  aiExplanation?: string;
  aiAvailable?: boolean;
}

export const AIContextPanel: React.FC<Props> = ({
  result,
  aiExplanation,
  aiAvailable = true,
}) => {
  const explanation = aiExplanation || (
    result.reasons && result.reasons.length > 0
      ? result.reasons.join('. ')
      : 'Comprehensive multi-signal telemetry indicates normal transaction patterns with standard verification.'
  );

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-100">AI Contextual Intent Synthesis</h4>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-950 text-indigo-300 border border-indigo-800">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Contextual address nuance & buyer intent reasoning (Signal 7 of 7)
            </p>
          </div>
        </div>

        <div>
          {aiAvailable ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded">
              <Sparkles className="w-3 h-3" />
              LLM Analysis Online
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
              Deterministic Baseline Active
            </span>
          )}
        </div>
      </div>

      {/* Main explanation */}
      <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/90 mb-3">
        <div className="text-xs text-slate-300 leading-relaxed">
          {explanation}
        </div>
      </div>

      {/* Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2 p-2 rounded bg-slate-950/50 border border-slate-800/60">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-slate-400">Address Clarity:</span>
          <span className="text-slate-200 font-medium">
            {result.contributions.address < 5 ? 'High Precision' : 'Standard / Incomplete Landmark'}
          </span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded bg-slate-950/50 border border-slate-800/60">
          <div className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-slate-400">Intent Archetype:</span>
          <span className="text-slate-200 font-medium">
            {result.tier === 'LOW' ? 'High Intent Buyer' : result.tier === 'MEDIUM' ? 'Cautious / COD Hesitant' : 'High Abuse Likelihood'}
          </span>
        </div>
      </div>

      {/* Governance & Disclaimer */}
      <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
          <span>Strict boundary: AI input weight capped at 10% under Responsible AI policy.</span>
        </div>
      </div>
    </div>
  );
};
