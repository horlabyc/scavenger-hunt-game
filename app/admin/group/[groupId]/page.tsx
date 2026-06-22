'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { GameStatus } from '@/lib/types';

interface GroupDetail {
  status: GameStatus;
  groupName: string;
  leadName: string;
  roster: { name: string; isLead: boolean }[];
  tasks: {
    id: string;
    title: string;
    description: string;
    category: string;
    score: number;
    done: boolean;
    completedAt: string | null;
  }[];
  score: number;
  maxScore: number;
  percent: number;
  completedCount: number;
  totalTasks: number;
}

const POLL_MS = 10000;
const PW_KEY = 'sh.admin.pw';

/** Format a completion timestamp like "Jun 22, 3:45 PM". */
function formatCompletedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  });
}

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams<{ groupId: string }>();
  const groupId = params?.groupId;
  const [data, setData] = useState<GroupDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchDetail = useCallback(async () => {
    const pw = sessionStorage.getItem(PW_KEY);
    if (!pw) {
      router.replace('/admin');
      return;
    }
    try {
      const res = await fetch(
        `/api/admin/group?password=${encodeURIComponent(pw)}&groupId=${encodeURIComponent(groupId)}`,
        { cache: 'no-store' },
      );
      if (res.status === 401) {
        router.replace('/admin');
        return;
      }
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (res.ok) setData(await res.json());
    } catch {
      /* keep last good state */
    }
  }, [groupId, router]);

  useEffect(() => {
    if (!groupId) return;
    fetchDetail();
    const id = setInterval(fetchDetail, POLL_MS);
    return () => clearInterval(id);
  }, [groupId, fetchDetail]);

  if (notFound) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="text-slate-600">Group not found.</p>
        <Link href="/admin" className="mt-3 inline-block font-semibold text-brand">
          ← Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-6">
      <Link href="/admin" className="text-sm font-semibold text-brand hover:text-brand-dark">
        ← Back to dashboard
      </Link>

      {!data ? (
        <p className="mt-6 rounded-xl bg-white p-6 text-center text-sm text-slate-400">Loading…</p>
      ) : (
        <>
          <header className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">Retreat SB 3.0</p>
            <h1 className="text-2xl font-extrabold text-slate-900">{data.groupName}</h1>
            <p className="text-sm text-slate-500">Lead: {data.leadName}</p>
          </header>

          <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wide text-slate-500">Score</span>
              <span className="text-2xl font-extrabold text-brand-dark">
                {data.score} <span className="text-base font-bold text-slate-400">/ {data.maxScore}</span>
              </span>
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500">
                <span>
                  {data.completedCount}/{data.totalTasks} tasks done
                </span>
                <span>{data.percent}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="progress-fill h-full rounded-full bg-brand"
                  style={{ width: `${data.percent}%` }}
                />
              </div>
            </div>
          </section>

          <section className="mt-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              Team members ({data.roster.length})
            </h2>
            <ul className="flex flex-wrap gap-2">
              {data.roster.map((m) => (
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

          <section className="mt-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              Task progress
            </h2>
            <ul className="space-y-2">
              {data.tasks.map((task, i) => (
                <li
                  key={task.id}
                  className={`flex items-start gap-3 rounded-xl border p-3 ${
                    task.done ? 'border-brand bg-brand-tint' : 'border-slate-200 bg-white'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border-2 text-sm font-bold ${
                      task.done ? 'border-brand bg-brand text-white' : 'border-slate-300 text-transparent'
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
                          task.done ? 'text-brand-dark' : 'text-slate-800'
                        }`}
                      >
                        {i + 1}. {task.title}
                      </span>
                    </span>
                    <span className="block text-xs text-slate-500">{task.description}</span>
                    {task.done && task.completedAt && (
                      <span className="mt-1 block text-[11px] font-semibold text-brand-dark">
                        ✓ Done {formatCompletedAt(task.completedAt)}
                      </span>
                    )}
                  </span>
                  <span className="flex-none self-start rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                    {task.score} pts
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <p className="mt-6 text-center text-xs text-slate-400">Auto-refreshing every 10 seconds</p>
        </>
      )}
    </main>
  );
}
