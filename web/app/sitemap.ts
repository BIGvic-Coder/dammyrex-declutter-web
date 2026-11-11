import type { MetadataRoute } from 'next';
import { getItems } from '@/lib/api';
import type { Item } from '@/lib/types';
import { SITE_URL } from '@/lib/site';

// Rebuilt at most once an hour.
export const revalidate = 3600;

const PAGE_SIZE = 48; // API maximum
const MAX_PAGES = 100; // safety cap: up to 4,800 items

/** All items currently for sale (available or reserved). Sold items drop off after 7 days anyway. */
async function liveItems(): Promise<Item[]> {
  const all: Item[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await getItems({ page: String(page), limit: String(PAGE_SIZE) });
    all.push(...res.items);
    if (page >= res.totalPages || res.items.length === 0) break;
  }
  return all.filter((i) => i.status === 'AVAILABLE' || i.status === 'RESERVED');
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items = await liveItems();
  const newest = items[0]?.updatedAt ? new Date(items[0].updatedAt) : new Date();
  // Category pages worth indexing = categories that have live items right now
  // (derived from the same item list, so it can never disagree with it).
  const categories = [...new Map(items.map((i) => [i.category.slug, i.category])).values()];

  return [
    { url: `${SITE_URL}/`, lastModified: newest, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/items`, lastModified: newest, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/sell`, changeFrequency: 'monthly', priority: 0.6 },
    ...categories.map((c) => ({
        url: `${SITE_URL}/items?category=${c.slug}`,
        lastModified: newest,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      })),
    ...items.map((i) => ({
      url: `${SITE_URL}/items/${i.id}`,
      lastModified: new Date(i.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      images: i.images.slice(0, 1).map((img) => img.url),
    })),
  ];
}
