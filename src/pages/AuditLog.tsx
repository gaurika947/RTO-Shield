import { useState } from 'react';
import { ScrollText, Search, CheckCircle2 } from 'lucide-react';
import { useRiskStore } from '../store/riskStore';
import { formatTimestamp, formatDate } from '../lib/utils';
import type { AuditRecord } from '../types/risk';

export default function AuditLog() {
  const { auditRecords } = useRiskStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

  const sorted = [...auditRecords].sort((a, b) => b.timestamp - a.timestamp);
  const filtered = sorted.filter((a) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.orderId?.toLowerCase().includes(term) ||
      a.evaluationId.toLowerCase().includes(term) ||
      a.riskTier.toLowerCase().includes(term) ||
      a.decision.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <ScrollText className="w-4 h-4" />
            <span>Compliance & Traceability</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Transaction Decision Audit Trail
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Cryptographic-style audit records preserving evaluation IDs, signal weights, policy rules, and decision outcomes.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Order, Tier, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16 text-slate-400 text-xs">
          No audit records matching your search query. Run checkout assessments to populate the audit log.
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((a) => {
            const isSelected = selectedRecord?.id === a.id;
            return (
              <div
                key={a.id}
                onClick={() => setSelectedRecord(isSelected ? null : a)}
                className={`card p-4 transition-all cursor-pointer hover:border-slate-300 ${
                  isSelected ? 'ring-2 ring-blue-500/20 border-blue-500 bg-blue-50/10' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-700 font-mono text-xs font-bold">
                      #
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {a.orderId || 'EVALUATION-RECORD'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 ml-2">
                        eval: {a.evaluationId.slice(0, 16)}...
                      </span>
                    </div>
                    <span
                      className={`risk-badge ${
                        a.riskTier === 'HIGH'
                          ? 'risk-badge-high'
                          : a.riskTier === 'MEDIUM'
                          ? 'risk-badge-medium'
                          : 'risk-badge-low'
                      }`}
                    >
                      {a.riskTier}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <span className="font-bold font-mono text-sm text-slate-900">{a.riskScore}/100</span>
                      <span className="text-[11px] text-slate-400 block">
                        Conf: {Math.round(a.confidence * 100)}%
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono text-right">
                      <div>{formatDate(a.timestamp)}</div>
                      <div>{formatTimestamp(a.timestamp)}</div>
                    </div>
                  </div>
                </div>

                {/* Primary Parameters */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Decision</span>
                    <span className="font-mono font-bold text-blue-700 mt-0.5 block">{a.decision}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Engine Version</span>
                    <span className="font-mono text-slate-700 mt-0.5 block">{a.riskEngineVersion}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Policy Version</span>
                    <span className="font-mono text-slate-700 mt-0.5 block">{a.policyVersion}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">ML Return Prob</span>
                    <span className="font-mono font-bold text-blue-600 mt-0.5 block">
                      {a.rtoProbability !== undefined ? `${(a.rtoProbability * 100).toFixed(0)}%` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">AI Connected</span>
                    <span className={`font-semibold mt-0.5 block ${a.aiAvailable ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {a.aiAvailable ? 'Live Gemini' : 'Fallback'}
                    </span>
                  </div>
                  <div className="md:col-span-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Permitted Methods</span>
                    <span className="font-mono font-semibold text-slate-800 mt-0.5 block truncate">
                      {a.paymentMethods.join(', ')}
                    </span>
                  </div>
                </div>

                {/* Signal Pills */}
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {Object.entries(a.signalContributions).map(([k, v]) => (
                    <span
                      key={k}
                      className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-700 shadow-xs"
                    >
                      <span className="capitalize text-slate-500">{k}</span>: <b>+{v as number}</b>
                    </span>
                  ))}
                </div>

                {/* Expanded Trace Evidence */}
                {isSelected && a.evidence && a.evidence.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-slate-200 space-y-2 text-xs">
                    <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                      Traceable Evidence Log:
                    </span>
                    <div className="space-y-1.5">
                      {a.evidence.map((ev, idx) => (
                        <div key={idx} className="p-2 rounded bg-white border border-slate-200 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <span className="font-bold text-slate-800 font-mono">[{ev.type}] </span>
                            <span className="text-slate-700">{ev.explanation}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900 shrink-0">+{ev.contribution}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
