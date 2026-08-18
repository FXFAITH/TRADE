export type TradeDirection = 'LONG' | 'SHORT';
export type TradeStatus = 'WIN' | 'LOSS' | 'BREAKEVEN' | 'OPEN';

export type TradingSession = 
  | 'Asian Session'
  | 'London Session'
  | 'New York Session'
  | 'London - NY Overlap'
  | 'Sydney Session'
  | 'Off-Hours';

export type StrategyType = 
  | 'TJL1'
  | 'TJL2'
  | 'SBR'
  | 'RBS'
  | 'QML'
  | 'LVL 3'
  | 'LVL 4'
  | 'FIB'
  | 'D.C QML'
  | 'D.C.QML A+'
  | 'DEMAND'
  | 'SUPPLY'
  | 'T.C QML'
  | 'T.C. QML A+'
  | 'DB'
  | 'DT';

export type EmotionalState = 
  | 'Disciplined'
  | 'Calm & Focused'
  | 'Anxious'
  | 'Hesitant'
  | 'FOMO / Greedy'
  | 'Revenge / Angry'
  | 'Overconfident'
  | 'Impulsive';

export interface Trade {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  session?: TradingSession; // Trading session e.g. Asian, London, New York
  symbol: string; // e.g. EUR/USD, BTC/USDT, NQ, AAPL
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  slPrice: number; // Stop Loss level
  tpPrice: number; // Take Profit level
  riskPips: number; // Risk per trade in pips / points
  positionSize?: number; // Lots or contracts or shares
  strategyType: StrategyType;
  levelTimeframe?: string; // Key higher timeframe level e.g. 1D, 4H, 1H
  confirmationTimeframe?: string; // Execution/confirmation timeframe e.g. 15M, 5M, 1M
  levelSize?: number; // Levels size (number / pips / points)
  emotionalState: EmotionalState;
  status: TradeStatus;
  
  // Automated Calculated fields
  calculatedRiskReward: number; // Planned R:R ratio (e.g. 2.5 for 1:2.5)
  actualRiskReward?: number; // Achieved R:R ratio
  pnlPips?: number;
  pnlAmount?: number;
  pnlPercentage?: number;

  notes?: string;
  chartImages: string[]; // Base64 or object URLs
  tags?: string[];
  rating?: number; // 1 to 5 star rating of execution
  isRiskFree?: boolean; // Flag for Risk-Free / Partial Exit Breakeven trades
  partialExitNote?: string; // Details on partial profits booked
  isBacktest?: boolean; // Flag to differentiate backtested trades vs live trades
  tradingViewUrl?: string; // Optional link to TradingView chart idea/snapshot/backtest link
}

export interface FilterOptions {
  searchQuery: string;
  symbol: string;
  strategy: string;
  session?: string;
  emotion: string;
  status: string;
  direction: string;
  levelTimeframe?: string;
  confirmationTimeframe?: string;
  startDate: string;
  endDate: string;
}

export interface AccountConfig {
  initialBalance: number;
  riskPerTradePercent: number;
  currency: string;
}

export interface StrategyStat {
  strategy: string;
  tradesCount: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnL: number;
  avgRR: number;
}

export interface EmotionStat {
  emotion: string;
  tradesCount: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnL: number;
  avgRR: number;
}

export interface AIMistakeItem {
  title: string;
  category: 'Risk' | 'Psychology' | 'Technical' | 'Execution';
  description: string;
  impact: string;
}

export interface AIInsightResult {
  periodAnalyzed?: string; // 'Past 7 Days (Weekly)' | 'Past 14 Days (Bi-Weekly)' | 'Past 30 Days (Monthly)' | 'Past 90 Days (Quarterly)' | 'All Time'
  overallGrade?: string; // e.g. "B-"
  performanceScore?: number; // 0 - 100
  executiveSummary?: string;
  tradeCountInPeriod?: number;
  periodWinRate?: number;
  periodNetPnL?: number;
  
  psychologyInsight: string;
  riskManagementGrade: string;
  keyStrengths: string[];
  areasForImprovement: string[];
  actionableRules: string[];

  majorMistakes?: AIMistakeItem[];
  whatWentRight?: string[];
  improvementPlan?: string[];
  ruleOfThumbForNextPeriod?: string;
}

export interface NotionConfig {
  apiKey?: string;
  databaseId?: string;
  databaseTitle?: string;
  connected: boolean;
  lastSynced?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'notion' | 'demo';
}
