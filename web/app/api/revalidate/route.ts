import { revalidatePath, revalidateTag } from 'next/cache';
import { API_URL, CATALOG_TAG } from '@/lib/api';

/**
 * POST /api/revalidate with the admin's "Authorization: Bearer <token>".
 * Clears the cached catalog so admin changes are visible on the public site straight away.
 * The token is checked by the API (GET /admin/me), so the website needs no extra secret,
 * and a logged-out visitor can't use this to hammer the API through the cache.
 */
export async function POST(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  if (!/^Bearer \S+$/.test(auth)) return Response.json({ message: 'Please log in' }, { status: 401 });

  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/me`, { headers: { authorization: auth }, cache: 'no-store' });
  } catch {
    return Response.json({ message: 'API unreachable' }, { status: 502 });
  }
  if (!res.ok) return Response.json({ message: 'Please log in' }, { status: 401 });

  revalidateTag(CATALOG_TAG);
  // Pages with their own ISR window (home, sitemap) are rebuilt on the next visit
  revalidatePath('/', 'layout');
  return Response.json({ revalidated: true });
}
