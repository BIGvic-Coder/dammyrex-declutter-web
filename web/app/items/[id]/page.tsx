import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookInspectionForm } from '@/components/BookInspectionForm';
import { Gallery } from '@/components/Gallery';
import { ItemGrid } from '@/components/ItemCard';
import { PinIcon, WhatsAppIcon } from '@/components/icons';
import { SectionHeading } from '@/components/SectionHeading';
import { ShareButtons } from '@/components/ShareButtons';
import { StatusBadge } from '@/components/StatusBadge';
import { getItem, getItems } from '@/lib/api';
import { CONDITION_LABEL, formatNaira, timeAgo } from '@/lib/format';
import { absoluteUrl, jsonLd, ogImageFromPhoto, pageMetadata } from '@/lib/seo';
import { itemUrl, itemWhatsappText, SITE_NAME, whatsappLink, whatsappNumber } from '@/lib/site';
import type { Item } from '@/lib/types';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const item = await getItem((await params).id);
  // Throwing here (before the page streams) lets crawlers get a real 404 for sold/removed items
  if (!item) notFound();
  const cover = item.images[0];
  const status = item.status === 'SOLD' ? 'SOLD · ' : item.status === 'RESERVED' ? 'Reserved · ' : '';
  return pageMetadata({
    title: `${item.title} – ${formatNaira(item.price)}`,
    description: truncate(
      `${status}${formatNaira(item.price)} · ${CONDITION_LABEL[item.condition]} condition · ${item.area}. ${item.description.replace(/\s+/g, ' ')}`,
      160,
    ),
    path: `/items/${item.id}`,
    image: cover ? { url: ogImageFromPhoto(cover.url), width: 1200, height: 630, alt: item.title } : undefined,
  });
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`;
}

const AVAILABILITY = {
  AVAILABLE: 'https://schema.org/InStock',
  RESERVED: 'https://schema.org/LimitedAvailability',
  SOLD: 'https://schema.org/SoldOut',
} as const;

/** Product + Breadcrumb structured data so Google can show price and availability. */
function itemJsonLd(item: Item) {
  const url = itemUrl(item.id);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: item.title,
      description: item.description,
      image: item.images.map((i) => i.url),
      category: item.category.name,
      url,
      offers: {
        '@type': 'Offer',
        url,
        price: item.price,
        priceCurrency: 'NGN',
        itemCondition: 'https://schema.org/UsedCondition',
        availability: AVAILABILITY[item.status as keyof typeof AVAILABILITY] ?? 'https://schema.org/InStock',
        areaServed: item.area,
        seller: { '@type': 'Organization', name: SITE_NAME },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Items', item: absoluteUrl('/items') },
        { '@type': 'ListItem', position: 2, name: item.category.name, item: absoluteUrl(`/items?category=${item.category.slug}`) },
        { '@type': 'ListItem', position: 3, name: item.title, item: url },
      ],
    },
  ];
}

export default async function ItemPage({ params }: { params: Params }) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  const similar = (await getItems({ category: item.category.slug, limit: '5' })).items
    .filter((i) => i.id !== item.id)
    .slice(0, 4);

  const sold = item.status === 'SOLD';
  const reserved = item.status === 'RESERVED';
  const wa = whatsappNumber();
  const url = itemUrl(item.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(itemJsonLd(item))} />
      <nav className="mb-3 text-xs text-gray-500" aria-label="Breadcrumb">
        <Link href="/items" className="hover:underline">Items</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/items?category=${item.category.slug}`} className="hover:underline">{item.category.name}</Link>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
        <Gallery images={item.images} title={item.title} dimmed={sold} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={item.status} />
            <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-800">
              {CONDITION_LABEL[item.condition]} condition
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl">{item.title}</h1>
          <p className="mt-2 text-3xl font-extrabold text-brand-800">{formatNaira(item.price)}</p>
          <p className="mt-2 flex items-center gap-1 text-sm text-gray-600">
            <PinIcon /> {item.area}
            <span className="mx-1" aria-hidden="true">·</span>
            Posted {timeAgo(item.createdAt)}
          </p>

          {/* Primary action */}
          <div className="mt-5">
            {sold ? (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-900 ring-1 ring-red-200">
                <p className="font-semibold">This item has been sold.</p>
                <Link href={`/items?category=${item.category.slug}`} className="mt-1 inline-block font-semibold underline">
                  See similar {item.category.name.toLowerCase()} →
                </Link>
              </div>
            ) : (
              <>
                {reserved && (
                  <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
                    Someone has booked to inspect this item. You can still ask to be next in line.
                  </p>
                )}
                {wa && (
                  <a
                    href={whatsappLink(itemWhatsappText(item), wa)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-whatsapp px-5 py-3.5 text-base font-bold text-white shadow-sm hover:bg-whatsapp-dark"
                  >
                    <WhatsAppIcon /> Chat on WhatsApp
                  </a>
                )}
                <a
                  href="#book"
                  className="mt-2 flex w-full items-center justify-center rounded-xl px-5 py-3 text-base font-semibold text-brand-800 ring-2 ring-brand-700 hover:bg-brand-50"
                >
                  Book an inspection
                </a>
              </>
            )}
          </div>

          <section className="mt-6">
            <h2 className="text-sm font-semibold text-gray-800">Description</h2>
            <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-gray-700">{item.description}</p>
          </section>

          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-black/5 text-sm ring-1 ring-black/5">
            {[
              ['Category', item.category.name],
              ['Condition', CONDITION_LABEL[item.condition]],
              ['Area', item.area],
              ['Price', formatNaira(item.price)],
            ].map(([k, v]) => (
              <div key={k} className="bg-white p-3">
                <dt className="text-xs text-gray-500">{k}</dt>
                <dd className="font-medium text-gray-900">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 rounded-xl bg-brand-50 p-4 text-sm text-brand-900 ring-1 ring-brand-100">
            <p className="font-semibold">How buying works</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5">
              <li>Book a time to see the item in person.</li>
              <li>Inspect and test it properly.</li>
              <li>Pay only if you&apos;re happy. Never pay before inspecting.</li>
            </ol>
          </div>

          {!sold && (
            <section id="book" className="mt-6 scroll-mt-20 rounded-xl border border-black/5 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-lg font-bold text-gray-900">Book an inspection</h2>
              <BookInspectionForm itemId={item.id} itemTitle={item.title} whatsapp={wa} />
            </section>
          )}

          <div className="mt-6">
            <ShareButtons url={url} title={item.title} />
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-12">
          <SectionHeading title={`More ${item.category.name.toLowerCase()}`} href={`/items?category=${item.category.slug}`} />
          <ItemGrid items={similar} />
        </section>
      )}
    </div>
  );
}
