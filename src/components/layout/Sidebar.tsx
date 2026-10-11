import {
  LayoutDashboard,
  Compass,
  Star,
  BellRing,
  PieChart,
  Settings,
  X,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
}

export function Sidebar({ isOpen, onClose, activeTab, onSelectTab }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, isReady: true },
    { id: 'explore', label: 'Explore Stocks', icon: Compass, isReady: false, badge: 'Phase 4' },
    { id: 'watchlist', label: 'Watchlist', icon: Star, isReady: false, badge: 'Phase 6' },
    { id: 'alerts', label: 'Price Alerts', icon: BellRing, isReady: false, badge: 'Phase 7' },
    { id: 'portfolio', label: 'Portfolio Analytics', icon: PieChart, isReady: false, badge: 'Phase 8' },
    { id: 'settings', label: 'Settings', icon: Settings, isReady: false, badge: 'Planned' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-surface-darkCard border-r border-slate-200/80 dark:border-surface-darkBorder transition-transform duration-200 ease-in-out flex flex-col justify-between shadow-dropdown lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-5 space-y-6">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-surface-darkBorder">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Menu & Navigation
            </span>
            <button
              onClick={onClose}
              aria-label="Close navigation menu"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-xl transition-all select-none text-left',
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Roadmap Info */}
        <div className="p-5 border-t border-slate-100 dark:border-surface-darkBorder">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-surface-darkBorder text-[11px]">
            <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
              TradePulse Architecture
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
              Phase 1 foundation active with simulated market feed.
            </p>
            <div className="flex items-center gap-1 text-brand-emerald font-medium cursor-pointer">
              <span>View System Docs</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
