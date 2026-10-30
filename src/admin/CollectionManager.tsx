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
      setItems([]);
    });
  }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const v: Doc = { ...editing };
    if (slugFrom && 'slug' in v) {
      v.slug = slugify(String(v.slug || v[slugFrom] || ''));
      const clash = items?.find((i) => i.slug === v.slug && i.id !== v.id);
      if (clash) {
        setErrors({ slug: 'Another item already uses this web address. Change the slug.' });
        return;
      }
    }
    const errs = validateFields(fields, v);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const { id, placeholder: _p, sample: _s, ...data } = v;
      if (id) await setDoc(doc(db!, name, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
      else await addDoc(collection(db!, name), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      setEditing(null);
      setMessage(`${singular} saved.`);
      await load();
      reload();
    } catch (err) {
      console.error(err);
      setMessage('Save failed. Check every field and that your account is an administrator.');
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(item: Doc) {
    await updateDoc(doc(db!, name, item.id), { published: !item.published, updatedAt: serverTimestamp() });
    await load();
    reload();
  }

  async function remove(item: Doc) {
    if (!confirm(`Delete “${summary(item as unknown as T).title}”? This cannot be undone.`)) return;
    await deleteDoc(doc(db!, name, item.id));
    setMessage(`${singular} deleted.`);
    await load();
    reload();
  }

  if (editing)
    return (
      <form onSubmit={save} className="space-y-5" noValidate>
        <button type="button" onClick={() => setEditing(null)} className="inline-flex items-center gap-1 text-sm text-muted hover:text-forest">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to {title.toLowerCase()}
        </button>
        <h2 className="text-3xl">{editing.id ? `Edit ${singular.toLowerCase()}` : `New ${singular.toLowerCase()}`}</h2>
        <div className="card grid gap-5 p-5 sm:p-6">
          {fields.map((f) => (
            <Field key={f.key} field={f} values={editing} setValue={(k, val) => setEditing((d) => (d ? { ...d, [k]: val } : d))} error={errors[f.key]} />
          ))}
        </div>
        {Object.keys(errors).length > 0 && <p role="alert" className="text-sm text-red-700">Please fix the highlighted fields.</p>}
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
            setEditing({ ...(structuredClone(empty) as unknown as Doc), id: '' });
          }}
        >
          <Plus className="h-4 w-4" aria-hidden /> Add {singular.toLowerCase()}
        </button>
      </div>
      {message && (
        <p role="status" className="mt-4 rounded-xl bg-sage-soft px-4 py-2 text-sm text-forest">
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
                  <span className={`badge ${item.published ? 'bg-sage-soft text-forest' : 'bg-sand text-muted'}`}>{item.published ? 'Published' : 'Hidden'}</span>
                )}
                <div className="flex gap-1">
                  {'published' in item && (
                    <button type="button" className="rounded-full p-2 hover:bg-sand" onClick={() => togglePublished(item)}>
                      {item.published ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                      <span className="sr-only">{item.published ? 'Hide' : 'Publish'} {s.title}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded-full p-2 hover:bg-sand"
                    onClick={() => {
                      setErrors({});
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
