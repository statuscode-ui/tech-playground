import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HeroVideo from './HeroVideo';

const props = { src: '/v.mp4', poster: '/p.webp', label: 'Back massage', caption: 'Your body holds stress.' };

function mockMatchMedia(reduce: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: reduce && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }));
}

beforeEach(() => {
  // jsdom has no media playback; emulate it by firing the events a browser would.
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
    Object.defineProperty(this, 'paused', { value: false, configurable: true });
    this.dispatchEvent(new Event('play'));
    return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (this: HTMLMediaElement) {
    Object.defineProperty(this, 'paused', { value: true, configurable: true });
    this.dispatchEvent(new Event('pause'));
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('HeroVideo', () => {
  it('plays muted and can be paused and resumed', () => {
    mockMatchMedia(false);
    const { container } = render(<HeroVideo {...props} />);
    const video = container.querySelector('video')!;
    expect(video.muted).toBe(true);
    expect(screen.getByText('Your body holds stress.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pause video' }));
    expect(screen.getByRole('button', { name: 'Play video' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Play video' }));
    expect(screen.getByRole('button', { name: 'Pause video' })).toBeTruthy();
  });

  it('shows a still image for visitors who prefer reduced motion', () => {
    mockMatchMedia(true);
    const { container } = render(<HeroVideo {...props} />);
    expect(container.querySelector('video')).toBeNull();
    expect(screen.getByRole('img', { name: 'Back massage' }).getAttribute('src')).toBe('/p.webp');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('copes with browsers where play() returns nothing', () => {
    mockMatchMedia(false);
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => undefined as unknown as Promise<void>);
    expect(() => render(<HeroVideo {...props} />)).not.toThrow();
  });
});
