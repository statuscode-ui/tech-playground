import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SiteDataProvider } from '../data/SiteData';
import Layout from './Layout';

afterEach(cleanup);

describe('public site navigation', () => {
  it('survives in-site navigation when scrollTo returns a Promise (newer Chrome)', async () => {
    // Newer Chromium returns a Promise from scrollTo(); a useEffect that returned it
    // crashed with "destroy is not a function" on the next navigation.
    const scrollTo = vi.fn(() => Promise.resolve());
    vi.stubGlobal('scrollTo', scrollTo);
    const router = createMemoryRouter(
      [
        {
          element: <Layout />,
          errorElement: <p>route-crashed</p>,
          children: [
            { path: '/', element: <p>page:home</p> },
            { path: '/contact', element: <p>page:contact</p> },
            { path: '/faq', element: <p>page:faq</p> },
          ],
        },
      ],
      { initialEntries: ['/'] },
    );
    render(
      <SiteDataProvider>
        <RouterProvider router={router} />
      </SiteDataProvider>,
    );
    for (const [label, page] of [['Contact', 'contact'], ['FAQ', 'faq'], ['Home', 'home'], ['Contact', 'contact']]) {
      fireEvent.click(screen.getAllByRole('link', { name: label })[0]);
      expect(await screen.findByText(`page:${page}`)).toBeTruthy();
    }
    expect(screen.queryByText('route-crashed')).toBeNull();
    expect(scrollTo).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
