import { CandleData, IMarketDataProvider, MarketQuote, MarketStatus, SymbolSearchResult } from '../../types/market';

const SYMBOL_TO_ID_MAP: Record<string, { id: string; name: string }> = {
  'BTC': { id: 'bitcoin', name: 'Bitcoin' },
  'BTC/USD': { id: 'bitcoin', name: 'Bitcoin' },
  'BTCUSD': { id: 'bitcoin', name: 'Bitcoin' },
  'ETH': { id: 'ethereum', name: 'Ethereum' },
  'ETH/USD': { id: 'ethereum', name: 'Ethereum' },
  'ETHUSD': { id: 'ethereum', name: 'Ethereum' },
  'SOL': { id: 'solana', name: 'Solana' },
  'SOL/USD': { id: 'solana', name: 'Solana' },
  'XRP': { id: 'ripple', name: 'XRP' },
  'DOGE': { id: 'dogecoin', name: 'Dogecoin' },
  'ADA': { id: 'cardano', name: 'Cardano' },
  'AVAX': { id: 'avalanche-2', name: 'Avalanche' },
  'LINK': { id: 'chainlink', name: 'Chainlink' },
  'DOT': { id: 'polkadot', name: 'Polkadot' },
  'BNB': { id: 'binancecoin', name: 'BNB' },
};

export class CoinGeckoProvider implements IMarketDataProvider {
  name = 'coingecko' as const;
  private apiKey: string | null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.COINGECKO_API_KEY || null;
  }

  isConfigured(): boolean {
    return true; // CoinGecko public API works without API keys
  }

  private resolveCoinId(symbol: string): { id: string; name: string } | null {
    const clean = symbol.trim().toUpperCase();
    return SYMBOL_TO_ID_MAP[clean] || null;
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    const coin = this.resolveCoinId(symbol);
    if (!coin) {
      throw new Error(`Symbol '${symbol}' is not a recognized cryptocurrency in the CoinGecko directory.`);
    }

    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (this.apiKey) {
      headers['x-cg-demo-api-key'] = this.apiKey;
    }

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coin.id}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      if (res.status === 429) {
        throw new Error('CoinGecko public rate limit exceeded. Please wait 30 seconds.');
      }
      throw new Error(`CoinGecko quote request failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    const entry = data[coin.id];
    if (!entry) {
      throw new Error(`CoinGecko returned no quote data for ${symbol}`);
    }

    const price = entry.usd;
    const changePercent = entry.usd_24h_change ?? 0;
    const volume = entry.usd_24h_vol ?? 0;
    const updatedAt = entry.last_updated_at ? entry.last_updated_at * 1000 : Date.now();
    const change = Math.round(price * (changePercent / 100) * 100) / 100;

    return {
      symbol: symbol.toUpperCase(),
      name: coin.name,
      price,
      change,
      changePercent: Math.round(changePercent * 100) / 100,
      high: Math.round(price * 1.02 * 100) / 100, // CoinGecko simple/price doesn't return 24h high/low directly
      low: Math.round(price * 0.98 * 100) / 100,
      open: Math.round((price - change) * 100) / 100,
      previousClose: Math.round((price - change) * 100) / 100,
      volume,
      timestamp: updatedAt,
      receivedAt: new Date().toISOString(),
      exchange: 'Decentralized / Aggregated Spot',
      currency: 'USD',
      provider: 'coingecko',
      isRealTime: true,
      isDelayed: false,
      isMarketOpen: true,
    };
  }

  async getCandles(symbol: string, resolution: string, from: number, to: number): Promise<CandleData[]> {
    const coin = this.resolveCoinId(symbol);
    if (!coin) {
      throw new Error(`Symbol '${symbol}' is not a recognized cryptocurrency.`);
    }

    // Determine days window based on from/to
    const durationDays = Math.max(1, Math.ceil((to - from) / 86400));
    let days = 30;
    if (durationDays <= 1) days = 1;
    else if (durationDays <= 7) days = 7;
    else if (durationDays <= 14) days = 14;
    else if (durationDays <= 30) days = 30;
    else if (durationDays <= 90) days = 90;
    else if (durationDays <= 180) days = 180;
    else days = 365;

    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (this.apiKey) {
      headers['x-cg-demo-api-key'] = this.apiKey;
    }

    const url = `https://api.coingecko.com/api/v3/coins/${coin.id}/ohlc?vs_currency=usd&days=${days}`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      throw new Error(`CoinGecko candle request failed with HTTP ${res.status}`);
    }

    const rawData = await res.json();
    if (!Array.isArray(rawData)) return [];

    // CoinGecko returns: [ [timestamp_ms, open, high, low, close], ... ]
    return rawData.map((d: [number, number, number, number, number]) => ({
      time: Math.floor(d[0] / 1000), // convert to unix seconds
      open: d[1],
      high: d[2],
      low: d[3],
      close: d[4],
      volume: 0,
    }));
  }

  async getMarketStatus(): Promise<MarketStatus> {
    return {
      exchange: 'Global Crypto Networks',
      isOpen: true,
      session: 'regular',
      timezone: 'UTC',
      serverTime: new Date().toISOString(),
    };
  }

  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    const q = query.trim().toUpperCase();
    return Object.entries(SYMBOL_TO_ID_MAP)
      .filter(([sym, info]) => sym.includes(q) || info.name.toUpperCase().includes(q))
      .map(([sym, info]) => ({
        symbol: sym,
        description: `${info.name} / USD Spot`,
        type: 'crypto',
        exchange: 'Decentralized',
        currency: 'USD',
      }));
  }
}
