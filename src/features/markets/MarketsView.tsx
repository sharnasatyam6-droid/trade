import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { MarketQuote, MarketStatus } from '../../types/market';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Globe,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  ChevronRight,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

const TRACKED_CRYPTO = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK'];
const TRACKED_EQUITIES = ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'AMZN', 'GOOGL', 'SPY', 'QQQ'];

export const MarketsView: React.FC = () => {
  const { setSelectedSymbol, navigate } = useRouter();

  const [cryptoQuotes, setCryptoQuotes] = useState<Record<string, MarketQuote>>({});
  const [equityQuotes, setEquityQuotes] = useState<Record<string, MarketQuote>>({});
  const [equityErrors, setEquityErrors] = useState<Record<string, string>>({});
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'crypto' | 'equities'>('all');

  const fetchAllMarketData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Real Crypto Quotes
      const cryptoRes = await fetch(`/api/market/batch-quotes?symbols=${TRACKED_CRYPTO.join(',')}`);
      if (cryptoRes.ok) {
        const data = await cryptoRes.json();
        if (data.quotes) setCryptoQuotes(data.quotes);
      }

      // 2. Fetch US Equities Quotes
      const equityRes = await fetch(`/api/market/batch-quotes?symbols=${TRACKED_EQUITIES.join(',')}`);
      if (equityRes.ok) {
        const data = await equityRes.json();
        if (data.quotes) setEquityQuotes(data.quotes);
        if (data.errors) setEquityErrors(data.errors);
      }

      // 3. Fetch Exchange Market Status
      const statusRes = await fetch('/api/market/status?exchange=US');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setMarketStatus(statusData);
      }
    } catch (err) {
      console.error('Error fetching market overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMarketData();
    const interval = setInterval(fetchAllMarketData, 10000); // 10s refresh
    return () => clearInterval(interval);
  }, []);

  const handleSelectTicker = (symbol: string) => {
    setSelectedSymbol(symbol);
    navigate('/terminal', { symbol });
  };

  const allQuotes = { ...cryptoQuotes, ...equityQuotes };
  const allSymbols = Array.from(new Set([...TRACKED_CRYPTO, ...TRACKED_EQUITIES]));

  const filteredSymbols = allSymbols.filter((sym) => {
    const isCrypto = TRACKED_CRYPTO.includes(sym);
    if (activeTab === 'crypto' && !isCrypto) return false;
    if (activeTab === 'equities' && isCrypto) return false;
    if (searchFilter.trim()) {
      const q = allQuotes[sym];
      const matchSym = sym.toLowerCase().includes(searchFilter.toLowerCase());
      const matchName = q?.name?.toLowerCase().includes(searchFilter.toLowerCase());
      return matchSym || matchName;
    }
    return true;
  });

  return (
    <div className="relative min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#48C8FF] tracking-wider uppercase mb-1">
            <Globe className="w-4 h-4" />
            <span>Global Market Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#EDF4FF]">
            Markets & Multi-Asset Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Verified real-time streaming quotes across digital crypto assets and US equities. Zero simulated data.
          </p>
        </div>

        {/* Market Status Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-[#0A1022] border border-slate-800 text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Crypto:</span>
            <span className="text-[#EDF4FF] font-bold">24/7 OPEN</span>
          </div>

          {marketStatus && (
            <div className="px-3 py-1.5 rounded-lg bg-[#0A1022] border border-slate-800 text-xs font-mono flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  marketStatus.isOpen ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-400">NYSE/NASDAQ:</span>
              <span className="text-[#EDF4FF] font-bold uppercase">{marketStatus.session}</span>
            </div>
          )}

          <button
            onClick={fetchAllMarketData}
            disabled={loading}
            className="p-2 bg-[#0A1022] hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-[#48C8FF] transition-colors"
            title="Refresh All Quotes"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 bg-[#0A1022] p-1 rounded-xl border border-slate-800 w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'all' ? 'bg-[#48C8FF]/20 text-[#48C8FF] font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Instruments ({allSymbols.length})
          </button>
          <button
            onClick={() => setActiveTab('crypto')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'crypto' ? 'bg-[#48C8FF]/20 text-[#48C8FF] font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cryptocurrency ({TRACKED_CRYPTO.length})
          </button>
          <button
            onClick={() => setActiveTab('equities')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'equities' ? 'bg-[#48C8FF]/20 text-[#48C8FF] font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            US Equities ({TRACKED_EQUITIES.length})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter instruments..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#0A1022] border border-slate-800 rounded-xl text-xs text-[#EDF4FF] focus:outline-none focus:border-[#48C8FF] font-mono"
          />
        </div>
      </div>

      {/* Real Market Quotes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredSymbols.map((sym) => {
          const q = allQuotes[sym];
          const isUp = q && q.change >= 0;
          const isCrypto = TRACKED_CRYPTO.includes(sym);
          const errorMsg = equityErrors[sym];

          return (
            <div
              key={sym}
              onClick={() => handleSelectTicker(sym)}
              className="p-5 rounded-2xl bg-[#0A1022]/80 border border-slate-800 hover:border-[#48C8FF]/40 transition-all cursor-pointer flex flex-col justify-between space-y-4 group shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-[#EDF4FF] font-mono group-hover:text-[#48C8FF] transition-colors">
                      {sym}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#050713] text-slate-400 uppercase font-mono border border-slate-800">
                      {isCrypto ? 'CRYPTO' : 'EQUITY'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 truncate max-w-[150px] mt-0.5">
                    {q?.name || (isCrypto ? `${sym} / USD` : sym)}
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-500 uppercase">
                  {q?.provider ? q.provider : isCrypto ? 'COINGECKO' : 'FINNHUB'}
                </div>
              </div>

              {/* Price Details */}
              <div className="space-y-1">
                {q ? (
                  <>
                    <div className="text-xl font-bold font-mono text-[#EDF4FF] tabular-nums">
                      ${q.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </div>
                    <div
                      className={`text-xs font-semibold flex items-center gap-0.5 font-mono tabular-nums ${
                        isUp ? 'text-[#4ADE80]' : 'text-[#FB7185]'
                      }`}
                    >
                      {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      <span>
                        {isUp ? '+' : ''}
                        {q.change.toFixed(2)} ({q.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </>
                ) : errorMsg ? (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 font-mono space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                      <span>Configuration Notice</span>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-snug">
                      Requires FINNHUB_API_KEY
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-xs text-slate-500 font-mono flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 animate-spin text-[#48C8FF]" />
                    <span>Fetching live price...</span>
                  </div>
                )}
              </div>

              {/* Action Link */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 group-hover:text-[#48C8FF] transition-colors">
                <span className="font-mono text-[11px]">Open Chart Terminal</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
