import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PaperPosition, PaperTradeOrder, ResearchReport, UserPreferences } from '../types';

interface WorkspaceContextType {
  searchHistory: string[];
  addSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;

  savedResearch: ResearchReport[];
  saveResearchReport: (report: ResearchReport) => void;
  removeSavedResearch: (id: string) => void;

  watchlist: string[];
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;

  // Paper Trading Simulation
  cashBalance: number;
  positions: PaperPosition[];
  orders: PaperTradeOrder[];
  executePaperTrade: (symbol: string, name: string, type: 'BUY' | 'SELL', shares: number, currentPrice: number, feeRate?: number) => { success: boolean; message: string };
  resetPortfolio: () => void;

  // Pinned Tools
  pinnedTools: string[];
  togglePinTool: (toolId: string) => void;

  // Visual & Universe Preferences
  preferences: UserPreferences;
  updatePreferences: (partial: Partial<UserPreferences>) => void;

  // Workspace Maintenance
  exportWorkspace: () => string;
  importWorkspace: (jsonString: string) => boolean;
  resetAllData: () => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  webglQuality: 'high',
  earthRotationSpeed: 1.0,
  enableSatellites: true,
  enableNightLights: true,
  cameraPreset: 'orbit',
  soundEnabled: false,
  theme: 'dark',
};

const INITIAL_CASH = 100000;

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexora_search_history');
      return saved ? JSON.parse(saved) : ['James Webb Space Telescope discoveries', 'Quantum fault-tolerant error correction', 'NVIDIA Blackwell chip architecture'];
    } catch {
      return [];
    }
  });

  const [savedResearch, setSavedResearch] = useState<ResearchReport[]>(() => {
    try {
      const saved = localStorage.getItem('nexora_saved_research');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexora_watchlist');
      return saved ? JSON.parse(saved) : ['NVDA', 'BTC/USD', 'AAPL', 'ETH/USD', 'SPX'];
    } catch {
      return ['NVDA', 'BTC/USD', 'AAPL'];
    }
  });

  const [cashBalance, setCashBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nexora_cash_balance');
      return saved ? parseFloat(saved) : INITIAL_CASH;
    } catch {
      return INITIAL_CASH;
    }
  });

  const [positions, setPositions] = useState<PaperPosition[]>(() => {
    try {
      const saved = localStorage.getItem('nexora_positions');
      return saved ? JSON.parse(saved) : [
        {
          symbol: 'NVDA',
          name: 'NVIDIA Corporation',
          shares: 50,
          avgEntryPrice: 135.20,
          currentPrice: 142.80,
          unrealizedPnL: 380.00,
          unrealizedPnLPercent: 5.62,
        },
      ];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<PaperTradeOrder[]>(() => {
    try {
      const saved = localStorage.getItem('nexora_orders');
      return saved ? JSON.parse(saved) : [
        {
          id: 'ord-initial-1',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          symbol: 'NVDA',
          type: 'BUY',
          shares: 50,
          price: 135.20,
          totalValue: 6760.00,
          status: 'FILLED',
          isSimulated: true,
        },
      ];
    } catch {
      return [];
    }
  });

  const [pinnedTools, setPinnedTools] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexora_pinned_tools');
      return saved ? JSON.parse(saved) : ['url-analyzer', 'json-validator', 'crypto-hasher'];
    } catch {
      return ['url-analyzer', 'json-validator'];
    }
  });

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem('nexora_preferences');
      return saved ? { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('nexora_search_history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    localStorage.setItem('nexora_saved_research', JSON.stringify(savedResearch));
  }, [savedResearch]);

  useEffect(() => {
    localStorage.setItem('nexora_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem('nexora_cash_balance', cashBalance.toString());
  }, [cashBalance]);

  useEffect(() => {
    localStorage.setItem('nexora_positions', JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem('nexora_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('nexora_pinned_tools', JSON.stringify(pinnedTools));
  }, [pinnedTools]);

  useEffect(() => {
    localStorage.setItem('nexora_preferences', JSON.stringify(preferences));
  }, [preferences]);

  const addSearchHistory = (query: string) => {
    if (!query.trim()) return;
    setSearchHistory(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== query.toLowerCase());
      return [query.trim(), ...filtered].slice(0, 20);
    });
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  const saveResearchReport = (report: ResearchReport) => {
    setSavedResearch(prev => {
      const exists = prev.some(r => r.id === report.id || r.query.toLowerCase() === report.query.toLowerCase());
      if (exists) {
        return prev.map(r => (r.id === report.id ? report : r));
      }
      return [report, ...prev];
    });
  };

  const removeSavedResearch = (id: string) => {
    setSavedResearch(prev => prev.filter(r => r.id !== id));
  };

  const addToWatchlist = (symbol: string) => {
    setWatchlist(prev => (prev.includes(symbol) ? prev : [...prev, symbol]));
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(s => s !== symbol));
  };

  const executePaperTrade = (
    symbol: string,
    name: string,
    type: 'BUY' | 'SELL',
    shares: number,
    currentPrice: number,
    feeRate = 0.0005 // 0.05% trading fee
  ) => {
    if (!currentPrice || currentPrice <= 0) {
      return {
        success: false,
        message: `Simulated order rejected: Live price unavailable for symbol ${symbol}. Real market data from provider is required.`,
      };
    }

    if (shares <= 0) {
      return { success: false, message: 'Invalid share quantity. Must be greater than zero.' };
    }

    const tradeValue = Math.round(shares * currentPrice * 100) / 100;
    const fee = Math.round(tradeValue * feeRate * 100) / 100;
    const totalCost = type === 'BUY' ? tradeValue + fee : tradeValue - fee;

    if (type === 'BUY') {
      if (cashBalance < totalCost) {
        return {
          success: false,
          message: `Insufficient paper cash. Required: $${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })} (including $${fee.toFixed(2)} fee), Available: $${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        };
      }

      setCashBalance(prev => Math.round((prev - totalCost) * 100) / 100);

      setPositions(prev => {
        const existing = prev.find(p => p.symbol === symbol);
        if (existing) {
          const totalShares = existing.shares + shares;
          const avgEntry = (existing.shares * existing.avgEntryPrice + totalCost) / totalShares;
          const unrealizedPnL = Math.round((currentPrice - avgEntry) * totalShares * 100) / 100;
          const unrealizedPnLPercent = Math.round(((currentPrice - avgEntry) / avgEntry) * 10000) / 100;

          return prev.map(p =>
            p.symbol === symbol
              ? {
                  ...p,
                  shares: totalShares,
                  avgEntryPrice: Math.round(avgEntry * 100) / 100,
                  currentPrice,
                  unrealizedPnL,
                  unrealizedPnLPercent,
                }
              : p
          );
        } else {
          return [
            ...prev,
            {
              symbol,
              name,
              shares,
              avgEntryPrice: currentPrice,
              currentPrice,
              unrealizedPnL: 0,
              unrealizedPnLPercent: 0,
            },
          ];
        }
      });
    } else {
      // SELL
      const existing = positions.find(p => p.symbol === symbol);
      if (!existing || existing.shares < shares) {
        return {
          success: false,
          message: `Insufficient paper position. You hold ${existing?.shares || 0} shares of ${symbol}.`,
        };
      }

      setCashBalance(prev => Math.round((prev + totalCost) * 100) / 100);

      setPositions(prev => {
        const remainingShares = existing.shares - shares;
        if (remainingShares <= 0) {
          return prev.filter(p => p.symbol !== symbol);
        } else {
          const unrealizedPnL = Math.round((currentPrice - existing.avgEntryPrice) * remainingShares * 100) / 100;
          const unrealizedPnLPercent = Math.round(((currentPrice - existing.avgEntryPrice) / existing.avgEntryPrice) * 10000) / 100;

          return prev.map(p =>
            p.symbol === symbol
              ? {
                  ...p,
                  shares: remainingShares,
                  currentPrice,
                  unrealizedPnL,
                  unrealizedPnLPercent,
                }
              : p
          );
        }
      });
    }

    const newOrder: PaperTradeOrder = {
      id: `ord-${Date.now()}`,
      timestamp: new Date().toISOString(),
      symbol,
      type,
      shares,
      price: currentPrice,
      totalValue: totalCost,
      status: 'FILLED',
      isSimulated: true,
    };

    setOrders(prev => [newOrder, ...prev]);

    return {
      success: true,
      message: `Simulated order filled: ${type} ${shares} ${symbol} @ $${currentPrice.toFixed(2)}`,
    };
  };

  const resetPortfolio = () => {
    setCashBalance(INITIAL_CASH);
    setPositions([]);
    setOrders([]);
  };

  const togglePinTool = (toolId: string) => {
    setPinnedTools(prev => (prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]));
  };

  const updatePreferences = (partial: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...partial }));
  };

  const exportWorkspace = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      searchHistory,
      savedResearch,
      watchlist,
      portfolio: {
        cashBalance,
        positions,
        orders,
      },
      pinnedTools,
      preferences,
    };
    return JSON.stringify(data, null, 2);
  };

  const importWorkspace = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.searchHistory && Array.isArray(data.searchHistory)) setSearchHistory(data.searchHistory);
      if (data.savedResearch && Array.isArray(data.savedResearch)) setSavedResearch(data.savedResearch);
      if (data.watchlist && Array.isArray(data.watchlist)) setWatchlist(data.watchlist);
      if (data.portfolio) {
        if (typeof data.portfolio.cashBalance === 'number') setCashBalance(data.portfolio.cashBalance);
        if (Array.isArray(data.portfolio.positions)) setPositions(data.portfolio.positions);
        if (Array.isArray(data.portfolio.orders)) setOrders(data.portfolio.orders);
      }
      if (data.pinnedTools && Array.isArray(data.pinnedTools)) setPinnedTools(data.pinnedTools);
      if (data.preferences) setPreferences(prev => ({ ...prev, ...data.preferences }));
      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  };

  const resetAllData = () => {
    localStorage.clear();
    setSearchHistory([]);
    setSavedResearch([]);
    setWatchlist(['NVDA', 'BTC/USD', 'AAPL']);
    resetPortfolio();
    setPreferences(DEFAULT_PREFERENCES);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        searchHistory,
        addSearchHistory,
        clearSearchHistory,
        savedResearch,
        saveResearchReport,
        removeSavedResearch,
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        cashBalance,
        positions,
        orders,
        executePaperTrade,
        resetPortfolio,
        pinnedTools,
        togglePinTool,
        preferences,
        updatePreferences,
        exportWorkspace,
        importWorkspace,
        resetAllData,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
