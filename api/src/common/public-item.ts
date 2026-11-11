import { Prisma } from '@prisma/client';

/** Sold items stay publicly visible (with a Sold badge) for this long after soldAt. */
export const SOLD_VISIBLE_DAYS = 7;

/**
 * The ONLY fields ever returned for an item on public routes.
 * Deliberately excludes addressPrivate, sellerId and the seller relation.
 * Every public query must use this select, never `include`.
 */
export const publicItemSelect = {
  id: true,
  title: true,
  description: true,
  price: true,
  condition: true,
  area: true,
  status: true,
  featured: true,
  soldAt: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true, icon: true } },
  images: {
    select: { id: true, url: true, position: true },
    orderBy: { position: 'asc' },
  },
} satisfies Prisma.ItemSelect;

export type PublicItem = Prisma.ItemGetPayload<{ select: typeof publicItemSelect }>;

/** Items the public may see: available, reserved, or sold within the last 7 days. */
export function publicVisibleWhere(now = new Date()): Prisma.ItemWhereInput {
  const soldCutoff = new Date(now.getTime() - SOLD_VISIBLE_DAYS * 24 * 60 * 60 * 1000);
  return {
    OR: [
      { status: { in: ['AVAILABLE', 'RESERVED'] } },
      { status: 'SOLD', soldAt: { gte: soldCutoff } },
    ],
  };
}
