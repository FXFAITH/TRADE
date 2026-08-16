import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Shield,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { NotionConfig, Trade } from '../types';
import {
  getStoredNotionConfig,
  saveStoredNotionConfig,
  testNotionConnection,
  syncAllNotionTrades,
} from '../lib/notion';

interface NotionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  onTradesSynced?: () => void;
}

export const NotionSettingsModal: React.FC<NotionSettingsModalProps> = ({
  isOpen,
  onClose,
  trades,
  onTradesSynced,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    databaseTitle?: string;
    properties?: string[];
    error?: string;
  } | null>(null);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    count?: number;
    error?: string;
  } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getStoredNotionConfig();
      setApiKey(config.apiKey || '');
      setDatabaseId(config.databaseId || '');
      setTestResult(null);
      setSyncResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsTesting(true);
    setTestResult(null);
    setSyncResult(null);

    const res = await testNotionConnection(apiKey.trim(), databaseId.trim());
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      const newConfig: NotionConfig = {
        apiKey: apiKey.trim(),
        databaseId: databaseId.trim(),
        databaseTitle: res.databaseTitle,
        connected: true,
        lastSynced: new Date().toISOString(),
      };
      saveStoredNotionConfig(newConfig);
    }
  };

  const handleSyncTrades = async () => {
    if (!apiKey.trim() || !databaseId.trim()) {
      alert('Please provide your Notion API Key and Database ID first.');
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    const config: NotionConfig = {
      apiKey: apiKey.trim(),
      databaseId: databaseId.trim(),
      connected: true,
    };

    const res = await syncAllNotionTrades(trades, config);
    setIsSyncing(false);

    if (res.success) {
      setSyncResult({ success: true, count: res.syncedCount });
      if (onTradesSynced) onTradesSynced();
    } else {
      setSyncResult({ success: false, error: res.error });
    }
  };

  const handleDisconnect = () => {
    if (confirm('Disconnect Notion database and revert to local storage?')) {
      const emptyConfig: NotionConfig = { connected: false };
      saveStoredNotionConfig(emptyConfig);
      setApiKey('');
      setDatabaseId('');
      setTestResult(null);
      setSyncResult(null);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl text-slate-100 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Notion Database Integration
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-mono">
                  DIRECT 2-WAY SYNC
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Connect your trading journal directly to your personal Notion workspace database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Quick Setup Guide Card */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              How to Connect Notion in 3 Simple Steps
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2">
                <span className="font-semibold text-blue-400">Step 1: Create Secret</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Go to Notion Integrations and create an internal integration called &quot;Trading Journal&quot;.
                </p>
                <a
                  href="https://www.notion.so/my-integrations"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 text-[11px] mt-1"
                >
                  notion.so/my-integrations <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2">
                <span className="font-semibold text-amber-400">Step 2: Connect Database</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Open your Notion Database page &rarr; click <strong>...</strong> in top-right &rarr; <strong>Connections</strong> &rarr; Add your integration.
                </p>
                <span className="text-[10px] text-amber-500 font-mono">Required for access</span>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2">
                <span className="font-semibold text-emerald-400">Step 3: Paste & Sync</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Copy the <strong>Internal Integration Secret</strong> and your Database URL or ID into the fields below.
                </p>
                <span className="text-[10px] text-emerald-500 font-mono">Instant 2-way sync</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Notion Internal Integration Secret (API Key)</span>
                <span className="text-[11px] text-slate-500 font-mono">Starts with &quot;secret_...&quot;</span>
              </label>
              <input
                type="password"
                placeholder="secret_abc123xyz..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Notion Database ID or Full Database URL</span>
                <span className="text-[11px] text-slate-500 font-mono">32-character ID from Notion URL</span>
              </label>
              <input
                type="text"
                placeholder="https://www.notion.so/workspace/19f80abf37c38095a56ee892d3f3f26a?v=... or 19f80abf37c38095a56ee892d3f3f26a"
                value={databaseId}
                onChange={(e) => setDatabaseId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 text-xs font-mono"
              />
            </div>

            {/* Test Connection Output */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  {testResult.success
                    ? `Successfully connected to "${testResult.databaseTitle}"!`
                    : 'Connection Failed'}
                </div>
                {testResult.success ? (
                  <p className="text-[11px] text-emerald-300/80">
                    Notion Database verified. Detected {testResult.properties?.length || 0} properties including setups like DEMAND, SUPPLY, T.C QML, DB, DT.
                  </p>
                ) : (
                  <p className="text-[11px] text-rose-300/90">{testResult.error}</p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors border border-transparent hover:border-rose-900/40"
              >
                Clear / Disconnect
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isTesting || !apiKey || !databaseId}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {isTesting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {isTesting ? 'Testing...' : 'Test & Save Connection'}
                </button>
              </div>
            </div>
          </form>

          {/* Sync Existing Local Trades to Notion */}
          <div className="border-t border-slate-800 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                  Batch Sync Local Journal to Notion
                </h4>
                <p className="text-[11px] text-slate-400">
                  Upload your {trades.length} existing journal trades directly into your Notion database
                </p>
              </div>
              <button
                type="button"
                onClick={handleSyncTrades}
                disabled={isSyncing || trades.length === 0}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all shadow-sm"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {isSyncing ? 'Syncing...' : `Sync ${trades.length} Trades`}
              </button>
            </div>

            {syncResult && (
              <div
                className={`p-3 rounded-lg border text-xs ${
                  syncResult.success
                    ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
                }`}
              >
                {syncResult.success
                  ? `Successfully synced ${syncResult.count} trades into your Notion database!`
                  : `Sync error: ${syncResult.error}`}
              </div>
            )}
          </div>

          {/* Supported Setups & Columns reference */}
          <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-3.5 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Automatic Notion Database Column Mapping</span>
              <span className="text-emerald-400">All Strategy Setups Supported</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Symbol (Title)',
                'Direction (Select)',
                'Status (Select)',
                'DEMAND',
                'SUPPLY',
                'T.C QML',
                'T.C. QML A+',
                'DB',
                'DT',
                'Entry / Exit (Number)',
                'SL / TP (Number)',
                'PnL (Number)',
                'R:R (Number)',
                'Date',
                'Notes',
                'Screenshot',
              ].map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-800 text-[10px] font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
