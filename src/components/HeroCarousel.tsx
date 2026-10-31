import { ArrowRight, CalendarDays, Hand, House, Pause, Play, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteData } from '../data/SiteData';
import { generalEnquiryMessage } from '../lib/whatsapp';
import { WhatsAppLink } from './ui';

interface Slide {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  text: string;
  /** CSS object-position, so faces and hands stay in frame on narrow screens. */
  focus?: string;
}

const INTERVAL_MS = 6000;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

/**
 * Full-width hero with crossfading background photos, like a slideshow.
 * Auto-advance has a pause button (WCAG 2.2.2) and is off for reduced-motion visitors.
 */
export default function HeroCarousel() {
  const { settings } = useSiteData();
  const slides: Slide[] = [
    {
      image: '/images/massage-room.webp',
      alt: 'Serenity Haven Spa massage room with two kente-covered massage beds',
      eyebrow: `Welcome to ${settings.spaName}`,
      title: settings.tagline || 'Relax, Restore, Rejuvenate.',
      text: settings.intro,
      focus: '50% 60%',
    },
    {
      image: '/images/facial-brush.webp',
      alt: 'Therapist giving a guest a facial with a cleansing brush and steam',
      eyebrow: 'Facials',
      title: 'Glowing skin, don’t care!',
      text: 'Treat yourself to some self-love with a facial.',
      focus: '50% 55%',
    },
    {
      image: '/images/leg-massage.webp',
      alt: 'Therapist massaging a guest’s legs in a calm treatment room',
      eyebrow: 'Massages',
      title: 'Your body holds stress. Let us help you release it.',
      text: 'Unwind with a massage from our expert therapists.',
      focus: '55% 50%',
    },
    {
      image: '/images/nail-salon.webp',
      alt: 'Bright nail salon with manicure tables and pedicure chairs',
      eyebrow: 'Nail care',
      title: 'Beautiful hands and feet',
      text: 'Pedicures and acrylic nails in a calm, welcoming space.',
      focus: '50% 45%',
    },
  ];

  const [index, setIndex] = useState(0);
  const [reduced] = useState(prefersReducedMotion);
  const [paused, setPaused] = useState(reduced);

  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % slides.length), INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [index, paused, slides.length]);

  const current = slides[index];

  return (
    <section className="under-header relative isolate overflow-hidden bg-espresso-dark" aria-roledescription="carousel" aria-label="Spa highlights">
      {/* Background photos, stacked and crossfaded */}
      {slides.map((s, i) => (
        <img
          key={s.image}
          src={s.image}
          alt={i === index ? s.alt : ''}
          aria-hidden={i !== index}
          loading={i === 0 ? 'eager' : 'lazy'}
          decoding="async"
          style={{ objectPosition: s.focus }}
          className={`absolute inset-0 -z-20 h-full w-full object-cover transition-opacity duration-[1400ms] ease-out ${i === index ? 'opacity-100' : 'opacity-0'} ${
            i === index && !reduced ? 'hero-kenburns' : ''
          }`}
        />
      ))}
      {/* Darken for legible white text */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-espresso-dark/70 via-espresso-dark/55 to-espresso-dark/80" aria-hidden />

      <div className="container-page flex min-h-[78svh] flex-col items-center justify-center pt-16 pb-20 text-center text-white sm:min-h-[82svh]">
        <div key={index} className="fade-up max-w-3xl" aria-live={paused ? 'polite' : 'off'}>
          <p className="label-caps text-xs text-gold-soft sm:text-sm">{current.eyebrow}</p>
          <h1 className="mt-4 text-4xl leading-[1.1] text-white sm:text-6xl">{current.title}</h1>
          {current.text && <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/85">{current.text}</p>}
        </div>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <WhatsAppLink
            message={generalEnquiryMessage(settings.spaName, 'booking an appointment')}
            className="btn-gold"
            icon={<CalendarDays className="h-4 w-4" aria-hidden />}
          >
            Book on WhatsApp
          </WhatsAppLink>
          <Link to="/treatments" className="btn border border-white/60 text-white hover:bg-white/10">
            View treatments <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <p className="mt-4 max-w-md text-xs text-white/70">Sending a WhatsApp message doesn’t confirm your booking. Your appointment is confirmed once we reply.</p>
      </div>

      {/* Slide dots + pause */}
      <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.image}
            type="button"
            onClick={() => setIndex(i)}
            aria-current={i === index}
            className={`h-2.5 rounded-full transition-all ${i === index ? 'w-9 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'}`}
          >
            <span className="sr-only">
              Show slide {i + 1}: {s.eyebrow}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
        >
          {paused ? <Play className="h-3.5 w-3.5" aria-hidden /> : <Pause className="h-3.5 w-3.5" aria-hidden />}
          <span className="sr-only">{paused ? 'Play slideshow' : 'Pause slideshow'}</span>
        </button>
      </div>
    </section>
  );
}

/** Row of quick links under the hero, like the reference design. */
export function QuickLinks() {
  const { settings } = useSiteData();
  const links = [
    { to: '/treatments', label: 'Treatments', Icon: Sparkles },
    { to: `/treatments?category=${encodeURIComponent('Nail care')}`, label: 'Nail care', Icon: Hand },
    settings.homeServiceEnabled
      ? { to: '/contact', label: 'Home service', Icon: House }
      : { to: '/contact', label: 'Visit us', Icon: House },
  ];
  return (
    <nav aria-label="Quick links" className="grid grid-cols-3 divide-x divide-linen border-b border-linen bg-ivory">
      {links.map(({ to, label, Icon }) => (
        <Link key={label} to={to} className="group flex flex-col items-center gap-3 px-2 py-6 text-espresso transition hover:bg-cream">
          <Icon className="h-7 w-7 transition group-hover:scale-110" strokeWidth={1.5} aria-hidden />
          <span className="label-caps text-center text-[0.7rem] sm:text-sm">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
