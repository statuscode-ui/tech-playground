import { getAuth, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore/lite';
import { ExternalLink, Gift, Inbox, LayoutDashboard, LogOut, MessageSquareQuote, Package, Settings, Sparkles, Tag } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { LoadingState } from '../components/ui';
import { app, db, firebaseConfigured } from '../lib/firebase';

const auth = app ? getAuth(app) : null;
import { usePageMeta } from '../lib/seo';
import Enquiries from './Enquiries';
import Overview from './Overview';
import { FaqsAdmin, ProductsAdmin, PromotionsAdmin, ServicesAdmin, TestimonialsAdmin } from './sections';
import SettingsEditor from './SettingsEditor';

type AuthState = { status: 'loading' } | { status: 'signedOut' } | { status: 'notAdmin'; user: User } | { status: 'admin'; user: User };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <div className="container-page max-w-md py-16">{children}</div>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth!, email.trim(), password);
    } catch {
      setError('Sign-in failed. Check your email and password.');
    } finally {
      setBusy(false);
    }
  }
  async function reset() {
    if (!email.trim()) return setError('Enter your email first, then press “Forgot password”.');
    try {
      await sendPasswordResetEmail(auth!, email.trim());
    } finally {
      // Same message either way, so the form doesn't reveal which emails have accounts.
      setInfo('If that email has an account, a reset link is on its way.');
    }
  }

  return (
    <Shell>
      <form onSubmit={submit} className="card space-y-4 p-8">
        <h1 className="text-3xl">Admin sign in</h1>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {info && <p role="status" className="text-sm text-forest">{info}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <button type="button" className="w-full text-sm text-muted underline" onClick={reset}>Forgot password</button>
        <p className="text-xs text-muted">There is no public sign-up. Administrator accounts are created by the site owner in the Firebase console.</p>
      </form>
    </Shell>
  );
}

// Absolute paths: relative links inside the /admin/* splat route resolve against the
// current page (e.g. /admin/treatments/products), which matches nothing.
export const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', Icon: LayoutDashboard, end: true },
  { to: '/admin/treatments', label: 'Treatments', Icon: Sparkles },
  { to: '/admin/products', label: 'Products', Icon: Package },
  { to: '/admin/promotions', label: 'Promotions', Icon: Tag },
  { to: '/admin/faqs', label: 'FAQs', Icon: Gift },
  { to: '/admin/testimonials', label: 'Testimonials', Icon: MessageSquareQuote },
  { to: '/admin/enquiries', label: 'Enquiries', Icon: Inbox },
  { to: '/admin/settings', label: 'Settings', Icon: Settings },
];

export function Dashboard({ user }: { user: User }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-30 border-b border-linen bg-ivory/95 backdrop-blur">
        <div className="container-page flex h-14 items-center justify-between gap-3">
          <p className="font-display text-xl text-forest">Spa dashboard</p>
          <div className="flex items-center gap-1">
            <Link to="/" target="_blank" className="hidden rounded-full px-3 py-2 text-sm text-muted hover:text-forest sm:inline-flex sm:items-center sm:gap-1">
              View site <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <span className="hidden text-xs text-muted md:inline">{user.email}</span>
            <button type="button" className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm text-muted hover:text-forest" onClick={() => signOut(auth!)}>
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </button>
          </div>
        </div>
        <nav aria-label="Dashboard" className="container-page -mb-px flex gap-1 overflow-x-auto pb-2">
          {ADMIN_NAV.map(({ to, label, Icon, end }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              className={({ isActive }) => `inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm ${isActive ? 'bg-forest text-white' : 'text-muted hover:bg-sand'}`}
            >
              <Icon className="h-4 w-4" aria-hidden /> {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="container-page max-w-4xl py-8">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="treatments" element={<ServicesAdmin />} />
          <Route path="products" element={<ProductsAdmin />} />
          <Route path="promotions" element={<PromotionsAdmin />} />
          <Route path="faqs" element={<FaqsAdmin />} />
          <Route path="testimonials" element={<TestimonialsAdmin />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="settings" element={<SettingsEditor />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function AdminApp() {
  usePageMeta('Admin dashboard', 'Spa website administration', { noindex: true });
  const [state, setState] = useState<AuthState>({ status: firebaseConfigured ? 'loading' : 'signedOut' });

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, async (user) => {
      if (!user) return setState({ status: 'signedOut' });
      setState({ status: 'loading' });
      try {
        // Security rules let a signed-in user read only their own admins/{uid} document.
        const snap = await getDoc(doc(db!, 'admins', user.uid));
        setState(snap.exists() ? { status: 'admin', user } : { status: 'notAdmin', user });
      } catch {
        setState({ status: 'notAdmin', user });
      }
    });
  }, []);

  if (!firebaseConfigured)
    return (
      <Shell>
        <div className="card space-y-3 p-8">
          <h1 className="text-3xl">Firebase isn’t connected yet</h1>
          <p className="text-sm text-muted">
            The website is showing built-in starter content. To manage content, create a Firebase project and add its web config to <code>.env.local</code>, as described in the README.
          </p>
          <Link to="/" className="btn-outline">Back to website</Link>
        </div>
      </Shell>
    );
  if (state.status === 'loading') return <LoadingState label="Checking your access…" />;
  if (state.status === 'signedOut') return <Login />;
  if (state.status === 'notAdmin')
    return (
      <Shell>
        <div className="card space-y-3 p-8">
          <h1 className="text-3xl">No admin access</h1>
          <p className="text-sm text-muted">You’re signed in as {state.user.email}, but this account isn’t an administrator. The site owner can grant access by creating this document in Firestore:</p>
          <code className="block rounded-lg bg-sand p-3 text-xs break-all">admins/{state.user.uid}</code>
          <button type="button" className="btn-outline" onClick={() => signOut(auth!)}>Sign out</button>
        </div>
      </Shell>
    );
  return <Dashboard user={state.user} />;
}
