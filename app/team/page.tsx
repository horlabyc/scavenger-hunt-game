'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Confetti from '@/components/confetti';
import { GAME_DURATION_MS } from '@/lib/config';
import { clearSession, loadSession, type Session } from '@/lib/session';
import type { GameStatus } from '@/lib/types';

interface StateResponse {
  status: GameStatus;
  startedAt: string | null;
  completedTaskIds: string[];
  completedAtById: Record<string, string>;
  score: number;
  maxScore: number;
  percent: number;
  completedCount: number;
  totalTasks: number;
}

interface LeaderboardEntry {
  groupId: string;
  groupName: string;
  score: number;
  percent: number;
  completedCount: number;
  totalTasks: number;
}

interface LeaderboardResponse {
  maxScore: number;
  winnerGroupId: string | null;
  groups: LeaderboardEntry[];
}

const POLL_MS = 5000;

/** Format a completion timestamp like "Jun 22, 3:45 PM". */
function formatCompletedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function TeamPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<StateResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [busyTask, setBusyTask] = useState<string | null>(null);
  const [error, setError] = useState('');
  const codeRef = useRef<string>('');

  // Load session (client-only) or bounce to login.
  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace('/');
      return;
    }
    setSession(s);
    codeRef.current = s.code;
  }, [router]);

  const fetchState = useCallback(async () => {
    if (!codeRef.current) return;
    try {
      const res = await fetch(`/api/state?code=${encodeURIComponent(codeRef.current)}`, {
        cache: 'no-store',
      });
      if (res.status === 401) {
        clearSession();
        router.replace('/');
        return;
      }
      if (res.ok) setState(await res.json());
    } catch {
      /* keep last good state on transient errors */
    }
  }, [router]);

  const fetchLeaderboard = useCallback(async () => {
    if (!codeRef.current) return;
    try {
      const res = await fetch(`/api/leaderboard?code=${encodeURIComponent(codeRef.current)}`, {
        cache: 'no-store',
      });
      if (res.ok) setLeaderboard(await res.json());
    } catch {
      /* keep last good leaderboard on transient errors */
    }
  }, []);

  // Poll game state + leaderboard.
  useEffect(() => {
    if (!session) return;
    fetchState();
    fetchLeaderboard();
    const id = setInterval(() => {
      fetchState();
      fetchLeaderboard();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [session, fetchState, fetchLeaderboard]);

  async function toggle(taskId: string, done: boolean) {
    if (!session) return;
    setBusyTask(taskId);
    setError('');
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: session.code, taskId, done }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Could not update the task.');
        fetchState();
        return;
      }
      setState((prev) => (prev ? { ...prev, ...data } : prev));
      fetchLeaderboard();
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusyTask(null);
    }
  }

  function leave() {
    clearSession();
    router.replace('/');
  }

  if (!session) return null;

  const status = state?.status ?? 'not_started';
  const completed = new Set(state?.completedTaskIds ?? []);
  const completedAtById = state?.completedAtById ?? {};
  const canMark = session.isLead && status === 'running';

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 pb-28 pt-6">
      <Header session={session} onLeave={leave} />
      <StatusBanner status={status} startedAt={state?.startedAt ?? null} />

      <Roster session={session} />

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Tasks</h2>
          {!session.isLead && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              View only
            </span>
          )}
        </div>

        {status === 'not_started' && (
          <EmptyHint text="Tasks will appear here as soon as the organizer starts the game." />
        )}

        {status !== 'not_started' && (
          <ul className="space-y-2">
            {session.tasks.map((task, i) => {
              const isDone = completed.has(task.id);
              const doneAt = completedAtById[task.id];
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    disabled={!canMark || busyTask === task.id}
                    onClick={() => toggle(task.id, !isDone)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                      isDone
                        ? 'border-brand bg-brand-tint'
                        : 'border-slate-200 bg-white hover:border-brand/40'
                    } ${!canMark ? 'cursor-default' : ''} disabled:opacity-60`}
                  >
                    <span
                      className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border-2 text-sm font-bold ${
                        isDone
                          ? 'border-brand bg-brand text-white'
                          : 'border-slate-300 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="mb-1 flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            task.category === 'FIND'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-brand-tint text-brand-dark'
                          }`}
                        >
                          {task.category}
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            isDone ? 'text-brand-dark line-through' : 'text-slate-800'
                          }`}
                        >
                          {i + 1}. {task.title}
                        </span>
                      </span>
                      <span className="block text-xs text-slate-500">{task.description}</span>
                      {isDone && doneAt && (
                        <span className="mt-1 block text-[11px] font-semibold text-brand-dark">
                          ✓ Done {formatCompletedAt(doneAt)}
                        </span>
                      )}
                    </span>
                    <span className="flex-none self-start rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      {task.score} pts
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      </section>

      <Leaderboard leaderboard={leaderboard} myGroupId={session.groupId} />

      <ProgressBar state={state} />
      {status === 'stopped' && <StoppedOverlay state={state} />}
    </main>
  );
}

function Leaderboard({
  leaderboard,
  myGroupId,
}: {
  leaderboard: LeaderboardResponse | null;
  myGroupId: string;
}) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-bold text-slate-800">🏆 Leaderboard</h2>
      </div>
      {!leaderboard ? (
        <p className="rounded-xl bg-white p-4 text-center text-sm text-slate-400">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {leaderboard.groups.map((g, i) => {
            const isMine = g.groupId === myGroupId;
            const isWinner = g.groupId === leaderboard.winnerGroupId;
            return (
              <li
                key={g.groupId}
                className={`relative flex items-center gap-3 overflow-hidden rounded-xl border p-3 ${
                  isWinner
                    ? 'border-brand bg-gradient-to-r from-brand-tint to-amber-50 ring-2 ring-brand/40'
                    : isMine
                      ? 'border-brand bg-brand-tint'
                      : 'border-slate-200 bg-white'
                }`}
              >
                {isWinner && <Confetti />}
                <span
                  className={`relative flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm font-extrabold ${
                    isWinner || i === 0 ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isWinner ? '👑' : i + 1}
                </span>
                <div className="relative min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {g.groupName}
                    {isWinner && (
                      <span className="ml-1.5 text-xs font-bold text-brand">WINNER!</span>
                    )}
                    {!isWinner && isMine && (
                      <span className="ml-1.5 text-xs font-semibold text-brand">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {g.completedCount}/{g.totalTasks} tasks · {g.percent}%
                  </p>
                </div>
                <div className="relative flex-none text-right">
                  <p className="text-lg font-extrabold text-brand-dark">{g.score}</p>
                  <p className="text-xs text-slate-400">/ {leaderboard.maxScore} pts</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Header({ session, onLeave }: { session: Session; onLeave: () => void }) {
  return (
    <header className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">{session.groupName}</p>
        <h1 className="text-xl font-extrabold text-slate-900">Hi, {session.you} 👋</h1>
        <span
          className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
            session.isLead ? 'bg-brand text-white' : 'bg-slate-200 text-slate-600'
          }`}
        >
          {session.isLead ? '★ Team Lead' : 'Member'}
        </span>
      </div>
      <button onClick={onLeave} className="text-xs font-semibold text-slate-400 hover:text-slate-600">
        Sign out
      </button>
    </header>
  );
}

function StatusBanner({ status, startedAt }: { status: GameStatus; startedAt: string | null }) {
  if (status === 'running') {
    return (
      <div className="mt-4 flex items-center justify-between rounded-xl bg-green-50 px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-bold text-green-700">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" /> Game in progress
        </span>
        <Countdown startedAt={startedAt} />
      </div>
    );
  }
  if (status === 'stopped') {
    return (
      <div className="mt-4 rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white">
        🏁 The game has ended.
      </div>
    );
  }
  return (
    <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
      ⏳ Waiting for the organizer to start the game…
    </div>
  );
}

function Countdown({ startedAt }: { startedAt: string | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!startedAt) return null;
  const end = new Date(startedAt).getTime() + GAME_DURATION_MS;
  const left = Math.max(0, end - now);
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return (
    <span className="font-mono text-sm font-bold text-green-700">
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

function Roster({ session }: { session: Session }) {
  return (
    <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
        Your team ({session.roster.length})
      </h2>
      <ul className="flex flex-wrap gap-2">
        {session.roster.map((m) => (
          <li
            key={m.name}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
              m.isLead ? 'bg-brand-tint text-brand-dark' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {m.isLead && <span>★</span>}
            {m.name}
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-8 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function ProgressBar({ state }: { state: StateResponse | null }) {
  const percent = state?.percent ?? 0;
  const score = state?.score ?? 0;
  const maxScore = state?.maxScore ?? 0;
  const completedCount = state?.completedCount ?? 0;
  const totalTasks = state?.totalTasks ?? 0;
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto max-w-lg">
        <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
          <span className="text-slate-600">
            {completedCount}/{totalTasks} done · {percent}%
          </span>
          <span className="text-brand-dark">
            {score} / {maxScore} pts
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="progress-fill h-full rounded-full bg-brand"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function StoppedOverlay({ state }: { state: StateResponse | null }) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/70 p-6 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-2xl">
        <div className="text-5xl">🏁</div>
        <h2 className="mt-3 text-xl font-extrabold text-slate-900">Game Over</h2>
        <p className="mt-1 text-sm text-slate-600">
          The organizer has ended the hunt. Thanks for playing!
        </p>
        {state && (
          <div className="mt-4 rounded-xl bg-brand-tint p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">Final score</p>
            <p className="text-3xl font-extrabold text-brand-dark">
              {state.score} <span className="text-base font-bold text-slate-400">/ {state.maxScore}</span>
            </p>
            <p className="text-xs text-slate-500">
              {state.completedCount}/{state.totalTasks} tasks completed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
