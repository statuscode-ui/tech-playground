export function formatPrice(amount: number, currency = 'GH₵'): string {
  const n = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return `${currency} ${n.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr${h > 1 ? 's' : ''}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Lowest displayed price across options, or null when every option is "on request". */
export function startingPrice(options: { price: number | null; promoPrice: number | null }[]): number | null {
  const prices = options
    .map((o) => (o.promoPrice != null && o.price != null && o.promoPrice < o.price ? o.promoPrice : o.price))
    .filter((p): p is number => p != null);
  return prices.length ? Math.min(...prices) : null;
}
