import type { Faq, Product, Promotion, Service, SiteSettings, Testimonial } from '../lib/types';

/*
 * Starter content. Everything here comes from Serenity Haven Spa's own flyers and
 * Instagram posts. Anything not stated there (prices, opening hours, full address,
 * products) is left empty or marked as a placeholder for the owner to fill in from
 * the admin dashboard. Do not add invented business details here.
 */

export const seedSettings: SiteSettings = {
  spaName: 'Serenity Haven Spa',
  tagline: 'Relax, Restore, Rejuvenate.',
  intro:
    'A tranquil oasis where you can escape the stresses of everyday life and indulge in rejuvenating treatments that nourish both body and soul.',
  mission:
    'At Serenity Haven Spa, our mission is to provide a tranquil oasis where individuals can escape the stresses of everyday life and indulge in rejuvenating treatments that nourish both body and soul. We are dedicated to delivering exceptional spa experiences that promote relaxation, wellness, and inner peace.',
  story:
    'Serenity Haven Spa was founded on the principle of creating a haven of peace and tranquility, where guests can unwind and recharge. Our team of expert therapists and staff are passionate about providing personalized care and attention, ensuring that every visit is a memorable and transformative experience.',
  phoneDisplay: '050 349 5079',
  whatsappNumber: '233503495079',
  email: '',
  address: 'Oyarifa',
  mapUrl: '',
  openingHours: [],
  logoUrl: '',
  currencySymbol: 'GH₵',
  social: {
    instagram: 'https://www.instagram.com/serenity.havenspa/',
    facebook: '',
    tiktok: '',
  },
  homeServiceEnabled: true,
  homeServiceNote:
    'We offer home service. Transport cost varies depending on your location, and pre-payment of the full transportation fee is required before our therapist is dispatched.',
  policies: '',
  giftVouchers: '',
  generalAftercare: '',
  extraKnowledge: '',
};

const priceOnRequest = [{ label: '', durationMinutes: null, price: null, promoPrice: null }];

export const seedServices: Service[] = [
  {
    id: 'hot-stone-massage',
    name: 'Hot Stone Massage',
    slug: 'hot-stone-massage',
    category: 'Massages',
    description:
      'Experience the healing warmth of hot stones. Smooth, heated stones are placed along the body and used with massage strokes to melt away tension. Guests choose it to ease tight muscles, unwind deeply and enjoy a calmer, more restful state.',
    imageUrl: '/images/hot-stone.webp',
    imageAlt: 'Therapist placing warm black stones along a guest’s back',
    options: priceOnRequest,
    preparation: '',
    aftercare: '',
    available: true,
    published: true,
    featured: true,
    order: 1,
  },
  {
    id: 'facial',
    name: 'Facial',
    slug: 'facial',
    category: 'Facials',
    description:
      'Glowing skin, don’t care! Treat yourself to some self-love with a facial, including a gentle steam to prepare and refresh the skin.',
    imageUrl: '/images/facial.webp',
    imageAlt: 'Therapist giving a guest a steam facial',
    options: priceOnRequest,
    preparation: '',
    aftercare: '',
    available: true,
    published: true,
    featured: true,
    order: 2,
  },
  {
    id: 'pedicure',
    name: 'Pedicure',
    slug: 'pedicure',
    category: 'Nail care',
    description:
      'A relaxing foot soak, scrub and care for soft, refreshed feet, finished with attention to your nails.',
    imageUrl: '/images/pedicure.webp',
    imageAlt: 'Therapist washing a guest’s foot over a foot bath with rose petals',
    options: priceOnRequest,
    preparation: '',
    aftercare: '',
    available: true,
    published: true,
    featured: true,
    order: 3,
  },
  {
    id: 'waxing',
    name: 'Waxing',
    slug: 'waxing',
    category: 'Waxing',
    description: 'Professional waxing for smooth skin. Ask us on WhatsApp which areas are available.',
    imageUrl: '',
    imageAlt: '',
    options: priceOnRequest,
    preparation: '',
    aftercare: '',
    available: true,
    published: true,
    featured: false,
    order: 4,
  },
];

/** Placeholder products: imported unpublished, shown only in demo mode with a clear badge. */
export const seedProducts: Product[] = [
  {
    id: 'placeholder-body-oil',
    name: 'Body oil (placeholder)',
    slug: 'body-oil-placeholder',
    category: 'Body care',
    description: 'Placeholder product. Replace with a product the spa actually sells, or delete it.',
    imageUrl: '',
    imageAlt: '',
    price: null,
    promoPrice: null,
    size: '',
    stockStatus: 'in_stock',
    usage: '',
    ingredients: '',
    published: false,
    featured: true,
    order: 1,
    placeholder: true,
  },
  {
    id: 'placeholder-body-scrub',
    name: 'Body scrub (placeholder)',
    slug: 'body-scrub-placeholder',
    category: 'Body care',
    description: 'Placeholder product. Replace with a product the spa actually sells, or delete it.',
    imageUrl: '',
    imageAlt: '',
    price: null,
    promoPrice: null,
    size: '',
    stockStatus: 'in_stock',
    usage: '',
    ingredients: '',
    published: false,
    featured: true,
    order: 2,
    placeholder: true,
  },
];

export const seedFaqs: Faq[] = [
  {
    id: 'how-to-book',
    question: 'How do I book an appointment?',
    answer:
      'Tap any “Book on WhatsApp” button and send us the prefilled message with your preferred date and time. Your appointment is confirmed only once we reply to confirm it.',
    category: 'Booking',
    published: true,
    order: 1,
  },
  {
    id: 'home-service',
    question: 'Do you offer home service?',
    answer:
      'Yes. Transport cost varies depending on your location, and pre-payment of the full transportation fee is required before our therapist is dispatched.',
    category: 'Booking',
    published: true,
    order: 2,
  },
  {
    id: 'location',
    question: 'Where are you located?',
    answer: 'We are in Oyarifa. Message us on WhatsApp for directions.',
    category: 'Visiting',
    published: true,
    order: 3,
  },
  {
    id: 'prices',
    question: 'How much do your treatments cost?',
    answer:
      'Prices are listed on each treatment. Where a price is not shown, message us on WhatsApp and we will share it.',
    category: 'Booking',
    published: true,
    order: 4,
  },
];

export const seedPromotions: Promotion[] = [];

/** Demo-mode only. Clearly labelled on the site and never imported into Firestore. */
export const sampleTestimonials: Testimonial[] = [
  {
    id: 'sample-1',
    name: 'Sample guest',
    quote: 'This is a sample review. Real reviews from your guests will appear here once you add them.',
    rating: 5,
    published: true,
    order: 1,
    sample: true,
  },
  {
    id: 'sample-2',
    name: 'Sample guest',
    quote: 'Another sample review, shown only until genuine customer feedback is added in the dashboard.',
    rating: 5,
    published: true,
    order: 2,
    sample: true,
  },
];
