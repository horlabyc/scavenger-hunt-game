'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveSession } from '@/lib/session';

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Something went wrong. Please try again.');
        return;
      }
      saveSession({ code: code.trim(), ...data });
      router.push('/team');
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-3xl shadow-lg shadow-brand/30">
            🧭
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-dark">Retreat SB 3.0</h1>
          <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-brand">
            Scavenger Hunt
          </p>
          <p className="mt-2 text-sm text-slate-600">Enter your personal code to join your team.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-xl shadow-slate-200/60"
        >
          <label htmlFor="code" className="mb-2 block text-sm font-semibold text-slate-700">
            Your code
          </label>
          <input
            id="code"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. TEAM-101"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-lg font-semibold uppercase tracking-wider outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          />

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="mt-5 w-full rounded-xl bg-brand py-3 text-base font-bold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Checking…' : 'Join the hunt'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Organizer? Go to{' '}
          <Link href="/admin" className="font-semibold text-slate-500 underline hover:text-brand">
            /admin
          </Link>
        </p>
      </div>
    </main>
  );
}
