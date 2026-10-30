import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Stub each section so the test exercises only the dashboard's navigation.
vi.mock('./Overview', () => ({ default: () => <p>section:overview</p> }));
vi.mock('./SettingsEditor', () => ({ default: () => <p>section:settings</p> }));
vi.mock('./Enquiries', () => ({ default: () => <p>section:enquiries</p> }));
vi.mock('./sections', () => ({
  ServicesAdmin: () => <p>section:treatments</p>,
  ProductsAdmin: () => <p>section:products</p>,
  PromotionsAdmin: () => <p>section:promotions</p>,
  FaqsAdmin: () => <p>section:faqs</p>,
  TestimonialsAdmin: () => <p>section:testimonials</p>,
}));

const { ADMIN_NAV, Dashboard } = await import('./AdminApp');

afterEach(cleanup);

function renderAt(path: string) {
  // Same shape as App.tsx: the dashboard lives under a /admin/* splat route.
  const router = createMemoryRouter([{ path: '/admin/*', element: <Dashboard user={{ email: 'owner@example.com' } as User} /> }], {
    initialEntries: [path],
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe('admin dashboard navigation', () => {
  it('keeps working after several clicks in a row', () => {
    const router = renderAt('/admin');
    expect(screen.getByText('section:overview')).toBeTruthy();
    // Click every tab in order, then back to the first: each must show its section.
    for (const item of [...ADMIN_NAV.slice(1), ADMIN_NAV[0], ADMIN_NAV[3]]) {
      fireEvent.click(screen.getByRole('link', { name: item.label }));
      expect(router.state.location.pathname).toBe(item.to);
      const section = item.to === '/admin' ? 'overview' : item.to.split('/').pop();
      expect(screen.getByText(`section:${section}`)).toBeTruthy();
    }
  });

  it('links point to the same places from any page', () => {
    renderAt('/admin/treatments');
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href')).filter((h) => h?.startsWith('/admin'));
    expect(hrefs).toEqual(ADMIN_NAV.map((n) => n.to));
  });

  it('sends unknown dashboard addresses back to the overview', () => {
    const router = renderAt('/admin/treatments/products');
    expect(router.state.location.pathname).toBe('/admin');
    expect(screen.getByText('section:overview')).toBeTruthy();
  });
});
