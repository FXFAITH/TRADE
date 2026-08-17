import { Trade, NotionConfig } from '../types';

const NOTION_CONFIG_KEY = 'sentinel_notion_config_v1';
const LOCAL_TRADES_BACKUP_KEY = 'sentinel_trades_local_backup_v1';

export const DEFAULT_NOTION_CONFIG: NotionConfig = {
  apiKey: 'ntn_Q38234662644sLexkBRmI46birmVGxUHESVj8PrVosR0Oi',
  databaseId: '3bf0e3e57718801182ece24131bad598',
  databaseTitle: 'Trading Journal',
  connected: true,
};

export function getStoredNotionConfig(): NotionConfig {
  try {
    const saved = localStorage.getItem(NOTION_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_NOTION_CONFIG,
        ...parsed,
        connected: true,
      };
    }
  } catch (e) {
    console.error('Failed to load Notion config from localStorage', e);
  }
  return DEFAULT_NOTION_CONFIG;
}

export function saveStoredNotionConfig(config: NotionConfig): void {
  try {
    localStorage.setItem(NOTION_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save Notion config', e);
  }
}

export function getLocalTradesBackup(): Trade[] {
  try {
    const saved = localStorage.getItem(LOCAL_TRADES_BACKUP_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load local trades backup', e);
  }
  return [];
}

export function saveLocalTradesBackup(trades: Trade[]): void {
  try {
    localStorage.setItem(LOCAL_TRADES_BACKUP_KEY, JSON.stringify(trades));
  } catch (e) {
    console.error('Failed to save local trades backup', e);
  }
}

// Check Notion status on backend or with stored config
export async function checkNotionStatus(config?: NotionConfig): Promise<{
  configured: boolean;
  databaseId?: string | null;
  databaseTitle?: string;
  error?: string;
}> {
  try {
    const activeConfig = config || getStoredNotionConfig();
    const query = new URLSearchParams();
    if (activeConfig.apiKey) query.append('apiKey', activeConfig.apiKey);
    if (activeConfig.databaseId) query.append('databaseId', activeConfig.databaseId);

    const res = await fetch(`/api/notion/status?${query.toString()}`);
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      configured: false,
      error: err.message || 'Failed to check Notion connection.',
    };
  }
}

// Test Notion credentials
export async function testNotionConnection(apiKey: string, databaseId: string): Promise<{
  success: boolean;
  databaseTitle?: string;
  databaseId?: string;
  properties?: string[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/notion/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, databaseId }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Connection failed.' };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to connect to server.' };
  }
}

// Fetch trades from Notion
export async function fetchNotionTrades(config?: NotionConfig): Promise<{ trades: Trade[]; isNotion: boolean }> {
  const activeConfig = config || getStoredNotionConfig();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  if (activeConfig.apiKey) headers['x-notion-key'] = activeConfig.apiKey;
  if (activeConfig.databaseId) headers['x-notion-db'] = activeConfig.databaseId;

  try {
    const res = await fetch('/api/notion/trades', { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.trades)) {
        saveLocalTradesBackup(data.trades);
        return { trades: data.trades, isNotion: true };
      }
    }
  } catch (err) {
    console.warn('Could not fetch from Notion, falling back to local storage:', err);
  }

  // Fallback to local storage
  const local = getLocalTradesBackup();
  return { trades: local, isNotion: false };
}

// Insert new trade
export async function insertNotionTrade(trade: Trade, config?: NotionConfig): Promise<Trade> {
  const activeConfig = config || getStoredNotionConfig();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  if (activeConfig.apiKey) headers['x-notion-key'] = activeConfig.apiKey;
  if (activeConfig.databaseId) headers['x-notion-db'] = activeConfig.databaseId;

  try {
    const res = await fetch('/api/notion/trades', {
      method: 'POST',
      headers,
      body: JSON.stringify(trade),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.trade) {
        return data.trade;
      }
    }
  } catch (err) {
    console.warn('Failed writing to Notion API, stored locally:', err);
  }

  return trade;
}

// Update trade
export async function updateNotionTrade(trade: Trade, config?: NotionConfig): Promise<Trade> {
  const activeConfig = config || getStoredNotionConfig();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  if (activeConfig.apiKey) headers['x-notion-key'] = activeConfig.apiKey;
  if (activeConfig.databaseId) headers['x-notion-db'] = activeConfig.databaseId;

  try {
    const res = await fetch(`/api/notion/trades/${encodeURIComponent(trade.id)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(trade),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.trade) {
        return data.trade;
      }
    }
  } catch (err) {
    console.warn('Failed updating Notion API, stored locally:', err);
  }

  return trade;
}

// Delete (archive) trade
export async function deleteNotionTrade(tradeId: string, config?: NotionConfig): Promise<boolean> {
  const activeConfig = config || getStoredNotionConfig();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  if (activeConfig.apiKey) headers['x-notion-key'] = activeConfig.apiKey;
  if (activeConfig.databaseId) headers['x-notion-db'] = activeConfig.databaseId;

  try {
    const res = await fetch(`/api/notion/trades/${encodeURIComponent(tradeId)}`, {
      method: 'DELETE',
      headers,
    });

    return res.ok;
  } catch (err) {
    console.warn('Failed deleting in Notion API:', err);
    return false;
  }
}

// Sync all trades in batch to Notion
export async function syncAllNotionTrades(trades: Trade[], config?: NotionConfig): Promise<{ success: boolean; syncedCount?: number; error?: string }> {
  const activeConfig = config || getStoredNotionConfig();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  if (activeConfig.apiKey) headers['x-notion-key'] = activeConfig.apiKey;
  if (activeConfig.databaseId) headers['x-notion-db'] = activeConfig.databaseId;

  try {
    const res = await fetch('/api/notion/sync-all', {
      method: 'POST',
      headers,
      body: JSON.stringify({ trades }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Sync failed.' };
  }
}
