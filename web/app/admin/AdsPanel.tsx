'use client';

import { useCallback, useEffect, useState } from 'react';
import { Field, inputClass } from '@/components/form';
import { ADSENSE_CLIENT } from '@/lib/adsense';
import { compressImage, isValidNgPhone, normalizeNgPhone } from '@/lib/client';
import type { AdPlacement } from '@/lib/types';
import type { AdminAd, AdminApi } from './admin-api';
import { useToast } from './toast';
import { Btn, Empty, Notice, Thumb, TZ } from './ui';

export const PLACEMENTS: Record<AdPlacement, { label: string; where: string; size: string }> = {
  HOME_BANNER: { label: 'Homepage banner', where: 'Below the big banner at the top of the homepage', size: 'Desktop 1200 × 300 · Phone 600 × 300' },
  LISTING_CARD: { label: 'Listings card', where: 'A “Sponsored” card after every 8 items on Browse and search results', size: 'One image, 800 × 600 (4:3)' },
  ITEM_PAGE: { label: 'Item page banner', where: 'Below the item details on every item page', size: 'Desktop 1200 × 300 · Phone 600 × 300' },
};

type AdState = 'RUNNING' | 'SCHEDULED' | 'ENDED' | 'PAUSED';
const STATE_STYLE: Record<AdState, string> = {
  RUNNING: 'bg-brand-100 text-brand-900',
  SCHEDULED: 'bg-sky-100 text-sky-900',
  ENDED: 'bg-gray-200 text-gray-700',
  PAUSED: 'bg-amber-100 text-amber-900',
};

export function adState(ad: AdminAd, now = Date.now()): AdState {
  if (new Date(ad.endsAt).getTime() < now) return 'ENDED';
  if (ad.paused) return 'PAUSED';
  if (new Date(ad.startsAt).getTime() > now) return 'SCHEDULED';
  return 'RUNNING';
}

/** ISO -> YYYY-MM-DD in Lagos time (for <input type="date">). */
const lagosDay = (iso: string | Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso));
const fmtDay = (iso: string) => new Intl.DateTimeFormat('en-NG', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
const ctr = (ad: AdminAd) => (ad.impressions ? `${((ad.clicks / ad.impressions) * 100).toFixed(1)}%` : '–');

export function AdsPanel({ api, onAuthError }: { api: AdminApi; onAuthError: (e: unknown) => boolean }) {
  const toast = useToast();
  const [ads, setAds] = useState<AdminAd[] | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<AdminAd | 'new' | null>(null);
  const [adsense, setAdsense] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    try {
      setError('');
      const [list, settings] = await Promise.all([api.ads(), api.settings()]);
      setAds(list);
      setAdsense(settings.adsenseEnabled);
    } catch (e) {
      if (!onAuthError(e)) setError((e as Error).message);
    }
  }, [api, onAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(fn: () => Promise<unknown>, done: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    try {
      await fn();
      toast(done);
      load();
    } catch (e) {
      if (!onAuthError(e)) toast((e as Error).message, 'error');
    }
  }

  if (editing) {
    return (
      <AdForm
        api={api}
        ad={editing === 'new' ? null : editing}
        onAuthError={onAuthError}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          toast('Ad saved');
          setEditing(null);
          load();
        }}
      />
    );
  }

  const totals = (ads ?? []).reduce((t, a) => ({ i: t.i + a.impressions, c: t.c + a.clicks }), { i: 0, c: 0 });
  const running = (ads ?? []).filter((a) => adState(a) === 'RUNNING').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-600">
          {running} running · {totals.i.toLocaleString()} views · {totals.c.toLocaleString()} clicks
        </p>
        <Btn variant="primary" onClick={() => setEditing('new')}>+ New ad</Btn>
      </div>

      {error && <Notice kind="error">{error}</Notice>}
      {!ads && !error && <p className="text-sm text-gray-500">Loading…</p>}
      {ads && ads.length === 0 && <Empty>No ads yet. Tap “+ New ad” to book your first advertiser.</Empty>}

      {ads && ads.length > 0 && (
        <ul className="space-y-3">
          {ads.map((ad) => {
            const state = adState(ad);
            return (
              <li key={ad.id} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5 sm:p-4">
                <div className="flex gap-3">
                  <Thumb url={ad.imageMobile ?? ad.imageDesktop} alt={ad.advertiser} size={72} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${STATE_STYLE[state]}`}>{state}</span>
                      <span className="text-xs font-medium text-gray-500">{PLACEMENTS[ad.placement].label}</span>
                    </div>
                    <p className="mt-1 font-semibold text-gray-900">{ad.advertiser}</p>
                    {ad.headline && <p className="truncate text-sm text-gray-600">{ad.headline}</p>}
                    <p className="text-xs text-gray-500">
                      {fmtDay(ad.startsAt)} → {fmtDay(ad.endsAt)}
                    </p>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-black/5 text-center text-sm">
                  {[
                    ['Views', ad.impressions.toLocaleString()],
                    ['Clicks', ad.clicks.toLocaleString()],
                    ['Click rate', ctr(ad)],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-gray-50 p-2">
                      <dt className="text-xs text-gray-500">{k}</dt>
                      <dd className="font-bold tabular-nums text-gray-900">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-3 flex flex-wrap gap-2">
                  {state !== 'ENDED' && (
                    <Btn onClick={() => act(() => api.setAdPaused(ad.id, !ad.paused), ad.paused ? 'Ad resumed' : 'Ad paused')}>
                      {ad.paused ? '▶ Resume' : '❚❚ Pause'}
                    </Btn>
                  )}
                  <Btn variant="ghost" onClick={() => setEditing(ad)}>Edit</Btn>
                  <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-brand-800 underline">
                    Test link
                  </a>
                  <Btn variant="danger" onClick={() => act(() => api.deleteAd(ad.id), 'Ad deleted', `Delete the ad for "${ad.advertiser}"? Its view and click counts are deleted too.`)}>
                    Delete
                  </Btn>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Google AdSense switch */}
      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">Google AdSense</h3>
            <p className="mt-0.5 text-sm text-gray-600">
              When on, Google ads fill any ad spot that has no ad of your own running. Your own ads always come first.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={!!adsense}
            aria-label="Google AdSense"
            disabled={adsense === null}
            onClick={() => act(() => api.updateSettings({ adsenseEnabled: !adsense }), adsense ? 'AdSense turned off' : 'AdSense turned on')}
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors ${adsense ? 'bg-brand-700' : 'bg-gray-300'} disabled:opacity-50`}
          >
            <span className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${adsense ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>
        {!ADSENSE_CLIENT && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            AdSense isn&apos;t connected yet, so nothing from Google will show even when this is on. Once Google approves the
            site, add <code>NEXT_PUBLIC_ADSENSE_CLIENT</code> and the slot IDs in Vercel (see README).
          </p>
        )}
      </section>
    </div>
  );
}

type LinkMode = 'web' | 'whatsapp';

function parseWa(url: string): { phone: string; text: string } | null {
  const m = url.match(/^https:\/\/wa\.me\/(\d+)(?:\?text=(.*))?$/);
  if (!m) return null;
  let text = '';
  try {
    text = m[2] ? decodeURIComponent(m[2]) : '';
  } catch {}
  return { phone: m[1].startsWith('234') ? `0${m[1].slice(3)}` : m[1], text };
}

function AdForm({
  api,
  ad,
  onSaved,
  onCancel,
  onAuthError,
}: {
  api: AdminApi;
  ad: AdminAd | null;
  onSaved: () => void;
  onCancel: () => void;
  onAuthError: (e: unknown) => boolean;
}) {
  const wa = ad ? parseWa(ad.linkUrl) : null;
  const today = lagosDay(new Date());
  const in30 = lagosDay(new Date(Date.now() + 30 * 86400_000));
  const [v, setV] = useState({
    advertiser: ad?.advertiser ?? '',
    headline: ad?.headline ?? '',
    placement: (ad?.placement ?? 'HOME_BANNER') as AdPlacement,
    mode: (wa ? 'whatsapp' : 'web') as LinkMode,
    url: ad && !wa ? ad.linkUrl : 'https://',
    waPhone: wa?.phone ?? '',
    waText: wa?.text ?? 'Hi, I saw your ad on DammyRex Declutter.',
    start: ad ? lagosDay(ad.startsAt) : today,
    end: ad ? lagosDay(ad.endsAt) : in30,
    paused: ad?.paused ?? false,
  });
  const [desktop, setDesktop] = useState<File | null>(null);
  const [mobile, setMobile] = useState<File | null>(null);
  const [removeMobile, setRemoveMobile] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((o) => ({ ...o, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const isCard = v.placement === 'LISTING_CARD';

  function linkUrl(): string | null {
    if (v.mode === 'whatsapp') {
      if (!isValidNgPhone(v.waPhone)) return null;
      const t = v.waText.trim();
      return `https://wa.me/${normalizeNgPhone(v.waPhone)}${t ? `?text=${encodeURIComponent(t)}` : ''}`;
    }
    try {
      const u = new URL(v.url.trim());
      return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
    } catch {
      return null;
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const link = linkUrl();
    if (v.advertiser.trim().length < 2) return setError("Enter the advertiser's name.");
    if (!link) return setError(v.mode === 'whatsapp' ? 'Enter a valid Nigerian WhatsApp number.' : 'Enter a full web address starting with https://');
    if (!v.start || !v.end) return setError('Choose a start and end date.');
    if (v.end < v.start) return setError('The end date must be on or after the start date.');
    if (!ad && !desktop) return setError('Add a banner image.');

    const fd = new FormData();
    fd.append('advertiser', v.advertiser.trim());
    fd.append('headline', v.headline.trim());
    fd.append('placement', v.placement);
    fd.append('linkUrl', link);
    // Whole days in Lagos time: from the start of the first day to the end of the last
    fd.append('startsAt', `${v.start}T00:00:00+01:00`);
    fd.append('endsAt', `${v.end}T23:59:59+01:00`);
    fd.append('paused', String(v.paused));
    if (desktop) {
      const f = await compressImage(desktop, 1600, 0.85);
      fd.append('imageDesktop', f, f.name);
    }
    if (mobile && !isCard) {
      const f = await compressImage(mobile, 1000, 0.85);
      fd.append('imageMobile', f, f.name);
    }
    if (ad && removeMobile && !mobile) fd.append('removeMobileImage', 'true');

    setProgress(0);
    try {
      if (ad) await api.updateAd(ad.id, fd, setProgress);
      else await api.createAd(fd, setProgress);
      onSaved();
    } catch (err) {
      if (!onAuthError(err)) setError((err as Error).message);
    } finally {
      setProgress(null);
    }
  }

  const busy = progress !== null;
  return (
    <form onSubmit={save} noValidate className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">{ad ? 'Edit ad' : 'New ad'}</h2>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>

      <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <Field id="ad-advertiser" label="Advertiser name">
          <input id="ad-advertiser" value={v.advertiser} onChange={set('advertiser')} maxLength={80} className={inputClass} />
        </Field>
        <Field id="ad-headline" label="Short text (optional)" hint="Shown on the listings card and read out by screen readers">
          <input id="ad-headline" value={v.headline} onChange={set('headline')} maxLength={120} className={inputClass} />
        </Field>
        <Field id="ad-placement" label="Where it shows" hint={`${PLACEMENTS[v.placement].where}. Best size: ${PLACEMENTS[v.placement].size}.`}>
          <select id="ad-placement" value={v.placement} onChange={set('placement')} className={inputClass}>
            {(Object.keys(PLACEMENTS) as AdPlacement[]).map((p) => (
              <option key={p} value={p}>{PLACEMENTS[p].label}</option>
            ))}
          </select>
        </Field>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <p className="text-sm font-semibold text-gray-800">Images</p>
        <ImageInput
          id="ad-desktop"
          label={isCard ? 'Card image' : 'Desktop banner (wide)'}
          current={ad?.imageDesktop}
          file={desktop}
          onFile={setDesktop}
        />
        {!isCard && (
          <ImageInput
            id="ad-mobile"
            label="Phone banner (optional)"
            hint="Without it, the desktop banner is used on phones too."
            current={removeMobile ? undefined : ad?.imageMobile ?? undefined}
            file={mobile}
            onFile={(f) => {
              setMobile(f);
              if (f) setRemoveMobile(false);
            }}
            onRemove={ad?.imageMobile ? () => setRemoveMobile(true) : undefined}
          />
        )}
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <p className="text-sm font-semibold text-gray-800">When someone taps the ad</p>
        <div className="grid grid-cols-2 gap-2">
          {(['web', 'whatsapp'] as LinkMode[]).map((m) => (
            <label key={m} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold ring-1 ${v.mode === m ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-gray-800 ring-gray-300'}`}>
              <input type="radio" name="ad-mode" value={m} checked={v.mode === m} onChange={set('mode')} className="sr-only" />
              {m === 'web' ? 'Open a website' : 'Open WhatsApp'}
            </label>
          ))}
        </div>
        {v.mode === 'web' ? (
          <Field id="ad-url" label="Website address">
            <input id="ad-url" type="url" inputMode="url" value={v.url} onChange={set('url')} className={inputClass} />
          </Field>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="ad-wa" label="Advertiser's WhatsApp number">
              <input id="ad-wa" type="tel" inputMode="tel" placeholder="080…" value={v.waPhone} onChange={set('waPhone')} className={inputClass} />
            </Field>
            <Field id="ad-wa-text" label="Pre-filled message">
              <input id="ad-wa-text" value={v.waText} onChange={set('waText')} maxLength={200} className={inputClass} />
            </Field>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="grid grid-cols-2 gap-3">
          <Field id="ad-start" label="Start date">
            <input id="ad-start" type="date" value={v.start} onChange={set('start')} className={inputClass} />
          </Field>
          <Field id="ad-end" label="End date" hint="Stops after this day">
            <input id="ad-end" type="date" value={v.end} min={v.start} onChange={set('end')} className={inputClass} />
          </Field>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-gray-800">
          <input type="checkbox" checked={v.paused} onChange={set('paused')} className="h-5 w-5 accent-brand-700" />
          Paused (don&apos;t show it yet)
        </label>
      </section>

      {error && <Notice kind="error">{error}</Notice>}
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-brand-700 px-5 py-3.5 text-base font-bold text-white hover:bg-brand-800 disabled:opacity-70">
        {busy ? (progress! < 1 ? `Uploading… ${Math.round(progress! * 100)}%` : 'Saving…') : ad ? 'Save changes' : 'Create ad'}
      </button>
    </form>
  );
}

function ImageInput({
  id,
  label,
  hint,
  current,
  file,
  onFile,
  onRemove,
}: {
  id: string;
  label: string;
  hint?: string;
  current?: string;
  file: File | null;
  onFile: (f: File | null) => void;
  onRemove?: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const shown = preview ?? current;
  return (
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="" className="h-20 max-w-[16rem] rounded-lg bg-gray-100 object-contain ring-1 ring-black/5" />
        ) : (
          <div className="grid h-20 w-32 place-items-center rounded-lg border-2 border-dashed border-gray-300 text-xs text-gray-400">No image</div>
        )}
        <label htmlFor={id} className="inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-white px-3 text-sm font-semibold text-gray-800 ring-1 ring-gray-300 hover:bg-gray-50">
          {shown ? 'Replace' : 'Choose image'}
        </label>
        <input id={id} type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
        {(file || (current && onRemove)) && (
          <button
            type="button"
            className="min-h-11 text-sm font-semibold text-red-700"
            onClick={() => {
              onFile(null);
              onRemove?.();
            }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
