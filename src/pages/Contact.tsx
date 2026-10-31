import { addDoc, collection, serverTimestamp } from 'firebase/firestore/lite';
import { Clock, Mail, MapPin, Navigation, Phone } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FacebookIcon, InstagramIcon, TikTokIcon } from '../components/BrandIcons';
import { BookingNote, PageHeader, WhatsAppLink } from '../components/ui';
import { useSiteData } from '../data/SiteData';
import { ENQUIRY_LIMITS, validateEnquiry, type EnquiryInput } from '../lib/enquiry';
import { db } from '../lib/firebase';
import { SlidingWindowLimiter } from '../lib/rateLimit';
import { usePageMeta } from '../lib/seo';
import { generalEnquiryMessage } from '../lib/whatsapp';

const enquiryLimiter = new SlidingWindowLimiter('shs-enquiry-hits', 3, 60 * 60 * 1000);

function EnquiryForm() {
  const [form, setForm] = useState<EnquiryInput>({ name: '', contact: '', subject: '', message: '', consent: false });
  const [website, setWebsite] = useState(''); // honeypot: hidden from people, bots tend to fill it
  const [errors, setErrors] = useState<ReturnType<typeof validateEnquiry>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error' | 'limited'>('idle');

  if (!db) return null; // Without Firebase, WhatsApp is the only contact route.

  const set = <K extends keyof EnquiryInput>(k: K, v: EnquiryInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs = validateEnquiry(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (website) {
      setStatus('sent'); // silently drop bot submissions
      return;
    }
    if (!enquiryLimiter.tryAcquire()) {
      setStatus('limited');
      return;
    }
    setStatus('sending');
    try {
      await addDoc(collection(db!, 'enquiries'), {
        name: form.name.trim(),
        contact: form.contact.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
        consent: true,
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setStatus('sent');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  if (status === 'sent')
    return (
      <div className="card p-8 text-center" role="status">
        <h2 className="text-2xl">Thank you!</h2>
        <p className="mt-2 text-sm text-muted">We’ve received your message and will reply as soon as we can.</p>
      </div>
    );

  const field = (k: keyof EnquiryInput) => ({ 'aria-invalid': Boolean(errors[k]), 'aria-describedby': errors[k] ? `${k}-err` : undefined });
  const Err = ({ k }: { k: keyof EnquiryInput }) => (errors[k] ? <p id={`${k}-err`} className="mt-1 text-xs text-red-700">{errors[k]}</p> : null);

  return (
    <form onSubmit={submit} noValidate className="card space-y-4 p-6 sm:p-8">
      <div>
        <h2 className="text-2xl">Send us a message</h2>
        <p className="mt-1 text-sm text-muted">Prefer email over WhatsApp? Leave a message and we’ll get back to you. For bookings, WhatsApp is fastest.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="enq-name">Name</label>
          <input id="enq-name" className="input" autoComplete="name" maxLength={ENQUIRY_LIMITS.name} value={form.name} onChange={(e) => set('name', e.target.value)} {...field('name')} />
          <Err k="name" />
        </div>
        <div>
          <label className="label" htmlFor="enq-contact">Phone or email</label>
          <input id="enq-contact" className="input" maxLength={ENQUIRY_LIMITS.contact} value={form.contact} onChange={(e) => set('contact', e.target.value)} {...field('contact')} />
          <Err k="contact" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="enq-subject">Subject <span className="font-normal text-muted">(optional)</span></label>
        <input id="enq-subject" className="input" maxLength={ENQUIRY_LIMITS.subject} value={form.subject} onChange={(e) => set('subject', e.target.value)} {...field('subject')} />
        <Err k="subject" />
      </div>
      <div>
        <label className="label" htmlFor="enq-message">Message</label>
        <textarea id="enq-message" rows={5} className="input" maxLength={ENQUIRY_LIMITS.message} value={form.message} onChange={(e) => set('message', e.target.value)} {...field('message')} />
        <Err k="message" />
      </div>
      <div className="hidden" aria-hidden>
        <label>
          Website <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>
      <div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-leaf" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} {...field('consent')} />
          <span>
            I agree that the spa may use these details to reply to my enquiry. See our <Link to="/privacy" className="underline">privacy policy</Link>.
          </span>
        </label>
        <Err k="consent" />
      </div>
      <p className="text-xs text-muted">Please don’t include payment or medical details.</p>
      {status === 'error' && <p role="alert" className="text-sm text-red-700">Sorry, your message couldn’t be sent. Please try WhatsApp instead.</p>}
      {status === 'limited' && <p role="alert" className="text-sm text-red-700">You’ve sent several messages recently. Please try again later or use WhatsApp.</p>}
      <button type="submit" className="btn-primary" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}

export default function Contact() {
  const { settings } = useSiteData();
  usePageMeta(`Contact & directions | ${settings.spaName}`, `Contact ${settings.spaName}${settings.address ? ` in ${settings.address}` : ''}. Book on WhatsApp or call ${settings.phoneDisplay}.`);
  const mapHref = settings.mapUrl || (settings.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.spaName} ${settings.address}`)}` : '');
  const socials = [
    { href: settings.social.instagram, label: 'Instagram', Icon: InstagramIcon },
    { href: settings.social.facebook, label: 'Facebook', Icon: FacebookIcon },
    { href: settings.social.tiktok, label: 'TikTok', Icon: TikTokIcon },
  ].filter((s) => s.href);

  return (
    <>
      <PageHeader eyebrow="Contact" title="Get in touch" intro="The quickest way to book or ask a question is WhatsApp." />
      <div className="container-page mt-12 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <div className="card space-y-5 p-6 sm:p-8">
            <WhatsAppLink message={generalEnquiryMessage(settings.spaName)} className="btn-whatsapp w-full">
              Chat on WhatsApp
            </WhatsAppLink>
            <BookingNote />
            <ul className="space-y-4 text-sm">
              {settings.phoneDisplay && (
                <li className="flex gap-3">
                  <Phone className="h-5 w-5 shrink-0 text-leaf" aria-hidden />
                  <a href={`tel:+${settings.whatsappNumber}`} className="hover:underline">{settings.phoneDisplay}</a>
                </li>
              )}
              {settings.email && (
                <li className="flex gap-3">
                  <Mail className="h-5 w-5 shrink-0 text-leaf" aria-hidden />
                  <a href={`mailto:${settings.email}`} className="hover:underline">{settings.email}</a>
                </li>
              )}
              {settings.address && (
                <li className="flex gap-3">
                  <MapPin className="h-5 w-5 shrink-0 text-leaf" aria-hidden />
                  <span>{settings.address}</span>
                </li>
              )}
              <li className="flex gap-3">
                <Clock className="h-5 w-5 shrink-0 text-leaf" aria-hidden />
                {settings.openingHours.length ? (
                  <ul className="flex-1 space-y-1">
                    {settings.openingHours.map((h) => (
                      <li key={h.day} className="flex justify-between gap-4">
                        <span>{h.day}</span>
                        <span className="text-muted">{h.hours}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-muted">Opening hours: please message us to check.</span>
                )}
              </li>
            </ul>
            {mapHref && (
              <a href={mapHref} target="_blank" rel="noopener noreferrer" className="btn-outline w-full">
                <Navigation className="h-4 w-4" aria-hidden /> Get directions
              </a>
            )}
            {socials.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-linen pt-5">
                {socials.map(({ href, label, Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="btn-outline min-h-10 px-4 text-xs">
                    <Icon className="h-4 w-4" /> {label}
                  </a>
                ))}
              </div>
            )}
          </div>
          {settings.homeServiceEnabled && settings.homeServiceNote && (
            <div className="rounded-2xl bg-mint/60 p-6 text-sm leading-relaxed text-leaf">
              <p className="font-display text-xl">Home service</p>
              <p className="mt-1">{settings.homeServiceNote}</p>
            </div>
          )}
        </div>
        <EnquiryForm />
      </div>
    </>
  );
}
