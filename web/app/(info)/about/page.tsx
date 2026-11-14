import Link from 'next/link';
import { CountUp } from '@/components/CountUp';
import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/seo';
import { SITE_CONFIG } from '@/lib/site-config';

export const metadata = pageMetadata({
  title: 'About Us',
  description: 'DammyRex Declutter sells neatly used fridges, ACs, beds, furniture and more at honest prices. Every buyer inspects before paying.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <InfoPage eyebrow="Company" title="About DammyRex Declutter" intro={SITE_CONFIG.tagline}>
      <ul className="not-prose mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SITE_CONFIG.stats.map((s) => (
          <li key={s.label} className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
            <p className="font-display text-3xl text-brand-700 sm:text-4xl">
              <CountUp value={s.value} suffix={s.suffix} />
            </p>
            <p className="mt-1 text-sm font-medium text-gray-600">{s.label}</p>
          </li>
        ))}
      </ul>
      <h2>Who we are</h2>
      <p>
        DammyRex Declutter helps households in {SITE_CONFIG.serviceArea} pass on good things they no longer need,
        and helps buyers get quality fridges, freezers, air conditioners, fans, beds, chairs, tables, kitchen
        appliances and electronics for far less than new.
      </p>
      <h2>What makes us different</h2>
      <ul>
        <li><strong>Inspect before you pay.</strong> You see and test every item in person. No online payment, no surprises.</li>
        <li><strong>Honest descriptions.</strong> We describe faults and marks clearly, with real photos.</li>
        <li><strong>Fair prices.</strong> Pre-loved items priced for what they are, not what they cost new.</li>
        <li><strong>Real people on WhatsApp.</strong> Ask anything before you travel to inspect.</li>
      </ul>
      <h2>Decluttering?</h2>
      <p>
        If you have neatly used items to sell, <Link href="/sell">send us photos</Link> and we&apos;ll handle the
        listing and the buyers for you.
      </p>
    </InfoPage>
  );
}
