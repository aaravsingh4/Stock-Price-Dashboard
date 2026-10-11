import { useState, type ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  lastUpdated?: string;
}

export function Layout({ children, activeTab, onSelectTab, lastUpdated }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-surface-light dark:bg-surface-darkBg text-slate-800 dark:text-slate-100 transition-colors duration-150">
      <Header
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        lastUpdated={lastUpdated}
      />

      <div className="flex-1 flex">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          onSelectTab={onSelectTab}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {children}
        </main>
      </div>

      {/* Institutional FinTech Footer */}
      <footer className="border-t border-slate-200/80 dark:border-surface-darkBorder py-4 px-6 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-surface-darkCard flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">TradePulse Pro</span>
          <span>•</span>
          <span>Phase 1 Foundation</span>
          <span>•</span>
          <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-medium">SIMULATED FEED</span>
        </div>
        <div>
          <span>Engineered for high performance, reliability, and precision financial analysis.</span>
        </div>
      </footer>
    </div>
  );
}
