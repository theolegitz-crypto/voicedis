import type { User } from '@/types/user';

const TOKEN_KEY = 'discord_token';
const USER_KEY = 'discord_user';

export function getStoredToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

export function persistAuthSession(token: string, user: User) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.cookie = `discord_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = 'discord_token=; path=/; max-age=0; samesite=lax';
}

