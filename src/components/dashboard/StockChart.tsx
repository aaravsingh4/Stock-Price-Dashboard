import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type ScriptableContext,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { StockHistoricalData, StockQuote, TimeRange } from '../../types/stock';
import { generateHistoricalData } from '../../services/mockMarketData';
import { Card, CardContent } from '../ui/Card';
import { TrendBadge, DataStatusBadge } from '../ui/Badge';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { useTheme } from '../../context/themeCore';
import { Star, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { marketApiClient } from '../../services/apiClient';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StockChartProps {
  stock: StockQuote;
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  onToggleWatchlist?: (symbol: string) => void;
  className?: string;
}

const TIME_RANGES: TimeRange[] = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'];

export function StockChart({
  stock,
  timeRange: externalTimeRange,
  onTimeRangeChange,
  onToggleWatchlist,
  className,
}: StockChartProps) {
  const { theme } = useTheme();
  const [internalTimeRange, setInternalTimeRange] = useState<TimeRange>('1M');
  const [liveSeries, setLiveSeries] = useState<StockHistoricalData | null>(null);
  const [isCandlesLoading, setIsCandlesLoading] = useState(false);
  const [hasCandleError, setHasCandleError] = useState(false);
  const activeRequestRef = useRef<string>('');

  const activeRange = externalTimeRange || internalTimeRange;
  const handleRangeSelect = (range: TimeRange) => {
    if (onTimeRangeChange) {
      onTimeRangeChange(range);
    } else {
      setInternalTimeRange(range);
    }
  };

  // Asynchronously fetch live candles when stock is provider-backed or gateway is active
  useEffect(() => {
    const requestId = `${stock.symbol}:${activeRange}:${Date.now()}`;
    activeRequestRef.current = requestId;

    // If stock has explicit simulated badge, retain deterministic simulation without network spam
    if (stock.dataStatus === 'SIMULATED') {
      setLiveSeries(null);
      setIsCandlesLoading(false);
      setHasCandleError(false);
      return;
    }

    let isMounted = true;
    setIsCandlesLoading(true);
    setHasCandleError(false);

    marketApiClient
      .fetchCandles(stock.symbol, activeRange)
      .then((data) => {
        if (!isMounted || activeRequestRef.current !== requestId) return;
        if (data && data.points && data.points.length > 0) {
          setLiveSeries(data);
          setHasCandleError(false);
        } else {
          setLiveSeries(null);
          setHasCandleError(true);
        }
      })
      .catch(() => {
        if (!isMounted || activeRequestRef.current !== requestId) return;
        setLiveSeries(null);
        setHasCandleError(true);
      })
      .finally(() => {
        if (isMounted && activeRequestRef.current === requestId) {
          setIsCandlesLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [stock.symbol, stock.dataStatus, activeRange]);

  // Deterministic fallback series if provider candles are unavailable or simulated
  const simulatedSeries = useMemo(() => {
    return generateHistoricalData(stock, activeRange);
  }, [stock, activeRange]);

  const chartSeries = liveSeries || simulatedSeries;

  const isPositive = chartSeries.priceChange >= 0;
  const isDark = theme === 'dark';

  // Primary colors
  const strokeColor = isPositive ? '#00b386' : '#eb5b3c';
  const startGradientColor = isPositive
    ? 'rgba(0, 179, 134, 0.22)'
    : 'rgba(235, 91, 60, 0.22)';
  const endGradientColor = isPositive
    ? 'rgba(0, 179, 134, 0.0)'
    : 'rgba(235, 91, 60, 0.0)';

  const chartData = useMemo(() => {
    return {
      labels: chartSeries.points.map((p) => p.label),
      datasets: [
        {
          label: `${stock.symbol} Price`,
          data: chartSeries.points.map((p) => p.price),
          borderColor: strokeColor,
          borderWidth: 2.2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: strokeColor,
          pointHoverBorderColor: isDark ? '#121824' : '#ffffff',
          pointHoverBorderWidth: 2,
          tension: 0.35,
          fill: true,
          backgroundColor: (context: ScriptableContext<'line'>) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 320);
            gradient.addColorStop(0, startGradientColor);
            gradient.addColorStop(1, endGradientColor);
            return gradient;
          },
        },
      ],
    };
  }, [chartSeries, stock.symbol, strokeColor, isDark, startGradientColor, endGradientColor]);

  const chartOptions: ChartOptions<'line'> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          backgroundColor: isDark ? '#1e293b' : '#0f172a',
          titleColor: '#f8fafc',
          bodyColor: '#f8fafc',
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: (context) => `Price: ${formatCurrency(context.parsed.y ?? 0)}`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: isDark ? '#64748b' : '#94a3b8',
            font: {
              size: 11,
              family: 'Inter',
            },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 7,
          },
          border: {
            display: false,
          },
        },
        y: {
          position: 'right',
          grid: {
            color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
          },
          ticks: {
            color: isDark ? '#64748b' : '#94a3b8',
            font: {
              size: 11,
              family: 'Inter',
            },
            callback: (val) => `$${Number(val).toFixed(0)}`,
          },
          border: {
            display: false,
          },
        },
      },
    };
  }, [isDark]);

  return (
    <Card className={cn('overflow-hidden border border-slate-200/70 dark:border-surface-darkBorder', className)}>
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Header: Company, Current Price, Delta, Time Range Selectors */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-surface-darkBorder/60">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {stock.symbol}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {stock.companyName}
              </span>
              <DataStatusBadge status={chartSeries.dataStatus} />
              {isCandlesLoading && (
                <div className="flex items-center gap-1 text-[10px] text-brand-emerald dark:text-emerald-400 font-medium animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                  <span>Syncing candles...</span>
                </div>
              )}
              {onToggleWatchlist && (
                <button
                  type="button"
                  onClick={() => onToggleWatchlist(stock.symbol)}
                  aria-label={`Toggle watchlist for ${stock.symbol}`}
                  className="p-1 rounded text-slate-300 hover:text-amber-500 dark:text-slate-600 dark:hover:text-amber-400"
                >
                  <Star
                    className={cn(
                      'w-4 h-4',
                      stock.isWatchlisted
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    )}
                  />
                </button>
              )}
            </div>

            {/* Price & Period Change */}
            <div className="flex items-baseline gap-3 mt-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {formatCurrency(stock.price)}
              </span>
              <div className="flex items-center gap-1.5">
                <TrendBadge
                  value={chartSeries.percentChange}
                  formattedText={formatPercent(chartSeries.percentChange)}
                />
                <span
                  className={cn(
                    'text-xs font-semibold tabular-nums',
                    isPositive ? 'text-market-up dark:text-market-upDark' : 'text-market-down dark:text-market-downDark'
                  )}
                >
                  {isPositive
                    ? `+${chartSeries.priceChange.toFixed(2)}`
                    : chartSeries.priceChange.toFixed(2)}{' '}
                  ({activeRange})
                </span>
              </div>
            </div>
          </div>

          {/* Groww-style Clean Time Range Buttons */}
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-xl self-start sm:self-center">
            {TIME_RANGES.map((range) => {
              const isSelected = activeRange === range;
              return (
                <button
                  key={range}
                  type="button"
                  onClick={() => handleRangeSelect(range)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-semibold rounded-lg transition-all select-none',
                    isSelected
                      ? 'bg-white dark:bg-surface-darkCard text-slate-900 dark:text-white shadow-subtle'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {range}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart Canvas Area */}
        <div className="h-[280px] sm:h-[320px] w-full pt-1">
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* Chart Telemetry Footer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-surface-darkBorder/60 text-[11px] text-slate-400 dark:text-slate-500">
          <div>
            Range Window: <strong className="font-semibold text-slate-600 dark:text-slate-300">{activeRange}</strong>{' '}
            • Low: <span className="tabular-nums font-mono text-slate-600 dark:text-slate-300">{formatCurrency(Math.min(...chartSeries.points.map((p) => p.price)))}</span>{' '}
            • High: <span className="tabular-nums font-mono text-slate-600 dark:text-slate-300">{formatCurrency(Math.max(...chartSeries.points.map((p) => p.price)))}</span>
          </div>
          <div>
            {liveSeries ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Provider live candle feed ({chartSeries.points.length} points)
              </span>
            ) : hasCandleError ? (
              <span className="text-amber-600 dark:text-amber-400">
                Live candles unavailable for this range • Showing simulated baseline
              </span>
            ) : (
              <span>Historical feed generated deterministically from model baseline</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
