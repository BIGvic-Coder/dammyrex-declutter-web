'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { compressImage, formatBytes } from '@/lib/client';

export type Photo = { file: File; url: string };

const MAX_BYTES = 8 * 1024 * 1024;

/** Free the preview memory of photos that are no longer shown. */
export const releasePhotos = (photos: Photo[]) => photos.forEach((p) => URL.revokeObjectURL(p.url));

/**
 * Photo grid with add / remove / make-cover. Photos are shrunk on the phone before upload
 * (see compressImage) so a 4 MB camera picture uploads as ~300 KB on mobile data.
 * Used by the public Sell form and the admin "Add item" form.
 */
export function PhotoPicker({
  photos,
  onChange,
  max = 8,
  error,
  onError,
  disabled,
  onPreparingChange,
  inputId,
}: {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
  max?: number;
  error?: string;
  onError: (message: string | undefined) => void;
  disabled?: boolean;
  onPreparingChange?: (preparing: boolean) => void;
  /** id for the hidden file input (lets a form focus it on a validation error) */
  inputId?: string;
}) {
  const autoId = useId();
  const id = inputId ?? `photos-${autoId}`;
  const [preparing, setPreparing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Free preview memory when the picker goes away
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => releasePhotos(photosRef.current), []);

  const setBusy = (b: boolean) => {
    setPreparing(b);
    onPreparingChange?.(b);
  };

  async function addPhotos(list: FileList | null) {
    if (!list?.length) return;
    const room = max - photos.length;
    const picked = Array.from(list).filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
    let note = '';
    if (picked.length < list.length) note = 'Only photos can be added. ';
    if (picked.length > room) note += `Only ${max} photos allowed, so the extra ones were skipped.`;
    setBusy(true);
    const prepared: Photo[] = [];
    for (const f of picked.slice(0, room)) {
      const small = await compressImage(f);
      if (small.size > MAX_BYTES) {
        note = `"${f.name}" is too large (${formatBytes(small.size)}). Max is 8 MB per photo.`;
        continue;
      }
      prepared.push({ file: small, url: URL.createObjectURL(small) });
    }
    onChange([...photosRef.current, ...prepared]);
    setBusy(false);
    onError(note.trim() || undefined);
    if (fileInput.current) fileInput.current.value = '';
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(photos[i].url);
    onChange(photos.filter((_, idx) => idx !== i));
  }

  const makeCover = (i: number) => onChange([photos[i], ...photos.filter((_, idx) => idx !== i)]);

  return (
    <>
      <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((p, i) => (
          <li key={p.url} className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 ring-1 ring-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 ? (
              <span className="absolute bottom-1 left-1 rounded bg-brand-700 px-1.5 py-0.5 text-[10px] font-bold text-white">COVER</span>
            ) : (
              <button
                type="button"
                onClick={() => makeCover(i)}
                className="absolute bottom-1 left-1 rounded bg-black/60 px-2 py-1 text-[11px] font-semibold text-white"
              >
                Make cover
              </button>
            )}
            <button
              type="button"
              onClick={() => removePhoto(i)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white"
            >
              ✕
            </button>
          </li>
        ))}
        {photos.length < max && (
          <li>
            <label
              htmlFor={id}
              className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-center text-sm font-semibold ${error ? 'border-red-400 text-red-600' : 'border-brand-600/40 text-brand-700'} hover:bg-brand-50`}
            >
              <span className="text-2xl leading-none">＋</span>
              {preparing ? 'Preparing…' : photos.length ? 'Add more' : 'Add photos'}
            </label>
          </li>
        )}
      </ul>
      <input
        ref={fileInput}
        id={id}
        name="photos"
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => addPhotos(e.target.files)}
        disabled={preparing || disabled}
      />
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
