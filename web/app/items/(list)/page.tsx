import type { Metadata } from 'next';
import { AdSlot } from '@/components/AdSlot';
import { EmptyState } from '@/components/EmptyState';
import { Filters } from '@/components/Filters';
import { ItemGrid } from '@/components/ItemCard';
import { NavDone } from '@/components/NavFeedback';
import { Pagination } from '@/components/Pagination';
import { adSpotFilled } from '@/lib/adsense';
import { getAdsFor, getCategories, getItems, type ItemFilters } from '@/lib/api';
import { CONDITION_LABEL } from '@/lib/format';
import { pageMetadata } from '@/lib/seo';
import type { Category, ItemCondition } from '@/lib/types';

/** Sponsored card goes after this many items. */
const AD_EVERY = 8;

/** "fridges,freezers" -> the matching categories (footer links can name several). */
function selectedCategories(categories: Category[], slug?: string): Category[] {
  if (!slug) return [];
  const slugs = slug.split(',');
  return categories.filter((c) => slugs.includes(c.slug));
}

const joinNames = (cats: Category[]) => cats.map((c) => c.name).join(' & ');

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const KEYS = ['category', 'minPrice', 'maxPrice', 'area', 'condition', 'q', 'page'] as const;

/** Keep only known, sane params so bad URLs can't produce API 400s. */
function readFilters(sp: Record<string, string | string[] | undefined>): ItemFilters {
  const f: ItemFilters = {};
  for (const k of KEYS) {
    const raw = sp[k];
    const v = (Array.isArray(raw) ? raw[0] : raw)?.trim();
    if (!v) continue;
    if ((k === 'minPrice' || k === 'maxPrice' || k === 'page') && !/^\d{1,9}$/.test(v)) continue;
    if (k === 'condition' && !(v in CONDITION_LABEL)) continue;
    if (k === 'page' && v === '1') continue;
    f[k] = v.slice(0, 100);
  }
  return f;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const f = readFilters(await searchParams);
  const categories = f.category ? await getCategories() : [];
  const cats = selectedCategories(categories, f.category);
  const name = joinNames(cats);
  const count = cats.reduce((n, c) => n + c.itemCount, 0);
  const title = cats.length ? `Used ${name} for sale in Nigeria` : f.q ? `Search: ${f.q}` : 'Browse used home items for sale';
  return pageMetadata({
    title,
    description: cats.length
      ? `Neatly used ${name.toLowerCase()} for sale${count ? ` (${count} available)` : ''}. Inspect in person before you pay. Chat on WhatsApp.`
      : 'Browse neatly used fridges, freezers, gas cookers, fans, ACs, beds, chairs and tables in Nigeria. Inspect before you pay.',
    path: cats.length ? `/items?category=${cats.map((c) => c.slug).join(',')}` : '/items',
    // Don't index search results or deep filter combinations (thin/duplicate content)
    noindex: Boolean(f.q || f.page || f.minPrice || f.maxPrice || f.area || f.condition),
  });
}

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const filters = readFilters(await searchParams);
  const [categories, result, listingAds] = await Promise.all([getCategories(), getItems(filters), getAdsFor('LISTING_CARD')]);
  const cats = selectedCategories(categories, filters.category);
  const hasFilters = Object.keys(filters).some((k) => k !== 'page');
  // Re-mounting the grid on every new query replays the fade-in
  const resultsKey = JSON.stringify(filters);
  // One Sponsored card after AD_EVERY items (or at the end of a shorter page); never on empty results
  const showAd = adSpotFilled('LISTING_CARD', listingAds.ads.length, listingAds.adsenseEnabled);
  const adInsert =
    showAd && result.items.length >= 2
      ? {
          at: Math.min(AD_EVERY, result.items.length),
          node: <AdSlot placement="LISTING_CARD" variant="card" ads={listingAds.ads} adsenseEnabled={listingAds.adsenseEnabled} className="flex w-full" />,
        }
      : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        {cats.length === 1 ? `${cats[0].icon} ${cats[0].name}` : cats.length ? joinNames(cats) : filters.q ? `Results for “${filters.q}”` : 'Browse items'}
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        {result.total} item{result.total === 1 ? '' : 's'}
        {filters.condition ? ` · ${CONDITION_LABEL[filters.condition as ItemCondition]}` : ''}
        {filters.area ? ` · near ${filters.area}` : ''}
      </p>

      <div className="mt-4">
        <Filters categories={categories} filters={filters} />
      </div>

      <div className="results mt-6">
        <NavDone key={resultsKey} />
        {result.items.length > 0 ? (
          <>
            <ItemGrid key={resultsKey} items={result.items} priorityCount={2} insert={adInsert} />
            <Pagination page={result.page} totalPages={result.totalPages} filters={filters} />
          </>
        ) : hasFilters ? (
          <EmptyState
            title="No items match your search"
            text="Try removing a filter or searching for something more general."
            action={{ href: '/items', label: 'See all items' }}
          />
        ) : (
          <EmptyState title="No items yet" text="New items are posted regularly. Please check back soon." />
        )}
      </div>
    </div>
  );
}
