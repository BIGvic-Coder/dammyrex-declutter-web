import type { Category, Item, ItemList, Review } from './types';

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

async function apiGet<T>(path: string, revalidate: number): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate } });
  if (!res.ok) throw new ApiError(res.status, `GET ${path} failed with ${res.status}`);
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Never let a temporarily unreachable API crash a page; show an empty state instead. */
async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (e) {
    console.error('[api]', (e as Error).message);
    return fallback;
  }
}

const EMPTY_LIST: ItemList = { items: [], total: 0, page: 1, limit: 12, totalPages: 1 };

export type ItemFilters = {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  area?: string;
  condition?: string;
  q?: string;
  page?: string;
  featured?: string;
  limit?: string;
};

export function toQueryString(filters: ItemFilters): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== '') qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export const getCategories = () => safe(apiGet<Category[]>('/categories', 300), []);

export const getItems = (filters: ItemFilters = {}) =>
  safe(apiGet<ItemList>(`/items${toQueryString(filters)}`, 60), EMPTY_LIST);

export const getReviews = () => safe(apiGet<Review[]>('/reviews', 600), []);

/** Returns null when the item doesn't exist or is no longer public. */
export async function getItem(id: string): Promise<Item | null> {
  try {
    return await apiGet<Item>(`/items/${encodeURIComponent(id)}`, 30);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) return null;
    throw e;
  }
}
