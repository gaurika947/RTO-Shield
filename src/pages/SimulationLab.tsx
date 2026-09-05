import { useState, useCallback } from 'react';
import { FlaskConical, Play, Loader2 } from 'lucide-react';
import { useRiskStore } from '../store/riskStore';
import { useSettingsStore } from '../store/settingsStore';
import { evaluateRisk } from '../engine/riskEngine';
import { makeDecision } from '../engine/decisionEngine';
import { generateScenario, ALL_SCENARIOS, type ScenarioData } from '../engine/scenarioEngine';
import type { SignalContributions } from '../types/risk';

interface SimResult {
  scenario: ScenarioData;
  score: number;
  tier: string;
  confidence: number;
  decision: string;
  paymentMethods: string[];
  signals: string[];
  contributions: SignalContributions;
}

export default function SimulationLab() {
  const store = useRiskStore();
  const settings = useSettingsStore();
  const [results, setResults] = useState<SimResult[]>([]);
  const [running, setRunning] = useState(false);

  const runAll = useCallback(async () => {
    setRunning(true);
    const newResults: SimResult[] = [];

    for (const type of ALL_SCENARIOS) {
      const data = generateScenario(type);
      const result = evaluateRisk(
        data.address,
        data.customer,
        data.deviceId,
        store.customers,
        store.orders,
        store.networkNodes,
        store.networkEdges,
        settings
      );
      const dec = makeDecision(result, settings);

      newResults.push({
        scenario: data,
        score: result.score,
        tier: result.tier,
        confidence: result.confidence,
        decision: dec.action,
        paymentMethods: dec.paymentMethods,
        signals: result.signals,
        contributions: result.contributions,
      });

      // Brief delay for visual feedback
      await new Promise(r => setTimeout(r, 100));
    }

    setResults(newResults);
    setRunning(false);
  }, [store, settings]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-violet-500" /> Simulation Lab
          </h2>
          <p className="text-sm text-gray-500 mt-1">Run all 6 scenarios through the real risk engine with current settings</p>
        </div>
        <button onClick={runAll} disabled={running} className="btn-primary">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? 'Running...' : 'Run All Scenarios'}
        </button>
      </div>

      {/* Settings context */}
      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs grid grid-cols-4 gap-4">
        <div><span className="text-gray-500">Medium Threshold</span> <span className="font-mono font-bold ml-1">{settings.mediumThreshold}</span></div>
        <div><span className="text-gray-500">High Threshold</span> <span className="font-mono font-bold ml-1">{settings.highThreshold}</span></div>
        <div><span className="text-gray-500">COD Fee</span> <span className="font-mono font-bold ml-1">₹{settings.codFee}</span></div>
        <div><span className="text-gray-500">AI</span> <span className="font-mono font-bold ml-1">{settings.aiEnabled ? 'On' : 'Off'}</span></div>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((r, i) => (
            <div key={i} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-navy-900">{r.scenario.label}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{r.scenario.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`risk-badge risk-badge-${r.tier.toLowerCase()}`}>{r.tier}</span>
                  <span className="text-2xl font-bold text-navy-900">{r.score}</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4 text-sm mb-3">
                <div><span className="text-gray-500">Signal completeness</span><div className="font-bold">{Math.round(r.confidence * 100)}%</div></div>
                <div><span className="text-gray-500">Decision</span><div className="font-mono font-bold">{r.decision}</div></div>
                <div><span className="text-gray-500">Payment</span><div className="font-bold">{r.paymentMethods.join(', ')}</div></div>
                <div><span className="text-gray-500">Customer</span><div className="font-bold">{r.scenario.customer.name}</div></div>
                <div><span className="text-gray-500">Amount</span><div className="font-bold">₹{r.scenario.orderAmount}</div></div>
              </div>

              {/* Contributions */}
              <div className="flex gap-2 flex-wrap mb-3">
                {Object.entries(r.contributions).map(([k, v]) => (
                  <span key={k} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-50 text-xs">
                    <span className="text-gray-500 capitalize">{k}</span>
                    <span className="font-mono font-bold">+{v}</span>
                  </span>
                ))}
              </div>

              {/* Signals */}
              <div className="flex gap-1.5 flex-wrap">
                {r.signals.slice(0, 6).map((s, j) => (
                  <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-navy-50 text-navy-600 border border-navy-200">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !running && (
        <div className="card text-center py-12 text-gray-400">
          Click "Run All Scenarios" to evaluate all 6 scenarios with the current settings.
        </div>
      )}
    </div>
  );
}
