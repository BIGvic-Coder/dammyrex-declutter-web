'use client';

import { useRef, useState } from 'react';
import { Field, inputClass } from '@/components/form';
import { type Photo, PhotoPicker, releasePhotos } from '@/components/PhotoPicker';
import { isValidNgPhone } from '@/lib/client';
import { CONDITION_LABEL, formatNaira } from '@/lib/format';
import type { Category, ItemCondition } from '@/lib/types';
import type { AdminApi, AdminItem } from './admin-api';
import { Btn, Notice } from './ui';

const MAX_PHOTOS = 8;
/** Remember where the CEO usually stores items, so it isn't retyped every time. */
const PLACE_KEY = 'dammyrex-admin-place';

type Values = {
  title: string;
  categoryId: string;
  condition: ItemCondition | '';
  price: string;
  area: string;
  addressPrivate: string;
  description: string;
  featured: boolean;
  publish: boolean;
  sellerName: string;
  sellerPhone: string;
};
type Errors = Partial<Record<keyof Values | 'photos', string>>;

function savedPlace(): Pick<Values, 'area' | 'addressPrivate'> {
  try {
    const p = JSON.parse(localStorage.getItem(PLACE_KEY) ?? '{}');
    return { area: typeof p.area === 'string' ? p.area : '', addressPrivate: typeof p.addressPrivate === 'string' ? p.addressPrivate : '' };
  } catch {
    return { area: '', addressPrivate: '' };
  }
}

const blank = (): Values => ({
  title: '',
  categoryId: '',
  condition: '',
  price: '',
  description: '',
  featured: false,
  publish: true,
  sellerName: '',
  sellerPhone: '',
  ...savedPlace(),
});

const parsePrice = (s: string) => Number(s.replace(/[,\s₦]/g, ''));

function validate(v: Values, photos: Photo[]): Errors {
  const e: Errors = {};
  const price = parsePrice(v.price);
  if (photos.length === 0) e.photos = 'Add at least one photo.';
  if (v.title.trim().length < 3) e.title = 'Item name must be at least 3 characters.';
  if (!v.categoryId) e.categoryId = 'Choose a category.';
  if (!v.condition) e.condition = 'Choose the condition.';
  if (!v.price.trim() || !Number.isInteger(price)) e.price = 'Enter the price in naira, numbers only.';
  else if (price < 500) e.price = 'Price must be at least ₦500.';
  else if (price > 50_000_000) e.price = 'That price looks too high.';
  if (v.description.trim().length < 10) e.description = 'Description must be at least 10 characters.';
  if (v.area.trim().length < 2) e.area = 'Enter the area buyers will see, e.g. Ikeja, Lagos.';
  if (v.addressPrivate.trim().length < 5) e.addressPrivate = 'Enter the pickup address (only you see it).';
  if (v.sellerPhone.trim() && !isValidNgPhone(v.sellerPhone)) e.sellerPhone = 'Enter a valid Nigerian number, or leave it empty.';
  if (v.sellerPhone.trim() && v.sellerName.trim().length < 2) e.sellerName = "Enter the seller's name.";
  return e;
}

export function AddItemForm({
  api,
  categories,
  onCreated,
  onAuthError,
}: {
  api: AdminApi;
  categories: Category[];
  onCreated: () => void;
  onAuthError: (e: unknown) => boolean;
}) {
  const [values, setValues] = useState<Values>(blank);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [created, setCreated] = useState<AdminItem | null>(null);
  const [showSeller, setShowSeller] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setValues((v) => ({ ...v, [k]: value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const errs = validate(values, photos);
    setErrors(errs);
    const firstBad = Object.keys(errs)[0];
    if (firstBad) {
      if (firstBad === 'sellerName' || firstBad === 'sellerPhone') setShowSeller(true);
      requestAnimationFrame(() => {
        const el = formRef.current?.querySelector<HTMLElement>(`#add-${firstBad}`);
        el?.focus();
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
      return;
    }

    const fd = new FormData();
    fd.append('title', values.title.trim());
    fd.append('categoryId', values.categoryId);
    fd.append('condition', values.condition);
    fd.append('price', String(parsePrice(values.price)));
    fd.append('description', values.description.trim());
    fd.append('area', values.area.trim());
    fd.append('addressPrivate', values.addressPrivate.trim());
    fd.append('status', values.publish ? 'AVAILABLE' : 'PENDING');
    fd.append('featured', String(values.publish && values.featured));
    if (values.sellerPhone.trim()) {
      fd.append('sellerName', values.sellerName.trim());
      fd.append('sellerPhone', values.sellerPhone.trim());
    }
    photos.forEach((p) => fd.append('images', p.file, p.file.name));

    setProgress(0);
    try {
      const item = await api.createItem(fd, setProgress);
      try {
        localStorage.setItem(PLACE_KEY, JSON.stringify({ area: values.area.trim(), addressPrivate: values.addressPrivate.trim() }));
      } catch {}
      releasePhotos(photos);
      setPhotos([]);
      setValues(blank());
      setShowSeller(false);
      setCreated(item);
      onCreated();
      window.scrollTo({ top: 0 });
    } catch (err) {
      if (!onAuthError(err)) setFormError((err as Error).message);
    } finally {
      setProgress(null);
    }
  }

  if (created) {
    const live = created.status === 'AVAILABLE';
    return (
      <div className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
        <p className="text-lg font-bold text-gray-900">{live ? 'Posted! It is live on the website.' : 'Saved. It is waiting in Review.'}</p>
        <p className="mt-1 text-sm text-gray-600">
          <strong>{created.title}</strong> · {formatNaira(created.price)} · {created.category.name}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {live && (
            <a href={`/items/${created.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-700 px-4 font-semibold text-white hover:bg-brand-800">
              View on website
            </a>
          )}
          <Btn onClick={() => setCreated(null)}>Add another item</Btn>
        </div>
      </div>
    );
  }

  const submitting = progress !== null;
  const err = (k: keyof Errors) => (errors[k] ? { 'aria-invalid': true, 'aria-describedby': `add-${k}-error` } : {});

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5">
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <h2 className="font-bold text-gray-900">
          Photos <span className="font-normal text-gray-500">({photos.length}/{MAX_PHOTOS})</span>
        </h2>
        <p className="text-sm text-gray-600">The first photo is the cover shown in listings.</p>
        <PhotoPicker
          inputId="add-photos"
          photos={photos}
          onChange={(p) => {
            setPhotos(p);
            if (p.length) setErrors((er) => ({ ...er, photos: undefined }));
          }}
          max={MAX_PHOTOS}
          error={errors.photos}
          onError={(m) => setErrors((er) => ({ ...er, photos: m }))}
          disabled={submitting}
          onPreparingChange={setPreparing}
        />
      </section>

      <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <Field id="add-title" label="Item name" error={errors.title} hint="e.g. LG double door fridge, 300 litres">
          <input id="add-title" value={values.title} onChange={set('title')} maxLength={100} className={inputClass} {...err('title')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="add-categoryId" label="Category" error={errors.categoryId}>
            <select id="add-categoryId" value={values.categoryId} onChange={set('categoryId')} className={inputClass} {...err('categoryId')}>
              <option value="">Choose…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field id="add-price" label="Price (₦)" error={errors.price}>
            <input id="add-price" inputMode="numeric" placeholder="e.g. 85000" value={values.price} onChange={set('price')} className={inputClass} {...err('price')} />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-1 block text-sm font-semibold text-gray-800">Condition</legend>
          <div className="grid grid-cols-3 gap-2" id="add-condition" tabIndex={-1}>
            {(Object.keys(CONDITION_LABEL) as ItemCondition[]).map((c) => (
              <label
                key={c}
                className={`cursor-pointer rounded-lg px-2 py-3 text-center text-sm font-semibold ring-1 ${values.condition === c ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-gray-800 ring-gray-300 hover:bg-gray-50'}`}
              >
                <input type="radio" name="add-condition" value={c} checked={values.condition === c} onChange={set('condition')} className="sr-only" />
                {CONDITION_LABEL[c]}
              </label>
            ))}
          </div>
          {errors.condition && <p id="add-condition-error" className="mt-1 text-sm text-red-600" role="alert">{errors.condition}</p>}
        </fieldset>
        <Field id="add-description" label="Description" error={errors.description} hint="Brand, size, age, how it works, any faults or marks">
          <textarea id="add-description" rows={4} maxLength={2000} value={values.description} onChange={set('description')} className={inputClass} {...err('description')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="add-area" label="Area (shown to buyers)" error={errors.area} hint="e.g. Ikeja, Lagos">
            <input id="add-area" value={values.area} onChange={set('area')} maxLength={80} className={inputClass} {...err('area')} />
          </Field>
          <Field id="add-addressPrivate" label="Pickup address (private)" error={errors.addressPrivate} hint="Never shown on the website">
            <input id="add-addressPrivate" value={values.addressPrivate} onChange={set('addressPrivate')} maxLength={300} className={inputClass} {...err('addressPrivate')} />
          </Field>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-gray-800">
          <input type="checkbox" checked={values.publish} onChange={set('publish')} className="h-5 w-5 accent-brand-700" />
          Publish now (uncheck to save it in Review for later)
        </label>
        <label className={`flex min-h-11 items-center gap-3 text-sm font-medium ${values.publish ? 'text-gray-800' : 'text-gray-400'}`}>
          <input type="checkbox" checked={values.publish && values.featured} disabled={!values.publish} onChange={set('featured')} className="h-5 w-5 accent-brand-700" />
          ★ Feature on the home page
        </label>
        <button type="button" onClick={() => setShowSeller((s) => !s)} className="min-h-11 text-sm font-semibold text-brand-800 underline">
          {showSeller ? 'Hide seller details' : 'Selling for someone else? Add their details'}
        </button>
        {showSeller && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="add-sellerName" label="Seller name" error={errors.sellerName}>
              <input id="add-sellerName" value={values.sellerName} onChange={set('sellerName')} maxLength={80} className={inputClass} {...err('sellerName')} />
            </Field>
            <Field id="add-sellerPhone" label="Seller phone" error={errors.sellerPhone} hint="Leave empty for your own stock">
              <input id="add-sellerPhone" type="tel" inputMode="tel" placeholder="080…" value={values.sellerPhone} onChange={set('sellerPhone')} className={inputClass} {...err('sellerPhone')} />
            </Field>
          </div>
        )}
      </section>

      {formError && <Notice kind="error">{formError}</Notice>}

      <div className="sticky bottom-0 -mx-4 border-t border-black/5 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <button
          type="submit"
          disabled={submitting || preparing}
          className="relative w-full overflow-hidden rounded-xl bg-brand-700 px-5 py-3.5 text-base font-bold text-white hover:bg-brand-800 disabled:opacity-80"
        >
          {submitting && <span className="absolute inset-y-0 left-0 bg-brand-900/50 transition-[width]" style={{ width: `${Math.round((progress ?? 0) * 100)}%` }} aria-hidden="true" />}
          <span className="relative">
            {submitting ? (progress! < 1 ? `Uploading… ${Math.round(progress! * 100)}%` : 'Saving…') : values.publish ? 'Post item' : 'Save to Review'}
          </span>
        </button>
      </div>
    </form>
  );
}
