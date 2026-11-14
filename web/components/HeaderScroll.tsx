'use client';

import { useEffect } from 'react';

/** Adds data-scrolled to the sticky header after a little scrolling (CSS shrinks it + adds a shadow). */
export function HeaderScroll({ targetId }: { targetId: string }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    let raf = 0;
    let on = false;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      // Hysteresis so the header doesn't flicker around the threshold
      const next = on ? y > 8 : y > 48;
      if (next !== on) {
        on = next;
        if (on) el.dataset.scrolled = '';
        else delete el.dataset.scrolled;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [targetId]);
  return null;
}
