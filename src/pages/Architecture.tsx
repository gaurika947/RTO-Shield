import { Boxes } from 'lucide-react';

export default function ArchitecturePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
          <Boxes className="w-6 h-6 text-blue-500" /> System Architecture
        </h2>
        <p className="text-sm text-gray-500 mt-1">End-to-end data flow from customer input to outcome feedback</p>
      </div>

      {/* Pipeline Diagram */}
      <div className="card">
        <h3 className="text-sm font-semibold text-navy-800 mb-4">Risk Evaluation Pipeline</h3>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {[
            { label: 'Customer Input', sub: 'Address, Device, IP', color: 'bg-blue-500' },
            { label: 'Signal Extraction', sub: '6 analyzers', color: 'bg-indigo-500' },
            { label: 'Risk Engine', sub: 'Weighted sum', color: 'bg-violet-500' },
            { label: 'Decision Engine', sub: 'Merchant policy', color: 'bg-purple-500' },
            { label: 'Dynamic Checkout', sub: 'UPI/Card/COD', color: 'bg-fuchsia-500' },
            { label: 'Order Outcome', sub: 'Delivered/RTO', color: 'bg-pink-500' },
            { label: 'Feedback Loop', sub: 'TP/FP/TN/FN', color: 'bg-rose-500' },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center">
              <div className={`${step.color} text-white rounded-lg px-4 py-3 text-center min-w-[120px]`}>
                <div className="text-xs font-bold">{step.label}</div>
                <div className="text-[10px] opacity-80 mt-0.5">{step.sub}</div>
              </div>
              {i < arr.length - 1 && (
                <svg className="w-6 h-6 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Signal Weights */}
      <div className="card">
        <h3 className="text-sm font-semibold text-navy-800 mb-3">Risk Score Formula</h3>
        <div className="bg-navy-950 text-emerald-400 rounded-lg p-4 font-mono text-sm">
          <p className="text-gray-400">// Weighted combination of 6 normalized signals (0-100 each)</p>
          <p className="mt-2">
            finalScore = clamp(
          </p>
          <p className="ml-4">address × <span className="text-amber-400">0.15</span> +</p>
          <p className="ml-4">history × <span className="text-amber-400">0.25</span> +</p>
          <p className="ml-4">network × <span className="text-amber-400">0.25</span> +</p>
          <p className="ml-4">velocity × <span className="text-amber-400">0.15</span> +</p>
          <p className="ml-4">behavior × <span className="text-amber-400">0.10</span> +</p>
          <p className="ml-4">ai × <span className="text-amber-400">0.10</span></p>
          <p>, <span className="text-blue-400">0</span>, <span className="text-blue-400">100</span>)</p>
          <p className="mt-3 text-gray-400">// Confidence is SEPARATE — derived from evidence quality, not score magnitude</p>
          <p className="mt-1 text-gray-400">// Risk tier is derived from merchant thresholds, not individual analyzers</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Risk Engine vs Decision Engine */}
        <div className="card">
          <h3 className="text-sm font-semibold text-navy-800 mb-3">Risk Engine</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">✓</span> Calculates raw fraud signals</li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">✓</span> Returns score + confidence + evidence</li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">✓</span> Knows about addresses, devices, behavior</li>
            <li className="flex items-start gap-2"><span className="text-red-500 font-bold">✗</span> Does NOT decide payment methods</li>
            <li className="flex items-start gap-2"><span className="text-red-500 font-bold">✗</span> Does NOT know merchant thresholds</li>
          </ul>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-navy-800 mb-3">Decision Engine</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">✓</span> Applies merchant policy to risk score</li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">✓</span> Determines payment methods, fees, nudges</li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">✓</span> Controlled by adjustable thresholds</li>
            <li className="flex items-start gap-2"><span className="text-red-500 font-bold">✗</span> Does NOT analyze addresses or devices</li>
            <li className="flex items-start gap-2"><span className="text-red-500 font-bold">✗</span> Does NOT generate fraud signals</li>
          </ul>
        </div>
      </div>

      {/* AI Positioning */}
      <div className="card">
        <h3 className="text-sm font-semibold text-navy-800 mb-3">AI Positioning</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-bold text-emerald-600 mb-2">WHAT GEMINI IS:</p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• One of 6 intelligence signals (weight: 10%)</li>
              <li>• Contextual analysis of address quality and intent</li>
              <li>• An optional enhancer — system works without it</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold text-red-600 mb-2">WHAT GEMINI IS NOT:</p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• NOT the decision maker</li>
              <li>• NOT a replacement for deterministic signals</li>
              <li>• NOT exposed to the client (server-side only)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
