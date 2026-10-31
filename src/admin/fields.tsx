import { Plus, Trash, Upload } from 'lucide-react';
import { useState } from 'react';
import { SpaImage } from '../components/ui';
import { app, storageUploadsEnabled } from '../lib/firebase';
import type { ServiceOption } from '../lib/types';

export type FieldDef =
  | { key: string; label: string; type: 'text' | 'textarea' | 'date' | 'url'; required?: boolean; help?: string; max?: number }
  | { key: string; label: string; type: 'number' | 'price'; required?: boolean; help?: string; min?: number; max?: number }
  | { key: string; label: string; type: 'checkbox'; help?: string }
  | { key: string; label: string; type: 'select'; options: { value: string; label: string }[]; help?: string }
  | { key: string; label: string; type: 'image'; help?: string }
  | { key: string; label: string; type: 'serviceOptions'; help?: string };

type Values = Record<string, unknown>;

export function validateFields(fields: FieldDef[], v: Values): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const f of fields) {
    const val = v[f.key];
    if ((f.type === 'text' || f.type === 'textarea' || f.type === 'url' || f.type === 'date') && f.required && !String(val ?? '').trim())
      errs[f.key] = `${f.label} is required.`;
    if ((f.type === 'text' || f.type === 'textarea') && f.max && String(val ?? '').length > f.max) errs[f.key] = `Keep under ${f.max} characters.`;
    if (f.type === 'url' && val && !/^(https?:\/\/|\/)/.test(String(val))) errs[f.key] = 'Enter a full link starting with https://';
    if ((f.type === 'number' || f.type === 'price') && val != null && (typeof val !== 'number' || Number.isNaN(val) || val < 0)) errs[f.key] = 'Enter a positive number.';
    else if (f.type === 'number' || f.type === 'price') {
      if (f.required && val == null) errs[f.key] = `${f.label} is required.`;
      else if (typeof val === 'number' && ((f.min != null && val < f.min) || (f.max != null && val > f.max))) errs[f.key] = `Enter a number from ${f.min ?? 0} to ${f.max}.`;
    }
    if (f.type === 'serviceOptions') {
      const opts = (val as ServiceOption[]) ?? [];
      if (!opts.length) errs[f.key] = 'Add at least one price option.';
      if (opts.some((o) => o.promoPrice != null && (o.price == null || o.promoPrice >= o.price))) errs[f.key] = 'An offer price must be lower than the normal price.';
    }
  }
  return errs;
}

const numOrNull = (s: string) => (s.trim() === '' ? null : Number(s));

function ImageField({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function upload(file: File) {
    if (!app) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setErr('Choose an image under 5 MB.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const r = ref(getStorage(app), `images/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`);
      await uploadBytes(r, file, { contentType: file.type, cacheControl: 'public, max-age=31536000' });
      onChange(await getDownloadURL(r));
    } catch (e) {
      console.error(e);
      setErr('Upload failed. Check that Storage is enabled (Blaze plan) and you are an admin.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex gap-3">
      <SpaImage src={value} alt="" className="h-20 w-20 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2">
        <input id={id} className="input" placeholder="https://… or /images/…" value={value} onChange={(e) => onChange(e.target.value.trim())} />
        {storageUploadsEnabled && (
          <label className="btn-outline min-h-9 cursor-pointer px-3 text-xs">
            <Upload className="h-3.5 w-3.5" aria-hidden /> {busy ? 'Uploading…' : 'Upload image'}
            <input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
        )}
        {err && <p className="text-xs text-red-700">{err}</p>}
      </div>
    </div>
  );
}

function ServiceOptionsField({ value, onChange }: { value: ServiceOption[]; onChange: (v: ServiceOption[]) => void }) {
  const update = (i: number, patch: Partial<ServiceOption>) => onChange(value.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  return (
    <div className="space-y-3">
      {value.map((o, i) => (
        <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-linen bg-cream/50 p-3 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <label className="col-span-2 text-xs sm:col-span-1">
            Label
            <input className="input mt-1" placeholder="e.g. 60 minutes" value={o.label} onChange={(e) => update(i, { label: e.target.value })} />
          </label>
          <label className="text-xs">
            Minutes
            <input className="input mt-1" type="number" min={0} inputMode="numeric" value={o.durationMinutes ?? ''} onChange={(e) => update(i, { durationMinutes: numOrNull(e.target.value) })} />
          </label>
          <label className="text-xs">
            Price
            <input className="input mt-1" type="number" min={0} step="0.01" inputMode="decimal" placeholder="On request" value={o.price ?? ''} onChange={(e) => update(i, { price: numOrNull(e.target.value) })} />
          </label>
          <label className="text-xs">
            Offer price
            <input className="input mt-1" type="number" min={0} step="0.01" inputMode="decimal" value={o.promoPrice ?? ''} onChange={(e) => update(i, { promoPrice: numOrNull(e.target.value) })} />
          </label>
          <button type="button" className="self-end justify-self-end rounded-full p-2 text-red-700 hover:bg-red-50 disabled:opacity-30" disabled={value.length === 1} onClick={() => onChange(value.filter((_, j) => j !== i))}>
            <Trash className="h-4 w-4" aria-hidden />
            <span className="sr-only">Remove option</span>
          </button>
        </div>
      ))}
      <button type="button" className="btn-outline min-h-9 px-3 text-xs" onClick={() => onChange([...value, { label: '', durationMinutes: null, price: null, promoPrice: null }])}>
        <Plus className="h-3.5 w-3.5" aria-hidden /> Add duration / price option
      </button>
    </div>
  );
}

export function Field({ field: f, values, setValue, error }: { field: FieldDef; values: Values; setValue: (k: string, v: unknown) => void; error?: string }) {
  const id = `f-${f.key}`;
  const v = values[f.key];
  let control;
  switch (f.type) {
    case 'textarea':
      control = <textarea id={id} rows={4} className="input" value={String(v ?? '')} onChange={(e) => setValue(f.key, e.target.value)} />;
      break;
    case 'number':
    case 'price':
      control = (
        <input
          id={id}
          className="input"
          type="number"
          min={0}
          step={f.type === 'price' ? '0.01' : '1'}
          inputMode="decimal"
          placeholder={f.type === 'price' ? 'Leave empty for “price on request”' : ''}
          value={v == null ? '' : String(v)}
          onChange={(e) => setValue(f.key, numOrNull(e.target.value))}
        />
      );
      break;
    case 'checkbox':
      return (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-leaf" checked={Boolean(v)} onChange={(e) => setValue(f.key, e.target.checked)} />
          <span>
            {f.label}
            {f.help && <span className="block text-xs text-muted">{f.help}</span>}
          </span>
        </label>
      );
    case 'select':
      control = (
        <select id={id} className="input" value={String(v ?? '')} onChange={(e) => setValue(f.key, e.target.value)}>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case 'image':
      control = <ImageField id={id} value={String(v ?? '')} onChange={(x) => setValue(f.key, x)} />;
      break;
    case 'serviceOptions':
      control = <ServiceOptionsField value={(v as ServiceOption[]) ?? []} onChange={(x) => setValue(f.key, x)} />;
      break;
    default:
      control = <input id={id} className="input" type={f.type === 'date' ? 'date' : f.type === 'url' ? 'url' : 'text'} value={String(v ?? '')} onChange={(e) => setValue(f.key, e.target.value)} />;
  }
  return (
    <div>
      <label htmlFor={id} className="label">
        {f.label}
        {'required' in f && f.required && <span className="text-red-700"> *</span>}
      </label>
      {control}
      {f.help && <p className="mt-1 text-xs text-muted">{f.help}</p>}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
