import { MapPin, Menu, Phone, Sparkles, X } from 'lucide-react';
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from './BrandIcons';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSiteData } from '../data/SiteData';
import { generalEnquiryMessage, whatsappUrl } from '../lib/whatsapp';
import { ErrorBanner } from './ui';

const ChatWidget = lazy(() => import('./ChatWidget'));

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/treatments', label: 'Treatments' },
  { to: '/products', label: 'Products' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

function Logo() {
  const { settings } = useSiteData();
  if (settings.logoUrl) return <img src={settings.logoUrl} alt={settings.spaName} className="h-10 w-auto" />;
  const [first, ...rest] = settings.spaName.split(' ');
  return (
    <span className="flex flex-col leading-none">
      <span className="font-display text-2xl tracking-wide text-forest">{first}</span>
      {rest.length > 0 && <span className="text-[0.65rem] tracking-[0.3em] text-[#8a6d37] uppercase">{rest.join(' ')}</span>}
    </span>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { promotions } = useSiteData();
  useEffect(() => setOpen(false), [pathname]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-2 text-sm tracking-wide transition ${isActive ? 'text-forest font-medium' : 'text-muted hover:text-forest'}`;

  return (
    <>
      {promotions[0] && (
        <div className="bg-forest text-center text-sm text-white">
          <p className="container-page flex items-center justify-center gap-2 py-2">
            <Sparkles className="h-4 w-4 text-gold-soft" aria-hidden />
            <span>
              <strong className="font-medium">{promotions[0].title}</strong>
              {promotions[0].description && <span className="hidden sm:inline"> · {promotions[0].description}</span>}
            </span>
          </p>
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-linen/60 bg-cream/90 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
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
          <Link to="/treatments" className="btn-primary hidden md:inline-flex">
            Book a treatment
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-forest md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X aria-hidden /> : <Menu aria-hidden />}
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          </button>
        </div>
        {open && (
          <nav id="mobile-nav" aria-label="Main" className="border-t border-linen/60 bg-cream md:hidden">
            <div className="container-page flex flex-col py-3">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `rounded-xl px-3 py-3 ${isActive ? 'bg-sand text-forest' : 'text-ink'}`}>
                  {n.label}
                </NavLink>
              ))}
            </div>
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
    <footer className="mt-24 bg-forest-dark text-white/80">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-display text-3xl text-white">{settings.spaName}</p>
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

function WhatsAppFab() {
  const { settings } = useSiteData();
  const href = whatsappUrl(settings.whatsappNumber, generalEnquiryMessage(settings.spaName));
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 bottom-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#1f7a4d] text-white shadow-lg ring-4 ring-white/70 transition hover:scale-105 sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="h-7 w-7" />
      <span className="sr-only">Chat with us on WhatsApp (opens WhatsApp)</span>
    </a>
  );
}

export default function Layout() {
  const { error } = useSiteData();
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <Header />
      {error && <ErrorBanner message={error} />}
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFab />
      <Suspense fallback={null}>
        <ChatWidget />
      </Suspense>
    </div>
  );
}
