import { CandleData, MarketQuote, MarketStatus, ProviderCapability, SymbolSearchResult } from '../../types/market';
import { FinnhubProvider } from './FinnhubProvider';
import { CoinGeckoProvider } from './CoinGeckoProvider';
import { TwelveDataProvider } from './TwelveDataProvider';
import { YahooFinanceProvider } from './YahooFinanceProvider';

export class MarketDataService {
  private finnhub: FinnhubProvider;
  private coinGecko: CoinGeckoProvider;
  private twelveData: TwelveDataProvider;
  private yahooFinance: YahooFinanceProvider;

  constructor() {
    this.finnhub = new FinnhubProvider();
    this.coinGecko = new CoinGeckoProvider();
    this.twelveData = new TwelveDataProvider();
    this.yahooFinance = new YahooFinanceProvider();
  }

  getProviderCapabilities(): ProviderCapability[] {
    return [
      {
        name: 'CoinGecko (Crypto Spot - 100% Free, No Key Required)',
        configured: this.coinGecko.isConfigured(),
        supportsRealTimeWs: false,
        supportsCandles: true,
        supportsCrypto: true,
        supportsEquities: false,
        rateLimitInfo: 'Free Public: 10-30 calls/min (Active)',
      },
      {
        name: 'Yahoo Finance (US Equities - 100% Free, No Key Required)',
        configured: this.yahooFinance.isConfigured(),
        supportsRealTimeWs: false,
        supportsCandles: true,
        supportsCrypto: true,
        supportsEquities: true,
        rateLimitInfo: 'Free Public: Real-time & daily quotes (Active)',
      },
      {
        name: 'Finnhub (US Equities & Real-time Trades)',
        configured: this.finnhub.isConfigured(),
        supportsRealTimeWs: true,
        supportsCandles: true,
        supportsCrypto: true,
        supportsEquities: true,
        rateLimitInfo: 'Free Forever Tier: 60 calls/min + WebSocket',
      },
      {
        name: 'Twelve Data (Multi-Asset Time-Series)',
        configured: this.twelveData.isConfigured(),
        supportsRealTimeWs: true,
        supportsCandles: true,
        supportsCrypto: true,
        supportsEquities: true,
        rateLimitInfo: 'Free Tier: 8 calls/min, 800 calls/day',
      },
    ];
  }

  private isCryptoSymbol(symbol: string): boolean {
    const s = symbol.trim().toUpperCase();
    return (
      s.includes('BTC') ||
      s.includes('ETH') ||
      s.includes('SOL') ||
      s.includes('XRP') ||
      s.includes('DOGE') ||
      s.includes('ADA') ||
      s.includes('AVAX') ||
      s.includes('LINK') ||
      s.includes('DOT') ||
      s.includes('BNB')
    );
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    const clean = symbol.trim().toUpperCase();

    // Route crypto symbols to CoinGecko (100% Free, no key needed)
    if (this.isCryptoSymbol(clean)) {
      try {
        return await this.coinGecko.getQuote(clean);
      } catch (err: any) {
        if (this.finnhub.isConfigured()) {
          return await this.finnhub.getQuote(clean);
        }
        try {
          return await this.yahooFinance.getQuote(`${clean}-USD`);
        } catch {
          throw new Error('Live market data is currently unavailable. Check your provider configuration or connection.');
        }
      }
    }

    // Equities & Indices (Finnhub -> Twelve Data -> Yahoo Finance Free Public)
    if (this.finnhub.isConfigured()) {
      try {
        return await this.finnhub.getQuote(clean);
      } catch {
        // Fall back to Yahoo Finance if Finnhub encounters issues
      }
    }

    if (this.twelveData.isConfigured()) {
      try {
        return await this.twelveData.getQuote(clean);
      } catch {
        // Fall back to Yahoo Finance
      }
    }

    // 100% Free Public Yahoo Finance integration (No API key needed)
    try {
      return await this.yahooFinance.getQuote(clean);
    } catch {
      throw new Error(
        'Live market data is currently unavailable. Check your provider configuration or connection.'
      );
    }
  }

  async getCandles(symbol: string, resolution: string, from: number, to: number): Promise<CandleData[]> {
    const clean = symbol.trim().toUpperCase();

    if (this.isCryptoSymbol(clean)) {
      try {
        return await this.coinGecko.getCandles(clean, resolution, from, to);
      } catch {
        // Fall back to Yahoo Finance crypto pair
        try {
          return await this.yahooFinance.getCandles(`${clean}-USD`, resolution, from, to);
        } catch {
          throw new Error('Live market data is currently unavailable. Check your provider configuration or connection.');
        }
      }
    }

    if (this.finnhub.isConfigured()) {
      try {
        return await this.finnhub.getCandles(clean, resolution, from, to);
      } catch {
        // Fall back to Yahoo Finance
      }
    }

    if (this.twelveData.isConfigured()) {
      try {
        return await this.twelveData.getCandles(clean, resolution, from, to);
      } catch {
        // Fall back to Yahoo Finance
      }
    }

    // 100% Free Public Yahoo Finance fallback
    try {
      return await this.yahooFinance.getCandles(clean, resolution, from, to);
    } catch {
      throw new Error(
        'Live market data is currently unavailable. Check your provider configuration or connection.'
      );
    }
  }

  async getMarketStatus(exchange?: string): Promise<MarketStatus> {
    if (exchange?.toUpperCase().includes('CRYPTO')) {
      return await this.coinGecko.getMarketStatus();
    }
    if (this.finnhub.isConfigured()) {
      return await this.finnhub.getMarketStatus(exchange);
    }
    return await this.yahooFinance.getMarketStatus(exchange);
  }

  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    const results: SymbolSearchResult[] = [];

    // Search crypto
    try {
      const cryptoHits = await this.coinGecko.searchSymbols(query);
      results.push(...cryptoHits);
    } catch {
      // Ignore
    }

    // Search equities via Yahoo Finance (Free, no key)
    try {
      const equityHits = await this.yahooFinance.searchSymbols(query);
      results.push(...equityHits);
    } catch {
      // Ignore
    }

    return results;
  }
}

