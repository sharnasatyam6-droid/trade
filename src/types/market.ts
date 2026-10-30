export interface MarketQuote {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  timestamp: number; // Unix timestamp in milliseconds from provider
  receivedAt: string; // ISO string when server received quote
  exchange?: string;
  currency: string;
  provider: 'finnhub' | 'coingecko' | 'twelvedata' | 'alphavantage';
  isRealTime: boolean;
  isDelayed: boolean;
  delayMinutes?: number;
  isMarketOpen?: boolean;
}

export interface CandleData {
  time: number; // Unix timestamp in seconds for charting
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketStatus {
  exchange: string;
  isOpen: boolean;
  session: 'regular' | 'pre-market' | 'after-hours' | 'closed';
  timezone: string;
  serverTime: string;
}

export interface SymbolSearchResult {
  symbol: string;
  description: string;
  type: string;
  exchange?: string;
  currency?: string;
}

export interface ProviderCapability {
  name: string;
  configured: boolean;
  supportsRealTimeWs: boolean;
  supportsCandles: boolean;
  supportsCrypto: boolean;
  supportsEquities: boolean;
  rateLimitInfo: string;
}

export interface IMarketDataProvider {
  name: string;
  isConfigured(): boolean;
  getQuote(symbol: string): Promise<MarketQuote>;
  getCandles(symbol: string, resolution: string, from: number, to: number): Promise<CandleData[]>;
  getMarketStatus(exchange?: string): Promise<MarketStatus>;
  searchSymbols(query: string): Promise<SymbolSearchResult[]>;
}
