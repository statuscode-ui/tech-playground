import { CalendarDays, ChevronRight, MapPin, Menu, Phone, Sparkles, X } from 'lucide-react';
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from './BrandIcons';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSiteData } from '../data/SiteData';
import { generalEnquiryMessage, whatsappUrl } from '../lib/whatsapp';
import { ErrorBanner, WhatsAppLink } from './ui';

const ChatWidget = lazy(() => import('./ChatWidget'));

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/treatments', label: 'Treatments' },
  { to: '/products', label: 'Products' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

/** The Serenity Haven Spa logo (public/images/logo.webp), or the owner's own upload from Settings. */
function Logo() {
  const { settings } = useSiteData();
  return <img src={settings.logoUrl || '/images/logo.webp'} alt={settings.spaName} width={440} height={328} className="h-16 w-auto sm:h-[4.5rem]" />;
}

function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { promotions, settings } = useSiteData();
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-2 text-sm tracking-wide transition ${isActive ? 'text-leaf font-medium' : 'text-muted hover:text-leaf'}`;

  return (
    <>
      {promotions[0] && (
        <div className="bg-leaf text-center text-sm text-white">
          <p className="container-page flex items-center justify-center gap-2 py-2">
            <Sparkles className="h-4 w-4 text-berry-soft" aria-hidden />
            <span>
              <strong className="font-medium">{promotions[0].title}</strong>
              {promotions[0].description && <span className="hidden sm:inline"> · {promotions[0].description}</span>}
            </span>
          </p>
        </div>
      )}
      {/* Floating pill header */}
      <header className="sticky top-3 z-40 px-3 sm:top-4">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-3 rounded-full bg-ivory/95 pr-3 pl-6 shadow-[0_8px_30px_-12px_rgba(20,61,37,0.35)] ring-1 ring-linen/70 backdrop-blur sm:pl-7">
          <Link to="/" aria-label="Home">
            <Logo />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'} className={linkClass}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <WhatsAppLink message={generalEnquiryMessage(settings.spaName, 'booking an appointment')} className="btn-whatsapp min-h-12 px-5" icon={<CalendarDays className="h-4 w-4" aria-hidden />}>
              Book
            </WhatsAppLink>
            <button
              type="button"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full text-leaf md:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X aria-hidden /> : <Menu aria-hidden />}
              <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            </button>
          </div>
        </div>
        {open && (
          <nav id="mobile-nav" aria-label="Main" className="mx-auto mt-2 max-w-6xl rounded-3xl bg-ivory p-3 shadow-xl ring-1 ring-linen/70 md:hidden">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) => `label-caps flex items-center justify-between rounded-2xl px-4 py-3.5 ${isActive ? 'bg-leaf text-white' : 'text-leaf'}`}
              >
                {n.label}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </NavLink>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}

function Footer() {
  const { settings } = useSiteData();
  const year = new Date().getFullYear();
  const socials = [
    { href: settings.social.instagram, label: 'Instagram', Icon: InstagramIcon },
    { href: settings.social.facebook, label: 'Facebook', Icon: FacebookIcon },
    { href: settings.social.tiktok, label: 'TikTok', Icon: TikTokIcon },
  ].filter((s) => s.href);

  return (
    <footer className="mt-24 bg-leaf-dark text-white/80">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <span className="inline-block rounded-2xl bg-white px-4 py-2 shadow-sm">
            <img src={settings.logoUrl || '/images/logo.webp'} alt={settings.spaName} width={440} height={328} loading="lazy" className="h-20 w-auto" />
          </span>
          <p className="mt-3 max-w-sm text-sm leading-relaxed">{settings.tagline}</p>
          {socials.length > 0 && (
            <ul className="mt-5 flex gap-2">
              {socials.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 hover:bg-white/10">
                    <Icon className="h-4 w-4" />
                    <span className="sr-only">{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <nav aria-label="Footer">
          <p className="text-sm font-medium tracking-wide text-white">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            {[...NAV.slice(1), { to: '/privacy', label: 'Privacy' }, { to: '/terms', label: 'Terms' }].map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="hover:text-white">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="text-sm font-medium tracking-wide text-white">Visit &amp; contact</p>
          <ul className="mt-3 space-y-2 text-sm">
            {settings.address && (
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {settings.address}
              </li>
            )}
            {settings.phoneDisplay && (
              <li className="flex gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <a href={`tel:+${settings.whatsappNumber}`} className="hover:text-white">
                  {settings.phoneDisplay}
                </a>
              </li>
            )}
            {settings.openingHours.map((h) => (
              <li key={h.day}>
                {h.day}: {h.hours}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="container-page py-5 text-xs text-white/60">
          © {year} {settings.spaName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function BookingBar() {
  const { settings } = useSiteData();
  const booking = whatsappUrl(settings.whatsappNumber, generalEnquiryMessage(settings.spaName, 'booking an appointment'));
  const chat = whatsappUrl(settings.whatsappNumber, generalEnquiryMessage(settings.spaName));
  if (!booking) return null;
  return (
    <>
      {/* Phones: full-width booking bar fixed to the bottom of the screen. */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-leaf-dark/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        <a href={booking} target="_blank" rel="noopener noreferrer" className="btn-accent min-h-13 w-full text-base">
          <CalendarDays className="h-5 w-5" aria-hidden />
          Book Appointment
          <span className="sr-only"> (opens WhatsApp)</span>
        </a>
      </div>
      {/* Larger screens: round WhatsApp button. */}
      <a
        href={chat}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-6 bottom-6 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-[#1f7a4d] text-white shadow-lg ring-4 ring-white/70 transition hover:scale-105 md:inline-flex"
      >
        <WhatsAppIcon className="h-7 w-7" />
        <span className="sr-only">Chat with us on WhatsApp (opens WhatsApp)</span>
      </a>
    </>
  );
}

export default function Layout() {
  const { error } = useSiteData();
  const { pathname } = useLocation();
  // Block body: scrollTo() returns a Promise in newer browsers, and React treats any
  // returned value as a cleanup function (crashing with "destroy is not a function").
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    // Bottom padding on phones keeps the footer clear of the fixed booking bar.
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-leaf focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <Header />
      {error && <ErrorBanner message={error} />}
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BookingBar />
      <Suspense fallback={null}>
        <ChatWidget />
      </Suspense>
    </div>
  );
}
