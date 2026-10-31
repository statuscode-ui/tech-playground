import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore/lite';
import { Plus, Trash } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { LoadingState } from '../components/ui';
import { emptySettings, withDefaults } from '../data/defaults';
import { seedSettings } from '../data/seed';
import { useSiteData } from '../data/SiteData';
import { db } from '../lib/firebase';
import type { SiteSettings } from '../lib/types';
import { normalizeWhatsAppNumber, whatsappUrl } from '../lib/whatsapp';
import { Field, validateFields, type FieldDef } from './fields';

const groups: { title: string; fields: FieldDef[] }[] = [
  {
    title: 'Business profile',
    fields: [
      { key: 'spaName', label: 'Spa name', type: 'text', required: true, max: 80 },
      { key: 'tagline', label: 'Tagline', type: 'text', max: 120 },
      { key: 'intro', label: 'Introduction (home page)', type: 'textarea', max: 600 },
      { key: 'mission', label: 'Our mission', type: 'textarea', max: 1500 },
      { key: 'story', label: 'Our story', type: 'textarea', max: 1500 },
      { key: 'logoUrl', label: 'Logo', type: 'image', help: 'Optional. Without a logo, the spa name is shown as text.' },
    ],
  },
  {
    title: 'Contact',
    fields: [
      { key: 'whatsappNumber', label: 'WhatsApp number', type: 'text', required: true, help: 'Used for every booking button. Enter as 0503495079 or +233 50 349 5079; it is saved as 233503495079.' },
      { key: 'phoneDisplay', label: 'Phone number as shown on the site', type: 'text', max: 40 },
      { key: 'email', label: 'Email (optional)', type: 'text', max: 120 },
      { key: 'address', label: 'Address', type: 'textarea', max: 300 },
      { key: 'mapUrl', label: 'Google Maps link (optional)', type: 'url', help: 'Paste a “Share” link from Google Maps. Without one, directions search for the address.' },
      { key: 'currencySymbol', label: 'Currency symbol', type: 'text', required: true, max: 6 },
    ],
  },
  {
    title: 'Home service',
    fields: [
      { key: 'homeServiceEnabled', label: 'We offer home service', type: 'checkbox' },
      { key: 'homeServiceNote', label: 'Home service details', type: 'textarea', max: 800 },
    ],
  },
  {
    title: 'Policies & assistant knowledge',
    fields: [
      { key: 'policies', label: 'Booking, cancellation & late-arrival policies', type: 'textarea', max: 3000, help: 'Shown on the Terms page and used by the chat assistant.' },
      { key: 'giftVouchers', label: 'Gift vouchers', type: 'textarea', max: 1500, help: 'Leave empty if you don’t offer gift vouchers.' },
      { key: 'generalAftercare', label: 'General aftercare advice', type: 'textarea', max: 3000 },
      { key: 'extraKnowledge', label: 'Other information for the assistant', type: 'textarea', max: 5000, help: 'e.g. parking, payment methods, what to bring. Only write things that are true.' },
    ],
  },
];

const socialFields: FieldDef[] = [
  { key: 'instagram', label: 'Instagram link', type: 'url' },
  { key: 'facebook', label: 'Facebook link', type: 'url' },
  { key: 'tiktok', label: 'TikTok link', type: 'url' },
];

export default function SettingsEditor() {
  const { reload } = useSiteData();
  const [s, setS] = useState<SiteSettings | null>(null);
  const [exists, setExists] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDoc(doc(db!, 'settings', 'site')).then((snap) => {
      setExists(snap.exists());
      setS(snap.exists() ? withDefaults(emptySettings, snap.data()) : structuredClone(seedSettings));
    });
  }, []);

  if (!s) return <LoadingState />;
  const set = (k: string, v: unknown) => setS((p) => (p ? { ...p, [k]: v } : p));

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!s) return;
    const all = [...groups.flatMap((g) => g.fields)];
    const errs = { ...validateFields(all, s as unknown as Record<string, unknown>), ...validateFields(socialFields, s.social) };
    const wa = normalizeWhatsAppNumber(s.whatsappNumber);
    if (!wa) errs.whatsappNumber = 'Enter a valid phone number, including the country code if it is not Ghanaian.';
    setErrors(errs);
    if (Object.keys(errs).length) return setMsg('Please fix the highlighted fields.');
    setSaving(true);
    try {
      const data = { ...s, whatsappNumber: wa, openingHours: s.openingHours.filter((h) => h.day.trim()) };
      await setDoc(doc(db!, 'settings', 'site'), { ...data, updatedAt: serverTimestamp() });
      setS(data);
      setExists(true);
      setMsg('Settings saved. The website now uses these details.');
      reload();
    } catch (err) {
      console.error(err);
      setMsg('Save failed. Check that your account is an administrator.');
    } finally {
      setSaving(false);
    }
  }

  const testLink = whatsappUrl(s.whatsappNumber, 'Test message from the website settings page');

  return (
    <form onSubmit={save} className="space-y-6" noValidate>
      <div>
        <h2 className="text-3xl">Website settings</h2>
        {!exists && <p className="mt-2 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-900">These are the starter details. Review them and press Save to publish.</p>}
      </div>
      {groups.map((g) => (
        <fieldset key={g.title} className="card grid gap-5 p-5 sm:p-6">
          <legend className="sr-only">{g.title}</legend>
          <h3 className="text-2xl">{g.title}</h3>
          {g.fields.map((f) => (
            <Field key={f.key} field={f} values={s as unknown as Record<string, unknown>} setValue={set} error={errors[f.key]} />
          ))}
          {g.title === 'Contact' && testLink && (
            <a href={testLink} target="_blank" rel="noopener noreferrer" className="text-sm text-leaf underline">
              Test this WhatsApp number
            </a>
          )}
        </fieldset>
      ))}

      <fieldset className="card grid gap-4 p-5 sm:p-6">
        <legend className="sr-only">Opening hours</legend>
        <h3 className="text-2xl">Opening hours</h3>
        <p className="text-sm text-muted">Leave empty to tell visitors to check on WhatsApp.</p>
        {s.openingHours.map((h, i) => (
          <div key={i} className="flex gap-2">
            <input aria-label="Days" className="input" placeholder="e.g. Monday – Saturday" value={h.day} onChange={(e) => set('openingHours', s.openingHours.map((x, j) => (j === i ? { ...x, day: e.target.value } : x)))} />
            <input aria-label="Hours" className="input" placeholder="e.g. 9:00 am – 8:00 pm" value={h.hours} onChange={(e) => set('openingHours', s.openingHours.map((x, j) => (j === i ? { ...x, hours: e.target.value } : x)))} />
            <button type="button" className="rounded-full p-2 text-red-700 hover:bg-red-50" onClick={() => set('openingHours', s.openingHours.filter((_, j) => j !== i))}>
              <Trash className="h-4 w-4" aria-hidden />
              <span className="sr-only">Remove row</span>
            </button>
          </div>
        ))}
        <button type="button" className="btn-outline w-fit min-h-9 px-3 text-xs" onClick={() => set('openingHours', [...s.openingHours, { day: '', hours: '' }])}>
          <Plus className="h-3.5 w-3.5" aria-hidden /> Add row
        </button>
      </fieldset>

      <fieldset className="card grid gap-5 p-5 sm:p-6">
        <legend className="sr-only">Social media</legend>
        <h3 className="text-2xl">Social media</h3>
        {socialFields.map((f) => (
          <Field key={f.key} field={f} values={s.social} setValue={(k, v) => set('social', { ...s.social, [k]: v })} error={errors[f.key]} />
        ))}
      </fieldset>

      {msg && <p role="status" className="rounded-xl bg-mint px-4 py-2 text-sm text-leaf">{msg}</p>}
      <div className="sticky bottom-0 -mx-4 border-t border-linen bg-cream/95 px-4 py-3 backdrop-blur">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  );
}
