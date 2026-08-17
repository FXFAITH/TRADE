import React from 'react';
import { TrendingUp, TrendingDown, Target, Scale, Zap, ShieldAlert, Award, Brain, Sparkles } from 'lucide-react';
import { SummaryStats } from '../utils/calculations';

interface MetricsOverviewProps {
  stats: SummaryStats;
  initialBalance: number;
  onOpenAIAdvisor?: () => void;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ stats, initialBalance, onOpenAIAdvisor }) => {
  const safeNetPnL = stats?.netPnL || 0;
  const safeInitBalance = initialBalance || 10000;
  const isPositivePnL = safeNetPnL >= 0;
  const currentEquity = safeInitBalance + safeNetPnL;
  const returnPercentage = Number(((safeNetPnL / safeInitBalance) * 100).toFixed(2));

  return (
    <div className="space-y-3">
      {onOpenAIAdvisor && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-2.5 rounded-xl border border-indigo-800/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-sm">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                AI Performance Audit Available
                <span className="bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-1.5 py-0.2 rounded text-[10px] font-mono">
                  ACTIVE
                </span>
              </span>
              <p className="text-[11px] text-slate-300">
                Run an intelligent scan of your trading psychology, R:R consistency, and leaks.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAIAdvisor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Launch AI Audit Report
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      
      {/* Net P&L Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Net Profit</span>
          {isPositivePnL ? (
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-rose-500" />
          )}
        </div>
        <div className={`text-lg sm:text-xl font-bold tracking-tight font-mono ${isPositivePnL ? 'text-emerald-600' : 'text-rose-500'}`}>
          {isPositivePnL ? '+' : ''}${safeNetPnL.toLocaleString()}
        </div>
        <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100">
          <span className="text-slate-500 font-medium">${currentEquity.toLocaleString()}</span>
          <span className={`font-bold ${isPositivePnL ? 'text-emerald-600' : 'text-rose-500'}`}>
            {returnPercentage >= 0 ? '+' : ''}{returnPercentage}%
          </span>
        </div>
      </div>

      {/* Win Rate Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Win Rate</span>
          <Award className="w-4 h-4 text-amber-500" />
        </div>
        <div className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight font-mono">
          {stats.winRate}%
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, stats.winRate))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-semibold text-slate-500 mt-2">
          <span className="text-emerald-600">{stats.wins} W</span>
          <span className="text-rose-500">{stats.losses} L</span>
          <span className="text-slate-400">{stats.breakevens} BE</span>
        </div>
      </div>

      {/* Average R:R Ratio Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg R:R Ratio</span>
          <Scale className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight font-mono">
          1 : {stats.avgActualRR > 0 ? stats.avgActualRR : stats.avgRR}
        </div>
        <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex justify-between font-medium">
          <span>Plan 1:{stats.avgRR}</span>
          <span className="text-blue-600 font-semibold">Realized</span>
        </div>
      </div>

      {/* Profit Factor Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Profit Factor</span>
          <Zap className="w-4 h-4 text-blue-500" />
        </div>
        <div className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight font-mono">
          {stats.profitFactor}
        </div>
        <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 truncate font-medium">
          Total Win: <span className="text-emerald-600 font-semibold">${stats.totalProfit}</span>
        </div>
      </div>

      {/* Expectancy Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Expectancy</span>
          <Target className="w-4 h-4 text-teal-600" />
        </div>
        <div className={`text-lg sm:text-xl font-bold tracking-tight font-mono ${stats.expectancy >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
          {stats.expectancy >= 0 ? '+' : ''}${stats.expectancy}
        </div>
        <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 font-medium">
          Expected / trade
        </div>
      </div>

      {/* Max Drawdown Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Max Drawdown</span>
          <ShieldAlert className="w-4 h-4 text-rose-500" />
        </div>
        <div className="text-lg sm:text-xl font-bold text-rose-500 tracking-tight font-mono">
          -${stats.maxDrawdown.toLocaleString()}
        </div>
        <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 font-medium">
          Peak drawdown
        </div>
      </div>

    </div>
    </div>
  );
};

