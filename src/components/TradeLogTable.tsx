import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Brain,
  Scale,
  Calendar,
  ExternalLink,
  Clock,
  Globe,
} from 'lucide-react';
import { Trade, FilterOptions, StrategyType, EmotionalState } from '../types';

interface TradeLogTableProps {
  trades: Trade[];
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (id: string) => void;
  onOpenNewTrade: () => void;
  onViewImageLightbox: (imageUrl: string) => void;
}

export const TradeLogTable: React.FC<TradeLogTableProps> = ({
  trades,
  onEditTrade,
  onDeleteTrade,
  onOpenNewTrade,
  onViewImageLightbox,
}) => {
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [deletingTradeId, setDeletingTradeId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    symbol: '',
    strategy: '',
    session: '',
    emotion: '',
    status: '',
    direction: '',
    startDate: '',
    endDate: '',
  });

  const [sortField, setSortField] = useState<'date' | 'pnlAmount' | 'calculatedRiskReward' | 'symbol'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Toggle sorting
  const handleSort = (field: 'date' | 'pnlAmount' | 'calculatedRiskReward' | 'symbol') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter logic
  const filteredTrades = trades.filter((trade) => {
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const matchSymbol = trade.symbol.toLowerCase().includes(q);
      const matchNotes = trade.notes?.toLowerCase().includes(q) || false;
      const matchTags = trade.tags?.some((t) => t.toLowerCase().includes(q)) || false;
      if (!matchSymbol && !matchNotes && !matchTags) return false;
    }

    if (filters.symbol && trade.symbol.toLowerCase() !== filters.symbol.toLowerCase()) return false;
    if (filters.strategy && trade.strategyType !== filters.strategy) return false;
    if (filters.session && trade.session !== filters.session) return false;
    if (filters.emotion && trade.emotionalState !== filters.emotion) return false;
    if (filters.status && trade.status !== filters.status) return false;
    if (filters.direction && trade.direction !== filters.direction) return false;
    if (filters.levelTimeframe && trade.levelTimeframe !== filters.levelTimeframe) return false;
    if (filters.confirmationTimeframe && trade.confirmationTimeframe !== filters.confirmationTimeframe) return false;

    if (filters.startDate && new Date(trade.date) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(trade.date) > new Date(filters.endDate)) return false;

    return true;
  });

  // Sort logic
  const sortedTrades = [...filteredTrades].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (sortField === 'date') {
      aVal = new Date(a.date + 'T' + (a.time || '00:00')).getTime();
      bVal = new Date(b.date + 'T' + (b.time || '00:00')).getTime();
    }

    if (aVal === undefined) aVal = 0;
    if (bVal === undefined) bVal = 0;

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleExpand = (id: string) => {
    setExpandedTradeId(expandedTradeId === id ? null : id);
  };

  const getStatusBadge = (status: string, isRiskFree?: boolean) => {
    if (isRiskFree) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-sky-50 text-sky-800 border border-sky-300 inline-flex items-center gap-1" title="Risk-Free / Partial Exit Breakeven">
          🛡️ BREAKEVEN
        </span>
      );
    }
    switch (status) {
      case 'WIN':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">WIN</span>;
      case 'LOSS':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">LOSS</span>;
      case 'BREAKEVEN':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">BREAKEVEN</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">OPEN</span>;
    }
  };

  const getEmotionBadge = (emotion: EmotionalState) => {
    const isNegative = ['Anxious', 'Hesitant', 'FOMO / Greedy', 'Revenge / Angry', 'Overconfident', 'Impulsive'].includes(emotion);
    if (isNegative) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <Brain className="w-3 h-3 text-rose-500" />
          {emotion}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <Brain className="w-3 h-3 text-emerald-600" />
        {emotion}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      
      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              placeholder="Search symbol, notes, tags..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Strategy Filter */}
            <select
              value={filters.strategy}
              onChange={(e) => setFilters({ ...filters, strategy: e.target.value })}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="">All Strategies</option>
              <option value="TJL1">TJL1</option>
              <option value="TJL2">TJL2</option>
              <option value="SBR">SBR</option>
              <option value="RBS">RBS</option>
              <option value="QML">QML</option>
              <option value="LVL 3">LVL 3</option>
              <option value="LVL 4">LVL 4</option>
              <option value="FIB">FIB</option>
              <option value="D.C QML">D.C QML</option>
              <option value="D.C.QML A+">D.C.QML A+</option>
              <option value="DEMAND">DEMAND</option>
              <option value="SUPPLY">SUPPLY</option>
              <option value="T.C QML">T.C QML</option>
              <option value="T.C. QML A+">T.C. QML A+</option>
              <option value="DB">DB</option>
              <option value="DT">DT</option>
            </select>

            {/* Session Filter */}
            <select
              value={filters.session || ''}
              onChange={(e) => setFilters({ ...filters, session: e.target.value })}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-semibold"
            >
              <option value="">All Sessions</option>
              <option value="Asian Session">Asian Session</option>
              <option value="London Session">London Session</option>
              <option value="New York Session">New York Session</option>
              <option value="London - NY Overlap">London - NY Overlap</option>
              <option value="Sydney Session">Sydney Session</option>
              <option value="Off-Hours">Off-Hours</option>
            </select>

            {/* Level TF Filter */}
            <select
              value={filters.levelTimeframe || ''}
              onChange={(e) => setFilters({ ...filters, levelTimeframe: e.target.value })}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="">All Level TFs (HTF)</option>
              <option value="Monthly">Monthly</option>
              <option value="Weekly">Weekly</option>
              <option value="1D">1D</option>
              <option value="4H">4H</option>
              <option value="1H">1H</option>
              <option value="15M">15M</option>
              <option value="5M">5M</option>
            </select>

            {/* Confirmation TF Filter */}
            <select
              value={filters.confirmationTimeframe || ''}
              onChange={(e) => setFilters({ ...filters, confirmationTimeframe: e.target.value })}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="">All Confirmation TFs (LTF)</option>
              <option value="1D">1D</option>
              <option value="4H">4H</option>
              <option value="1H">1H</option>
              <option value="15M">15M</option>
              <option value="5M">5M</option>
              <option value="3M">3M</option>
              <option value="1M">1M</option>
              <option value="15S">15S</option>
            </select>

            {/* Emotional State Filter */}
            <select
              value={filters.emotion}
              onChange={(e) => setFilters({ ...filters, emotion: e.target.value })}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="">All Emotional States</option>
              <option value="Disciplined">Disciplined</option>
              <option value="Calm & Focused">Calm & Focused</option>
              <option value="Anxious">Anxious</option>
              <option value="Hesitant">Hesitant</option>
              <option value="FOMO / Greedy">FOMO / Greedy</option>
              <option value="Revenge / Angry">Revenge / Angry</option>
            </select>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="">All Outcomes</option>
              <option value="WIN">Win</option>
              <option value="LOSS">Loss</option>
              <option value="BREAKEVEN">Breakeven</option>
              <option value="OPEN">Open</option>
            </select>

            {/* Reset filters */}
            {(filters.searchQuery || filters.strategy || filters.session || filters.emotion || filters.status || filters.levelTimeframe || filters.confirmationTimeframe) && (
              <button
                onClick={() =>
                  setFilters({
                    searchQuery: '',
                    symbol: '',
                    strategy: '',
                    session: '',
                    emotion: '',
                    status: '',
                    direction: '',
                    levelTimeframe: '',
                    confirmationTimeframe: '',
                    startDate: '',
                    endDate: '',
                  })
                }
                className="text-xs text-rose-600 hover:underline px-2 py-1 font-semibold"
              >
                Clear Filters
              </button>
            )}

          </div>

        </div>

      </div>

      {/* Trade Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        
        {sortedTrades.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Filter className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No trade entries match your filter</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search criteria or log a new trade entry with price levels and chart screenshots.
            </p>
            <button
              onClick={onOpenNewTrade}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
            >
              <Plus className="w-4 h-4" /> Log New Trade
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4"></th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      Date & Time <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('symbol')}
                  >
                    <div className="flex items-center gap-1">
                      Symbol / Dir <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Entry → Exit</th>
                  <th className="py-3 px-4">SL / TP Levels</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('calculatedRiskReward')}
                  >
                    <div className="flex items-center gap-1">
                      Risk : Reward <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Strategy & Emotion</th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('pnlAmount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      P&L ($) <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">Charts</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sortedTrades.map((trade) => {
                  const isExpanded = expandedTradeId === trade.id;
                  const isWin = trade.status === 'WIN';
                  const isLoss = trade.status === 'LOSS';
                  const pnl = trade.pnlAmount || 0;

                  return (
                    <React.Fragment key={trade.id}>
                      
                      {/* Main Table Row */}
                      <tr className="hover:bg-slate-50 transition-colors group">
                        
                        {/* Expand Collapse Toggle */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => toggleExpand(trade.id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Toggle trade details & notes"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>

                        {/* Date & Time */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{trade.date}</div>
                          <div className="text-[10px] text-slate-400">{trade.time || '00:00'}</div>
                        </td>

                        {/* Symbol & Direction */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 font-mono">
                            {trade.symbol}
                            {trade.direction === 'LONG' ? (
                              <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <ArrowUpRight className="w-3 h-3" /> L
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                <ArrowDownRight className="w-3 h-3" /> S
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Entry & Exit Price */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-700">
                          <div>
                            <span className="text-slate-400">In:</span> {trade.entryPrice}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Out: {trade.exitPrice !== undefined ? trade.exitPrice : 'Open'}
                          </div>
                        </td>

                        {/* SL & TP Levels */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                          <div className="text-rose-600 font-semibold">SL: {trade.slPrice}</div>
                          <div className="text-emerald-600 font-semibold">TP: {trade.tpPrice}</div>
                        </td>

                        {/* AUTOMATED RISK REWARD RATIO BADGE */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                            <Scale className="w-3 h-3 text-blue-600" />
                            <span className="font-mono font-bold text-blue-800">
                              1 : {trade.calculatedRiskReward}
                            </span>
                          </div>
                          {trade.actualRiskReward !== undefined && trade.status !== 'OPEN' && (
                            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                              Realized: <span className={trade.actualRiskReward >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{trade.actualRiskReward} R</span>
                            </div>
                          )}
                        </td>

                        {/* Strategy, Session & Emotional State */}
                        <td className="py-3 px-4 whitespace-nowrap space-y-1">
                          <div className="text-slate-800 font-semibold flex items-center gap-1.5">
                            {trade.strategyType}
                            {trade.session && (
                              <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-100">
                                <Globe className="w-2.5 h-2.5 text-blue-600" />
                                {trade.session}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold border border-slate-200" title="Level TF → Confirmation TF">
                              <Clock className="w-2.5 h-2.5 text-blue-600" />
                              <span>{trade.levelTimeframe || '1D'}</span>
                              <span className="text-slate-400">→</span>
                              <span className="text-emerald-700">{trade.confirmationTimeframe || '15M'}</span>
                            </span>
                          </div>
                          <div>{getEmotionBadge(trade.emotionalState)}</div>
                        </td>

                        {/* P&L & Status */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {getStatusBadge(trade.status, trade.isRiskFree)}
                            <div className={`font-mono font-bold ${pnl > 0 ? 'text-emerald-600' : pnl < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                              {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                            </div>
                          </div>
                          {trade.pnlPips !== undefined && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {trade.pnlPips >= 0 ? '+' : ''}{trade.pnlPips} pips
                            </div>
                          )}
                        </td>

                        {/* Chart Screenshot Count */}
                        <td className="py-3 px-4 text-center">
                          {trade.chartImages && trade.chartImages.length > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewImageLightbox(trade.chartImages[0]);
                              }}
                              className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded text-[11px] font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                              title="View Chart Screenshot"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              {trade.chartImages.length}
                            </button>
                          ) : (
                            <span className="text-slate-300 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTrade(trade);
                              }}
                              className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                              title="Edit trade"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {deletingTradeId === trade.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTrade(trade.id);
                                    setDeletingTradeId(null);
                                  }}
                                  className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                                  title="Confirm Delete"
                                >
                                  Delete?
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingTradeId(null);
                                  }}
                                  className="px-1.5 py-1 rounded bg-slate-200 text-slate-600 text-[10px] font-semibold hover:bg-slate-300 transition-colors cursor-pointer"
                                  title="Cancel"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingTradeId(trade.id);
                                }}
                                className="p-1.5 rounded bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 transition-colors cursor-pointer"
                                title="Delete trade"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>

                      {/* Expanded Row Details */}
                      {isExpanded && (
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <td colSpan={10} className="p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              
                              {/* Execution Parameters */}
                              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                                <div className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 uppercase text-[10px] tracking-wider text-slate-500">
                                  Trade Parameters
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-slate-600">
                                  <div>Trading Session: <span className="text-blue-700 font-bold">{trade.session || 'Asian Session'}</span></div>
                                  <div>Level TF (HTF): <span className="text-slate-900 font-mono font-bold">{trade.levelTimeframe || '1D'}</span></div>
                                  <div>Confirm TF (LTF): <span className="text-slate-900 font-mono font-bold">{trade.confirmationTimeframe || '15M'}</span></div>
                                  <div>Risk in Pips: <span className="text-slate-900 font-mono font-bold">{trade.riskPips}</span></div>
                                  <div>Position Size: <span className="text-slate-900 font-mono">{trade.positionSize || 1.0}</span></div>
                                  <div>Planned R:R: <span className="text-blue-700 font-mono font-bold">1:{trade.calculatedRiskReward}</span></div>
                                  <div>Execution Rating: <span className="text-amber-500">{'★'.repeat(trade.rating || 4)}</span></div>
                                </div>
                                {trade.tags && trade.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-1">
                                    {trade.tags.map((tg, idx) => (
                                      <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                                        #{tg}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Notes */}
                              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1.5 md:col-span-2">
                                <div className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 uppercase text-[10px] tracking-wider text-slate-500 flex items-center justify-between">
                                  <span>Trade Notes & Execution Journal</span>
                                  {trade.isRiskFree && (
                                    <span className="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-bold">
                                      🛡️ Risk-Free Trade
                                    </span>
                                  )}
                                </div>
                                {trade.partialExitNote && (
                                  <div className="bg-sky-50/80 border border-sky-200 p-2 rounded-lg text-[11px] text-sky-900 font-medium">
                                    <strong>Partial Exit Note:</strong> {trade.partialExitNote}
                                  </div>
                                )}
                                <p className="text-slate-700 text-xs whitespace-pre-wrap leading-relaxed font-normal">
                                  {trade.notes || 'No execution notes recorded for this trade entry.'}
                                </p>
                              </div>

                            </div>

                            {/* Attached Chart Screenshots */}
                            {trade.chartImages && trade.chartImages.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                  <ImageIcon className="w-4 h-4 text-blue-600" />
                                  Attached Chart Screenshots ({trade.chartImages.length})
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  {trade.chartImages.map((imgSrc, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => onViewImageLightbox(imgSrc)}
                                      className="group relative aspect-video bg-slate-100 border border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:border-blue-500 transition-all shadow-sm"
                                    >
                                      <img src={imgSrc} alt={`Chart Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <ExternalLink className="w-5 h-5 text-white" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          </td>
                        </tr>
                      )}

                    </React.Fragment>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}

      </div>

    </div>
  );
};
