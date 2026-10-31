import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { SiteDataProvider } from '../data/SiteData';
import Services from './Services';

afterEach(cleanup);

// Tests run in demo mode, so the treatments come from src/data/seed.ts.
function renderAt(url: string) {
  const router = createMemoryRouter([{ path: '/treatments', element: <Services /> }], { initialEntries: [url] });
  render(
    <SiteDataProvider>
      <RouterProvider router={router} />
    </SiteDataProvider>,
  );
  return router;
}

const shown = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

describe('treatments category filter', () => {
  it('preselects the category from a home page tile link', () => {
    renderAt('/treatments?category=Facials');
    expect(shown()).toEqual(['Facial']);
    expect(screen.getByRole('button', { name: 'Facials' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps the chosen category in the address', () => {
    const router = renderAt('/treatments');
    expect(shown().length).toBeGreaterThan(1);
    fireEvent.click(screen.getByRole('button', { name: 'Massages' }));
    expect(router.state.location.search).toBe('?category=Massages');
    expect(shown()).toEqual(['Hot Stone Massage']);
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(router.state.location.search).toBe('');
  });
});
