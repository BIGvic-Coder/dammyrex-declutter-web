import Link from 'next/link';
import { CategoryGrid } from '@/components/CategoryGrid';
import { EmptyState } from '@/components/EmptyState';
import { CheckIcon } from '@/components/icons';
import { ItemGrid } from '@/components/ItemCard';
import { SectionHeading } from '@/components/SectionHeading';
import { getCategories, getItems, getReviews } from '@/lib/api';
import { jsonLd, pageMetadata } from '@/lib/seo';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, whatsappNumber } from '@/lib/site';

export const revalidate = 60;

export const metadata = pageMetadata({
  title: `${SITE_NAME} | Used Fridges, Cookers & More in Nigeria`,
  absoluteTitle: true,
  description: SITE_DESCRIPTION,
  path: '/',
});

function homeJsonLd() {
  const wa = whatsappNumber();
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/items?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description: SITE_DESCRIPTION,
      areaServed: { '@type': 'Country', name: 'Nigeria' },
      ...(wa && { contactPoint: { '@type': 'ContactPoint', telephone: `+${wa}`, contactType: 'customer service', availableLanguage: ['English'] } }),
    },
  ];
}

const STEPS = [
  { title: 'Find an item', text: 'Browse neatly used items posted by people decluttering near you.' },
  { title: 'Inspect in person', text: 'Book a time, go and see it, test it. No pressure.' },
  { title: 'Pay if you like it', text: 'Agree the deal on WhatsApp and pay only after inspecting.' },
];

export default async function HomePage() {
  const [featured, newest, categories, reviews] = await Promise.all([
    getItems({ featured: 'true', limit: '8' }),
    getItems({ limit: '8' }),
    getCategories(),
    getReviews(),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(homeJsonLd())} />
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-800 to-brand-700 text-white">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:pb-14 sm:pt-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-100/80">Declutter marketplace · Nigeria</p>
          <h1 className="mt-2 max-w-xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Neatly used home items. <span className="text-amber-300">Inspect before you pay.</span>
          </h1>
          <p className="mt-3 max-w-lg text-base text-brand-100 sm:text-lg">
            Fridges, freezers, gas cookers, fans, ACs, beds, chairs and tables at fair prices.
          </p>
          <form action="/items" className="mt-6 flex max-w-lg overflow-hidden rounded-xl bg-white shadow-lg" role="search">
            <label htmlFor="hero-q" className="sr-only">Search items</label>
            <input
              id="hero-q"
              name="q"
              type="search"
              placeholder="Search e.g. LG fridge, standing fan"
              className="min-w-0 flex-1 px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
            <button type="submit" className="bg-amber-400 px-4 font-semibold text-amber-950 hover:bg-amber-300">
              Search
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <Link href="/items" className="rounded-lg bg-white/10 px-3 py-2 font-medium ring-1 ring-white/25 hover:bg-white/20">
              Browse all items
            </Link>
            <Link href="/sell" className="rounded-lg bg-white/10 px-3 py-2 font-medium ring-1 ring-white/25 hover:bg-white/20">
              Sell your item
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 pt-8" aria-labelledby="how">
        <h2 id="how" className="sr-only">How it works</h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3 rounded-xl border border-black/5 bg-white p-4 shadow-sm">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-gray-900">{s.title}</p>
                <p className="text-sm text-gray-600">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {featured.items.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-10">
          <SectionHeading title="Featured" href="/items" />
          <ItemGrid items={featured.items} priorityCount={2} />
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pt-10">
        <SectionHeading title="Shop by category" />
        <CategoryGrid categories={categories} />
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-10">
        <SectionHeading title="Newest items" href="/items" />
        {newest.items.length > 0 ? (
          <ItemGrid items={newest.items} priorityCount={featured.items.length ? 0 : 2} />
        ) : (
          <EmptyState
            title="New items are on the way"
            text="We post fresh items regularly. Check back soon, or tell us what you're looking for on WhatsApp."
          />
        )}
      </section>

      {reviews.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-10">
          <SectionHeading title="What customers say" />
          <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
            {reviews.map((r) => (
              <li key={r.id} className="w-[80%] shrink-0 snap-start rounded-xl border border-black/5 bg-white p-4 shadow-sm sm:w-auto">
                <p className="text-amber-500" aria-label={`${r.rating} out of 5 stars`}>
                  {'★'.repeat(r.rating)}
                  <span className="text-gray-300">{'★'.repeat(5 - r.rating)}</span>
                </p>
                <blockquote className="mt-2 text-sm leading-relaxed text-gray-700">“{r.text}”</blockquote>
                <p className="mt-2 text-sm font-semibold text-gray-900">{r.name}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sell CTA */}
      <section className="mx-auto max-w-6xl px-4 pt-10">
        <div className="rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200 sm:flex sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Decluttering? Let us sell it for you.</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-gray-700">
              {['Send photos and your price', 'We post it and handle enquiries', 'Buyers inspect, then pay'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-brand-600" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <Link
            href="/sell"
            className="mt-5 inline-block rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800 sm:mt-0"
          >
            Sell your item
          </Link>
        </div>
      </section>
    </>
  );
}
