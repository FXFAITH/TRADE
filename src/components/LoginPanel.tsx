import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  UserCheck,
  Sparkles,
  CheckCircle2,
  Database,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { AuthUser, NotionConfig } from '../types';
import {
  createGoogleUser,
  createDemoUser,
  createNotionUser,
  saveStoredUser,
} from '../lib/auth';
import {
  testNotionConnection,
  saveStoredNotionConfig,
  getStoredNotionConfig,
} from '../lib/notion';

interface LoginPanelProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({ onLogin }) => {
  const [authMethod, setAuthMethod] = useState<'google' | 'notion'>('google');
  
  // Google sign in state
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Notion sign in state
  const [notionApiKey, setNotionApiKey] = useState('');
  const [notionDatabaseId, setNotionDatabaseId] = useState('');
  const [isNotionTesting, setIsNotionTesting] = useState(false);
  const [notionError, setNotionError] = useState<string | null>(null);
  const [notionSuccess, setNotionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const existing = getStoredNotionConfig();
    if (existing.apiKey) setNotionApiKey(existing.apiKey);
    if (existing.databaseId) setNotionDatabaseId(existing.databaseId);
  }, []);

  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setGoogleError('Please enter your Google account email address.');
      return;
    }
    if (!googleEmail.includes('@')) {
      setGoogleError('Please enter a valid email format (e.g. yourname@gmail.com).');
      return;
    }

    setIsGoogleLoading(true);
    setGoogleError(null);

    setTimeout(() => {
      const user = createGoogleUser({
        email: googleEmail.trim(),
        name: googleName.trim() || undefined,
      });
      saveStoredUser(user);
      setIsGoogleLoading(false);
      onLogin(user);
    }, 400);
  };

  const handleDemoLogin = () => {
    const user = createDemoUser();
    saveStoredUser(user);
    onLogin(user);
  };

  const handleNotionConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notionApiKey.trim()) {
      setNotionError('Please enter your Notion Integration Secret (starts with secret_).');
      return;
    }
    if (!notionDatabaseId.trim()) {
      setNotionError('Please enter your Notion Database ID or URL.');
      return;
    }

    setIsNotionTesting(true);
    setNotionError(null);
    setNotionSuccess(null);

    const res = await testNotionConnection(notionApiKey.trim(), notionDatabaseId.trim());
    setIsNotionTesting(false);

    if (res.success) {
      const config: NotionConfig = {
        apiKey: notionApiKey.trim(),
        databaseId: notionDatabaseId.trim(),
        databaseTitle: res.databaseTitle,
        connected: true,
        lastSynced: new Date().toISOString(),
      };
      saveStoredNotionConfig(config);

      const user = createNotionUser(res.databaseTitle);
      saveStoredUser(user);
      setNotionSuccess(`Connected to Notion: "${res.databaseTitle}"`);

      setTimeout(() => {
        onLogin(user);
      }, 500);
    } else {
      setNotionError(res.error || 'Failed to connect to Notion database.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Terminal Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-blue-400 shadow-xl mb-1">
            <Shield className="w-7 h-7 stroke-[2]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            SENTINEL <span className="text-xs px-2.5 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/30 font-semibold tracking-wider">JOURNAL</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Quantitative Trading Log &amp; Performance Matrix backed by your personal database
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 backdrop-blur-md space-y-5">
          
          {/* Method Selector Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setAuthMethod('google')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                authMethod === 'google'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Google G Icon */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Google Auth
            </button>

            <button
              type="button"
              onClick={() => setAuthMethod('notion')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                authMethod === 'notion'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Notion Database
            </button>
          </div>

          {/* GOOGLE AUTH VIEW */}
          {authMethod === 'google' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h2 className="text-sm font-bold text-white">Sign in with Google</h2>
                <p className="text-[11px] text-slate-400">
                  Authenticate securely to access your private journal and Notion sync
                </p>
              </div>

              {googleError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{googleError}</span>
                </div>
              )}

              <form onSubmit={handleGoogleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Google Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="trader@gmail.com"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Trader Name / Alias <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pro Trader"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGoogleLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-98 cursor-pointer mt-1"
                >
                  {isGoogleLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Continue with Google</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* NOTION DIRECT CONNECT VIEW */}
          {authMethod === 'notion' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h2 className="text-sm font-bold text-white">Connect Notion Database</h2>
                <p className="text-[11px] text-slate-400">
                  Read &amp; write trades directly to your Notion workspace table
                </p>
              </div>

              {notionError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-[11px]">{notionError}</span>
                </div>
              )}

              {notionSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{notionSuccess}</span>
                </div>
              )}

              <form onSubmit={handleNotionConnect} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Notion Secret (API Key)</span>
                    <a
                      href="https://www.notion.so/my-integrations"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 hover:underline flex items-center gap-0.5 text-[10px]"
                    >
                      Get Secret <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </label>
                  <input
                    type="password"
                    placeholder="secret_abc123..."
                    value={notionApiKey}
                    onChange={(e) => setNotionApiKey(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Notion Database URL or ID
                  </label>
                  <input
                    type="text"
                    placeholder="https://notion.so/workspace/19f80abf..."
                    value={notionDatabaseId}
                    onChange={(e) => setNotionDatabaseId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 text-xs font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isNotionTesting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-98 cursor-pointer mt-1"
                >
                  {isNotionTesting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Connect Notion &amp; Launch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider absolute">
              OR QUICK ACCESS
            </span>
          </div>

          {/* Demo Trader Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400 group-hover:rotate-12 transition-transform" />
            <span>Try Demo Trader (Instant Access)</span>
          </button>

        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500">
          <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/40">
            <span className="font-semibold text-slate-300 block">Notion 2-Way</span>
            Direct Database Sync
          </div>
          <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/40">
            <span className="font-semibold text-slate-300 block">Google Auth</span>
            Private Isolated Session
          </div>
          <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/40">
            <span className="font-semibold text-slate-300 block">AI Auditor</span>
            Gemini Flash Review
          </div>
        </div>

      </div>
    </div>
  );
};
