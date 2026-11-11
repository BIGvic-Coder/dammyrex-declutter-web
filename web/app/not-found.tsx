import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false } };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-5xl" aria-hidden="true">📦</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 text-gray-600">
        The page or item you&apos;re looking for may have been sold or removed. There are plenty more to look at.
      </p>
      <Link href="/items" className="mt-6 inline-block rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800">
        Browse items
      </Link>
    </div>
  );
}
