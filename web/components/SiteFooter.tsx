import Link from 'next/link';
import { SITE_NAME, whatsappLink } from '@/lib/site';
import { SITE_CONFIG, shopHref } from '@/lib/site-config';
import { CurrentYear } from './CurrentYear';
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from './icons';

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  { title: 'Shop', links: SITE_CONFIG.shopLinks.map((l) => ({ label: l.label, href: shopHref(l.categories) })) },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Contact', href: '/contact' },
      { label: 'Sell Your Item', href: '/sell' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'FAQs', href: '/faq' },
      { label: 'Delivery Information', href: '/delivery' },
      { label: 'Inspection & Returns Policy', href: '/inspection-returns' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
];

const linkCls = 'inline-block py-1.5 text-sm text-brand-100/90 transition-colors hover:text-brand-300 focus-visible:text-white';

/**
 * Site-wide footer. Multi-column on desktop; on phones the brand + social block sits on top
 * and the link columns fold into a two-column grid (no JavaScript needed).
 */
export function SiteFooter({ whatsapp }: { whatsapp: string }) {
  const { social } = SITE_CONFIG;
  const socials = [
    { label: 'Chat with DammyRex on WhatsApp', href: whatsappLink('Hi DammyRex, I have a question.', whatsapp), Icon: WhatsAppIcon },
    { label: 'DammyRex on Instagram', href: social.instagram, Icon: InstagramIcon },
    { label: 'DammyRex on Facebook', href: social.facebook, Icon: FacebookIcon },
    { label: 'DammyRex on TikTok', href: social.tiktok, Icon: TikTokIcon },
  ].filter((s) => s.href);

  return (
    <footer className="mt-16 bg-navy text-brand-100" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Site footer
      </h2>
      <div className="h-1 bg-gradient-to-r from-brand-600 via-brand-300 to-amber-300" aria-hidden="true" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1.4fr_3fr] lg:gap-12">
        {/* Brand + follow us */}
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label={`${SITE_NAME} home`}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white font-display text-base text-brand-800">DR</span>
            <span className="font-display text-xl leading-tight tracking-tight text-white">
              DammyRex <span className="text-brand-300">Declutter</span>
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-brand-100/80">{SITE_CONFIG.tagline}</p>

          <p className="mt-6 text-xs font-bold uppercase tracking-widest text-white">Follow Us</p>
          <ul className="mt-3 flex gap-2">
            {socials.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-brand-600 hover:ring-brand-300"
                >
                  <Icon className="h-5 w-5" />
                </a>
              </li>
            ))}
          </ul>
          <a
            href={whatsappLink('Hi DammyRex, I have a question.', whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-whatsapp px-4 text-sm font-semibold text-white transition hover:bg-whatsapp-dark"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Chat with us on WhatsApp · {SITE_CONFIG.phoneDisplay}
          </a>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-xs font-bold uppercase tracking-widest text-white">{col.title}</p>
              <ul className="mt-3 space-y-0.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={linkCls}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-brand-100/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CurrentYear /> {SITE_NAME}. All rights reserved.
          </p>
          <p>Inspect before you pay. Never send money for an item you haven&apos;t seen.</p>
        </div>
      </div>
    </footer>
  );
}
