'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { CONDITION_LABEL, formatNaira } from '@/lib/format';
import type { Category, ItemCondition, ItemStatus } from '@/lib/types';
import type { AdminApi, AdminItem, ItemPage, ItemPatch } from './admin-api';
import { Btn, Empty, fmtDate, LinkBtn, Notice, Pager, prettyPhone, Thumb, waLink } from './ui';

const STATUSES: ItemStatus[] = ['PENDING', 'AVAILABLE', 'RESERVED', 'SOLD', 'REJECTED'];

/** Quick actions offered for each status (the full status picker is under "More"). */
const QUICK: Record<ItemStatus, { to: ItemStatus; label: string; variant: 'primary' | 'secondary' | 'danger' }[]> = {
  PENDING: [
    { to: 'AVAILABLE', label: 'Approve', variant: 'primary' },
    { to: 'REJECTED', label: 'Reject', variant: 'danger' },
  ],
  AVAILABLE: [
    { to: 'SOLD', label: 'Mark sold', variant: 'primary' },
    { to: 'RESERVED', label: 'Mark reserved', variant: 'secondary' },
  ],
  RESERVED: [
    { to: 'SOLD', label: 'Mark sold', variant: 'primary' },
    { to: 'AVAILABLE', label: 'Back to available', variant: 'secondary' },
  ],
  SOLD: [{ to: 'AVAILABLE', label: 'Undo sold', variant: 'secondary' }],
  REJECTED: [{ to: 'AVAILABLE', label: 'Approve', variant: 'primary' }],
};

export function ItemsPanel({
  api,
  categories,
  mode,
  onChanged,
  onAuthError,
}: {
  api: AdminApi;
  categories: Category[];
  mode: 'review' | 'all';
  onChanged: () => void;
  onAuthError: (e: unknown) => boolean;
}) {
  const [status, setStatus] = useState<ItemStatus | ''>(mode === 'review' ? 'PENDING' : '');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ItemPage | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // On slow networks an older request can finish after a newer one; only the latest may update the list.
  const latest = useRef(0);
  const load = useCallback(async () => {
    const req = ++latest.current;
    setLoading(true);
    setError('');
    try {
      const result = await api.items({ status: status || undefined, q: query || undefined, page, limit: 20 });
      if (req === latest.current) setData(result);
    } catch (e) {
      if (req === latest.current && !onAuthError(e)) setError((e as Error).message);
    } finally {
      if (req === latest.current) setLoading(false);
    }
  }, [api, status, query, page, onAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    load();
    onChanged();
  };

  return (
    <div>
      {mode === 'all' && (
        <form
          className="mb-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQuery(q.trim());
          }}
        >
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as ItemStatus | '');
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <div className="flex flex-1 gap-2">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, seller name or phone"
              aria-label="Search items"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base"
            />
            <Btn type="submit" variant="primary">Search</Btn>
          </div>
        </form>
      )}

      {error && <Notice kind="error">{error}</Notice>}
      {loading && !data && <p className="text-sm text-gray-500">Loading…</p>}
      {data && (
        <>
          <p className="mb-2 text-sm text-gray-600">
            {data.total} item{data.total === 1 ? '' : 's'}
            {mode === 'review' ? ' waiting for review (oldest first)' : ''}
            {loading ? ' · refreshing…' : ''}
          </p>
          {data.items.length === 0 ? (
            <Empty>{mode === 'review' ? 'No items waiting for review. 🎉' : 'No items match.'}</Empty>
          ) : (
            <ul className="space-y-3">
              {data.items.map((it) => (
                <li key={it.id}>
                  <AdminItemCard item={it} api={api} categories={categories} review={mode === 'review'} onDone={refresh} onAuthError={onAuthError} />
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

function AdminItemCard({
  item,
  api,
  categories,
  review,
  onDone,
  onAuthError,
}: {
  item: AdminItem;
  api: AdminApi;
  categories: Category[];
  review: boolean;
  onDone: () => void;
  onAuthError: (e: unknown) => boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [more, setMore] = useState(false);
  const [price, setPrice] = useState(String(item.price));
  const [featured, setFeatured] = useState(item.featured);

  async function run(fn: () => Promise<unknown>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setError('');
    try {
      await fn();
      onDone();
    } catch (e) {
      if (!onAuthError(e)) setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const parsedPrice = Number(price.replace(/[,\s₦]/g, ''));
  const priceChanged = Number.isInteger(parsedPrice) && parsedPrice !== item.price;

  /** Review queue: save price/feature edits, then approve, in one tap. */
  const approve = () =>
    run(async () => {
      const patch: ItemPatch = {};
      if (priceChanged) patch.price = parsedPrice;
      if (featured !== item.featured) patch.featured = featured;
      if (Object.keys(patch).length) await api.updateItem(item.id, patch);
      await api.setStatus(item.id, 'AVAILABLE');
    });

  const sellerMsg = `Hi ${item.seller.name}, this is DammyRex Declutter about your "${item.title}".`;

  return (
    <article className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5 sm:p-4">
      <div className="flex gap-3">
        <a href={item.status === 'PENDING' || item.status === 'REJECTED' ? item.images[0]?.url : `/items/${item.id}`} target="_blank" rel="noopener noreferrer">
          <Thumb url={item.images[0]?.url} alt={item.title} />
        </a>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={item.status} />
            {item.featured && <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-900">★ Featured</span>}
          </div>
          <h3 className="mt-1 font-semibold leading-snug text-gray-900">{item.title}</h3>
          <p className="text-sm text-gray-600">
            <strong className="text-brand-800">{formatNaira(item.price)}</strong> · {item.category.name} · {CONDITION_LABEL[item.condition]}
          </p>
          <p className="text-xs text-gray-500">
            {item.area} · added {fmtDate(item.createdAt)}
            {item._count.inspections > 0 && ` · ${item._count.inspections} inspection${item._count.inspections === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      {review && item.images.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {item.images.map((im, i) => (
            <a key={im.id} href={im.url} target="_blank" rel="noopener noreferrer">
              <Thumb url={im.url} alt={`Photo ${i + 1}`} size={64} />
            </a>
          ))}
        </div>
      )}

      {review && <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{item.description}</p>}

      {/* Seller + private address: admin only */}
      <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
        <p>
          <span className="text-gray-500">Seller:</span> <strong>{item.seller.name}</strong> · {prettyPhone(item.seller.phone)}
        </p>
        <p className="mt-0.5">
          <span className="text-gray-500">Pickup:</span> {item.addressPrivate}
        </p>
        <div className="mt-2 flex gap-2">
          <LinkBtn variant="whatsapp" href={waLink(item.seller.phone, sellerMsg)}>WhatsApp seller</LinkBtn>
          <LinkBtn href={`tel:+${item.seller.phone}`}>Call</LinkBtn>
        </div>
      </div>

      {review && (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Price (₦)</span>
            <input
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-base"
              aria-label={`Price for ${item.title}`}
            />
          </label>
          <label className="flex items-center gap-2 py-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-5 w-5 accent-brand-700" />
            Feature on home page
          </label>
        </div>
      )}

      {error && <div className="mt-3"><Notice kind="error">{error}</Notice></div>}
      {busy && <p className="mt-3 text-sm text-gray-500" role="status">Working… this can take a few seconds on slow data.</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {review ? (
          <>
            <Btn variant="primary" disabled={busy} onClick={approve}>
              {busy ? 'Working…' : priceChanged || featured !== item.featured ? 'Save & approve' : 'Approve'}
            </Btn>
            <Btn variant="danger" disabled={busy} onClick={() => run(() => api.setStatus(item.id, 'REJECTED'), `Reject "${item.title}"?`)}>
              Reject
            </Btn>
          </>
        ) : (
          QUICK[item.status].map((a) => (
            <Btn
              key={a.to}
              variant={a.variant}
              disabled={busy}
              onClick={() => run(() => api.setStatus(item.id, a.to), a.to === 'REJECTED' ? `Reject "${item.title}"?` : undefined)}
            >
              {a.label}
            </Btn>
          ))
        )}
        {!review && (item.status === 'AVAILABLE' || item.status === 'RESERVED') && (
          <Btn disabled={busy} onClick={() => run(() => api.updateItem(item.id, { featured: !item.featured }))}>
            {item.featured ? 'Unfeature' : '★ Feature'}
          </Btn>
        )}
        <Btn variant="ghost" onClick={() => setEditing((v) => !v)}>{editing ? 'Close edit' : 'Edit'}</Btn>
        {!review && <Btn variant="ghost" onClick={() => setMore((v) => !v)}>More</Btn>}
      </div>

      {more && !review && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-black/5 pt-3">
          <label className="text-sm text-gray-700">
            Set status{' '}
            <select
              value={item.status}
              disabled={busy}
              onChange={(e) => run(() => api.setStatus(item.id, e.target.value as ItemStatus))}
              className="ml-1 rounded-lg border border-gray-300 px-2 py-1.5 text-base"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <Btn variant="danger" disabled={busy} onClick={() => run(() => api.deleteItem(item.id), `Delete "${item.title}" and its photos permanently? This cannot be undone.`)}>
            Delete
          </Btn>
        </div>
      )}

      {editing && <EditForm item={item} categories={categories} api={api} onSaved={() => { setEditing(false); onDone(); }} onAuthError={onAuthError} />}
    </article>
  );
}

function EditForm({
  item,
  categories,
  api,
  onSaved,
  onAuthError,
}: {
  item: AdminItem;
  categories: Category[];
  api: AdminApi;
  onSaved: () => void;
  onAuthError: (e: unknown) => boolean;
}) {
  const [v, setV] = useState({
    title: item.title,
    price: String(item.price),
    categoryId: item.categoryId,
    condition: item.condition,
    area: item.area,
    addressPrivate: item.addressPrivate,
    description: item.description,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((o) => ({ ...o, [k]: e.target.value }));
  const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-base';

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(v.price.replace(/[,\s₦]/g, ''));
    if (!Number.isInteger(price) || price < 500) return setError('Price must be a whole number of at least ₦500.');
    const patch: ItemPatch = {};
    if (v.title.trim() !== item.title) patch.title = v.title.trim();
    if (price !== item.price) patch.price = price;
    if (v.categoryId !== item.categoryId) patch.categoryId = v.categoryId;
    if (v.condition !== item.condition) patch.condition = v.condition as ItemCondition;
    if (v.area.trim() !== item.area) patch.area = v.area.trim();
    if (v.addressPrivate.trim() !== item.addressPrivate) patch.addressPrivate = v.addressPrivate.trim();
    if (v.description.trim() !== item.description) patch.description = v.description.trim();
    if (!Object.keys(patch).length) return onSaved();
    setBusy(true);
    setError('');
    try {
      await api.updateItem(item.id, patch);
      onSaved();
    } catch (err) {
      if (!onAuthError(err)) setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-3 grid gap-3 border-t border-black/5 pt-3 sm:grid-cols-2">
      <label className="text-sm sm:col-span-2">
        <span className="mb-1 block font-medium text-gray-700">Title</span>
        <input value={v.title} onChange={set('title')} className={input} />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium text-gray-700">Price (₦)</span>
        <input inputMode="numeric" value={v.price} onChange={set('price')} className={input} />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium text-gray-700">Category</span>
        <select value={v.categoryId} onChange={set('categoryId')} className={input}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium text-gray-700">Condition</span>
        <select value={v.condition} onChange={set('condition')} className={input}>
          {(Object.keys(CONDITION_LABEL) as ItemCondition[]).map((c) => <option key={c} value={c}>{CONDITION_LABEL[c]}</option>)}
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium text-gray-700">Area (public)</span>
        <input value={v.area} onChange={set('area')} className={input} />
      </label>
      <label className="text-sm sm:col-span-2">
        <span className="mb-1 block font-medium text-gray-700">Pickup address (private)</span>
        <input value={v.addressPrivate} onChange={set('addressPrivate')} className={input} />
      </label>
      <label className="text-sm sm:col-span-2">
        <span className="mb-1 block font-medium text-gray-700">Description</span>
        <textarea rows={4} value={v.description} onChange={set('description')} className={input} />
      </label>
      {error && <div className="sm:col-span-2"><Notice kind="error">{error}</Notice></div>}
      <div className="sm:col-span-2">
        <Btn type="submit" variant="primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Btn>
      </div>
    </form>
  );
}
