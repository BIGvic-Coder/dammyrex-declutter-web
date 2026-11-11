import Link from 'next/link';
import { toQueryString, type ItemFilters } from '@/lib/api';

export function Pagination({ page, totalPages, filters }: { page: number; totalPages: number; filters: ItemFilters }) {
  if (totalPages <= 1) return null;
  const href = (p: number) => `/items${toQueryString({ ...filters, page: p > 1 ? String(p) : undefined })}`;
  const btn = 'rounded-lg px-4 py-2.5 text-sm font-semibold ring-1 ring-gray-300';

  return (
    <nav className="mt-8 flex items-center justify-between gap-2" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={`${btn} bg-white text-gray-800 hover:bg-gray-50`}>← Previous</Link>
      ) : (
        <span className={`${btn} cursor-not-allowed text-gray-300`} aria-disabled="true">← Previous</span>
      )}
      <span className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={href(page + 1)} rel="next" className={`${btn} bg-white text-gray-800 hover:bg-gray-50`}>Next →</Link>
      ) : (
        <span className={`${btn} cursor-not-allowed text-gray-300`} aria-disabled="true">Next →</span>
      )}
    </nav>
  );
}
