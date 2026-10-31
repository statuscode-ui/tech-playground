import { ArrowLeft, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ProductCard } from '../components/Cards';
import { EmptyState, LoadingState, PageHeader, Price, SpaImage, WhatsAppLink } from '../components/ui';
import { useSiteData } from '../data/SiteData';
import { isMediaRef } from '../lib/media';
import { usePageMeta } from '../lib/seo';
import type { Product } from '../lib/types';
import { STOCK_LABELS } from '../lib/types';
import { productEnquiryMessage } from '../lib/whatsapp';
import NotFound from './NotFound';
import { CategoryChips } from './Services';

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'name';

const effective = (p: Product) => (p.promoPrice != null && p.price != null && p.promoPrice < p.price ? p.promoPrice : p.price);

export function sortProducts(list: Product[], sort: Sort): Product[] {
  const out = [...list];
  // Products without a price ("on request") always sort last.
  const cmp = (a: number | null, b: number | null, dir: 1 | -1) => (a == null ? 1 : b == null ? -1 : (a - b) * dir);
  if (sort === 'price-asc') out.sort((a, b) => cmp(effective(a), effective(b), 1));
  else if (sort === 'price-desc') out.sort((a, b) => cmp(effective(a), effective(b), -1));
  else if (sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name));
  else out.sort((a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order);
  return out;
}

export default function Products() {
  const { settings, products, loading } = useSiteData();
  usePageMeta(`Spa products | ${settings.spaName}`, `Browse skincare and body care products from ${settings.spaName}. Order or ask about any product on WhatsApp.`);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [sort, setSort] = useState<Sort>('featured');
  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))], [products]);
  const list = sortProducts(
    products.filter((p) => (!cat || p.category === cat) && (!q || `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(q.toLowerCase()))),
    sort,
  );

  return (
    <>
      <PageHeader eyebrow="Shop" title="Spa products" intro="Browse our products and order or ask about them on WhatsApp." />
      <div className="container-page mt-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <CategoryChips categories={categories} value={cat} onChange={setCat} label="Filter by category" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative block sm:w-64">
              <span className="sr-only">Search products</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <input className="input pl-9" type="search" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="shrink-0 text-muted">Sort by</span>
              <select className="input" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="featured">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>
        </div>
        {loading ? (
          <LoadingState />
        ) : list.length === 0 ? (
          <div className="mt-12">
            <EmptyState title={products.length ? 'No matching products' : 'Products coming soon'}>
              {products.length ? 'Try another search or category.' : 'Ask us on WhatsApp about the products we currently sell.'}
            </EmptyState>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function ProductDetail() {
  const { slug } = useParams();
  const { settings, products, loading } = useSiteData();
  const product = products.find((p) => p.slug === slug);
  usePageMeta(
    product ? `${product.name} | ${settings.spaName}` : `Product | ${settings.spaName}`,
    product?.description.slice(0, 155) || `Products from ${settings.spaName}.`,
    { image: product?.imageUrl && !isMediaRef(product.imageUrl) ? product.imageUrl : undefined },
  );
  if (loading) return <LoadingState />;
  if (!product) return <NotFound />;

  return (
    <article className="container-page py-10 sm:py-14">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted hover:text-leaf">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All products
      </Link>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <SpaImage src={product.imageUrl} alt={product.imageAlt} eager className="aspect-square w-full rounded-[2rem]" />
        <div>
          <p className="eyebrow">{product.category}</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">{product.name}</h1>
          {product.placeholder && <span className="badge mt-2 bg-amber-100 text-amber-900">Placeholder product</span>}
          {product.size && <p className="mt-2 text-muted">{product.size}</p>}
          <div className="mt-4 flex items-center gap-3 text-xl">
            <Price price={product.price} promoPrice={product.promoPrice} />
            <span className="badge bg-mint text-leaf">{STOCK_LABELS[product.stockStatus]}</span>
          </div>
          <p className="mt-5 leading-relaxed whitespace-pre-line text-muted">{product.description}</p>
          <div className="mt-6">
            <WhatsAppLink message={productEnquiryMessage(settings.spaName, product, settings.currencySymbol)}>
              {product.stockStatus === 'out_of_stock' ? 'Ask about restock' : 'Order on WhatsApp'}
            </WhatsAppLink>
          </div>
          {product.usage && (
            <section className="mt-8">
              <h2 className="text-2xl">How to use</h2>
              <p className="mt-2 leading-relaxed whitespace-pre-line text-muted">{product.usage}</p>
            </section>
          )}
          {product.ingredients && (
            <section className="mt-8">
              <h2 className="text-2xl">Ingredients</h2>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted">{product.ingredients}</p>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
