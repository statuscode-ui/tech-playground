import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SiteDataProvider } from '../data/SiteData';
import HeroCarousel from './HeroCarousel';

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: reduce && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }));
}

function renderCarousel() {
  const router = createMemoryRouter([{ path: '/', element: <HeroCarousel /> }]);
  render(
    <SiteDataProvider>
      <RouterProvider router={router} />
    </SiteDataProvider>,
  );
}

const heading = () => screen.getByRole('heading', { level: 1 }).textContent;
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('HeroCarousel', () => {
  it('advances slides automatically and wraps around', () => {
    mockReducedMotion(false);
    renderCarousel();
    const first = heading();
    advance(6000);
    expect(heading()).not.toBe(first);
    // One step per slide: each change schedules the next timer after React re-renders.
    for (let i = 0; i < 3; i++) advance(6000);
    expect(heading()).toBe(first);
  });

  it('can be paused, and dots jump to a slide', () => {
    mockReducedMotion(false);
    renderCarousel();
    fireEvent.click(screen.getByRole('button', { name: 'Pause slideshow' }));
    const paused = heading();
    advance(20000);
    expect(heading()).toBe(paused);
    fireEvent.click(screen.getByRole('button', { name: /Show slide 2/ }));
    expect(heading()).toBe('Glowing skin, don’t care!');
    expect(screen.getByRole('button', { name: /Show slide 2/ }).getAttribute('aria-current')).toBe('true');
  });

  it('does not auto-advance for visitors who prefer reduced motion', () => {
    mockReducedMotion(true);
    renderCarousel();
    const first = heading();
    advance(20000);
    expect(heading()).toBe(first);
    expect(screen.getByRole('button', { name: 'Play slideshow' })).toBeTruthy();
  });
});
