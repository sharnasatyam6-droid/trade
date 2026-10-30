import { useState, useEffect, useRef, useCallback } from 'react';
import { MarketQuote, CandleData } from '../types/market';

export type ConnectionState =
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'DISCONNECTED'
  | 'DELAYED DATA'
  | 'HISTORICAL DATA'
  | 'UNAVAILABLE';

interface UseRealTimeMarketDataOptions {
  symbol: string;
  resolution?: string;
  autoRefreshIntervalMs?: number;
}

export function useRealTimeMarketData({
  symbol,
  resolution = '1D',
  autoRefreshIntervalMs = 5000,
}: UseRealTimeMarketDataOptions) {
  const [quote, setQuote] = useState<MarketQuote | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED');
  const [lastEventTime, setLastEventTime] = useState<string | null>(null);
  const [lastConnectionTime, setLastConnectionTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [loadingCandles, setLoadingCandles] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const isMountedRef = useRef(true);

  // Fetch verified quote from server
  const fetchQuote = useCallback(async (sym: string) => {
    try {
      const res = await fetch(`/api/market/quote?symbol=${encodeURIComponent(sym)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}: Failed to fetch quote`);
      }
      const data: MarketQuote = await res.json();
      if (isMountedRef.current) {
        setQuote(data);
        setError(null);
        setLoadingQuote(false);
        setConnectionState(data.isDelayed ? 'DELAYED DATA' : 'CONNECTED');
        setLastEventTime(new Date(data.timestamp).toLocaleTimeString());
        setLastConnectionTime(new Date().toLocaleTimeString());
      }
      return data;
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message || 'Live market data is currently unavailable. Check your provider configuration or connection.');
        setConnectionState('UNAVAILABLE');
        setLoadingQuote(false);
      }
      return null;
    }
  }, []);

  // Fetch verified historical candles
  const fetchCandles = useCallback(async (sym: string, resParam: string) => {
    setLoadingCandles(true);
    try {
      const res = await fetch(`/api/market/candles?symbol=${encodeURIComponent(sym)}&resolution=${resParam}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}: Failed to load candles`);
      }
      const data = await res.json();
      if (isMountedRef.current) {
        setCandles(data.candles || []);
        setLoadingCandles(false);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setCandles([]);
        setLoadingCandles(false);
      }
    }
  }, []);

  // Initial load when symbol or resolution changes
  useEffect(() => {
    isMountedRef.current = true;
    setLoadingQuote(true);
    setError(null);

    fetchQuote(symbol);
    fetchCandles(symbol, resolution);

    // Setup Polling loop with tab visibility awareness
    const runPoll = async () => {
      if (document.visibilityState === 'hidden') return;
      await fetchQuote(symbol);
    };

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = window.setInterval(runPoll, autoRefreshIntervalMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchQuote(symbol);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [symbol, resolution, autoRefreshIntervalMs, fetchQuote, fetchCandles]);

  const reconnect = useCallback(() => {
    setConnectionState('RECONNECTING');
    fetchQuote(symbol);
    fetchCandles(symbol, resolution);
  }, [symbol, resolution, fetchQuote, fetchCandles]);

  return {
    quote,
    candles,
    connectionState,
    lastEventTime,
    lastConnectionTime,
    error,
    loadingQuote,
    loadingCandles,
    reconnect,
  };
}
