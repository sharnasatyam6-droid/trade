import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { MarketQuote } from '../../types/market';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  ShoppingBag,
  RotateCcw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export const PortfolioView: React.FC = () => {
  const { setSelectedSymbol, navigate } = useRouter();
  const { cashBalance, positions, orders, resetPortfolio } = useWorkspace();

  const [liveQuotes, setLiveQuotes] = useState<Record<string, MarketQuote>>({});
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  // Fetch live market quotes for all open positions
  const refreshPositionPrices = async () => {
    if (positions.length === 0) return;
    setLoadingQuotes(true);
    try {
      const symbols = positions.map((p) => p.symbol).join(',');
      const res = await fetch(`/api/market/batch-quotes?symbols=${symbols}`);
      if (res.ok) {
        const data = await res.json();
        if (data.quotes) setLiveQuotes(data.quotes);
      }
    } catch (err) {
      console.error('Error updating portfolio prices:', err);
    } finally {
      setLoadingQuotes(false);
    }
  };

  useEffect(() => {
    refreshPositionPrices();
    const interval = setInterval(refreshPositionPrices, 10000);
    return () => clearInterval(interval);
  }, [positions]);

  // Total Equity & P&L Calculations
  const positionsMarketValue = positions.reduce((acc, pos) => {
    const livePrice = liveQuotes[pos.symbol]?.price ?? pos.currentPrice;
    return acc + pos.shares * livePrice;
  }, 0);

  const totalPortfolioEquity = Math.round((cashBalance + positionsMarketValue) * 100) / 100;
  const totalCostBasis = positions.reduce((acc, pos) => acc + pos.shares * pos.avgEntryPrice, 0);
  const totalUnrealizedPnL = positionsMarketValue - totalCostBasis;
  const totalUnrealizedPnLPercent = totalCostBasis > 0 ? (totalUnrealizedPnL / totalCostBasis) * 100 : 0;
  const isOverallPositive = totalUnrealizedPnL >= 0;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#48C8FF] tracking-wider uppercase mb-1">
            <PieChart className="w-4 h-4" />
            <span>Simulated Paper Trading Terminal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#EDF4FF]">
            Portfolio Holdings & Execution Ledger
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Simulated paper portfolio executing against real provider market quotes. Zero real capital.
          </p>
        </div>

        {/* Clear Paper Trading Disclaimer */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>PAPER TRADING (SIMULATION)</span>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Reset simulated paper trading account to $100,000 cash?')) {
                resetPortfolio();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A1022] hover:bg-slate-800 border border-slate-700 text-xs font-mono font-semibold text-slate-300 hover:text-rose-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Account</span>
          </button>
        </div>
      </div>

      {/* Account Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Equity */}
        <div className="p-5 rounded-2xl bg-[#0A1022]/90 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 uppercase font-mono font-semibold">Net Portfolio Equity</span>
          <div className="text-2xl font-bold font-mono text-[#EDF4FF] tabular-nums">
            ${totalPortfolioEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Cash: ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Card 2: Unrealized P&L */}
        <div className="p-5 rounded-2xl bg-[#0A1022]/90 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 uppercase font-mono font-semibold">Total Unrealized P&L</span>
          <div className={`text-2xl font-bold font-mono tabular-nums ${isOverallPositive ? 'text-[#4ADE80]' : 'text-[#FB7185]'}`}>
            {isOverallPositive ? '+' : ''}${totalUnrealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`text-[11px] font-mono font-semibold ${isOverallPositive ? 'text-[#4ADE80]' : 'text-[#FB7185]'}`}>
            {isOverallPositive ? '+' : ''}{totalUnrealizedPnLPercent.toFixed(2)}% Return
          </div>
        </div>

        {/* Card 3: Positions Market Value */}
        <div className="p-5 rounded-2xl bg-[#0A1022]/90 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 uppercase font-mono font-semibold">Holdings Market Value</span>
          <div className="text-2xl font-bold font-mono text-[#48C8FF] tabular-nums">
            ${positionsMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Across {positions.length} active positions
          </div>
        </div>

        {/* Card 4: Simulated Fee Tier */}
        <div className="p-5 rounded-2xl bg-[#0A1022]/90 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 uppercase font-mono font-semibold">Simulated Fee Tier</span>
          <div className="text-2xl font-bold font-mono text-[#EDF4FF] tabular-nums">
            0.05%
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Institutional Maker/Taker Model
          </div>
        </div>
      </div>

      {/* Active Positions Table */}
      <div className="p-6 rounded-2xl bg-[#0A1022]/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#EDF4FF] flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#48C8FF]" />
            <span>Open Holdings ({positions.length})</span>
          </h2>
          <button
            onClick={refreshPositionPrices}
            disabled={loadingQuotes}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#48C8FF] font-mono transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingQuotes ? 'animate-spin' : ''}`} />
            <span>Refresh Live Prices</span>
          </button>
        </div>

        {positions.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-xs text-slate-500 font-mono">No active positions in simulated account.</p>
            <button
              onClick={() => navigate('/terminal')}
              className="px-4 py-2 bg-[#48C8FF] text-[#050713] rounded-lg text-xs font-bold font-mono hover:bg-[#38b6ed] transition-colors"
            >
              Open Trading Terminal to Place Order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5">Instrument</th>
                  <th className="py-2.5">Shares / Units</th>
                  <th className="py-2.5">Avg Entry</th>
                  <th className="py-2.5">Real Market Price</th>
                  <th className="py-2.5">Market Value</th>
                  <th className="py-2.5">Unrealized P&L</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 tabular-nums">
                {positions.map((pos) => {
                  const liveQuote = liveQuotes[pos.symbol];
                  const livePrice = liveQuote?.price ?? pos.currentPrice;
                  const curValue = pos.shares * livePrice;
                  const costBasis = pos.shares * pos.avgEntryPrice;
                  const pnl = curValue - costBasis;
                  const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
                  const isPos = pnl >= 0;

                  return (
                    <tr key={pos.symbol} className="hover:bg-[#050713]/40">
                      <td className="py-3 font-bold text-[#EDF4FF]">
                        <span
                          onClick={() => {
                            setSelectedSymbol(pos.symbol);
                            navigate('/terminal', { symbol: pos.symbol });
                          }}
                          className="hover:text-[#48C8FF] cursor-pointer"
                        >
                          {pos.symbol}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300">{pos.shares}</td>
                      <td className="py-3 text-slate-400">${pos.avgEntryPrice.toFixed(2)}</td>
                      <td className="py-3 text-[#EDF4FF] font-semibold">${livePrice.toFixed(2)}</td>
                      <td className="py-3 text-[#48C8FF] font-semibold">${curValue.toFixed(2)}</td>
                      <td className={`py-3 font-bold ${isPos ? 'text-[#4ADE80]' : 'text-[#FB7185]'}`}>
                        {isPos ? '+' : ''}${pnl.toFixed(2)} ({isPos ? '+' : ''}{pnlPct.toFixed(2)}%)
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedSymbol(pos.symbol);
                            navigate('/terminal', { symbol: pos.symbol });
                          }}
                          className="px-2.5 py-1 bg-[#48C8FF]/10 hover:bg-[#48C8FF]/20 text-[#48C8FF] rounded font-semibold text-[11px] transition-colors"
                        >
                          Trade
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

      {/* Simulated Order Execution Log */}
      <div className="p-6 rounded-2xl bg-[#0A1022]/90 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#EDF4FF]">
          Simulated Execution Ledger ({orders.length})
        </h2>

        {orders.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 font-mono text-center">No trades simulated yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5">Time</th>
                  <th className="py-2.5">Type</th>
                  <th className="py-2.5">Symbol</th>
                  <th className="py-2.5">Quantity</th>
                  <th className="py-2.5">Execution Price</th>
                  <th className="py-2.5">Gross Total</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 tabular-nums">
                {orders.map((ord) => (
                  <tr key={ord.id}>
                    <td className="py-2.5 text-slate-400">{new Date(ord.timestamp).toLocaleString()}</td>
                    <td className="py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          ord.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {ord.type}
                      </span>
                    </td>
                    <td className="py-2.5 font-bold text-[#EDF4FF]">{ord.symbol}</td>
                    <td className="py-2.5 text-slate-300">{ord.shares}</td>
                    <td className="py-2.5 text-slate-300">${ord.price.toFixed(2)}</td>
                    <td className="py-2.5 text-[#48C8FF] font-semibold">${ord.totalValue.toFixed(2)}</td>
                    <td className="py-2.5">
                      <span className="text-emerald-400 font-bold">FILLED (SIM)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
