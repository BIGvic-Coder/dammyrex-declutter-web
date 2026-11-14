import Link from 'next/link';
import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'How It Works',
  description: 'Find an item, book an inspection, test it in person and pay only if you are happy. Selling? Send photos and we do the rest.',
  path: '/how-it-works',
});

const BUY = [
  ['Find an item', 'Browse or search the listings. Every item has real photos, the condition and the area it is in.'],
  ['Ask on WhatsApp', 'Tap “Chat on WhatsApp” on any item to ask questions or confirm it is still available.'],
  ['Book an inspection', 'Pick a day and time on the item page. We confirm by WhatsApp and send you the address.'],
  ['Inspect and test', 'See the item in person, plug it in, check it properly. Take your time.'],
  ['Pay only if you like it', 'Agree the deal and pay after inspecting. Never pay for an item you have not seen.'],
];
const SELL = [
  ['Send photos', 'Use the Sell form: photos, a short description and your price.'],
  ['We review and post', 'We check the details and publish your item, usually within a day.'],
  ['We handle buyers', 'We answer questions and arrange inspections with serious buyers.'],
  ['Get paid', 'When a buyer is happy after inspecting, the deal is closed.'],
];

function Steps({ steps }: { steps: string[][] }) {
  return (
    <ol className="not-prose mt-4 space-y-3">
      {steps.map(([t, d], i) => (
        <li key={t} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-700 font-bold text-white">{i + 1}</span>
          <div>
            <p className="font-semibold text-gray-900">{t}</p>
            <p className="text-sm text-gray-600">{d}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function HowItWorksPage() {
  return (
    <InfoPage eyebrow="Company" title="How It Works" intro="Simple, safe and in person, whether you are buying or selling.">
      <h2>Buying</h2>
      <Steps steps={BUY} />
      <h2>Selling</h2>
      <Steps steps={SELL} />
      <p className="mt-6">
        Ready? <Link href="/items">Browse items</Link> or <Link href="/sell">sell your item</Link>.
      </p>
    </InfoPage>
  );
}
