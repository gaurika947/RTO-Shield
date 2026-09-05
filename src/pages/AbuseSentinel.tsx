import { useState } from 'react';
import {
  Users,
  Smartphone,
  MapPin,
  X,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

interface ClusterEntity {
  id: string;
  name: string;
  type: 'CUSTOMER' | 'DEVICE' | 'ADDRESS' | 'PHONE' | 'ORDER';
  riskScore: number;
  trustScore?: number;
  rtoRate?: number;
  orderCount?: number;
  connections: number;
  x: number; // Percentage coordinate for constellation canvas
  y: number;
  linkedEntities: string[];
}

interface SuspiciousCluster {
  id: string;
  number: string;
  name: string;
  riskScore: number;
  accountsConnected: number;
  exposure: number;
  rtoRate: number;
  sharedEvidence: {
    device: string;
    address: string;
    phone: string;
    confidence: 'HIGH' | 'CRITICAL';
    ordersAssociated: number;
  };
  entities: ClusterEntity[];
}

const CLUSTERS: SuspiciousCluster[] = [
  {
    id: 'cluster_17',
    number: '#17',
    name: 'Sector 62 Device Multiplex',
    riskScore: 89,
    accountsConnected: 6,
    exposure: 48200,
    rtoRate: 84,
    sharedEvidence: {
      device: 'DEV_A01 (Hardware Fingerprint)',
      address: 'Plot 88, Sector 62, Noida (201301)',
      phone: 'Shared +91 98112-XXXXX identifier',
      confidence: 'HIGH',
      ordersAssociated: 17,
    },
    entities: [
      { id: 'CUS_A928', name: 'Aarav Mehta', type: 'CUSTOMER', riskScore: 82, trustScore: 31, rtoRate: 79, orderCount: 14, connections: 4, x: 28, y: 30, linkedEntities: ['DEV_A01', 'ADDR_62', 'PH_4421'] },
      { id: 'CUS_B102', name: 'Vikram Singh', type: 'CUSTOMER', riskScore: 94, trustScore: 18, rtoRate: 88, orderCount: 9, connections: 3, x: 72, y: 28, linkedEntities: ['DEV_A01', 'ADDR_62'] },
      { id: 'CUS_C309', name: 'Rohan Verma', type: 'CUSTOMER', riskScore: 78, trustScore: 42, rtoRate: 71, orderCount: 6, connections: 3, x: 24, y: 72, linkedEntities: ['DEV_A01', 'PH_4421'] },
      { id: 'CUS_D411', name: 'Kunal Joshi', type: 'CUSTOMER', riskScore: 86, trustScore: 24, rtoRate: 83, orderCount: 8, connections: 4, x: 76, y: 70, linkedEntities: ['DEV_A01', 'ADDR_62', 'PH_4421'] },
      { id: 'DEV_A01', name: 'Device Fingerprint A01', type: 'DEVICE', riskScore: 92, connections: 6, x: 50, y: 16, linkedEntities: ['CUS_A928', 'CUS_B102', 'CUS_C309', 'CUS_D411'] },
      { id: 'ADDR_62', name: 'Address Cluster 201301', type: 'ADDRESS', riskScore: 85, connections: 4, x: 86, y: 50, linkedEntities: ['CUS_A928', 'CUS_B102', 'CUS_D411'] },
      { id: 'PH_4421', name: 'Phone ending 4421', type: 'PHONE', riskScore: 80, connections: 3, x: 14, y: 50, linkedEntities: ['CUS_A928', 'CUS_C309', 'CUS_D411'] },
    ],
  },
  {
    id: 'cluster_21',
    number: '#21',
    name: 'Kankarbagh Address Farm',
    riskScore: 76,
    accountsConnected: 4,
    exposure: 19800,
    rtoRate: 72,
    sharedEvidence: {
      device: 'DEV_C03 Hardware Signature',
      address: 'House 14, Kankarbagh, Patna (800020)',
      phone: 'Rotating SIM Hash',
      confidence: 'HIGH',
      ordersAssociated: 11,
    },
    entities: [
      { id: 'CUS_E501', name: 'Arjun Mehta', type: 'CUSTOMER', riskScore: 74, trustScore: 45, rtoRate: 70, orderCount: 5, connections: 3, x: 30, y: 35, linkedEntities: ['DEV_C03', 'ADDR_KB'] },
      { id: 'CUS_F602', name: 'Manish Kumar', type: 'CUSTOMER', riskScore: 81, trustScore: 28, rtoRate: 78, orderCount: 7, connections: 3, x: 70, y: 35, linkedEntities: ['DEV_C03', 'ADDR_KB'] },
      { id: 'DEV_C03', name: 'Device Fingerprint C03', type: 'DEVICE', riskScore: 79, connections: 3, x: 50, y: 18, linkedEntities: ['CUS_E501', 'CUS_F602'] },
      { id: 'ADDR_KB', name: 'Address Kankarbagh', type: 'ADDRESS', riskScore: 80, connections: 2, x: 50, y: 82, linkedEntities: ['CUS_E501', 'CUS_F602'] },
    ],
  },
  {
    id: 'cluster_24',
    number: '#24',
    name: 'Raj Nagar Velocity Syndicate',
    riskScore: 71,
    accountsConnected: 3,
    exposure: 8200,
    rtoRate: 68,
    sharedEvidence: {
      device: 'DEV_D09 Mobile Pool',
      address: 'Sector 4, Raj Nagar Ext (201017)',
      phone: 'Shared OTP gateway',
      confidence: 'HIGH',
      ordersAssociated: 8,
    },
    entities: [
      { id: 'CUS_G701', name: 'Deepak Sharma', type: 'CUSTOMER', riskScore: 70, trustScore: 40, rtoRate: 65, orderCount: 4, connections: 2, x: 32, y: 40, linkedEntities: ['DEV_D09'] },
      { id: 'CUS_H802', name: 'Sanjay Rawat', type: 'CUSTOMER', riskScore: 72, trustScore: 35, rtoRate: 71, orderCount: 4, connections: 2, x: 68, y: 40, linkedEntities: ['DEV_D09'] },
      { id: 'DEV_D09', name: 'Device Pool D09', type: 'DEVICE', riskScore: 74, connections: 2, x: 50, y: 22, linkedEntities: ['CUS_G701', 'CUS_H802'] },
    ],
  },
];

export default function AbuseSentinel() {
  const [selectedClusterId, setSelectedClusterId] = useState<string>('cluster_17');
  const [selectedEntity, setSelectedEntity] = useState<ClusterEntity | null>(null);
  const [showWhyConnected, setShowWhyConnected] = useState(false);

  const activeCluster = CLUSTERS.find((c) => c.id === selectedClusterId) || CLUSTERS[0];

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-16 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest block mb-1">
            Abuse Sentinel
          </span>
          <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            Simulation mode
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Detect coordinated transaction abuse across connected accounts.
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Relationship intelligence mapping shared devices, address collisions, and syndicate rings.
          </p>
        </div>
      </div>

      {/* Top Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Active clusters</span>
          <span className="text-xl font-bold text-slate-900 font-mono mt-1 block">3</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Connected accounts</span>
          <span className="text-xl font-bold text-red-600 font-mono mt-1 block">18</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">High-risk links</span>
          <span className="text-xl font-bold text-amber-600 font-mono mt-1 block">7</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Potential exposure</span>
          <span className="text-xl font-bold text-slate-900 font-mono mt-1 block">₹48.2K</span>
        </div>
      </div>

      {/* PRIMARY VISUAL: RELATIONSHIP CONSTELLATION CANVAS */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        {/* Top Canvas Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">Select Cluster:</span>
            <div className="flex items-center gap-1.5">
              {CLUSTERS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedClusterId(c.id);
                    setSelectedEntity(null);
                    setShowWhyConnected(false);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedClusterId === c.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Cluster {c.number} (Risk {c.riskScore})
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowWhyConnected(!showWhyConnected)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>Why Connected?</span>
          </button>
        </div>

        {/* Constellation Canvas Viewport */}
        <div className="h-[440px] relative w-full rounded-xl bg-gradient-to-b from-slate-950 to-slate-900/60 flex items-center justify-center">
          {/* Subtle Background Radial Rings */}
          <div className="absolute w-72 h-72 rounded-full border border-slate-800/50 pointer-events-none" />
          <div className="absolute w-[420px] h-[420px] rounded-full border border-slate-800/30 pointer-events-none" />

          {/* SVG Connecting Relationship Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {activeCluster.entities.map((ent) => {
              return ent.linkedEntities.map((linkId) => {
                const target = activeCluster.entities.find((e) => e.id === linkId);
                if (!target) return null;
                return (
                  <line
                    key={`${ent.id}-${target.id}`}
                    x1={`${ent.x}%`}
                    y1={`${ent.y}%`}
                    x2={`${target.x}%`}
                    y2={`${target.y}%`}
                    stroke="#334155"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="opacity-70"
                  />
                );
              });
            })}
          </svg>

          {/* CENTER OF CLUSTER: Visual Anchor */}
          <div
            onClick={() => setSelectedEntity(null)}
            className="absolute z-10 p-4 rounded-xl bg-slate-900 border-2 border-red-500/80 shadow-[0_0_24px_rgba(239,68,68,0.25)] text-center cursor-pointer hover:border-red-400 transition-all transform hover:scale-105"
          >
            <span className="text-[10px] uppercase font-mono tracking-widest text-red-400 font-bold block">
              CLUSTER {activeCluster.number}
            </span>
            <div className="text-xl font-black text-white font-mono my-0.5">
              RISK {activeCluster.riskScore}
            </div>
            <span className="text-[11px] text-slate-300 font-medium block">
              {activeCluster.accountsConnected} accounts connected
            </span>
          </div>

          {/* CLUSTER NODES with DISTINCT MINIMAL SHAPES */}
          {activeCluster.entities.map((ent) => {
            const isSelected = selectedEntity?.id === ent.id;

            return (
              <div
                key={ent.id}
                onClick={() => {
                  setSelectedEntity(ent);
                  setShowWhyConnected(false);
                }}
                style={{ left: `${ent.x}%`, top: `${ent.y}%` }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              >
                {/* Node Shapes: Customer (circle), Device (rounded square), Address (diamond), Phone (pill) */}
                {ent.type === 'CUSTOMER' && (
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-mono font-bold text-xs shadow-lg transition-all transform group-hover:scale-115 ${
                      isSelected
                        ? 'bg-blue-500 text-white ring-4 ring-blue-400/40 shadow-blue-500/50'
                        : ent.riskScore >= 80
                        ? 'bg-red-950 text-red-300 border border-red-500 hover:bg-red-900'
                        : 'bg-slate-800 text-slate-200 border border-slate-600 hover:bg-slate-700'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                  </div>
                )}

                {ent.type === 'DEVICE' && (
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono text-xs shadow-lg transition-all transform group-hover:scale-115 ${
                      isSelected
                        ? 'bg-purple-600 text-white ring-4 ring-purple-400/40'
                        : 'bg-purple-950 text-purple-300 border border-purple-500/80 hover:bg-purple-900'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                  </div>
                )}

                {ent.type === 'ADDRESS' && (
                  <div
                    className={`w-9 h-9 rotate-45 rounded-md flex items-center justify-center font-mono text-xs shadow-lg transition-all transform group-hover:scale-115 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-900 ring-4 ring-amber-400/40'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/80 hover:bg-amber-900'
                    }`}
                  >
                    <MapPin className="w-4 h-4 -rotate-45" />
                  </div>
                )}

                {ent.type === 'PHONE' && (
                  <div
                    className={`px-2.5 py-1 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shadow-lg transition-all transform group-hover:scale-110 ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-400/40'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-500/80 hover:bg-cyan-900'
                    }`}
                  >
                    PH
                  </div>
                )}

                {/* Hover Label */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap pointer-events-none border border-slate-700">
                  {ent.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-600" />
              <span>Customer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-purple-600" />
              <span>Device</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rotate-45 bg-amber-500" />
              <span>Address</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-2 rounded-full bg-cyan-500" />
              <span>Phone</span>
            </div>
          </div>
          <span>Click any node to inspect relationship telemetry.</span>
        </div>
      </div>

      {/* CONTEXTUAL SLIDE-OUT PANEL (Right Drawer) */}
      {(selectedEntity || showWhyConnected) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-5 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                {showWhyConnected ? 'Relationship Evidence' : 'Contextual Entity Inspector'}
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {showWhyConnected
                  ? `Why are accounts connected in Cluster ${activeCluster.number}?`
                  : `${selectedEntity?.name} (${selectedEntity?.id})`}
              </h3>
            </div>

            <button
              onClick={() => {
                setSelectedEntity(null);
                setShowWhyConnected(false);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content: If Why Connected is open */}
          {showWhyConnected ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Confidence</span>
                  <span className="font-bold text-slate-900 text-sm">{activeCluster.sharedEvidence.confidence}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Associated Orders</span>
                  <span className="font-bold text-slate-900 text-sm">{activeCluster.sharedEvidence.ordersAssociated}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Historical RTO</span>
                  <span className="font-bold text-red-600 text-sm">{activeCluster.rtoRate}%</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <span className="font-bold text-slate-900 block text-xs">Direct Linkage Signals</span>
                <div className="p-3 rounded-xl bg-red-50/80 border border-red-200 space-y-1.5 text-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" />
                    <span><strong>Shared Device:</strong> {activeCluster.sharedEvidence.device}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" />
                    <span><strong>Shared Address:</strong> {activeCluster.sharedEvidence.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" />
                    <span><strong>Shared Phone Hash:</strong> {activeCluster.sharedEvidence.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Content: Selected Entity Details */
            selectedEntity && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Risk Score</span>
                    <span className="font-bold text-red-600 text-base">{selectedEntity.riskScore}%</span>
                  </div>
                  {selectedEntity.trustScore !== undefined && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Trust Score</span>
                      <span className="font-bold text-slate-900 text-base">{selectedEntity.trustScore}</span>
                    </div>
                  )}
                  {selectedEntity.rtoRate !== undefined && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">RTO Rate</span>
                      <span className="font-bold text-slate-900 text-base">{selectedEntity.rtoRate}%</span>
                    </div>
                  )}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Connections</span>
                    <span className="font-bold text-blue-600 text-base">{selectedEntity.connections}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-900 block text-[11px]">Connected Through:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedEntity.linkedEntities.map((link) => (
                      <span
                        key={link}
                        className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[11px] font-semibold text-slate-700"
                      >
                        • {link}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* SECONDARY VIEW: Suspicious Clusters Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Suspicious Syndicate Clusters
          </h3>
          <span className="text-xs text-slate-400">Total active clusters: 3</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {CLUSTERS.map((cl) => (
            <div
              key={cl.id}
              onClick={() => {
                setSelectedClusterId(cl.id);
                setSelectedEntity(null);
                setShowWhyConnected(false);
              }}
              className="py-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer px-2 rounded-lg transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 font-mono">Cluster {cl.number}</span>
                  <span className="text-slate-600">— {cl.name}</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {cl.accountsConnected} accounts connected • RTO concentration {cl.rtoRate}%
                </span>
              </div>

              <div className="text-right flex items-center gap-4">
                <div>
                  <span className="font-mono font-bold text-red-600 block">{cl.riskScore} Risk</span>
                  <span className="text-[11px] text-slate-500 font-mono">₹{(cl.exposure / 1000).toFixed(1)}k exposure</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
