import Link from 'next/link';
import { SITE_NAME, whatsappLink } from '@/lib/site';

export function SiteFooter({ whatsapp }: { whatsapp: string }) {
  return (
    <footer className="mt-12 border-t border-black/5 bg-brand-900 text-brand-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-white">{SITE_NAME}</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-100/80">
            Neatly used home items from people decluttering. Inspect in person, pay only if you like it.
          </p>
        </div>
        <nav aria-label="Footer" className="text-sm">
          <p className="font-semibold text-white">Shop</p>
          <ul className="mt-2 space-y-2">
            <li><Link href="/items" className="hover:text-white">Browse all items</Link></li>
            <li><Link href="/items?category=fridges" className="hover:text-white">Fridges</Link></li>
            <li><Link href="/items?category=gas-cookers" className="hover:text-white">Gas cookers</Link></li>
            <li><Link href="/sell" className="hover:text-white">Sell your item</Link></li>
          </ul>
        </nav>
        <div className="text-sm">
          <p className="font-semibold text-white">Talk to us</p>
          {whatsapp ? (
            <a
              href={whatsappLink('Hi DammyRex, I have a question.', whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block underline underline-offset-4 hover:text-white"
            >
              Chat on WhatsApp
            </a>
          ) : null}
          <p className="mt-3 text-brand-100/70">Never pay before you inspect an item.</p>
        </div>
      </div>
      <p className="border-t border-white/10 py-4 text-center text-xs text-brand-100/60">
        © {new Date().getFullYear()} {SITE_NAME}
      </p>
    </footer>
  );
}
