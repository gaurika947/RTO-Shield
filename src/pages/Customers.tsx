import { useState, useMemo } from 'react';
import {
  Search,
  UserCheck,
  X,
} from 'lucide-react';

// Enriched customer profiles for trust directory
const DEMO_CUSTOMERS = [
  {
    id: 'CUS_101',
    name: 'Priya Sharma',
    phone: '9845012345',
    email: 'priya.sharma@example.com',
    trustScore: 94,
    trustLevel: 'VERY_HIGH',
    rtoRate: 0,
    totalOrders: 15,
    successfulDeliveries: 15,
    rtoOrders: 0,
    cancelledOrders: 0,
    avgOrderValue: 2499,
    accountAgeMonths: 14,
    addressStabilityMonths: 14,
    timeline: [
      { month: 'Jan', score: 86 },
      { month: 'Mar', score: 89 },
      { month: 'May', score: 92 },
      { month: 'Jul', score: 94 },
    ],
  },
  {
    id: 'CUS_102',
    name: 'Ananya Deshmukh',
    phone: '9820123456',
    email: 'ananya.d@example.com',
    trustScore: 88,
    trustLevel: 'HIGH',
    rtoRate: 7,
    totalOrders: 14,
    successfulDeliveries: 13,
    rtoOrders: 1,
    cancelledOrders: 0,
    avgOrderValue: 1850,
    accountAgeMonths: 11,
    addressStabilityMonths: 9,
    timeline: [
      { month: 'Feb', score: 82 },
      { month: 'Apr', score: 85 },
      { month: 'Jun', score: 88 },
    ],
  },
  {
    id: 'CUS_103',
    name: 'Neha Kapoor',
    phone: '9810198765',
    email: 'neha.kapoor@example.com',
    trustScore: 68,
    trustLevel: 'MODERATE',
    rtoRate: 25,
    totalOrders: 8,
    successfulDeliveries: 6,
    rtoOrders: 2,
    cancelledOrders: 0,
    avgOrderValue: 1899,
    accountAgeMonths: 6,
    addressStabilityMonths: 5,
    timeline: [
      { month: 'Mar', score: 62 },
      { month: 'May', score: 65 },
      { month: 'Jul', score: 68 },
    ],
  },
  {
    id: 'CUS_104',
    name: 'Arjun Mehta',
    phone: '9123456780',
    email: 'arjun.mehta@example.com',
    trustScore: 58,
    trustLevel: 'MODERATE',
    rtoRate: 33,
    totalOrders: 3,
    successfulDeliveries: 2,
    rtoOrders: 1,
    cancelledOrders: 0,
    avgOrderValue: 3499,
    accountAgeMonths: 3,
    addressStabilityMonths: 3,
    timeline: [
      { month: 'May', score: 50 },
      { month: 'Jul', score: 58 },
    ],
  },
  {
    id: 'CUS_105',
    name: 'Rahul Verma',
    phone: '9876543210',
    email: 'rahul.verma@example.com',
    trustScore: 29,
    trustLevel: 'LOW',
    rtoRate: 71,
    totalOrders: 7,
    successfulDeliveries: 2,
    rtoOrders: 5,
    cancelledOrders: 0,
    avgOrderValue: 4999,
    accountAgeMonths: 4,
    addressStabilityMonths: 2,
    timeline: [
      { month: 'Apr', score: 48 },
      { month: 'May', score: 38 },
      { month: 'Jun', score: 29 },
    ],
  },
  {
    id: 'CUS_106',
    name: 'Aarav Mehta',
    phone: '9811223344',
    email: 'aarav.mehta@example.com',
    trustScore: 18,
    trustLevel: 'LOW',
    rtoRate: 88,
    totalOrders: 9,
    successfulDeliveries: 1,
    rtoOrders: 8,
    cancelledOrders: 0,
    avgOrderValue: 5200,
    accountAgeMonths: 2,
    addressStabilityMonths: 1,
    timeline: [
      { month: 'May', score: 32 },
      { month: 'Jun', score: 18 },
    ],
  },
];

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<typeof DEMO_CUSTOMERS[0] | null>(null);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return DEMO_CUSTOMERS;
    const q = searchQuery.toLowerCase();
    return DEMO_CUSTOMERS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest block mb-1">
            Customer Intelligence
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Who can I trust?</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Customer Trust Passports evaluated on delivery success rates and longitudinal stability.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search customers by name, phone, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-xs"
        />
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <th className="py-3 px-4 font-semibold">Customer</th>
              <th className="py-3 px-4 font-semibold">Trust Score</th>
              <th className="py-3 px-4 font-semibold">Delivery Success Rate</th>
              <th className="py-3 px-4 font-semibold">Order Volume</th>
              <th className="py-3 px-4 font-semibold text-right">Account Age</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredCustomers.map((cust) => (
              <tr
                key={cust.id}
                onClick={() => setSelectedCustomer(cust)}
                className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${
                  selectedCustomer?.id === cust.id ? 'bg-blue-50/70' : ''
                }`}
              >
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900">{cust.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{cust.phone}</div>
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      cust.trustScore >= 80
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : cust.trustScore >= 50
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {cust.trustScore} / 100 {cust.trustLevel.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-700">
                  {100 - cust.rtoRate}% ({cust.successfulDeliveries} delivered / {cust.rtoOrders} RTO)
                </td>
                <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                  {cust.totalOrders} orders
                </td>
                <td className="py-3.5 px-4 text-right text-slate-500 font-semibold">
                  {cust.accountAgeMonths} months
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DEDICATED TRUST PASSPORT DRAWER */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-2xs animate-fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-slide-left">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedCustomer.phone}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Trust Badge Hero */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Customer Trust Score
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    {selectedCustomer.trustLevel}
                  </span>
                </div>

                <div className="text-center py-2">
                  <div className="text-5xl font-black text-white font-mono">{selectedCustomer.trustScore}</div>
                  <span className="text-xs text-slate-300 font-medium mt-1 block">out of 100 maximum trust</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block">Deliveries</span>
                    <span className="font-bold text-white text-base">{selectedCustomer.successfulDeliveries}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block">RTOs</span>
                    <span className="font-bold text-red-300 text-base">{selectedCustomer.rtoOrders}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Track Record */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-900 block">Longitudinal Track Record</span>
                <div className="space-y-1 text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span>Delivery Success Rate:</span>
                    <span className="font-bold text-slate-900 font-mono">{100 - selectedCustomer.rtoRate}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span>Account Age:</span>
                    <span className="font-bold text-slate-900">{selectedCustomer.accountAgeMonths} months</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span>Address Stability:</span>
                    <span className="font-bold text-slate-900">{selectedCustomer.addressStabilityMonths} months</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Average Order Value:</span>
                    <span className="font-bold text-slate-900 font-mono">₹{selectedCustomer.avgOrderValue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Trust Timeline */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Trust Evolution Timeline
                </span>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between font-mono">
                  {selectedCustomer.timeline.map((point, idx) => (
                    <div key={idx} className="text-center">
                      <span className="text-[10px] text-slate-400 block">{point.month}</span>
                      <span className="font-bold text-slate-900 text-xs">{point.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
