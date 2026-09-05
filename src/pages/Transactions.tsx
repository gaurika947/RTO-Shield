import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  CheckCircle2,
  UserCheck,
  Network,
  Sliders,
} from 'lucide-react';
import { simulateCounterfactualRisk, simulateCounterfactualRiskAuthoritative } from '../engine/counterfactualEngine';
import type { Customer } from '../types/customer';
import type { CounterfactualResult } from '../types/common';

// Rich seed transactions for interactive demonstration
const SEED_TRANSACTIONS = [
  {
    id: '#RS-8921',
    customerName: 'Rahul Verma',
    customerId: 'CUS_992',
    amount: 4999,
    paymentMethod: 'COD',
    riskScore: 87,
    riskTier: 'CRITICAL',
    action: 'Prepaid Required',
    decisionAction: 'PREPAID_REQUIRED',
    status: 'Flagged',
    timestamp: '2 mins ago',
    city: 'Ghaziabad',
    pincode: '201017',
    address: 'Flat 88, Raj Nagar Extension',
    phone: '9876543210',
    signals: [
      { name: 'Historical RTO', impact: 'High', detail: '5 returns out of 7 total orders' },
      { name: 'Pincode Risk', impact: 'Elevated', detail: 'High return rate cluster (201017)' },
      { name: 'Address Changes', impact: '3 recent', detail: 'Frequent address switching' },
      { name: 'Checkout Behavior', impact: 'Unusual', detail: 'Rapid order placement cadence' },
    ],
    customer: {
      id: 'CUS_992',
      name: 'Rahul Verma',
      phoneHash: 'ph_992',
      emailHash: 'em_992',
      totalOrders: 7,
      successfulDeliveries: 2,
      rtoOrders: 5,
      cancelledOrders: 0,
      codOrders: 7,
      prepaidOrders: 0,
      averageOrderValue: 4999,
      knownDevices: ['DEV_A01'],
      knownAddresses: ['ADDR_A01'],
      createdAt: Date.now() - 60 * 86400_000,
      trustScore: 29,
    },
    clusterId: 'RING_01',
    clusterName: 'Sector 62 Multiplex',
  },
  {
    id: '#RS-8922',
    customerName: 'Ananya Deshmukh',
    customerId: 'CUS_104',
    amount: 1299,
    paymentMethod: 'COD',
    riskScore: 12,
    riskTier: 'LOW',
    action: 'None (Allow COD)',
    decisionAction: 'ALLOW_COD',
    status: 'Delivered',
    timestamp: '5 mins ago',
    city: 'Bengaluru',
    pincode: '560001',
    address: '42, Indiranagar 100ft Road',
    phone: '9845012345',
    signals: [
      { name: 'Delivery History', impact: 'Flawless', detail: '14 successful deliveries' },
      { name: 'Address Stability', impact: '8 months', detail: 'Consistent residence profile' },
      { name: 'Phone Verified', impact: 'Verified', detail: 'Valid verified mobile identity' },
      { name: 'Network Record', impact: 'Clean', detail: 'No multi-account links' },
    ],
    customer: {
      id: 'CUS_104',
      name: 'Ananya Deshmukh',
      phoneHash: 'ph_104',
      emailHash: 'em_104',
      totalOrders: 15,
      successfulDeliveries: 14,
      rtoOrders: 0,
      cancelledOrders: 1,
      codOrders: 4,
      prepaidOrders: 11,
      averageOrderValue: 2450,
      knownDevices: ['DEV_B02'],
      knownAddresses: ['ADDR_B02'],
      createdAt: Date.now() - 240 * 86400_000,
      trustScore: 94,
    },
    clusterId: null,
    clusterName: null,
  },
  {
    id: '#RS-8923',
    customerName: 'Arjun Mehta',
    customerId: 'CUS_582',
    amount: 3499,
    paymentMethod: 'COD',
    riskScore: 64,
    riskTier: 'HIGH',
    action: 'Verify & Incentive',
    decisionAction: 'VERIFY_OR_PREPAID',
    status: 'Pending OTP',
    timestamp: '12 mins ago',
    city: 'Patna',
    pincode: '800020',
    address: 'House 14, Kankarbagh Main Rd',
    phone: '9123456780',
    signals: [
      { name: 'Order Value', impact: 'Above Avg', detail: '₹3,499 COD threshold triggered' },
      { name: 'Landmark', impact: 'Missing', detail: 'No delivery landmark provided' },
      { name: 'Account Age', impact: 'New User', detail: 'First order on new phone ID' },
      { name: 'Pincode Zone', impact: 'Moderate Risk', detail: '18% historical return baseline' },
    ],
    customer: {
      id: 'CUS_582',
      name: 'Arjun Mehta',
      phoneHash: 'ph_582',
      emailHash: 'em_582',
      totalOrders: 2,
      successfulDeliveries: 1,
      rtoOrders: 1,
      cancelledOrders: 0,
      codOrders: 2,
      prepaidOrders: 0,
      averageOrderValue: 3100,
      knownDevices: ['DEV_C03'],
      knownAddresses: ['ADDR_C03'],
      createdAt: Date.now() - 20 * 86400_000,
      trustScore: 58,
    },
    clusterId: 'RING_02',
    clusterName: 'Kankarbagh Address Farm',
  },
  {
    id: '#RS-8924',
    customerName: 'Pooja Iyer',
    customerId: 'CUS_302',
    amount: 2199,
    paymentMethod: 'UPI',
    riskScore: 21,
    riskTier: 'LOW',
    action: 'None (Allow)',
    decisionAction: 'ALLOW_ALL',
    status: 'Completed',
    timestamp: '18 mins ago',
    city: 'Mumbai',
    pincode: '400050',
    address: 'Sea View Towers, Bandra West',
    phone: '9988776655',
    signals: [
      { name: 'Prepaid Payment', impact: 'Zero Risk', detail: 'UPI payment cleared upfront' },
      { name: 'Address Quality', impact: 'High Precision', detail: 'Verified society & building' },
      { name: 'Customer History', impact: 'Good', detail: '6 deliveries, 1 return' },
    ],
    customer: {
      id: 'CUS_302',
      name: 'Pooja Iyer',
      phoneHash: 'ph_302',
      emailHash: 'em_302',
      totalOrders: 7,
      successfulDeliveries: 6,
      rtoOrders: 1,
      cancelledOrders: 0,
      codOrders: 2,
      prepaidOrders: 5,
      averageOrderValue: 2800,
      knownDevices: ['DEV_D04'],
      knownAddresses: ['ADDR_D04'],
      createdAt: Date.now() - 150 * 86400_000,
      trustScore: 88,
    },
    clusterId: null,
    clusterName: null,
  },
  {
    id: '#RS-8925',
    customerName: 'Vikram Singh',
    customerId: 'CUS_771',
    amount: 5899,
    paymentMethod: 'COD',
    riskScore: 94,
    riskTier: 'CRITICAL',
    action: 'Prepaid Required',
    decisionAction: 'PREPAID_REQUIRED',
    status: 'Intercepted',
    timestamp: '25 mins ago',
    city: 'Noida',
    pincode: '201301',
    address: 'C-Block, Sector 62',
    phone: '9811223344',
    signals: [
      { name: 'Abuse Ring Collision', impact: 'Active Ring', detail: 'Linked to DEV_A01 hardware cluster' },
      { name: 'Velocity Burst', impact: 'Critical', detail: '4th order attempted in 30 mins' },
      { name: 'High Value', impact: 'Elevated', detail: '₹5,899 electronics COD order' },
      { name: 'Cluster Return Rate', impact: '91.3%', detail: 'Historical RTO syndicate rate' },
    ],
    customer: {
      id: 'CUS_771',
      name: 'Vikram Singh',
      phoneHash: 'ph_771',
      emailHash: 'em_771',
      totalOrders: 9,
      successfulDeliveries: 1,
      rtoOrders: 8,
      cancelledOrders: 0,
      codOrders: 9,
      prepaidOrders: 0,
      averageOrderValue: 5200,
      knownDevices: ['DEV_A01'],
      knownAddresses: ['ADDR_A01'],
      createdAt: Date.now() - 40 * 86400_000,
      trustScore: 18,
    },
    clusterId: 'RING_01',
    clusterName: 'Sector 62 Multiplex',
  },
];

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'LOW'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'COD' | 'UPI'>('ALL');
  const [selectedTx, setSelectedTx] = useState<typeof SEED_TRANSACTIONS[0] | null>(null);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'risk' | 'customer' | 'network'>('overview');

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return SEED_TRANSACTIONS.filter((tx) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          tx.id.toLowerCase().includes(q) ||
          tx.customerName.toLowerCase().includes(q) ||
          tx.city.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (riskFilter !== 'ALL') {
        if (riskFilter === 'CRITICAL' && tx.riskTier !== 'CRITICAL') return false;
        if (riskFilter === 'HIGH' && tx.riskTier !== 'HIGH') return false;
        if (riskFilter === 'LOW' && tx.riskTier !== 'LOW') return false;
      }
      if (paymentFilter !== 'ALL' && tx.paymentMethod !== paymentFilter) return false;
      return true;
    });
  }, [searchQuery, riskFilter, paymentFilter]);

  // Counterfactual simulation state inside drawer
  const [cfToggles, setCfToggles] = useState({
    phoneVerification: false,
    prepaidPayment: false,
    verifiedAddress: false,
    removeSuspiciousNetwork: false,
  });

  const [authoritativeResult, setAuthoritativeResult] = useState<CounterfactualResult | null>(null);

  useEffect(() => {
    if (!selectedTx) return;
    let isCancelled = false;
    simulateCounterfactualRiskAuthoritative(
      selectedTx.customer as Customer,
      { line1: selectedTx.address, city: selectedTx.city, state: 'State', pincode: selectedTx.pincode },
      selectedTx.amount,
      selectedTx.paymentMethod as any,
      'DEV_ACTIVE',
      cfToggles
    ).then((res) => {
      if (!isCancelled) {
        setAuthoritativeResult(res);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [selectedTx, cfToggles]);

  const fallbackResult = useMemo(() => {
    if (!selectedTx) return null;
    return simulateCounterfactualRisk(
      selectedTx.customer as Customer,
      { line1: selectedTx.address, city: selectedTx.city, state: 'State', pincode: selectedTx.pincode },
      selectedTx.amount,
      selectedTx.paymentMethod as any,
      'DEV_ACTIVE',
      cfToggles
    );
  }, [selectedTx, cfToggles]);

  const counterfactualResult = authoritativeResult || fallbackResult;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest block mb-1">
            Transaction Workspace
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transactions</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            24,892 orders analyzed • Review and evaluate transaction risk telemetry.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Order ID, Customer, or City..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Risk Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold px-1.5 uppercase">Risk:</span>
            {(['ALL', 'CRITICAL', 'HIGH', 'LOW'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  riskFilter === r
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Payment Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold px-1.5 uppercase">Payment:</span>
            {(['ALL', 'COD', 'UPI'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPaymentFilter(p)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  paymentFilter === p
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Spacious Transaction Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <th className="py-3 px-4 font-semibold">Order</th>
              <th className="py-3 px-4 font-semibold">Customer</th>
              <th className="py-3 px-4 font-semibold">Value</th>
              <th className="py-3 px-4 font-semibold">Risk Score</th>
              <th className="py-3 px-4 font-semibold">Recommended Action</th>
              <th className="py-3 px-4 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredTransactions.map((tx) => (
              <tr
                key={tx.id}
                onClick={() => {
                  setSelectedTx(tx);
                  setDrawerTab('overview');
                }}
                className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${
                  selectedTx?.id === tx.id ? 'bg-blue-50/70' : ''
                }`}
              >
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                  {tx.id}
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900">{tx.customerName}</div>
                  <div className="text-[10px] text-slate-400">{tx.city}</div>
                </td>
                <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                  ₹{tx.amount.toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 font-normal">{tx.paymentMethod}</span>
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      tx.riskScore >= 70
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : tx.riskScore >= 40
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {tx.riskScore}% {tx.riskTier}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-700">
                  {tx.action}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ORDER DETAIL SLIDE-OUT DRAWER */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-2xs animate-fade-in">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-slide-left">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-base">{selectedTx.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedTx.riskScore >= 70 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {selectedTx.riskTier} RISK
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedTx.customerName} • ₹{selectedTx.amount.toLocaleString('en-IN')} {selectedTx.paymentMethod}
                </p>
              </div>

              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation Tabs */}
            <div className="flex items-center border-b border-slate-200 px-5 text-xs bg-white">
              {(['overview', 'risk', 'customer', 'network'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDrawerTab(t)}
                  className={`py-3 px-4 font-semibold capitalize border-b-2 transition-all ${
                    drawerTab === t
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t === 'risk' ? 'Risk Analysis' : t}
                </button>
              ))}
            </div>

            {/* Drawer Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* TAB 1: OVERVIEW */}
              {drawerTab === 'overview' && (
                <div className="space-y-6">
                  {/* Hero Risk Indicator */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">RTO Risk Score</span>
                      <div className="text-3xl font-black text-slate-900 font-mono mt-0.5">{selectedTx.riskScore}%</div>
                      <span className="text-xs font-semibold text-red-600">{selectedTx.riskTier}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Recommended Action</span>
                      <span className="text-sm font-bold text-blue-700 block mt-1">{selectedTx.action}</span>
                      <span className="text-[11px] text-slate-500">Zero customer friction policy</span>
                    </div>
                  </div>

                  {/* Why this score? (Top 4 signals) */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                      Why this score? (Key Signals)
                    </span>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                      {selectedTx.signals.map((sig, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <span className="font-bold text-slate-900 block">{sig.name}</span>
                            <span className="text-[11px] text-slate-500">{sig.detail}</span>
                          </div>
                          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {sig.impact}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Information */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-900 block">Delivery Destination</span>
                    <p className="text-slate-600">{selectedTx.address}, {selectedTx.city} - {selectedTx.pincode}</p>
                    <p className="text-slate-500 text-[11px]">Phone: +91 {selectedTx.phone}</p>
                  </div>
                </div>
              )}

              {/* TAB 2: RISK ANALYSIS (Counterfactuals & Interventions) */}
              {drawerTab === 'risk' && (
                <div className="space-y-6">
                  {/* Counterfactual What-If Simulator */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-slate-900 text-xs">AI Counterfactual Risk Simulation</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Simulate hypothetical merchant interventions to see projected point reductions:
                    </p>

                    {/* Interactive Toggles */}
                    <div className="space-y-2">
                      {[
                        { key: 'phoneVerification', label: 'Verify Phone OTP' },
                        { key: 'prepaidPayment', label: 'Switch to Prepaid (UPI / Card)' },
                        { key: 'verifiedAddress', label: 'Verified Complete Address & Landmark' },
                        { key: 'removeSuspiciousNetwork', label: 'Disassociate Multi-Account Cluster' },
                      ].map((item, index) => (
                        <label
                          key={item.key}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer"
                        >
                          <span className="font-medium text-slate-800">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-emerald-600 font-bold font-mono">↓ {counterfactualResult?.detailedDeltas[index]?.deltaPoints ?? 0} pts</span>
                            <input
                              type="checkbox"
                              checked={(cfToggles as any)[item.key]}
                              onChange={(e) =>
                                setCfToggles((prev) => ({ ...prev, [item.key]: e.target.checked }))
                              }
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Simulation Delta */}
                    {counterfactualResult && (
                      <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-blue-700 block uppercase font-semibold">Projected Score</span>
                            <span className="text-xl font-black text-slate-900 font-mono">
                              {counterfactualResult.projectedRiskScore}%
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-emerald-700 font-bold uppercase block">Risk Reduction</span>
                            <span className="text-base font-bold text-emerald-700 font-mono">
                              ↓ {counterfactualResult.pointsReduction} pts
                            </span>
                          </div>
                        </div>
                        <div className="pt-1.5 border-t border-blue-200/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Inference: {counterfactualResult.modelSource === 'artifact' ? 'Authoritative GBDT Artifact' : 'Deterministic Fallback'}</span>
                          {counterfactualResult.direction && (
                            <span className={counterfactualResult.direction === 'DECREASE' ? 'text-emerald-600 font-bold' : 'text-slate-600'}>
                              {counterfactualResult.direction === 'DECREASE' ? 'Risk Reduced' : 'Neutral'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: CUSTOMER (Trust Passport) */}
              {drawerTab === 'customer' && (
                <div className="space-y-6">
                  {/* Trust Passport Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-md space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-emerald-400" />
                        <h4 className="font-bold text-sm">Customer Trust Passport</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        {selectedTx.customer.trustScore >= 80 ? 'VERY HIGH TRUST' : selectedTx.customer.trustScore >= 50 ? 'MODERATE TRUST' : 'LOW TRUST'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Trust Score</span>
                        <span className="text-2xl font-black text-white font-mono">{selectedTx.customer.trustScore}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Delivery Rate</span>
                        <span className="text-2xl font-black text-emerald-400 font-mono">
                          {selectedTx.customer.totalOrders > 0
                            ? `${((selectedTx.customer.successfulDeliveries / selectedTx.customer.totalOrders) * 100).toFixed(0)}%`
                            : '100%'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-300">
                      <div className="flex justify-between py-1 border-b border-white/10">
                        <span>Successful Deliveries:</span>
                        <span className="font-bold text-white">{selectedTx.customer.successfulDeliveries} orders</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/10">
                        <span>Return-to-Origin (RTOs):</span>
                        <span className="font-bold text-red-300">{selectedTx.customer.rtoOrders} returns</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Account Age:</span>
                        <span className="font-bold text-white">8 months</span>
                      </div>
                    </div>
                  </div>

                  {/* Trust Timeline */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                      Trust History Timeline
                    </span>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>Jan (85)</span>
                      <span>→</span>
                      <span>Mar (89)</span>
                      <span>→</span>
                      <span>May (91)</span>
                      <span>→</span>
                      <span className="font-bold text-slate-900">Current ({selectedTx.customer.trustScore})</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: NETWORK (Abuse Sentinel) */}
              {drawerTab === 'network' && (
                <div className="space-y-6">
                  {selectedTx.clusterId ? (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <Network className="w-5 h-5 text-red-600" />
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">Abuse Ring Detected</h4>
                          <span className="text-[11px] text-red-700">{selectedTx.clusterName}</span>
                        </div>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        This customer shares hardware device signatures and delivery coordinates with 6 other accounts with an 84% historical RTO concentration.
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                      <h4 className="font-bold text-slate-900 text-xs">Clean Network Record</h4>
                      <p className="text-slate-600 text-[11px]">
                        No multi-account collisions, shared device hashes, or suspicious return syndicates detected.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
