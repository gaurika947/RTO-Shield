import React from 'react';
import { CheckCircle2, Loader2, Sparkles, Cpu } from 'lucide-react';

export interface PipelineStepInfo {
  key: string;
  name: string;
  detail: string;
}

interface Props {
  stages: PipelineStepInfo[];
  currentStepIndex: number;
  completedSteps: string[];
  isEvaluating?: boolean;
}

export const AnalysisAnimation: React.FC<Props> = ({
  stages,
  currentStepIndex,
  completedSteps,
  isEvaluating = false,
}) => {
  if (!isEvaluating && completedSteps.length === 0) return null;

  const allDone = completedSteps.length >= stages.length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl animate-fade-in text-slate-100 max-w-2xl mx-auto my-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Cpu className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 tracking-wider uppercase">
              ANALYZING TRANSACTION
            </h3>
            <p className="text-[11px] text-slate-400">
              Evaluating multi-signal risk factors and executing RTO model inference
            </p>
          </div>
        </div>
        {isEvaluating && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px] font-mono animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            IN PROGRESS
          </span>
        )}
      </div>

      <div className="space-y-2.5 mt-5">
        {stages.map((stage, i) => {
          const isCompleted = completedSteps.includes(stage.key);
          const isCurrent = i === currentStepIndex;

          return (
            <div
              key={stage.key}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border transition-all duration-200 ${
                isCompleted
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : isCurrent
                  ? 'bg-indigo-950/50 border-indigo-600/70 text-indigo-200 ring-1 ring-indigo-500/30'
                  : 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-700" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-semibold">
                    {stage.name}
                  </span>
                  {isCurrent && (
                    <p className="text-[10px] text-indigo-300 mt-0.5 truncate font-mono">
                      {stage.detail}
                    </p>
                  )}
                </div>
              </div>

              {isCompleted ? (
                <span className="text-xs font-mono font-bold text-emerald-400">✓ Done</span>
              ) : isCurrent ? (
                <span className="text-[10px] font-mono text-indigo-400 animate-pulse">Active</span>
              ) : null}
            </div>
          );
        })}
      </div>

      {isEvaluating && !allDone && (
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-center gap-2 text-xs font-mono font-semibold text-amber-400 tracking-wider animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>CALCULATING RISK...</span>
        </div>
      )}
    </div>
  );
};
