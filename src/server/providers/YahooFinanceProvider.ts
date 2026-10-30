import { CandleData, IMarketDataProvider, MarketQuote, MarketStatus, SymbolSearchResult } from '../../types/market';

export class YahooFinanceProvider implements IMarketDataProvider {
  readonly name = 'Yahoo Finance (Public Free)';

  isConfigured(): boolean {
    return true; // 100% Free public endpoint, no API key required
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    const clean = symbol.trim().toUpperCase();
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(clean)}?range=2d&interval=1d`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch quote for ${clean} from Yahoo Finance: HTTP ${res.status}`);
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result || !result.meta) {
      throw new Error(`No market quote found for symbol: ${clean}`);
    }

    const meta = result.meta;
    const price = meta.regularMarketPrice ?? 0;
    const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = Math.round((price - previousClose) * 100) / 100;
    const changePercent = previousClose ? Math.round(((price - previousClose) / previousClose) * 10000) / 100 : 0;
    const high = meta.regularMarketDayHigh ?? price;
    const low = meta.regularMarketDayLow ?? price;
    const open = meta.regularMarketDayOpen ?? previousClose;
    const volume = meta.regularMarketVolume ?? 0;
    const timestamp = (meta.regularMarketTime ?? Math.floor(Date.now() / 1000)) * 1000;

    return {
      symbol: clean,
      name: meta.longName || meta.shortName || clean,
      price,
      change,
      changePercent,
      high,
      low,
      open,
      previousClose,
      volume,
      timestamp,
      receivedAt: new Date().toISOString(),
      exchange: meta.exchangeName || 'US Equities',
      currency: meta.currency || 'USD',
      provider: 'yahoo_finance',
      isRealTime: true,
      isDelayed: false,
      isMarketOpen: this.isMarketHoursNow(),
    };
  }

  async getCandles(symbol: string, resolution: string, from: number, to: number): Promise<CandleData[]> {
    const clean = symbol.trim().toUpperCase();
    
    // Map resolution to Yahoo Finance interval
    let interval = '1d';
    if (resolution === '1' || resolution === '1m') interval = '1m';
    else if (resolution === '5' || resolution === '5m') interval = '5m';
    else if (resolution === '15' || resolution === '15m') interval = '15m';
    else if (resolution === '60' || resolution === '1h') interval = '1h';
    else if (resolution === 'D' || resolution === '1d') interval = '1d';
    else if (resolution === 'W' || resolution === '1wk') interval = '1wk';

    const p1 = Math.max(0, Math.floor(from));
    const p2 = Math.max(p1 + 3600, Math.floor(to));

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(clean)}?period1=${p1}&period2=${p2}&interval=${interval}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch historical candles for ${clean} from Yahoo Finance: HTTP ${res.status}`);
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
      return [];
    }

    const timestamps: number[] = result.timestamp;
    const quotes = result.indicators.quote[0];
    const opens: (number | null)[] = quotes.open || [];
    const highs: (number | null)[] = quotes.high || [];
    const lows: (number | null)[] = quotes.low || [];
    const closes: (number | null)[] = quotes.close || [];
    const volumes: (number | null)[] = quotes.volume || [];

    const candles: CandleData[] = [];
    const seenTimes = new Set<number>();

    for (let i = 0; i < timestamps.length; i++) {
      const t = timestamps[i];
      const c = closes[i];
      const o = opens[i] ?? c;
      const h = highs[i] ?? c;
      const l = lows[i] ?? c;
      const v = volumes[i] ?? 0;

      if (typeof t === 'number' && typeof c === 'number' && !isNaN(c) && !seenTimes.has(t)) {
        seenTimes.add(t);
        candles.push({
          time: t,
          open: Math.round((o ?? c) * 100) / 100,
          high: Math.round((h ?? c) * 100) / 100,
          low: Math.round((l ?? c) * 100) / 100,
          close: Math.round(c * 100) / 100,
          volume: Math.round(v ?? 0),
        });
      }
    }

    return candles.sort((a, b) => a.time - b.time);
  }

  async getMarketStatus(exchange?: string): Promise<MarketStatus> {
    const isOpen = this.isMarketHoursNow();
    return {
      exchange: exchange || 'US Equities (NYSE / NASDAQ)',
      isOpen,
      session: isOpen ? 'regular' : 'closed',
      timezone: 'America/New_York',
      nextOpen: !isOpen ? '09:30 AM EST (Next Trading Day)' : undefined,
      nextClose: isOpen ? '04:00 PM EST' : undefined,
    };
  }

  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    const q = query.trim();
    if (!q) return [];

    try {
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!res.ok) return [];

      const data = await res.json();
      const quotes = data.quotes || [];

      return quotes.map((item: any) => ({
        symbol: item.symbol,
        name: item.shortname || item.longname || item.symbol,
        type: item.quoteType || 'EQUITY',
        exchange: item.exchange || 'US',
      }));
    } catch {
      return [];
    }
  }

  private isMarketHoursNow(): boolean {
    const now = new Date();
    // Convert to US Eastern Time
    const nyTimeStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const nyTime = new Date(nyTimeStr);
    const day = nyTime.getDay(); // 0 is Sunday, 6 is Saturday
    if (day === 0 || day === 6) return false;

    const hours = nyTime.getHours();
    const minutes = nyTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // NYSE / NASDAQ regular trading: 09:30 (570 min) to 16:00 (960 min)
    return totalMinutes >= 570 && totalMinutes < 960;
  }
}
