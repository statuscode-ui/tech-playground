import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore/lite';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { db, firebaseConfigured } from '../lib/firebase';
import { activePromotions } from '../lib/promotions';
import type { Faq, Product, Promotion, Service, SiteSettings, Testimonial } from '../lib/types';
import { emptyFaq, emptyProduct, emptyPromotion, emptyService, emptySettings, emptyTestimonial, withDefaults } from './defaults';
import { sampleTestimonials, seedFaqs, seedProducts, seedPromotions, seedServices, seedSettings } from './seed';

export interface SiteData {
  settings: SiteSettings;
  services: Service[];
  products: Product[];
  faqs: Faq[];
  promotions: Promotion[]; // active only
  testimonials: Testimonial[];
  /** 'demo' when Firebase is not configured and bundled starter content is shown. */
  source: 'firestore' | 'demo';
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

const demoData = {
  settings: seedSettings,
  services: seedServices,
  products: seedProducts.map((p) => ({ ...p, published: true })),
  faqs: seedFaqs,
  promotions: seedPromotions,
  testimonials: sampleTestimonials,
};

const Ctx = createContext<SiteData | null>(null);

async function loadPublished<T extends object>(name: string, defaults: T) {
  const snap = await getDocs(query(collection(db!, name), where('published', '==', true)));
  return snap.docs.map((d) => withDefaults({ ...defaults, id: d.id }, d.data()));
}

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<SiteData, 'reload'>>(() =>
    firebaseConfigured
      ? { ...demoData, settings: seedSettings, services: [], products: [], faqs: [], promotions: [], testimonials: [], source: 'firestore', loading: true, error: null }
      : { ...demoData, source: 'demo', loading: false, error: null },
  );
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!firebaseConfigured || !db) return;
    let cancelled = false;
    (async () => {
      try {
        const [settingsSnap, services, products, faqs, promotions, testimonials] = await Promise.all([
          getDoc(doc(db, 'settings', 'site')),
          loadPublished('services', emptyService),
          loadPublished('products', emptyProduct),
          loadPublished('faqs', emptyFaq),
          loadPublished('promotions', emptyPromotion),
          loadPublished('testimonials', emptyTestimonial),
        ]);
        if (cancelled) return;
        // Until the owner saves settings, fall back to the starter profile so the site isn't blank.
        const settings = settingsSnap.exists()
          ? withDefaults(emptySettings, settingsSnap.data())
          : seedSettings;
        setState({
          settings,
          services: (services as Service[]).sort(byOrder),
          products: (products as Product[]).sort(byOrder),
          faqs: (faqs as Faq[]).sort(byOrder),
          promotions: activePromotions(promotions as Promotion[]),
          testimonials: (testimonials as Testimonial[]).sort(byOrder),
          source: 'firestore',
          loading: false,
          error: null,
        });
      } catch (e) {
        console.error(e);
        if (!cancelled)
          setState((s) => ({ ...s, loading: false, error: 'We couldn’t load the latest information. Please refresh, or contact us on WhatsApp.' }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [version]);

  const value = useMemo(() => ({ ...state, reload }), [state, reload]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSiteData(): SiteData {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSiteData must be used inside SiteDataProvider');
  return v;
}
