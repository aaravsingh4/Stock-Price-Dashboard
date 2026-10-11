/**
 * Formats numeric values to institutional currency standards ($1,234.56)
 */
export function formatCurrency(value: number, currency = 'USD', decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formats percentage changes with explicit + / - sign (+1.25% or -0.84%)
 */
export function formatPercent(value: number, includeSign = true): string {
  const formatted = Math.abs(value).toFixed(2);
  if (value > 0) {
    return includeSign ? `+${formatted}%` : `${formatted}%`;
  }
  if (value < 0) {
    return `-${formatted}%`;
  }
  return `0.00%`;
}

/**
 * Formats large market numbers into human-readable shorthand ($2.85T, $450.2B, $12.4M)
 */
export function formatMarketCap(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  }
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  return `$${value.toLocaleString()}`;
}

/**
 * Formats volume numbers (e.g. 45.2M shares)
 */
export function formatVolume(value: number): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

/**
 * Formats ISO timestamp to local readable time (e.g. "09:45:12 AM EDT")
 */
export function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return 'N/A';
  }
}
