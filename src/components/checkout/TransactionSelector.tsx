import { Package, Clock } from 'lucide-react';
import type { DemoTransaction } from '../../data/demoTransactions';

interface Props {
  transactions: DemoTransaction[];
  selectedId: string | null;
  onSelect: (tx: DemoTransaction) => void;
}

export function TransactionSelector({ transactions, selectedId, onSelect }: Props) {
  return (
    <section className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Demo Transactions
          </h2>
          <p className="text-xs text-slate-500">
            Select a synthetic transaction to evaluate RTO risk. Risk is calculated dynamically by the model.
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded self-start sm:self-auto">
          Synthetic Demo Data
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {transactions.map((tx) => {
          const isSelected = selectedId === tx.id;
          const isNew = tx.customer.totalOrders === 0;

          return (
            <div
              key={tx.id}
              onClick={() => onSelect(tx)}
              className={`text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[11px] font-mono font-bold text-slate-500 tracking-wider">
                    ORDER #{tx.orderNumber}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    {tx.timeAgo}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-0.5">
                  {tx.customer.name}
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  {tx.address.city}, {tx.address.state}
                </p>

                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                  <span className="text-sm font-black text-slate-900 tabular-nums">
                    ₹{tx.orderAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {tx.paymentMethod === 'COD' ? 'Cash on Delivery' : tx.paymentMethod}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-slate-600 mb-4">
                  {isNew ? (
                    <div className="text-slate-500">First order (New customer)</div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1 text-slate-600">
                        <Package className="w-3 h-3 text-slate-400" />
                        <span>{tx.customer.totalOrders} previous orders</span>
                      </div>
                      <div className="text-slate-600">
                        {tx.customer.rtoOrders} previous RTO
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(tx);
                  }}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isSelected ? '✓ Selected' : 'Select'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
