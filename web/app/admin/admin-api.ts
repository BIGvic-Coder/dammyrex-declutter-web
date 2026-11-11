// Typed client for the admin endpoints. Browser-only.
import { API_URL, RequestError } from '@/lib/client';
import type { Category, Item, ItemCondition, ItemStatus } from '@/lib/types';

export type InspectionStatus = 'REQUESTED' | 'CONFIRMED' | 'DONE' | 'CANCELLED';

export interface AdminItem extends Omit<Item, 'category'> {
  categoryId: string;
  addressPrivate: string;
  category: { id: string; name: string; slug: string };
  seller: { id: string; name: string; phone: string; area: string };
  _count: { inspections: number };
}

export interface AdminInspection {
  id: string;
  itemId: string;
  buyerName: string;
  buyerPhone: string;
  slotAt: string;
  status: InspectionStatus;
  note: string | null;
  createdAt: string;
  item: {
    id: string;
    title: string;
    price: number;
    status: ItemStatus;
    area: string;
    addressPrivate: string;
    images: { url: string }[];
    seller: { name: string; phone: string };
  };
}

interface PageInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export type ItemPage = PageInfo & { items: AdminItem[] };
export type InspectionPage = PageInfo & { inspections: AdminInspection[] };

export interface Stats {
  items: Record<ItemStatus, number>;
  inspections: Record<InspectionStatus, number>;
  soldLast30Days: { count: number; value: number };
  upcomingConfirmedInspections7Days: number;
  featuredLive: number;
  sellers: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'STAFF';
}

export type ItemPatch = Partial<{
  title: string;
  description: string;
  categoryId: string;
  price: number;
  condition: ItemCondition;
  area: string;
  addressPrivate: string;
  featured: boolean;
}>;

function message(status: number, body: unknown): string {
  if (status === 0) return 'Cannot reach the server. Check your connection.';
  if (status === 429) return 'Too many attempts. Wait a minute and try again.';
  const m = (body as { message?: unknown } | null)?.message;
  const first = Array.isArray(m) ? m[0] : m;
  return typeof first === 'string' && first ? first : `Request failed (${status})`;
}

async function call<T>(method: string, path: string, token: string | null, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new RequestError(0, message(0, null));
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new RequestError(res.status, message(res.status, data));
  return data as T;
}

export const login = (email: string, password: string) =>
  call<{ token: string; admin: AdminUser }>('POST', '/admin/login', null, { email, password });

/** All calls below need a token; a 401 means the session expired. */
export function adminApi(token: string) {
  const qs = (o: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    Object.entries(o).forEach(([k, v]) => v !== undefined && v !== '' && p.set(k, String(v)));
    const s = p.toString();
    return s ? `?${s}` : '';
  };
  return {
    stats: () => call<Stats>('GET', '/admin/stats', token),
    categories: () => call<Category[]>('GET', '/categories', null),
    items: (o: { status?: ItemStatus; q?: string; page?: number; limit?: number }) =>
      call<ItemPage>('GET', `/admin/items${qs(o)}`, token),
    updateItem: (id: string, patch: ItemPatch) => call<AdminItem>('PATCH', `/admin/items/${id}`, token, patch),
    setStatus: (id: string, status: ItemStatus) => call<AdminItem>('PATCH', `/admin/items/${id}/status`, token, { status }),
    deleteItem: (id: string) => call<{ deleted: boolean }>('DELETE', `/admin/items/${id}`, token),
    inspections: (o: { status?: InspectionStatus; page?: number }) =>
      call<InspectionPage>('GET', `/admin/inspections${qs(o)}`, token),
    updateInspection: (id: string, patch: { status?: InspectionStatus; slotAt?: string; note?: string }) =>
      call<AdminInspection>('PATCH', `/admin/inspections/${id}`, token, patch),
  };
}
export type AdminApi = ReturnType<typeof adminApi>;
