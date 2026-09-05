import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Database, Gauge } from 'lucide-react';

interface ModelMeta {
  model_name: string;
  model_version: string;
  algorithm: string;
  dataset_name: string;
  train_samples: number;
  val_samples: number;
  test_samples: number;
  features_used: string[];
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    fpr: number;
    roc_auc: number;
    total_samples: number;
    confusion_matrix: { tp: number; fp: number; tn: number; fn: number };
  };
  inference_artifact_available?: boolean;
  threshold_analysis?: Array<{ threshold: number; precision: number; recall: number; f1: number; fpr: number; fnr: number }>;
}

export default function ModelStatus() {
  const [meta, setMeta] = useState<ModelMeta | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/ml/metrics')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('metrics unavailable')))
      .then((data: ModelMeta) => setMeta(data))
      .catch(() => setError(true));
  }, []);

  const metric = (value: number) => `${(value * 100).toFixed(1)}%`;
  const matrix = meta?.metrics.confusion_matrix;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16 animate-slide-up">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">Evaluation & health</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Model status</h1>
          <p className="mt-2 text-sm text-slate-500">Held-out evaluation for the existing RTO prediction model.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Simulation mode
        </span>
      </header>

      {error && <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>Metrics service unavailable. Start the Express API to load evaluation metadata.</span></div>}
      {meta && meta.inference_artifact_available === false && <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>The trained model artifact is not present in this checkout. Predictions currently use the explicitly labelled deterministic fallback; add `ml/models/rto_model.joblib` to enable primary artifact inference.</span></div>}

      <section className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Model status</p><h2 className="mt-2 text-xl font-semibold text-slate-900">{meta?.model_name || 'RTO Predictor'}</h2><p className="mt-1 text-xs text-slate-500">{meta?.algorithm || 'Existing model metadata pending'}</p></div>
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div><span className="text-slate-400">Version</span><strong className="mt-1 block font-mono text-slate-900">{meta?.model_version || 'v1.0'}</strong></div>
            <div><span className="text-slate-400">Inference</span><strong className="mt-1 block font-mono text-slate-900">Client / API</strong></div>
            <div><span className="text-slate-400">Source</span><strong className="mt-1 block font-mono text-slate-900">{meta ? 'Held-out' : 'Unavailable'}</strong></div>
            <div><span className="text-slate-400">Features</span><strong className="mt-1 block font-mono text-slate-900">{meta?.features_used.length ?? '—'}</strong></div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
          <div className="flex items-center gap-2 text-blue-300"><Database className="h-4 w-4" /><span className="text-[11px] font-bold uppercase tracking-[0.14em]">Test set</span></div>
          <p className="mt-4 text-xs text-slate-400">{meta?.dataset_name || 'Evaluation metadata unavailable'}</p>
          <div className="mt-5 grid grid-cols-3 gap-3 text-xs"><div><span className="text-slate-500">Training</span><strong className="mt-1 block font-mono">{meta?.train_samples.toLocaleString('en-IN') || '—'}</strong></div><div><span className="text-slate-500">Validation</span><strong className="mt-1 block font-mono">{meta?.val_samples.toLocaleString('en-IN') || '—'}</strong></div><div><span className="text-slate-500">Held-out</span><strong className="mt-1 block font-mono">{meta?.test_samples.toLocaleString('en-IN') || '—'}</strong></div></div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-blue-600" /><h2 className="text-sm font-semibold text-slate-900">Held-out performance</h2></div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{[
          ['Accuracy', meta && metric(meta.metrics.accuracy)], ['Precision', meta && metric(meta.metrics.precision)], ['Recall', meta && metric(meta.metrics.recall)], ['F1 score', meta && metric(meta.metrics.f1)], ['ROC-AUC', meta && meta.metrics.roc_auc.toFixed(4)], ['False positive rate', meta && metric(meta.metrics.fpr)],
        ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span><strong className="mt-2 block text-xl font-bold tabular-nums text-slate-900">{value || '—'}</strong></div>)}</div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Threshold analysis</h2>
        {meta?.threshold_analysis?.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400"><tr>{['Threshold', 'Precision', 'Recall', 'F1', 'False positive', 'False negative'].map((heading) => <th key={heading} className="px-3 py-2">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{meta.threshold_analysis.map((row) => <tr key={row.threshold}><td className="px-3 py-3 font-mono font-semibold">{row.threshold.toFixed(2)}</td><td className="px-3 py-3">{metric(row.precision)}</td><td className="px-3 py-3">{metric(row.recall)}</td><td className="px-3 py-3">{metric(row.f1)}</td><td className="px-3 py-3">{metric(row.fpr)}</td><td className="px-3 py-3">{metric(row.fnr)}</td></tr>)}</tbody></table></div> : <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">Threshold analysis is generated by `ml/evaluate.py`. Retrain/export metadata to attach the threshold table to the status API.</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Confusion matrix</h2>
        <div className="mt-4 grid max-w-2xl grid-cols-[auto_1fr_1fr] gap-2 text-center text-xs"><div /><div className="font-semibold text-slate-500">Predicted delivered</div><div className="font-semibold text-slate-500">Predicted RTO</div><div className="flex items-center justify-end pr-2 font-semibold text-slate-500">Actual delivered</div><div className="rounded-lg bg-emerald-50 p-4"><strong className="block text-lg text-emerald-700">{matrix?.tn ?? '—'}</strong><span className="text-emerald-700">True negative</span></div><div className="rounded-lg bg-amber-50 p-4"><strong className="block text-lg text-amber-700">{matrix?.fp ?? '—'}</strong><span className="text-amber-700">False positive</span></div><div className="flex items-center justify-end pr-2 font-semibold text-slate-500">Actual RTO</div><div className="rounded-lg bg-amber-50 p-4"><strong className="block text-lg text-amber-700">{matrix?.fn ?? '—'}</strong><span className="text-amber-700">False negative</span></div><div className="rounded-lg bg-red-50 p-4"><strong className="block text-lg text-red-700">{matrix?.tp ?? '—'}</strong><span className="text-red-700">True positive</span></div></div>
      </section>

      <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600"><strong className="text-slate-900">Known limitation:</strong> Current evaluation uses simulated transaction data. Production calibration requires representative merchant transaction and RTO outcome data.</p>
    </div>
  );
}