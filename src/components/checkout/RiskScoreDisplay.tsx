import { useEffect, useState } from 'react';
import { Shield, TrendingDown, Cpu } from 'lucide-react';
import type { RiskResult } from '../../types/risk';

interface Props {
  result: RiskResult;
}

function getTierDisplay(tier: string): { label: string; color: string; bgColor: string; borderColor: string } {
  switch (tier) {
    case 'LOW':
      return { label: 'LOW RISK', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' };
    case 'MEDIUM':
    case 'MODERATE':
      return { label: 'MEDIUM RISK', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' };
    case 'HIGH':
    case 'CRITICAL':
      return { label: 'HIGH RISK', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
    default:
      return { label: tier, color: 'text-slate-700', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' };
  }
}

function getScoreColor(score: number): string {
  if (score < 30) return 'text-emerald-600';
  if (score < 70) return 'text-amber-600';
  return 'text-red-600';
}

function getBarColor(score: number): string {
  if (score < 30) return 'bg-emerald-500';
  if (score < 70) return 'bg-amber-500';
  return 'bg-red-500';
}

export function RiskScoreDisplay({ result }: Props) {
  const [displayedScore, setDisplayedScore] = useState(0);
  const tierDisplay = getTierDisplay(result.tier);

  // Animated score counter
  useEffect(() => {
    const target = result.score;
    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayedScore(Math.round(easeOut * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [result.score]);

  return (
    <div className="card animate-slide-up mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            RTO Shield Risk Score
          </h3>
          <div className="flex items-baseline gap-3">
            <span className={`text-4xl font-bold tabular-nums ${getScoreColor(result.score)}`}>
              {displayedScore}
            </span>
            <span className="text-sm text-slate-400 font-medium">/100</span>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${tierDisplay.bgColor} ${tierDisplay.color} border ${tierDisplay.borderColor}`}>
          {tierDisplay.label}
        </div>
      </div>

      {/* Score bar */}
      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out ${getBarColor(result.score)}`}
          style={{ width: `${result.score}%` }}
        />
        {/* Threshold markers */}
        <div className="absolute top-0 h-full w-px bg-slate-300" style={{ left: '30%' }} />
        <div className="absolute top-0 h-full w-px bg-slate-300" style={{ left: '70%' }} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-5">
        <span>0</span>
        <span>30 — Low</span>
        <span>70 — Medium</span>
        <span>100</span>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
          <Cpu className="w-3.5 h-3.5 text-blue-600" />
          <div>
            <p className="text-[10px] text-slate-500 font-medium">ML Probability</p>
            <p className="text-sm font-bold text-slate-800 tabular-nums">
              {result.mlAvailable
                ? `${(result.rtoProbability * 100).toFixed(1)}%`
                : '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
          <Shield className="w-3.5 h-3.5 text-slate-600" />
          <div>
            <p className="text-[10px] text-slate-500 font-medium">Signal completeness</p>
            <p className="text-sm font-bold text-slate-800 tabular-nums">
              {(result.confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
          <TrendingDown className="w-3.5 h-3.5 text-violet-600" />
          <div>
            <p className="text-[10px] text-slate-500 font-medium">Intent Score</p>
            <p className="text-sm font-bold text-slate-800 tabular-nums">
              {result.intentScore.toFixed(0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
