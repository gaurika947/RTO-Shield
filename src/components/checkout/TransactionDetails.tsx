import React from 'react';
import { User, MapPin, Smartphone, History, Package } from 'lucide-react';
import type { Customer } from '../../types/customer';
import type { OrderAddress, PaymentMethod } from '../../types/order';
import type { DemoTransaction } from '../../data/demoTransactions';

interface Props {
  transaction: DemoTransaction;
  customer?: Customer;
  address: OrderAddress;
  paymentMethod: PaymentMethod;
  orderAmount: number;
}

export const TransactionDetails: React.FC<Props> = ({
  transaction,
  customer,
  address,
  paymentMethod,
  orderAmount,
}) => {
  const totalOrders = customer?.totalOrders ?? transaction.customer.totalOrders;
  const rtoOrders = customer?.rtoOrders ?? transaction.customer.rtoOrders;
  const deliveredOrders = customer?.successfulDeliveries ?? (totalOrders - rtoOrders);
  const rtoRate = totalOrders > 0 ? Math.round((rtoOrders / totalOrders) * 100) : 0;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-slate-100">{transaction.orderNumber}</span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300">
                {transaction.productName || 'E-Commerce Package'}
              </span>
            </div>
            <p className="text-xs text-slate-400">Transaction Input Context & Telemetry</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-slate-100">₹{orderAmount.toLocaleString('en-IN')}</div>
          <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-800 text-blue-400 border border-slate-700">
            {paymentMethod}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Customer Profile */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span>Buyer Profile</span>
          </div>
          <div className="space-y-1">
            <div className="text-slate-200 font-semibold text-sm">{transaction.customer.name}</div>
            <div className="text-slate-400 font-mono">{transaction.maskedPhone}</div>
            <div className="text-slate-500 font-mono text-[11px]">{transaction.maskedEmail}</div>
          </div>
        </div>

        {/* Delivery Address & Geo */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Shipping Destination</span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div className="line-clamp-1">{address.line1}</div>
            <div className="text-slate-400">
              {address.city}, {address.state} — <span className="font-mono text-slate-200">{address.pincode}</span>
            </div>
            {address.landmark && (
              <div className="text-[11px] text-slate-500 italic">Near {address.landmark}</div>
            )}
          </div>
        </div>

        {/* History & Network Context */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-medium text-slate-300">
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Prior Order Record</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Smartphone className="w-3 h-3 text-slate-500" />
              <span className="font-mono">{transaction.deviceId.slice(0, 10)}…</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 pt-1 text-center">
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400">Orders</div>
              <div className="font-bold text-slate-200">{totalOrders}</div>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400">Delivered</div>
              <div className="font-bold text-emerald-400">{deliveredOrders}</div>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400">RTO Rate</div>
              <div className={`font-bold ${rtoOrders > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                {rtoRate}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
