import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { siteUrl } from './firebase';

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

/** Sets the document title, description, canonical URL and social preview tags for a page. */
export function usePageMeta(title: string, description: string, opts: { image?: string; noindex?: boolean } = {}) {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    const base = siteUrl || window.location.origin;
    const url = base + pathname;
    setMeta('property', 'og:url', url);
    if (opts.image) {
      const img = opts.image.startsWith('http') ? opts.image : base + opts.image;
      setMeta('property', 'og:image', img);
      setMeta('name', 'twitter:image', img);
    }
    setMeta('name', 'robots', opts.noindex ? 'noindex, nofollow' : 'index, follow');
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
  }, [title, description, pathname, opts.image, opts.noindex]);
}
