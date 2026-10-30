import { formatDuration, formatPrice } from '../lib/format';
import type { Faq, Product, Promotion, Service, SiteSettings } from '../lib/types';
import { STOCK_LABELS } from '../lib/types';

export interface KnowledgeInput {
  settings: SiteSettings;
  services: Service[];
  products: Product[];
  faqs: Faq[];
  promotions: Promotion[];
}

export interface KnowledgeEntry {
  topic: string;
  keywords: string[];
  answer: string;
}

function servicePrices(s: Service, cur: string): string {
  return s.options
    .map((o) => {
      const price =
        o.price == null
          ? 'price on request'
          : o.promoPrice != null && o.promoPrice < o.price
            ? `${formatPrice(o.promoPrice, cur)} (offer; usually ${formatPrice(o.price, cur)})`
            : formatPrice(o.price, cur);
      const dur = formatDuration(o.durationMinutes);
      const label = o.label || dur;
      return label ? `${label}: ${price}` : price;
    })
    .join('; ');
}

function productPrice(p: Product, cur: string): string {
  if (p.price == null) return 'price on request';
  if (p.promoPrice != null && p.promoPrice < p.price) return `${formatPrice(p.promoPrice, cur)} (offer; usually ${formatPrice(p.price, cur)})`;
  return formatPrice(p.price, cur);
}

const words = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

/** Converts published site data into question/answer entries for the FAQ fallback. */
export function buildKnowledgeEntries(k: KnowledgeInput): KnowledgeEntry[] {
  const { settings: st } = k;
  const cur = st.currencySymbol;
  const entries: KnowledgeEntry[] = [];

  for (const f of k.faqs) entries.push({ topic: f.question, keywords: words(`${f.question} ${f.category}`), answer: f.answer });

  for (const s of k.services) {
    const parts = [`${s.name}: ${servicePrices(s, cur)}.`, s.description];
    if (!s.available) parts.push('This treatment is currently unavailable.');
    if (s.preparation) parts.push(`Before your visit: ${s.preparation}`);
    if (s.aftercare) parts.push(`Aftercare: ${s.aftercare}`);
    entries.push({ topic: s.name, keywords: words(`${s.name} ${s.category} price cost duration`), answer: parts.join(' ') });
  }

  for (const p of k.products) {
    const parts = [`${p.name}${p.size ? ` (${p.size})` : ''}: ${productPrice(p, cur)}, ${STOCK_LABELS[p.stockStatus].toLowerCase()}.`, p.description];
    if (p.usage) parts.push(`How to use: ${p.usage}`);
    if (p.ingredients) parts.push(`Ingredients: ${p.ingredients}`);
    entries.push({ topic: p.name, keywords: words(`${p.name} ${p.category} product buy price`), answer: parts.join(' ') });
  }

  const hours = st.openingHours.length
    ? `Our opening hours: ${st.openingHours.map((h) => `${h.day} ${h.hours}`).join(', ')}.`
    : 'Our opening hours aren’t listed on the website yet, so please message us on WhatsApp to check.';
  entries.push({ topic: 'Opening hours', keywords: ['open', 'opening', 'hours', 'time', 'close', 'closing', 'today', 'sunday', 'saturday', 'weekend'], answer: hours });

  if (st.address)
    entries.push({ topic: 'Location', keywords: ['where', 'location', 'address', 'located', 'directions', 'find', 'map'], answer: `We are located at ${st.address}.` });

  entries.push({
    topic: 'Booking',
    keywords: ['book', 'booking', 'appointment', 'reserve', 'schedule', 'available', 'slot'],
    answer:
      'To book, tap “Book on WhatsApp” on any treatment and send us your preferred date and time. Your booking is confirmed only once we reply.',
  });

  if (st.homeServiceEnabled && st.homeServiceNote)
    entries.push({ topic: 'Home service', keywords: ['home', 'house', 'come', 'visit', 'mobile', 'transport', 'delivery'], answer: st.homeServiceNote });

  if (st.policies) entries.push({ topic: 'Policies', keywords: ['policy', 'cancel', 'cancellation', 'late', 'reschedule', 'refund', 'deposit'], answer: st.policies });
  if (st.giftVouchers) entries.push({ topic: 'Gift vouchers', keywords: ['gift', 'voucher', 'card', 'present', 'birthday'], answer: st.giftVouchers });
  if (st.generalAftercare) entries.push({ topic: 'Aftercare', keywords: ['aftercare', 'after', 'care'], answer: st.generalAftercare });

  if (k.promotions.length)
    entries.push({
      topic: 'Promotions',
      keywords: ['promo', 'promotion', 'offer', 'discount', 'deal', 'special', 'sale'],
      answer: k.promotions.map((p) => `${p.title}: ${p.description}${p.endDate ? ` (until ${p.endDate})` : ''}`).join(' '),
    });

  const contact = [st.phoneDisplay && `call ${st.phoneDisplay}`, 'message us on WhatsApp', st.email && `email ${st.email}`].filter(Boolean).join(', ');
  entries.push({ topic: 'Contact', keywords: ['contact', 'phone', 'call', 'number', 'whatsapp', 'email', 'reach', 'talk', 'human'], answer: `You can ${contact}.` });

  return entries;
}

const STOP = new Set('a an the is are do does i you we to of for and or in on at it my me can how what your with be have has any there this that please hi hello'.split(' '));

/** Simple keyword-overlap matcher. Returns the best entry or null if nothing is a good match. */
export function matchQuestion(question: string, entries: KnowledgeEntry[]): KnowledgeEntry | null {
  const q = words(question).filter((w) => !STOP.has(w));
  if (!q.length) return null;
  const stem = (w: string) => w.replace(/(ing|es|s)$/, '');
  const qs = new Set(q.map(stem));
  let best: KnowledgeEntry | null = null;
  let bestScore = 0;
  for (const e of entries) {
    const topicWords = words(e.topic).map(stem);
    let score = 0;
    for (const kw of new Set(e.keywords.map(stem))) if (qs.has(kw)) score += topicWords.includes(kw) ? 2 : 1;
    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }
  return bestScore >= 1 ? best : null;
}

/** Compact, plain-text knowledge base for the AI system prompt. */
export function knowledgeForPrompt(k: KnowledgeInput): string {
  const st = k.settings;
  const lines: string[] = [
    `Business: ${st.spaName}. ${st.tagline}`,
    st.intro && `About: ${st.intro}`,
    st.address && `Location: ${st.address}`,
    st.phoneDisplay && `Phone/WhatsApp: ${st.phoneDisplay}`,
    st.email && `Email: ${st.email}`,
    `Opening hours: ${st.openingHours.length ? st.openingHours.map((h) => `${h.day} ${h.hours}`).join('; ') : 'NOT PROVIDED'}`,
    `Home service: ${st.homeServiceEnabled ? st.homeServiceNote || 'offered' : 'not offered'}`,
    `Policies: ${st.policies || 'NOT PROVIDED'}`,
    `Gift vouchers: ${st.giftVouchers || 'NOT PROVIDED'}`,
    st.generalAftercare && `General aftercare: ${st.generalAftercare}`,
    st.extraKnowledge && `Other information: ${st.extraKnowledge}`,
    '',
    'TREATMENTS:',
    ...k.services.map(
      (s) =>
        `- ${s.name} [${s.category}]${s.available ? '' : ' (currently unavailable)'}: ${servicePrices(s, st.currencySymbol)}. ${s.description}` +
        (s.preparation ? ` Preparation: ${s.preparation}` : '') +
        (s.aftercare ? ` Aftercare: ${s.aftercare}` : ''),
    ),
    '',
    'PRODUCTS:',
    ...(k.products.length
      ? k.products.map(
          (p) =>
            `- ${p.name}${p.size ? ` (${p.size})` : ''} [${p.category}]: ${productPrice(p, st.currencySymbol)}, ${STOCK_LABELS[p.stockStatus]}. ${p.description}` +
            (p.usage ? ` Usage: ${p.usage}` : '') +
            (p.ingredients ? ` Ingredients: ${p.ingredients}` : ''),
        )
      : ['NONE LISTED']),
    '',
    'ACTIVE PROMOTIONS:',
    ...(k.promotions.length ? k.promotions.map((p) => `- ${p.title}: ${p.description} (${p.startDate || '…'} to ${p.endDate || '…'})`) : ['NONE']),
    '',
    'FAQ:',
    ...k.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`),
  ];
  return lines.filter(Boolean).join('\n').slice(0, 24000);
}
