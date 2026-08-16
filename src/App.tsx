import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { LoginPanel } from './components/LoginPanel';
import { MetricsOverview } from './components/MetricsOverview';
import { TradeLogTable } from './components/TradeLogTable';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { TradeFormModal } from './components/TradeFormModal';
import { AIAdvisorModal } from './components/AIAdvisorModal';
import { ImportExportModal } from './components/ImportExportModal';
import { NotionSettingsModal } from './components/NotionSettingsModal';
import { ScreenshotLightbox } from './components/ScreenshotLightbox';
import { Trade, AccountConfig, AuthUser, NotionConfig } from './types';
import { SAMPLE_TRADES } from './utils/sampleData';
import { calculateSummaryStats } from './utils/calculations';
import { getStoredUser, saveStoredUser } from './lib/auth';
import {
  getStoredNotionConfig,
  saveStoredNotionConfig,
  checkNotionStatus,
  fetchNotionTrades,
  insertNotionTrade,
  updateNotionTrade,
  deleteNotionTrade,
  syncAllNotionTrades,
  saveLocalTradesBackup,
} from './lib/notion';
import { ShieldCheck, Database, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

const LOCAL_STORAGE_CONFIG_KEY = 'trade_journal_pro_config_v1';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [notionConfig, setNotionConfig] = useState<NotionConfig>(() => getStoredNotionConfig());
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoadingTrades, setIsLoadingTrades] = useState<boolean>(true);
  const [isNotionSource, setIsNotionSource] = useState<boolean>(false);

  const [accountConfig, setAccountConfig] = useState<AccountConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load config from localStorage', e);
    }
    return {
      initialBalance: 10000,
      riskPerTradePercent: 1.0,
      currency: '$',
    };
  });

  const [activeTab, setActiveTab] = useState<'trades' | 'analytics'>('trades');
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isAIAdvisorOpen, setIsAIAdvisorOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isNotionModalOpen, setIsNotionModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Check Notion connection on mount
  useEffect(() => {
    checkNotionStatus(notionConfig).then((status) => {
      if (status.configured) {
        setNotionConfig((prev) => ({
          ...prev,
          connected: true,
          databaseTitle: status.databaseTitle || prev.databaseTitle,
          databaseId: status.databaseId || prev.databaseId,
        }));
      }
    });
  }, []);

  // Load trades from Notion or local storage
  const loadTrades = useCallback(async () => {
    setIsLoadingTrades(true);
    try {
      const result = await fetchNotionTrades(notionConfig);
      if (result.trades && result.trades.length > 0) {
        setTrades(result.trades);
        setIsNotionSource(result.isNotion);
      } else {
        // If empty, populate with sample trades for first-time onboarding
        const initial = SAMPLE_TRADES.map((t) => ({ ...t, userId: user?.id || 'demo' }));
        setTrades(initial);
        saveLocalTradesBackup(initial);
        setIsNotionSource(false);
      }
    } catch (err) {
      console.error('Failed to load trades:', err);
    } finally {
      setIsLoadingTrades(false);
    }
  }, [notionConfig, user?.id]);

  useEffect(() => {
    if (user) {
      loadTrades();
    }
  }, [user, loadTrades]);

  // Save accountConfig to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(accountConfig));
    } catch (e) {
      console.error('Failed to save config to localStorage', e);
    }
  }, [accountConfig]);

  // Calculate summary stats
  const summaryStats = calculateSummaryStats(trades, accountConfig.initialBalance);

  // Handlers
  const handleSaveTrade = async (tradeData: Partial<Trade>) => {
    if (editingTrade) {
      // Update existing
      const updatedTrade = {
        ...editingTrade,
        ...tradeData,
        userId: user?.id || 'demo',
      } as Trade;

      setTrades((prev) => prev.map((t) => (t.id === editingTrade.id ? updatedTrade : t)));
      saveLocalTradesBackup(trades.map((t) => (t.id === editingTrade.id ? updatedTrade : t)));
      await updateNotionTrade(updatedTrade, notionConfig);
    } else {
      // Insert new
      const newEntry = {
        ...tradeData,
        id: tradeData.id || `trd-${Date.now()}`,
        userId: user?.id || 'demo',
      } as Trade;

      setTrades((prev) => [newEntry, ...prev]);
      saveLocalTradesBackup([newEntry, ...trades]);
      const createdInNotion = await insertNotionTrade(newEntry, notionConfig);
      if (createdInNotion && createdInNotion.id !== newEntry.id) {
        setTrades((prev) => prev.map((t) => (t.id === newEntry.id ? createdInNotion : t)));
      }
    }

    setEditingTrade(null);
  };

  const handleDeleteTrade = async (id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
    saveLocalTradesBackup(trades.filter((t) => t.id !== id));
    await deleteNotionTrade(id, notionConfig);
  };

  const handleEditTradeClick = (trade: Trade) => {
    setEditingTrade(trade);
    setIsTradeModalOpen(true);
  };

  const handleResetSampleData = async () => {
    const freshSample = SAMPLE_TRADES.map((t) => ({ ...t, userId: user?.id || 'demo' }));
    setTrades(freshSample);
    saveLocalTradesBackup(freshSample);
    setAccountConfig({
      initialBalance: 10000,
      riskPerTradePercent: 1.0,
      currency: '$',
    });

    if (notionConfig.connected) {
      await syncAllNotionTrades(freshSample, notionConfig);
    }
  };

  const handleImportTrades = async (newTrades: Trade[]) => {
    const withUserId = newTrades.map((t) => ({ ...t, userId: user?.id || 'demo' }));
    setTrades(withUserId);
    saveLocalTradesBackup(withUserId);

    if (notionConfig.connected) {
      await syncAllNotionTrades(withUserId, notionConfig);
    }
  };

  const handleLogout = () => {
    saveStoredUser(null);
    setUser(null);
    setTrades([]);
  };

  if (!user) {
    return <LoginPanel onLogin={(userObj) => setUser(userObj)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white flex flex-col">
      
      {/* Header Bar */}
      <Header
        accountConfig={accountConfig}
        onUpdateAccountConfig={setAccountConfig}
        onOpenNewTrade={() => {
          setEditingTrade(null);
          setIsTradeModalOpen(true);
        }}
        onOpenAIAdvisor={() => setIsAIAdvisorOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onResetSampleData={handleResetSampleData}
        onOpenNotionSettings={() => setIsNotionModalOpen(true)}
        notionConfig={notionConfig}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      {/* Database & Sync Status Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          
          <div className="flex items-center gap-2">
            {notionConfig.connected ? (
              <Database className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            
            <span>
              {notionConfig.connected ? (
                <>
                  Notion Database Active: <strong className="text-amber-300 font-mono">{notionConfig.databaseTitle || 'Trading Journal'}</strong>
                </>
              ) : (
                <>
                  Trader Session: <strong className="text-white font-mono">{user.email}</strong>
                </>
              )}
            </span>

            <span className="text-slate-500 hidden sm:inline">&bull;</span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              Auth: {user.provider === 'google' ? 'Google One-Tap' : user.provider === 'notion' ? 'Notion Auth' : 'Demo Mode'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400">
            {isLoadingTrades ? (
              <span className="flex items-center gap-1.5 text-blue-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Querying {notionConfig.connected ? 'Notion API...' : 'Journal...'}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsNotionModalOpen(true)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold cursor-pointer transition-colors ${
                    notionConfig.connected
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/70'
                      : 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                  }`}
                >
                  {notionConfig.connected ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Notion Synced ({trades.length})
                    </>
                  ) : (
                    <>
                      <Database className="w-3 h-3 text-amber-400" />
                      Link Notion Database
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Top Summary Metrics */}
        <MetricsOverview stats={summaryStats} initialBalance={accountConfig.initialBalance} />

        {/* Tab Content */}
        {activeTab === 'trades' ? (
          <TradeLogTable
            trades={trades}
            onEditTrade={handleEditTradeClick}
            onDeleteTrade={handleDeleteTrade}
            onOpenNewTrade={() => {
              setEditingTrade(null);
              setIsTradeModalOpen(true);
            }}
            onViewImageLightbox={(imgUrl) => setLightboxImage(imgUrl)}
          />
        ) : (
          <AnalyticsCharts trades={trades} initialBalance={accountConfig.initialBalance} />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-semibold text-slate-600">
            SENTINEL TradeJournal <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200">NOTION</span> &copy; {new Date().getFullYear()} &bull; Professional Trading Psychology &amp; Strategy Analytics
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
            <span>Direct Notion API</span>
            <span>&bull;</span>
            <span>Google Auth</span>
            <span>&bull;</span>
            <span>Automated R:R Matrix</span>
          </div>
        </div>
      </footer>

      {/* Modals & Lightbox */}
      <TradeFormModal
        isOpen={isTradeModalOpen}
        onClose={() => {
          setIsTradeModalOpen(false);
          setEditingTrade(null);
        }}
        onSave={handleSaveTrade}
        initialTrade={editingTrade}
      />

      <AIAdvisorModal
        isOpen={isAIAdvisorOpen}
        onClose={() => setIsAIAdvisorOpen(false)}
        trades={trades}
        summaryStats={summaryStats}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        trades={trades}
        onImportTrades={handleImportTrades}
      />

      <NotionSettingsModal
        isOpen={isNotionModalOpen}
        onClose={() => setIsNotionModalOpen(false)}
        trades={trades}
        onTradesSynced={loadTrades}
      />

      <ScreenshotLightbox
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />

    </div>
  );
}
