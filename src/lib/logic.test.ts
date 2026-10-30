import { describe, expect, it } from 'vitest';
import { formatDuration, formatPrice, slugify, startingPrice } from './format';
import { isPromotionActive } from './promotions';
import { validateEnquiry } from './enquiry';
import { SlidingWindowLimiter } from './rateLimit';
import { sortProducts } from '../pages/Products';
import { emptyProduct, withDefaults } from '../data/defaults';
import type { Product } from './types';

describe('format', () => {
  it('formats prices and durations', () => {
    expect(formatPrice(1500)).toBe('GH₵ 1,500');
    expect(formatPrice(99.5, '$')).toBe('$ 99.50');
    expect(formatDuration(90)).toBe('1 hr 30 min');
    expect(formatDuration(120)).toBe('2 hrs');
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(null)).toBe('');
  });
  it('slugifies names', () => {
    expect(slugify('Hot Stone Massage')).toBe('hot-stone-massage');
    expect(slugify('Head, Neck & Shoulder')).toBe('head-neck-and-shoulder');
  });
  it('finds the starting price, honouring offers', () => {
    expect(startingPrice([{ price: 280, promoPrice: null }, { price: 200, promoPrice: 150 }])).toBe(150);
    expect(startingPrice([{ price: null, promoPrice: null }])).toBeNull();
  });
});

describe('promotions', () => {
  const p = { id: '1', title: 't', description: 'd', startDate: '2026-11-01', endDate: '2026-11-30', published: true };
  it('is active only within its dates (inclusive)', () => {
    expect(isPromotionActive(p, '2026-10-31')).toBe(false);
    expect(isPromotionActive(p, '2026-11-01')).toBe(true);
    expect(isPromotionActive(p, '2026-11-30')).toBe(true);
    expect(isPromotionActive(p, '2026-12-01')).toBe(false);
  });
  it('is never active when unpublished; open-ended dates work', () => {
    expect(isPromotionActive({ ...p, published: false }, '2026-11-10')).toBe(false);
    expect(isPromotionActive({ ...p, startDate: '', endDate: '' }, '2030-01-01')).toBe(true);
  });
});

describe('validateEnquiry', () => {
  const ok = { name: 'Ama', contact: '0503495079', subject: '', message: 'Do you do facials?', consent: true };
  it('accepts a valid enquiry with phone or email', () => {
    expect(validateEnquiry(ok)).toEqual({});
    expect(validateEnquiry({ ...ok, contact: 'ama@example.com' })).toEqual({});
  });
  it('rejects missing fields and consent', () => {
    const e = validateEnquiry({ name: 'A', contact: 'x', subject: '', message: '', consent: false });
    expect(Object.keys(e).sort()).toEqual(['consent', 'contact', 'message', 'name']);
  });
});

describe('SlidingWindowLimiter', () => {
  it('blocks after the limit and recovers after the window', () => {
    let now = 0;
    const l = new SlidingWindowLimiter('test-limit', 2, 1000, () => now);
    localStorage.clear();
    expect(l.tryAcquire()).toBe(true);
    expect(l.tryAcquire()).toBe(true);
    expect(l.tryAcquire()).toBe(false);
    expect(l.retryAfterMs()).toBe(1000);
    now = 1001;
    expect(l.tryAcquire()).toBe(true);
  });
});

describe('sortProducts', () => {
  const mk = (name: string, price: number | null, promoPrice: number | null = null): Product => ({ ...emptyProduct, id: name, name, price, promoPrice });
  const list = [mk('B', 50), mk('A', null), mk('C', 100, 20)];
  it('sorts by effective price with "on request" last', () => {
    expect(sortProducts(list, 'price-asc').map((p) => p.name)).toEqual(['C', 'B', 'A']);
    expect(sortProducts(list, 'price-desc').map((p) => p.name)).toEqual(['B', 'C', 'A']);
    expect(sortProducts(list, 'name').map((p) => p.name)).toEqual(['A', 'B', 'C']);
  });
});

describe('withDefaults', () => {
  it('fills missing fields and ignores wrongly typed ones', () => {
    const p = withDefaults(emptyProduct, { name: 'X', published: 'yes', price: 10 });
    expect(p.name).toBe('X');
    expect(p.published).toBe(false);
    expect(p.price).toBe(10);
    expect(p.stockStatus).toBe('in_stock');
  });
});
