import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Fade out the opening screen from index.html once the app has rendered, keeping it
// up long enough to be seen (shorter for visitors who prefer reduced motion).
const splash = document.getElementById('splash');
if (splash && !document.documentElement.classList.contains('no-splash')) {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const minVisibleMs = reduced ? 600 : 1600;
  window.setTimeout(
    () => {
      splash.classList.add('splash-out');
      window.setTimeout(() => splash.remove(), 700);
    },
    Math.max(0, minVisibleMs - performance.now()),
  );
  try {
    sessionStorage.setItem('shs-splash-seen', '1');
  } catch {
    // Storage unavailable: the opening screen just shows again next page load.
  }
} else {
  splash?.remove();
}
