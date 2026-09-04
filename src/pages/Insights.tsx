import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  TrendingUp,
  Network,
  Sliders,
} from 'lucide-react';

const INSIGHT_ITEMS = [
  {
    id: 'ins_1',
    title: 'RTO risk increased 11% in high-value COD orders.',
    description:
      'Orders exceeding ₹3,500 placed in postal codes 208001 & 208002 exhibit elevated delivery refusal rates over the last 24 hours. Automated verification threshold recommended.',
    type: 'TREND',
    icon: TrendingUp,
    badge: 'Urgent Pattern',
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
    actionText: 'View Analysis',
    navigateTo: '/risk-intelligence',
  },
  {
    id: 'ins_2',
    title: '3 customer clusters account for 27% of risky transactions.',
    description:
      'Coordinated multi-account syndicates sharing hardware device fingerprints (DEV_A01) and unnumbered address clusters represent ₹76.2K in cumulative RTO exposure.',
    type: 'SENTINEL',
    icon: Network,
    badge: 'Syndicate Alert',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    actionText: 'Investigate in Sentinel',
    navigateTo: '/abuse-sentinel',
  },
  {
    id: 'ins_3',
    title: 'Prepaid incentives reduce projected RTO with minimal conversion impact.',
    description:
      'Simulating a ₹50 instant UPI discount for orders above 65% risk score projects a ₹4.7L reduction in monthly return losses while preserving 92% checkout conversion.',
    type: 'POLICY',
    icon: Sliders,
    badge: 'Opportunity',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    actionText: 'Simulate Policy Impact',
    navigateTo: '/simulator',
  },
];

export default function Insights() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-16 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest block mb-1">
            AI Insights
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            What should I do next?
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Actionable intelligence synthesized by the ML defense coprocessor.
          </p>
        </div>
      </div>

      {/* Actionable Intelligence Feed Cards */}
      <div className="space-y-4">
        {INSIGHT_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${item.badgeColor}`}>
                  {item.badge}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {item.description}
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Confidence: 94.2%</span>
                <button
                  onClick={() => navigate(item.navigateTo)}
                  className="btn-primary py-1.5 px-4 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-xs"
                >
                  <span>{item.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
