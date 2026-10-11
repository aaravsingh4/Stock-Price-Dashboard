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
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 lg:top-16 z-50 lg:z-20 h-screen lg:h-[calc(100vh-4rem)] w-64 bg-white dark:bg-surface-darkCard border-r border-slate-200/80 dark:border-surface-darkBorder transition-transform duration-200 ease-in-out flex flex-col justify-between',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-4 space-y-6">
          {/* Mobile close button header */}
          <div className="flex items-center justify-between lg:hidden pb-3 border-b border-slate-100 dark:border-surface-darkBorder">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Navigation
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
              Market Intelligence
            </div>
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
                    'w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors select-none text-left',
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        'w-4 h-4',
                        isActive
                          ? 'text-brand-600 dark:text-brand-400'
                          : 'text-slate-400 dark:text-slate-500'
                      )}
                    />
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

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-slate-100 dark:border-surface-darkBorder">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-surface-darkBorder text-[11px]">
            <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Architecture Plan
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
              Review design boundaries and roadmap in project documentation.
            </p>
            <div className="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-medium cursor-pointer">
              <span>View Architecture</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
