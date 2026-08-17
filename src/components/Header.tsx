import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  Sparkles,
  Download,
  RefreshCw,
  DollarSign,
  BarChart2,
  BookOpen,
  LogOut,
  User,
  Database,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AccountConfig, AuthUser, NotionConfig } from '../types';

interface HeaderProps {
  accountConfig: AccountConfig;
  onUpdateAccountConfig: (config: AccountConfig) => void;
  onOpenNewTrade: () => void;
  onOpenAIAdvisor: () => void;
  onOpenImportExport: () => void;
  onResetSampleData: () => void;
  onOpenNotionSettings: () => void;
  notionConfig?: NotionConfig;
  activeTab: 'trades' | 'analytics';
  setActiveTab: (tab: 'trades' | 'analytics') => void;
  user?: AuthUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  accountConfig,
  onUpdateAccountConfig,
  onOpenNewTrade,
  onOpenAIAdvisor,
  onOpenImportExport,
  onResetSampleData,
  onOpenNotionSettings,
  notionConfig,
  activeTab,
  setActiveTab,
  user,
  onLogout,
}) => {
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState(accountConfig.initialBalance.toString());

  const handleSaveBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(balanceInput);
    if (!isNaN(val) && val > 0) {
      onUpdateAccountConfig({
        ...accountConfig,
        initialBalance: val,
      });
    }
    setIsEditingBalance(false);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-lg text-white shadow-sm">
                T
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  WE TRADE <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/30 font-semibold tracking-wider">JOURNAL</span>
                </h1>
                <p className="text-[11px] text-slate-400">Risk-to-Reward &amp; Emotional Analytics Matrix</p>
              </div>
            </div>

            {/* View Tab Switcher Mobile */}
            <div className="flex md:hidden bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setActiveTab('trades')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === 'trades' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Journal Log
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Analytics
              </button>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="hidden md:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setActiveTab('trades')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'trades'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Journal Log
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Performance Matrix
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Notion Status Button */}
            <button
              onClick={onOpenNotionSettings}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                notionConfig?.connected
                  ? 'bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/50'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-400 hover:border-slate-700'
              }`}
              title="Notion Database Connection Settings"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">
                {notionConfig?.connected ? notionConfig.databaseTitle || 'Notion Linked' : 'Connect Notion'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  notionConfig?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
            </button>

            {/* Account Balance Widget */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs">
              <span className="text-slate-400 flex items-center gap-1 font-semibold uppercase text-[10px]">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Capital:
              </span>
              {isEditingBalance ? (
                <form onSubmit={handleSaveBalance} className="flex items-center gap-1">
                  <input
                    type="number"
                    value={balanceInput}
                    onChange={(e) => setBalanceInput(e.target.value)}
                    className="w-20 bg-slate-800 text-white px-1.5 py-0.5 rounded border border-slate-600 focus:outline-none focus:border-blue-500 text-xs font-mono"
                    autoFocus
                  />
                  <button type="submit" className="text-blue-400 text-xs hover:underline font-bold">
                    Save
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setBalanceInput(accountConfig.initialBalance.toString());
                    setIsEditingBalance(true);
                  }}
                  className="font-bold text-slate-100 hover:text-blue-400 transition-colors font-mono"
                  title="Click to edit initial account size"
                >
                  ${accountConfig.initialBalance.toLocaleString()}
                </button>
              )}
            </div>

            {/* AI Trading Report & Audit */}
            <button
              onClick={onOpenAIAdvisor}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 text-white border border-indigo-400/30 text-xs font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer"
              title="Open AI Performance Audit & Trading Psychology Report"
            >
              <Brain className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>AI Report</span>
            </button>

            {/* Import / Export */}
            <button
              onClick={onOpenImportExport}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
              title="Import / Export Trades"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Reset Data */}
            <button
              onClick={onResetSampleData}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs transition-colors"
              title="Reset Sample Demo Trades"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* New Trade Entry Button */}
            <button
              onClick={onOpenNewTrade}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              New Trade
            </button>

            {/* User Profile & Logout */}
            {user && (
              <div className="flex items-center gap-1.5 pl-1 border-l border-slate-800">
                <div
                  className="hidden sm:flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-xs"
                  title={`${user.name} (${user.email})`}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-4 h-4 rounded-full border border-slate-700"
                    />
                  ) : (
                    <User className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  <span className="font-semibold text-slate-200 max-w-[110px] truncate">
                    {user.name || user.email.split('@')[0]}
                  </span>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800 text-xs transition-all cursor-pointer"
                    title="Log out of Terminal"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
