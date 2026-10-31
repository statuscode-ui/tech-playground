import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

// One existing, hidden treatment called "Body Scrub" in the database.
const addDoc = vi.fn();
const uploadPhoto = vi.fn(async () => 'media:photo123');
vi.mock('../lib/media', () => ({
  isMediaRef: (v: string) => v.startsWith('media:'),
  uploadPhoto: (...a: unknown[]) => uploadPhoto(...(a as [])),
  useImageSrc: (v: string) => (v.startsWith('media:') ? 'data:image/webp;base64,AAAA' : v),
}));
vi.mock('../lib/firebase', () => ({ db: {}, firebaseConfigured: true, app: null }));
vi.mock('firebase/firestore/lite', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(async () => ({
    docs: [{ id: 'abc', data: () => ({ name: 'Body Scrub', slug: 'body-scrub', category: 'Body', description: 'x', published: false }) }],
  })),
  addDoc: (...a: unknown[]) => addDoc(...a),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));
vi.mock('../data/SiteData', () => ({ useSiteData: () => ({ reload: vi.fn() }) }));

const { findSlugClash, saveErrorMessage } = await import('./CollectionManager');
const { imageRefError } = await import('./fields');
const { ServicesAdmin } = await import('./sections');

afterEach(cleanup);

describe('findSlugClash', () => {
  const items = [{ id: '1', slug: 'facial' }, { id: '2', slug: 'body-scrub' }];
  it('finds another item with the same address, but not the item itself', () => {
    expect(findSlugClash(items, 'body-scrub', '')?.id).toBe('2');
    expect(findSlugClash(items, 'body-scrub', '2')).toBeUndefined();
    expect(findSlugClash(items, 'acrylic-nails', '')).toBeUndefined();
  });
});

describe('adding a treatment whose name is already used', () => {
  it('says which treatment has the address, fills in the address, and saves nothing', async () => {
    render(
      <MemoryRouter>
        <ServicesAdmin />
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: /Add treatment/ }));
    // New treatments start published.
    expect((screen.getByLabelText(/Published/) as HTMLInputElement).checked).toBe(true);
    fireEvent.change(screen.getByLabelText(/Treatment name/), { target: { value: 'Body Scrub' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText(/“Body Scrub” already uses the web address “body-scrub” \(it is hidden\)/)).toBeTruthy();
    expect((screen.getByLabelText(/Web address/) as HTMLInputElement).value).toBe('body-scrub');
    expect(addDoc).not.toHaveBeenCalled();
  });
});

describe('photo field checks', () => {
  it('accepts uploads, site images and https links', () => {
    for (const v of ['', 'media:abc', '/images/facial.webp', 'https://example.com/a.jpg']) expect(imageRefError(v)).toBe('');
  });
  it('explains copied images, over-long links and other text', () => {
    expect(imageRefError('data:image/jpeg;base64,/9j/4AAQ')).toMatch(/Upload photo/);
    expect(imageRefError('https://example.com/' + 'a'.repeat(2100))).toMatch(/too long/);
    expect(imageRefError('IMG_1234.jpg')).toMatch(/https/);
  });
});

describe('saveErrorMessage', () => {
  it('turns Firebase codes into plain language', () => {
    expect(saveErrorMessage({ code: 'permission-denied' })).toMatch(/allowed format/);
    expect(saveErrorMessage({ code: 'unavailable' })).toMatch(/offline/);
    expect(saveErrorMessage(new Error('x'))).toMatch(/try again/);
  });
});

async function openNewTreatment() {
  render(
    <MemoryRouter>
      <ServicesAdmin />
    </MemoryRouter>,
  );
  fireEvent.click(await screen.findByRole('button', { name: /Add treatment/ }));
  fireEvent.change(screen.getByLabelText(/Treatment name/), { target: { value: 'Acrylic Nails' } });
  fireEvent.change(screen.getByLabelText(/^Category/), { target: { value: 'Nail care' } });
  fireEvent.change(screen.getByLabelText(/^Description/), { target: { value: 'Acrylic nail extensions.' } });
}

describe('adding a treatment', () => {
  it('uploads a photo, fills an emptied display order, and saves', async () => {
    addDoc.mockReset();
    addDoc.mockResolvedValue({ id: 'new' });
    await openNewTreatment();
    const file = new File(['x'], 'nails.jpg', { type: 'image/jpeg' });
    fireEvent.change(document.querySelector('input[type=file]')!, { target: { files: [file] } });
    expect(await screen.findByText(/Photo uploaded/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Display order/), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await vi.waitFor(() => expect(addDoc).toHaveBeenCalled());
    const saved = addDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(saved.imageUrl).toBe('media:photo123');
    expect(saved.order).toBe(100);
    expect(saved.slug).toBe('acrylic-nails');
    expect(saved.published).toBe(true);
  });

  it('blocks a pasted image before saving', async () => {
    addDoc.mockReset();
    await openNewTreatment();
    fireEvent.change(screen.getByPlaceholderText(/paste a link/), { target: { value: 'data:image/jpeg;base64,/9j/4AAQ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText(/copied image, not a link/)).toBeTruthy();
    expect(addDoc).not.toHaveBeenCalled();
  });

  it('shows a red explanation on the form when the database refuses the save', async () => {
    addDoc.mockReset();
    addDoc.mockRejectedValue({ code: 'permission-denied' });
    await openNewTreatment();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const alert = await screen.findByText(/database refused this save/);
    expect(alert.getAttribute('role')).toBe('alert');
    // Still on the form, so nothing typed is lost.
    expect((screen.getByLabelText(/Treatment name/) as HTMLInputElement).value).toBe('Acrylic Nails');
  });
});
