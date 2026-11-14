import Link from 'next/link';
import { whatsappLink } from '@/lib/site';
import { HeaderScroll } from './HeaderScroll';
import { WhatsAppIcon } from './icons';
import { NavFeedback } from './NavFeedback';

export function SiteHeader({ whatsapp }: { whatsapp: string }) {
  return (
    <header id="site-header" className="site-header sticky top-0 z-30 border-b border-black/5 bg-white/95 backdrop-blur">
      <HeaderScroll targetId="site-header" />
      <NavFeedback />
      <div className="header-bar mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-brand-800">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-700 font-display text-sm text-white">
            DR
          </span>
          <span className="text-[15px] leading-tight sm:text-base">
            <span className="font-display">DammyRex</span>
            <span className="hidden font-semibold text-brand-600 min-[380px]:inline"> Declutter</span>
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm font-medium" aria-label="Main">
          <Link href="/items" className="inline-flex min-h-11 items-center rounded-lg px-3 text-gray-700 hover:bg-gray-100">
            Browse
          </Link>
          <Link href="/sell" className="inline-flex min-h-11 items-center rounded-lg px-3 text-gray-700 hover:bg-gray-100">
            Sell
          </Link>
          {whatsapp && (
            <a
              href={whatsappLink('Hi DammyRex, I have a question.', whatsapp)}
              className="ml-1 inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg bg-whatsapp px-3 text-white hover:bg-whatsapp-dark"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with us on WhatsApp"
            >
              <WhatsAppIcon className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
