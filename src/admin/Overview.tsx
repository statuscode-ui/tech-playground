import { collection, doc, getCount, getDoc, getDocs, query, serverTimestamp, where, writeBatch } from 'firebase/firestore/lite';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { seedFaqs, seedProducts, seedServices, seedSettings } from '../data/seed';
import { useSiteData } from '../data/SiteData';
import { aiEnabled, appCheckEnabled, db } from '../lib/firebase';
import { activePromotions } from '../lib/promotions';
import type { Promotion } from '../lib/types';

interface Stats {
  services: number;
  publishedServices: number;
  products: number;
  publishedProducts: number;
  activePromotions: number;
  faqs: number;
  testimonials: number;
  newEnquiries: number;
  totalEnquiries: number;
}

export default function Overview() {
  const { reload } = useSiteData();
  const [stats, setStats] = useState<Stats | null>(null);
  const [importMsg, setImportMsg] = useState('');
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    const c = (name: string, published?: boolean, status?: string) => {
      let q = query(collection(db!, name));
      if (published) q = query(q, where('published', '==', true));
      if (status) q = query(q, where('status', '==', status));
      return getCount(q).then((r) => r.data().count);
    };
    const [services, publishedServices, products, publishedProducts, faqs, testimonials, newEnquiries, totalEnquiries, promos] = await Promise.all([
      c('services'),
      c('services', true),
      c('products'),
      c('products', true),
      c('faqs', true),
      c('testimonials', true),
      c('enquiries', false, 'new'),
      c('enquiries'),
      getDocs(query(collection(db!, 'promotions'), where('published', '==', true))),
    ]);
    setStats({
      services,
      publishedServices,
      products,
      publishedProducts,
      faqs,
      testimonials,
      newEnquiries,
      totalEnquiries,
      activePromotions: activePromotions(promos.docs.map((d) => ({ id: d.id, ...d.data() }) as Promotion)).length,
    });
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  async function importStarter() {
    if (!confirm('Add the starter treatments, FAQs, placeholder products and business details? Existing items are not changed.')) return;
    setImporting(true);
    try {
      const batch = writeBatch(db!);
      const now = serverTimestamp();
      const add = async (name: string, items: { id: string }[]) => {
        for (const { id, ...data } of items) {
          if (!(await getDoc(doc(db!, name, id))).exists()) batch.set(doc(db!, name, id), { ...data, createdAt: now, updatedAt: now });
        }
      };
      await add('services', seedServices);
      await add('faqs', seedFaqs);
      await add('products', seedProducts);
      if (!(await getDoc(doc(db!, 'settings', 'site'))).exists()) batch.set(doc(db!, 'settings', 'site'), { ...seedSettings, updatedAt: now });
      await batch.commit();
      setImportMsg('Starter content added. Placeholder products are hidden until you edit and publish them.');
      await load();
      reload();
    } catch (e) {
      console.error(e);
      setImportMsg('Import failed. Check that your account is an administrator.');
    } finally {
      setImporting(false);
    }
  }

  const tiles: { label: string; value: string; to: string }[] = stats
    ? [
        { label: 'Treatments published', value: `${stats.publishedServices} / ${stats.services}`, to: '/admin/treatments' },
        { label: 'Products published', value: `${stats.publishedProducts} / ${stats.products}`, to: '/admin/products' },
        { label: 'Promotions running', value: String(stats.activePromotions), to: '/admin/promotions' },
        { label: 'Published FAQs', value: String(stats.faqs), to: '/admin/faqs' },
        { label: 'Published testimonials', value: String(stats.testimonials), to: '/admin/testimonials' },
        { label: 'New enquiries', value: `${stats.newEnquiries} (of ${stats.totalEnquiries})`, to: '/admin/enquiries' },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl">Overview</h2>
        <p className="mt-1 text-sm text-muted">Counts come straight from the database. The site doesn’t track visitors.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats
          ? tiles.map((t) => (
              <Link key={t.label} to={t.to} className="card p-4 hover:border-leaf/30">
                <p className="text-xs text-muted">{t.label}</p>
                <p className="mt-1 font-display text-3xl text-leaf">{t.value}</p>
              </Link>
            ))
          : Array.from({ length: 6 }, (_, i) => <div key={i} className="card h-20 animate-pulse bg-meadow/50" />)}
      </div>

      {stats && stats.services === 0 && (
        <div className="card space-y-3 border-berry/40 p-6">
          <h3 className="text-2xl">Get started</h3>
          <p className="text-sm text-muted">Add the starter content from Serenity Haven Spa’s flyers (treatments without prices, FAQs and contact details). Then add prices, hours and photos.</p>
          <button type="button" className="btn-primary" onClick={importStarter} disabled={importing}>
            {importing ? 'Adding…' : 'Add starter content'}
          </button>
        </div>
      )}
      {importMsg && <p role="status" className="rounded-xl bg-mint px-4 py-2 text-sm text-leaf">{importMsg}</p>}

      <div className="card p-6 text-sm">
        <h3 className="text-2xl">Website features</h3>
        <ul className="mt-3 space-y-2">
          <li>AI chat assistant: <strong>{aiEnabled ? 'on' : 'off (visitors get automatic FAQ answers)'}</strong></li>
          <li>App Check abuse protection: <strong>{appCheckEnabled ? 'on' : 'off'}</strong></li>
          <li>Photo uploads: <strong>on (photos are shrunk and stored free in the database)</strong></li>
        </ul>
      </div>
    </div>
  );
}
