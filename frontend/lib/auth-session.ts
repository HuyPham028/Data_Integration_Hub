const ACCESS_TOKEN_KEY = 'access_token';
const USER_INFO_KEY = 'user_info';
const AUTH_PAGES = ['/login', '/register'];
const VALID_ROLES = ['admin', 'reader', 'writer', 'user'] as const;

type StoredUser = {
  role?: string;
  [key: string]: unknown;
};

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  const rawUser = localStorage.getItem(USER_INFO_KEY);
  if (!rawUser) return null;
  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    return null;
  }
}

export function getCurrentUserRole(): string | null {
  const token = getAccessToken();
  if (!token) return null;

  const decodedUser = decodeJwtPayload(token);
  const role = decodedUser?.role as string | undefined;

  if (!role || !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return null;
  }
  return role;
}

export function isJwtExpired(token: string, skewSeconds = 5): boolean {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== 'number') return true;
  const now = Math.floor(Date.now() / 1000);
  return exp <= now + skewSeconds;
}

export function hasValidSession(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  return !isJwtExpired(token);
}

export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.includes(pathname);
}
