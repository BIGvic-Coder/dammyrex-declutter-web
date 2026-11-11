import { formatNaira } from './format';

export const SITE_NAME = 'DammyRex Declutter';
/** Strips stray quotes/spaces that sometimes get pasted into dashboard env values. */
const clean = (v?: string) => (v ?? '').trim().replace(/^["']|["']$/g, '').trim();

/**
 * Public site address. Prefers NEXT_PUBLIC_SITE_URL; on Vercel falls back to the project's
 * production domain (a system variable Vercel sets on every build); locally, localhost.
 */
const vercelProd = clean(
  process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL,
);
export const SITE_URL = (
  clean(process.env.NEXT_PUBLIC_SITE_URL) ||
  (vercelProd ? `https://${vercelProd}` : 'http://localhost:3000')
).replace(/\/$/, '');
export const SITE_DESCRIPTION =
  'Neatly used fridges, freezers, gas cookers, fans, ACs, beds, chairs and tables in Nigeria. Inspect in person before you pay. Chat with us on WhatsApp.';

/** Server-only: read in server components and pass down as a prop where needed. */
export function whatsappNumber(): string {
  return (process.env.WHATSAPP_NUMBER ?? '').replace(/\D/g, '');
}

export function whatsappLink(text: string, number = whatsappNumber()): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function itemUrl(id: string): string {
  return `${SITE_URL}/items/${id}`;
}

export function itemWhatsappText(item: { id: string; title: string; price: number }): string {
  return `Hi DammyRex, I'm interested in "${item.title}" (${formatNaira(item.price)}). Is it still available?\n${itemUrl(item.id)}`;
}
