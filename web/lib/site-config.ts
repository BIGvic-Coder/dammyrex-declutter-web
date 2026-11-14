/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EDIT THIS FILE to change contact details, social links, footer shop links
 *  and the numbers shown on the About page. Push to GitHub and the site
 *  redeploys automatically.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const SITE_CONFIG = {
  tagline: 'Quality pre-loved household items at honest prices.',

  /** Business WhatsApp: international format, digits only (no +, no spaces). */
  whatsappNumber: '2348101295489',
  /** How the number is written on the page. */
  phoneDisplay: '0810 129 5489',
  /** Optional. Leave '' to hide. */
  email: '',
  /** Shown on Contact / Delivery pages. */
  serviceArea: 'Lagos, Nigeria',
  openingHours: 'Mon – Sat, 9am – 6pm',

  /**
   * Social profiles. Replace each with your real page address, e.g.
   * 'https://www.instagram.com/yourhandle'. Set to '' to hide that icon.
   * (They point to each platform's home page until you fill them in.)
   */
  social: {
    instagram: 'https://www.instagram.com/',
    facebook: 'https://www.facebook.com/',
    tiktok: 'https://www.tiktok.com/',
  },

  /**
   * Footer "Shop" column. `categories` are category slugs (comma-joined in the link),
   * so one link can cover several categories, e.g. fridges + freezers.
   */
  shopLinks: [
    { label: 'All Items', categories: [] },
    { label: 'Fridges & Freezers', categories: ['fridges', 'freezers'] },
    { label: 'ACs & Fans', categories: ['air-conditioners', 'fans'] },
    { label: 'Furniture', categories: ['chairs', 'tables'] },
    { label: 'Beds & Mattresses', categories: ['beds', 'bed-frames'] },
    { label: 'Electronics', categories: ['electronics'] },
    { label: 'Kitchen Appliances', categories: ['kitchen-appliances', 'gas-cookers'] },
  ],

  /** About page counters (they count up when scrolled into view). Use your real numbers. */
  stats: [
    { value: 500, suffix: '+', label: 'Items sold' },
    { value: 300, suffix: '+', label: 'Happy customers' },
    { value: 100, suffix: '%', label: 'Inspected before payment' },
  ],
} as const;

export const shopHref = (categories: readonly string[]) =>
  categories.length ? `/items?category=${categories.join(',')}` : '/items';
