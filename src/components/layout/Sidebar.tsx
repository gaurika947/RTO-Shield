import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Activity,
  Radio,
  Network,
  Gauge,
  BarChart3,
  ClipboardList,
  Settings,
  Cpu,
  ChevronDown,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { ModelStatusModal } from './ModelStatusModal';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function BrandMark() {
  return (
    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 ring-1 ring-blue-400/30">
      <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
        <path d="M16 2.8 26.2 7v8.2c0 6.2-4.1 11.1-10.2 14C9.9 26.3 5.8 21.4 5.8 15.2V7L16 2.8Z" fill="#102a4a" stroke="#7dd3fc" strokeWidth="1.5" />
        <path d="M10.3 15.5h3.8l1.9-4.2 2.1 8 2-4.1h2.1" fill="none" stroke="#f0f9ff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.55" />
        <circle cx="10.3" cy="15.5" r="1.2" fill="#34d399" />
        <circle cx="22.2" cy="15.2" r="1.2" fill="#60a5fa" />
      </svg>
    </div>
  );
}

export function Sidebar({ collapsed, mobileOpen, onToggle, onClose }: SidebarProps) {
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const location = useLocation();

  const isRiskIntelligenceActive =
    location.pathname.startsWith('/live-risk') ||
    location.pathname.startsWith('/network') ||
    location.pathname.startsWith('/velocity') ||
    location.pathname.startsWith('/risk-intelligence');

  const [riskMenuOpen, setRiskMenuOpen] = useState(true);

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity lg:hidden ${mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={onClose} />
      <aside aria-label="Primary navigation" className={`fixed left-0 top-0 bottom-0 bg-[#071426] text-white flex flex-col z-50 border-r border-white/10 shadow-2xl transition-[width,transform] duration-200 ${collapsed ? 'lg:w-[72px]' : 'lg:w-60'} w-72 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Brand Header */}
        <div className="h-[76px] px-4 flex items-center gap-3 border-b border-white/10 bg-[#0b1b32]/70">
          <BrandMark />
          <div className={`${collapsed ? 'lg:hidden' : ''}`}>
            <h1 className="text-[11px] font-bold tracking-[0.16em] text-white uppercase">RTO SHIELD</h1>
            <p className="mt-1 max-w-[155px] text-[9px] font-medium leading-tight tracking-[0.08em] text-blue-200/60">SEE THE RISK BEFORE IT RETURNS</p>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden text-slate-400 hover:text-white" aria-label="Close navigation"><X className="h-5 w-5" /></button>
        </div>

        {/* Primary Clean Navigation */}
        <nav className="flex-1 py-5 px-3 overflow-y-auto space-y-1 text-xs">
          <p className={`px-3 mb-2 text-[9px] font-bold tracking-[0.18em] text-slate-500 ${collapsed ? 'lg:hidden' : ''}`}>WORKSPACE</p>
          {/* Overview */}
          <NavLink
            to="/overview"
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 h-10 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-blue-500/15 text-white font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-blue-400'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 shrink-0 text-current" />
            <span className={collapsed ? 'lg:hidden' : ''}>Overview</span>
          </NavLink>

          {/* Checkout (Transaction Risk Assessment) */}
          <NavLink
            to="/checkout"
            className={({ isActive }) =>
              `relative flex items-center justify-between px-3 h-10 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-blue-500/15 text-white font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-blue-400'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-4 h-4 shrink-0 text-current" />
              <span className={collapsed ? 'lg:hidden' : ''}>Checkout</span>
            </div>
            <span className={`text-[9px] font-mono font-bold px-1 rounded bg-blue-500/20 text-blue-300 ${collapsed ? 'lg:hidden' : ''}`}>
              LIVE
            </span>
          </NavLink>

          {/* Risk Intelligence (Collapsible Group) */}
          <div className="pt-5">
            <p className={`px-3 mb-2 text-[9px] font-bold tracking-[0.18em] text-slate-500 ${collapsed ? 'lg:hidden' : ''}`}>INTELLIGENCE</p>
            <button
              onClick={() => setRiskMenuOpen(!riskMenuOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all text-left ${
                isRiskIntelligenceActive ? 'text-blue-300 font-semibold' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 shrink-0 text-slate-400" />
                <span className={collapsed ? 'lg:hidden' : ''}>Risk Intelligence</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  riskMenuOpen ? 'rotate-180 text-slate-300' : 'text-slate-500'
                }`}
              />
            </button>

            {riskMenuOpen && (
              <div className={`pl-3 pr-1 pt-1 space-y-1 ${collapsed ? 'lg:hidden' : ''}`}>
                <NavLink
                  to="/live-risk"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/20 text-white font-semibold border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/70'
                    }`
                  }
                >
                  <Radio className="w-3.5 h-3.5 text-blue-400" />
                  <span>Live Risk Feed</span>
                </NavLink>

                <NavLink
                  to="/network"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/20 text-white font-semibold border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/70'
                    }`
                  }
                >
                  <Network className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Network Sentinel</span>
                </NavLink>

                <NavLink
                  to="/velocity"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/20 text-white font-semibold border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/70'
                    }`
                  }
                >
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>Velocity Monitor</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* Analytics */}
          <p className={`px-3 pt-5 mb-2 text-[9px] font-bold tracking-[0.18em] text-slate-500 ${collapsed ? 'lg:hidden' : ''}`}>ANALYTICS</p>
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all ${
                isActive
                    ? 'relative bg-blue-500/15 text-white font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-blue-400'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`
            }
          >
            <BarChart3 className="w-4 h-4 shrink-0 text-slate-400" />
            <span className={collapsed ? 'lg:hidden' : ''}>Analytics</span>
          </NavLink>

          {/* Audit Log */}
          <NavLink
            to="/audit"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all ${
                isActive
                    ? 'relative bg-blue-500/15 text-white font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-blue-400'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`
            }
          >
            <ClipboardList className="w-4 h-4 shrink-0 text-slate-400" />
            <span className={collapsed ? 'lg:hidden' : ''}>Audit Log</span>
          </NavLink>
        </nav>

        {/* Bottom Section: Settings & Model Status */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'relative bg-blue-500/15 text-white font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-blue-400'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`
            }
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span className={collapsed ? 'lg:hidden' : ''}>Settings</span>
          </NavLink>

          <button
            onClick={() => setModelModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900/70 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <Cpu className="w-4 h-4 text-slate-400" />
              <span className={collapsed ? 'lg:hidden' : ''}>Model Status</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="ML Service Live" />
          </button>
          <NavLink to="/model-status" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive ? 'bg-blue-500/15 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/70'}`}>
            <Cpu className="w-4 h-4 text-slate-400" />
            <span className={collapsed ? 'lg:hidden' : ''}>Evaluation</span>
          </NavLink>
          <button onClick={onToggle} className="hidden lg:flex w-full items-center gap-3 px-3 h-10 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            <span className={collapsed ? 'hidden' : ''}>Collapse</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 z-40 flex lg:hidden overflow-x-auto bg-[#071426]/95 backdrop-blur-md border-t border-slate-800 px-2 py-2 safe-area-bottom">
        {[
          { to: '/overview', label: 'Overview', icon: LayoutDashboard },
          { to: '/checkout', label: 'Checkout', icon: ShoppingCart },
          { to: '/live-risk', label: 'Risk', icon: Activity },
          { to: '/analytics', label: 'Analytics', icon: BarChart3 },
          { to: '/audit', label: 'Audit', icon: ClipboardList },
          { to: '/settings', label: 'Settings', icon: Settings },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `min-w-[3.75rem] flex-1 flex flex-col items-center gap-1 px-1.5 py-1.5 rounded-md text-[10px] font-medium whitespace-nowrap ${
                  isActive ? 'text-white bg-blue-600/25' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-300' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Model Status Modal */}
      <ModelStatusModal
        isOpen={modelModalOpen}
        onClose={() => setModelModalOpen(false)}
      />
    </>
  );
}
