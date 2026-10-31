import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore/lite';
import { ArrowLeft, Eye, EyeOff, Pencil, Plus, Trash } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { LoadingState } from '../components/ui';
import { withDefaults } from '../data/defaults';
import { useSiteData } from '../data/SiteData';
import { db } from '../lib/firebase';
import { slugify } from '../lib/format';
import { Field, validateFields, type FieldDef } from './fields';

type Doc = Record<string, unknown> & { id: string };

/** Plain-language reason for a failed save, based on the Firebase error code. */
export function saveErrorMessage(err: unknown): string {
  const code = (err as { code?: string } | null)?.code ?? '';
  if (code.includes('permission-denied'))
    return 'The database refused this save because something isn’t in the allowed format, for example a pasted photo instead of an uploaded one, or text that is too long. Check the photo and the fields above. If your login has expired, sign out and back in.';
  if (code.includes('unavailable') || code.includes('deadline')) return 'You seem to be offline. Check your internet connection and press Save again.';
  return 'Save failed. Please try again. If it keeps happening, take a screenshot of this form and send it to whoever manages the website.';
}

/** Another item (not the one being edited) that already uses this web address, if any. */
export function findSlugClash<T extends { id: string; slug?: unknown }>(items: T[], slug: string, id: string): T | undefined {
  return items.find((i) => i.slug === slug && i.id !== id);
}

export interface CollectionManagerProps<T extends object> {
  name: string; // Firestore collection
  title: string;
  singular: string;
  fields: FieldDef[];
  empty: T;
  summary: (d: T) => { title: string; subtitle?: string };
  /** Generate `slug` from this field when the slug is left empty. */
  slugFrom?: string;
  intro?: string;
}

export default function CollectionManager<T extends object>({ name, title, singular, fields, empty, summary, slugFrom, intro }: CollectionManagerProps<T>) {
  const { reload } = useSiteData();
  const [items, setItems] = useState<Doc[] | null>(null);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);

  const load = useCallback(async () => {
    const snap = await getDocs(collection(db!, name));
    const list = snap.docs.map((d) => withDefaults({ ...empty, id: d.id } as unknown as Doc, d.data()));
    list.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0) || String(a.title ?? a.name ?? '').localeCompare(String(b.title ?? b.name ?? '')));
    setItems(list);
  }, [name, empty]);

  useEffect(() => {
    load().catch((e) => {
      console.error(e);
      setMessage('Could not load. Check your connection and admin access.');
      setMessageIsError(true);
      setItems([]);
    });
  }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const v: Doc = { ...editing };
    if (slugFrom && 'slug' in v) {
      v.slug = slugify(String(v.slug || v[slugFrom] || ''));
      const clash = findSlugClash(items ?? [], String(v.slug), v.id);
      if (clash) {
        // Show the generated address in the box, and say which item already has it.
        setEditing((d) => (d ? { ...d, slug: v.slug } : d));
        const other = summary(clash as unknown as T).title;
        setErrors({
          slug: `“${other}” already uses the web address “${v.slug}”${clash.published ? '' : ' (it is hidden)'}. Edit that ${singular.toLowerCase()} instead, or change the name or web address.`,
        });
        return;
      }
    }
    // An emptied "Display order" box would be rejected by the security rules.
    if ('order' in v && (v.order == null || Number.isNaN(v.order))) v.order = 100;
    const errs = validateFields(fields, v);
    setErrors(errs);
    setFormError('');
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const { id, placeholder: _p, sample: _s, ...data } = v;
      if (id) await setDoc(doc(db!, name, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
      else await addDoc(collection(db!, name), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      setEditing(null);
      setMessage(`${singular} saved.`);
      setMessageIsError(false);
      await load();
      reload();
    } catch (err) {
      console.error(err);
      setFormError(saveErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(item: Doc) {
    try {
      await updateDoc(doc(db!, name, item.id), { published: !item.published, updatedAt: serverTimestamp() });
      setMessage(`${summary(item as unknown as T).title} is now ${item.published ? 'hidden' : 'published'}.`);
      setMessageIsError(false);
      await load();
      reload();
    } catch (err) {
      console.error(err);
      setMessage(saveErrorMessage(err));
      setMessageIsError(true);
    }
  }

  async function remove(item: Doc) {
    if (!confirm(`Delete “${summary(item as unknown as T).title}”? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db!, name, item.id));
      setMessage(`${singular} deleted.`);
      setMessageIsError(false);
      await load();
      reload();
    } catch (err) {
      console.error(err);
      setMessage(saveErrorMessage(err));
      setMessageIsError(true);
    }
  }

  if (editing)
    return (
      <form onSubmit={save} className="space-y-5" noValidate>
        <button type="button" onClick={() => setEditing(null)} className="inline-flex items-center gap-1 text-sm text-muted hover:text-leaf">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to {title.toLowerCase()}
        </button>
        <h2 className="text-3xl">{editing.id ? `Edit ${singular.toLowerCase()}` : `New ${singular.toLowerCase()}`}</h2>
        <div className="card grid gap-5 p-5 sm:p-6">
          {fields.map((f) => (
            <Field key={f.key} field={f} values={editing} setValue={(k, val) => setEditing((d) => (d ? { ...d, [k]: val } : d))} error={errors[f.key]} />
          ))}
        </div>
        {Object.keys(errors).length > 0 && <p role="alert" className="text-sm text-red-700">Please fix the highlighted fields.</p>}
        {formError && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {formError}
          </p>
        )}
        <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-linen bg-cream/95 px-4 py-3 backdrop-blur">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="btn-outline" onClick={() => setEditing(null)}>
            Cancel
          </button>
        </div>
      </form>
    );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl">{title}</h2>
          {intro && <p className="mt-1 text-sm text-muted">{intro}</p>}
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setErrors({});
            setFormError('');
            setEditing({ ...(structuredClone(empty) as unknown as Doc), id: '' });
          }}
        >
          <Plus className="h-4 w-4" aria-hidden /> Add {singular.toLowerCase()}
        </button>
      </div>
      {message && (
        <p
          role={messageIsError ? 'alert' : 'status'}
          className={`mt-4 rounded-xl px-4 py-2 text-sm ${messageIsError ? 'border border-red-200 bg-red-50 text-red-800' : 'bg-mint text-leaf'}`}
        >
          {message}
        </p>
      )}
      {!items ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <p className="card mt-6 p-6 text-sm text-muted">Nothing here yet. Use “Add {singular.toLowerCase()}” to create one.</p>
      ) : (
        <ul className="card mt-6 divide-y divide-linen">
          {items.map((item) => {
            const s = summary(item as unknown as T);
            return (
              <li key={item.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.title || '(untitled)'}</p>
                  {s.subtitle && <p className="truncate text-xs text-muted">{s.subtitle}</p>}
                </div>
                {'published' in item && (
                  <span className={`badge ${item.published ? 'bg-mint text-leaf' : 'bg-meadow text-muted'}`}>{item.published ? 'Published' : 'Hidden'}</span>
                )}
                <div className="flex gap-1">
                  {'published' in item && (
                    <button type="button" className="rounded-full p-2 hover:bg-meadow" onClick={() => togglePublished(item)}>
                      {item.published ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                      <span className="sr-only">{item.published ? 'Hide' : 'Publish'} {s.title}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded-full p-2 hover:bg-meadow"
                    onClick={() => {
                      setErrors({});
                      setFormError('');
                      setEditing(structuredClone(item));
                    }}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                    <span className="sr-only">Edit {s.title}</span>
                  </button>
                  <button type="button" className="rounded-full p-2 text-red-700 hover:bg-red-50" onClick={() => remove(item)}>
                    <Trash className="h-4 w-4" aria-hidden />
                    <span className="sr-only">Delete {s.title}</span>
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
