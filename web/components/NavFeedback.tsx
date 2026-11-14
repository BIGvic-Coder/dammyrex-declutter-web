'use client';

import { useEffect } from 'react';

const FLAG = 'nav';
const clear = () => {
  delete document.documentElement.dataset[FLAG];
};

/**
 * When a visitor submits a search/filter or follows a listings link, dim the current results
 * straight away (CSS: html[data-nav] .results) so the change feels instant on slow networks.
 * Mounted once in the header.
 */
export function NavFeedback() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const start = () => {
      document.documentElement.dataset[FLAG] = '1';
      clearTimeout(timer);
      timer = setTimeout(clear, 8000); // never leave the page dimmed if navigation fails
    };
    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (form.method === 'get' && new URL(form.action, location.href).pathname === '/items') start();
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as Element).closest?.('a');
      if (!a || a.target === '_blank') return;
      const url = new URL(a.href, location.href);
      if (url.origin === location.origin && url.pathname === '/items' && url.href !== location.href) start();
    };
    document.addEventListener('submit', onSubmit);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('submit', onSubmit);
      document.removeEventListener('click', onClick);
      clearTimeout(timer);
    };
  }, []);
  return null;
}

/** Rendered with the new results: clears the dimming. */
export function NavDone() {
  useEffect(clear, []);
  return null;
}
