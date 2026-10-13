import { useState, type ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { StockQuote } from '../../types/stock';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  lastUpdated?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  stocks?: StockQuote[];
  onSelectStock?: (stock: StockQuote) => void;
  connectionStatus?: import('../../services/marketStreamClient').ConnectionStatus;
  onOpenAuthModal?: () => void;
}

export function Layout({
  children,
  activeTab,
  onSelectTab,
  lastUpdated,
  searchQuery,
  onSearchChange,
  stocks,
  onSelectStock,
  connectionStatus,
  onOpenAuthModal,
}: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-surface-light dark:bg-surface-darkBg text-slate-800 dark:text-slate-100 transition-colors duration-150">
      <Header
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        lastUpdated={lastUpdated}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        stocks={stocks}
        onSelectStock={onSelectStock}
        connectionStatus={connectionStatus}
        onOpenAuthModal={onOpenAuthModal}
      />

      {/* Mobile Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
      />

      {/* Main Full-Width Dashboard Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {children}
      </main>

      {/* Institutional FinTech Footer */}
      <footer className="border-t border-slate-200/80 dark:border-surface-darkBorder py-5 px-6 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-surface-darkCard transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">TradePulse Pro</span>
            <span>•</span>
            <span>Groww-Inspired Clean FinTech Design</span>
            <span>•</span>
            <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-medium">SIMULATED DATA</span>
          </div>
          <div>
            <span>Engineered for high performance, reliability, and precision financial analysis.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
