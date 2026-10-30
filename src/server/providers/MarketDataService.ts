import { CandleData, MarketQuote, MarketStatus, ProviderCapability, SymbolSearchResult } from '../../types/market';
import { FinnhubProvider } from './FinnhubProvider';
import { CoinGeckoProvider } from './CoinGeckoProvider';
import { TwelveDataProvider } from './TwelveDataProvider';

export class MarketDataService {
  private finnhub: FinnhubProvider;
  private coinGecko: CoinGeckoProvider;
  private twelveData: TwelveDataProvider;

  constructor() {
    this.finnhub = new FinnhubProvider();
    this.coinGecko = new CoinGeckoProvider();
    this.twelveData = new TwelveDataProvider();
  }

  getProviderCapabilities(): ProviderCapability[] {
    return [
      {
        name: 'CoinGecko (Crypto Spot)',
        configured: this.coinGecko.isConfigured(),
        supportsRealTimeWs: false,
        supportsCandles: true,
        supportsCrypto: true,
        supportsEquities: false,
        rateLimitInfo: 'Public tier: 10-30 calls/minute',
      },
      {
        name: 'Finnhub (US Equities & Global)',
        configured: this.finnhub.isConfigured(),
        supportsRealTimeWs: true,
        supportsCandles: true,
        supportsCrypto: true,
        supportsEquities: true,
        rateLimitInfo: 'Free tier: 60 calls/minute, WebSocket included',
      },
      {
        name: 'Twelve Data',
        configured: this.twelveData.isConfigured(),
        supportsRealTimeWs: true,
        supportsCandles: true,
        supportsCrypto: true,
        supportsEquities: true,
        rateLimitInfo: 'Free tier: 8 calls/minute, 800 calls/day',
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

    // Route crypto symbols to CoinGecko
    if (this.isCryptoSymbol(clean)) {
      try {
        return await this.coinGecko.getQuote(clean);
      } catch (err: any) {
        // Fall back to Finnhub if configured
        if (this.finnhub.isConfigured()) {
          return await this.finnhub.getQuote(clean);
        }
        throw err;
      }
    }

    // Equities & Indices
    if (this.finnhub.isConfigured()) {
      return await this.finnhub.getQuote(clean);
    }

    if (this.twelveData.isConfigured()) {
      return await this.twelveData.getQuote(clean);
    }

    throw new Error(
      'Live market data is currently unavailable. Check your provider configuration or connection. (Equities require FINNHUB_API_KEY or TWELVE_DATA_API_KEY in server environment)'
    );
  }

  async getCandles(symbol: string, resolution: string, from: number, to: number): Promise<CandleData[]> {
    const clean = symbol.trim().toUpperCase();

    if (this.isCryptoSymbol(clean)) {
      return await this.coinGecko.getCandles(clean, resolution, from, to);
    }

    if (this.finnhub.isConfigured()) {
      return await this.finnhub.getCandles(clean, resolution, from, to);
    }

    if (this.twelveData.isConfigured()) {
      return await this.twelveData.getCandles(clean, resolution, from, to);
    }

    throw new Error(
      'Live market data is currently unavailable. Check your provider configuration or connection.'
    );
  }

  async getMarketStatus(exchange?: string): Promise<MarketStatus> {
    if (exchange?.toUpperCase().includes('CRYPTO')) {
      return await this.coinGecko.getMarketStatus();
    }
    if (this.finnhub.isConfigured()) {
      return await this.finnhub.getMarketStatus(exchange);
    }
    // Return standard session calculation
    return await this.finnhub.getMarketStatus(exchange);
  }

  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    const results: SymbolSearchResult[] = [];

    // Search crypto
    const cryptoHits = await this.coinGecko.searchSymbols(query);
    results.push(...cryptoHits);

    // Search equities if configured
    if (this.finnhub.isConfigured()) {
      try {
        const equityHits = await this.finnhub.searchSymbols(query);
        results.push(...equityHits);
      } catch {
        // Ignore search errors
      }
    } else if (this.twelveData.isConfigured()) {
      try {
        const equityHits = await this.twelveData.searchSymbols(query);
        results.push(...equityHits);
      } catch {
        // Ignore
      }
    }

    return results;
  }
}
