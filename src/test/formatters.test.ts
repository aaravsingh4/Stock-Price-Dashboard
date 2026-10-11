import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatPercent,
  formatMarketCap,
  formatVolume,
  formatTimestamp,
} from '../utils/formatters';

describe('Financial Formatters', () => {
  it('formats currency correctly to institutional USD standard', () => {
    expect(formatCurrency(227.63)).toBe('$227.63');
    expect(formatCurrency(1000)).toBe('$1,000.00');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats positive and negative percentage changes with signs', () => {
    expect(formatPercent(3.15)).toBe('+3.15%');
    expect(formatPercent(-2.44)).toBe('-2.44%');
    expect(formatPercent(0)).toBe('0.00%');
  });

  it('formats market caps into shorthand trillions, billions, and millions', () => {
    expect(formatMarketCap(3460000000000)).toBe('$3.46T');
    expect(formatMarketCap(694000000000)).toBe('$694.00B');
    expect(formatMarketCap(15000000)).toBe('$15.00M');
  });

  it('formats volume with K, M, B suffixes', () => {
    expect(formatVolume(72150900)).toBe('72.15M');
    expect(formatVolume(1500000000)).toBe('1.50B');
    expect(formatVolume(4500)).toBe('4.5K');
    expect(formatVolume(500)).toBe('500');
  });

  it('gracefully handles invalid timestamps', () => {
    expect(formatTimestamp('invalid-date')).toBe('N/A');
  });
});
