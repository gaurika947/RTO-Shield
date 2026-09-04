import { useCallback, useState, useMemo } from 'react';
import { ReactFlow, Background, Controls, Panel, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Network, ShieldAlert, CheckCircle2, Info, X } from 'lucide-react';
import { useRiskStore } from '../store/riskStore';
import type { NetworkNode as NetNode } from '../types/network';

const NODE_COLORS: Record<string, string> = {
  CUSTOMER: '#3b82f6',
  DEVICE: '#8b5cf6',
  PHONE_HASH: '#06b6d4',
  EMAIL_HASH: '#10b981',
  ADDRESS_HASH: '#f59e0b',
  IP_SUBNET: '#ef4444',
  ORDER: '#64748b',
};

export default function NetworkSentinel() {
  const { networkNodes, networkEdges, customers, orders } = useRiskStore();
  const [selectedNode, setSelectedNode] = useState<NetNode | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<string>('RING_01');

  // Hardened, actionable abuse clusters
  const ABUSE_CLUSTERS = [
    {
      id: 'RING_01',
      name: 'Sector 62 Device Multiplex Cluster',
      ringRiskScore: 94,
      status: 'ACTIVE_SENTINEL',
      connectedAccounts: 6,
      sharedAddresses: 3,
      sharedDevices: 2,
      sharedPhones: 1,
      orders48h: 23,
      clusterRtoRate: 0.91,
      whyCluster: [
        '4 accounts share an identical physical delivery address',
        '3 accounts share a single hardware device fingerprint (DEV_A01)',
        '2 accounts share a common verified phone identifier',
        '23 high-velocity COD orders attempted in past 48 hours',
        'Cluster historical return-to-origin concentration: 91.3%',
      ],
    },
    {
      id: 'RING_02',
      name: 'Kankarbagh Address Farm',
      ringRiskScore: 78,
      status: 'MONITORED',
      connectedAccounts: 4,
      sharedAddresses: 1,
      sharedDevices: 1,
      sharedPhones: 2,
      orders48h: 11,
      clusterRtoRate: 0.82,
      whyCluster: [
        '4 customer identities routed to unnumbered address cluster',
        'Repeated high-ticket electronics COD orders refused at doorstep',
        'Shared IP Subnet with high cancellation velocity',
        'Cluster RTO rate: 81.8%',
      ],
    },
  ];

  const activeCluster = ABUSE_CLUSTERS.find((c) => c.id === selectedClusterId) || ABUSE_CLUSTERS[0];

  // Build React Flow nodes and edges
  const flowNodes: Node[] = useMemo(() => {
    const typeGroups: Record<string, number> = {};
    return networkNodes.slice(0, 80).map((n) => {
      if (!typeGroups[n.type]) typeGroups[n.type] = 0;
      typeGroups[n.type]++;

      const col = Object.keys(NODE_COLORS).indexOf(n.type);
      const row = typeGroups[n.type];

      return {
        id: n.id,
        position: { x: col * 180 + (row % 3) * 40, y: row * 75 },
        data: { label: n.label.length > 16 ? n.label.slice(0, 14) + '…' : n.label },
        style: {
          background: NODE_COLORS[n.type] || '#94a3b8',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '11px',
          padding: '6px 10px',
          fontWeight: 600,
          minWidth: 80,
          textAlign: 'center' as const,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      };
    });
  }, [networkNodes]);

  const flowEdges: Edge[] = useMemo(
    () =>
      networkEdges.slice(0, 120).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: e.relationship === 'USES_DEVICE',
        style: { stroke: '#94a3b8', strokeWidth: 1.2 },
      })),
    [networkEdges]
  );

  const handleNodeClick = useCallback(
    (_: any, node: Node) => {
      const netNode = networkNodes.find((n) => n.id === node.id);
      if (netNode) setSelectedNode(netNode);
    },
    [networkNodes]
  );

  // Node detail stats
  const nodeStats = useMemo(() => {
    if (!selectedNode) return null;
    const linked = networkEdges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id);
    const linkedCustomerIds = new Set<string>();
    const linkedOrderIds = new Set<string>();

    for (const e of linked) {
      const other = e.source === selectedNode.id ? e.target : e.source;
      const otherNode = networkNodes.find((n) => n.id === other);
      if (otherNode?.type === 'CUSTOMER') linkedCustomerIds.add(other);
      if (otherNode?.type === 'ORDER') linkedOrderIds.add(other);
    }

    const linkedCustomers = customers.filter((c) => linkedCustomerIds.has(c.id));
    const highRTO = linkedCustomers.filter((c) => c.rtoOrders / Math.max(c.totalOrders, 1) > 0.3);
    const linkedOrders = orders.filter((o) => linkedOrderIds.has(o.id));

    return {
      connections: linked.length,
      customers: linkedCustomerIds.size,
      orders: linkedOrderIds.size,
      highRTOAccounts: highRTO.length,
      rtoRate:
        linkedOrders.length > 0
          ? linkedOrders.filter((o) => o.outcome === 'RTO').length / linkedOrders.length
          : 0,
    };
  }, [selectedNode, networkEdges, networkNodes, customers, orders]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Network className="w-4 h-4" />
            <span>Abuse-Ring Sentinel & Graph Radar</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Abuse-Ring Radar
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Graph intelligence mapping multi-account clusters, device collisions, address farms, and repeat return syndicates.
          </p>
        </div>

        {/* Cluster Selector Pills */}
        <div className="flex items-center gap-2">
          {ABUSE_CLUSTERS.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedClusterId(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                selectedClusterId === c.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c.name} ({c.ringRiskScore}/100)
            </button>
          ))}
        </div>
      </div>

      {/* FEATURE 5: "WHY THIS CLUSTER?" Actionable Intelligence Panel */}
      <div className="card p-5 bg-gradient-to-br from-red-50/90 via-orange-50/50 to-white border-red-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-200/60 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{activeCluster.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white">
                  RING RISK {activeCluster.ringRiskScore}/100
                </span>
              </div>
              <span className="text-xs text-slate-600">
                {activeCluster.connectedAccounts} connected customer accounts • {activeCluster.orders48h} orders in 48h
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cluster RTO Rate</span>
              <span className="text-lg font-black text-red-700">{(activeCluster.clusterRtoRate * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Actionable Intelligence Explanation */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-red-950 uppercase tracking-wider block">
            WHY THIS CLUSTER? (Actionable Synthesis)
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {activeCluster.whyCluster.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2.5 rounded-lg bg-white/90 border border-red-200/70 text-slate-800"
              >
                <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Graph Grid & Node Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Graph Canvas (8 Cols) */}
        <div className="lg:col-span-8 card p-0 border-slate-200 overflow-hidden shadow-sm h-[580px] relative">
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            onNodeClick={handleNodeClick}
            fitView
            className="bg-slate-900"
          >
            <Background color="#334155" gap={20} size={1} />
            <Controls className="bg-white/90 text-slate-800 border-slate-200 shadow-sm" />
            <Panel position="top-left" className="bg-slate-950/80 backdrop-blur-md p-3 rounded-lg border border-slate-800 text-white text-xs space-y-1.5">
              <span className="font-bold text-[11px] uppercase text-slate-400 block">Entity Legend:</span>
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                {Object.entries(NODE_COLORS).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-slate-300 capitalize">{type.toLowerCase().replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Selected Node Inspection Drawer (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card p-5 border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Entity Inspector
              </h3>
              {selectedNode && (
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Entity ID & Type</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-slate-900 text-sm">{selectedNode.label}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: NODE_COLORS[selectedNode.type] }}>
                      {selectedNode.type}
                    </span>
                  </div>
                </div>

                {nodeStats && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-800 block text-[11px]">Direct Network Impact</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Connected Entities</span>
                        <span className="font-bold text-slate-900">{nodeStats.connections}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Linked Customers</span>
                        <span className="font-bold text-slate-900">{nodeStats.customers}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Linked Orders</span>
                        <span className="font-bold text-slate-900">{nodeStats.orders}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Cluster RTO Rate</span>
                        <span className="font-bold text-red-600">{(nodeStats.rtoRate * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <Info className="w-5 h-5 mx-auto text-slate-300" />
                <p>Click any node in the graph to inspect shared entity telemetry and cluster links.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
