import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useRealTimeMarketData } from '../../hooks/useRealTimeMarketData';
import { calculateIndicators } from '../../utils/indicators';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldAlert,
  RefreshCw,
  Compass,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';

const TRACKED_ANALYTICS_SYMBOLS = ['BTC', 'ETH', 'SOL', 'NVDA', 'AAPL', 'MSFT'];

export const AnalyticsView: React.FC = () => {
  const { selectedSymbol, setSelectedSymbol, navigate } = useRouter();

  const {
    quote,
    candles,
    loadingCandles,
    error,
    reconnect,
  } = useRealTimeMarketData({
    symbol: selectedSymbol,
    resolution: '1D',
  });

  // Calculate real technical indicators from provider candle array
  const indicators = useMemo(() => calculateIndicators(candles), [candles]);

  const rsiStatus = useMemo(() => {
    if (indicators.rsi14 === null) return { text: 'N/A', color: 'text-slate-400' };
    if (indicators.rsi14 >= 70) return { text: 'OVERBOUGHT (>70)', color: 'text-rose-400' };
    if (indicators.rsi14 <= 30) return { text: 'OVERSOLD (<30)', color: 'text-emerald-400' };
    return { text: 'NEUTRAL (30-70)', color: 'text-[#48C8FF]' };
  }, [indicators.rsi14]);

  const smaStatus = useMemo(() => {
    if (!indicators.sma20 || !quote) return null;
    const diff = quote.price - indicators.sma20;
    const diffPct = (diff / indicators.sma20) * 100;
    return {
      above: diff >= 0,
      diff: Math.abs(diff),
      diffPct: Math.abs(diffPct),
    };
  }, [indicators.sma20, quote]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#48C8FF] tracking-wider uppercase mb-1">
            <Activity className="w-4 h-4" />
            <span>Quantitative Market Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#EDF4FF]">
            Technical Indicator Engine
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Mathematically rigorous SMA, RSI, Bollinger Bands, and Volatility derived from real provider candle series.
          </p>
        </div>

        {/* Ticker Selector */}
        <div className="flex items-center gap-1.5 bg-[#0A1022] p-1 rounded-xl border border-slate-800">
          {TRACKED_ANALYTICS_SYMBOLS.map((sym) => (
            <button
              key={sym}
              onClick={() => setSelectedSymbol(sym)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                selectedSymbol === sym
                  ? 'bg-[#48C8FF]/20 text-[#48C8FF] border border-[#48C8FF]/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Header */}
      <div className="p-6 rounded-2xl bg-[#0A1022]/90 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold font-mono text-[#EDF4FF]">{selectedSymbol}</h2>
              <span className="text-xs text-slate-400 font-mono">1D Historical Candles ({candles.length} periods)</span>
            </div>
            {quote && (
              <div className="text-xl font-bold font-mono text-[#48C8FF] mt-1 tabular-nums">
                Current Real Price: ${quote.price.toFixed(2)}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/terminal', { symbol: selectedSymbol })}
            className="px-4 py-2 bg-[#48C8FF] text-[#050713] hover:bg-[#38b6ed] rounded-xl text-xs font-mono font-bold transition-colors flex items-center gap-1.5"
          >
            <span>Launch Chart Terminal</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loadingCandles ? (
          <div className="py-12 flex items-center justify-center gap-2 text-xs text-slate-400 font-mono">
            <RefreshCw className="w-4 h-4 animate-spin text-[#48C8FF]" />
            <span>Computing quantitative indicator models...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-mono">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* RSI Card */}
            <div className="p-4 rounded-xl bg-[#050713] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>RSI (14-Period)</span>
                <span className={`font-bold ${rsiStatus.color}`}>{rsiStatus.text}</span>
              </div>
              <div className="text-3xl font-extrabold font-mono text-[#EDF4FF] tabular-nums">
                {indicators.rsi14 !== null ? indicators.rsi14.toFixed(1) : 'N/A'}
              </div>
              {/* RSI Slider Gauge */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-[#48C8FF] to-rose-400"
                  style={{ width: `${Math.min(100, Math.max(0, indicators.rsi14 || 50))}%` }}
                />
              </div>
            </div>

            {/* SMA 20 Card */}
            <div className="p-4 rounded-xl bg-[#050713] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>20-Day SMA</span>
                {smaStatus && (
                  <span className={smaStatus.above ? 'text-emerald-400' : 'text-rose-400'}>
                    {smaStatus.above ? 'ABOVE SMA' : 'BELOW SMA'}
                  </span>
                )}
              </div>
              <div className="text-3xl font-extrabold font-mono text-[#48C8FF] tabular-nums">
                {indicators.sma20 !== null ? `$${indicators.sma20.toFixed(2)}` : 'N/A'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {smaStatus ? `${smaStatus.diffPct.toFixed(2)}% ${smaStatus.above ? 'premium' : 'discount'}` : 'Insufficient candles'}
              </div>
            </div>

            {/* Bollinger Bands */}
            <div className="p-4 rounded-xl bg-[#050713] border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 font-mono">Bollinger Bands (20, 2σ)</div>
              {indicators.bollingerBands ? (
                <div className="space-y-1 font-mono text-xs tabular-nums">
                  <div className="flex justify-between text-rose-300">
                    <span>Upper:</span>
                    <span>${indicators.bollingerBands.upper.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Middle:</span>
                    <span>${indicators.bollingerBands.middle.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-300">
                    <span>Lower:</span>
                    <span>${indicators.bollingerBands.lower.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm font-mono text-slate-500 py-2">Insufficient historical data</div>
              )}
            </div>

            {/* Historical Volatility */}
            <div className="p-4 rounded-xl bg-[#050713] border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 font-mono">Annualized Volatility (30D)</div>
              <div className="text-3xl font-extrabold font-mono text-[#9875FF] tabular-nums">
                {indicators.historicalVolatility !== null ? `${indicators.historicalVolatility.toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Log returns standard deviation
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Methodology Disclaimer */}
      <div className="p-4 rounded-xl bg-[#0A1022]/60 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 font-bold text-[#EDF4FF] uppercase tracking-wider text-[11px]">
          <Info className="w-4 h-4 text-[#48C8FF]" />
          <span>Indicator Calculation Integrity</span>
        </div>
        <p className="leading-relaxed">
          All displayed statistical values (SMA, RSI, Bollinger Bands, Volatility) are computed live on client request from actual provider historical candles. No hypothetical future returns or automated signals are promised.
        </p>
      </div>
    </div>
  );
};
