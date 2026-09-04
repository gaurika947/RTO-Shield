import type { ReactNode } from 'react';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--rs-workspace)] text-[var(--rs-ink)]">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={() => setCollapsed((value) => !value)}
        onClose={() => setMobileOpen(false)}
      />
      <TopBar collapsed={collapsed} onMenuClick={() => setMobileOpen(true)} />
      <main className={`mt-14 min-h-[calc(100vh-3.5rem)] p-4 sm:p-6 lg:p-7 pb-24 lg:pb-7 transition-[margin] duration-200 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-60'}`}>
        {children}
      </main>
    </div>
  );
}
