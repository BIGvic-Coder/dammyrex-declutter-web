'use client';

import { useMemo, useState } from 'react';
import { isValidNgPhone, postJson } from '@/lib/client';
import { Field, FormAlert, inputClass } from './form';
import { CheckIcon, WhatsAppIcon } from './icons';

const TZ = 'Africa/Lagos'; // WAT, UTC+1, no daylight saving
const OFFSET = '+01:00';
const TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const MAX_DAYS = 30;

/** YYYY-MM-DD for a Date, as seen in Lagos */
const lagosDate = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);

const slotIso = (date: string, time: string) => `${date}T${time}:00${OFFSET}`;

const prettySlot = (iso: string) =>
  new Intl.DateTimeFormat('en-NG', {
    timeZone: TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));

type Errors = Partial<Record<'buyerName' | 'buyerPhone' | 'date' | 'time', string>>;

export function BookInspectionForm({ itemId, itemTitle, whatsapp }: { itemId: string; itemTitle: string; whatsapp: string }) {
  const [buyerName, setName] = useState('');
  const [buyerPhone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);
  const [booked, setBooked] = useState<string | null>(null);

  const { minDate, maxDate } = useMemo(() => {
    const now = new Date();
    return { minDate: lagosDate(now), maxDate: lagosDate(new Date(now.getTime() + (MAX_DAYS - 1) * 86400000)) };
  }, []);

  // Only offer times at least 1 hour from now
  const availableTimes = useMemo(() => {
    if (!date) return TIMES;
    const cutoff = Date.now() + 60 * 60 * 1000;
    return TIMES.filter((t) => new Date(slotIso(date, t)).getTime() >= cutoff);
  }, [date]);

  function validate(): Errors {
    const e: Errors = {};
    if (buyerName.trim().length < 2) e.buyerName = 'Enter your name.';
    if (!isValidNgPhone(buyerPhone)) e.buyerPhone = 'Enter a valid Nigerian number, e.g. 08012345678.';
    if (!date) e.date = 'Choose a day.';
    else if (date < minDate || date > maxDate) e.date = `Choose a day within the next ${MAX_DAYS} days.`;
    if (!time) e.time = 'Choose a time.';
    else if (!availableTimes.includes(time)) e.time = 'That time has passed. Choose a later time.';
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSending(true);
    try {
      const slotAt = slotIso(date, time);
      await postJson('/inspections', { itemId, buyerName: buyerName.trim(), buyerPhone, slotAt, note: note.trim() || undefined });
      setBooked(slotAt);
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (booked) {
    const msg = `Hi DammyRex, I just booked to inspect "${itemTitle}" on ${prettySlot(booked)}. My name is ${buyerName.trim()}.`;
    return (
      <div className="text-center" role="status">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-700">
          <CheckIcon className="h-7 w-7" />
        </span>
        <p className="mt-3 font-bold text-gray-900">Inspection requested for {prettySlot(booked)}</p>
        <p className="mt-1 text-sm text-gray-600">
          We&apos;ll confirm the time and send you the address on WhatsApp. Please don&apos;t pay anything before you inspect.
        </p>
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-whatsapp px-5 py-3 font-semibold text-white hover:bg-whatsapp-dark"
          >
            <WhatsAppIcon /> Get confirmed faster on WhatsApp
          </a>
        )}
      </div>
    );
  }

  const invalid = (k: keyof Errors) => (errors[k] ? { 'aria-invalid': true, 'aria-describedby': `${k}-error` } : {});
  /** Update a field and clear its error as soon as the user changes it. */
  const change =
    <T,>(k: keyof Errors | 'note', setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      if (k !== 'note' && errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
      if (formError) setFormError('');
    };
  const onName = change('buyerName', setName);
  const onPhone = change('buyerPhone', setPhone);
  const onTime = change('time', setTime);
  const onDate = change<string>('date', (v) => {
    setDate(v);
    setTime('');
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <p className="text-sm text-gray-600">Pick a time to see the item. We&apos;ll confirm on WhatsApp and share the address.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="buyerName" label="Your name" error={errors.buyerName}>
          <input id="buyerName" value={buyerName} onChange={(e) => onName(e.target.value)} maxLength={80} autoComplete="name" className={inputClass} {...invalid('buyerName')} />
        </Field>
        <Field id="buyerPhone" label="Phone (WhatsApp)" error={errors.buyerPhone}>
          <input id="buyerPhone" type="tel" inputMode="tel" placeholder="080…" value={buyerPhone} onChange={(e) => onPhone(e.target.value)} autoComplete="tel" className={inputClass} {...invalid('buyerPhone')} />
        </Field>
        <Field id="date" label="Day" error={errors.date}>
          <input
            id="date"
            type="date"
            min={minDate}
            max={maxDate}
            value={date}
            onChange={(e) => onDate(e.target.value)}
            className={inputClass}
            {...invalid('date')}
          />
        </Field>
        <Field id="time" label="Time" error={errors.time} hint={date && availableTimes.length === 0 ? 'No times left today. Choose another day.' : undefined}>
          <select id="time" value={time} onChange={(e) => onTime(e.target.value)} disabled={!date || availableTimes.length === 0} className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`} {...invalid('time')}>
            <option value="">{date ? 'Choose…' : 'Pick a day first'}</option>
            {availableTimes.map((t) => (
              <option key={t} value={t}>
                {new Date(`2000-01-01T${t}:00`).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="note" label="Note (optional)" hint="Anything we should know, e.g. you'll come with a van">
        <textarea id="note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
      </Field>
      {formError && <FormAlert message={formError} />}
      <button type="submit" disabled={sending} className="w-full rounded-xl bg-brand-700 px-5 py-3.5 text-base font-bold text-white hover:bg-brand-800 disabled:opacity-70">
        {sending ? 'Sending…' : 'Request inspection'}
      </button>
    </form>
  );
}
