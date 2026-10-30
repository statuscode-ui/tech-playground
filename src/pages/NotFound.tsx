import { Link } from 'react-router-dom';
import { useSiteData } from '../data/SiteData';
import { usePageMeta } from '../lib/seo';

export default function NotFound() {
  const { settings } = useSiteData();
  usePageMeta(`Page not found | ${settings.spaName}`, 'The page you were looking for could not be found.', { noindex: true });
  return (
    <section className="container-page py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-5xl">A little lost?</h1>
      <p className="mx-auto mt-4 max-w-md text-muted">We couldn’t find that page. It may have moved, or the treatment may no longer be listed.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">Back to home</Link>
        <Link to="/treatments" className="btn-outline">View treatments</Link>
      </div>
    </section>
  );
}
