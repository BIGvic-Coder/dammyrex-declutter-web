import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/seo';
import { SITE_CONFIG } from '@/lib/site-config';

export const metadata = pageMetadata({
  title: 'Delivery Information',
  description: 'How delivery works for items bought from DammyRex Declutter: areas, costs and timing.',
  path: '/delivery',
});

export default function DeliveryPage() {
  return (
    <InfoPage eyebrow="Help" title="Delivery information" intro="Inspect first, then choose to pick up yourself or have it delivered." updated="November 2026">
      <h2>Pick-up</h2>
      <p>Most buyers collect the item straight after inspecting it. Bring help and a suitable vehicle for big items like fridges, freezers and beds.</p>
      <h2>Delivery</h2>
      <ul>
        <li>We can arrange delivery within {SITE_CONFIG.serviceArea} and some nearby areas.</li>
        <li>The delivery fee depends on the item size and distance, and is agreed on WhatsApp before you pay.</li>
        <li>Delivery is usually the same day or next day after payment.</li>
        <li>Please check the item again when it arrives and tell the driver straight away if anything is wrong.</li>
      </ul>
      <h2>Installation</h2>
      <p>Air conditioner installation is not included in the price. Ask us and we can recommend an installer.</p>
      <p className="text-sm text-gray-500">This page is a starting template. Update the details to match how you deliver.</p>
    </InfoPage>
  );
}
