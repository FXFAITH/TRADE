import { AuthUser } from '../types';

const AUTH_USER_KEY = 'sentinel_trade_user_session_v1';

export function getStoredUser(): AuthUser | null {
  try {
    const saved = localStorage.getItem(AUTH_USER_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load user session', e);
  }
  return null;
}

export function saveStoredUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch (e) {
    console.error('Failed to save user session', e);
  }
}

// Decode Google JWT Token (ID token from Google Identity Services)
export function parseGoogleJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse Google JWT', e);
    return null;
  }
}

// Create user object from Google payload
export function createGoogleUser(googlePayload: {
  sub?: string;
  email: string;
  name?: string;
  picture?: string;
}): AuthUser {
  return {
    id: googlePayload.sub || `google-${Date.now()}`,
    email: googlePayload.email,
    name: googlePayload.name || googlePayload.email.split('@')[0],
    avatar: googlePayload.picture || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(googlePayload.email)}`,
    provider: 'google',
  };
}

// Create user object for Demo Trader
export function createDemoUser(): AuthUser {
  return {
    id: 'demo-trader-001',
    email: 'demo.trader@sentinel.app',
    name: 'Demo Trader (Pro)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    provider: 'demo',
  };
}

// Create user from Notion Integration
export function createNotionUser(databaseTitle?: string): AuthUser {
  return {
    id: `notion-${Date.now()}`,
    email: 'notion.synced@workspace.local',
    name: databaseTitle || 'Notion Trader',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=notion',
    provider: 'notion',
  };
}
