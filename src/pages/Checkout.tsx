import { useState, useCallback, useRef } from 'react';
import { Play, RotateCcw, AlertCircle, Check } from 'lucide-react';
import { useRiskStore } from '../store/riskStore';
import { useSettingsStore } from '../store/settingsStore';
import { evaluateRisk } from '../engine/riskEngine';
import { makeDecision } from '../engine/decisionEngine';
import { runMLInference } from '../engine/mlService';
import { callGeminiAnalysis } from '../ai/geminiAnalyzer';
import { DEMO_TRANSACTIONS, type DemoTransaction } from '../data/demoTransactions';
import { normalizeSimulationTransaction } from '../data/simulationAdapter';
import type { AuditRecord, CachedAnalysis } from '../types/risk';
import type { Order, PaymentMethod, OrderOutcome as OutcomeType } from '../types/order';

// Subcomponents
import { TransactionSelector } from '../components/checkout/TransactionSelector';
import { AnalysisAnimation, type PipelineStepInfo } from '../components/checkout/AnalysisAnimation';
import { TransactionRiskReport } from '../components/checkout/TransactionRiskReport';
import { CheckoutPreview } from '../components/checkout/CheckoutPreview';
import { OrderOutcome } from '../components/checkout/OrderOutcome';
import { DebugPanel } from '../components/checkout/DebugPanel';

const PIPELINE_STAGES: PipelineStepInfo[] = [
  { key: 'features', name: 'Transaction features', detail: 'Parsing order value, payment mode & buyer device fingerprint...' },
  { key: 'history', name: 'Customer history', detail: 'Evaluating delivery success rate & prior return records...' },
  { key: 'address', name: 'Address intelligence', detail: 'Analyzing address completeness, premise structure & zone safety...' },
  { key: 'network', name: 'Network signals', detail: 'Scanning graph clusters, shared IP subnets & linked accounts...' },
  { key: 'velocity', name: 'Velocity', detail: 'Measuring short-window COD order burst rates against baseline...' },
  { key: 'ml', name: 'RTO prediction', detail: 'Running RTO Shield Gradient Boosting inference...' },
];

export default function Checkout() {
  const store = useRiskStore();
  const settings = useSettingsStore();

  // Find currently selected transaction based on store ID
  const selectedTx = DEMO_TRANSACTIONS.find((tx) => tx.id === store.selectedTxId) || DEMO_TRANSACTIONS[0];

  // Pipeline animation states
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Post-checkout order outcome state
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<{
    orderNumber: string;
    finalMethod: PaymentMethod;
    finalAmount: number;
  } | null>(null);

  // Ref to prevent duplicate concurrent runs
  const isRunningRef = useRef(false);

  // STEP 1: User selects a transaction
  // MUST NOT trigger ML! Merely updates selection and clears stale analysis
  const handleSelectTransaction = (tx: DemoTransaction) => {
    if (store.analysisState === 'analyzing') return;

    if (tx.id !== store.selectedTxId) {
      store.setSelectedTxId(tx.id);
      store.clearAnalysis();
      setOrderPlaced(false);
      setPlacedOrder(null);
      setAnalysisError(null);
      setCompletedSteps([]);
      setCurrentStepIndex(-1);
    }
  };

  // STEP 2: User explicitly clicks [ ANALYZE TRANSACTION ]
  // Runs ML inference ONCE, calculates 7-signal risk score, and executes decision policy
  const handleRunAnalysis = useCallback(async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    setAnalysisError(null);
    store.setAnalysisState('analyzing');
    setCompletedSteps([]);
    setCurrentStepIndex(0);
    setOrderPlaced(false);
    setPlacedOrder(null);

    const tx = selectedTx;

    try {
      // 1. Kick off ML Inference (Singleton / Cached In-Memory Model)
      const normalizedInput = normalizeSimulationTransaction(tx);
      const mlPromise = runMLInference(
        normalizedInput.customer,
        normalizedInput.address,
        normalizedInput.orderAmount,
        normalizedInput.paymentMethod,
        normalizedInput.deviceId,
        {
          checkoutDuration: normalizedInput.checkoutDuration,
          checkoutAttempts: normalizedInput.checkoutAttempts,
          addressChanges: normalizedInput.addressChanges,
          deviceLinkedAccounts: normalizedInput.deviceLinkedAccounts,
        }
      );

      // 2. Non-blocking Gemini Contextual Reasoning
      let aiPromise: Promise<any> = Promise.resolve(null);
      if (settings.aiEnabled) {
        setAiLoading(true);
        aiPromise = callGeminiAnalysis(
          {
            address: `${tx.address.line1}, ${tx.address.city}, ${tx.address.state} - ${tx.address.pincode}`,
            addressFeatures: [tx.address.landmark ? `Landmark: ${tx.address.landmark}` : 'No landmark'],
            customerHistorySummary: `${tx.customer.totalOrders} total orders, ${tx.customer.successfulDeliveries} delivered, ${tx.customer.rtoOrders} RTOs`,
            behaviorSummary: `Checkout took ${tx.checkoutDuration || 45}s with ${tx.checkoutAttempts || 1} attempts`,
            networkSummary: `Device ${tx.deviceId} linked to ${tx.deviceLinkedOrdersCount || 1} accounts`,
          },
          settings.aiEnabled
        );
      }

      // Fast, snappy pipeline visual feedback (~45ms per stage = ~270ms total)
      for (let i = 0; i < PIPELINE_STAGES.length; i++) {
        setCurrentStepIndex(i);
        await new Promise((resolve) => setTimeout(resolve, 45));
        setCompletedSteps((prev) => [...prev, PIPELINE_STAGES[i].key]);
      }

      // Await ML Result
      const mlResult = await mlPromise;

      // 3. Evaluate deterministic 7-signal risk engine with real ML output
      const evaluatedRisk = evaluateRisk(
        tx.address,
        tx.customer,
        tx.deviceId,
        store.customers,
        store.orders,
        store.networkNodes,
        store.networkEdges,
        settings,
        undefined, // AI will attach when resolved
        mlResult
      );

      // 4. Run central Decision Engine for dynamic payment policy
      const evaluatedDecision = makeDecision(evaluatedRisk, settings);

      // 4b. Fetch authoritative HMAC decision token from backend
      let serverDecisionToken: string | undefined = undefined;
      try {
        const evalRes = await fetch('/api/checkout/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: tx.id,
            order: { order_value: tx.orderAmount, payment_method: tx.paymentMethod },
            customer: {
              previous_orders: tx.customer.totalOrders,
              previous_delivered_orders: tx.customer.successfulDeliveries,
              previous_rto_orders: tx.customer.rtoOrders,
              device_linked_accounts: tx.deviceLinkedOrdersCount || 1,
            },
            address: tx.address,
            behavior: {
              checkout_duration: tx.checkoutDuration || 60,
              checkout_attempts: tx.checkoutAttempts || 1,
              address_changes: tx.addressChanges || 0,
            },
          }),
        });
        if (evalRes.ok) {
          const evalData = await evalRes.json();
          serverDecisionToken = evalData.decisionToken;
          evaluatedDecision.decisionToken = serverDecisionToken;
          if (evaluatedDecision.canonicalDecision) {
            evaluatedDecision.canonicalDecision.decisionToken = serverDecisionToken;
          }
        }
      } catch {
        // Backend offline or local fallback
      }

      const rtoPercent = Math.round((evaluatedRisk.rtoProbability ?? 0.5) * 100);

      const newCachedAnalysis: CachedAnalysis = {
        transactionId: tx.id,
        orderNumber: tx.orderNumber,
        customerName: tx.customer.name,
        orderAmount: tx.orderAmount,
        rtoProbability: evaluatedRisk.rtoProbability,
        riskScore: evaluatedRisk.score,
        riskLevel: evaluatedDecision.paymentPolicy.riskLevel,
        signalScores: {
          network: evaluatedRisk.ringRisk?.ringDetected
            ? Math.max(evaluatedRisk.contributions.network * 4, evaluatedRisk.ringRisk.ringRiskScore)
            : Math.min(100, Math.round(evaluatedRisk.contributions.network * 4.5)),
          history: Math.min(100, Math.round(evaluatedRisk.contributions.history * 4.5)),
          velocity: Math.min(100, Math.round(evaluatedRisk.contributions.velocity * 5.5)),
          address: Math.min(100, Math.round(evaluatedRisk.contributions.address * 7)),
          behavior: Math.min(100, Math.round(evaluatedRisk.contributions.behavior * 10)),
          rtoModel: rtoPercent,
        },
        riskResult: evaluatedRisk,
        decision: evaluatedDecision,
        paymentPolicy: evaluatedDecision.paymentPolicy,
        modelVersion: evaluatedRisk.mlModelVersion || 'RTO Shield GBDT v1',
        timestamp: Date.now(),
        decisionToken: serverDecisionToken,
      };

      // Set active analysis in central store (Cached!)
      store.setActiveAnalysis(newCachedAnalysis);

      // 5. Record immutable audit record
      const auditRecord: AuditRecord = {
        id: `AUDIT_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        orderId: tx.id,
        evaluationId: evaluatedRisk.evaluationId,
        timestamp: Date.now(),
        riskScore: evaluatedRisk.score,
        riskTier: evaluatedRisk.tier,
        confidence: evaluatedRisk.confidence,
        rtoProbability: evaluatedRisk.rtoProbability,
        intentScore: evaluatedRisk.intentScore,
        riskEngineVersion: evaluatedRisk.riskEngineVersion,
        policyVersion: evaluatedDecision.policyVersion,
        paymentPolicy: evaluatedDecision.paymentPolicy,
        signalContributions: evaluatedRisk.contributions,
        evidence: evaluatedRisk.evidence,
        decision: evaluatedDecision.action,
        paymentMethods: evaluatedDecision.paymentMethods,
        aiAvailable: evaluatedRisk.aiAvailable,
        ringRisk: evaluatedRisk.ringRisk,
      };
      store.addAuditRecord(auditRecord);

      // 6. Record Live Activity event
      store.addEvent({
        id: `EVT_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'ORDER_RECEIVED',
        timestamp: Date.now(),
        description: `#${tx.orderNumber} | RTO ${rtoPercent}% | Risk ${evaluatedRisk.score} | ${evaluatedDecision.paymentPolicy.riskLevel} | ${evaluatedDecision.action}`,
        orderId: tx.id,
        metadata: {
          rtoProbability: rtoPercent,
          riskScore: evaluatedRisk.score,
          policy: evaluatedDecision.paymentPolicy.riskLevel,
        },
      });

      // 7. Non-blocking AI explanation handler
      aiPromise
        .then((aiRes) => {
          if (aiRes?.riskExplanation) {
            store.setActiveAnalysis({
              ...newCachedAnalysis,
              aiExplanation: aiRes.riskExplanation,
            });
          }
        })
        .catch(() => {
          // Graceful fallback
        })
        .finally(() => {
          setAiLoading(false);
        });

    } catch (err: any) {
      console.error('Analysis error:', err);
      setAnalysisError(err.message || 'Error occurred during risk evaluation.');
      store.setAnalysisState('error');
    } finally {
      isRunningRef.current = false;
    }
  }, [selectedTx, settings, store]);

  // Handle order completion from checkout preview
  const handleOrderCompleted = (method: PaymentMethod, finalAmount: number) => {
    if (!store.activeAnalysis) return;

    const { riskResult, decision } = store.activeAnalysis;

    const newOrder: Order = {
      id: selectedTx.id,
      customerId: selectedTx.customer.id,
      amount: finalAmount,
      paymentMethod: method,
      address: selectedTx.address,
      deviceId: selectedTx.deviceId,
      ipSubnet: selectedTx.ipSubnet,
      timestamp: Date.now(),
      riskScore: riskResult.score,
      rtoProbability: riskResult.rtoProbability,
      riskTier: riskResult.tier,
      evaluationId: riskResult.evaluationId,
      outcome: 'PENDING',
    };

    store.addOrder(newOrder);

    store.addEvent({
      id: `EVT_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'ORDER_COMPLETED',
      timestamp: Date.now(),
      description: `Order ${selectedTx.orderNumber} placed via ${method} (₹${finalAmount}) | Risk: ${riskResult.score}/100 [${decision.paymentPolicy.riskLevel}]`,
      orderId: selectedTx.id,
      metadata: { finalAmount, method, riskScore: riskResult.score },
    });

    setPlacedOrder({
      orderNumber: selectedTx.orderNumber,
      finalMethod: method,
      finalAmount,
    });
    setOrderPlaced(true);
  };

  // Handle closed-loop delivery outcome simulation
  const handleSimulateOutcome = (outcome: OutcomeType) => {
    if (!placedOrder || !store.activeAnalysis) return;

    const { riskResult, decision } = store.activeAnalysis;
    store.updateOrderOutcome(selectedTx.id, outcome, riskResult, decision);

    store.addEvent({
      id: `EVT_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'FEEDBACK_RECORDED',
      timestamp: Date.now(),
      description: `Delivery outcome recorded: ${outcome} for #${placedOrder.orderNumber}`,
      orderId: selectedTx.id,
    });
  };

  // STEP 33: [ ANALYZE ANOTHER TRANSACTION ]
  // Clears current analysis, resets checkout state, and returns to selection
  const handleResetForAnother = () => {
    store.clearAnalysis();
    setOrderPlaced(false);
    setPlacedOrder(null);
    setAnalysisError(null);
    setCompletedSteps([]);
    setCurrentStepIndex(-1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAnalyzing = store.analysisState === 'analyzing';
  const hasResult = store.analysisState === 'completed' && store.activeAnalysis !== null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      {/* Top Header Banner */}
      <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)] md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Transaction Risk Assessment
            </h1>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              POLICY-AWARE CHECKOUT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end evaluation: Select transaction → Real ML prediction → Dynamic payment policy enforcement.
          </p>
        </div>

        {/* Global Reset / New Analysis CTA if analysis is complete */}
        {hasResult && (
          <button
            onClick={handleResetForAnother}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors shadow-sm self-start md:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Analyze Another Transaction</span>
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[['01', 'Select'], ['02', 'Analyze'], ['03', 'Risk decision'], ['04', 'Checkout']].map(([number, label], index) => {
            const active = index === 0 || (index === 1 && isAnalyzing) || (index >= 2 && hasResult);
            const complete = (index === 0 && (isAnalyzing || hasResult)) || (index === 1 && hasResult);
            return <div key={number} className={`flex items-center gap-2 border-b-2 pb-3 text-xs ${active ? 'border-blue-600 text-blue-700' : 'border-slate-100 text-slate-400'}`}><span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{complete ? <Check className="h-3.5 w-3.5" /> : number}</span><span className="font-semibold capitalize">{label}</span></div>;
          })}
        </div>
      </div>

      {/* STEP 1: Demo Transaction Selector Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
        <TransactionSelector
          transactions={DEMO_TRANSACTIONS}
          selectedId={selectedTx.id}
          onSelect={handleSelectTransaction}
        />

        {/* Step 1 -> Step 2 Action Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            Selected: <strong className="text-slate-900 font-mono">ORDER #{selectedTx.orderNumber}</strong> ({selectedTx.customer.name}, ₹{selectedTx.orderAmount.toLocaleString('en-IN')})
          </div>

          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#0f172a] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-blue-700 disabled:bg-slate-400"
          >
            {isAnalyzing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing Transaction…</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Analyze Transaction</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* STEP 2: Analysis Pipeline Animation (Active during evaluation) */}
      {isAnalyzing && (
        <AnalysisAnimation
          stages={PIPELINE_STAGES}
          currentStepIndex={currentStepIndex}
          completedSteps={completedSteps}
          isEvaluating={isAnalyzing}
        />
      )}

      {/* Error state if any */}
      {analysisError && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>Risk analysis temporarily unavailable. The checkout remains protected by the existing fallback policy.</span>
        </div>
      )}

      {/* STEP 3 & 4: Transaction Risk Report + Dynamic Checkout */}
      {hasResult && store.activeAnalysis && (
        <div className="space-y-6 animate-fade-in">
          {/* Complete Risk Report */}
          <TransactionRiskReport
            transaction={selectedTx}
            riskResult={store.activeAnalysis.riskResult}
            decision={store.activeAnalysis.decision}
            aiExplanation={store.activeAnalysis.aiExplanation}
            aiLoading={aiLoading}
          />

          {/* STEP 5: Dynamic Checkout Preview OR Order Completed Outcome */}
          <div>
            {orderPlaced && placedOrder ? (
              <OrderOutcome
                orderNumber={placedOrder.orderNumber}
                customerName={selectedTx.customer.name}
                paymentMethod={placedOrder.finalMethod}
                finalAmount={placedOrder.finalAmount}
                riskResult={store.activeAnalysis.riskResult}
                decision={store.activeAnalysis.decision}
                onSimulateOutcome={handleSimulateOutcome}
                onReset={handleResetForAnother}
              />
            ) : (
              <CheckoutPreview
                orderId={selectedTx.id}
                orderAmount={selectedTx.orderAmount}
                productName={selectedTx.productName}
                decision={store.activeAnalysis.decision}
                onOrderCompleted={handleOrderCompleted}
              />
            )}
          </div>

          {/* STEP 30: Developer Diagnostics & Feature Audit Panel */}
          <DebugPanel
            transaction={selectedTx}
            riskResult={store.activeAnalysis.riskResult}
            decision={store.activeAnalysis.decision}
          />

          {/* Bottom Action: Analyze Another Transaction */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleResetForAnother}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow transition-colors uppercase tracking-wider"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Analyze Another Transaction</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
