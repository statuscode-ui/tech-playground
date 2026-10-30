import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;

const service = {
  name: 'Facial',
  slug: 'facial',
  category: 'Facials',
  description: 'A facial.',
  imageUrl: '',
  imageAlt: '',
  options: [{ label: '', durationMinutes: 60, price: 250, promoPrice: null }],
  preparation: '',
  aftercare: '',
  available: true,
  published: true,
  featured: false,
  order: 1,
};

const settings = {
  spaName: 'Serenity Haven Spa',
  whatsappNumber: '233503495079',
  currencySymbol: 'GH₵',
  openingHours: [],
  social: { instagram: '', facebook: '', tiktok: '' },
  homeServiceEnabled: true,
};

const enquiry = () => ({
  name: 'Ama',
  contact: '0503495079',
  subject: '',
  message: 'Do you do facials?',
  consent: true,
  status: 'new',
  createdAt: serverTimestamp(),
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-serenity',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});
afterAll(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'admins/admin1'), { email: 'owner@example.com' });
    await setDoc(doc(db, 'services/published'), service);
    await setDoc(doc(db, 'services/draft'), { ...service, slug: 'draft', published: false });
    await setDoc(doc(db, 'settings/site'), settings);
    await setDoc(doc(db, 'enquiries/e1'), { ...enquiry(), createdAt: new Date() });
  });
});

const visitor = () => env.unauthenticatedContext().firestore();
const user = () => env.authenticatedContext('someone').firestore();
const admin = () => env.authenticatedContext('admin1').firestore();

describe('public content', () => {
  it('visitors can read published services and settings', async () => {
    await assertSucceeds(getDocs(query(collection(visitor(), 'services'), where('published', '==', true))));
    await assertSucceeds(getDoc(doc(visitor(), 'services/published')));
    await assertSucceeds(getDoc(doc(visitor(), 'settings/site')));
  });
  it('visitors cannot read drafts or list everything', async () => {
    await assertFails(getDoc(doc(visitor(), 'services/draft')));
    await assertFails(getDocs(collection(visitor(), 'services')));
  });
  it('visitors and non-admin users cannot write content', async () => {
    await assertFails(setDoc(doc(visitor(), 'services/x'), service));
    await assertFails(setDoc(doc(user(), 'services/x'), service));
    await assertFails(updateDoc(doc(user(), 'settings/site'), { spaName: 'Hacked' }));
    await assertFails(deleteDoc(doc(user(), 'services/published')));
  });
  it('unknown collections are closed', async () => {
    await assertFails(getDoc(doc(admin(), 'secrets/x')));
    await assertFails(setDoc(doc(admin(), 'secrets/x'), { a: 1 }));
  });
});

describe('admins', () => {
  it('admins can read drafts and manage content', async () => {
    await assertSucceeds(getDocs(collection(admin(), 'services')));
    await assertSucceeds(setDoc(doc(admin(), 'services/new'), { ...service, updatedAt: serverTimestamp() }));
    await assertSucceeds(deleteDoc(doc(admin(), 'services/draft')));
  });
  it('admin writes are validated', async () => {
    await assertFails(setDoc(doc(admin(), 'services/bad'), { ...service, name: '' }));
    await assertFails(setDoc(doc(admin(), 'services/bad'), { ...service, options: [] }));
    await assertFails(setDoc(doc(admin(), 'settings/site'), { ...settings, whatsappNumber: '+233 50 349 5079' }));
    await assertSucceeds(setDoc(doc(admin(), 'settings/site'), { ...settings, updatedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(admin(), 'testimonials/t'), { name: 'A', quote: 'Q', rating: 9, published: true }));
  });
  it('nobody can create or change admin records from the client', async () => {
    await assertFails(setDoc(doc(user(), 'admins/someone'), { email: 'me' }));
    await assertFails(setDoc(doc(admin(), 'admins/someone'), { email: 'me' }));
    await assertFails(getDoc(doc(user(), 'admins/admin1')));
    await assertSucceeds(getDoc(doc(admin(), 'admins/admin1')));
  });
});

describe('enquiries', () => {
  it('visitors can submit a valid enquiry', async () => {
    await assertSucceeds(addDoc(collection(visitor(), 'enquiries'), enquiry()));
  });
  it('invalid or tampered enquiries are rejected', async () => {
    await assertFails(addDoc(collection(visitor(), 'enquiries'), { ...enquiry(), consent: false }));
    await assertFails(addDoc(collection(visitor(), 'enquiries'), { ...enquiry(), status: 'handled' }));
    await assertFails(addDoc(collection(visitor(), 'enquiries'), { ...enquiry(), message: 'x'.repeat(1501) }));
    await assertFails(addDoc(collection(visitor(), 'enquiries'), { ...enquiry(), admin: true }));
    await assertFails(addDoc(collection(visitor(), 'enquiries'), { ...enquiry(), createdAt: new Date(2000, 1, 1) }));
  });
  it('enquiries are private to admins', async () => {
    await assertFails(getDoc(doc(visitor(), 'enquiries/e1')));
    await assertFails(getDocs(collection(user(), 'enquiries')));
    await assertSucceeds(getDocs(collection(admin(), 'enquiries')));
  });
  it('admins can only change the status', async () => {
    await assertSucceeds(updateDoc(doc(admin(), 'enquiries/e1'), { status: 'handled' }));
    await assertFails(updateDoc(doc(admin(), 'enquiries/e1'), { message: 'edited' }));
    await assertFails(updateDoc(doc(user(), 'enquiries/e1'), { status: 'handled' }));
  });
});
