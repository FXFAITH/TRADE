import { Trade, StrategyStat, EmotionStat } from '../types';

/**
 * Calculates planned Risk to Reward ratio given Entry, Stop Loss, and Take Profit.
 * Returns ratio as a number e.g. 2.5 (meaning 1 : 2.5)
 */
export function calculateRiskReward(
  direction: 'LONG' | 'SHORT',
  entryPrice: number,
  slPrice: number,
  tpPrice: number
): number {
  if (!entryPrice || !slPrice || !tpPrice) return 0;

  const risk = direction === 'LONG' ? entryPrice - slPrice : slPrice - entryPrice;
  const reward = direction === 'LONG' ? tpPrice - entryPrice : entryPrice - tpPrice;

  if (risk <= 0 || reward <= 0) return 0;

  const rr = reward / risk;
  return Number(rr.toFixed(2));
}

/**
 * Auto computes calculated metrics for a trade based on entry, exit, SL, TP, riskPips, positionSize
 */
export function computeTradeMetrics(trade: Partial<Trade>): Partial<Trade> {
  const { direction = 'LONG', entryPrice = 0, exitPrice, slPrice = 0, tpPrice = 0, riskPips = 0, positionSize = 1 } = trade;

  const plannedRR = calculateRiskReward(direction, entryPrice, slPrice, tpPrice);

  let status = trade.status || 'OPEN';
  let actualRiskReward = trade.actualRiskReward;
  let pnlPips = trade.pnlPips;
  let pnlAmount = trade.pnlAmount;
  let pnlPercentage = trade.pnlPercentage;

  if (exitPrice !== undefined && exitPrice !== null && exitPrice > 0 && entryPrice > 0) {
    const plannedRiskPrice = Math.abs(entryPrice - slPrice);

    // Calculate delta in price
    const delta = direction === 'LONG' ? exitPrice - entryPrice : entryPrice - exitPrice;

    // Calculate actual R:R
    if (plannedRiskPrice > 0) {
      actualRiskReward = Number((delta / plannedRiskPrice).toFixed(2));
    } else {
      actualRiskReward = 0;
    }

    // Determine status automatically if not manually forced
    if (trade.isRiskFree) {
      // Risk free partial booked trade or SL at entry
      status = 'BREAKEVEN';
      // If no custom PnL override was given, set net outcome to 0 R / $0
      if (trade.actualRiskReward === undefined) actualRiskReward = 0;
      if (trade.pnlAmount === undefined) pnlAmount = 0;
      if (trade.pnlPips === undefined) pnlPips = 0;
      if (trade.pnlPercentage === undefined) pnlPercentage = 0;
    } else if (Math.abs(delta) < 0.00001) {
      status = 'BREAKEVEN';
    } else if (delta > 0) {
      status = 'WIN';
    } else {
      status = 'LOSS';
    }

    // Calculate pips if riskPips & price risk are known
    if (!trade.isRiskFree || pnlPips === undefined) {
      if (plannedRiskPrice > 0 && riskPips > 0) {
        const pipMultiplier = riskPips / plannedRiskPrice;
        pnlPips = Number((delta * pipMultiplier).toFixed(1));
      } else {
        pnlPips = Number((delta * 10000).toFixed(1)); // Default estimation for FX
      }
    }

    // Calculate PnL amount ($)
    // If trade specifies pnlAmount, keep it; else calculate based on position size or risk
    if (pnlAmount === undefined) {
      if (trade.isRiskFree) {
        pnlAmount = 0;
      } else if (positionSize && positionSize > 0) {
        pnlAmount = Number((delta * positionSize * 100).toFixed(2));
      } else {
        // Fallback: Default $100 risk per 1.0 R
        pnlAmount = Number((actualRiskReward * 100).toFixed(2));
      }
    }

    if (pnlPercentage === undefined && pnlAmount !== undefined) {
      pnlPercentage = Number(((pnlAmount / 10000) * 100).toFixed(2)); // Default % return on $10k account
    }
  } else if (trade.isRiskFree) {
    status = 'BREAKEVEN';
    actualRiskReward = trade.actualRiskReward ?? 0;
    pnlPips = trade.pnlPips ?? 0;
    pnlAmount = trade.pnlAmount ?? 0;
    pnlPercentage = trade.pnlPercentage ?? 0;
  }

  return {
    ...trade,
    status,
    calculatedRiskReward: plannedRR,
    actualRiskReward: actualRiskReward ?? plannedRR,
    pnlPips: pnlPips ?? 0,
    pnlAmount: pnlAmount ?? 0,
    pnlPercentage: pnlPercentage ?? 0,
  };
}

export interface SummaryStats {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number; // percentage e.g. 65.5
  netPnL: number; // $ total
  totalProfit: number;
  totalLoss: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  avgRR: number; // average planned R:R
  avgActualRR: number; // average realized R:R
  expectancy: number; // $ per trade
  maxDrawdown: number; // max drawdown $
  topStrategy: string;
  topEmotion: string;
}

/**
 * Calculates aggregated stats from a list of trades
 */
export function calculateSummaryStats(trades: Trade[], initialBalance: number = 10000): SummaryStats {
  const closed = trades.filter((t) => t.status !== 'OPEN');
  const totalTrades = trades.length;
  const openTrades = totalTrades - closed.length;
  const closedTrades = closed.length;

  let wins = 0;
  let losses = 0;
  let breakevens = 0;
  let totalProfit = 0;
  let totalLoss = 0;
  let totalPlannedRR = 0;
  let totalRealizedRR = 0;

  closed.forEach((t) => {
    const pnl = t.pnlAmount || 0;
    if (t.status === 'WIN' || pnl > 0) {
      wins++;
      totalProfit += pnl;
    } else if (t.status === 'LOSS' || pnl < 0) {
      losses++;
      totalLoss += Math.abs(pnl);
    } else {
      breakevens++;
    }

    totalPlannedRR += t.calculatedRiskReward || 0;
    totalRealizedRR += t.actualRiskReward || 0;
  });

  const winRate = closedTrades > 0 ? Number(((wins / closedTrades) * 100).toFixed(1)) : 0;
  const netPnL = Number((totalProfit - totalLoss).toFixed(2));
  const profitFactor = totalLoss > 0 ? Number((totalProfit / totalLoss).toFixed(2)) : totalProfit > 0 ? 999 : 0;
  const avgWin = wins > 0 ? Number((totalProfit / wins).toFixed(2)) : 0;
  const avgLoss = losses > 0 ? Number((totalLoss / losses).toFixed(2)) : 0;
  const avgRR = closedTrades > 0 ? Number((totalPlannedRR / closedTrades).toFixed(2)) : 0;
  const avgActualRR = closedTrades > 0 ? Number((totalRealizedRR / closedTrades).toFixed(2)) : 0;

  // Expectancy = (Win Rate * Avg Win) - (Loss Rate * Avg Loss)
  const winRateDecimal = closedTrades > 0 ? wins / closedTrades : 0;
  const lossRateDecimal = closedTrades > 0 ? losses / closedTrades : 0;
  const expectancy = Number((winRateDecimal * avgWin - lossRateDecimal * avgLoss).toFixed(2));

  // Max Drawdown calculation along equity curve
  let runningEquity = initialBalance;
  let peakEquity = initialBalance;
  let maxDrawdown = 0;

  // Sort trades chronologically for drawdown calculation
  const sortedTrades = [...closed].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  sortedTrades.forEach((t) => {
    runningEquity += t.pnlAmount || 0;
    if (runningEquity > peakEquity) {
      peakEquity = runningEquity;
    }
    const drawdown = peakEquity - runningEquity;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  // Strategy breakdown to find top strategy
  const stratStats = calculateStrategyStats(trades);
  const topStrat = stratStats.length > 0 ? stratStats.sort((a, b) => b.netPnL - a.netPnL)[0].strategy : 'N/A';

  // Emotion breakdown to find most frequent emotion
  const emoStats = calculateEmotionStats(trades);
  const topEmo = emoStats.length > 0 ? emoStats.sort((a, b) => b.tradesCount - a.tradesCount)[0].emotion : 'N/A';

  return {
    totalTrades,
    openTrades,
    closedTrades,
    wins,
    losses,
    breakevens,
    winRate,
    netPnL,
    totalProfit: Number(totalProfit.toFixed(2)),
    totalLoss: Number(totalLoss.toFixed(2)),
    profitFactor,
    avgWin,
    avgLoss,
    avgRR,
    avgActualRR,
    expectancy,
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    topStrategy: topStrat,
    topEmotion: topEmo,
  };
}

/**
 * Strategy stats grouping
 */
export function calculateStrategyStats(trades: Trade[]): StrategyStat[] {
  const map: Record<string, { tradesCount: number; wins: number; losses: number; netPnL: number; totalRR: number }> = {};

  trades.forEach((t) => {
    if (!map[t.strategyType]) {
      map[t.strategyType] = { tradesCount: 0, wins: 0, losses: 0, netPnL: 0, totalRR: 0 };
    }
    const item = map[t.strategyType];
    item.tradesCount++;
    if (t.status === 'WIN') item.wins++;
    if (t.status === 'LOSS') item.losses++;
    item.netPnL += t.pnlAmount || 0;
    item.totalRR += t.actualRiskReward || t.calculatedRiskReward || 0;
  });

  return Object.keys(map).map((strat) => {
    const item = map[strat];
    const closedCount = item.wins + item.losses;
    const winRate = closedCount > 0 ? Number(((item.wins / closedCount) * 100).toFixed(1)) : 0;
    const avgRR = item.tradesCount > 0 ? Number((item.totalRR / item.tradesCount).toFixed(2)) : 0;

    return {
      strategy: strat,
      tradesCount: item.tradesCount,
      wins: item.wins,
      losses: item.losses,
      winRate,
      netPnL: Number(item.netPnL.toFixed(2)),
      avgRR,
    };
  });
}

/**
 * Emotion stats grouping
 */
export function calculateEmotionStats(trades: Trade[]): EmotionStat[] {
  const map: Record<string, { tradesCount: number; wins: number; losses: number; netPnL: number; totalRR: number }> = {};

  trades.forEach((t) => {
    if (!map[t.emotionalState]) {
      map[t.emotionalState] = { tradesCount: 0, wins: 0, losses: 0, netPnL: 0, totalRR: 0 };
    }
    const item = map[t.emotionalState];
    item.tradesCount++;
    if (t.status === 'WIN') item.wins++;
    if (t.status === 'LOSS') item.losses++;
    item.netPnL += t.pnlAmount || 0;
    item.totalRR += t.actualRiskReward || t.calculatedRiskReward || 0;
  });

  return Object.keys(map).map((emo) => {
    const item = map[emo];
    const closedCount = item.wins + item.losses;
    const winRate = closedCount > 0 ? Number(((item.wins / closedCount) * 100).toFixed(1)) : 0;
    const avgRR = item.tradesCount > 0 ? Number((item.totalRR / item.tradesCount).toFixed(2)) : 0;

    return {
      emotion: emo,
      tradesCount: item.tradesCount,
      wins: item.wins,
      losses: item.losses,
      winRate,
      netPnL: Number(item.netPnL.toFixed(2)),
      avgRR,
    };
  });
}

/**
 * Generates Equity Curve points sorted by date
 */
export function generateEquityCurveData(trades: Trade[], initialBalance: number = 10000) {
  const sorted = [...trades]
    .filter((t) => t.status !== 'OPEN')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let currentEquity = initialBalance;
  let cumulativePnL = 0;

  const points = [
    {
      date: 'Start',
      equity: initialBalance,
      pnl: 0,
      tradePnL: 0,
      symbol: '-',
    },
  ];

  sorted.forEach((trade, index) => {
    const tradePnL = trade.pnlAmount || 0;
    currentEquity += tradePnL;
    cumulativePnL += tradePnL;

    points.push({
      date: trade.date,
      equity: Number(currentEquity.toFixed(2)),
      pnl: Number(cumulativePnL.toFixed(2)),
      tradePnL: Number(tradePnL.toFixed(2)),
      symbol: `${trade.symbol} (${trade.direction})`,
    });
  });

  return points;
}
