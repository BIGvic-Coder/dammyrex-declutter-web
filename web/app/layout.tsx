import type { Metadata, Viewport } from 'next';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { DEFAULT_OG_IMAGE } from '@/lib/seo';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, whatsappNumber } from '@/lib/site';
import './globals.css';

const DEFAULT_TITLE = `${SITE_NAME} | Neatly used home items in Nigeria`;

// Fallbacks for any page that doesn't set its own (pages use lib/seo.ts pageMetadata()).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_NG',
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: 'summary_large_image', title: DEFAULT_TITLE, description: SITE_DESCRIPTION, images: [DEFAULT_OG_IMAGE.url] },
  // Stop iOS turning prices/dates into tappable phone links
  formatDetection: { telephone: false, date: false, address: false },
};

export const viewport: Viewport = {
  themeColor: '#0b6e3c',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const wa = whatsappNumber();
  return (
    <html lang="en-NG">
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <SiteHeader whatsapp={wa} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter whatsapp={wa} />
      </body>
    </html>
  );
}
