import type { SignalContributions } from '../../types/risk';

interface Props {
  contributions: SignalContributions;
}

const SIGNAL_META: Record<keyof SignalContributions, { label: string; color: string }> = {
  address: { label: 'Address Intelligence', color: 'bg-blue-500' },
  history: { label: 'Customer History', color: 'bg-violet-500' },
  network: { label: 'Network / Abuse Ring', color: 'bg-red-500' },
  velocity: { label: 'Velocity Monitor', color: 'bg-amber-500' },
  behavior: { label: 'Behavioral Signals', color: 'bg-cyan-500' },
  ml: { label: 'RTO ML Model', color: 'bg-indigo-500' },
  ai: { label: 'AI Contextual', color: 'bg-emerald-500' },
};

export function SignalBreakdown({ contributions }: Props) {
  const total = Object.values(contributions).reduce((sum, v) => sum + v, 0);
  const sorted = (Object.entries(contributions) as [keyof SignalContributions, number][])
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="card animate-slide-up mb-6">
      <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">
        Signal Contributions
      </h3>
      <div className="space-y-3">
        {sorted.map(([key, value]) => {
          const meta = SIGNAL_META[key];
          const pct = total > 0 ? (value / total) * 100 : 0;

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-700">{meta.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 tabular-nums">+{value}</span>
                  <span className="text-[10px] text-slate-400 tabular-nums w-8 text-right">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${meta.color}`}
                  style={{ width: `${Math.min(100, (value / Math.max(total, 1)) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Horizontal composition bar */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Risk Composition
        </p>
        <div className="h-3 flex rounded-full overflow-hidden bg-slate-100">
          {sorted.map(([key, value]) => {
            const meta = SIGNAL_META[key];
            const pct = total > 0 ? (value / total) * 100 : 0;
            if (pct < 1) return null;
            return (
              <div
                key={key}
                className={`${meta.color} transition-all duration-700 first:rounded-l-full last:rounded-r-full`}
                style={{ width: `${pct}%` }}
                title={`${meta.label}: ${pct.toFixed(1)}%`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          {sorted.filter(([, v]) => v > 0).map(([key]) => {
            const meta = SIGNAL_META[key];
            return (
              <span key={key} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span className={`w-2 h-2 rounded-full ${meta.color}`} />
                {meta.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
