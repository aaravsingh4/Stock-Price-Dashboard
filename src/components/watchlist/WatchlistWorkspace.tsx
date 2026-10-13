import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/authCore';
import { cloudClient } from '../../services/cloudClient';
import { StockQuote } from '../../types/stock';
import { Button } from '../ui/Button';
import { Plus, Trash2, Edit2, Star, TrendingUp, TrendingDown, Check, X, Loader2 } from 'lucide-react';
import type { WatchlistDto } from '../../types/auth';

interface WatchlistWorkspaceProps {
  allStocks: StockQuote[];
  onSelectStock: (stock: StockQuote) => void;
  onOpenAuthModal: () => void;
  onReturnToDashboard?: () => void;
}

export function WatchlistWorkspace({
  allStocks,
  onSelectStock,
  onOpenAuthModal,
  onReturnToDashboard,
}: WatchlistWorkspaceProps) {
  const { user, isAuthenticated } = useAuth();
  const [watchlists, setWatchlists] = useState<WatchlistDto[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [symbolToAdd, setSymbolToAdd] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchWatchlists = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await cloudClient.getWatchlists();
      setWatchlists(data);
      if (data.length > 0 && !selectedListId) {
        const defaultList = data.find((l) => l.isDefault) || data[0];
        setSelectedListId(defaultList.id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load watchlists');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, selectedListId]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWatchlists();
    } else {
      setWatchlists([]);
      setSelectedListId(null);
    }
  }, [isAuthenticated, fetchWatchlists]);

  const activeWatchlist = watchlists.find((w) => w.id === selectedListId) || watchlists[0];

  const handleCreateWatchlist = async () => {
    if (!newListName.trim()) return;
    try {
      const created = await cloudClient.createWatchlist(newListName.trim());
      setWatchlists((prev) => [...prev, created]);
      setSelectedListId(created.id);
      setNewListName('');
      setIsCreatingList(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create watchlist');
    }
  };

  const handleRenameWatchlist = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      const updated = await cloudClient.renameWatchlist(id, editingName.trim());
      setWatchlists((prev) => prev.map((w) => (w.id === id ? { ...w, name: updated.name } : w)));
      setEditingListId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to rename watchlist');
    }
  };

  const handleDeleteWatchlist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this watchlist?')) return;
    try {
      await cloudClient.deleteWatchlist(id);
      setWatchlists((prev) => prev.filter((w) => w.id !== id));
      if (selectedListId === id) {
        const remaining = watchlists.filter((w) => w.id !== id);
        setSelectedListId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete watchlist');
    }
  };

  const handleAddSymbol = async () => {
    if (!selectedListId || !symbolToAdd.trim()) return;
    const norm = symbolToAdd.trim().toUpperCase();
    const matchedStock = allStocks.find((s) => s.symbol.toUpperCase() === norm);

    try {
      const item = await cloudClient.addWatchlistSymbol(
        selectedListId,
        norm,
        matchedStock?.companyName || norm,
        'US'
      );
      setWatchlists((prev) =>
        prev.map((w) => {
          if (w.id === selectedListId) {
            const hasItem = w.items.some((i) => i.symbol === norm);
            return hasItem ? w : { ...w, items: [...w.items, item] };
          }
          return w;
        })
      );
      setSymbolToAdd('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add symbol');
    }
  };

  const handleRemoveSymbol = async (symbol: string) => {
    if (!selectedListId) return;
    try {
      await cloudClient.removeWatchlistSymbol(selectedListId, symbol);
      setWatchlists((prev) =>
        prev.map((w) =>
          w.id === selectedListId
            ? { ...w, items: w.items.filter((i) => i.symbol !== symbol) }
            : w
        )
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove symbol');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200 dark:border-surface-darkBorder">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
          <Star className="w-6 h-6 fill-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Persistent Watchlist System
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2">
          Create multiple custom watchlists, sync real-time stock quotes, and store items securely in Neon PostgreSQL. Previously scheduled for Phase 6, now live with Neon!
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={onOpenAuthModal} className="px-6 py-2 text-xs">
            Sign In or Create Account
          </Button>
          <Button variant="outline" onClick={() => onReturnToDashboard?.()} className="px-4 py-2 text-xs">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
            <span>Cloud Watchlists</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Connected to Neon branch: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">tradepulse-dev</span> • Account: {user?.email}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isCreatingList ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreatingList(true)}
              className="gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Watchlist</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="List name..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-emerald"
                autoFocus
              />
              <button
                onClick={handleCreateWatchlist}
                className="p-1.5 rounded-lg bg-brand-emerald text-white hover:bg-emerald-600"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setIsCreatingList(false);
                  setNewListName('');
                }}
                className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Tabs / Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-surface-darkBorder">
        {watchlists.map((w) => {
          const isSelected = w.id === selectedListId;
          const isEditing = w.id === editingListId;

          if (isEditing) {
            return (
              <div key={w.id} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="px-2 py-0.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  autoFocus
                />
                <button onClick={() => handleRenameWatchlist(w.id)} className="text-emerald-600">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setEditingListId(null)} className="text-slate-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={w.id}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all select-none ${
                isSelected
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
              onClick={() => setSelectedListId(w.id)}
            >
              <span>{w.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-700'}`}>
                {w.items.length}
              </span>
              {!w.isDefault && isSelected && (
                <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setEditingListId(w.id);
                      setEditingName(w.name);
                    }}
                    className="hover:text-amber-300"
                    title="Rename"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteWatchlist(w.id)}
                    className="hover:text-rose-400"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Watchlist Items Section */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-xs">Loading cloud watchlist...</span>
        </div>
      ) : activeWatchlist ? (
        <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200 dark:border-surface-darkBorder p-5 space-y-4">
          {/* Add Stock Bar */}
          <div className="flex gap-2 max-w-sm">
            <input
              type="text"
              placeholder="Add stock symbol (e.g. TSLA, NVDA)..."
              value={symbolToAdd}
              onChange={(e) => setSymbolToAdd(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald/20"
              onKeyDown={(e) => e.key === 'Enter' && handleAddSymbol()}
            />
            <Button size="sm" onClick={handleAddSymbol} className="text-xs">
              Add
            </Button>
          </div>

          {/* Items Table */}
          {activeWatchlist.items.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No symbols in this watchlist yet. Add one above!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5 px-3">Symbol</th>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3 text-right">Live Price</th>
                    <th className="py-2.5 px-3 text-right">24h Change</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {activeWatchlist.items.map((item) => {
                    const stock = allStocks.find((s) => s.symbol.toUpperCase() === item.symbol.toUpperCase());
                    const price = stock ? stock.price : 150.0;
                    const change = stock ? stock.change : 0.0;
                    const changePercent = stock ? stock.changePercent : 0.0;
                    const isPositive = change >= 0;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                        onClick={() => stock && onSelectStock(stock)}
                      >
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {item.symbol}
                        </td>
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                          {item.name || stock?.companyName || item.symbol}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                          ${price.toFixed(2)}
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-semibold flex items-center justify-end gap-1 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span>{isPositive ? '+' : ''}{changePercent.toFixed(2)}%</span>
                        </td>
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleRemoveSymbol(item.symbol)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Remove from watchlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
