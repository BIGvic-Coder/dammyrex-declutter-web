import { WhatsAppIcon } from '@/components/icons';
import { InfoPage } from '@/components/InfoPage';
import { pageMetadata } from '@/lib/seo';
import { whatsappLink, whatsappNumber } from '@/lib/site';
import { SITE_CONFIG } from '@/lib/site-config';

export const metadata = pageMetadata({
  title: 'Contact',
  description: 'Chat with DammyRex Declutter on WhatsApp about any item, inspection or selling your household items.',
  path: '/contact',
});

export default function ContactPage() {
  const wa = whatsappNumber();
  return (
    <InfoPage eyebrow="Company" title="Contact us" intro="The fastest way to reach us is WhatsApp. We usually reply within the hour during opening times.">
      <div className="not-prose grid gap-3 sm:grid-cols-2">
        <a
          href={whatsappLink('Hi DammyRex, I have a question.', wa)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl bg-whatsapp p-5 text-white shadow-sm hover:bg-whatsapp-dark"
        >
          <WhatsAppIcon className="h-8 w-8" />
          <span>
            <span className="block font-bold">Chat on WhatsApp</span>
            <span className="text-sm text-white/90">{SITE_CONFIG.phoneDisplay}</span>
          </span>
        </a>
        <a href={`tel:+${wa}`} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 hover:ring-brand-600/40">
          <span className="block font-bold text-gray-900">Call us</span>
          <span className="text-sm text-gray-600">{SITE_CONFIG.phoneDisplay}</span>
        </a>
      </div>
      <h2>Opening hours</h2>
      <p>{SITE_CONFIG.openingHours}</p>
      <h2>Where we are</h2>
      <p>
        We serve {SITE_CONFIG.serviceArea}. Each item lists the area it is in; the exact address for an inspection is
        shared on WhatsApp once your booking is confirmed.
      </p>
      {SITE_CONFIG.email && (
        <>
          <h2>Email</h2>
          <p>
            <a href={`mailto:${SITE_CONFIG.email}`}>{SITE_CONFIG.email}</a>
          </p>
        </>
      )}
    </InfoPage>
  );
}
