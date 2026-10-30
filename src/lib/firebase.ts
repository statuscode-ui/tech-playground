import { initializeApp, type FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getFirestore, type Firestore } from 'firebase/firestore/lite';

const env = import.meta.env;

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

/** True when a Firebase web app config has been supplied. Otherwise the site runs in demo mode. */
export const firebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);
export const appCheckEnabled = firebaseConfigured && Boolean(env.VITE_RECAPTCHA_SITE_KEY);
export const aiEnabled = firebaseConfigured && env.VITE_AI_ENABLED === 'true';
export const aiModel: string = env.VITE_AI_MODEL || 'gemini-3.5-flash-lite';
export const storageUploadsEnabled = firebaseConfigured && env.VITE_STORAGE_UPLOADS_ENABLED === 'true';
export const siteUrl: string = (env.VITE_SITE_URL || '').replace(/\/$/, '');

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (firebaseConfigured) {
  app = initializeApp(config);
  if (appCheckEnabled) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  }
  db = getFirestore(app);
}

// Auth is initialised in the admin bundle only (src/admin/AdminApp.tsx), so visitors don't download it.
export { app, db };
