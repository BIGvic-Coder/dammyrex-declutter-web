import Link from 'next/link';
import type { ItemFilters } from '@/lib/api';
import { CONDITION_LABEL } from '@/lib/format';
import type { Category, ItemCondition } from '@/lib/types';
import { SearchIcon } from './icons';

const input =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20';

/**
 * Plain GET form, so filtering works without any JavaScript (fast on low-end phones).
 * Search is always visible; the other filters fold away on mobile.
 */
export function Filters({ categories, filters }: { categories: Category[]; filters: ItemFilters }) {
  const activeCount = [filters.category, filters.condition, filters.minPrice, filters.maxPrice, filters.area].filter(
    Boolean,
  ).length;

  return (
    <form action="/items" method="get" className="space-y-3" role="search">
      <div className="flex gap-2">
        <label htmlFor="q" className="sr-only">Search</label>
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input id="q" name="q" type="search" defaultValue={filters.q} placeholder="Search items" className={`${input} pl-10`} />
        </div>
        <button type="submit" className="rounded-lg bg-brand-700 px-4 font-semibold text-white hover:bg-brand-800">
          Go
        </button>
      </div>

      <details className="group rounded-xl border border-black/5 bg-white shadow-sm" open={activeCount > 0}>
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 [&::-webkit-details-marker]:hidden">
          <span>
            Filters{activeCount > 0 && <span className="ml-1.5 rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">{activeCount}</span>}
          </span>
          <span className="text-gray-400 transition group-open:rotate-180" aria-hidden="true">▾</span>
        </summary>
        <div className="grid grid-cols-2 gap-3 border-t border-black/5 p-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
            <label htmlFor="category" className="mb-1 block text-xs font-medium text-gray-600">Category</label>
            <select id="category" name="category" defaultValue={filters.category ?? ''} className={input}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="condition" className="mb-1 block text-xs font-medium text-gray-600">Condition</label>
            <select id="condition" name="condition" defaultValue={filters.condition ?? ''} className={input}>
              <option value="">Any condition</option>
              {(Object.keys(CONDITION_LABEL) as ItemCondition[]).map((c) => (
                <option key={c} value={c}>{CONDITION_LABEL[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="minPrice" className="mb-1 block text-xs font-medium text-gray-600">Min price (₦)</label>
            <input id="minPrice" name="minPrice" type="number" inputMode="numeric" min={0} step={1000} defaultValue={filters.minPrice} placeholder="0" className={input} />
          </div>
          <div>
            <label htmlFor="maxPrice" className="mb-1 block text-xs font-medium text-gray-600">Max price (₦)</label>
            <input id="maxPrice" name="maxPrice" type="number" inputMode="numeric" min={0} step={1000} defaultValue={filters.maxPrice} placeholder="Any" className={input} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="area" className="mb-1 block text-xs font-medium text-gray-600">Area</label>
            <input id="area" name="area" type="text" defaultValue={filters.area} placeholder="e.g. Ikeja" className={input} />
          </div>
          <div className="col-span-2 flex gap-2 sm:col-span-3 lg:col-span-6">
            <button type="submit" className="flex-1 rounded-lg bg-brand-700 py-2.5 font-semibold text-white hover:bg-brand-800 sm:flex-none sm:px-6">
              Apply filters
            </button>
            {activeCount > 0 && (
              <Link href={filters.q ? `/items?q=${encodeURIComponent(filters.q)}` : '/items'} className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50">
                Clear
              </Link>
            )}
          </div>
        </div>
      </details>
    </form>
  );
}
