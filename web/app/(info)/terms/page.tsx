import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Terms of Service',
  description: 'The terms for buying and selling neatly used items through DammyRex Declutter.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <InfoPage eyebrow="Legal" title="Terms of service" intro="The simple rules for using this website and buying or selling through DammyRex Declutter." updated="November 2026">
      <h2>Listings</h2>
      <p>Items are pre-loved. We describe them honestly, but photos and descriptions are a guide. Your own inspection is what counts.</p>
      <h2>Buying</h2>
      <ul>
        <li>Payment is made only after you have inspected the item.</li>
        <li>Prices and availability can change until a deal is agreed.</li>
        <li>See the Inspection &amp; Returns policy for what happens after purchase.</li>
      </ul>
      <h2>Selling</h2>
      <ul>
        <li>You confirm you own the item and that your description is accurate.</li>
        <li>We may edit, decline or remove any listing.</li>
      </ul>
      <h2>Adverts</h2>
      <p>Sponsored content is labelled. We are not responsible for products or services offered by advertisers.</p>
      <h2>Changes</h2>
      <p>We may update these terms; the date above shows the latest version.</p>
      <p className="text-sm text-gray-500">This is a starting template, not legal advice. Have it reviewed before relying on it.</p>
    </InfoPage>
  );
}
