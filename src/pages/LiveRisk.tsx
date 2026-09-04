import { useState } from 'react';
import { Activity } from 'lucide-react';
import { useRiskStore } from '../store/riskStore';
import { formatTimestamp, formatDate } from '../lib/utils';
import type { RiskEvent } from '../types/events';

export default function LiveRisk() {
  const { riskEvents, auditRecords } = useRiskStore();
  const [selectedEvent, setSelectedEvent] = useState<RiskEvent | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  const sortedEvents = [...riskEvents].sort((a, b) => b.timestamp - a.timestamp);
  const filteredEvents = sortedEvents.filter((evt) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'RISK') return evt.type === 'RISK_CALCULATED' || evt.type === 'DECISION_MADE';
    if (filterType === 'SIGNALS') return evt.type.includes('ANALYZED');
    if (filterType === 'ORDERS') return evt.type.includes('ORDER') || evt.type.includes('CHECKOUT');
    return true;
  });

  const selectedAudit = selectedEvent?.evaluationId
    ? auditRecords.find((a) => a.evaluationId === selectedEvent.evaluationId)
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>Risk Intelligence</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Live Risk Event Stream
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Operational event journal tracking continuous engine decisions and telemetry.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 border border-slate-200 text-xs">
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'RISK', label: 'Decisions' },
            { id: 'SIGNALS', label: 'Signals' },
            { id: 'ORDERS', label: 'Orders' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                filterType === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Stream Table */}
        <div className="lg:col-span-2 card max-h-[72vh] overflow-y-auto p-0 border-slate-200 divide-y divide-slate-100">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              No matching events found. Run checkout assessments to generate live events.
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const isRisk = evt.type === 'RISK_CALCULATED';
              const isDecision = evt.type === 'DECISION_MADE';
              const isSelected = selectedEvent?.id === evt.id;

              return (
                <button
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`w-full flex items-start gap-3.5 p-3 text-left transition-colors ${
                    isSelected ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[11px] font-mono text-slate-400 shrink-0 w-16 mt-0.5">
                    {formatTimestamp(evt.timestamp)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-800">
                        {evt.type}
                      </span>
                      {evt.orderId && (
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {evt.orderId}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs mt-0.5 truncate ${
                        isRisk
                          ? 'text-blue-700 font-semibold'
                          : isDecision
                          ? 'text-purple-700 font-semibold'
                          : 'text-slate-600'
                      }`}
                    >
                      {evt.description}
                    </p>
                  </div>

                  {evt.riskContribution !== undefined && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-900 shrink-0">
                      Score: {evt.riskContribution}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Detail Inspector */}
        <div className="card p-5 space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Event Inspector</h4>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>

          {selectedEvent ? (
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Event Type</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                  {selectedEvent.type}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 font-medium block">Timestamp</span>
                  <span className="font-mono text-slate-700 mt-0.5 block">
                    {formatTimestamp(selectedEvent.timestamp)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Date</span>
                  <span className="font-mono text-slate-700 mt-0.5 block">
                    {formatDate(selectedEvent.timestamp)}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Description</span>
                <p className="text-slate-800 font-medium mt-0.5 bg-slate-50 p-2 rounded border border-slate-200">
                  {selectedEvent.description}
                </p>
              </div>

              {selectedEvent.orderId && (
                <div>
                  <span className="text-slate-400 font-medium block">Order Identifier</span>
                  <span className="font-mono font-semibold text-blue-600 mt-0.5 block">
                    {selectedEvent.orderId}
                  </span>
                </div>
              )}

              {selectedEvent.evaluationId && (
                <div>
                  <span className="text-slate-400 font-medium block">Evaluation Trace ID</span>
                  <span className="font-mono text-[11px] text-slate-600 mt-0.5 block">
                    {selectedEvent.evaluationId}
                  </span>
                </div>
              )}

              {selectedAudit && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-900 uppercase">Assessment Summary</span>
                    <span className={`risk-badge text-[10px] ${
                      selectedAudit.riskTier === 'CRITICAL'
                        ? 'bg-red-700 text-white font-bold'
                        : selectedAudit.riskTier === 'HIGH'
                        ? 'risk-badge-high'
                        : selectedAudit.riskTier === 'MODERATE' || selectedAudit.riskTier === 'MEDIUM'
                        ? 'risk-badge-medium'
                        : 'risk-badge-low'
                    }`}>
                      {selectedAudit.riskTier}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Score</span>
                      <span className="font-bold text-slate-900">{selectedAudit.riskScore}/100</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Decision</span>
                      <span className="font-mono font-bold text-blue-700">{selectedAudit.decision}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs">
              Select any event from the stream to view full trace parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
