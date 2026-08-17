import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
  PieChart,
  Pie,
} from 'recharts';
import {
  TrendingUp,
  Brain,
  Crosshair,
  BarChart3,
  Calendar,
  PieChart as PieChartIcon,
  Zap,
} from 'lucide-react';
import { Trade } from '../types';
import {
  calculateSummaryStats,
  calculateStrategyStats,
  calculateEmotionStats,
  generateEquityCurveData,
} from '../utils/calculations';

interface AnalyticsChartsProps {
  trades: Trade[];
  initialBalance: number;
  onOpenAIAdvisor?: () => void;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ trades, initialBalance, onOpenAIAdvisor }) => {
  const [chartTimeframe, setChartTimeframe] = useState<'all' | '30d' | '7d'>('all');

  // Filter trades by timeframe if selected
  const now = new Date();
  const filteredTrades = trades.filter((t) => {
    if (chartTimeframe === 'all') return true;
    const tDate = new Date(t.date);
    const diffDays = (now.getTime() - tDate.getTime()) / (1000 * 3600 * 24);
    if (chartTimeframe === '30d') return diffDays <= 30;
    if (chartTimeframe === '7d') return diffDays <= 7;
    return true;
  });

  const summary = calculateSummaryStats(filteredTrades, initialBalance);
  const equityCurveData = generateEquityCurveData(filteredTrades, initialBalance);
  const strategyStats = calculateStrategyStats(filteredTrades);
  const emotionStats = calculateEmotionStats(filteredTrades);

  // Donut chart data for Wins / Losses / Breakevens
  const outcomeData = [
    { name: 'Wins', value: summary.wins, color: '#10b981' },
    { name: 'Losses', value: summary.losses, color: '#ef4444' },
    { name: 'Breakevens', value: summary.breakevens, color: '#94a3b8' },
  ].filter((item) => item.value > 0);

  // Colors for Emotion Bars based on profitability/category
  const getEmotionColor = (netPnL: number, winRate: number) => {
    if (netPnL > 0 && winRate >= 50) return '#10b981'; // Emerald
    if (netPnL < 0 || winRate < 40) return '#ef4444'; // Red
    return '#f59e0b'; // Amber
  };

  return (
    <div className="space-y-6">
      
      {/* Timeframe Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Performance &amp; Psychological Analytics
          </h2>
          <p className="text-xs text-slate-500">
            Equity trajectory, strategy win rates, and emotional correlation matrix.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenAIAdvisor && (
            <button
              onClick={onOpenAIAdvisor}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Brain className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Audit Report</span>
            </button>
          )}

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            {(['all', '30d', '7d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setChartTimeframe(tf)}
                className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-all cursor-pointer ${
                  chartTimeframe === tf
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf === 'all' ? 'All Time' : tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CHART 1: EQUITY CURVE (MAIN OVERALL PERFORMANCE) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Equity Curve ($)
            </h3>
            <p className="text-xs text-slate-500">Portfolio growth trajectory from initial capital of ${initialBalance.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 font-medium">Current Balance: </span>
            <span className={`text-base font-bold font-mono ${summary.netPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ${(initialBalance + summary.netPnL).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityCurveData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['auto', 'auto']} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#0f172a',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Equity']}
              />
              <Area type="monotone" dataKey="equity" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorEquity)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRID OF TWO CHARTS: EMOTIONAL STATE vs STRATEGY PERFORMANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 2: PSYCHOLOGY & EMOTIONAL STATE ANALYSIS */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-600" />
              Emotional State vs Net P&L ($)
            </h3>
            <p className="text-xs text-slate-500">
              Impact of mindset (Disciplined vs FOMO/Anxious) on P&L.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionStats} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="emotion"
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: any, name: any, item: any) => [
                    `$${Number(value).toLocaleString()} (${item.payload.winRate}% Win Rate, ${item.payload.tradesCount} Trades)`,
                    'Net P&L',
                  ]}
                />
                <Bar dataKey="netPnL" radius={[4, 4, 0, 0]}>
                  {emotionStats.map((entry, index) => (
                    <Cell key={`cell-emo-${index}`} fill={getEmotionColor(entry.netPnL, entry.winRate)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>
              <strong className="text-slate-800">Psychology Warning:</strong> Trades taken in <span className="text-emerald-700 font-bold">Disciplined</span> state show higher return than <span className="text-rose-600 font-bold">FOMO / Revenge</span> entries.
            </span>
          </div>
        </div>

        {/* CHART 3: PERFORMANCE BY STRATEGY TYPE */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-blue-600" />
              Strategy Setup Win Rate (%)
            </h3>
            <p className="text-xs text-slate-500">
              Evaluates which setup models deliver the highest trading edge.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategyStats} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="strategy"
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: any, name: any, item: any) => [
                    `${value}% Win Rate (Net P&L: $${item.payload.netPnL}, ${item.payload.tradesCount} Trades)`,
                    'Win Rate',
                  ]}
                />
                <Bar dataKey="winRate" fill="#2563eb" radius={[4, 4, 0, 0]}>
                  {strategyStats.map((entry, index) => (
                    <Cell
                      key={`cell-strat-${index}`}
                      fill={entry.winRate >= 50 ? '#10b981' : entry.winRate >= 35 ? '#2563eb' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            Top performing strategy setup: <span className="text-emerald-700 font-bold">{summary.topStrategy}</span>
          </div>
        </div>

      </div>

      {/* BOTTOM GRID: OUTCOME RATIO & STATISTICAL BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Trade Outcome Donut */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-1">
              <PieChartIcon className="w-4 h-4 text-amber-500" />
              Win / Loss Distribution
            </h3>
            <p className="text-xs text-slate-500">Total trade outcomes proportion</p>
          </div>

          <div className="h-48 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend tick={{ fontSize: 11, fill: '#64748b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="text-center text-xs text-slate-600 border-t border-slate-100 pt-3">
            Win Rate: <span className="text-emerald-600 font-bold">{summary.winRate}%</span> across {summary.closedTrades} closed trades.
          </div>
        </div>

        {/* Strategy Breakdown Table */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">Strategy Performance Table</h3>
          <p className="text-xs text-slate-500 mb-3">Detailed breakdown per trading model</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-2.5 rounded-l-lg">Strategy</th>
                  <th className="p-2.5">Trades</th>
                  <th className="p-2.5">W / L</th>
                  <th className="p-2.5">Win Rate</th>
                  <th className="p-2.5">Avg R:R</th>
                  <th className="p-2.5 rounded-r-lg text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {strategyStats.map((st) => (
                  <tr key={st.strategy} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-800">{st.strategy}</td>
                    <td className="p-2.5 text-slate-500">{st.tradesCount}</td>
                    <td className="p-2.5">
                      <span className="text-emerald-600 font-semibold">{st.wins}</span> / <span className="text-rose-600 font-semibold">{st.losses}</span>
                    </td>
                    <td className="p-2.5 font-semibold">
                      <span className={st.winRate >= 50 ? 'text-emerald-600' : 'text-slate-700'}>
                        {st.winRate}%
                      </span>
                    </td>
                    <td className="p-2.5 font-mono">1:{st.avgRR}</td>
                    <td className={`p-2.5 font-bold font-mono text-right ${st.netPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {st.netPnL >= 0 ? '+' : ''}${st.netPnL}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
