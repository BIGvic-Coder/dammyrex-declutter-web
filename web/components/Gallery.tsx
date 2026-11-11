'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import type { ItemImage } from '@/lib/types';

/**
 * Swipeable photo gallery using native CSS scroll-snap (smooth on low-end phones),
 * with thumbnails to jump between photos. Only the first photo loads eagerly.
 */
export function Gallery({ images, title, dimmed = false }: { images: ItemImage[]; title: string; dimmed?: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return <div className="aspect-[4/3] rounded-xl bg-gray-100" aria-label="No photos" />;
  }

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl bg-gray-100">
        <div
          ref={track}
          onScroll={onScroll}
          className="no-scrollbar flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto"
          aria-roledescription="carousel"
          aria-label={`${title} photos`}
        >
          {images.map((img, i) => (
            <div key={img.id} className="relative h-full w-full shrink-0 snap-center" aria-label={`Photo ${i + 1} of ${images.length}`}>
              <Image
                src={img.url}
                alt={i === 0 ? title : `${title}, photo ${i + 1}`}
                fill
                priority={i === 0}
                loading={i === 0 ? undefined : 'lazy'}
                sizes="(min-width: 1024px) 600px, 100vw"
                className={`object-contain ${dimmed ? 'opacity-70 grayscale' : ''}`}
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
            {index + 1} / {images.length}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <ul className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <li key={img.id} className="shrink-0">
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={`relative block h-14 w-14 overflow-hidden rounded-lg ring-2 ${i === index ? 'ring-brand-600' : 'ring-transparent'}`}
              >
                <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
