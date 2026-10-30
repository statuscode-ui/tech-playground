import type { Faq, Product, Promotion, Service, SiteSettings, Testimonial } from '../lib/types';
import { seedSettings } from './seed';

// Empty documents used to fill in missing fields when reading from Firestore and as
// the starting point for "Add new" forms in the dashboard.

export const emptySettings: SiteSettings = {
  ...seedSettings,
  spaName: '',
  tagline: '',
  intro: '',
  mission: '',
  story: '',
  phoneDisplay: '',
  whatsappNumber: '',
  address: '',
  homeServiceNote: '',
  social: { instagram: '', facebook: '', tiktok: '' },
};

export const emptyService: Omit<Service, 'id'> = {
  name: '',
  slug: '',
  category: '',
  description: '',
  imageUrl: '',
  imageAlt: '',
  options: [{ label: '', durationMinutes: null, price: null, promoPrice: null }],
  preparation: '',
  aftercare: '',
  available: true,
  published: false,
  featured: false,
  order: 100,
};

export const emptyProduct: Omit<Product, 'id'> = {
  name: '',
  slug: '',
  category: '',
  description: '',
  imageUrl: '',
  imageAlt: '',
  price: null,
  promoPrice: null,
  size: '',
  stockStatus: 'in_stock',
  usage: '',
  ingredients: '',
  published: false,
  featured: false,
  order: 100,
};

export const emptyFaq: Omit<Faq, 'id'> = { question: '', answer: '', category: '', published: false, order: 100 };

export const emptyPromotion: Omit<Promotion, 'id'> = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  published: false,
};

export const emptyTestimonial: Omit<Testimonial, 'id'> = {
  name: '',
  quote: '',
  rating: 5,
  published: false,
  order: 100,
};

/** Shallow merge that keeps defaults for missing or wrongly-typed fields. */
export function withDefaults<T extends object>(defaults: T, data: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
  for (const [k, def] of Object.entries(defaults)) {
    const v = data[k];
    if (v === undefined) continue;
    if (def === null || v === null || typeof v === typeof def) out[k] = v;
  }
  for (const [k, v] of Object.entries(data)) if (!(k in defaults)) out[k] = v;
  return out as T;
}
