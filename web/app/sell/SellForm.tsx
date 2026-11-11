'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Field, FormAlert, inputClass } from '@/components/form';
import { CheckIcon, WhatsAppIcon } from '@/components/icons';
import { compressImage, formatBytes, isValidNgPhone, postFormWithProgress } from '@/lib/client';
import { CONDITION_LABEL } from '@/lib/format';
import type { Category, ItemCondition } from '@/lib/types';

const MAX_PHOTOS = 8;
const MAX_BYTES = 8 * 1024 * 1024;

type Values = {
  title: string;
  categoryId: string;
  condition: ItemCondition | '';
  price: string;
  area: string;
  addressPrivate: string;
  description: string;
  sellerName: string;
  sellerPhone: string;
};
type Errors = Partial<Record<keyof Values | 'photos', string>>;
type Photo = { file: File; url: string };

const EMPTY: Values = {
  title: '',
  categoryId: '',
  condition: '',
  price: '',
  area: '',
  addressPrivate: '',
  description: '',
  sellerName: '',
  sellerPhone: '',
};

function validate(v: Values, photos: Photo[]): Errors {
  const e: Errors = {};
  const price = Number(v.price.replace(/[,\s₦]/g, ''));
  if (photos.length === 0) e.photos = 'Add at least one clear photo of the item.';
  if (v.title.trim().length < 3) e.title = 'Give your item a short name (at least 3 characters).';
  if (!v.categoryId) e.categoryId = 'Choose a category.';
  if (!v.condition) e.condition = 'Choose the condition.';
  if (!v.price.trim() || !Number.isInteger(price)) e.price = 'Enter the price in naira, numbers only.';
  else if (price < 500) e.price = 'Price must be at least ₦500.';
  else if (price > 50_000_000) e.price = 'That price looks too high. Please check it.';
  if (v.area.trim().length < 2) e.area = 'Enter the area, e.g. Ikeja, Lagos.';
  if (v.addressPrivate.trim().length < 5) e.addressPrivate = 'Enter the pickup address so we can arrange inspections.';
  if (v.description.trim().length < 10) e.description = 'Describe the item in a sentence or two (at least 10 characters).';
  if (v.sellerName.trim().length < 2) e.sellerName = 'Enter your name.';
  if (!isValidNgPhone(v.sellerPhone)) e.sellerPhone = 'Enter a valid Nigerian number, e.g. 08012345678.';
  return e;
}

export function SellForm({ categories, whatsapp }: { categories: Category[]; whatsapp: string }) {
  const [values, setValues] = useState<Values>(EMPTY);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [done, setDone] = useState<{ title: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const doneHeading = useRef<HTMLHeadingElement>(null);

  // Free preview memory when photos are removed or the page closes
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  async function addPhotos(list: FileList | null) {
    if (!list?.length) return;
    const room = MAX_PHOTOS - photos.length;
    const picked = Array.from(list).filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
    let note = '';
    if (picked.length < list.length) note = 'Only photos can be added. ';
    if (picked.length > room) note += `Only ${MAX_PHOTOS} photos allowed, so the extra ones were skipped.`;
    setPreparing(true);
    const prepared: Photo[] = [];
    for (const f of picked.slice(0, room)) {
      const small = await compressImage(f);
      if (small.size > MAX_BYTES) {
        note = `"${f.name}" is too large (${formatBytes(small.size)}). Max is 8 MB per photo.`;
        continue;
      }
      prepared.push({ file: small, url: URL.createObjectURL(small) });
    }
    setPhotos((p) => [...p, ...prepared]);
    setPreparing(false);
    setErrors((er) => ({ ...er, photos: note.trim() || undefined }));
    if (fileInput.current) fileInput.current.value = '';
  }

  function removePhoto(i: number) {
    setPhotos((p) => {
      URL.revokeObjectURL(p[i].url);
      return p.filter((_, idx) => idx !== i);
    });
  }

  function makeCover(i: number) {
    setPhotos((p) => [p[i], ...p.filter((_, idx) => idx !== i)]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const errs = validate(values, photos);
    setErrors(errs);
    const firstBad = Object.keys(errs)[0];
    if (firstBad) {
      const el = formRef.current?.querySelector<HTMLElement>(`[name="${firstBad}"], #${firstBad}`);
      el?.focus();
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    const fd = new FormData();
    (Object.keys(values) as (keyof Values)[]).forEach((k) => fd.append(k, values[k].trim()));
    photos.forEach((p) => fd.append('images', p.file, p.file.name));

    setProgress(0);
    try {
      await postFormWithProgress('/items/submit', fd, setProgress);
      setDone({ title: values.title.trim() });
      photos.forEach((p) => URL.revokeObjectURL(p.url));
      setPhotos([]);
      setValues(EMPTY);
      // Jump (not smooth-scroll) so the page shrinking under the scroll can't leave it half-way
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        doneHeading.current?.focus();
      });
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setProgress(null);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-700">
          <CheckIcon className="h-8 w-8" />
        </span>
        <h2 ref={doneHeading} tabIndex={-1} className="mt-4 text-xl font-bold text-gray-900 focus:outline-none">Thanks! We&apos;ve received your item.</h2>
        <p className="mx-auto mt-2 max-w-sm text-gray-600">
          We&apos;ll review <strong>{done.title}</strong> and contact you on WhatsApp before it goes live, usually within a day.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi DammyRex, I just submitted "${done.title}" on your website for you to sell.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-whatsapp px-5 py-3 font-semibold text-white hover:bg-whatsapp-dark"
            >
              <WhatsAppIcon /> Message us on WhatsApp
            </a>
          )}
          <button
            type="button"
            onClick={() => setDone(null)}
            className="rounded-xl px-5 py-3 font-semibold text-brand-800 ring-2 ring-brand-700 hover:bg-brand-50"
          >
            Submit another item
          </button>
        </div>
        <Link href="/items" className="mt-4 inline-block text-sm font-medium text-gray-600 underline">
          Browse items for sale
        </Link>
      </div>
    );
  }

  const submitting = progress !== null;
  const err = (k: keyof Errors) => (errors[k] ? { 'aria-invalid': true, 'aria-describedby': `${k}-error` } : {});

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
      {/* Photos */}
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-6">
        <h2 className="font-bold text-gray-900">
          Photos <span className="font-normal text-gray-500">({photos.length}/{MAX_PHOTOS})</span>
        </h2>
        <p className="mt-0.5 text-sm text-gray-600">Clear photos in daylight sell faster. Show the front, sides and any marks.</p>

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
                  className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                >
                  Make cover
                </button>
              )}
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white"
              >
                ✕
              </button>
            </li>
          ))}
          {photos.length < MAX_PHOTOS && (
            <li>
              <label
                htmlFor="photos"
                className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-center text-sm font-semibold ${errors.photos ? 'border-red-400 text-red-600' : 'border-brand-600/40 text-brand-700'} hover:bg-brand-50`}
              >
                <span className="text-2xl leading-none">＋</span>
                {preparing ? 'Preparing…' : photos.length ? 'Add more' : 'Add photos'}
              </label>
            </li>
          )}
        </ul>
        <input
          ref={fileInput}
          id="photos"
          name="photos"
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => addPhotos(e.target.files)}
          disabled={preparing || submitting}
        />
        {errors.photos && (
          <p id="photos-error" className="mt-2 text-sm text-red-600" role="alert">
            {errors.photos}
          </p>
        )}
      </section>

      {/* Item details */}
      <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-6">
        <h2 className="font-bold text-gray-900">About the item</h2>
        <Field id="title" label="Item name" error={errors.title} hint="e.g. LG double door fridge, 300 litres">
          <input id="title" name="title" value={values.title} onChange={set('title')} maxLength={100} className={inputClass} {...err('title')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="categoryId" label="Category" error={errors.categoryId}>
            <select id="categoryId" name="categoryId" value={values.categoryId} onChange={set('categoryId')} className={inputClass} {...err('categoryId')}>
              <option value="">Choose…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field id="price" label="Your price (₦)" error={errors.price} hint="The amount you want to receive">
            <input
              id="price"
              name="price"
              inputMode="numeric"
              placeholder="e.g. 85000"
              value={values.price}
              onChange={set('price')}
              className={inputClass}
              {...err('price')}
            />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-1 block text-sm font-semibold text-gray-800">Condition</legend>
          <div className="grid grid-cols-3 gap-2" id="condition">
            {(Object.keys(CONDITION_LABEL) as ItemCondition[]).map((c) => (
              <label
                key={c}
                className={`cursor-pointer rounded-lg px-2 py-3 text-center text-sm font-semibold ring-1 ${values.condition === c ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-gray-800 ring-gray-300 hover:bg-gray-50'}`}
              >
                <input type="radio" name="condition" value={c} checked={values.condition === c} onChange={set('condition')} className="sr-only" />
                {CONDITION_LABEL[c]}
              </label>
            ))}
          </div>
          {errors.condition && (
            <p id="condition-error" className="mt-1 text-sm text-red-600" role="alert">{errors.condition}</p>
          )}
        </fieldset>
        <Field id="description" label="Description" error={errors.description} hint="Brand, size, age, how it works, any faults or marks">
          <textarea id="description" name="description" rows={4} maxLength={2000} value={values.description} onChange={set('description')} className={inputClass} {...err('description')} />
        </Field>
      </section>

      {/* Location + contact */}
      <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-6">
        <h2 className="font-bold text-gray-900">Location and contact</h2>
        <Field id="area" label="Area (shown to buyers)" error={errors.area} hint="e.g. Ikeja, Lagos">
          <input id="area" name="area" value={values.area} onChange={set('area')} maxLength={80} autoComplete="address-level2" className={inputClass} {...err('area')} />
        </Field>
        <Field id="addressPrivate" label="Pickup address (private)" error={errors.addressPrivate} hint="Only DammyRex sees this. It is never shown on the website.">
          <textarea id="addressPrivate" name="addressPrivate" rows={2} maxLength={300} value={values.addressPrivate} onChange={set('addressPrivate')} autoComplete="street-address" className={inputClass} {...err('addressPrivate')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="sellerName" label="Your name" error={errors.sellerName}>
            <input id="sellerName" name="sellerName" value={values.sellerName} onChange={set('sellerName')} maxLength={80} autoComplete="name" className={inputClass} {...err('sellerName')} />
          </Field>
          <Field id="sellerPhone" label="Your phone (WhatsApp)" error={errors.sellerPhone} hint="Private. We use it to contact you.">
            <input id="sellerPhone" name="sellerPhone" type="tel" inputMode="tel" placeholder="080…" value={values.sellerPhone} onChange={set('sellerPhone')} autoComplete="tel" className={inputClass} {...err('sellerPhone')} />
          </Field>
        </div>
      </section>

      {formError && <FormAlert message={formError} />}

      <div className="sticky bottom-0 -mx-4 border-t border-black/5 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <button
          type="submit"
          disabled={submitting || preparing}
          className="relative w-full overflow-hidden rounded-xl bg-brand-700 px-5 py-3.5 text-base font-bold text-white hover:bg-brand-800 disabled:opacity-80"
        >
          {submitting && (
            <span className="absolute inset-y-0 left-0 bg-brand-900/50 transition-[width]" style={{ width: `${Math.round((progress ?? 0) * 100)}%` }} aria-hidden="true" />
          )}
          <span className="relative">
            {submitting ? (progress! < 1 ? `Uploading… ${Math.round(progress! * 100)}%` : 'Saving…') : 'Submit item for review'}
          </span>
        </button>
        <p className="mt-2 text-center text-xs text-gray-500">Free to list. We review every item before it goes live.</p>
      </div>
    </form>
  );
}
