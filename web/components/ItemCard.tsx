import Image from 'next/image';
import Link from 'next/link';
import { CONDITION_LABEL, formatNaira } from '@/lib/format';
import type { Item } from '@/lib/types';
import { PinIcon } from './icons';
import { StatusBadge } from './StatusBadge';

export function ItemCard({ item, priority = false }: { item: Item; priority?: boolean }) {
  const cover = item.images[0];
  const sold = item.status === 'SOLD';
  return (
    <Link
      href={`/items/${item.id}`}
      className="group flex w-full flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {cover ? (
          <Image
            src={cover.url}
            alt={item.title}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className={`object-cover ${sold ? 'opacity-60 grayscale' : ''}`}
          />
        ) : (
          <div className="grid h-full place-items-center text-3xl" aria-hidden="true">
            {item.category.icon}
          </div>
        )}
        {item.status !== 'AVAILABLE' && <StatusBadge status={item.status} className="absolute left-2 top-2" />}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-base font-bold text-brand-800 sm:text-lg">{formatNaira(item.price)}</p>
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-gray-900">{item.title}</h3>
        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-xs text-gray-500">
          <span className="inline-flex items-center gap-0.5">
            <PinIcon className="h-3.5 w-3.5" />
            <span className="max-w-[9rem] truncate">{item.area}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>{CONDITION_LABEL[item.condition]}</span>
        </div>
      </div>
    </Link>
  );
}

export function ItemGrid({ items, priorityCount = 0 }: { items: Item[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item, i) => (
        <li key={item.id} className="flex">
          <ItemCard item={item} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
