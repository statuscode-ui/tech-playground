import { describe, expect, it } from 'vitest';
import { normalizeWhatsAppNumber, productEnquiryMessage, serviceBookingMessage, whatsappUrl } from './whatsapp';

describe('normalizeWhatsAppNumber', () => {
  it('converts a local Ghana number to international digits', () => {
    expect(normalizeWhatsAppNumber('0503495079')).toBe('233503495079');
    expect(normalizeWhatsAppNumber('050 349 5079')).toBe('233503495079');
  });
  it('strips plus signs, spaces and 00 prefixes', () => {
    expect(normalizeWhatsAppNumber('+233 50 349 5079')).toBe('233503495079');
    expect(normalizeWhatsAppNumber('00233503495079')).toBe('233503495079');
    expect(normalizeWhatsAppNumber('233503495079')).toBe('233503495079');
  });
  it('rejects implausible numbers', () => {
    expect(normalizeWhatsAppNumber('')).toBe('');
    expect(normalizeWhatsAppNumber('12345')).toBe('');
    expect(normalizeWhatsAppNumber('abc')).toBe('');
  });
});

describe('whatsappUrl', () => {
  it('builds a wa.me link with an encoded message', () => {
    const url = whatsappUrl('233503495079', 'Hi & hello\nLine 2');
    expect(url).toBe('https://wa.me/233503495079?text=Hi%20%26%20hello%0ALine%202');
  });
  it('returns empty string for an invalid number', () => {
    expect(whatsappUrl('abc', 'x')).toBe('');
  });
});

describe('booking messages', () => {
  it('includes the treatment, option and price', () => {
    const msg = serviceBookingMessage('Serenity Haven Spa', { name: 'Hot Stone Massage' }, { label: '60 minutes', durationMinutes: 60, price: 280, promoPrice: null }, 'GH₵');
    expect(msg).toContain('Serenity Haven Spa');
    expect(msg).toContain('Hot Stone Massage (60 minutes) – GH₵ 280');
    expect(msg).toContain('Preferred date');
    expect(msg).toContain('Preferred time');
  });
  it('shows offer price when lower and "price on request" when missing', () => {
    expect(serviceBookingMessage('S', { name: 'Facial' }, { label: '', durationMinutes: null, price: 300, promoPrice: 250 }, 'GH₵')).toContain('GH₵ 250 (offer price)');
    expect(serviceBookingMessage('S', { name: 'Facial' }, { label: '', durationMinutes: null, price: null, promoPrice: null }, 'GH₵')).toContain('Facial – price on request');
  });
  it('builds product enquiries with size', () => {
    const msg = productEnquiryMessage('S', { name: 'Body oil', price: 1200, promoPrice: null, size: '250 ml' }, 'GH₵');
    expect(msg).toContain('Body oil (250 ml) – GH₵ 1,200');
  });
});
