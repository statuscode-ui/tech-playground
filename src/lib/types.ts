// Shared data model. Field names match the Firestore documents exactly.

export interface OpeningHours {
  day: string; // e.g. "Monday – Friday"
  hours: string; // e.g. "9:00 am – 7:00 pm" or "Closed"
}

export interface SiteSettings {
  spaName: string;
  tagline: string;
  intro: string;
  mission: string;
  story: string;
  phoneDisplay: string; // shown to visitors, e.g. "050 349 5079"
  whatsappNumber: string; // international digits only, e.g. "233503495079"
  email: string;
  address: string;
  mapUrl: string;
  openingHours: OpeningHours[];
  logoUrl: string;
  currencySymbol: string;
  social: { instagram: string; facebook: string; tiktok: string };
  homeServiceEnabled: boolean;
  homeServiceNote: string;
  policies: string; // booking, cancellation, late arrival… used by the assistant
  giftVouchers: string; // empty when not offered
  generalAftercare: string;
  extraKnowledge: string; // anything else the assistant may use
}

export interface ServiceOption {
  label: string; // e.g. "60 minutes"
  durationMinutes: number | null;
  price: number | null; // null = price on request
  promoPrice: number | null;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  options: ServiceOption[];
  preparation: string;
  aftercare: string;
  available: boolean;
  published: boolean;
  featured: boolean;
  order: number;
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder';

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  price: number | null;
  promoPrice: number | null;
  size: string;
  stockStatus: StockStatus;
  usage: string;
  ingredients: string;
  published: boolean;
  featured: boolean;
  order: number;
  /** Placeholder entries shipped with the template; never shown as real stock. */
  placeholder?: boolean;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  published: boolean;
  order: number;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD (inclusive)
  published: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  quote: string;
  rating: number; // 1-5
  published: boolean;
  order: number;
  /** Sample content used in demo mode only. Never stored in Firestore. */
  sample?: boolean;
}

export interface Enquiry {
  id: string;
  name: string;
  contact: string;
  subject: string;
  message: string;
  consent: boolean;
  status: 'new' | 'handled';
  createdAt: Date | null;
}

export const STOCK_LABELS: Record<StockStatus, string> = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
  preorder: 'Available to order',
};
