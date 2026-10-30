import { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';

/** Shown instead of React Router's developer error screen if a page crashes. */
export default function RouteError() {
  const error = useRouteError();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 text-center">
      <div className="max-w-md">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-3 text-4xl">Sorry, this page didn’t load</h1>
        <p className="mt-4 text-muted">Please reload the page. If it keeps happening, go back to the home page.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {/* Plain links force a full reload, which clears whatever went wrong. */}
          <a href={window.location.href} className="btn-primary">Reload page</a>
          <a href="/" className="btn-outline">Home page</a>
        </div>
      </div>
    </main>
  );
}
