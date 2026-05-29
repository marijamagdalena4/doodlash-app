import type { SessionData } from '../types';

const SESSION_KEY = 'doodlash_session';

export function loadSession(): SessionData | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export function saveSession(data: SessionData): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function updateSessionPlayerId(playerId: string): void {
  const session = loadSession();
  if (session) {
    saveSession({ ...session, playerId });
  }
}
