import { Activity, Bell, Menu, Moon, Search, Sun, User } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { formatTimestamp } from '../../utils/formatters';

interface HeaderProps {
  onToggleSidebar?: () => void;
  lastUpdated?: string;
}

export function Header({ onToggleSidebar, lastUpdated }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-surface-darkCard/95 backdrop-blur border-b border-slate-200/80 dark:border-surface-darkBorder transition-colors duration-150">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 select-none">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-subtle shadow-brand-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                  TradePulse
                </span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-none hidden sm:block">
                Market Intelligence Platform
              </p>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search ticker, company, or market index (e.g. AAPL, NVDA)..."
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-400">
              /
            </span>
          </div>
        </div>

        {/* Right: Timestamp, Theme Toggle, Notification & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Market timestamp indicator */}
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-slate-700/60 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Updated: {lastUpdated ? formatTimestamp(lastUpdated) : 'Live Feed'}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            id="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Active: ${theme.toUpperCase()} mode. Click to switch to ${theme === 'light' ? 'Dark' : 'Light'} mode`}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-600 transition-transform hover:-rotate-12" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
            )}
          </button>

          {/* Notifications */}
          <button
            type="button"
            aria-label="View notifications"
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500" />
          </button>

          {/* User profile avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-surface-darkBorder">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
