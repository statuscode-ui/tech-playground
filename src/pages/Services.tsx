import { ArrowLeft, Clock, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ServiceCard } from '../components/Cards';
import { BookingNote, EmptyState, LoadingState, PageHeader, Price, SpaImage, WhatsAppLink } from '../components/ui';
import { useSiteData } from '../data/SiteData';
import { formatDuration } from '../lib/format';
import { usePageMeta } from '../lib/seo';
import { serviceBookingMessage } from '../lib/whatsapp';
import NotFound from './NotFound';

export function CategoryChips({ categories, value, onChange, label }: { categories: string[]; value: string; onChange: (v: string) => void; label: string }) {
  if (categories.length < 2) return null;
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {['All', ...categories].map((c) => {
        const active = (c === 'All' && !value) || c === value;
        return (
          <button
            key={c}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(c === 'All' ? '' : c)}
            className={`min-h-10 rounded-full border px-4 text-sm transition ${active ? 'border-forest bg-forest text-white' : 'border-linen bg-ivory text-ink hover:border-forest/40'}`}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}

export default function Services() {
  const { settings, services, loading } = useSiteData();
  usePageMeta(`Treatments & prices | ${settings.spaName}`, `Massages, facials, nail care and more at ${settings.spaName}. See prices and book on WhatsApp.`);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const categories = useMemo(() => [...new Set(services.map((s) => s.category).filter(Boolean))], [services]);
  const list = services.filter(
    (s) => (!cat || s.category === cat) && (!q || `${s.name} ${s.category} ${s.description}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <>
      <PageHeader eyebrow="Treatments" title="Treatments & prices" intro="Find your treatment, then book it on WhatsApp with your preferred date and time." />
      <div className="container-page mt-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CategoryChips categories={categories} value={cat} onChange={setCat} label="Filter by category" />
          <label className="relative block md:w-72">
            <span className="sr-only">Search treatments</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input className="input pl-9" type="search" placeholder="Search treatments" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>
        <BookingNote className="mt-4" />
        {loading ? (
          <LoadingState />
        ) : list.length === 0 ? (
          <div className="mt-12">
            <EmptyState title={services.length ? 'No matching treatments' : 'Treatments coming soon'}>
              {services.length ? 'Try another search or category.' : 'Our treatment menu is being updated. Message us on WhatsApp for details.'}
            </EmptyState>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function ServiceDetail() {
  const { slug } = useParams();
  const { settings, services, loading } = useSiteData();
  const service = services.find((s) => s.slug === slug);
  usePageMeta(
    service ? `${service.name} | ${settings.spaName}` : `Treatment | ${settings.spaName}`,
    service?.description.slice(0, 155) || `Treatments at ${settings.spaName}.`,
    { image: service?.imageUrl || undefined },
  );

  if (loading) return <LoadingState />;
  if (!service) return <NotFound />;

  return (
    <article className="container-page py-10 sm:py-14">
      <Link to="/treatments" className="inline-flex items-center gap-1 text-sm text-muted hover:text-forest">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All treatments
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <SpaImage src={service.imageUrl} alt={service.imageAlt} eager className="aspect-[4/3] w-full rounded-[2rem] lg:aspect-[4/5]" />
        <div>
          <p className="eyebrow">{service.category}</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">{service.name}</h1>
          <p className="mt-5 leading-relaxed text-muted">{service.description}</p>
          {!service.available && <p className="badge mt-4 bg-sand text-muted">Currently unavailable</p>}

          <h2 className="mt-8 text-2xl">Prices</h2>
          <ul className="mt-3 divide-y divide-linen rounded-2xl border border-linen bg-ivory">
            {service.options.map((o, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{o.label || formatDuration(o.durationMinutes) || service.name}</p>
                  {o.durationMinutes && o.label && (
                    <p className="flex items-center gap-1 text-sm text-muted">
                      <Clock className="h-3.5 w-3.5" aria-hidden /> {formatDuration(o.durationMinutes)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Price price={o.price} promoPrice={o.promoPrice} />
                  {service.available && (
                    <WhatsAppLink message={serviceBookingMessage(settings.spaName, service, o, settings.currencySymbol)} className="btn-whatsapp min-h-10 px-4 text-xs">
                      Book<span className="sr-only"> {o.label}</span>
                    </WhatsAppLink>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <BookingNote className="mt-3" />

          {service.preparation && (
            <section className="mt-8">
              <h2 className="text-2xl">Before your treatment</h2>
              <p className="mt-2 leading-relaxed whitespace-pre-line text-muted">{service.preparation}</p>
            </section>
          )}
          {service.aftercare && (
            <section className="mt-8">
              <h2 className="text-2xl">Aftercare</h2>
              <p className="mt-2 leading-relaxed whitespace-pre-line text-muted">{service.aftercare}</p>
            </section>
          )}
          {settings.homeServiceEnabled && settings.homeServiceNote && (
            <p className="mt-8 rounded-2xl bg-sage-soft/60 p-4 text-sm leading-relaxed text-forest">{settings.homeServiceNote}</p>
          )}
        </div>
      </div>
    </article>
  );
}
