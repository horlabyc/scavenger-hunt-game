'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Confetti from '@/components/confetti';
import { GAME_DURATION_MS } from '@/lib/config';
import type { GameStatus } from '@/lib/types';

interface GroupRow {
  groupId: string;
  groupName: string;
  leadName: string;
  memberCount: number;
  score: number;
  percent: number;
  completedCount: number;
  totalTasks: number;
}

interface Winner {
  groupId: string;
  groupName: string;
  completedAt: string | null;
}

interface Overview {
  status: GameStatus;
  startedAt: string | null;
  maxScore: number;
  groups: GroupRow[];
  winner: Winner | null;
}

const POLL_MS = 10000;
const PW_KEY = 'sh.admin.pw';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [data, setData] = useState<Overview | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const pwRef = useRef('');

  // Restore a previously entered password (session only).
  useEffect(() => {
    const saved = sessionStorage.getItem(PW_KEY);
    if (saved) {
      pwRef.current = saved;
      setAuthed(true);
    }
  }, []);

  const fetchOverview = useCallback(async () => {
    if (!pwRef.current) return;
    try {
      const res = await fetch(`/api/admin/overview?password=${encodeURIComponent(pwRef.current)}`, {
        cache: 'no-store',
      });
      if (res.status === 401) {
        sessionStorage.removeItem(PW_KEY);
        pwRef.current = '';
        setAuthed(false);
        setLoginError('Session expired. Please log in again.');
        return;
      }
      if (res.ok) setData(await res.json());
    } catch {
      /* ignore transient errors */
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchOverview();
    const id = setInterval(fetchOverview, POLL_MS);
    return () => clearInterval(id);
  }, [authed, fetchOverview]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const d = await res.json();
        setLoginError(d?.error || 'Incorrect password.');
        return;
      }
      pwRef.current = password;
      sessionStorage.setItem(PW_KEY, password);
      setAuthed(true);
    } catch {
      setLoginError('Network error. Try again.');
    }
  }

  async function setGame(action: 'start' | 'stop') {
    setActionBusy(true);
    try {
      const res = await fetch('/api/admin/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwRef.current, action }),
      });
      if (res.ok) await fetchOverview();
    } finally {
      setActionBusy(false);
    }
  }

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <form onSubmit={login} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">Retreat SB 3.0</p>
          <h1 className="text-2xl font-extrabold text-brand-dark">Admin</h1>
          <p className="mb-4 mt-1 text-sm text-slate-500">Enter the organizer password.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
          {loginError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{loginError}</p>
          )}
          <button
            type="submit"
            className="mt-5 w-full rounded-xl bg-brand py-3 font-bold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
          >
            Log in
          </button>
        </form>
      </main>
    );
  }

  const status = data?.status ?? 'not_started';

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">Retreat SB 3.0</p>
          <h1 className="text-2xl font-extrabold text-slate-900">Organizer Dashboard</h1>
          <StatusPill status={status} startedAt={data?.startedAt ?? null} />
        </div>
        <GameControls status={status} busy={actionBusy} onSet={setGame} />
      </div>

      {data?.winner && <WinnerBanner winner={data.winner} startedAt={data.startedAt} />}

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Leaderboard
        </h2>
        <Leaderboard data={data} />
      </section>

      <p className="mt-6 text-center text-xs text-slate-400">Auto-refreshing every 10 seconds</p>
    </main>
  );
}

function StatusPill({ status, startedAt }: { status: GameStatus; startedAt: string | null }) {
  const map: Record<GameStatus, { label: string; cls: string }> = {
    not_started: { label: 'Not started', cls: 'bg-amber-100 text-amber-700' },
    running: { label: 'Running', cls: 'bg-green-100 text-green-700' },
    stopped: { label: 'Stopped', cls: 'bg-slate-200 text-slate-600' },
  };
  const s = map[status];
  return (
    <div className="mt-1 flex items-center gap-2">
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${s.cls}`}>
        {s.label}
      </span>
      {status === 'running' && <AdminCountdown startedAt={startedAt} />}
    </div>
  );
}

function AdminCountdown({ startedAt }: { startedAt: string | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!startedAt) return null;
  const left = Math.max(0, new Date(startedAt).getTime() + GAME_DURATION_MS - now);
  const m = Math.floor(left / 60000);
  const sec = Math.floor((left % 60000) / 1000);
  return (
    <span className="font-mono text-xs font-bold text-slate-500">
      {String(m).padStart(2, '0')}:{String(sec).padStart(2, '0')} left
    </span>
  );
}

function GameControls({
  status,
  busy,
  onSet,
}: {
  status: GameStatus;
  busy: boolean;
  onSet: (a: 'start' | 'stop') => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onSet('start')}
        disabled={busy || status === 'running'}
        className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === 'stopped' ? 'Restart game' : 'Start game'}
      </button>
      <button
        onClick={() => onSet('stop')}
        disabled={busy || status !== 'running'}
        className="rounded-xl border-2 border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Stop game
      </button>
    </div>
  );
}

function Leaderboard({ data }: { data: Overview | null }) {
  if (!data) {
    return <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-400">Loading…</p>;
  }
  const winnerId = data.winner?.groupId ?? null;
  return (
    <div className="space-y-2">
      {data.groups.map((g, i) => {
        const isWinner = g.groupId === winnerId;
        return (
        <Link
          key={g.groupId}
          href={`/admin/group/${g.groupId}`}
          className={`relative block overflow-hidden rounded-2xl p-4 shadow-sm transition hover:shadow-md hover:ring-2 hover:ring-brand/30 ${
            isWinner
              ? 'bg-gradient-to-r from-brand-tint to-amber-50 ring-2 ring-brand/40'
              : 'bg-white'
          }`}
        >
          {isWinner && <Confetti />}
          <div className="relative flex items-center gap-3">
            <span
              className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-extrabold ${
                isWinner || i === 0 ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isWinner ? '👑' : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-slate-900">
                {g.groupName}
                {isWinner && <span className="ml-1.5 text-xs font-bold text-brand">WINNER!</span>}
              </p>
              <p className="truncate text-xs text-slate-500">
                Lead: {g.leadName} · {g.memberCount} members
              </p>
            </div>
            <div className="flex-none text-right">
              <p className="text-xl font-extrabold text-brand-dark">{g.score}</p>
              <p className="text-xs text-slate-400">/ {data.maxScore} pts</p>
            </div>
          </div>
          <div className="relative mt-3">
            <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500">
              <span>
                {g.completedCount}/{g.totalTasks} tasks
              </span>
              <span>{g.percent}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="progress-fill h-full rounded-full bg-brand"
                style={{ width: `${g.percent}%` }}
              />
            </div>
          </div>
          <p className="relative mt-3 text-right text-xs font-semibold text-brand">
            View team members →
          </p>
        </Link>
        );
      })}
    </div>
  );
}

function WinnerBanner({ winner, startedAt }: { winner: Winner; startedAt: string | null }) {
  let finishLabel = '';
  if (winner.completedAt) {
    const finished = new Date(winner.completedAt);
    finishLabel = finished.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (startedAt) {
      const ms = finished.getTime() - new Date(startedAt).getTime();
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      finishLabel += ` · finished in ${m}m ${String(s).padStart(2, '0')}s`;
    }
  }
  return (
    <div className="relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-r from-brand to-brand-light p-5 text-white shadow-lg shadow-brand/30">
      <Confetti pieces={48} />
      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-widest text-white/80">🏆 Winner</p>
        <p className="text-2xl font-extrabold">{winner.groupName}</p>
        {finishLabel && <p className="mt-0.5 text-sm text-white/90">Completed all tasks at {finishLabel}</p>}
      </div>
    </div>
  );
}
