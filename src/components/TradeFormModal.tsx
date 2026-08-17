import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Trash2, Calculator, Info, Check, AlertCircle, ArrowUpRight, ArrowDownRight, Globe } from 'lucide-react';
import { Trade, StrategyType, EmotionalState, TradeDirection, TradingSession } from '../types';
import { calculateRiskReward, computeTradeMetrics } from '../utils/calculations';

interface TradeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tradeData: Partial<Trade>) => void;
  initialTrade?: Trade | null;
}

const TRADING_SESSIONS: TradingSession[] = [
  'Asian Session',
  'London Session',
  'New York Session',
  'London - NY Overlap',
  'Sydney Session',
  'Off-Hours',
];

const TIMEFRAME_OPTIONS = [
  'Monthly',
  'Weekly',
  '1D',
  '4H',
  '2H',
  '1H',
  '30M',
  '15M',
  '5M',
  '3M',
  '1M',
  '15S',
];

const STRATEGIES: StrategyType[] = [
  'DEMAND',
  'SUPPLY',
  'T.C QML',
  'T.C. QML A+',
  'DB',
  'DT',
  'LVL 3',
  'LVL 4',
  'FIB',
  'D.C QML',
  'D.C.QML A+',
  'TJL1',
  'TJL2',
  'SBR',
  'RBS',
  'QML',
];

const EMOTIONAL_STATES: { label: EmotionalState; category: 'positive' | 'neutral' | 'negative'; description: string }[] = [
  { label: 'Disciplined', category: 'positive', description: 'Followed plan strictly' },
  { label: 'Calm & Focused', category: 'positive', description: 'Relaxed execution' },
  { label: 'Anxious', category: 'negative', description: 'Nervous during trade' },
  { label: 'Hesitant', category: 'negative', description: 'Delayed entry / exit' },
  { label: 'FOMO / Greedy', category: 'negative', description: 'Chased moving market' },
  { label: 'Revenge / Angry', category: 'negative', description: 'Trading after a loss' },
  { label: 'Overconfident', category: 'negative', description: 'Sized too large' },
  { label: 'Impulsive', category: 'negative', description: 'Unplanned impulse entry' },
];

export const TradeFormModal: React.FC<TradeFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTrade,
}) => {
  const [symbol, setSymbol] = useState(initialTrade?.symbol || 'EUR/USD');
  const [direction, setDirection] = useState<TradeDirection>(initialTrade?.direction || 'LONG');
  const [entryPrice, setEntryPrice] = useState<string>(initialTrade?.entryPrice ? initialTrade.entryPrice.toString() : '');
  const [exitPrice, setExitPrice] = useState<string>(initialTrade?.exitPrice !== undefined ? initialTrade.exitPrice.toString() : '');
  const [slPrice, setSlPrice] = useState<string>(initialTrade?.slPrice ? initialTrade.slPrice.toString() : '');
  const [tpPrice, setTpPrice] = useState<string>(initialTrade?.tpPrice ? initialTrade.tpPrice.toString() : '');
  const [riskPips, setRiskPips] = useState<string>(initialTrade?.riskPips ? initialTrade.riskPips.toString() : '20');
  const [positionSize, setPositionSize] = useState<string>(initialTrade?.positionSize ? initialTrade.positionSize.toString() : '1.0');
  const [strategyType, setStrategyType] = useState<StrategyType>(initialTrade?.strategyType || 'TJL1');
  const [session, setSession] = useState<TradingSession>(initialTrade?.session || 'Asian Session');
  const [levelTimeframe, setLevelTimeframe] = useState<string>(initialTrade?.levelTimeframe || '1D');
  const [confirmationTimeframe, setConfirmationTimeframe] = useState<string>(initialTrade?.confirmationTimeframe || '15M');
  const [emotionalState, setEmotionalState] = useState<EmotionalState>(initialTrade?.emotionalState || 'Disciplined');
  const [date, setDate] = useState<string>(initialTrade?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(initialTrade?.time || new Date().toTimeString().slice(0, 5));
  const [notes, setNotes] = useState<string>(initialTrade?.notes || '');
  const [rating, setRating] = useState<number>(initialTrade?.rating || 4);
  const [chartImages, setChartImages] = useState<string[]>(initialTrade?.chartImages || []);
  const [tagsInput, setTagsInput] = useState<string>(initialTrade?.tags ? initialTrade.tags.join(', ') : '');
  const [isRiskFree, setIsRiskFree] = useState<boolean>(initialTrade?.isRiskFree || false);
  const [partialExitNote, setPartialExitNote] = useState<string>(initialTrade?.partialExitNote || '');
  const [formError, setFormError] = useState<string | null>(null);

  // Live Automated Calculations
  const entryNum = parseFloat(entryPrice) || 0;
  const slNum = parseFloat(slPrice) || 0;
  const tpNum = parseFloat(tpPrice) || 0;
  const exitNum = parseFloat(exitPrice);

  const liveCalculatedRR = calculateRiskReward(direction, entryNum, slNum, tpNum);

  // Auto calculate pip distance & live P&L estimate
  let liveRiskPoints = 0;
  if (entryNum && slNum) {
    liveRiskPoints = Math.abs(entryNum - slNum);
  }

  let liveRealizedRR = 0;
  if (entryNum && slNum && !isNaN(exitNum) && exitNum > 0) {
    const delta = direction === 'LONG' ? exitNum - entryNum : entryNum - exitNum;
    const riskDelta = Math.abs(entryNum - slNum);
    if (riskDelta > 0) {
      liveRealizedRR = Number((delta / riskDelta).toFixed(2));
    }
  }

  useEffect(() => {
    if (initialTrade) {
      setSymbol(initialTrade.symbol);
      setDirection(initialTrade.direction);
      setEntryPrice(initialTrade.entryPrice?.toString() || '');
      setExitPrice(initialTrade.exitPrice !== undefined ? initialTrade.exitPrice.toString() : '');
      setSlPrice(initialTrade.slPrice?.toString() || '');
      setTpPrice(initialTrade.tpPrice?.toString() || '');
      setRiskPips(initialTrade.riskPips?.toString() || '20');
      setPositionSize(initialTrade.positionSize?.toString() || '1.0');
      setStrategyType(initialTrade.strategyType || 'TJL1');
      setSession(initialTrade.session || 'Asian Session');
      setLevelTimeframe(initialTrade.levelTimeframe || '1D');
      setConfirmationTimeframe(initialTrade.confirmationTimeframe || '15M');
      setEmotionalState(initialTrade.emotionalState || 'Disciplined');
      setDate(initialTrade.date || new Date().toISOString().split('T')[0]);
      setTime(initialTrade.time || new Date().toTimeString().slice(0, 5));
      setNotes(initialTrade.notes || '');
      setRating(initialTrade.rating || 4);
      setChartImages(initialTrade.chartImages || []);
      setTagsInput(initialTrade.tags ? initialTrade.tags.join(', ') : '');
      setIsRiskFree(initialTrade.isRiskFree || false);
      setPartialExitNote(initialTrade.partialExitNote || '');
    } else {
      // Reset defaults for new trade
      setSymbol('EUR/USD');
      setDirection('LONG');
      setEntryPrice('');
      setExitPrice('');
      setSlPrice('');
      setTpPrice('');
      setRiskPips('20');
      setPositionSize('1.0');
      setStrategyType('DEMAND');
      setSession('Asian Session');
      setLevelTimeframe('1D');
      setConfirmationTimeframe('15M');
      setEmotionalState('Disciplined');
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toTimeString().slice(0, 5));
      setNotes('');
      setRating(4);
      setChartImages([]);
      setTagsInput('');
      setIsRiskFree(false);
      setPartialExitNote('');
    }
  }, [initialTrade, isOpen]);

  if (!isOpen) return null;

  // Handle Chart File Uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setChartImages((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeChartImage = (indexToRemove: number) => {
    setChartImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!symbol || !entryPrice || !slPrice || !tpPrice) {
      setFormError('Please fill in Symbol, Entry Price, Stop Loss, and Take Profit levels.');
      return;
    }

    const tagsArr = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const parsedExit = exitPrice !== '' ? parseFloat(exitPrice) : undefined;

    const rawTrade: Partial<Trade> = {
      id: initialTrade?.id || `trd-${Date.now()}`,
      date,
      time,
      symbol: symbol.toUpperCase(),
      direction,
      entryPrice: parseFloat(entryPrice),
      exitPrice: parsedExit,
      slPrice: parseFloat(slPrice),
      tpPrice: parseFloat(tpPrice),
      riskPips: parseFloat(riskPips) || 0,
      positionSize: parseFloat(positionSize) || 1,
      strategyType,
      session,
      levelTimeframe,
      confirmationTimeframe,
      emotionalState,
      notes,
      rating,
      chartImages,
      tags: tagsArr,
      isRiskFree,
      partialExitNote: isRiskFree ? partialExitNote : undefined,
    };

    const computed = computeTradeMetrics(rawTrade);
    onSave(computed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 sticky top-0 z-10">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
              {initialTrade ? 'Edit Trade Entry' : 'Log New Trade Entry'}
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full border border-blue-200">
                Automated R:R
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Record price levels, market sessions, strategy setups, and chart screenshots.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          
          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl font-semibold flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{formError}</span>
              </div>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-rose-500 hover:text-rose-800 text-xs font-bold px-2 py-0.5 rounded hover:bg-rose-100"
              >
                ✕
              </button>
            </div>
          )}

          {/* SECTION 1: Core Trade Info */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                1. Core Trade Identifiers
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Symbol */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Symbol / Asset <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g. EUR/USD, NQ, BTC"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-mono font-bold text-sm"
                  required
                />
              </div>

              {/* Direction */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Direction <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-200/60 p-1 rounded-xl border border-slate-300/60">
                  <button
                    type="button"
                    onClick={() => setDirection('LONG')}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                      direction === 'LONG'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    LONG
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('SHORT')}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                      direction === 'SHORT'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    SHORT
                  </button>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Trade Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Trade Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Price Levels & R:R Calculator */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                2. Price Levels & Risk Parameters
              </span>
            </div>

            {/* REAL-TIME AUTOMATED RISK TO REWARD DISPLAY BOX */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200 rounded-xl p-4 relative overflow-hidden shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Automated Planned Risk to Reward Ratio
                    </div>
                    <div className="text-2xl font-black text-slate-900 flex items-baseline gap-2">
                      1 : <span className="text-blue-700">{liveCalculatedRR > 0 ? liveCalculatedRR : '0.00'}</span>
                      {liveCalculatedRR >= 2 ? (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Excellent R:R (≥ 1:2)
                        </span>
                      ) : liveCalculatedRR > 0 ? (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          Low R:R (&lt; 1:2)
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Realized R:R preview if exit price is filled */}
                {!isNaN(exitNum) && exitNum > 0 && (
                  <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-right shadow-sm">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Realized Outcome R:R</div>
                    <div className={`text-base font-extrabold ${liveRealizedRR >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {liveRealizedRR >= 0 ? '+' : ''}{liveRealizedRR} R
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Price Levels Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Entry Price */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Entry Price <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder="1.0850"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500 font-bold"
                  required
                />
              </div>

              {/* Stop Loss (SL) */}
              <div>
                <label className="block text-xs font-semibold text-rose-600 mb-1.5">
                  Stop Loss (SL) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={slPrice}
                  onChange={(e) => setSlPrice(e.target.value)}
                  placeholder="1.0825"
                  className="w-full bg-white border border-rose-300 rounded-xl px-3.5 py-2 text-rose-700 font-mono focus:outline-none focus:border-rose-500 font-bold"
                  required
                />
              </div>

              {/* Take Profit (TP) */}
              <div>
                <label className="block text-xs font-semibold text-emerald-700 mb-1.5">
                  Take Profit (TP) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={tpPrice}
                  onChange={(e) => setTpPrice(e.target.value)}
                  placeholder="1.0925"
                  className="w-full bg-white border border-emerald-300 rounded-xl px-3.5 py-2 text-emerald-700 font-mono focus:outline-none focus:border-emerald-500 font-bold"
                  required
                />
              </div>

              {/* Exit Price */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Exit Price <span className="text-slate-400 font-normal">(Optional - if closed)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                  placeholder="Actual exit price"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>

              {/* Risk in Pips */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Risk (Pips / Points) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={riskPips}
                  onChange={(e) => setRiskPips(e.target.value)}
                  placeholder="20"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500 font-bold"
                  required
                />
              </div>

              {/* Position Size */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Position Size (Lots / Contracts)
                </label>
                <input
                  type="number"
                  step="any"
                  value={positionSize}
                  onChange={(e) => setPositionSize(e.target.value)}
                  placeholder="1.0"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>
            </div>

            {/* RISK-FREE / PARTIAL EXIT BREAKEVEN TOGGLE BOX */}
            <div className={`p-4 rounded-xl border transition-all ${isRiskFree ? 'bg-sky-50/90 border-sky-300 shadow-sm' : 'bg-slate-100/70 border-slate-200'}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="isRiskFreeToggle"
                    checked={isRiskFree}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsRiskFree(checked);
                      if (checked && !exitPrice) {
                        // Auto populate exit price to SL or Entry
                        if (slPrice) setExitPrice(slPrice);
                        else if (entryPrice) setExitPrice(entryPrice);
                      }
                    }}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                  />
                  <label htmlFor="isRiskFreeToggle" className="font-extrabold text-slate-900 cursor-pointer flex items-center gap-1.5 text-xs">
                    🛡️ Risk-Free / Partial Exit (Breakeven)
                  </label>
                </div>
                {isRiskFree && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-300">
                    BREAKEVEN (0.00 R / $0.00)
                  </span>
                )}
              </div>

              {isRiskFree && (
                <div className="mt-3 pt-3 border-t border-sky-200/80 space-y-2.5 text-xs">
                  <p className="text-slate-700 leading-relaxed">
                    <strong>Risk-Free Logic:</strong> You booked partial profit (e.g. 50% at 1:1) and the remaining position hit SL/Entry. The trade will be recorded as <strong>BREAKEVEN (0.00 R)</strong> so it does not skew your journal with an artificial loss.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (slPrice) setExitPrice(slPrice);
                      }}
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-[11px] transition-colors shadow-xs"
                    >
                      Set Exit = SL Price ({slPrice || 'SL'})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (entryPrice) setExitPrice(entryPrice);
                      }}
                      className="px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] transition-colors shadow-xs"
                    >
                      Set Exit = Entry Price ({entryPrice || 'Entry'})
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Partial Exit Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={partialExitNote}
                      onChange={(e) => setPartialExitNote(e.target.value)}
                      placeholder="e.g. Booked 50% lot at 1:1 (+1R), remaining stopped at initial SL (-1R) => Net 0R"
                      className="w-full bg-white border border-sky-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-sky-500 font-medium"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: Strategy, Trading Session & Timeframes */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                3. Strategy Setup & Market Context
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Strategy Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Strategy Setup <span className="text-rose-500">*</span>
                </label>
                <select
                  value={strategyType}
                  onChange={(e) => setStrategyType(e.target.value as StrategyType)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
                >
                  {STRATEGIES.map((strat) => (
                    <option key={strat} value={strat}>
                      {strat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trading Session */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  Trading Session <span className="text-rose-500">*</span>
                </label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value as TradingSession)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
                >
                  {TRADING_SESSIONS.map((sess) => (
                    <option key={sess} value={sess}>
                      {sess}
                    </option>
                  ))}
                </select>
              </div>

              {/* Emotional State */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Emotional State <span className="text-rose-500">*</span>
                </label>
                <select
                  value={emotionalState}
                  onChange={(e) => setEmotionalState(e.target.value as EmotionalState)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                >
                  {EMOTIONAL_STATES.map((emo) => (
                    <option key={emo.label} value={emo.label}>
                      {emo.label} ({emo.description})
                    </option>
                  ))}
                </select>
              </div>

              {/* Level Timeframe */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Level Timeframe <span className="text-blue-600 font-bold">(HTF)</span>
                </label>
                <select
                  value={levelTimeframe}
                  onChange={(e) => setLevelTimeframe(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-mono font-bold"
                >
                  {TIMEFRAME_OPTIONS.map((tf) => (
                    <option key={`level-${tf}`} value={tf}>
                      {tf}
                    </option>
                  ))}
                </select>
              </div>

              {/* Confirmation Timeframe */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirmation Timeframe <span className="text-emerald-600 font-bold">(LTF)</span>
                </label>
                <select
                  value={confirmationTimeframe}
                  onChange={(e) => setConfirmationTimeframe(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-blue-500 font-mono font-bold"
                >
                  {TIMEFRAME_OPTIONS.map((tf) => (
                    <option key={`conf-${tf}`} value={tf}>
                      {tf}
                    </option>
                  ))}
                </select>
              </div>

              {/* Execution Rating */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Execution Score (1-5 Stars)</label>
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3.5 py-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-xl transition-transform hover:scale-125 ${
                        star <= rating ? 'text-amber-400' : 'text-slate-200'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-500 ml-auto">{rating}/5</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Notes, Tags & Chart Screenshots */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                4. Notes & Chart Attachments
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tags (Comma separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. London Session, A+ Setup, News Driver"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Trade Notes & Execution Details</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Detail entry trigger, key price levels, market bias, or lessons learned..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 placeholder-slate-400 resize-none text-xs leading-relaxed"
                />
              </div>

              {/* Chart Screenshots Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    Chart Screenshots ({chartImages.length} attached)
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">PNG, JPG, WebP or SVG</span>
                </label>

                {/* Drop / Upload Zone */}
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/20 rounded-xl p-4 text-center transition-colors shadow-sm">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    id="chart-upload"
                    className="hidden"
                  />
                  <label htmlFor="chart-upload" className="cursor-pointer flex flex-col items-center gap-1">
                    <Upload className="w-5 h-5 text-blue-600 mb-0.5" />
                    <span className="text-xs font-bold text-slate-800">
                      Click to browse or drag chart images here
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Attach entry setups, HTF bias, or execution charts.
                    </span>
                  </label>
                </div>

                {/* Thumbnails preview list */}
                {chartImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    {chartImages.map((imgSrc, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video shadow-sm">
                        <img src={imgSrc} alt={`Chart Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeChartImage(idx)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          title="Remove image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Action Footer */}
          <div className="border-t border-slate-200/80 pt-4 flex items-center justify-end gap-3 sticky bottom-0 bg-white/95 backdrop-blur py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all"
            >
              {initialTrade ? 'Update Trade' : 'Save Trade Entry'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
