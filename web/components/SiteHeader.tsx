import Link from 'next/link';
import { whatsappLink } from '@/lib/site';
import { WhatsAppIcon } from './icons';

export function SiteHeader({ whatsapp }: { whatsapp: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-brand-800">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-700 text-sm font-extrabold text-white">
            DR
          </span>
          <span className="text-[15px] leading-tight sm:text-base">
            DammyRex<span className="hidden font-semibold text-brand-600 min-[380px]:inline"> Declutter</span>
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm font-medium" aria-label="Main">
          <Link href="/items" className="rounded-lg px-2.5 py-2 text-gray-700 hover:bg-gray-100">
            Browse
          </Link>
          <Link href="/sell" className="rounded-lg px-2.5 py-2 text-gray-700 hover:bg-gray-100">
            Sell
          </Link>
          {whatsapp && (
            <a
              href={whatsappLink('Hi DammyRex, I have a question.', whatsapp)}
              className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-whatsapp px-3 py-2 text-white hover:bg-whatsapp-dark"
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
