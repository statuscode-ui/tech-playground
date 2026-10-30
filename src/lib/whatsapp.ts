import { formatPrice } from './format';
import type { Product, Service, ServiceOption } from './types';

/**
 * Normalises a phone number to the digits-only international format wa.me expects.
 * A leading 0 is treated as a local number and replaced with the default country code.
 * Returns '' when the result is not a plausible international number.
 */
export function normalizeWhatsAppNumber(input: string, defaultCountryCode = '233'): string {
  let digits = input.replace(/\D/g, '');
  if (input.trim().startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = defaultCountryCode + digits.slice(1);
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : '';
}

export function whatsappUrl(number: string, message?: string): string {
  const n = normalizeWhatsAppNumber(number);
  if (!n) return '';
  return message ? `https://wa.me/${n}?text=${encodeURIComponent(message)}` : `https://wa.me/${n}`;
}

function priceText(price: number | null, promo: number | null, currency: string): string {
  if (price == null) return 'price on request';
  if (promo != null && promo < price) return `${formatPrice(promo, currency)} (offer price)`;
  return formatPrice(price, currency);
}

export function serviceBookingMessage(
  spaName: string,
  service: Pick<Service, 'name'>,
  option: ServiceOption | undefined,
  currency: string,
): string {
  const detail = option
    ? `${service.name}${option.label ? ` (${option.label})` : ''} – ${priceText(option.price, option.promoPrice, currency)}`
    : service.name;
  return [
    `Hello ${spaName}! I would like to book an appointment.`,
    '',
    `Treatment: ${detail}`,
    'Preferred date: ',
    'Preferred time: ',
    'Home service or visit the spa: ',
    '',
    'Please let me know if this time is available. Thank you!',
  ].join('\n');
}

export function productEnquiryMessage(
  spaName: string,
  product: Pick<Product, 'name' | 'price' | 'promoPrice' | 'size'>,
  currency: string,
): string {
  const size = product.size ? ` (${product.size})` : '';
  return [
    `Hello ${spaName}! I'm interested in this product:`,
    '',
    `Product: ${product.name}${size} – ${priceText(product.price, product.promoPrice, currency)}`,
    'Quantity: ',
    'Pickup or delivery: ',
    '',
    'Is it available? Thank you!',
  ].join('\n');
}

export function generalEnquiryMessage(spaName: string, topic?: string): string {
  return topic
    ? `Hello ${spaName}! I have a question about: ${topic}`
    : `Hello ${spaName}! I would like to make an enquiry.`;
}
