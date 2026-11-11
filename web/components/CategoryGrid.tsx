import Link from 'next/link';
import type { Category } from '@/lib/types';

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
      {categories.map((c) => (
        <li key={c.id}>
          <Link
            href={`/items?category=${c.slug}`}
            className="flex h-full flex-col items-center gap-1 rounded-xl border border-black/5 bg-white px-2 py-3 text-center shadow-sm transition hover:border-brand-600/40 hover:shadow-md"
          >
            <span className="text-2xl" aria-hidden="true">{c.icon}</span>
            <span className="text-xs font-semibold leading-tight text-gray-800 sm:text-sm">{c.name}</span>
            <span className="text-[11px] text-gray-500">
              {c.itemCount} item{c.itemCount === 1 ? '' : 's'}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
