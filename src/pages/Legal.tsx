import type { ReactNode } from 'react';
import { PageHeader } from '../components/ui';
import { useSiteData } from '../data/SiteData';
import { appCheckEnabled, aiEnabled } from '../lib/firebase';
import { usePageMeta } from '../lib/seo';

function Prose({ children }: { children: ReactNode }) {
  return <div className="container-page mt-12 max-w-3xl space-y-5 leading-relaxed text-muted [&_h2]:mt-10 [&_h2]:text-2xl [&_li]:ml-5 [&_li]:list-disc">{children}</div>;
}

function Draft() {
  return (
    <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Template text. The spa owner should review this page (and seek local legal advice if needed) before relying on it.
    </p>
  );
}

export function Privacy() {
  const { settings } = useSiteData();
  usePageMeta(`Privacy policy | ${settings.spaName}`, `How ${settings.spaName} handles your information.`);
  const contact = [settings.phoneDisplay, settings.email].filter(Boolean).join(' or ');
  return (
    <>
      <PageHeader title="Privacy policy" />
      <Prose>
        <Draft />
        <p>This policy explains what information {settings.spaName} collects through this website and how it is used.</p>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Contact form:</strong> your name, phone number or email, and message, only when you send an enquiry. We use these only to reply to you.</li>
          <li><strong>WhatsApp:</strong> booking and product buttons open WhatsApp with a prefilled message. Nothing is sent until you send it yourself, and the conversation is handled by WhatsApp under its own privacy policy.</li>
          {aiEnabled && (
            <li><strong>Chat assistant:</strong> questions typed into the assistant are sent to Google’s Gemini service through Firebase to generate an answer. Please don’t share personal, payment or medical details in the chat.</li>
          )}
          {appCheckEnabled && <li><strong>Abuse protection:</strong> this site uses Google reCAPTCHA to protect against spam and automated abuse. Google’s privacy policy and terms apply.</li>}
          <li><strong>Your browser:</strong> we store a small counter in your browser to limit how many messages can be sent in a short time. We don’t use advertising or tracking cookies.</li>
        </ul>
        <h2>How long we keep it</h2>
        <p>Enquiries are kept only as long as needed to respond and are deleted periodically.</p>
        <h2>Your choices</h2>
        <p>You can ask us to see or delete the information you sent us{contact ? ` by contacting ${contact}` : ''}.</p>
        <h2>Service providers</h2>
        <p>This website is hosted on Google Firebase. Enquiries are stored in Google Cloud Firestore.</p>
      </Prose>
    </>
  );
}

export function Terms() {
  const { settings } = useSiteData();
  usePageMeta(`Terms of use | ${settings.spaName}`, `Terms for using the ${settings.spaName} website and booking treatments.`);
  return (
    <>
      <PageHeader title="Terms of use" />
      <Prose>
        <Draft />
        <h2>Bookings</h2>
        <p>Booking requests are made through WhatsApp. A booking is confirmed only when {settings.spaName} replies to confirm it.</p>
        {settings.policies && (
          <>
            <h2>Spa policies</h2>
            <p className="whitespace-pre-line">{settings.policies}</p>
          </>
        )}
        {settings.homeServiceEnabled && settings.homeServiceNote && (
          <>
            <h2>Home service</h2>
            <p>{settings.homeServiceNote}</p>
          </>
        )}
        <h2>Prices and information</h2>
        <p>We keep prices and treatment information up to date, but they can change. The price confirmed by the spa when you book applies.</p>
        <h2>Health</h2>
        <p>Our treatments are not medical treatments. Please tell us about pregnancy, allergies, injuries, or skin or medical conditions before your treatment, and consult a doctor if you are unsure whether a treatment suits you.</p>
        <h2>Chat assistant</h2>
        <p>The website chat gives general information and may make mistakes. It cannot make or confirm bookings. If in doubt, message the spa directly.</p>
      </Prose>
    </>
  );
}
