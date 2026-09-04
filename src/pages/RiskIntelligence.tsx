import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingDown } from 'lucide-react';

const TREND_DATA = [
  { time: '00:00', rtoRate: 14.2, orders: 120 },
  { time: '04:00', rtoRate: 13.8, orders: 45 },
  { time: '08:00', rtoRate: 14.5, orders: 340 },
  { time: '12:00', rtoRate: 15.9, orders: 620 },
  { time: '16:00', rtoRate: 15.1, orders: 580 },
  { time: '20:00', rtoRate: 14.7, orders: 710 },
  { time: 'Now', rtoRate: 14.8, orders: 410 },
];

const RISK_TIERS = [
  { tier: 'LOW', pct: 62, count: '15,433 orders', color: 'bg-emerald-500', barBg: 'bg-emerald-100' },
  { tier: 'MODERATE', pct: 21, count: '5,227 orders', color: 'bg-amber-500', barBg: 'bg-amber-100' },
  { tier: 'HIGH', pct: 12, count: '2,987 orders', color: 'bg-rose-500', barBg: 'bg-rose-100' },
  { tier: 'CRITICAL', pct: 5, count: '1,245 orders', color: 'bg-red-600', barBg: 'bg-red-100' },
];

const RISK_DRIVERS = [
  { name: 'Historical Customer RTO', weight: 32, desc: 'Repeat return history & delivery refusal rate' },
  { name: 'Pincode Regional Risk', weight: 24, desc: 'Postal zone courier delivery failure concentration' },
  { name: 'Checkout Order Velocity', weight: 18, desc: 'Burst frequency of multiple COD attempts' },
  { name: 'Address Changes & Incompleteness', weight: 14, desc: 'Missing building numbers & high address turnover' },
  { name: 'High Order Value (₹4,000+ COD)', weight: 12, desc: 'Elevated ticket size on cash orders' },
];

export default function RiskIntelligence() {
  const [timeRange, setTimeRange] = useState('Today');

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest block mb-1">
            Risk Intelligence
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Understand what's driving transaction risk.
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Holistic analytics synthesizing tabular ML predictions and feature weights.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 text-xs font-semibold shadow-xs">
          {(['Today', '7 Days', '30 Days'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-3 py-1 rounded-md transition-all ${
                timeRange === t
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* VISUALIZATION 1: RTO Risk Trend (Large Chart) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. RTO Risk Rate Trend
            </h3>
            <span className="text-xs text-slate-500">24-hour moving average of predicted return probability</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <TrendingDown className="w-4 h-4" />
            <span>-2.8% vs Yesterday</span>
          </div>
        </div>

        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="riskTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={[10, 20]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-xl border border-slate-800 space-y-1">
                        <div className="font-semibold text-slate-300">{payload[0].payload.time}</div>
                        <div className="text-blue-400 font-mono font-bold">RTO Risk: {payload[0].value}%</div>
                        <div className="text-slate-400 text-[10px]">{payload[0].payload.orders} orders processed</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="rtoRate" stroke="#2563eb" strokeWidth={2.5} fill="url(#riskTrendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2-COLUMN GRID: Visualization 2 (Risk Distribution) & Visualization 3 (Risk Drivers) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* VISUALIZATION 2: Risk Distribution (5 Cols) */}
        <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Risk Distribution
            </h3>
            <span className="text-xs text-slate-500">Breakdown of orders across risk tiers</span>
          </div>

          <div className="space-y-4 pt-1">
            {RISK_TIERS.map((tier) => (
              <div key={tier.tier} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{tier.tier}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">{tier.count}</span>
                    <span className="font-mono font-bold text-slate-900">{tier.pct}%</span>
                  </div>
                </div>
                <div className={`h-2.5 w-full rounded-full ${tier.barBg} overflow-hidden`}>
                  <div
                    className={`h-full rounded-full ${tier.color} transition-all duration-500`}
                    style={{ width: `${tier.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VISUALIZATION 3: Risk Drivers Ranking (7 Cols) */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. Top Risk Drivers
            </h3>
            <span className="text-xs text-slate-500">Feature importance weights in RTO prediction</span>
          </div>

          <div className="space-y-4 pt-1">
            {RISK_DRIVERS.map((driver) => (
              <div key={driver.name} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{driver.name}</span>
                    <span className="text-[10px] text-slate-400">{driver.desc}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 text-sm ml-2">
                    {driver.weight}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all duration-500"
                    style={{ width: `${driver.weight * 2.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
