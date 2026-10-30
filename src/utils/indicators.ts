import { CandleData } from '../types/market';

export interface TechnicalIndicators {
  sma20: number | null;
  sma50: number | null;
  rsi14: number | null;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  } | null;
  historicalVolatility: number | null;
}

export function calculateIndicators(candles: CandleData[]): TechnicalIndicators {
  if (!candles || candles.length === 0) {
    return { sma20: null, sma50: null, rsi14: null, bollingerBands: null, historicalVolatility: null };
  }

  const closes = candles.map((c) => c.close).filter((c) => typeof c === 'number' && !isNaN(c));
  const n = closes.length;

  // 1. SMA 20
  let sma20: number | null = null;
  if (n >= 20) {
    const sum20 = closes.slice(n - 20).reduce((a, b) => a + b, 0);
    sma20 = Math.round((sum20 / 20) * 100) / 100;
  }

  // 2. SMA 50
  let sma50: number | null = null;
  if (n >= 50) {
    const sum50 = closes.slice(n - 50).reduce((a, b) => a + b, 0);
    sma50 = Math.round((sum50 / 50) * 100) / 100;
  }

  // 3. RSI 14 (Standard Wilder's RSI)
  let rsi14: number | null = null;
  if (n >= 15) {
    let gains = 0;
    let losses = 0;
    for (let i = n - 14; i < n; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    if (avgLoss === 0) {
      rsi14 = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi14 = Math.round((100 - 100 / (1 + rs)) * 10) / 10;
    }
  }

  // 4. Bollinger Bands (20-period, 2 std dev)
  let bollingerBands: { upper: number; middle: number; lower: number } | null = null;
  if (sma20 !== null && n >= 20) {
    const slice20 = closes.slice(n - 20);
    const variance = slice20.reduce((acc, val) => acc + Math.pow(val - sma20!, 2), 0) / 20;
    const stdDev = Math.sqrt(variance);
    bollingerBands = {
      upper: Math.round((sma20 + 2 * stdDev) * 100) / 100,
      middle: sma20,
      lower: Math.round((sma20 - 2 * stdDev) * 100) / 100,
    };
  }

  // 5. Historical Volatility (Annualized 30-day standard deviation of log returns)
  let historicalVolatility: number | null = null;
  if (n >= 10) {
    const logReturns: number[] = [];
    for (let i = 1; i < n; i++) {
      if (closes[i - 1] > 0 && closes[i] > 0) {
        logReturns.push(Math.log(closes[i] / closes[i - 1]));
      }
    }
    if (logReturns.length > 0) {
      const meanReturn = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
      const returnVariance = logReturns.reduce((acc, r) => acc + Math.pow(r - meanReturn, 2), 0) / logReturns.length;
      const dailyVol = Math.sqrt(returnVariance);
      // Annualize using 252 trading days for equities or 365 for crypto
      historicalVolatility = Math.round(dailyVol * Math.sqrt(252) * 10000) / 100; // in %
    }
  }

  return {
    sma20,
    sma50,
    rsi14,
    bollingerBands,
    historicalVolatility,
  };
}
