import { CalendarDays, ChevronRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteData } from '../data/SiteData';
import { formatDuration, startingPrice } from '../lib/format';
import type { Product, Service } from '../lib/types';
import { STOCK_LABELS } from '../lib/types';
import { productEnquiryMessage, serviceBookingMessage } from '../lib/whatsapp';
import { Price, SpaImage, WhatsAppLink } from './ui';

export function ServiceCard({ service }: { service: Service }) {
  const { settings } = useSiteData();
  const from = startingPrice(service.options);
  const single = service.options.length === 1 ? service.options[0] : undefined;
  const durations = service.options.map((o) => formatDuration(o.durationMinutes)).filter(Boolean);

  return (
    <article className="card group flex flex-col">
      <Link to={`/treatments/${service.slug}`} className="block overflow-hidden" tabIndex={-1} aria-hidden>
        <SpaImage src={service.imageUrl} alt={service.imageAlt} className="aspect-[4/3] w-full transition duration-500 group-hover:scale-[1.03]" />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow">{service.category}</p>
        <h3 className="mt-2 text-2xl">
          <Link to={`/treatments/${service.slug}`} className="hover:underline hover:decoration-berry/60 hover:underline-offset-4">
            {service.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{service.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {single ? (
            <Price price={single.price} promoPrice={single.promoPrice} />
          ) : from != null ? (
            <span>
              <span className="text-muted">From </span>
              <Price price={from} promoPrice={null} />
            </span>
          ) : (
            <Price price={null} promoPrice={null} />
          )}
          {durations.length > 0 && (
            <span className="inline-flex items-center gap-1 text-muted">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {durations.join(' · ')}
            </span>
          )}
        </div>
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          {service.available ? (
            <WhatsAppLink message={serviceBookingMessage(settings.spaName, service, single, settings.currencySymbol)} className="btn-whatsapp flex-1">
              Book on WhatsApp
            </WhatsAppLink>
          ) : (
            <span className="badge bg-meadow text-muted">Currently unavailable</span>
          )}
          <Link to={`/treatments/${service.slug}`} className="btn-outline">
            Details<span className="sr-only"> about {service.name}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

const stockStyles: Record<string, string> = {
  in_stock: 'bg-mint text-leaf',
  low_stock: 'bg-berry-soft text-leaf',
  out_of_stock: 'bg-meadow text-muted',
  preorder: 'bg-meadow text-leaf',
};

export function ProductCard({ product }: { product: Product }) {
  const { settings } = useSiteData();
  return (
    <article className="card group flex flex-col">
      <Link to={`/products/${product.slug}`} className="block overflow-hidden" tabIndex={-1} aria-hidden>
        <SpaImage src={product.imageUrl} alt={product.imageAlt} className="aspect-square w-full transition duration-500 group-hover:scale-[1.03]" />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="eyebrow">{product.category}</p>
          <span className={`badge ${stockStyles[product.stockStatus]}`}>{STOCK_LABELS[product.stockStatus]}</span>
        </div>
        <h3 className="mt-2 text-xl">
          <Link to={`/products/${product.slug}`} className="hover:underline hover:decoration-berry/60 hover:underline-offset-4">
            {product.name}
          </Link>
        </h3>
        {product.placeholder && <span className="badge mt-1 w-fit bg-amber-100 text-amber-900">Placeholder</span>}
        {product.size && <p className="text-sm text-muted">{product.size}</p>}
        <p className="mt-2 line-clamp-2 text-sm text-muted">{product.description}</p>
        <Price className="mt-3" price={product.price} promoPrice={product.promoPrice} />
        <div className="mt-auto pt-4">
          {product.stockStatus !== 'out_of_stock' ? (
            <WhatsAppLink message={productEnquiryMessage(settings.spaName, product, settings.currencySymbol)} className="btn-whatsapp w-full">
              Order on WhatsApp
            </WhatsAppLink>
          ) : (
            <WhatsAppLink message={`Hello ${settings.spaName}! Please let me know when ${product.name} is back in stock.`} className="btn-outline w-full">
              Ask about restock
            </WhatsAppLink>
          )}
        </div>
      </div>
    </article>
  );
}

/** Photo tile with a dark label bar, linking to the treatments list filtered to one category. */
export function CategoryTile({ category, imageUrl, imageAlt, count }: { category: string; imageUrl: string; imageAlt: string; count: number }) {
  return (
    <Link
      to={`/treatments?category=${encodeURIComponent(category)}`}
      className="group block overflow-hidden rounded-2xl bg-leaf shadow-[0_10px_30px_-18px_rgba(20,61,37,0.6)] transition hover:-translate-y-0.5"
    >
      <SpaImage src={imageUrl} alt={imageAlt} className="aspect-square w-full transition duration-500 group-hover:scale-[1.04]" />
      <span className="label-caps flex items-center justify-between gap-2 px-4 py-4 text-white sm:px-5">
        <span className="truncate">{category}</span>
        <ChevronRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" aria-hidden />
      </span>
      <span className="sr-only">
        {count} treatment{count === 1 ? '' : 's'}
      </span>
    </Link>
  );
}

/** Large feature card for the home page "Signature treatments" section. */
export function SignatureCard({ service, badge }: { service: Service; badge: string }) {
  const { settings } = useSiteData();
  const from = startingPrice(service.options);
  const single = service.options.length === 1 ? service.options[0] : undefined;
  return (
    <article className="flex flex-col overflow-hidden rounded-[1.75rem] bg-ivory shadow-[0_18px_40px_-24px_rgba(20,61,37,0.55)] ring-1 ring-linen/70">
      <div className="relative">
        <SpaImage src={service.imageUrl} alt={service.imageAlt} className="aspect-[4/3] w-full rounded-b-[1.75rem]" />
        <span className="label-caps absolute top-4 left-4 rounded-full bg-leaf px-4 py-2 text-xs text-white">{badge}</span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="label-caps text-base text-leaf">{service.name}</h3>
        <p className="mt-3 line-clamp-3 leading-relaxed text-muted">{service.description}</p>
        <p className="mt-4">
          {single ? (
            <Price price={single.price} promoPrice={single.promoPrice} />
          ) : from != null ? (
            <>
              <span className="text-muted">From </span>
              <Price price={from} promoPrice={null} />
            </>
          ) : (
            <Price price={null} promoPrice={null} />
          )}
        </p>
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          {service.available && (
            <WhatsAppLink
              message={serviceBookingMessage(settings.spaName, service, single, settings.currencySymbol)}
              className="btn-whatsapp flex-1"
              icon={<CalendarDays className="h-4 w-4" aria-hidden />}
            >
              Book now
            </WhatsAppLink>
          )}
          <Link to={`/treatments/${service.slug}`} className="btn-outline">
            Details<span className="sr-only"> about {service.name}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
