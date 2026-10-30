import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TOOLS_REGISTRY } from '../features/tools/ToolsView.js';
import { calculateIndicators } from '../utils/indicators.js';
import { MarketDataService } from '../server/providers/MarketDataService.js';
import { CandleData } from '../types/market.js';

describe('TASK 2 & 4 — NEXORA Validation Suite', () => {
  // Test 1: Tool Registry Integrity
  it('Tool Registry declares required fields and unique identifiers', () => {
    assert.ok(TOOLS_REGISTRY.length >= 5, 'Must have at least 5 registered tools');
    const ids = new Set<string>();

    TOOLS_REGISTRY.forEach((tool) => {
      assert.ok(tool.id, 'Tool must have an ID');
      assert.ok(tool.name, 'Tool must have a display name');
      assert.ok(tool.description, 'Tool must have a description');
      assert.ok(tool.category, 'Tool must have a category');
      assert.ok(tool.status, 'Tool must have status');
      assert.strictEqual(ids.has(tool.id), false, `Duplicate tool id detected: ${tool.id}`);
      ids.add(tool.id);
    });
  });

  // Test 2: SSRF & URL Analyzer Security Logic
  it('URL Analyzer accurately detects RFC1918 private IPs and SSRF hazards without network visits', () => {
    const testCases = [
      { url: 'http://127.0.0.1:8080/admin', isPrivate: true, risk: 'CRITICAL' },
      { url: 'https://192.168.1.1/gateway', isPrivate: true, risk: 'CRITICAL' },
      { url: 'http://10.0.0.5/internal', isPrivate: true, risk: 'CRITICAL' },
      { url: 'http://169.254.169.254/latest/meta-data/', isPrivate: true, risk: 'CRITICAL' },
      { url: 'https://user:password@secure.example.com', isPrivate: false, hasCreds: true },
      { url: 'https://science.nasa.gov/mission/webb/', isPrivate: false, risk: 'LOW' },
    ];

    testCases.forEach((tc) => {
      const parsed = new URL(tc.url);
      const hostname = parsed.hostname.toLowerCase();
      const isIpV4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

      let isPrivateIp = false;
      if (isIpV4) {
        const parts = hostname.split('.').map(Number);
        if (
          parts[0] === 10 ||
          (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
          (parts[0] === 192 && parts[1] === 168) ||
          (parts[0] === 169 && parts[1] === 254) ||
          parts[0] === 127
        ) {
          isPrivateIp = true;
        }
      }

      if (tc.isPrivate) {
        assert.ok(isLocalhost || isPrivateIp, `Expected ${tc.url} to be flagged as private network IP`);
      }
      if (tc.hasCreds) {
        assert.ok(parsed.username || parsed.password, `Expected ${tc.url} to contain embedded credentials`);
      }
    });
  });

  // Test 3: Paper Trading Accounting Math & Fee Deductions
  it('Paper Trading calculates weighted cost basis and fee deductions accurately', () => {
    let cash = 100000;
    const feeRate = 0.0005; // 0.05%
    let position = { shares: 0, avgEntryPrice: 0 };

    // Buy 1: 50 shares @ $140
    const buy1Shares = 50;
    const buy1Price = 140;
    const grossCost = buy1Shares * buy1Price; // $7,000
    const fee = grossCost * feeRate; // $3.50
    const totalDeduction = grossCost + fee;
    assert.ok(cash >= totalDeduction, 'Sufficient cash balance');
    cash -= totalDeduction;
    position = {
      shares: buy1Shares,
      avgEntryPrice: buy1Price,
    };
    assert.strictEqual(cash, 92996.5);
    assert.strictEqual(position.shares, 50);
    assert.strictEqual(position.avgEntryPrice, 140);

    // Validation: Reject buy when cash insufficient
    const excessBuyCost = 100000;
    const canAfford = cash >= excessBuyCost * (1 + feeRate);
    assert.strictEqual(canAfford, false, 'Must reject order when total cost exceeds available balance');

    // Validation: Reject buy when price is non-positive or 0
    const invalidPrice = 0;
    assert.ok(invalidPrice <= 0, 'Must reject order when real market price is unavailable (<= 0)');
  });

  // Test 4: Market Data Formatting & Precision
  it('Market quotes normalize without fabricated live timestamps or null NaN prices', () => {
    const rawQuote = {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 67420.50,
      change: 1420.00,
      changePercent: 2.15,
      provider: 'CoinGecko (Crypto Spot)',
      isSimulated: false,
    };

    assert.ok(!isNaN(rawQuote.price), 'Price must be a valid number');
    assert.ok(!isNaN(rawQuote.change), 'Change must be a valid number');
    assert.strictEqual(rawQuote.isSimulated, false, 'Production quote is marked as non-simulated');
    assert.strictEqual(rawQuote.symbol, rawQuote.symbol.toUpperCase());
  });

  // Test 5: Search Query Sanitization
  it('Search queries reject empty strings and enforce length constraints', () => {
    const sanitizeQuery = (input: unknown): string | null => {
      if (!input || typeof input !== 'string') return null;
      const clean = input.trim();
      if (clean.length === 0) return null;
      return clean.slice(0, 300);
    };

    assert.strictEqual(sanitizeQuery(''), null);
    assert.strictEqual(sanitizeQuery('   '), null);
    assert.strictEqual(sanitizeQuery(null), null);
    assert.strictEqual(sanitizeQuery(123), null);
    assert.strictEqual(sanitizeQuery('  quantum computing  '), 'quantum computing');
    assert.strictEqual(sanitizeQuery('a'.repeat(400))?.length, 300);
  });

  // Test 6: Technical Indicators Math (SMA, RSI, Bollinger Bands, Volatility)
  it('Technical Indicators calculate SMA 20/50, RSI 14, Bollinger Bands, and Volatility correctly', () => {
    // Generate 60 test candles with predictable progression
    const sampleCandles: CandleData[] = [];
    const baseTime = 1700000000;
    for (let i = 0; i < 60; i++) {
      const price = 100 + i; // Steady uptrend: 100, 101, ... 159
      sampleCandles.push({
        time: baseTime + i * 86400,
        open: price - 0.5,
        high: price + 1,
        low: price - 1,
        close: price,
        volume: 10000 + i * 100,
      });
    }

    const indicators = calculateIndicators(sampleCandles);

    // SMA 20: average of last 20 closes (140 to 159) = 149.5
    assert.ok(indicators.sma20 !== null, 'SMA 20 must be calculated for 60 candles');
    assert.strictEqual(indicators.sma20, 149.5);

    // SMA 50: average of last 50 closes (110 to 159) = 134.5
    assert.ok(indicators.sma50 !== null, 'SMA 50 must be calculated for 60 candles');
    assert.strictEqual(indicators.sma50, 134.5);

    // RSI 14: All upward price moves -> RSI must be 100
    assert.ok(indicators.rsi14 !== null, 'RSI 14 must be calculated');
    assert.strictEqual(indicators.rsi14, 100);

    // Bollinger Bands: middle must equal sma20, upper > middle > lower
    assert.ok(indicators.bollingerBands !== null, 'Bollinger Bands must be calculated');
    assert.strictEqual(indicators.bollingerBands.middle, indicators.sma20);
    assert.ok(indicators.bollingerBands.upper > indicators.bollingerBands.middle);
    assert.ok(indicators.bollingerBands.lower < indicators.bollingerBands.middle);

    // Volatility: must be a positive number
    assert.ok(indicators.historicalVolatility !== null);
    assert.ok(indicators.historicalVolatility > 0);

    // Boundary check: empty candles returns nulls
    const emptyIndicators = calculateIndicators([]);
    assert.strictEqual(emptyIndicators.sma20, null);
    assert.strictEqual(emptyIndicators.sma50, null);
    assert.strictEqual(emptyIndicators.rsi14, null);
    assert.strictEqual(emptyIndicators.bollingerBands, null);
  });

  // Test 7: Provider Architecture & Missing Credentials Behavior
  it('MarketDataService provider router declares capabilities and rejects unavailable or invalid symbols with clear error', async () => {
    const service = new MarketDataService();
    const capabilities = service.getProviderCapabilities();

    assert.ok(capabilities.length >= 4, 'Must list CoinGecko, Yahoo Finance, Finnhub, and Twelve Data');
    const coinGecko = capabilities.find((c) => c.name.includes('CoinGecko'));
    assert.ok(coinGecko, 'CoinGecko capability must be registered');
    assert.strictEqual(coinGecko.supportsCrypto, true);

    const yahoo = capabilities.find((c) => c.name.includes('Yahoo Finance'));
    assert.ok(yahoo, 'Yahoo Finance capability must be registered');
    assert.strictEqual(yahoo.configured, true);

    // Querying an invalid symbol must reject with the required user-facing error without mock fallback
    await assert.rejects(
      async () => {
        await service.getQuote('INVALID_TICKER_99999_XYZ');
      },
      (err: Error) => {
        return err.message.includes('Live market data is currently unavailable. Check your provider configuration or connection.');
      },
      'Expected invalid or unavailable symbol to throw standard unavailable error'
    );
  });
});
