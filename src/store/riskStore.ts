import { create } from 'zustand';
import type { Customer } from '../types/customer';
import type { Order } from '../types/order';
import type { RiskEvent } from '../types/events';
import type { NetworkNode, NetworkEdge } from '../types/network';
import type { AuditRecord, FeedbackRecord, RiskResult, DecisionResult, CachedAnalysis } from '../types/risk';
import { SEED_CUSTOMERS, SEED_ORDERS, buildNetworkFromData } from '../data/seedData';
import { saveState, loadState, STORAGE_KEY } from '../data/persistence';
import { classifyOutcome } from '../engine/feedbackEngine';
import { evolveCustomerTrustOnOutcome } from '../engine/trustEngine';

export type AnalysisState = 'idle' | 'selected' | 'analyzing' | 'completed' | 'error';

interface RiskStoreState {
  customers: Customer[];
  orders: Order[];
  riskEvents: RiskEvent[];
  networkNodes: NetworkNode[];
  networkEdges: NetworkEdge[];
  auditRecords: AuditRecord[];
  feedbackRecords: FeedbackRecord[];
  // Active demo workflow session state
  selectedTxId: string;
  analysisState: AnalysisState;
  activeAnalysis: CachedAnalysis | null;
}

interface RiskStoreActions {
  addOrder: (order: Order) => void;
  addEvent: (event: RiskEvent) => void;
  addAuditRecord: (record: AuditRecord) => void;
  updateOrderOutcome: (orderId: string, outcome: Order['outcome'], riskResult?: RiskResult, _decision?: DecisionResult) => void;
  addBulkOrders: (orders: Order[]) => void;
  rebuildNetwork: () => void;
  resetDemo: () => void;
  loadFromStorage: () => void;
  // Active demo workflow actions
  setSelectedTxId: (id: string) => void;
  setAnalysisState: (state: AnalysisState) => void;
  setActiveAnalysis: (analysis: CachedAnalysis | null) => void;
  clearAnalysis: () => void;
}

type RiskStore = RiskStoreState & RiskStoreActions;

function getInitialState(): RiskStoreState {
  const network = buildNetworkFromData(SEED_CUSTOMERS, SEED_ORDERS);
  return {
    customers: [...SEED_CUSTOMERS],
    orders: [...SEED_ORDERS],
    riskEvents: [],
    networkNodes: network.nodes,
    networkEdges: network.edges,
    auditRecords: [],
    feedbackRecords: [],
    selectedTxId: 'TX_10518',
    analysisState: 'selected',
    activeAnalysis: null,
  };
}

function persist(state: RiskStoreState) {
  saveState(STORAGE_KEY, {
    customers: state.customers,
    orders: state.orders,
    riskEvents: state.riskEvents,
    auditRecords: state.auditRecords,
    feedbackRecords: state.feedbackRecords,
  });
}

export const useRiskStore = create<RiskStore>((set) => ({
  ...getInitialState(),

  addOrder: (order) => set((state) => {
    const newState = { ...state, orders: [...state.orders, order] };
    persist(newState);
    return newState;
  }),

  addEvent: (event) => set((state) => {
    const newState = { ...state, riskEvents: [...state.riskEvents, event] };
    persist(newState);
    return newState;
  }),

  addAuditRecord: (record) => set((state) => {
    const newState = { ...state, auditRecords: [...state.auditRecords, record] };
    persist(newState);
    return newState;
  }),

  updateOrderOutcome: (orderId, outcome, riskResult) => set((state) => {
    const orders = state.orders.map(o =>
      o.id === orderId ? { ...o, outcome } : o
    );

    // Generate feedback record if we have risk data
    let feedbackRecords = [...state.feedbackRecords];
    const order = orders.find(o => o.id === orderId);
    if (order && riskResult) {
      const classification = classifyOutcome(riskResult.tier, outcome);
      if (classification) {
        feedbackRecords.push({
          id: `FB_${Date.now()}_${orderId}`,
          orderId,
          evaluationId: riskResult.evaluationId,
          predictedScore: riskResult.score,
          predictedTier: riskResult.tier,
          actualOutcome: outcome,
          classification,
          timestamp: Date.now(),
        });
      }
    }

    // Update audit record outcome
    const auditRecords = state.auditRecords.map(a =>
      a.orderId === orderId ? { ...a, outcome } : a
    );

    // Evolve customer trust profile
    let customers = state.customers;
    if (order) {
      const customer = customers.find((c) => c.id === order.customerId);
      if (customer) {
        const updatedCustomer = evolveCustomerTrustOnOutcome(customer, outcome, order.paymentMethod);
        customers = customers.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c));
      }
    }

    const newState = { ...state, orders, customers, feedbackRecords, auditRecords };
    persist(newState);
    return newState;
  }),

  addBulkOrders: (newOrders) => set((state) => {
    const newState = { ...state, orders: [...state.orders, ...newOrders] };
    persist(newState);
    return newState;
  }),

  rebuildNetwork: () => set((state) => {
    const network = buildNetworkFromData(state.customers, state.orders);
    return { ...state, networkNodes: network.nodes, networkEdges: network.edges };
  }),

  resetDemo: () => {
    const initial = getInitialState();
    persist(initial);
    set(initial);
  },

  loadFromStorage: () => {
    const saved = loadState<{
      customers: Customer[];
      orders: Order[];
      riskEvents: RiskEvent[];
      auditRecords: AuditRecord[];
      feedbackRecords: FeedbackRecord[];
    }>(STORAGE_KEY);

    if (saved && saved.orders && saved.orders.length > 0) {
      const network = buildNetworkFromData(saved.customers || SEED_CUSTOMERS, saved.orders);
      set({
        customers: saved.customers || SEED_CUSTOMERS,
        orders: saved.orders,
        riskEvents: saved.riskEvents || [],
        networkNodes: network.nodes,
        networkEdges: network.edges,
        auditRecords: saved.auditRecords || [],
        feedbackRecords: saved.feedbackRecords || [],
      });
    }
  },

  setSelectedTxId: (id) => set(() => ({ selectedTxId: id })),
  setAnalysisState: (analysisState) => set(() => ({ analysisState })),
  setActiveAnalysis: (activeAnalysis) => set(() => ({
    activeAnalysis,
    analysisState: activeAnalysis ? 'completed' : 'idle',
  })),
  clearAnalysis: () => set((state) => ({
    activeAnalysis: null,
    analysisState: state.selectedTxId ? 'selected' : 'idle',
  })),
}));
