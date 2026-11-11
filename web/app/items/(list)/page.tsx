import type { Metadata } from 'next';
import { EmptyState } from '@/components/EmptyState';
import { Filters } from '@/components/Filters';
import { ItemGrid } from '@/components/ItemCard';
import { Pagination } from '@/components/Pagination';
import { getCategories, getItems, type ItemFilters } from '@/lib/api';
import { CONDITION_LABEL } from '@/lib/format';
import { pageMetadata } from '@/lib/seo';
import type { ItemCondition } from '@/lib/types';

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
  const cat = categories.find((c) => c.slug === f.category);
  const title = cat ? `Used ${cat.name} for sale in Nigeria` : f.q ? `Search: ${f.q}` : 'Browse used home items for sale';
  return pageMetadata({
    title,
    description: cat
      ? `Neatly used ${cat.name.toLowerCase()} for sale${cat.itemCount ? ` (${cat.itemCount} available)` : ''}. Inspect in person before you pay. Chat on WhatsApp.`
      : 'Browse neatly used fridges, freezers, gas cookers, fans, ACs, beds, chairs and tables in Nigeria. Inspect before you pay.',
    path: cat ? `/items?category=${cat.slug}` : '/items',
    // Don't index search results or deep filter combinations (thin/duplicate content)
    noindex: Boolean(f.q || f.page || f.minPrice || f.maxPrice || f.area || f.condition),
  });
}

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const filters = readFilters(await searchParams);
  const [categories, result] = await Promise.all([getCategories(), getItems(filters)]);
  const cat = categories.find((c) => c.slug === filters.category);
  const hasFilters = Object.keys(filters).some((k) => k !== 'page');

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        {cat ? `${cat.icon} ${cat.name}` : filters.q ? `Results for “${filters.q}”` : 'Browse items'}
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        {result.total} item{result.total === 1 ? '' : 's'}
        {filters.condition ? ` · ${CONDITION_LABEL[filters.condition as ItemCondition]}` : ''}
        {filters.area ? ` · near ${filters.area}` : ''}
      </p>

      <div className="mt-4">
        <Filters categories={categories} filters={filters} />
      </div>

      <div className="mt-6">
        {result.items.length > 0 ? (
          <>
            <ItemGrid items={result.items} priorityCount={2} />
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
