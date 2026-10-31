import { ChevronDown } from 'lucide-react';
import { EmptyState, LoadingState, PageHeader, WhatsAppLink } from '../components/ui';
import { useSiteData } from '../data/SiteData';
import { usePageMeta } from '../lib/seo';
import type { Faq as FaqT } from '../lib/types';
import { generalEnquiryMessage } from '../lib/whatsapp';

export function FaqList({ faqs }: { faqs: FaqT[] }) {
  return (
    <div className="divide-y divide-linen rounded-2xl border border-linen bg-ivory">
      {faqs.map((f) => (
        <details key={f.id} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-espresso">
            {f.question}
            <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" aria-hidden />
          </summary>
          <p className="mt-3 leading-relaxed whitespace-pre-line text-muted">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}

export default function Faq() {
  const { settings, faqs, loading } = useSiteData();
  usePageMeta(`FAQ | ${settings.spaName}`, `Answers to common questions about booking, home service and treatments at ${settings.spaName}.`);
  const groups = faqs.reduce<Record<string, FaqT[]>>((acc, f) => {
    (acc[f.category || 'General'] ||= []).push(f);
    return acc;
  }, {});

  return (
    <>
      <PageHeader eyebrow="Help" title="Frequently asked questions" />
      <div className="container-page mt-12 max-w-3xl space-y-10">
        {loading ? (
          <LoadingState />
        ) : faqs.length === 0 ? (
          <EmptyState title="No questions yet">Message us on WhatsApp and we’ll be happy to help.</EmptyState>
        ) : (
          Object.entries(groups).map(([cat, list]) => (
            <section key={cat}>
              <h2 className="mb-4 text-2xl">{cat}</h2>
              <FaqList faqs={list} />
            </section>
          ))
        )}
        <div className="card p-8 text-center">
          <h2 className="text-2xl">Still have a question?</h2>
          <p className="mt-2 text-sm text-muted">Our team will answer you on WhatsApp.</p>
          <div className="mt-5">
            <WhatsAppLink message={generalEnquiryMessage(settings.spaName)}>Message us on WhatsApp</WhatsAppLink>
          </div>
        </div>
      </div>
    </>
  );
}
