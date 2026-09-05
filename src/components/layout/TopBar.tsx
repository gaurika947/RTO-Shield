import { Cpu, Sparkles, Activity, Menu, Bell } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

export function TopBar({ collapsed, onMenuClick }: { collapsed: boolean; onMenuClick: () => void }) {
  const aiEnabled = useSettingsStore(s => s.aiEnabled);

  return (
    <header className={`fixed top-0 right-0 z-30 flex h-14 items-center justify-between border-b border-[#263a54] bg-[#0b1b32]/95 px-4 shadow-[0_1px_12px_rgba(0,0,0,0.18)] backdrop-blur-md transition-[left] duration-200 sm:px-6 ${collapsed ? 'lg:left-[72px]' : 'left-0 lg:left-60'}`}>
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Open navigation">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <Activity className="w-4 h-4 text-blue-600" />
          <span>RTO Shield</span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5 text-xs">
        <div className="hidden sm:flex items-center gap-2 text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <Cpu className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold text-slate-200">Risk Engine</span>
          <span className="text-emerald-700 font-medium">Operational</span>
        </div>
        <div className="hidden md:flex items-center gap-2 text-slate-300">
          <Sparkles className={`w-3.5 h-3.5 ${aiEnabled ? 'text-blue-600' : 'text-slate-400'}`} />
          <span className="font-semibold text-slate-200">AI Intelligence</span>
          <span className={`font-medium ${aiEnabled ? 'text-blue-700' : 'text-slate-500'}`}>
            {aiEnabled ? 'Active (Gemini)' : 'Deterministic Fallback'}
          </span>
        </div>
        <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100" aria-label="Notifications">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
