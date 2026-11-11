'use client';

import { useEffect, useState } from 'react';
import { ShareIcon, WhatsAppIcon } from './icons';

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const text = `${title} on DammyRex Declutter`;
  const enc = encodeURIComponent;
  const btn =
    'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-gray-300 bg-white text-gray-800 hover:bg-gray-50';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', url);
    }
  };

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-gray-800">Share this item</p>
      <div className="flex flex-wrap gap-2">
        {canNativeShare && (
          <button type="button" className={btn} onClick={() => navigator.share({ title, text, url }).catch(() => {})}>
            <ShareIcon className="h-4 w-4" /> Share
          </button>
        )}
        <a className={btn} href={`https://wa.me/?text=${enc(`${text}\n${url}`)}`} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> WhatsApp
        </a>
        <a className={btn} href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer">
          Facebook
        </a>
        <a className={btn} href={`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`} target="_blank" rel="noopener noreferrer">
          X
        </a>
        <button type="button" className={btn} onClick={copy}>
          {copied ? 'Link copied ✓' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}
