import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useRealTimeMarketData } from '../../hooks/useRealTimeMarketData';
import { TradingViewChart } from '../../components/charts/TradingViewChart';
import { MarketQuote } from '../../types/market';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  ShoppingCart,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  DollarSign,
  Layers,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const POPULAR_WATCHLIST_SYMBOLS = ['BTC', 'ETH', 'SOL', 'NVDA', 'AAPL', 'MSFT', 'TSLA', 'XRP', 'DOGE'];

export const TerminalView: React.FC = () => {
  const { selectedSymbol, setSelectedSymbol, navigate } = useRouter();
  const {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    cashBalance,
    positions,
    orders,
    executePaperTrade,
    resetPortfolio,
  } = useWorkspace();

  const [resolution, setResolution] = useState('1D');
  const [chartType, setChartType] = useState<'candlestick' | 'area' | 'line'>('candlestick');
  const [showSma20, setShowSma20] = useState(true);
  const [showSma50, setShowSma50] = useState(true);
  const [showVolume, setShowVolume] = useState(true);

  // Watchlist quotes cache
  const [watchlistQuotes, setWatchlistQuotes] = useState<Record<string, MarketQuote>>({});
  const [watchlistErrors, setWatchlistErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ symbol: string; description: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Order Entry Form
  const [tradeAction, setTradeAction] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeUnits, setTradeUnits] = useState<number>(1);
  const [tradeStatus, setTradeStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Real-time market data hook for selected symbol
  const {
    quote,
    candles,
    connectionState,
    lastEventTime,
    lastConnectionTime,
    error: quoteError,
    loadingQuote,
    loadingCandles,
    reconnect,
  } = useRealTimeMarketData({
    symbol: selectedSymbol,
    resolution,
    autoRefreshIntervalMs: 5000,
  });

  // Fetch batch quotes for watchlist items
  const fetchWatchlistQuotes = async () => {
    try {
      const symbolsToFetch = Array.from(new Set([...watchlist, ...POPULAR_WATCHLIST_SYMBOLS])).slice(0, 15);
      const res = await fetch(`/api/market/batch-quotes?symbols=${symbolsToFetch.join(',')}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.quotes) setWatchlistQuotes(data.quotes);
      if (data.errors) setWatchlistErrors(data.errors);
    } catch (err) {
      console.error('Watchlist fetch error:', err);
    }
  };

  useEffect(() => {
    fetchWatchlistQuotes();
    const interval = setInterval(fetchWatchlistQuotes, 8000);
    return () => clearInterval(interval);
  }, [watchlist]);

  // Handle symbol search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Execute paper trade at current real market price
  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote || quote.price <= 0) {
      setTradeStatus({
        success: false,
        message: `Order rejected: Valid live market price from provider required for ${selectedSymbol}.`,
      });
      return;
    }

    const res = executePaperTrade(
      quote.symbol,
      quote.name || quote.symbol,
      tradeAction,
      tradeUnits,
      quote.price,
      0.0005 // 0.05% simulated fee
    );

    setTradeStatus({ success: res.success, message: res.message });
    setTimeout(() => setTradeStatus(null), 5000);
  };

  const currentPosition = positions.find((p) => p.symbol === selectedSymbol);
  const positionValue = currentPosition ? currentPosition.shares * (quote?.price || currentPosition.currentPrice) : 0;
  const positionPnL = currentPosition ? positionValue - currentPosition.shares * currentPosition.avgEntryPrice : 0;
  const isPnLPositive = positionPnL >= 0;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col p-3 sm:p-4 lg:p-6 space-y-4 max-w-[1720px] mx-auto">
      {/* Top Ticker Status & Provider Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0A1022]/90 border border-slate-800 rounded-xl backdrop-blur-md">
        {/* Left: Active Ticker & Real Quote Metrics */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#EDF4FF] tracking-tight">
              {selectedSymbol}
            </h1>
            <span className="text-xs text-slate-400 font-medium">{quote?.name || selectedSymbol}</span>
            {quote?.exchange && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 uppercase font-mono">
                {quote.exchange}
              </span>
            )}
          </div>

          {quote ? (
            <div className="flex items-baseline gap-3 tabular-nums font-mono">
              <span className="text-xl sm:text-2xl font-bold text-[#EDF4FF]">
                ${quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </span>
              <span
                className={`text-xs sm:text-sm font-semibold flex items-center gap-0.5 ${
                  quote.change >= 0 ? 'text-[#4ADE80]' : 'text-[#FB7185]'
                }`}
              >
                {quote.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                <span>
                  {quote.change >= 0 ? '+' : ''}
                  {quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
                </span>
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#48C8FF]" />
              <span>Fetching provider quote...</span>
            </div>
          )}
        </div>

        {/* Right: Data Provenance & Real-Time Connection Badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {/* Connection Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold ${
              connectionState === 'CONNECTED'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : connectionState === 'RECONNECTING'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : connectionState === 'DELAYED DATA'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connectionState === 'CONNECTED'
                  ? 'bg-emerald-400'
                  : connectionState === 'RECONNECTING'
                  ? 'bg-amber-400 animate-pulse'
                  : connectionState === 'DELAYED DATA'
                  ? 'bg-blue-400'
                  : 'bg-rose-400'
              }`}
            />
            <span>{connectionState}</span>
          </div>

          {/* Provider Name */}
          <div className="hidden md:flex items-center gap-1.5 text-slate-400">
            <span className="text-slate-500">FEED:</span>
            <span className="text-[#EDF4FF] font-semibold">{quote?.provider ? quote.provider.toUpperCase() : 'COINGECKO SPOT'}</span>
          </div>

          {/* Timestamps */}
          {lastEventTime && (
            <div className="hidden lg:flex items-center gap-1 text-slate-500 text-[11px]">
              <Clock className="w-3.5 h-3.5" />
              <span>EVENT: {lastEventTime}</span>
            </div>
          )}

          <button
            onClick={reconnect}
            className="p-1 text-slate-400 hover:text-[#48C8FF] rounded transition-colors"
            title="Force quote refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Terminal Grid: 3 Columns (Watchlist | Chart | Order Entry) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-grow">
        {/* Left Column: Watchlist & Search (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-3 p-3.5 bg-[#0A1022]/90 border border-slate-800 rounded-xl">
          {/* Symbol Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker (e.g. BTC, ETH, NVDA)..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#050713] border border-slate-800 rounded-lg text-xs text-[#EDF4FF] focus:outline-none focus:border-[#48C8FF] font-mono"
            />
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="p-2 bg-[#050713] border border-[#48C8FF]/30 rounded-lg max-h-40 overflow-y-auto space-y-1">
              {searchResults.map((hit) => (
                <div
                  key={hit.symbol}
                  onClick={() => {
                    setSelectedSymbol(hit.symbol);
                    addToWatchlist(hit.symbol);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="px-2 py-1.5 rounded hover:bg-[#48C8FF]/15 cursor-pointer flex justify-between items-center text-xs"
                >
                  <span className="font-bold text-[#EDF4FF]">{hit.symbol}</span>
                  <span className="text-[11px] text-slate-400 truncate max-w-[120px]">{hit.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Watchlist Header */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1 font-semibold uppercase tracking-wider">
            <span>Market Watchlist</span>
            <span className="text-[11px] font-mono text-slate-500">{watchlist.length} pinned</span>
          </div>

          {/* Watchlist Items List */}
          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[580px] pr-1">
            {Array.from(new Set([...watchlist, ...POPULAR_WATCHLIST_SYMBOLS])).map((sym) => {
              const q = watchlistQuotes[sym];
              const isSelected = selectedSymbol === sym;
              const isUp = q && q.change >= 0;
              const hasError = watchlistErrors[sym];

              return (
                <div
                  key={sym}
                  onClick={() => setSelectedSymbol(sym)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#48C8FF]/15 border-[#48C8FF]/50 shadow-sm'
                      : 'bg-[#050713]/80 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-[#EDF4FF] font-mono">{sym}</span>
                      <span className="text-[9px] text-slate-500 uppercase">{q?.provider || (sym.includes('BTC') || sym.includes('ETH') || sym.includes('SOL') ? 'CRYPTO' : 'US')}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[110px]">
                      {q?.name || sym}
                    </div>
                  </div>

                  <div className="text-right font-mono tabular-nums">
                    {q ? (
                      <>
                        <div className="text-xs font-bold text-[#EDF4FF]">
                          ${q.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </div>
                        <div className={`text-[10px] font-semibold ${isUp ? 'text-[#4ADE80]' : 'text-[#FB7185]'}`}>
                          {isUp ? '+' : ''}{q.changePercent.toFixed(2)}%
                        </div>
                      </>
                    ) : hasError ? (
                      <span className="text-[10px] text-amber-400/80 font-mono">Needs Key</span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Loading...</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key Requirement Notice */}
          <div className="mt-auto pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 leading-tight">
            Crypto spot (BTC, ETH, SOL) streams real live quotes & candles. US stocks require <code className="text-slate-400">FINNHUB_API_KEY</code>.
          </div>
        </div>

        {/* Center Column: Interactive TradingView Chart (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col gap-3 min-h-[500px]">
          <TradingViewChart
            symbol={selectedSymbol}
            quote={quote}
            candles={candles}
            resolution={resolution}
            onResolutionChange={setResolution}
            loading={loadingCandles}
            error={quoteError}
            chartType={chartType}
            onChartTypeChange={setChartType}
            showSma20={showSma20}
            showSma50={showSma50}
            showVolume={showVolume}
          />
        </div>

        {/* Right Column: Order Entry & Real-Time Portfolio (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4 p-4 bg-[#0A1022]/90 border border-slate-800 rounded-xl">
          {/* Order Entry Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-[#48C8FF]" />
              <span>Simulated Order Desk</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono font-bold">
              PAPER TRADING
            </span>
          </div>

          {/* Paper Cash & Account Equity */}
          <div className="p-3 bg-[#050713] rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Paper Cash:</span>
              <span className="font-bold text-[#EDF4FF] tabular-nums">
                ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Position Value:</span>
              <span className="font-bold text-[#48C8FF] tabular-nums">
                ${positionValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Holding:</span>
              <span className="text-[#EDF4FF]">
                {currentPosition ? `${currentPosition.shares} units` : '0 units'}
              </span>
            </div>
            {currentPosition && (
              <div className="flex justify-between border-t border-slate-800 pt-1 text-slate-400">
                <span>Unrealized P&L:</span>
                <span className={`font-bold ${isPnLPositive ? 'text-[#4ADE80]' : 'text-[#FB7185]'}`}>
                  {isPnLPositive ? '+' : ''}${positionPnL.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Buy / Sell Form */}
          <form onSubmit={handleOrderSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTradeAction('BUY')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  tradeAction === 'BUY'
                    ? 'bg-[#4ADE80] text-[#050713] shadow-md shadow-[#4ADE80]/20'
                    : 'bg-[#050713] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setTradeAction('SELL')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  tradeAction === 'SELL'
                    ? 'bg-[#FB7185] text-[#050713] shadow-md shadow-[#FB7185]/20'
                    : 'bg-[#050713] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                SELL
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Units / Quantity:</span>
                <span className="text-slate-500 font-mono">Real-fill simulation</span>
              </div>
              <input
                type="number"
                min="0.001"
                step="any"
                value={tradeUnits}
                onChange={(e) => setTradeUnits(Math.max(0.001, parseFloat(e.target.value) || 0.001))}
                className="w-full px-3 py-2 bg-[#050713] border border-slate-800 rounded-lg text-xs text-[#EDF4FF] focus:outline-none focus:border-[#48C8FF] font-mono"
              />
            </div>

            {/* Quick Sizing Buttons */}
            <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-slate-400">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    if (quote && quote.price > 0) {
                      const maxUnits = (cashBalance * (pct / 100)) / quote.price;
                      setTradeUnits(Math.max(0.001, Math.round(maxUnits * 1000) / 1000));
                    }
                  }}
                  className="py-1 rounded bg-[#050713] border border-slate-800 hover:border-slate-700 hover:text-white transition-colors"
                >
                  {pct}%
                </button>
              ))}
            </div>

            <div className="p-2.5 rounded-lg bg-[#050713]/80 text-xs font-mono text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Market Price:</span>
                <span className="text-[#EDF4FF] tabular-nums font-bold">
                  {quote?.price ? `$${quote.price.toFixed(2)}` : 'Unavailable'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Fee (0.05%):</span>
                <span className="text-slate-500 tabular-nums">
                  ${((quote?.price || 0) * tradeUnits * 0.0005).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1">
                <span>Estimated Value:</span>
                <span className="text-[#48C8FF] font-bold tabular-nums">
                  ${((quote?.price || 0) * tradeUnits).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {tradeStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs font-medium leading-relaxed ${
                  tradeStatus.success ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {tradeStatus.message}
              </div>
            )}

            <button
              type="submit"
              disabled={!quote || quote.price <= 0}
              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 ${
                tradeAction === 'BUY'
                  ? 'bg-[#4ADE80] text-[#050713] hover:bg-[#3ec470]'
                  : 'bg-[#FB7185] text-[#050713] hover:bg-[#e65a6f]'
              }`}
            >
              Simulate {tradeAction} {tradeUnits} {selectedSymbol}
            </button>
          </form>

          {/* Reset Portfolio */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={resetPortfolio}
              className="w-full py-1.5 text-[11px] text-slate-500 hover:text-rose-400 transition-colors text-center font-mono"
            >
              Reset Paper Account ($100k Cash)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
