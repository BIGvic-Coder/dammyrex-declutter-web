'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { ADSENSE_CLIENT, ADSENSE_SLOTS, adSpotFilled } from '@/lib/adsense';
import { API_URL } from '@/lib/client';
import { cldUrl } from '@/lib/cloudinary-loader';
import type { AdPlacement, PublicAd } from '@/lib/types';

/**
 * Picks the next ad for this spot, round-robin per browser tab, so several advertisers
 * booked for the same placement take turns.
 */
function pickIndex(placement: AdPlacement, count: number): number {
  try {
    const key = `dr-ad-${placement}`;
    const n = Number(sessionStorage.getItem(key) ?? Math.floor(Math.random() * count));
    sessionStorage.setItem(key, String(n + 1));
    return n % count;
  } catch {
    return Math.floor(Math.random() * count);
  }
}

/**
 * One advert spot. Server-rendered as an empty box of the final size (no layout shift),
 * then the browser picks which ad to show. Images are lazy-loaded, nothing pops up or
 * covers content, and every ad carries a visible "Sponsored" label.
 *
 * Self-managed ads always win. If none is booked for this spot and the CEO has switched
 * AdSense on (and the AdSense IDs are set), a Google ad fills it instead.
 */
export function AdSlot({
  placement,
  ads,
  adsenseEnabled,
  variant = 'banner',
  className = '',
}: {
  placement: AdPlacement;
  ads: PublicAd[];
  adsenseEnabled: boolean;
  variant?: 'banner' | 'card';
  className?: string;
}) {
  const [ad, setAd] = useState<PublicAd | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Double-check the end date in the browser (the page may be cached for a few minutes)
    const live = ads.filter((a) => new Date(a.endsAt).getTime() > Date.now());
    setAd(live.length ? live[pickIndex(placement, live.length)] : null);
    setReady(true);
  }, [ads, placement]);

  if (!adSpotFilled(placement, ads.length, adsenseEnabled)) return null;
  const useAdsense = !ads.length;
  if (ready && !ad && !useAdsense) return null;

  return (
    <aside aria-label="Sponsored" className={`relative ${className}`}>
      {useAdsense ? (
        <AdSenseUnit slot={ADSENSE_SLOTS[placement]} variant={variant} />
      ) : variant === 'card' ? (
        <AdCard ad={ad} />
      ) : (
        <AdBanner ad={ad} />
      )}
    </aside>
  );
}

function SponsoredLabel() {
  return (
    <span className="pointer-events-none absolute left-2 top-2 z-10 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-700 shadow-sm">
      Sponsored
    </span>
  );
}

/** Counts one impression when at least half the ad has been on screen. */
function useImpression(ad: PublicAd | null) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!ad || !el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          const url = `${API_URL}/ads/${encodeURIComponent(ad.id)}/impression`;
          if (!navigator.sendBeacon?.(url)) fetch(url, { method: 'POST', keepalive: true, mode: 'no-cors' }).catch(() => {});
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ad]);
  return ref;
}

const clickUrl = (ad: PublicAd) => `${API_URL}/ads/${encodeURIComponent(ad.id)}/click`;
const altText = (ad: PublicAd) => (ad.headline ? `${ad.headline} (ad by ${ad.advertiser})` : `Advert: ${ad.advertiser}`);

/** Wide banner: 4:1 on desktop; on phones 2:1 if a phone image was uploaded. */
function AdBanner({ ad }: { ad: PublicAd | null }) {
  const ref = useImpression(ad);
  const hasMobile = Boolean(ad?.imageMobile);
  const box = `block overflow-hidden rounded-xl bg-gray-100 ring-1 ring-black/5 ${hasMobile ? 'aspect-[2/1] sm:aspect-[4/1]' : 'aspect-[4/1]'}`;
  if (!ad) return <div className={`${box} ad-fade`} aria-hidden="true" />;
  return (
    <a ref={ref} href={clickUrl(ad)} target="_blank" rel="sponsored noopener" className={`${box} ad-fade relative`}>
      <SponsoredLabel />
      <picture>
        {ad.imageMobile && <source media="(max-width: 639px)" srcSet={cldUrl(ad.imageMobile, { width: 800 })} />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cldUrl(ad.imageDesktop, { width: 1280 })}
          alt={altText(ad)}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </picture>
    </a>
  );
}

/** Same footprint as an item card so the listings grid stays even. */
function AdCard({ ad }: { ad: PublicAd | null }) {
  const ref = useImpression(ad);
  const shell = 'flex h-full w-full flex-col overflow-hidden rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm';
  if (!ad) return <div className={`${shell} ad-fade`} aria-hidden="true"><div className="aspect-[4/3] bg-gray-100" /></div>;
  return (
    <a ref={ref} href={clickUrl(ad)} target="_blank" rel="sponsored noopener" className={`${shell} ad-fade relative transition hover:shadow-md`}>
      <SponsoredLabel />
      <div className="relative aspect-[4/3] bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cldUrl(ad.imageMobile ?? ad.imageDesktop, { width: 480, height: 360, crop: 'fill' })} alt={altText(ad)} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-sm font-bold text-gray-900">{ad.advertiser}</p>
        {ad.headline && <p className="line-clamp-2 text-sm leading-snug text-gray-700">{ad.headline}</p>}
        <p className="mt-auto pt-1 text-xs font-semibold text-brand-700">Learn more →</p>
      </div>
    </a>
  );
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

function AdSenseUnit({ slot, variant }: { slot: string; variant: 'banner' | 'card' }) {
  const pushed = useRef(false);
  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gray-50 ring-1 ring-black/5 ${variant === 'card' ? 'h-full min-h-64' : 'min-h-24'}`}>
      <SponsoredLabel />
      <Script
        id="adsbygoogle-js"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        strategy="lazyOnload"
        crossOrigin="anonymous"
      />
      <ins
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={variant === 'card' ? 'rectangle' : 'horizontal'}
        data-full-width-responsive="true"
      />
    </div>
  );
}
