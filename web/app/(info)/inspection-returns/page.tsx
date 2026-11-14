import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Inspection & Returns Policy',
  description: 'Every DammyRex Declutter item is inspected by the buyer before payment. Read our inspection and returns policy.',
  path: '/inspection-returns',
});

export default function InspectionReturnsPage() {
  return (
    <InfoPage eyebrow="Help" title="Inspection & returns policy" intro="You inspect and test every item before you pay. That is how we keep things fair for everyone." updated="November 2026">
      <h2>Inspection</h2>
      <ul>
        <li>Book a time on the item page; we confirm on WhatsApp and share the address.</li>
        <li>Test the item properly: plug in fridges, freezers and ACs, check doors, seals, cushions and frames.</li>
        <li>Ask any questions before paying. If you are not happy, you don&apos;t pay. No pressure.</li>
      </ul>
      <h2>Returns</h2>
      <ul>
        <li>Because you have inspected and tested the item before paying, sales are generally final.</li>
        <li>If an item develops a fault within 24 hours that could not have been seen during inspection, contact us on WhatsApp straight away and we will look at it case by case.</li>
        <li>Damage caused after collection or delivery (for example during moving) is not covered.</li>
      </ul>
      <h2>Safety</h2>
      <p>Never send money for an item you have not seen. DammyRex will never ask you to pay before inspecting.</p>
      <p className="text-sm text-gray-500">This page is a starting template. Have it reviewed so it matches how you actually handle returns.</p>
    </InfoPage>
  );
}
