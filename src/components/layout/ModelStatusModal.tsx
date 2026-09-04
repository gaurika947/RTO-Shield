import { X, CheckCircle2, Cpu, Zap, Activity, Shield, Database } from 'lucide-react';

interface ModelStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModelStatusModal({ isOpen, onClose }: ModelStatusModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-slide-up">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">ML Model & Inference Health</h3>
              <p className="text-xs text-slate-500">Live production telemetry & tabular feature pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status Pill */}
          <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="font-bold text-emerald-950 block">Model Engine Active</span>
                <span className="text-[11px] text-emerald-700">Tabular XGBoost / GBM + Gemini Co-Processor</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono font-bold text-[10px]">
              V2.4 PROD
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] uppercase font-semibold">AUC-ROC Score</span>
                <Shield className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono">0.912</div>
              <span className="text-[10px] text-slate-500 block">Validated on 10k holdout</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] uppercase font-semibold">Inference Latency</span>
                <Zap className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono">38ms</div>
              <span className="text-[10px] text-slate-500 block">P99 &lt; 65ms</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] uppercase font-semibold">Precision / Recall</span>
                <Activity className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono">88.4% / 86.2%</div>
              <span className="text-[10px] text-slate-500 block">Balanced F1: 0.873</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] uppercase font-semibold">Tabular Features</span>
                <Database className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono">28 Features</div>
              <span className="text-[10px] text-slate-500 block">Address, Device, History</span>
            </div>
          </div>

          {/* Pipeline Details */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <span className="font-bold text-slate-900 block text-[11px]">Feature Pipeline Modules</span>
            <div className="space-y-1 text-slate-600 text-[11px]">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span>Address Verification & Token Parser</span>
                <span className="font-mono text-emerald-600 font-bold">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span>Customer Trust Passport Synthesizer</span>
                <span className="font-mono text-emerald-600 font-bold">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span>Abuse-Ring Graph Sentinel Engine</span>
                <span className="font-mono text-emerald-600 font-bold">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>AI Counterfactual & Intervention Optimizer</span>
                <span className="font-mono text-emerald-600 font-bold">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Node API: http://localhost:3001</span>
          <button
            onClick={onClose}
            className="btn-primary py-1.5 px-4 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
