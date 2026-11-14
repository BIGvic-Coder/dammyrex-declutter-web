import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Privacy Policy',
  description: 'How DammyRex Declutter collects, uses and protects your personal information.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="Legal" title="Privacy policy" intro="We collect only what we need to arrange sales and inspections, and we never sell your data." updated="November 2026">
      <h2>What we collect</h2>
      <ul>
        <li><strong>Buyers:</strong> your name, phone number and preferred inspection time when you book an inspection.</li>
        <li><strong>Sellers:</strong> your name, phone number, area, pickup address and item photos when you use the Sell form.</li>
        <li><strong>Visitors:</strong> basic, anonymous counts of how often adverts are seen and clicked.</li>
      </ul>
      <h2>How we use it</h2>
      <p>To contact you on WhatsApp or by phone about an item, arrange inspections and keep the website working. Pickup addresses are never shown publicly.</p>
      <h2>Sharing</h2>
      <p>We do not sell your information. We share it only with the other side of a sale where needed to arrange an inspection, and with service providers that host the website and photos.</p>
      <h2>Advertising</h2>
      <p>If Google AdSense is turned on, Google may use cookies to show ads. You can manage ad personalisation in your Google account settings.</p>
      <h2>Your choices</h2>
      <p>Message us on WhatsApp to see, correct or delete the information we hold about you.</p>
      <p className="text-sm text-gray-500">This is a starting template, not legal advice. Have it reviewed against the Nigeria Data Protection Act (NDPA) before relying on it.</p>
    </InfoPage>
  );
}
