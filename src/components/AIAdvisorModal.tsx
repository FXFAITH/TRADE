import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  X,
  Brain,
  AlertTriangle,
  Lightbulb,
  Loader2,
  Calendar,
  Copy,
  Check,
  TrendingDown,
  TrendingUp,
  Target,
  ShieldAlert,
  Award,
  Flame,
  FileText
} from 'lucide-react';
import { Trade, AIInsightResult } from '../types';
import { calculateSummaryStats, SummaryStats } from '../utils/calculations';

interface AIAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  summaryStats: SummaryStats;
}

type PeriodKey = '7d' | '14d' | '30d' | '90d' | 'all';

const PERIOD_LABELS: Record<PeriodKey, string> = {
  '7d': 'Past 7 Days (Weekly)',
  '14d': 'Past 14 Days (Bi-Weekly)',
  '30d': 'Past 30 Days (Monthly)',
  '90d': 'Past 90 Days (Quarterly)',
  'all': 'All Time Journal',
};

export const AIAdvisorModal: React.FC<AIAdvisorModalProps> = ({
  isOpen,
  onClose,
  trades,
  summaryStats: globalSummaryStats,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('7d');
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<AIInsightResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter trades based on selected period
  const filteredTrades = useMemo(() => {
    if (selectedPeriod === 'all') return trades;

    const daysMap: Record<PeriodKey, number> = {
      '7d': 7,
      '14d': 14,
      '30d': 30,
      '90d': 90,
      'all': 0,
    };

    const days = daysMap[selectedPeriod];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    cutoffDate.setHours(0, 0, 0, 0);

    return trades.filter((t) => {
      if (!t.date) return false;
      const tradeDate = new Date(t.date);
      return tradeDate >= cutoffDate;
    });
  }, [trades, selectedPeriod]);

  // Calculate local summary stats for the filtered timeframe
  const periodSummaryStats = useMemo(() => {
    return calculateSummaryStats(filteredTrades, 10000);
  }, [filteredTrades]);

  if (!isOpen) return null;

  const handleGenerateInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trades: filteredTrades,
          summaryStats: periodSummaryStats,
          period: PERIOD_LABELS[selectedPeriod],
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch AI performance report.');
      }

      const data: AIInsightResult = await response.json();
      setInsight(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the AI performance review.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!insight) return;

    const mistakesText = insight.majorMistakes
      ? insight.majorMistakes
          .map((m) => `• [${m.category.toUpperCase()}] ${m.title}: ${m.description} (Impact: ${m.impact})`)
          .join('\n')
      : (insight.areasForImprovement || []).map((a) => `• ${a}`).join('\n');

    const strengthsText = (insight.whatWentRight || insight.keyStrengths || [])
      .map((s) => `• ${s}`)
      .join('\n');

    const planText = (insight.improvementPlan || insight.actionableRules || [])
      .map((p, i) => `${i + 1}. ${p}`)
      .join('\n');

    const reportText = `=== AI TRADING JOURNAL PERFORMANCE REPORT ===
Period Analyzed: ${insight.periodAnalyzed || PERIOD_LABELS[selectedPeriod]}
Overall Grade: ${insight.overallGrade || insight.riskManagementGrade || 'N/A'} (Score: ${insight.performanceScore ?? 'N/A'}/100)
Trades Analyzed: ${filteredTrades.length} | Win Rate: ${periodSummaryStats.winRate}% | Net P&L: $${periodSummaryStats.netPnL}

--- EXECUTIVE SUMMARY ---
${insight.executiveSummary || 'No executive summary available.'}

--- WHAT WENT WRONG (MISTAKES & LEAKS) ---
${mistakesText || 'None detected.'}

--- PSYCHOLOGY AUDIT ---
${insight.psychologyInsight || 'N/A'}

--- WHAT WENT RIGHT ---
${strengthsText || 'N/A'}

--- ACTIONABLE IMPROVEMENT PLAN ---
${planText || 'N/A'}

--- NEXT PERIOD DIRECTIVE ---
${insight.ruleOfThumbForNextPeriod || 'Stick strictly to stop losses and risk-reward rules.'}
`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight text-white">AI Performance Audit & Unfiltered Review</h2>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono font-bold border border-blue-400/30">
                  GEMINI 3.6
                </span>
              </div>
              <p className="text-xs text-slate-400">Brutally honest feedback on execution mistakes, psychological leaks, and habit fixes.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeframe Selector Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" /> Audit Period:
            </span>
            {(['7d', '14d', '30d', '90d', 'all'] as PeriodKey[]).map((periodKey) => (
              <button
                key={periodKey}
                onClick={() => {
                  setSelectedPeriod(periodKey);
                  setInsight(null); // Reset report preview on period change
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedPeriod === periodKey
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {periodKey === '7d'
                  ? 'Past Week (7d)'
                  : periodKey === '14d'
                  ? 'Bi-Weekly (14d)'
                  : periodKey === '30d'
                  ? 'Monthly (30d)'
                  : periodKey === '90d'
                  ? 'Quarterly (90d)'
                  : 'All Time'}
              </button>
            ))}
          </div>

          <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1 rounded-md border border-slate-200 flex items-center gap-3">
            <span>
              Trades: <strong className="text-slate-900">{filteredTrades.length}</strong>
            </span>
            <span>&bull;</span>
            <span>
              Win Rate: <strong className={periodSummaryStats.winRate >= 50 ? 'text-emerald-600' : 'text-amber-600'}>{periodSummaryStats.winRate}%</strong>
            </span>
            <span>&bull;</span>
            <span>
              P&L: <strong className={periodSummaryStats.netPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}>${periodSummaryStats.netPnL}</strong>
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          
          {/* Audit Launcher Box */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-extrabold text-white">Generate Unfiltered Performance Report</h3>
              </div>
              <p className="text-slate-300 text-xs max-w-lg leading-relaxed">
                Analyze <strong className="text-blue-300">{filteredTrades.length} trade logs</strong> from <strong className="text-amber-300">{PERIOD_LABELS[selectedPeriod]}</strong>. AI inspects actual entry/exit prices, emotional tags, notes, and stop loss hits to tell you exactly what you did wrong and how to fix it.
              </p>
            </div>
            <button
              onClick={handleGenerateInsights}
              disabled={loading || filteredTrades.length === 0}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Auditing Journal...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  {insight ? 'Re-Run Audit' : 'Run AI Report'}
                </>
              )}
            </button>
          </div>

          {filteredTrades.length === 0 && (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-2">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="font-bold text-slate-800">No Trades Recorded in {PERIOD_LABELS[selectedPeriod]}</div>
              <p className="text-slate-500 text-xs">Try selecting a broader timeframe (e.g. Past 30 Days or All Time) or log new trades into your journal.</p>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-800 font-medium flex items-center gap-2 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Generated Performance Review Display */}
          {insight && (
            <div className="space-y-6 animate-fade-in">

              {/* Action Bar: Period badge + Copy button */}
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-600 text-white rounded-lg">
                    <Award className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="font-extrabold text-blue-900 text-xs">Official Performance Review</span>
                    <span className="text-blue-700 text-xs font-semibold ml-2">({insight.periodAnalyzed || PERIOD_LABELS[selectedPeriod]})</span>
                  </div>
                </div>
                <button
                  onClick={handleCopyReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-blue-700 font-bold border border-blue-200 text-xs transition-colors shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Report Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Report Text
                    </>
                  )}
                </button>
              </div>

              {/* Grade, Score & Executive Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Score & Grade Box */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col justify-between shadow-md">
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Overall Execution Grade</div>
                    <div className="flex items-baseline gap-3 mt-1">
                      <div className="text-4xl font-black text-amber-400">{insight.overallGrade || insight.riskManagementGrade || 'B'}</div>
                      {insight.performanceScore !== undefined && (
                        <div className="text-xs font-bold text-slate-300">
                          Score: <span className="text-white text-base">{insight.performanceScore}</span>/100
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-[11px] text-slate-400">
                    <span>Risk Grade: <strong className="text-emerald-400">{insight.riskManagementGrade}</strong></span>
                    <span>Analyzed: <strong className="text-white">{insight.tradeCountInPeriod || filteredTrades.length} Trades</strong></span>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="md:col-span-2 bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                      <Brain className="w-3.5 h-3.5 text-blue-600" /> Unfiltered Performance Audit
                    </div>
                    <p className="text-slate-800 text-xs mt-2 leading-relaxed font-medium">
                      {insight.executiveSummary || insight.psychologyInsight}
                    </p>
                  </div>
                  
                  {insight.ruleOfThumbForNextPeriod && (
                    <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-bold text-[11px] flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Next Period Directive: "{insight.ruleOfThumbForNextPeriod}"</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Section 1: Major Mistakes & Leaks ("What I Did Wrong") */}
              <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs uppercase tracking-wide">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Execution Mistakes & Leak Diagnosis ("What You Did Wrong")</span>
                </div>

                {insight.majorMistakes && insight.majorMistakes.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {insight.majorMistakes.map((mistake, idx) => (
                      <div key={idx} className="bg-white border border-rose-200 p-3.5 rounded-xl space-y-1.5 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                            {mistake.title}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            mistake.category === 'Risk' ? 'bg-rose-100 text-rose-800' :
                            mistake.category === 'Psychology' ? 'bg-amber-100 text-amber-800' :
                            mistake.category === 'Execution' ? 'bg-orange-100 text-orange-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {mistake.category} LEAK
                          </span>
                        </div>
                        <p className="text-slate-700 text-xs leading-relaxed">{mistake.description}</p>
                        <div className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md inline-block">
                          Impact: {mistake.impact}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="list-disc list-inside space-y-1.5 text-slate-800 font-medium bg-white p-3.5 rounded-xl border border-rose-200">
                    {(insight.areasForImprovement || []).map((item, idx) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Section 2: Psychological & Emotional Breakdown */}
              {insight.psychologyInsight && (
                <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-xs uppercase tracking-wide">
                    <Brain className="w-4 h-4 text-indigo-600" />
                    <span>Psychological & Emotional State Audit</span>
                  </div>
                  <p className="text-slate-800 text-xs leading-relaxed font-medium bg-white p-3.5 rounded-xl border border-indigo-100 shadow-sm">
                    {insight.psychologyInsight}
                  </p>
                </div>
              )}

              {/* Section 3: What Went Right ("Strengths & Clean Execution") */}
              {((insight.whatWentRight && insight.whatWentRight.length > 0) || (insight.keyStrengths && insight.keyStrengths.length > 0)) && (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs uppercase tracking-wide">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>What Went Right & Best Trading Habits</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(insight.whatWentRight || insight.keyStrengths).map((strength, idx) => (
                      <div key={idx} className="bg-white border border-emerald-200 p-3 rounded-xl flex items-start gap-2 shadow-sm">
                        <Target className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-slate-800 font-semibold text-xs leading-snug">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: Actionable Step-by-Step Improvement Plan */}
              {((insight.improvementPlan && insight.improvementPlan.length > 0) || (insight.actionableRules && insight.actionableRules.length > 0)) && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xs uppercase tracking-wide">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                    <span>Step-by-Step Action Plan for Next Period</span>
                  </div>
                  <div className="space-y-2">
                    {(insight.improvementPlan || insight.actionableRules).map((step, idx) => (
                      <div key={idx} className="bg-white border border-blue-200 p-3 rounded-xl flex items-start gap-3 shadow-sm">
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="text-slate-800 font-medium text-xs leading-relaxed">{step}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI report generated directly from logged trade entries and emotional states.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-sm"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
};
