'use client';

import { useRef, useState } from 'react';
import { compressImage } from '@/lib/client';
import type { AdminApi, AdminItem } from './admin-api';
import { Btn, Notice, Thumb } from './ui';

const MAX_PHOTOS = 8;

/** Edit an existing item's photos: add more, remove one, or choose the cover. */
export function PhotoManager({
  item,
  api,
  onChanged,
  onAuthError,
}: {
  item: AdminItem;
  api: AdminApi;
  onChanged: () => void;
  onAuthError: (e: unknown) => boolean;
}) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const room = MAX_PHOTOS - item.images.length;

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setError('');
    try {
      await fn();
      onChanged();
    } catch (e) {
      if (!onAuthError(e)) setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  async function add(list: FileList | null) {
    if (!list?.length) return;
    const files = Array.from(list).filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name)).slice(0, room);
    if (fileInput.current) fileInput.current.value = '';
    if (!files.length) return;
    await run('Uploading…', async () => {
      const fd = new FormData();
      for (const f of files) {
        const small = await compressImage(f);
        fd.append('images', small, small.name);
      }
      await api.addImages(item.id, fd, (p) => setBusy(p < 1 ? `Uploading… ${Math.round(p * 100)}%` : 'Saving…'));
    });
  }

  return (
    <div className="mt-3 border-t border-black/5 pt-3">
      <p className="text-sm font-medium text-gray-700">
        Photos <span className="font-normal text-gray-500">({item.images.length}/{MAX_PHOTOS}) · first one is the cover</span>
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {item.images.map((im, i) => (
          <li key={im.id} className="w-24">
            <Thumb url={im.url} alt={`Photo ${i + 1}`} size={96} />
            <div className="mt-1 flex flex-col gap-1">
              {i === 0 ? (
                <span className="rounded bg-brand-700 py-1 text-center text-[11px] font-bold text-white">COVER</span>
              ) : (
                <button type="button" disabled={!!busy} onClick={() => run('Saving…', () => api.setCover(item.id, im.id))} className="min-h-9 rounded bg-gray-100 text-xs font-semibold text-gray-800 hover:bg-gray-200 disabled:opacity-50">
                  Make cover
                </button>
              )}
              {item.images.length > 1 && (
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => window.confirm('Remove this photo?') && run('Removing…', () => api.removeImage(item.id, im.id))}
                  className="min-h-9 rounded text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {room > 0 && (
        <>
          <input ref={fileInput} type="file" accept="image/*" multiple className="sr-only" id={`more-${item.id}`} onChange={(e) => add(e.target.files)} disabled={!!busy} />
          <Btn className="mt-2" disabled={!!busy} onClick={() => fileInput.current?.click()}>＋ Add photos</Btn>
        </>
      )}
      {busy && <p className="mt-2 text-sm text-gray-500" role="status">{busy}</p>}
      {error && <div className="mt-2"><Notice kind="error">{error}</Notice></div>}
    </div>
  );
}
