import { ScreenerStockItem, ScreenerFilterCriteria, ScreenerSortCriteria } from '../types/screener';

/**
 * Filter stocks according to multi-parameter criteria
 */
export function filterScreenerStocks(
  stocks: ScreenerStockItem[],
  criteria: ScreenerFilterCriteria
): ScreenerStockItem[] {
  return stocks.filter((stock) => {
    // 1. Symbol & Company name query
    if (criteria.searchQuery && criteria.searchQuery.trim().length > 0) {
      const q = criteria.searchQuery.trim().toLowerCase();
      const matchSymbol = stock.symbol.toLowerCase().includes(q);
      const matchName = stock.companyName.toLowerCase().includes(q);
      if (!matchSymbol && !matchName) return false;
    }

    // 2. Exchange Filter
    if (criteria.exchange && criteria.exchange !== 'ALL') {
      const targetExchange = criteria.exchange.toUpperCase();
      const stockExchange = stock.exchange.toUpperCase();
      if (!stockExchange.includes(targetExchange)) return false;
    }

    // 3. Sector / Industry Filter
    if (criteria.sector && criteria.sector !== 'ALL') {
      const targetSector = criteria.sector.toLowerCase();
      const stockSector = stock.sector.toLowerCase();
      if (!stockSector.includes(targetSector)) return false;
    }

    // 4. Price range filter ($ Min / $ Max)
    if (typeof criteria.minPrice === 'number' && !Number.isNaN(criteria.minPrice)) {
      if (stock.price < criteria.minPrice) return false;
    }
    if (typeof criteria.maxPrice === 'number' && !Number.isNaN(criteria.maxPrice)) {
      if (stock.price > criteria.maxPrice) return false;
    }

    // 5. Daily percentage change filter (% Min / % Max)
    if (typeof criteria.minChangePercent === 'number' && !Number.isNaN(criteria.minChangePercent)) {
      if (stock.changePercent < criteria.minChangePercent) return false;
    }
    if (typeof criteria.maxChangePercent === 'number' && !Number.isNaN(criteria.maxChangePercent)) {
      if (stock.changePercent > criteria.maxChangePercent) return false;
    }

    // 6. Volume filter (Only apply if stock volume is valid positive value)
    if (typeof criteria.minVolume === 'number' && !Number.isNaN(criteria.minVolume) && criteria.minVolume > 0) {
      if (typeof stock.volume !== 'number' || stock.volume < criteria.minVolume) return false;
    }

    // 7. Market Capitalization filter (Keep missing distinct from zero)
    if (typeof criteria.minMarketCap === 'number' && !Number.isNaN(criteria.minMarketCap) && criteria.minMarketCap > 0) {
      if (typeof stock.marketCap !== 'number' || stock.marketCap < criteria.minMarketCap) return false;
    }
    if (typeof criteria.maxMarketCap === 'number' && !Number.isNaN(criteria.maxMarketCap) && criteria.maxMarketCap > 0) {
      if (typeof stock.marketCap !== 'number' || stock.marketCap > criteria.maxMarketCap) return false;
    }

    return true;
  });
}

/**
 * Stable sorting of screener stocks across supported numeric and string fields
 */
export function sortScreenerStocks(
  stocks: ScreenerStockItem[],
  sort: ScreenerSortCriteria
): ScreenerStockItem[] {
  const sorted = [...stocks];
  const { field, order } = sort;
  const isAsc = order === 'asc';

  return sorted.sort((a, b) => {
    const aVal = a[field as keyof ScreenerStockItem];
    const bVal = b[field as keyof ScreenerStockItem];

    // Handle missing / undefined values stably by sending them to the end
    const aMissing = aVal === undefined || aVal === null || Number.isNaN(aVal);
    const bMissing = bVal === undefined || bVal === null || Number.isNaN(bVal);

    if (aMissing && bMissing) return 0;
    if (aMissing) return 1;
    if (bMissing) return -1;

    // String sorting
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const cmp = aVal.localeCompare(bVal);
      return isAsc ? cmp : -cmp;
    }

    // Numeric sorting
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return isAsc ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });
}
