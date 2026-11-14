import type { AdPlacement } from './types';

/**
 * Google AdSense IDs (optional, set in Vercel). AdSense only ever loads when these are set
 * AND the CEO has switched it on in Admin → Ads, and only in spots with no self-managed ad.
 */
export const ADSENSE_CLIENT = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '').trim();
export const ADSENSE_SLOTS: Record<AdPlacement, string> = {
  HOME_BANNER: (process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME ?? '').trim(),
  LISTING_CARD: (process.env.NEXT_PUBLIC_ADSENSE_SLOT_LISTING ?? '').trim(),
  ITEM_PAGE: (process.env.NEXT_PUBLIC_ADSENSE_SLOT_ITEM ?? '').trim(),
};

/** True when something will actually render in this spot. */
export function adSpotFilled(placement: AdPlacement, adCount: number, adsenseEnabled: boolean): boolean {
  return adCount > 0 || (adsenseEnabled && Boolean(ADSENSE_CLIENT && ADSENSE_SLOTS[placement]));
}
