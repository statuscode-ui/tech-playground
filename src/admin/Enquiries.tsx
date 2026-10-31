import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, updateDoc, type Timestamp } from 'firebase/firestore/lite';
import { Check, Trash } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { LoadingState } from '../components/ui';
import { db } from '../lib/firebase';
import type { Enquiry } from '../lib/types';
import { whatsappUrl } from '../lib/whatsapp';

export default function Enquiries() {
  const [items, setItems] = useState<Enquiry[] | null>(null);

  const load = useCallback(async () => {
    const snap = await getDocs(query(collection(db!, 'enquiries'), orderBy('createdAt', 'desc'), limit(200)));
    setItems(
      snap.docs.map((d) => {
        const v = d.data();
        return { id: d.id, ...v, createdAt: (v.createdAt as Timestamp | null)?.toDate() ?? null } as Enquiry;
      }),
    );
  }, []);
  useEffect(() => {
    load().catch((e) => {
      console.error(e);
      setItems([]);
    });
  }, [load]);

  async function markHandled(e: Enquiry) {
    await updateDoc(doc(db!, 'enquiries', e.id), { status: e.status === 'handled' ? 'new' : 'handled' });
    await load();
  }
  async function remove(e: Enquiry) {
    if (!confirm(`Delete the enquiry from ${e.name}?`)) return;
    await deleteDoc(doc(db!, 'enquiries', e.id));
    await load();
  }

  return (
    <div>
      <h2 className="text-3xl">Website enquiries</h2>
      <p className="mt-1 text-sm text-muted">Messages sent from the contact form. Only administrators can see these. Delete old enquiries you no longer need.</p>
      {!items ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <p className="card mt-6 p-6 text-sm text-muted">No enquiries yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((e) => {
            const phoneLink = /^\+?[\d\s()-]{7,20}$/.test(e.contact) ? whatsappUrl(e.contact) : '';
            return (
              <li key={e.id} className={`card p-5 ${e.status === 'handled' ? 'opacity-70' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {e.name} <span className="font-normal text-muted">· {e.contact}</span>
                    </p>
                    <p className="text-xs text-muted">{e.createdAt ? e.createdAt.toLocaleString() : ''}{e.subject && ` · ${e.subject}`}</p>
                  </div>
                  <span className={`badge ${e.status === 'new' ? 'bg-gold-soft text-espresso' : 'bg-almond text-espresso'}`}>{e.status === 'new' ? 'New' : 'Handled'}</span>
                </div>
                <p className="mt-3 text-sm whitespace-pre-line">{e.message}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {phoneLink && (
                    <a href={phoneLink} target="_blank" rel="noopener noreferrer" className="btn-whatsapp min-h-9 px-4 text-xs">
                      Reply on WhatsApp
                    </a>
                  )}
                  {e.contact.includes('@') && (
                    <a href={`mailto:${e.contact}`} className="btn-outline min-h-9 px-4 text-xs">
                      Reply by email
                    </a>
                  )}
                  <button type="button" className="btn-outline min-h-9 px-4 text-xs" onClick={() => markHandled(e)}>
                    <Check className="h-3.5 w-3.5" aria-hidden /> {e.status === 'handled' ? 'Mark as new' : 'Mark handled'}
                  </button>
                  <button type="button" className="btn min-h-9 px-4 text-xs text-red-700 hover:bg-red-50" onClick={() => remove(e)}>
                    <Trash className="h-3.5 w-3.5" aria-hidden /> Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
