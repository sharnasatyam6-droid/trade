import { CandleData, IMarketDataProvider, MarketQuote, MarketStatus, SymbolSearchResult } from '../../types/market';

export class TwelveDataProvider implements IMarketDataProvider {
  name = 'twelvedata' as const;
  private apiKey: string | null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TWELVE_DATA_API_KEY || null;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey !== 'MY_TWELVE_DATA_API_KEY' && this.apiKey.trim().length > 0);
  }

  private getAuthKey(): string {
    if (!this.apiKey) {
      throw new Error('TWELVE_DATA_API_KEY is not configured on the server.');
    }
    return this.apiKey;
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    const key = this.getAuthKey();
    const clean = symbol.trim().toUpperCase();
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(clean)}&apikey=${key}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Twelve Data error: HTTP ${res.status}`);
    const data = await res.json();

    if (data.status === 'error' || data.code) {
      throw new Error(`Twelve Data: ${data.message || 'Symbol quote unavailable'}`);
    }

    const price = parseFloat(data.close || data.price || '0');
    const change = parseFloat(data.change || '0');
    const changePercent = parseFloat(data.percent_change || '0');
    const high = parseFloat(data.high || '0');
    const low = parseFloat(data.low || '0');
    const open = parseFloat(data.open || '0');
    const prevClose = parseFloat(data.previous_close || '0');
    const volume = parseInt(data.volume || '0', 10);
    const timestamp = data.timestamp ? data.timestamp * 1000 : Date.now();

    return {
      symbol: clean,
      name: data.name || clean,
      price,
      change,
      changePercent,
      high,
      low,
      open,
      previousClose: prevClose,
      volume,
      timestamp,
      receivedAt: new Date().toISOString(),
      exchange: data.exchange || 'US',
      currency: data.currency || 'USD',
      provider: 'twelvedata',
      isRealTime: Boolean(data.is_market_open),
      isDelayed: false,
      isMarketOpen: Boolean(data.is_market_open),
    };
  }

  async getCandles(symbol: string, resolution: string, from: number, to: number): Promise<CandleData[]> {
    const key = this.getAuthKey();
    const clean = symbol.trim().toUpperCase();

    // Map resolutions: 1m, 5m, 15m, 1h, 1D, 1W
    let interval = '1day';
    if (resolution === '1m') interval = '1min';
    else if (resolution === '5m') interval = '5min';
    else if (resolution === '15m') interval = '15min';
    else if (resolution === '1h') interval = '1h';
    else if (resolution === '1W') interval = '1week';

    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(clean)}&interval=${interval}&apikey=${key}&outputsize=120`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Twelve Data time series error: ${res.status}`);
    const data = await res.json();

    if (data.status === 'error' || !data.values || !Array.isArray(data.values)) {
      return [];
    }

    // Twelve Data returns descending array of datetime, open, high, low, close, volume
    const candles: CandleData[] = data.values
      .map((item: any) => ({
        time: Math.floor(new Date(item.datetime).getTime() / 1000),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseInt(item.volume || '0', 10),
      }))
      .filter((c: CandleData) => !isNaN(c.time) && !isNaN(c.close))
      .reverse(); // order ascending for charting

    return candles;
  }

  async getMarketStatus(exchange = 'NYSE'): Promise<MarketStatus> {
    return {
      exchange,
      isOpen: true,
      session: 'regular',
      timezone: 'America/New_York',
      serverTime: new Date().toISOString(),
    };
  }

  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    const key = this.getAuthKey();
    const url = `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${key}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.data || !Array.isArray(data.data)) return [];

    return data.data.slice(0, 15).map((item: any) => ({
      symbol: item.symbol,
      description: item.instrument_name,
      type: item.instrument_type,
      exchange: item.exchange,
      currency: item.currency,
    }));
  }
}
