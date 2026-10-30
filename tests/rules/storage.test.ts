import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { afterAll, beforeAll, describe, it } from 'vitest';

let env: RulesTestEnvironment;
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-serenity',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
    storage: { rules: readFileSync('storage.rules', 'utf8') },
  });
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'admins/admin1'), { email: 'owner@example.com' }));
});
afterAll(() => env.cleanup());

describe('storage rules', () => {
  it('only admins can upload images', async () => {
    const adminRef = ref(env.authenticatedContext('admin1').storage(), 'images/a.png');
    await assertSucceeds(uploadBytes(adminRef, png, { contentType: 'image/png' }));
    await assertFails(uploadBytes(ref(env.authenticatedContext('someone').storage(), 'images/b.png'), png, { contentType: 'image/png' }));
    await assertFails(uploadBytes(ref(env.unauthenticatedContext().storage(), 'images/c.png'), png, { contentType: 'image/png' }));
  });
  it('rejects non-image files and other paths', async () => {
    const s = env.authenticatedContext('admin1').storage();
    await assertFails(uploadBytes(ref(s, 'images/x.html'), png, { contentType: 'text/html' }));
    await assertFails(uploadBytes(ref(s, 'other/a.png'), png, { contentType: 'image/png' }));
  });
});
