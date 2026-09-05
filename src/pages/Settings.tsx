import { SlidersHorizontal, RotateCcw, Heart, Boxes, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';

export default function Settings() {
  const settings = useSettingsStore();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Policy Governance</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Risk & Intervention Policy Controls
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure merchant tier thresholds, signal weight allocations, and dynamic checkout fee incentives.
          </p>
        </div>

        <button onClick={settings.resetSettings} className="btn-secondary text-xs">
          <RotateCcw className="w-3.5 h-3.5" /> Reset Policy Defaults
        </button>
      </div>

      {/* Policy Meta */}
      <div className="p-3.5 rounded-lg bg-slate-900 text-white text-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-slate-400 block text-[10px]">Active Policy Version</span>
            <span className="font-mono font-bold text-blue-400">{settings.policyVersion}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Risk Engine Release</span>
            <span className="font-mono font-bold text-emerald-400">{settings.riskEngineVersion}</span>
          </div>
        </div>
        <span className="text-[10px] text-slate-400">
          Policy Counter: #{settings.policyCounter}
        </span>
      </div>

      {/* Thresholds */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
          Risk Tier Classification Thresholds
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">Medium Risk Threshold</span>
              <span className="font-mono font-bold text-base text-amber-700">{settings.mediumThreshold}</span>
            </div>
            <input
              type="range"
              min={10}
              max={90}
              step={5}
              value={settings.mediumThreshold}
              onChange={(e) => settings.updateSettings({ mediumThreshold: Number(e.target.value) })}
              className="w-full accent-amber-500"
            />
            <p className="text-[11px] text-slate-500 leading-snug">
              Score ≥ {settings.mediumThreshold} triggers MEDIUM tier (Soft nudge: OTP verification & COD fee).
            </p>
          </div>

          <div className="p-4 rounded-lg bg-red-50/50 border border-red-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">High Risk Threshold</span>
              <span className="font-mono font-bold text-base text-red-700">{settings.highThreshold}</span>
            </div>
            <input
              type="range"
              min={10}
              max={95}
              step={5}
              value={settings.highThreshold}
              onChange={(e) => settings.updateSettings({ highThreshold: Number(e.target.value) })}
              className="w-full accent-red-500"
            />
            <p className="text-[11px] text-slate-500 leading-snug">
              Score ≥ {settings.highThreshold} triggers HIGH tier (Cash on Delivery blocked → Prepaid only).
            </p>
          </div>
        </div>
      </div>

      {/* Signal Weights */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Signal Engine Weight Allocations
          </h3>
          <span className="text-xs font-mono font-semibold text-slate-600">
            Total:{' '}
            <span
              className={
                Math.round(Object.values(settings.weights).reduce((s, v) => s + v, 0) * 100) === 100
                  ? 'text-emerald-600'
                  : 'text-amber-600'
              }
            >
              {Math.round(Object.values(settings.weights).reduce((s, v) => s + v, 0) * 100)}%
            </span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {(Object.entries(settings.weights) as [string, number][]).map(([key, val]) => (
            <div key={key} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 capitalize">
                  {key === 'ai' ? 'AI Contextual Intelligence' : key}
                </span>
                <span className="font-mono font-bold text-slate-900">{(val * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={Math.round(val * 100)}
                onChange={(e) => settings.updateWeights({ [key]: Number(e.target.value) / 100 })}
                className="w-full accent-blue-600"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Checkout Interventions Config */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
          Intervention & Incentive Rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">COD Handling Surcharge (₹)</label>
            <input
              type="number"
              value={settings.codFee}
              min={0}
              max={200}
              onChange={(e) => settings.updateSettings({ codFee: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">UPI Instant Discount (₹)</label>
            <input
              type="number"
              value={settings.upiDiscount}
              min={0}
              max={100}
              onChange={(e) => settings.updateSettings({ upiDiscount: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100 pt-2 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 block">OTP Verification for Medium Risk COD</span>
              <p className="text-slate-500 text-[11px]">Require step-up mobile OTP before authorizing COD</p>
            </div>
            <button
              onClick={() => settings.updateSettings({ otpRequired: !settings.otpRequired })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.otpRequired ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  settings.otpRequired ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 block">Gemini AI Contextual Intelligence</span>
              <p className="text-slate-500 text-[11px]">Attach generative risk reasoning to transactions</p>
            </div>
            <button
              onClick={() => settings.updateSettings({ aiEnabled: !settings.aiEnabled })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.aiEnabled ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  settings.aiEnabled ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Exposure assumptions</h3>
          <p className="mt-1 text-[11px] text-slate-500">Used only for estimated merchant cost calculations. Zero means no assumption configured.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
          {([
            ['averageForwardShippingCost', 'Average forward shipping cost'],
            ['averageReverseShippingCost', 'Average reverse shipping cost'],
            ['averageRtoProcessingCost', 'Average RTO processing cost'],
            ['averageHandlingCost', 'Average handling cost'],
          ] as const).map(([key, label]) => <label key={key} className="font-bold text-slate-700">{label} (₹)<input type="number" min={0} value={settings[key] ?? 0} onChange={(event) => settings.updateSettings({ [key]: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" /></label>)}
        </div>
      </div>

      {/* Secondary Resources Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => navigate('/responsible-ai')}
          className="card card-hover p-4 cursor-pointer flex items-center justify-between border-slate-200"
        >
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-rose-500" />
            <div>
              <h4 className="font-bold text-xs text-slate-900">Responsible AI Framework</h4>
              <p className="text-[11px] text-slate-500">Fairness principles, safety guardrails & oversight</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </div>

        <div
          onClick={() => navigate('/architecture')}
          className="card card-hover p-4 cursor-pointer flex items-center justify-between border-slate-200"
        >
          <div className="flex items-center gap-3">
            <Boxes className="w-5 h-5 text-indigo-500" />
            <div>
              <h4 className="font-bold text-xs text-slate-900">System Architecture</h4>
              <p className="text-[11px] text-slate-500">Signal analyzers, decision engine & pipeline</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </div>
  );
}
