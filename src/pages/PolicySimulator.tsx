import { useState, useMemo } from 'react';
import {
  Sliders,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  TrendingDown,
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import {
  runPolicySimulation,
  DEFAULT_SIMULATION_INPUTS,
} from '../engine/simulationEngine';

export default function PolicySimulator() {
  const { updateSettings } = useSettingsStore();

  // Policy Controls state
  const [codThreshold, setCodThreshold] = useState(50);
  const [verificationThreshold, setVerificationThreshold] = useState(65);
  const [prepaidThreshold, setPrepaidThreshold] = useState(80);
  const [upiIncentive, setUpiIncentive] = useState(50);
  const [trustOverride, setTrustOverride] = useState(true);
  const [highRiskPincodeAction, setHighRiskPincodeAction] = useState<'STANDARD' | 'STEP_UP_OTP' | 'PREPAID_ONLY'>('STEP_UP_OTP');
  const [policyApplied, setPolicyApplied] = useState(false);

  // Compute live mathematical simulation
  const simInputs = useMemo(() => ({
    ...DEFAULT_SIMULATION_INPUTS,
    frictionlessCodLimit: codThreshold,
    stepUpVerificationThreshold: verificationThreshold,
    prepaidStrictThreshold: prepaidThreshold,
    upiDiscountIncentive: upiIncentive,
    customerTrustOverride: trustOverride,
    highRiskPincodeAction,
  }), [codThreshold, verificationThreshold, prepaidThreshold, upiIncentive, trustOverride, highRiskPincodeAction]);

  const simulation = useMemo(() => {
    return runPolicySimulation([], simInputs);
  }, [simInputs]);

  const handleApplyPolicy = () => {
    updateSettings({
      mediumThreshold: codThreshold,
      highThreshold: verificationThreshold,
      criticalThreshold: prepaidThreshold,
      upiDiscount: upiIncentive,
    });
    setPolicyApplied(true);
    setTimeout(() => setPolicyApplied(false), 3000);
  };

  const handleResetPolicy = () => {
    setCodThreshold(50);
    setVerificationThreshold(65);
    setPrepaidThreshold(80);
    setUpiIncentive(50);
    setTrustOverride(true);
    setHighRiskPincodeAction('STEP_UP_OTP');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-7 pb-16 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest block mb-1">
            Policy Simulator
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Test how different interventions could change your RTO exposure.
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Model financial trade-offs between checkout conversion and return-to-origin loss prevention.
          </p>
        </div>

        <button
          onClick={handleResetPolicy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* TWO-COLUMN LAB WORKSPACE */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: POLICY CONTROLS (6 Cols) */}
        <div className="md:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Policy Controls
            </h3>
          </div>

          {/* Slider 1: COD Frictionless Threshold */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800 block">Frictionless COD Threshold</span>
                <span className="text-[11px] text-slate-400">Allow instant 1-click cash on delivery</span>
              </div>
              <span className="font-mono font-bold text-slate-900 text-sm">{codThreshold}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="60"
              value={codThreshold}
              onChange={(e) => setCodThreshold(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Slider 2: Step-up Verification Threshold */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800 block">Step-Up Verification Threshold</span>
                <span className="text-[11px] text-slate-400">Trigger lightweight 1-click mobile OTP</span>
              </div>
              <span className="font-mono font-bold text-slate-900 text-sm">{verificationThreshold}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="75"
              value={verificationThreshold}
              onChange={(e) => setVerificationThreshold(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
          </div>

          {/* Slider 3: Prepaid Only Threshold */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800 block">Prepaid Strict Requirement</span>
                <span className="text-[11px] text-slate-400">Require digital prepayment for critical risk</span>
              </div>
              <span className="font-mono font-bold text-slate-900 text-sm">{prepaidThreshold}%</span>
            </div>
            <input
              type="range"
              min="60"
              max="90"
              value={prepaidThreshold}
              onChange={(e) => setPrepaidThreshold(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
          </div>

          {/* Slider 4: Instant UPI Incentive */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800 block">Instant Prepaid Incentive (UPI Discount)</span>
                <span className="text-[11px] text-slate-400">Discount offered to nudge online payment</span>
              </div>
              <span className="font-mono font-bold text-emerald-600 text-sm">₹{upiIncentive}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={upiIncentive}
              onChange={(e) => setUpiIncentive(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>

          {/* Toggle: Customer Trust Override */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Customer Trust Override</span>
                <span className="text-[11px] text-slate-400">Exempt verified 90+ trust buyers from hard blocks</span>
              </div>
              <input
                type="checkbox"
                checked={trustOverride}
                onChange={(e) => setTrustOverride(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center gap-3">
            <button
              onClick={handleApplyPolicy}
              className="flex-1 btn-primary py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center justify-center gap-1.5"
            >
              {policyApplied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Policy Enforced!</span>
                </>
              ) : (
                <>
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Apply Policy</span>
                </>
              )}
            </button>
            <button
              onClick={handleResetPolicy}
              className="btn-secondary py-2.5 px-4 text-xs font-semibold"
            >
              Reset
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: PROJECTED IMPACT (6 Cols) */}
        <div className="md:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Projected Impact
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> Net Gain
            </span>
          </div>

          {/* Primary 4 Comparative Metric Panels */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* RTO Rate */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">RTO Rate</span>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-slate-400 line-through text-xs">
                  {(simulation.currentPolicy.rtoRate * 100).toFixed(1)}%
                </span>
                <span className="text-lg font-black text-slate-900">
                  {(simulation.simulatedPolicy.rtoRate * 100).toFixed(1)}%
                </span>
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold block">
                ↓ {((simulation.currentPolicy.rtoRate - simulation.simulatedPolicy.rtoRate) * 100).toFixed(1)}% lower returns
              </span>
            </div>

            {/* Conversion */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Checkout Conversion</span>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-slate-400 line-through text-xs">
                  {(simulation.currentPolicy.conversionRate * 100).toFixed(1)}%
                </span>
                <span className="text-lg font-black text-slate-900">
                  {(simulation.simulatedPolicy.conversionRate * 100).toFixed(1)}%
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold block">
                Preserves {Math.round(simulation.simulatedPolicy.conversionRate * 100)}% conversion
              </span>
            </div>

            {/* Estimated Exposure */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Estimated Exposure</span>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-slate-400 line-through text-xs">
                  ₹{(simulation.currentPolicy.estimatedLoss / 100000).toFixed(1)}L
                </span>
                <span className="text-lg font-black text-slate-900">
                  ₹{(simulation.simulatedPolicy.estimatedLoss / 100000).toFixed(1)}L
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold block">Monthly risk exposure</span>
            </div>

            {/* Potential Reduction */}
            <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Potential Reduction</span>
              <div className="text-lg font-black text-emerald-700 font-mono">
                ₹{(simulation.potentialExposureReduction / 100000).toFixed(1)} Lakhs
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold block">Net monthly savings</span>
            </div>
          </div>

          {/* AI Policy Recommendation Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-2">
            <div className="flex items-center gap-1.5 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Recommendation</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              "{simulation.aiRecommendation.suggestion}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
