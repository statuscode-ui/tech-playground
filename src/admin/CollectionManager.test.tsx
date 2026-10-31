import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

// One existing, hidden treatment called "Body Scrub" in the database.
const addDoc = vi.fn();
vi.mock('../lib/firebase', () => ({ db: {}, firebaseConfigured: true, storageUploadsEnabled: false, app: null }));
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

const { findSlugClash } = await import('./CollectionManager');
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
