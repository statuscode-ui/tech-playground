import { ArrowRight, House, Leaf, MapPin, Quote, Sparkles, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { InstagramIcon } from '../components/BrandIcons';
import { ProductCard, ServiceCard } from '../components/Cards';
import HeroBackdrop from '../components/HeroBackdrop';
import { FaqList } from './Faq';
import { BookingNote, LoadingState, SectionHeading, SpaImage, WhatsAppLink } from '../components/ui';
import { useSiteData } from '../data/SiteData';
import { usePageMeta } from '../lib/seo';
import { generalEnquiryMessage } from '../lib/whatsapp';

export default function Home() {
  const { settings, services, products, testimonials, faqs, promotions, loading } = useSiteData();
  usePageMeta(`${settings.spaName} | ${settings.tagline}`, settings.intro, { image: '/images/og-image.jpg' });

  const featuredServices = (services.filter((s) => s.featured).length ? services.filter((s) => s.featured) : services).slice(0, 3);
  const featuredProducts = products.filter((p) => p.featured).slice(0, 4);
  const gallery = services.filter((s) => s.imageUrl).slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sand via-cream to-sage-soft/60" aria-hidden />
        <div className="container-page relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div className="fade-up relative isolate">
            <HeroBackdrop />
            <p className="eyebrow">Welcome to {settings.spaName}</p>
            <h1 className="mt-4 text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">{settings.tagline || 'Relax, restore, rejuvenate.'}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{settings.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <WhatsAppLink message={generalEnquiryMessage(settings.spaName, 'booking an appointment')}>Book on WhatsApp</WhatsAppLink>
              <Link to="/treatments" className="btn-outline">
                View treatments <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <BookingNote className="mt-4 max-w-md" />
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -inset-3 -z-0 rounded-[2.5rem] border border-gold/40" aria-hidden />
            <SpaImage
              src="/images/hot-stone.webp"
              alt="Guest relaxing during a hot stone massage"
              eager
              className="relative aspect-[4/5] w-full rounded-[2rem] shadow-xl"
            />
            {settings.homeServiceEnabled && (
              <div className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl bg-ivory/95 px-4 py-3 shadow-lg ring-1 ring-linen sm:-left-8">
                <House className="h-5 w-5 text-forest" aria-hidden />
                <p className="text-sm">
                  <span className="block font-medium text-forest">Home service available</span>
                  <span className="text-muted">We can come to you</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Active promotions */}
      {promotions.length > 0 && (
        <section className="container-page mt-16" aria-labelledby="promo-heading">
          <h2 id="promo-heading" className="sr-only">
            Current offers
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {promotions.map((p) => (
              <div key={p.id} className="card flex items-start gap-4 border-gold/40 bg-gradient-to-br from-ivory to-gold-soft/40 p-6">
                <Sparkles className="mt-1 h-6 w-6 shrink-0 text-[#8a6d37]" aria-hidden />
                <div>
                  <p className="font-display text-2xl text-forest">{p.title}</p>
                  <p className="mt-1 text-sm text-muted">{p.description}</p>
                  {p.endDate && <p className="mt-2 text-xs text-muted">Offer ends {new Date(p.endDate + 'T00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Introduction */}
      <section className="container-page mt-24 grid items-center gap-12 lg:grid-cols-2">
        <SpaImage src="/images/team.webp" alt="A member of the Serenity Haven Spa team" className="mx-auto aspect-[4/5] w-full max-w-sm rounded-[2rem] object-top" />
        <div>
          <SectionHeading align="left" eyebrow="Our mission" title="A haven of peace and tranquility" />
          <p className="mt-5 leading-relaxed text-muted">{settings.mission}</p>
          <p className="mt-4 leading-relaxed text-muted">{settings.story}</p>
        </div>
      </section>

      {/* Featured treatments */}
      <section className="container-page mt-24">
        <SectionHeading eyebrow="Treatments" title="Our signature treatments" intro="Choose a treatment and send us a WhatsApp message with your preferred date and time." />
        {loading ? (
          <LoadingState />
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        )}
        <div className="mt-10 text-center">
          <Link to="/treatments" className="btn-outline">
            See all treatments <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Why us */}
      <section className="mt-24 bg-sand/60 py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Why Serenity" title="Personal care, every visit" />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { Icon: Leaf, title: 'Calm, tranquil setting', text: 'A peaceful space to escape everyday stress, unwind and recharge.' },
              { Icon: Star, title: 'Expert therapists', text: 'A passionate team providing personalised care and attention.' },
              {
                Icon: House,
                title: settings.homeServiceEnabled ? 'We come to you' : 'Easy booking',
                text: settings.homeServiceEnabled ? 'Enjoy treatments at home. Transport costs depend on your location.' : 'Book quickly on WhatsApp, with no account needed.',
              },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="rounded-2xl bg-ivory/80 p-7 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage-soft text-forest">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-2xl">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featuredProducts.length > 0 && (
        <section className="container-page mt-24">
          <SectionHeading eyebrow="Shop" title="Take the spa home" intro="Order or ask about any product on WhatsApp." />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/products" className="btn-outline">
              Browse products <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="container-page mt-24">
          <SectionHeading eyebrow="Kind words" title="What our guests say" />
          {testimonials.some((t) => t.sample) && (
            <p className="mx-auto mt-4 w-fit rounded-full bg-amber-100 px-4 py-1 text-xs text-amber-900">Sample content. Real guest reviews will replace these.</p>
          )}
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {testimonials.slice(0, 4).map((t) => (
              <figure key={t.id} className="card p-7">
                <Quote className="h-6 w-6 text-gold" aria-hidden />
                <blockquote className="mt-3 font-display text-xl leading-snug text-ink">“{t.quote}”</blockquote>
                <figcaption className="mt-4 flex items-center justify-between text-sm text-muted">
                  <span>— {t.name}</span>
                  <span aria-label={`${t.rating} out of 5 stars`} className="flex text-gold">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < t.rating ? 'fill-current' : 'opacity-30'}`} aria-hidden />
                    ))}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* FAQ preview */}
      {faqs.length > 0 && (
        <section className="container-page mt-24 max-w-3xl">
          <SectionHeading eyebrow="Questions" title="Frequently asked" />
          <div className="mt-10">
            <FaqList faqs={faqs.slice(0, 4)} />
          </div>
          <div className="mt-8 text-center">
            <Link to="/faq" className="btn-outline">
              All questions
            </Link>
          </div>
        </section>
      )}

      {/* Gallery */}
      {gallery.length > 1 && (
        <section className="container-page mt-24">
          <SectionHeading eyebrow="Moments" title="Inside the spa" />
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            {gallery.map((s) => (
              <SpaImage key={s.id} src={s.imageUrl} alt={s.imageAlt} className="aspect-square w-full rounded-2xl" />
            ))}
          </div>
          {settings.social.instagram && (
            <div className="mt-8 text-center">
              <a href={settings.social.instagram} target="_blank" rel="noopener noreferrer" className="btn-outline">
                <InstagramIcon className="h-4 w-4" /> Follow us on Instagram
              </a>
            </div>
          )}
        </section>
      )}

      {/* Visit */}
      <section className="container-page mt-24">
        <div className="card grid gap-8 bg-forest p-8 text-white sm:p-12 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium tracking-[0.22em] text-gold-soft uppercase">Visit us</p>
            <h2 className="mt-3 text-4xl text-white">Ready to unwind?</h2>
            <p className="mt-4 text-white/80">Message us on WhatsApp to book your treatment, or ask us anything.</p>
            <div className="mt-6">
              <WhatsAppLink message={generalEnquiryMessage(settings.spaName, 'booking an appointment')} className="btn bg-white text-forest hover:bg-cream">
                Book on WhatsApp
              </WhatsAppLink>
            </div>
          </div>
          <div className="space-y-4 text-sm text-white/85">
            {settings.address && (
              <p className="flex gap-2">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden /> {settings.address}
              </p>
            )}
            <div>
              <p className="font-medium text-white">Opening hours</p>
              {settings.openingHours.length ? (
                <ul className="mt-2 space-y-1">
                  {settings.openingHours.map((h) => (
                    <li key={h.day} className="flex justify-between gap-4 border-b border-white/10 pb-1">
                      <span>{h.day}</span>
                      <span>{h.hours}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1">Please message us on WhatsApp to check our opening hours.</p>
              )}
            </div>
            <Link to="/contact" className="inline-flex items-center gap-1 text-gold-soft underline-offset-4 hover:underline">
              Contact details &amp; directions <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
