import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  HistogramData,
  ColorType,
  Time,
  CandlestickSeries,
  AreaSeries,
  LineSeries,
  HistogramSeries,
} from 'lightweight-charts';
import { CandleData, MarketQuote } from '../../types/market';
import { RefreshCw, AlertCircle, Maximize2, Activity } from 'lucide-react';

interface TradingViewChartProps {
  symbol: string;
  quote?: MarketQuote | null;
  candles: CandleData[];
  resolution: string;
  onResolutionChange: (res: string) => void;
  loading: boolean;
  error?: string | null;
  chartType: 'candlestick' | 'line' | 'area';
  onChartTypeChange: (type: 'candlestick' | 'line' | 'area') => void;
  showSma20?: boolean;
  showSma50?: boolean;
  showVolume?: boolean;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  quote,
  candles,
  resolution,
  onResolutionChange,
  loading,
  error,
  chartType,
  onChartTypeChange,
  showSma20 = true,
  showSma50 = false,
  showVolume = true,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const sma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [hoveredData, setHoveredData] = useState<{
    time: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  } | null>(null);

  // Initialize and resize chart
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    // Create TradingView Chart instance
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#050713' },
        textColor: '#94A3B8',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        vertLine: {
          color: '#48C8FF',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0A1022',
        },
        horzLine: {
          color: '#48C8FF',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0A1022',
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2, // Leave space for volume histogram
        },
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
    });

    chartApiRef.current = chart;

    // Add Volume Series at bottom
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '', // overlay
    });
    volumeSeriesRef.current = volumeSeries;

    // Add SMA Series
    const sma20 = chart.addSeries(LineSeries, {
      color: '#48C8FF',
      lineWidth: 1,
      title: 'SMA 20',
      priceScaleId: 'right',
    });
    sma20SeriesRef.current = sma20;

    const sma50 = chart.addSeries(LineSeries, {
      color: '#9875FF',
      lineWidth: 1,
      title: 'SMA 50',
      priceScaleId: 'right',
    });
    sma50SeriesRef.current = sma50;

    // Add Main Series depending on chartType
    if (chartType === 'candlestick') {
      mainSeriesRef.current = chart.addSeries(CandlestickSeries, {
        upColor: '#4ADE80',
        downColor: '#FB7185',
        borderVisible: false,
        wickUpColor: '#4ADE80',
        wickDownColor: '#FB7185',
      });
    } else if (chartType === 'area') {
      mainSeriesRef.current = chart.addSeries(AreaSeries, {
        topColor: 'rgba(72, 200, 255, 0.4)',
        bottomColor: 'rgba(72, 200, 255, 0.0)',
        lineColor: '#48C8FF',
        lineWidth: 2,
      });
    } else {
      mainSeriesRef.current = chart.addSeries(LineSeries, {
        color: '#48C8FF',
        lineWidth: 2,
      });
    }

    // Crosshair subscription for real-time OHLC tooltip
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData || !mainSeriesRef.current) {
        setHoveredData(null);
        return;
      }
      const data = param.seriesData.get(mainSeriesRef.current) as any;
      if (data) {
        const timeStr = typeof param.time === 'number'
          ? new Date(param.time * 1000).toLocaleString()
          : String(param.time);

        setHoveredData({
          time: timeStr,
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close ?? data.value,
        });
      }
    });

    const handleResize = () => {
      if (container && chart) {
        chart.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartApiRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
      sma20SeriesRef.current = null;
      sma50SeriesRef.current = null;
    };
  }, [chartType]);

  // Update Data When Candles Change
  useEffect(() => {
    if (!chartApiRef.current || !mainSeriesRef.current || candles.length === 0) return;

    // Sort candles by ascending time and filter duplicates
    const sorted = [...candles].sort((a, b) => a.time - b.time);
    const uniqueCandles: CandleData[] = [];
    const seenTimes = new Set<number>();

    for (const c of sorted) {
      if (!seenTimes.has(c.time) && !isNaN(c.close)) {
        seenTimes.add(c.time);
        uniqueCandles.push(c);
      }
    }

    if (uniqueCandles.length === 0) return;

    if (chartType === 'candlestick') {
      const candleData: CandlestickData[] = uniqueCandles.map((c) => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      mainSeriesRef.current.setData(candleData);
    } else {
      const lineData: LineData[] = uniqueCandles.map((c) => ({
        time: c.time as Time,
        value: c.close,
      }));
      mainSeriesRef.current.setData(lineData);
    }

    // Set Volume Data
    if (volumeSeriesRef.current) {
      if (showVolume) {
        const volumeData: HistogramData[] = uniqueCandles.map((c) => ({
          time: c.time as Time,
          value: c.volume || 1,
          color: c.close >= c.open ? 'rgba(74, 222, 128, 0.25)' : 'rgba(251, 113, 133, 0.25)',
        }));
        volumeSeriesRef.current.setData(volumeData);
      } else {
        volumeSeriesRef.current.setData([]);
      }
    }

    // Calculate Real SMA 20 from actual data
    if (sma20SeriesRef.current) {
      if (showSma20 && uniqueCandles.length >= 20) {
        const sma20Data: LineData[] = [];
        for (let i = 19; i < uniqueCandles.length; i++) {
          const slice = uniqueCandles.slice(i - 19, i + 1);
          const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
          sma20Data.push({
            time: uniqueCandles[i].time as Time,
            value: Math.round((sum / 20) * 100) / 100,
          });
        }
        sma20SeriesRef.current.setData(sma20Data);
      } else {
        sma20SeriesRef.current.setData([]);
      }
    }

    // Calculate Real SMA 50
    if (sma50SeriesRef.current) {
      if (showSma50 && uniqueCandles.length >= 50) {
        const sma50Data: LineData[] = [];
        for (let i = 49; i < uniqueCandles.length; i++) {
          const slice = uniqueCandles.slice(i - 49, i + 1);
          const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
          sma50Data.push({
            time: uniqueCandles[i].time as Time,
            value: Math.round((sum / 50) * 100) / 100,
          });
        }
        sma50SeriesRef.current.setData(sma50Data);
      } else {
        sma50SeriesRef.current.setData([]);
      }
    }

    chartApiRef.current.timeScale().fitContent();
  }, [candles, chartType, showVolume, showSma20, showSma50]);

  // Update latest candle with incoming real quote price
  useEffect(() => {
    if (!mainSeriesRef.current || !quote || candles.length === 0) return;
    const lastCandle = candles[candles.length - 1];
    if (!lastCandle) return;

    const updatedPrice = quote.price;
    const quoteTime = Math.floor(quote.timestamp / 1000) as Time;

    if (chartType === 'candlestick') {
      mainSeriesRef.current.update({
        time: lastCandle.time as Time,
        open: lastCandle.open,
        high: Math.max(lastCandle.high, updatedPrice),
        low: Math.min(lastCandle.low, updatedPrice),
        close: updatedPrice,
      });
    } else {
      mainSeriesRef.current.update({
        time: lastCandle.time as Time,
        value: updatedPrice,
      });
    }
  }, [quote, chartType]);

  const intervals = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '1h', value: '1h' },
    { label: '1D', value: '1D' },
    { label: '1W', value: '1W' },
  ];

  return (
    <div className="relative w-full h-full flex flex-col bg-[#050713] rounded-xl border border-slate-800/80 overflow-hidden">
      {/* Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-800/80 bg-[#0A1022]/60 text-xs">
        {/* Left: Resolution Selector & Chart Type */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-[#050713] p-0.5 rounded-lg border border-slate-800">
            {intervals.map((int) => (
              <button
                key={int.value}
                onClick={() => onResolutionChange(int.value)}
                className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors ${
                  resolution === int.value
                    ? 'bg-[#48C8FF]/20 text-[#48C8FF]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {int.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <div className="flex items-center bg-[#050713] p-0.5 rounded-lg border border-slate-800">
            {(['candlestick', 'area', 'line'] as const).map((type) => (
              <button
                key={type}
                onClick={() => onChartTypeChange(type)}
                className={`capitalize px-2 py-1 rounded text-xs transition-colors ${
                  chartType === type
                    ? 'bg-[#48C8FF]/20 text-[#48C8FF] font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Technical Badges & Data Provenance */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          {showSma20 && (
            <span className="flex items-center gap-1 font-mono text-[#48C8FF]">
              <span className="w-2 h-2 rounded-full bg-[#48C8FF]" /> SMA 20
            </span>
          )}
          {showSma50 && (
            <span className="flex items-center gap-1 font-mono text-[#9875FF]">
              <span className="w-2 h-2 rounded-full bg-[#9875FF]" /> SMA 50
            </span>
          )}

          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-500">FEED:</span>
            <span className="text-[#EDF4FF] font-semibold">{quote?.provider ? quote.provider.toUpperCase() : 'REAL FEED'}</span>
          </div>
        </div>
      </div>

      {/* Floating Real-Time OHLC Tooltip */}
      {hoveredData && (
        <div className="absolute top-12 left-4 z-10 px-3 py-1.5 rounded-lg bg-[#0A1022]/90 border border-slate-800/80 backdrop-blur-md flex items-center gap-4 text-xs font-mono tabular-nums text-slate-300 pointer-events-none">
          <span className="text-slate-500">{hoveredData.time}</span>
          {hoveredData.open !== undefined && (
            <span>
              O: <span className="text-[#EDF4FF]">${hoveredData.open.toFixed(2)}</span>
            </span>
          )}
          {hoveredData.high !== undefined && (
            <span>
              H: <span className="text-emerald-400">${hoveredData.high.toFixed(2)}</span>
            </span>
          )}
          {hoveredData.low !== undefined && (
            <span>
              L: <span className="text-rose-400">${hoveredData.low.toFixed(2)}</span>
            </span>
          )}
          {hoveredData.close !== undefined && (
            <span>
              C: <span className="text-[#48C8FF] font-bold">${hoveredData.close.toFixed(2)}</span>
            </span>
          )}
        </div>
      )}

      {/* Chart Container Viewport */}
      <div className="relative flex-grow w-full min-h-[360px]">
        <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-[#050713]/70 backdrop-blur-sm flex items-center justify-center gap-2 text-xs text-[#48C8FF] z-20">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="font-mono">Loading verified historical candles...</span>
          </div>
        )}

        {/* Error Overlay */}
        {error && !loading && (
          <div className="absolute inset-0 bg-[#050713]/90 flex items-center justify-center p-6 z-20 text-center">
            <div className="max-w-md space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <h3 className="font-bold text-sm text-[#EDF4FF]">Market Data Unavailable</h3>
              <p className="text-xs text-rose-300/90 leading-relaxed font-mono">
                {error}
              </p>
              <p className="text-[11px] text-slate-500">
                To stream US equity candles, configure your FINNHUB_API_KEY or TWELVE_DATA_API_KEY in the environment. Crypto spot pairs (BTC, ETH, SOL) use CoinGecko's real public data feed without keys.
              </p>
            </div>
          </div>
        )}

        {/* No Data Overlay */}
        {!loading && !error && candles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-6 z-10 text-center text-xs text-slate-500">
            No historical candles returned by provider for {symbol} on {resolution} resolution.
          </div>
        )}
      </div>
    </div>
  );
};
