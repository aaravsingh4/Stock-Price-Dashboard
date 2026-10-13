import { useState } from 'react';
import { Filter, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { ScreenerFilterCriteria } from '../../types/screener';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface ScreenerFilterPanelProps {
  criteria: ScreenerFilterCriteria;
  onChange: (updated: ScreenerFilterCriteria) => void;
  onReset: () => void;
  availableExchanges: string[];
  availableSectors: string[];
  resultsCount: number;
  totalCount: number;
}

export function ScreenerFilterPanel({
  criteria,
  onChange,
  onReset,
  availableExchanges,
  availableSectors,
  resultsCount,
  totalCount,
}: ScreenerFilterPanelProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const update = (partial: Partial<ScreenerFilterCriteria>) => {
    onChange({ ...criteria, ...partial });
  };

  const hasActiveFilters = Boolean(
    criteria.searchQuery ||
    criteria.exchange !== 'ALL' ||
    criteria.sector !== 'ALL' ||
    criteria.minPrice !== undefined ||
    criteria.maxPrice !== undefined ||
    criteria.minChangePercent !== undefined ||
    criteria.maxChangePercent !== undefined ||
    criteria.minVolume !== undefined ||
    criteria.minMarketCap !== undefined
  );

  return (
    <Card className="border border-slate-200/80 dark:border-surface-darkBorder">
      {/* Mobile Accordion Toggle */}
      <div className="p-4 flex items-center justify-between sm:hidden">
        <button
          type="button"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200"
        >
          <Filter className="w-4 h-4 text-brand-emerald" />
          <span>Filters & Screen Parameters ({resultsCount} of {totalCount})</span>
          {isMobileOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset} className="text-xs h-7 px-2">
            Reset
          </Button>
        )}
      </div>

      <CardContent className={`p-4 sm:p-5 pt-0 sm:pt-5 ${isMobileOpen ? 'block' : 'hidden sm:block'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Exchange Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Exchange
            </label>
            <select
              aria-label="Exchange"
              value={criteria.exchange}
              onChange={(e) => update({ exchange: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-emerald text-xs"
            >
              <option value="ALL">All Exchanges</option>
              {availableExchanges.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </div>

          {/* Sector / Industry Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Sector / Industry
            </label>
            <select
              aria-label="Sector / Industry"
              value={criteria.sector}
              onChange={(e) => update({ sector: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-emerald text-xs"
            >
              <option value="ALL">All Sectors</option>
              {availableSectors.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Price Range ($)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                min="0"
                step="1"
                aria-label="Min Price"
                value={criteria.minPrice !== undefined ? criteria.minPrice : ''}
                onChange={(e) =>
                  update({ minPrice: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-emerald text-xs tabular-nums"
              />
              <span className="text-slate-400">-</span>
              <input
                type="number"
                placeholder="Max"
                min="0"
                step="1"
                aria-label="Max Price"
                value={criteria.maxPrice !== undefined ? criteria.maxPrice : ''}
                onChange={(e) =>
                  update({ maxPrice: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-emerald text-xs tabular-nums"
              />
            </div>
          </div>

          {/* Daily Change Percent Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Daily % Change Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min %"
                step="0.5"
                aria-label="Min % Change"
                value={criteria.minChangePercent !== undefined ? criteria.minChangePercent : ''}
                onChange={(e) =>
                  update({ minChangePercent: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-emerald text-xs tabular-nums"
              />
              <span className="text-slate-400">-</span>
              <input
                type="number"
                placeholder="Max %"
                step="0.5"
                aria-label="Max % Change"
                value={criteria.maxChangePercent !== undefined ? criteria.maxChangePercent : ''}
                onChange={(e) =>
                  update({ maxChangePercent: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-emerald text-xs tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* Bottom row: Volume & Market Cap quick selectors & Reset */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-surface-darkBorder/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Quick Filters:</span>
            <button
              type="button"
              onClick={() => update({ minChangePercent: 0, maxChangePercent: undefined })}
              className={`px-2.5 py-1 rounded-md border font-medium transition-all ${
                criteria.minChangePercent === 0 && criteria.maxChangePercent === undefined
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Gainers Only (≥ 0%)
            </button>
            <button
              type="button"
              onClick={() => update({ maxChangePercent: 0, minChangePercent: undefined })}
              className={`px-2.5 py-1 rounded-md border font-medium transition-all ${
                criteria.maxChangePercent === 0 && criteria.minChangePercent === undefined
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Losers Only (≤ 0%)
            </button>
            <button
              type="button"
              onClick={() => update({ minMarketCap: 1000000000000 })} // Mega Cap: >= 1T
              className={`px-2.5 py-1 rounded-md border font-medium transition-all ${
                criteria.minMarketCap === 1000000000000
                  ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Mega Cap (≥ $1T)
            </button>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing <strong className="text-slate-800 dark:text-slate-200">{resultsCount}</strong> of {totalCount} securities
            </span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="gap-1.5 text-xs h-8 text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
