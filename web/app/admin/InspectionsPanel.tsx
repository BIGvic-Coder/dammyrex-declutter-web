'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { formatNaira } from '@/lib/format';
import type { AdminApi, AdminInspection, InspectionPage, InspectionStatus } from './admin-api';
import { Btn, Empty, fmtDateTime, LinkBtn, Notice, Pager, prettyPhone, Thumb, TZ, waLink } from './ui';

const TABS: { value: InspectionStatus | ''; label: string }[] = [
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'DONE', label: 'Done' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: '', label: 'All' },
];

const STATUS_STYLE: Record<InspectionStatus, string> = {
  REQUESTED: 'bg-sky-100 text-sky-900',
  CONFIRMED: 'bg-brand-100 text-brand-900',
  DONE: 'bg-gray-200 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export function InspectionsPanel({
  api,
  onChanged,
  onAuthError,
}: {
  api: AdminApi;
  onChanged: () => void;
  onAuthError: (e: unknown) => boolean;
}) {
  const [status, setStatus] = useState<InspectionStatus | ''>('REQUESTED');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<InspectionPage | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Only the most recent request may update the list (older ones can finish later on slow networks).
  const latest = useRef(0);
  const load = useCallback(async () => {
    const req = ++latest.current;
    setLoading(true);
    setError('');
    try {
      const result = await api.inspections({ status: status || undefined, page });
      if (req === latest.current) setData(result);
    } catch (e) {
      if (req === latest.current && !onAuthError(e)) setError((e as Error).message);
    } finally {
      if (req === latest.current) setLoading(false);
    }
  }, [api, status, page, onAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto" role="tablist" aria-label="Inspection status">
        {TABS.map((t) => (
          <button
            key={t.label}
            role="tab"
            aria-selected={status === t.value}
            onClick={() => {
              setPage(1);
              setStatus(t.value);
            }}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ${status === t.value ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-gray-700 ring-gray-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {error && <Notice kind="error">{error}</Notice>}
      {loading && !data && <p className="text-sm text-gray-500">Loading…</p>}
      {data && (
        <>
          <p className="mb-2 text-sm text-gray-600">
            {data.total} inspection{data.total === 1 ? '' : 's'}
            {loading ? ' · refreshing…' : ''}
          </p>
          {data.inspections.length === 0 ? (
            <Empty>No inspections here.</Empty>
          ) : (
            <ul className="space-y-3">
              {data.inspections.map((i) => (
                <li key={i.id}>
                  <InspectionCard insp={i} api={api} onAuthError={onAuthError} onDone={() => { load(); onChanged(); }} />
                </li>
              ))}
            </ul>
          )}
          <Pager page={data.page} totalPages={data.totalPages} onPage={setPage} />
        </>
      )}
    </div>
  );
}

function InspectionCard({
  insp,
  api,
  onDone,
  onAuthError,
}: {
  insp: AdminInspection;
  api: AdminApi;
  onDone: () => void;
  onAuthError: (e: unknown) => boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const when = fmtDateTime(insp.slotAt);
  const past = new Date(insp.slotAt).getTime() < Date.now();
  const { item } = insp;

  async function update(patch: Parameters<AdminApi['updateInspection']>[1], confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setError('');
    try {
      await api.updateInspection(insp.id, patch);
      setRescheduling(false);
      onDone();
    } catch (e) {
      if (!onAuthError(e)) setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const buyerConfirmMsg =
    `Hi ${insp.buyerName}, your inspection of "${item.title}" (${formatNaira(item.price)}) is confirmed for ${when}.\n` +
    `Address: ${item.addressPrivate}\n` +
    `Please inspect properly and pay only if you are satisfied. – DammyRex Declutter`;
  const buyerReplyMsg = `Hi ${insp.buyerName}, this is DammyRex Declutter about your request to inspect "${item.title}" on ${when}.`;
  const sellerMsg = `Hi ${item.seller.name}, a buyer (${insp.buyerName}) is coming to inspect your "${item.title}" on ${when}. Please make sure it's available to test. – DammyRex Declutter`;

  return (
    <article className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`text-base font-bold ${past && insp.status !== 'DONE' && insp.status !== 'CANCELLED' ? 'text-red-700' : 'text-gray-900'}`}>
            {when}
            {past && (insp.status === 'REQUESTED' || insp.status === 'CONFIRMED') && <span className="ml-1 text-xs font-semibold">(past)</span>}
          </p>
          <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-bold uppercase ${STATUS_STYLE[insp.status]}`}>{insp.status}</span>
        </div>
      </div>

      <a href={`/items/${item.id}`} target="_blank" rel="noopener noreferrer" className="mt-3 flex gap-3 rounded-lg bg-gray-50 p-2 hover:bg-gray-100">
        <Thumb url={item.images[0]?.url} alt={item.title} size={56} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">{item.title}</p>
          <p className="text-sm text-gray-600">{formatNaira(item.price)} · {item.area}</p>
          <StatusBadge status={item.status} className="mt-0.5" />
        </div>
      </a>

      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-gray-500">Buyer</dt>
          <dd className="font-medium">{insp.buyerName} · {prettyPhone(insp.buyerPhone)}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Seller</dt>
          <dd className="font-medium">{item.seller.name} · {prettyPhone(item.seller.phone)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-gray-500">Pickup address (private)</dt>
          <dd>{item.addressPrivate}</dd>
        </div>
        {insp.note && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-gray-500">Note</dt>
            <dd className="whitespace-pre-line">{insp.note}</dd>
          </div>
        )}
      </dl>

      <div className="mt-3 flex flex-wrap gap-2">
        <LinkBtn variant="whatsapp" href={waLink(insp.buyerPhone, insp.status === 'CONFIRMED' ? buyerConfirmMsg : buyerReplyMsg)}>
          {insp.status === 'CONFIRMED' ? 'Send buyer address' : 'WhatsApp buyer'}
        </LinkBtn>
        <LinkBtn href={waLink(item.seller.phone, sellerMsg)}>WhatsApp seller</LinkBtn>
        <LinkBtn href={`tel:+${insp.buyerPhone}`}>Call buyer</LinkBtn>
      </div>

      {error && <div className="mt-3"><Notice kind="error">{error}</Notice></div>}
      {busy && <p className="mt-3 text-sm text-gray-500" role="status">Working… this can take a few seconds on slow data.</p>}

      {(insp.status === 'REQUESTED' || insp.status === 'CONFIRMED') && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-black/5 pt-3">
          {insp.status === 'REQUESTED' && (
            <Btn variant="primary" disabled={busy} onClick={() => update({ status: 'CONFIRMED' })}>
              Confirm (reserves item)
            </Btn>
          )}
          {insp.status === 'CONFIRMED' && (
            <Btn variant="primary" disabled={busy} onClick={() => update({ status: 'DONE' })}>
              Mark done
            </Btn>
          )}
          <Btn variant="danger" disabled={busy} onClick={() => update({ status: 'CANCELLED' }, `Cancel ${insp.buyerName}'s inspection?${insp.status === 'CONFIRMED' ? ' The item will go back to Available if no one else is booked.' : ''}`)}>
            Cancel
          </Btn>
          <Btn variant="ghost" onClick={() => setRescheduling((v) => !v)}>Reschedule</Btn>
        </div>
      )}

      {rescheduling && (
        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newDate || !newTime) return setError('Pick a new day and time.');
            update({ slotAt: `${newDate}T${newTime}:00+01:00` });
          }}
        >
          <label className="text-sm">
            <span className="mb-1 block text-gray-700">Day</span>
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-base" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-gray-700">Time ({TZ.split('/')[1]})</span>
            <input type="time" step={900} value={newTime} onChange={(e) => setNewTime(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-base" />
          </label>
          <Btn type="submit" variant="primary" disabled={busy}>Save time</Btn>
        </form>
      )}
      {insp.status === 'DONE' && (item.status === 'RESERVED' || item.status === 'AVAILABLE') && (
        <p className="mt-3 border-t border-black/5 pt-3 text-xs text-gray-500">
          Did the buyer pay? Mark the item <strong>Sold</strong> from the Items tab.
        </p>
      )}
    </article>
  );
}
