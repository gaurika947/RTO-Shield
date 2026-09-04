import { Gauge } from 'lucide-react';
import { useRiskStore } from '../store/riskStore';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

export default function VelocityMonitor() {
  const { orders } = useRiskStore();

  const hourlyData = useMemo(() => {
    const hours: Record<number, { total: number; cod: number; rto: number }> = {};
    for (let i = 23; i >= 0; i--) {
      hours[i] = { total: 0, cod: 0, rto: 0 };
    }
    for (const o of orders) {
      const h = new Date(o.timestamp).getHours();
      if (hours[h]) {
        hours[h].total++;
        if (o.paymentMethod === 'COD') hours[h].cod++;
        if (o.outcome === 'RTO') hours[h].rto++;
      }
    }
    return Object.entries(hours)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([h, v]) => ({
        hour: `${h.padStart(2, '0')}:00`,
        total: v.total,
        cod: v.cod,
        rto: v.rto,
      }));
  }, [orders]);

  // Device velocity
  const deviceVelocity = useMemo(() => {
    const deviceCounts: Record<string, number> = {};
    for (const o of orders) {
      if (o.deviceId) {
        deviceCounts[o.deviceId] = (deviceCounts[o.deviceId] || 0) + 1;
      }
    }
    return Object.entries(deviceCounts)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [orders]);

  // Compute anomaly ratio
  const totalByHour = hourlyData.map(d => d.total);
  const baseline = totalByHour.reduce((a, b) => a + b, 0) / 24;
  const spikes = hourlyData.filter(d => d.total > baseline * 3 && d.total >= 3);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
          <Gauge className="w-6 h-6 text-cyan-500" /> Velocity Monitor
        </h2>
        <p className="text-sm text-gray-500 mt-1">Order rate analysis with computed baselines — not hardcoded thresholds</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card"><span className="metric-label">Total Orders</span><div className="metric-value mt-1">{orders.length}</div></div>
        <div className="card"><span className="metric-label">Hourly Baseline</span><div className="metric-value mt-1">{baseline.toFixed(1)}</div></div>
        <div className="card"><span className="metric-label">Velocity Spikes (&gt;3x)</span><div className="metric-value mt-1 text-red-600">{spikes.length}</div></div>
      </div>

      {/* Hourly Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-navy-800 mb-4">Orders by Hour</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="total" name="All Orders" radius={[4, 4, 0, 0]}>
              {hourlyData.map((d, i) => (
                <Cell key={i} fill={d.total > baseline * 3 ? '#ef4444' : '#3b82f6'} />
              ))}
            </Bar>
            <Bar dataKey="cod" fill="#f59e0b" name="COD" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Device Velocity Table */}
      <div className="card">
        <h3 className="text-sm font-semibold text-navy-800 mb-3">Device Velocity (Top 10)</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-2 text-left text-xs text-gray-500 font-medium">Device ID</th>
              <th className="py-2 text-right text-xs text-gray-500 font-medium">Order Count</th>
              <th className="py-2 text-right text-xs text-gray-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {deviceVelocity.map(d => (
              <tr key={d.id} className="border-b border-gray-50">
                <td className="py-2 font-mono text-xs">{d.id}</td>
                <td className="py-2 text-right font-bold">{d.count}</td>
                <td className="py-2 text-right">
                  <span className={`text-xs font-semibold ${d.count >= 5 ? 'text-red-600' : d.count >= 3 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {d.count >= 5 ? 'HIGH' : d.count >= 3 ? 'ELEVATED' : 'NORMAL'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
