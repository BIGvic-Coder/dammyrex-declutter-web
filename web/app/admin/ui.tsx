'use client';

import { cldUrl } from '@/lib/cloudinary-loader';

export const TZ = 'Africa/Lagos';

export const fmtDateTime = (iso: string) =>
  new Intl.DateTimeFormat('en-NG', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));

export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('en-NG', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

/** "2348012345678" -> "0801 234 5678" for reading on screen */
export const prettyPhone = (p: string) => (p.startsWith('234') && p.length === 13 ? `0${p.slice(3, 6)} ${p.slice(6, 9)} ${p.slice(9)}` : p);

export const waLink = (phone: string, text: string) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'whatsapp';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800',
  secondary: 'bg-white text-gray-800 ring-1 ring-gray-300 hover:bg-gray-50',
  danger: 'bg-white text-red-700 ring-1 ring-red-300 hover:bg-red-50',
  ghost: 'text-gray-600 hover:bg-gray-100',
  whatsapp: 'bg-whatsapp text-white hover:bg-whatsapp-dark',
};

export function Btn({
  variant = 'secondary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function LinkBtn({ variant = 'secondary', className = '', ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant }) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function Thumb({ url, alt, size = 72 }: { url?: string; alt: string; size?: number }) {
  if (!url) return <div className="shrink-0 rounded-lg bg-gray-100" style={{ width: size, height: size }} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cldUrl(url, { width: size * 2, height: size * 2, crop: 'fill' })}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className="shrink-0 rounded-lg bg-gray-100 object-cover"
      style={{ width: size, height: size }}
    />
  );
}

export function Pager({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between">
      <Btn disabled={page <= 1} onClick={() => onPage(page - 1)}>← Prev</Btn>
      <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
      <Btn disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next →</Btn>
    </div>
  );
}

export function Notice({ kind, children }: { kind: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  const cls = {
    error: 'bg-red-50 text-red-800 ring-red-200',
    success: 'bg-brand-50 text-brand-900 ring-brand-100',
    info: 'bg-gray-50 text-gray-700 ring-gray-200',
  }[kind];
  return (
    <div className={`rounded-lg px-3 py-2 text-sm ring-1 ${cls}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-600">{children}</p>;
}
