import { CandleData, IMarketDataProvider, MarketQuote, MarketStatus, SymbolSearchResult } from '../../types/market';

export class FinnhubProvider implements IMarketDataProvider {
  name = 'finnhub' as const;
  private apiKey: string | null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FINNHUB_API_KEY || process.env.MARKET_DATA_API_KEY || null;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey !== 'MY_FINNHUB_API_KEY' && this.apiKey.trim().length > 0);
  }

  private getAuthKey(): string {
    if (!this.apiKey) {
      throw new Error('FINNHUB_API_KEY is not configured on the server.');
    }
    return this.apiKey;
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    const key = this.getAuthKey();
    const cleanSymbol = symbol.trim().toUpperCase().replace('/', '');
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(cleanSymbol)}&token=${key}`;

    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) {
      if (res.status === 429) {
        throw new Error('Finnhub API rate limit reached (60 calls/minute on free tier).');
      }
      if (res.status === 401 || res.status === 403) {
        throw new Error('Invalid or unauthorized Finnhub API key.');
      }
      throw new Error(`Finnhub quote request failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.c === 0 && data.h === 0 && data.l === 0 && data.t === 0) {
      throw new Error(`Symbol '${symbol}' not found on Finnhub or unsupported.`);
    }

    const now = Date.now();
    const eventTime = data.t ? data.t * 1000 : now;

    return {
      symbol: cleanSymbol,
      name: cleanSymbol,
      price: data.c,
      change: data.d ?? 0,
      changePercent: data.dp ?? 0,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
      volume: 0, // Quote endpoint does not provide intraday cumulative volume; populated via candles
      timestamp: eventTime,
      receivedAt: new Date(now).toISOString(),
      exchange: 'US',
      currency: 'USD',
      provider: 'finnhub',
      isRealTime: true,
      isDelayed: false,
    };
  }

  async getCandles(symbol: string, resolution: string, from: number, to: number): Promise<CandleData[]> {
    const key = this.getAuthKey();
    const cleanSymbol = symbol.trim().toUpperCase().replace('/', '');

    // Finnhub supported resolutions: 1, 5, 15, 30, 60, D, W, M
    let finnhubRes = resolution;
    if (resolution === '1m') finnhubRes = '1';
    else if (resolution === '5m') finnhubRes = '5';
    else if (resolution === '15m') finnhubRes = '15';
    else if (resolution === '1h') finnhubRes = '60';
    else if (resolution === '1D') finnhubRes = 'D';
    else if (resolution === '1W') finnhubRes = 'W';

    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(cleanSymbol)}&resolution=${finnhubRes}&from=${from}&to=${to}&token=${key}`;

    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) {
      throw new Error(`Finnhub candle request failed with status ${res.status}`);
    }

    const data = await res.json();
    if (data.s === 'no_data' || !data.t || !Array.isArray(data.t) || data.t.length === 0) {
      return [];
    }

    const candles: CandleData[] = [];
    for (let i = 0; i < data.t.length; i++) {
      candles.push({
        time: data.t[i], // unix seconds
        open: data.o[i],
        high: data.h[i],
        low: data.l[i],
        close: data.c[i],
        volume: data.v ? data.v[i] : 0,
      });
    }

    return candles;
  }

  async getMarketStatus(exchange = 'US'): Promise<MarketStatus> {
    const key = this.getAuthKey();
    const url = `https://finnhub.io/api/v1/stock/market-status?exchange=${encodeURIComponent(exchange)}&token=${key}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Market status error: ${res.status}`);
      const data = await res.json();

      return {
        exchange: data.exchange || exchange,
        isOpen: Boolean(data.isOpen),
        session: data.session || (data.isOpen ? 'regular' : 'closed'),
        timezone: data.timezone || 'America/New_York',
        serverTime: new Date(data.t ? data.t * 1000 : Date.now()).toISOString(),
      };
    } catch {
      // Deterministic US market hours computation (Mon-Fri 09:30-16:00 ET)
      const now = new Date();
      const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const day = nyTime.getDay();
      const hour = nyTime.getHours();
      const min = nyTime.getMinutes();
      const timeMin = hour * 60 + min;

      const isWeekday = day >= 1 && day <= 5;
      const isRegular = isWeekday && timeMin >= 570 && timeMin < 960;
      const isPre = isWeekday && timeMin >= 240 && timeMin < 570;
      const isAfter = isWeekday && timeMin >= 960 && timeMin < 1200;

      return {
        exchange: 'US (NYSE/NASDAQ)',
        isOpen: isRegular,
        session: isRegular ? 'regular' : isPre ? 'pre-market' : isAfter ? 'after-hours' : 'closed',
        timezone: 'America/New_York',
        serverTime: now.toISOString(),
      };
    }
  }

  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    const key = this.getAuthKey();
    const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${key}`;

    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.result || !Array.isArray(data.result)) return [];

    return data.result.slice(0, 15).map((item: any) => ({
      symbol: item.symbol,
      description: item.description,
      type: item.type,
    }));
  }
}
