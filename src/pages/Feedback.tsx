import { MessageSquare, AlertCircle } from 'lucide-react';
import { useRiskStore } from '../store/riskStore';
import { computeMetrics } from '../engine/feedbackEngine';

export default function Feedback() {
  const { feedbackRecords } = useRiskStore();
  const metrics = computeMetrics(feedbackRecords);

  const sorted = [...feedbackRecords].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-teal-500" /> Feedback & Metrics
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Precision, recall, F1, FPR computed from actual labeled observations (TP/FP/TN/FN).
        </p>
      </div>

      {/* Confusion Matrix */}
      <div className="card">
        <h3 className="text-sm font-semibold text-navy-800 mb-4">Confusion Matrix</h3>
        <div className="grid grid-cols-3 gap-px bg-gray-200 rounded-lg overflow-hidden max-w-md mx-auto">
          <div className="bg-white p-3" />
          <div className="bg-gray-50 p-3 text-center text-xs font-bold text-navy-700">Actual: RTO</div>
          <div className="bg-gray-50 p-3 text-center text-xs font-bold text-navy-700">Actual: Delivered</div>
          <div className="bg-gray-50 p-3 text-xs font-bold text-navy-700">Predicted: HIGH</div>
          <div className="bg-emerald-50 p-3 text-center"><span className="text-2xl font-bold text-emerald-700">{metrics.tp}</span><span className="block text-xs text-emerald-600 mt-1">TP</span></div>
          <div className="bg-red-50 p-3 text-center"><span className="text-2xl font-bold text-red-700">{metrics.fp}</span><span className="block text-xs text-red-600 mt-1">FP</span></div>
          <div className="bg-gray-50 p-3 text-xs font-bold text-navy-700">Predicted: LOW/MED</div>
          <div className="bg-amber-50 p-3 text-center"><span className="text-2xl font-bold text-amber-700">{metrics.fn}</span><span className="block text-xs text-amber-600 mt-1">FN</span></div>
          <div className="bg-emerald-50 p-3 text-center"><span className="text-2xl font-bold text-emerald-700">{metrics.tn}</span><span className="block text-xs text-emerald-600 mt-1">TN</span></div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Precision', value: metrics.precision, desc: 'TP / (TP + FP)' },
          { label: 'Recall', value: metrics.recall, desc: 'TP / (TP + FN)' },
          { label: 'F1 Score', value: metrics.f1, desc: '2 × P × R / (P + R)' },
          { label: 'False Positive Rate', value: metrics.fpr, desc: 'FP / (FP + TN)' },
        ].map(m => (
          <div key={m.label} className="card">
            <span className="metric-label">{m.label}</span>
            <div className="metric-value mt-1">
              {!metrics.sufficient
                ? '—'
                : m.value !== null
                  ? (m.value * 100).toFixed(1) + '%'
                  : '—'
              }
            </div>
            <p className="text-xs text-gray-400 mt-1 font-mono">{m.desc}</p>
          </div>
        ))}
      </div>

      {!metrics.sufficient && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Insufficient observations ({metrics.totalObservations} of minimum 5). Run more checkout simulations with outcomes to build the confusion matrix.
        </div>
      )}

      {/* Feedback Records */}
      <div className="card">
        <h3 className="text-sm font-semibold text-navy-800 mb-3">Labeled Observations</h3>
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No feedback records yet. Place orders in the Checkout and simulate outcomes.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-2 text-left text-xs text-gray-500 font-medium">Order</th>
                <th className="py-2 text-xs text-gray-500 font-medium">Predicted</th>
                <th className="py-2 text-xs text-gray-500 font-medium">Actual</th>
                <th className="py-2 text-xs text-gray-500 font-medium">Classification</th>
                <th className="py-2 text-right text-xs text-gray-500 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => (
                <tr key={r.id} className="border-b border-gray-50">
                  <td className="py-2 font-mono text-xs">{r.orderId}</td>
                  <td className="py-2 text-center">
                    <span className={`risk-badge risk-badge-${r.predictedTier.toLowerCase()}`}>{r.predictedTier}</span>
                  </td>
                  <td className="py-2 text-center font-medium">{r.actualOutcome}</td>
                  <td className="py-2 text-center">
                    <span className={`text-xs font-bold ${
                      r.classification === 'TRUE_POSITIVE' || r.classification === 'TRUE_NEGATIVE'
                        ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {r.classification}
                    </span>
                  </td>
                  <td className="py-2 text-right font-mono">{r.predictedScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
