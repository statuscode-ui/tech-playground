import { emptyFaq, emptyProduct, emptyPromotion, emptyService, emptyTestimonial } from '../data/defaults';
import { formatPrice, startingPrice } from '../lib/format';
import { isPromotionActive } from '../lib/promotions';
import type { Faq, Product, Promotion, Service, Testimonial } from '../lib/types';
import { STOCK_LABELS } from '../lib/types';
import CollectionManager from './CollectionManager';
import type { FieldDef } from './fields';

const common = {
  published: { key: 'published', label: 'Published (visible on the website)', type: 'checkbox' } as FieldDef,
  featured: { key: 'featured', label: 'Featured on the home page', type: 'checkbox' } as FieldDef,
  order: { key: 'order', label: 'Display order', type: 'number', help: 'Lower numbers appear first.' } as FieldDef,
  slug: { key: 'slug', label: 'Web address (slug)', type: 'text', help: 'Leave empty to generate from the name, e.g. hot-stone-massage.' } as FieldDef,
};

const serviceFields: FieldDef[] = [
  { key: 'name', label: 'Treatment name', type: 'text', required: true, max: 100 },
  { key: 'category', label: 'Category', type: 'text', required: true, help: 'e.g. Massages, Facials, Nail care, Waxing', max: 60 },
  { key: 'description', label: 'Description', type: 'textarea', required: true, max: 2000 },
  { key: 'options', label: 'Durations & prices', type: 'serviceOptions', help: 'Leave the price empty to show “Price on request”.' },
  { key: 'imageUrl', label: 'Photo', type: 'image' },
  { key: 'imageAlt', label: 'Photo description (for screen readers)', type: 'text', max: 200 },
  { key: 'preparation', label: 'Preparation instructions', type: 'textarea', max: 2000 },
  { key: 'aftercare', label: 'Aftercare instructions', type: 'textarea', max: 2000 },
  { key: 'available', label: 'Currently available to book', type: 'checkbox' },
  common.published,
  common.featured,
  common.order,
  common.slug,
];

const productFields: FieldDef[] = [
  { key: 'name', label: 'Product name', type: 'text', required: true, max: 100 },
  { key: 'category', label: 'Category', type: 'text', required: true, max: 60 },
  { key: 'description', label: 'Description', type: 'textarea', required: true, max: 2000 },
  { key: 'price', label: 'Price', type: 'price' },
  { key: 'promoPrice', label: 'Offer price (optional)', type: 'price' },
  { key: 'size', label: 'Size / variant', type: 'text', help: 'e.g. 250 ml', max: 60 },
  {
    key: 'stockStatus',
    label: 'Availability',
    type: 'select',
    options: Object.entries(STOCK_LABELS).map(([value, label]) => ({ value, label })),
  },
  { key: 'imageUrl', label: 'Photo', type: 'image' },
  { key: 'imageAlt', label: 'Photo description (for screen readers)', type: 'text', max: 200 },
  { key: 'usage', label: 'How to use', type: 'textarea', max: 2000 },
  { key: 'ingredients', label: 'Ingredients', type: 'textarea', max: 2000 },
  common.published,
  common.featured,
  common.order,
  common.slug,
];

const faqFields: FieldDef[] = [
  { key: 'question', label: 'Question', type: 'text', required: true, max: 200 },
  { key: 'answer', label: 'Approved answer', type: 'textarea', required: true, max: 2000, help: 'The chat assistant uses this answer, so keep it accurate.' },
  { key: 'category', label: 'Group', type: 'text', help: 'e.g. Booking, Visiting, Treatments', max: 60 },
  common.published,
  common.order,
];

const promotionFields: FieldDef[] = [
  { key: 'title', label: 'Title', type: 'text', required: true, max: 100 },
  { key: 'description', label: 'Details', type: 'textarea', required: true, max: 500 },
  { key: 'startDate', label: 'Start date', type: 'date', help: 'Leave empty to start now.' },
  { key: 'endDate', label: 'End date (last day of the offer)', type: 'date', help: 'Leave empty for no end date.' },
  common.published,
];

const testimonialFields: FieldDef[] = [
  { key: 'name', label: 'Guest name (as they agreed to be shown)', type: 'text', required: true, max: 60 },
  { key: 'quote', label: 'Review', type: 'textarea', required: true, max: 800 },
  { key: 'rating', label: 'Rating (1-5 stars)', type: 'number', required: true, min: 1, max: 5 },
  common.published,
  common.order,
];

export function ServicesAdmin() {
  return (
    <CollectionManager<Service>
      name="services"
      title="Treatments"
      singular="Treatment"
      fields={serviceFields}
      empty={emptyService as Service}
      slugFrom="name"
      summary={(s) => {
        const p = startingPrice(s.options);
        return { title: s.name, subtitle: `${s.category} · ${p == null ? 'Price on request' : `from ${formatPrice(p)}`}${s.available ? '' : ' · unavailable'}` };
      }}
    />
  );
}

export function ProductsAdmin() {
  return (
    <CollectionManager<Product>
      name="products"
      title="Products"
      singular="Product"
      fields={productFields}
      empty={emptyProduct as Product}
      slugFrom="name"
      summary={(p) => ({ title: p.name, subtitle: `${p.category} · ${p.price == null ? 'Price on request' : formatPrice(p.price)} · ${STOCK_LABELS[p.stockStatus]}` })}
    />
  );
}

export function FaqsAdmin() {
  return (
    <CollectionManager<Faq>
      name="faqs"
      title="FAQs & assistant answers"
      singular="FAQ"
      intro="Published FAQs appear on the website and are used by the chat assistant."
      fields={faqFields}
      empty={emptyFaq as Faq}
      summary={(f) => ({ title: f.question, subtitle: f.category })}
    />
  );
}

export function PromotionsAdmin() {
  return (
    <CollectionManager<Promotion>
      name="promotions"
      title="Promotions"
      singular="Promotion"
      intro="Only published promotions within their dates are shown on the website."
      fields={promotionFields}
      empty={emptyPromotion as Promotion}
      summary={(p) => ({
        title: p.title,
        subtitle: `${p.startDate || 'now'} → ${p.endDate || 'no end date'} · ${isPromotionActive(p) ? 'running now' : 'not running'}`,
      })}
    />
  );
}

export function TestimonialsAdmin() {
  return (
    <CollectionManager<Testimonial>
      name="testimonials"
      title="Testimonials"
      singular="Testimonial"
      intro="Add only genuine reviews from real guests, with their permission."
      fields={testimonialFields}
      empty={emptyTestimonial as Testimonial}
      summary={(t) => ({ title: t.name, subtitle: `${t.rating}★ · ${t.quote.slice(0, 80)}` })}
    />
  );
}
