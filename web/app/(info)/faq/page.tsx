import Link from 'next/link';
import { Faq, InfoPage } from '@/components/InfoPage';
import { jsonLd, pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'FAQs',
  description: 'Answers to common questions about buying and selling neatly used household items with DammyRex Declutter.',
  path: '/faq',
});

const FAQS = [
  { q: 'Are the items new?', a: 'No. Everything is pre-loved (used), neatly kept and described honestly, including any marks or faults.' },
  { q: 'Can I pay online or by transfer before seeing the item?', a: 'We never ask for payment before you inspect. You see and test the item in person first, then pay if you are happy.' },
  { q: 'How do I book an inspection?', a: 'Open the item, tap “Book an inspection”, choose a day and time and enter your name and phone number. We confirm on WhatsApp.' },
  { q: 'Do you deliver?', a: <>Yes, in many areas, for a fee agreed on WhatsApp. See <Link href="/delivery">Delivery information</Link>.</> },
  { q: 'Can I return an item?', a: <>Because you inspect and test before paying, sales are final in most cases. See our <Link href="/inspection-returns">Inspection &amp; Returns policy</Link> for the exceptions.</> },
  { q: 'Is the price negotiable?', a: 'Prices are fair already, but you can always make an offer on WhatsApp.' },
  { q: 'How do I sell my items?', a: <>Send photos and details through the <Link href="/sell">Sell form</Link>. We review, post the item and handle buyers.</> },
  { q: 'What does “Reserved” mean?', a: 'Someone has a confirmed inspection booked. You can still message us to be next in line.' },
];

export default function FaqPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.filter((f) => typeof f.a === 'string').map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  return (
    <InfoPage eyebrow="Help" title="Frequently asked questions" intro="Quick answers about buying, inspecting, delivery and selling.">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(schema)} />
      <Faq items={FAQS} />
    </InfoPage>
  );
}
