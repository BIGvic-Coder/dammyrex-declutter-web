'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RequestError } from '@/lib/client';
import { formatNaira } from '@/lib/format';
import type { Category } from '@/lib/types';
import { adminApi, login, type AdminUser, type Stats } from './admin-api';
import { InspectionsPanel } from './InspectionsPanel';
import { ItemsPanel } from './ItemsPanel';
import { Btn, Notice } from './ui';

const STORAGE_KEY = 'dammyrex-admin';
type Session = { token: string; admin: AdminUser };
type Tab = 'dashboard' | 'review' | 'items' | 'inspections';

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    // Drop tokens that have already expired (JWT exp is in seconds)
    const exp = JSON.parse(atob(s.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp as number;
    return exp * 1000 > Date.now() ? s : null;
  } catch {
    return null;
  }
}

export function AdminApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [expiredNote, setExpiredNote] = useState('');

  useEffect(() => {
    setSession(readSession());
    setReady(true);
  }, []);

  const logout = useCallback((note = '') => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setSession(null);
    setExpiredNote(note);
  }, []);

  if (!ready) return <p className="p-6 text-sm text-gray-500">Loading…</p>;
  if (!session)
    return (
      <LoginForm
        note={expiredNote}
        onLogin={(s) => {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
          } catch {}
          setExpiredNote('');
          setSession(s);
        }}
      />
    );
  return <Dashboard session={session} onLogout={logout} />;
}

function LoginForm({ onLogin, note }: { onLogin: (s: Session) => void; note: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return setError('Enter your email and password.');
    setBusy(true);
    setError('');
    try {
      onLogin(await login(email.trim(), password));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const input = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20';
  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Admin login</h1>
      <p className="mt-1 text-sm text-gray-600">DammyRex Declutter dashboard</p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        {note && <Notice kind="info">{note}</Notice>}
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-gray-800">Email</span>
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-gray-800">Password</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
        </label>
        {error && <Notice kind="error">{error}</Notice>}
        <button type="submit" disabled={busy} className="w-full rounded-xl bg-brand-700 py-3 font-bold text-white hover:bg-brand-800 disabled:opacity-70">
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}

function Dashboard({ session, onLogout }: { session: Session; onLogout: (note?: string) => void }) {
  const api = useMemo(() => adminApi(session.token), [session.token]);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsError, setStatsError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  /** Returns true if the error was an expired session (and logs out). */
  const onAuthError = useCallback(
    (e: unknown) => {
      if (e instanceof RequestError && e.status === 401) {
        onLogout('Your session expired. Please log in again.');
        return true;
      }
      return false;
    },
    [onLogout],
  );

  const loadStats = useCallback(async () => {
    try {
      setStats(await api.stats());
      setStatsError('');
    } catch (e) {
      if (!onAuthError(e)) setStatsError((e as Error).message);
    }
  }, [api, onAuthError]);

  useEffect(() => {
    loadStats();
    api.categories().then(setCategories).catch(() => {});
  }, [api, loadStats]);

  const pending = stats?.items.PENDING ?? 0;
  const requested = stats?.inspections.REQUESTED ?? 0;
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'review', label: 'Review', count: pending },
    { id: 'items', label: 'Items' },
    { id: 'inspections', label: 'Inspections', count: requested },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Admin</h1>
          <p className="text-xs text-gray-500">Signed in as {session.admin.name}</p>
        </div>
        <Btn variant="ghost" onClick={() => onLogout()}>Log out</Btn>
      </div>

      <nav className="no-scrollbar -mx-4 mt-4 flex gap-1 overflow-x-auto border-b border-black/10 px-4" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold ${tab === t.id ? 'border-brand-700 text-brand-800' : 'border-transparent text-gray-600'}`}
          >
            {t.label}
            {!!t.count && <span className="rounded-full bg-red-600 px-1.5 text-xs text-white">{t.count}</span>}
          </button>
        ))}
      </nav>

      <div className="mt-4">
        {tab === 'dashboard' && (
          <>
            {statsError && <Notice kind="error">{statsError}</Notice>}
            {!stats && !statsError && <p className="text-sm text-gray-500">Loading…</p>}
            {stats && <StatsGrid stats={stats} go={setTab} />}
          </>
        )}
        {tab === 'review' && <ItemsPanel key="review" mode="review" api={api} categories={categories} onChanged={loadStats} onAuthError={onAuthError} />}
        {tab === 'items' && <ItemsPanel key="all" mode="all" api={api} categories={categories} onChanged={loadStats} onAuthError={onAuthError} />}
        {tab === 'inspections' && <InspectionsPanel api={api} onChanged={loadStats} onAuthError={onAuthError} />}
      </div>
    </div>
  );
}

function StatsGrid({ stats, go }: { stats: Stats; go: (t: Tab) => void }) {
  const cards: { label: string; value: string | number; sub?: string; tab?: Tab; alert?: boolean }[] = [
    { label: 'Waiting for review', value: stats.items.PENDING, tab: 'review', alert: stats.items.PENDING > 0 },
    { label: 'Inspection requests', value: stats.inspections.REQUESTED, tab: 'inspections', alert: stats.inspections.REQUESTED > 0 },
    { label: 'Live items', value: stats.items.AVAILABLE, sub: `${stats.featuredLive} featured`, tab: 'items' },
    { label: 'Reserved', value: stats.items.RESERVED, tab: 'items' },
    { label: 'Sold (30 days)', value: stats.soldLast30Days.count, sub: formatNaira(stats.soldLast30Days.value) },
    { label: 'Viewings next 7 days', value: stats.upcomingConfirmedInspections7Days, tab: 'inspections' },
    { label: 'Sellers', value: stats.sellers },
    { label: 'Rejected', value: stats.items.REJECTED },
  ];
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => {
        const inner = (
          <>
            <span className="text-xs font-medium text-gray-600">{c.label}</span>
            <span className={`mt-1 block text-2xl font-extrabold tabular-nums ${c.alert ? 'text-red-700' : 'text-gray-900'}`}>{c.value}</span>
            {c.sub && <span className="text-xs text-gray-500">{c.sub}</span>}
          </>
        );
        const cls = `block h-full w-full rounded-xl bg-white p-3 text-left shadow-sm ring-1 ${c.alert ? 'ring-red-200' : 'ring-black/5'}`;
        return (
          <li key={c.label}>
            {c.tab ? (
              <button type="button" onClick={() => go(c.tab!)} className={`${cls} hover:ring-brand-600/40`}>{inner}</button>
            ) : (
              <div className={cls}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
