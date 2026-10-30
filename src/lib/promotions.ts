import type { Promotion } from './types';

/** Local calendar date as YYYY-MM-DD, so promotions switch over at the spa's midnight. */
export function todayISO(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isPromotionActive(p: Promotion, today = todayISO()): boolean {
  if (!p.published) return false;
  if (p.startDate && today < p.startDate) return false;
  if (p.endDate && today > p.endDate) return false;
  return true;
}

export function activePromotions(list: Promotion[], today = todayISO()): Promotion[] {
  return list.filter((p) => isPromotionActive(p, today));
}
