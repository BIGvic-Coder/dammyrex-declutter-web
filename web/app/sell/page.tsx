import type { Metadata } from 'next';
import { getCategories } from '@/lib/api';
import { pageMetadata } from '@/lib/seo';
import { whatsappNumber } from '@/lib/site';
import { SellForm } from './SellForm';

export const metadata: Metadata = pageMetadata({
  title: 'Sell your used home items',
  description:
    'Decluttering? Send us photos of your neatly used fridge, freezer, gas cooker, fan, AC, bed, chairs or tables. We post it and connect you with buyers. Free to list.',
  path: '/sell',
});

// Render per request (categories are still cached for 5 min by the fetch), so a deploy
// built while the API was unreachable never serves a broken form.
export const dynamic = 'force-dynamic';

export default async function SellPage() {
  const categories = await getCategories();
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Sell your item</h1>
      <p className="mt-1 text-gray-600">
        Send us photos and details. We review it, post it, and connect you with buyers who inspect before paying.
      </p>
      <ol className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-medium text-gray-700">
        {['Submit photos', 'We review & post', 'Buyer inspects & pays'].map((s, i) => (
          <li key={s} className="rounded-lg bg-brand-50 px-2 py-2 ring-1 ring-brand-100">
            <span className="block text-base font-bold text-brand-700">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <div className="mt-6">
        {categories.length > 0 ? (
          <SellForm categories={categories} whatsapp={whatsappNumber()} />
        ) : (
          <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
            The form is temporarily unavailable. Please refresh in a moment or send your item details to us on WhatsApp.
          </p>
        )}
      </div>
    </div>
  );
}
