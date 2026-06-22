'use client';

import type { RosterMember } from './types';

export interface Session {
  code: string;
  groupId: string;
  groupName: string;
  you: string;
  isLead: boolean;
  roster: RosterMember[];
  tasks: { id: string; title: string; description: string; category: string; score: number }[];
}

const KEY = 'sh.session';

export function saveSession(s: Session): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(KEY);
}
