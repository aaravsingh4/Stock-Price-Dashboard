import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Activity,
  Bell,
  Compass,
  LayoutDashboard,
  Menu,
  Moon,
  PieChart,
  Search,
  Star,
  Sun,
  User,
  X,
  BellRing,
  Settings,
  Loader2,
  LogOut,
} from 'lucide-react';
import { useTheme } from '../../context/themeCore';
import { useAuth } from '../../context/authCore';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { StockQuote } from '../../types/stock';
import { TrendBadge } from '../ui/Badge';
import { ConnectionBadge } from '../ui/ConnectionBadge';
import { cn } from '../../utils/cn';
import { marketApiClient, LiveSearchResultItem } from '../../services/apiClient';

interface HeaderProps {
  onToggleSidebar?: () => void;
  lastUpdated?: string;
  activeTab?: string;
  onSelectTab?: (tabId: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  stocks?: StockQuote[];
  onSelectStock?: (stock: StockQuote) => void;
  connectionStatus?: import('../../services/marketStreamClient').ConnectionStatus;
  onOpenAuthModal?: () => void;
}

export function Header({
  onToggleSidebar,
  lastUpdated: _lastUpdated,
  activeTab = 'dashboard',
  onSelectTab,
  searchQuery = '',
  onSearchChange,
  stocks = [],
  onSelectStock,
  connectionStatus = 'demo',
  onOpenAuthModal,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [liveSearchResults, setLiveSearchResults] = useState<LiveSearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchRequestIdRef = useRef<number>(0);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'watchlist', label: 'Watchlist', icon: Star },
    { id: 'alerts', label: 'Alerts', icon: BellRing },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart, badge: 'Phase 8' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Debounced live symbol search against backend
  useEffect(() => {
    const cleanQuery = searchQuery.trim();
    if (!cleanQuery || cleanQuery.length < 2) {
      setLiveSearchResults([]);
      setIsSearching(false);
      setSelectedIndex(-1);
      return;
    }

    const currentReqId = ++searchRequestIdRef.current;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const results = await marketApiClient.searchSymbols(cleanQuery);
        if (searchRequestIdRef.current === currentReqId) {
          setLiveSearchResults(results);
          setSelectedIndex(-1);
        }
      } catch {
        if (searchRequestIdRef.current === currentReqId) {
          setLiveSearchResults([]);
        }
      } finally {
        if (searchRequestIdRef.current === currentReqId) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Combined matching results: merge live results with local catalog
  const matchingStocks = searchQuery.trim()
    ? stocks
        .filter(
          (s) =>
            s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.companyName.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  // Deduplicate remote results not already in matching local stocks
  const remoteExtraResults = liveSearchResults.filter(
    (r) => !stocks.some((s) => s.symbol.toUpperCase() === r.symbol.toUpperCase())
  );

  const totalResultsCount = matchingStocks.length + remoteExtraResults.length;

  const handleSelectRemote = useCallback((item: LiveSearchResultItem) => {
    const syntheticStock: StockQuote = {
      symbol: item.symbol,
      companyName: item.description || item.displaySymbol || item.symbol,
      price: 0,
      change: 0,
      changePercent: 0,
      open: 0,
      dayHigh: 0,
      dayLow: 0,
      previousClose: 0,
      volume: 0,
      marketCap: 0,
      sector: item.type || 'Equities',
      isWatchlisted: false,
      dataStatus: 'LIVE',
      lastUpdated: new Date().toISOString(),
    };
    onSelectStock?.(syntheticStock);
    setIsSearchFocused(false);
  }, [onSelectStock]);

  const handleSelectIndex = (index: number) => {
    if (index >= 0 && index < matchingStocks.length) {
      onSelectStock?.(matchingStocks[index]);
      setIsSearchFocused(false);
    } else if (index >= matchingStocks.length && index < totalResultsCount) {
      const remoteItem = remoteExtraResults[index - matchingStocks.length];
      if (remoteItem) handleSelectRemote(remoteItem);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-surface-darkCard/95 backdrop-blur-md border-b border-slate-200/80 dark:border-surface-darkBorder transition-colors">
      {/* Top Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-3 sm:gap-6">
          {/* Brand & Mobile Hamburger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation menu"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              onClick={() => onSelectTab?.('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-emerald to-brand-500 flex items-center justify-center text-white shadow-subtle shadow-brand-emerald/30 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                    TradePulse
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-brand-emeraldLight text-brand-emerald dark:bg-emerald-950/60 dark:text-emerald-400 border border-brand-emerald/20">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-none hidden sm:block">
                  Market Intelligence
                </p>
              </div>
            </div>
          </div>

          {/* Prominent Search Bar (Groww-inspired clean search) */}
          <div
            ref={searchContainerRef}
            className="flex-1 max-w-lg relative hidden sm:block"
          >
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                role="combobox"
                aria-expanded={isSearchFocused && (totalResultsCount > 0 || isSearching)}
                aria-autocomplete="list"
                aria-haspopup="listbox"
                aria-label="Search stocks, indices, companies"
                placeholder="Search stocks, indices, companies (e.g. AAPL, NVDA)..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (totalResultsCount > 0) {
                      setSelectedIndex((prev) => (prev + 1) % totalResultsCount);
                    }
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (totalResultsCount > 0) {
                      setSelectedIndex((prev) => (prev <= 0 ? totalResultsCount - 1 : prev - 1));
                    }
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selectedIndex >= 0 && selectedIndex < totalResultsCount) {
                      handleSelectIndex(selectedIndex);
                    } else if (totalResultsCount > 0) {
                      handleSelectIndex(0);
                    }
                  } else if (e.key === 'Escape') {
                    setIsSearchFocused(false);
                  }
                }}
                className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald transition-all"
              />
              {isSearching ? (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-emerald dark:text-emerald-400" />
                </div>
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange?.('');
                    setLiveSearchResults([]);
                    setIsSearchFocused(false);
                  }}
                  aria-label="Clear search query"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 pointer-events-none">
                  /
                </span>
              )}
            </div>

            {/* Quick Autocomplete Dropdown */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div 
                role="listbox" 
                className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-surface-darkCard border border-slate-200/90 dark:border-surface-darkBorder rounded-xl shadow-dropdown overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                {isSearching && totalResultsCount === 0 ? (
                  <div className="px-3.5 py-4 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-emerald" />
                    <span>Searching Finnhub securities...</span>
                  </div>
                ) : totalResultsCount === 0 ? (
                  <div className="px-3.5 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    No matching securities found for <strong className="text-slate-700 dark:text-slate-200 font-semibold">"{searchQuery}"</strong>
                  </div>
                ) : (
                  <>
                    {matchingStocks.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/30">
                          Primary Equities
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-surface-darkBorder/60">
                          {matchingStocks.map((stock, idx) => {
                            const isHighlighted = selectedIndex === idx;
                            return (
                              <div
                                key={stock.symbol}
                                role="option"
                                aria-selected={isHighlighted}
                                onClick={() => {
                                  onSelectStock?.(stock);
                                  setIsSearchFocused(false);
                                }}
                                className={cn(
                                  'px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors',
                                  isHighlighted
                                    ? 'bg-slate-100 dark:bg-slate-800'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                )}
                              >
                                <div>
                                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span>{stock.symbol}</span>
                                    <span className="text-[10px] font-normal px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                      {stock.sector}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                                    {stock.companyName}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-semibold text-slate-900 dark:text-white tabular-nums">
                                    {formatCurrency(stock.price)}
                                  </div>
                                  <TrendBadge
                                    value={stock.changePercent}
                                    formattedText={formatPercent(stock.changePercent)}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {remoteExtraResults.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-t border-slate-100 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                          <span>Live Catalog Discovery</span>
                          <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400">Finnhub</span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-surface-darkBorder/60">
                          {remoteExtraResults.map((item, idx) => {
                            const globalIdx = matchingStocks.length + idx;
                            const isHighlighted = selectedIndex === globalIdx;
                            return (
                              <div
                                key={item.symbol}
                                role="option"
                                aria-selected={isHighlighted}
                                onClick={() => handleSelectRemote(item)}
                                className={cn(
                                  'px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors',
                                  isHighlighted
                                    ? 'bg-slate-100 dark:bg-slate-800'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                )}
                              >
                                <div>
                                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span>{item.symbol}</span>
                                    {item.type && (
                                      <span className="text-[10px] font-normal px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                        {item.type}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                                    {item.description}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/40 px-1.5 py-0.5 rounded">
                                    Select
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Actions: Market Status Pill, Theme Toggle, Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Stream Gateway Connection Badge */}
            <ConnectionBadge status={connectionStatus} />

            {/* Market Status Pill */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-[11px] font-medium text-slate-600 dark:text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-market-up opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-market-up"></span>
              </span>
              <span>NYSE/NASDAQ Active</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              id="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Active: ${theme.toUpperCase()} mode. Click to switch to ${theme === 'light' ? 'Dark' : 'Light'} mode`}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-600 transition-transform hover:-rotate-12" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
              )}
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              aria-label="View notifications"
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-brand-emerald" />
            </button>

            {/* Profile Avatar & Auth Status */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-surface-darkBorder">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 flex items-center justify-center font-bold text-xs select-none"
                    title={`Signed in as ${user.email}`}
                  >
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={() => logout()}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="pb-3 sm:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search stocks (e.g. AAPL, NVDA)..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-emerald/20"
            />
          </div>
        </div>

        {/* Groww-style Clean Navigation Sub-bar */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 border-t border-slate-100 dark:border-surface-darkBorder/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab?.(item.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full shrink-0 transition-all select-none',
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-subtle'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={cn(
                      'text-[9px] px-1 py-0.2 rounded font-medium',
                      isActive
                        ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
