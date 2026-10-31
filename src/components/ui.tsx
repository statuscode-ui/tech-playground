import { Flower2, Info, LoaderCircle } from 'lucide-react';
import { WhatsAppIcon } from './BrandIcons';
import { useImageSrc } from '../lib/media';
import type { ReactNode } from 'react';
import { useSiteData } from '../data/SiteData';
import { formatPrice } from '../lib/format';
import { whatsappUrl } from '../lib/whatsapp';

export function SpaImage({ src, alt, className = '', eager = false }: { src: string; alt: string; className?: string; eager?: boolean }) {
  // Handles normal links and photos uploaded from the dashboard ("media:<id>").
  const url = useImageSrc(src);
  if (!url)
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-mint via-meadow to-berry-soft ${className}`}
        role="img"
        aria-label={alt || 'Image coming soon'}
      >
        <Flower2 className="h-10 w-10 text-leaf/40" aria-hidden />
      </div>
    );
  return <img src={url} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" className={`object-cover ${className}`} />;
}

export function Price({ price, promoPrice, className = '' }: { price: number | null; promoPrice: number | null; className?: string }) {
  const { settings } = useSiteData();
  const cur = settings.currencySymbol;
  if (price == null) return <span className={`text-muted ${className}`}>Price on request</span>;
  if (promoPrice != null && promoPrice < price)
    return (
      <span className={className}>
        <span className="font-medium text-leaf">{formatPrice(promoPrice, cur)}</span>{' '}
        <s className="text-sm text-muted" aria-label={`was ${formatPrice(price, cur)}`}>
          {formatPrice(price, cur)}
        </s>
      </span>
    );
  return <span className={`font-medium text-leaf ${className}`}>{formatPrice(price, cur)}</span>;
}

export function WhatsAppLink({
  message,
  children,
  className = 'btn-whatsapp',
  onClick,
  icon,
}: {
  message?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  /** Replaces the default WhatsApp glyph, e.g. a calendar on "Book" buttons. */
  icon?: ReactNode;
}) {
  const { settings } = useSiteData();
  const href = whatsappUrl(settings.whatsappNumber, message);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
      {icon ?? <WhatsAppIcon className="h-4 w-4" />}
      {children}
      <span className="sr-only"> (opens WhatsApp)</span>
    </a>
  );
}

export function BookingNote({ className = '' }: { className?: string }) {
  return (
    <p className={`flex items-start gap-2 text-xs leading-relaxed text-muted ${className}`}>
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      Sending a WhatsApp message doesn’t confirm your booking. Your appointment is confirmed once we reply.
    </p>
  );
}

export function SectionHeading({ eyebrow, title, intro, align = 'center' }: { eyebrow?: string; title: string; intro?: string; align?: 'center' | 'left' }) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-3 text-3xl sm:text-4xl">{title}</h2>
      {intro && <p className="mt-4 leading-relaxed text-muted">{intro}</p>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <header className="under-header border-b border-linen/60 bg-gradient-to-b from-meadow/70 to-cream">
      <div className="container-page py-14 text-center sm:py-20">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-3 text-4xl sm:text-5xl">{title}</h1>
        <div className="accent-rule mt-6" />
        {intro && <p className="mx-auto mt-6 max-w-2xl leading-relaxed text-muted">{intro}</p>}
      </div>
    </header>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted" role="status">
      <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden />
      {label}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <Flower2 className="mx-auto h-8 w-8 text-sage" aria-hidden />
      <h3 className="mt-3 text-2xl">{title}</h3>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="container-page mt-6">
      <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</p>
    </div>
  );
}
