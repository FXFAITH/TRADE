import React, { useState, useEffect, useRef } from 'react';
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
  Key,
  ShieldCheck,
} from 'lucide-react';
import { AuthUser, NotionConfig } from '../types';
import {
  createGoogleUser,
  createDemoUser,
  createNotionUser,
  parseGoogleJwt,
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

declare global {
  interface Window {
    google?: any;
  }
}

export const LoginPanel: React.FC<LoginPanelProps> = ({ onLogin }) => {
  const [authMethod, setAuthMethod] = useState<'google' | 'notion'>('google');
  
  // Google sign in state
  const [googleEmail, setGoogleEmail] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Notion sign in state
  const [notionApiKey, setNotionApiKey] = useState('');
  const [notionDatabaseId, setNotionDatabaseId] = useState('');
  const [isNotionTesting, setIsNotionTesting] = useState(false);
  const [notionError, setNotionError] = useState<string | null>(null);
  const [notionSuccess, setNotionSuccess] = useState<string | null>(null);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Initialize Google Identity Services (GIS) button if available
  useEffect(() => {
    const existing = getStoredNotionConfig();
    if (existing.apiKey) setNotionApiKey(existing.apiKey);
    if (existing.databaseId) setNotionDatabaseId(existing.databaseId);

    const initGoogleGsi = () => {
      const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
      if (window.google?.accounts?.id && googleClientId && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: any) => {
            if (response.credential) {
              const payload = parseGoogleJwt(response.credential);
              if (payload?.email) {
                const user = createGoogleUser({
                  sub: payload.sub,
                  email: payload.email,
                  name: payload.name,
                  picture: payload.picture,
                });
                saveStoredUser(user);
                onLogin(user);
              }
            }
          },
        });

        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_blue',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: 320,
        });
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleGsi();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGoogleGsi();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [onLogin]);

  const handleEmailPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setGoogleError('Please enter your email address.');
      return;
    }
    if (!googleEmail.includes('@')) {
      setGoogleError('Please enter a valid email format (e.g. trader@gmail.com).');
      return;
    }
    if (googlePassword.length < 4) {
      setGoogleError('Security PIN / Password must be at least 4 characters to protect your account.');
      return;
    }

    // Verify local PIN security if previously set for this email
    const savedPinKey = `sentinel_trader_pin_${googleEmail.trim().toLowerCase()}`;
    const existingPin = localStorage.getItem(savedPinKey);
    if (existingPin && existingPin !== googlePassword) {
      setGoogleError('Incorrect Password/PIN for this trader email. Please check your credentials.');
      return;
    }

    // Save PIN to protect this account from unauthorized entry on this device
    if (!existingPin) {
      localStorage.setItem(savedPinKey, googlePassword);
    }

    setIsGoogleLoading(true);
    setGoogleError(null);

    setTimeout(() => {
      const user = createGoogleUser({
        email: googleEmail.trim().toLowerCase(),
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
            WE TRADE <span className="text-xs px-2.5 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/30 font-semibold tracking-wider">JOURNAL</span>
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
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure Trader Auth
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

          {/* SECURE TRADER AUTH VIEW */}
          {authMethod === 'google' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h2 className="text-sm font-bold text-white">Trader Secure Sign-In</h2>
                <p className="text-[11px] text-slate-400">
                  Password protected session &bull; Your trades are strictly isolated to your email
                </p>
              </div>

              {/* Official Google GSI Button Container */}
              <div ref={googleBtnRef} className="flex justify-center empty:hidden min-h-0" />

              {googleError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{googleError}</span>
                </div>
              )}

              <form onSubmit={handleEmailPasswordSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Trader Email Address
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Trader Password / PIN</span>
                    <span className="text-[10px] text-slate-500 font-mono">Locks your journal</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Enter 4+ digit PIN or password"
                      value={googlePassword}
                      onChange={(e) => setGooglePassword(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Trader Alias <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Master Trader"
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
                      <Lock className="w-3.5 h-3.5" />
                      <span>Unlock &amp; Enter Journal</span>
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

        {/* Security & Feature Highlights */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500">
          <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/40">
            <span className="font-semibold text-slate-300 block">Password / PIN</span>
            Account Protected
          </div>
          <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/40">
            <span className="font-semibold text-slate-300 block">Strict Isolation</span>
            Per-Email Database Filter
          </div>
          <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/40">
            <span className="font-semibold text-slate-300 block">Notion Cloud</span>
            Direct 2-Way Sync
          </div>
        </div>

      </div>
    </div>
  );
};
