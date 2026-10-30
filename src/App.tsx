import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import { LoadingState } from './components/ui';
import { SiteDataProvider } from './data/SiteData';
import Contact from './pages/Contact';
import Faq from './pages/Faq';
import Home from './pages/Home';
import { Privacy, Terms } from './pages/Legal';
import NotFound from './pages/NotFound';
import RouteError from './pages/RouteError';
import Products, { ProductDetail } from './pages/Products';
import Services, { ServiceDetail } from './pages/Services';

// The dashboard is a separate bundle so visitors never download it.
const AdminApp = lazy(() => import('./admin/AdminApp'));

const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/treatments', element: <Services /> },
      { path: '/treatments/:slug', element: <ServiceDetail /> },
      { path: '/products', element: <Products /> },
      { path: '/products/:slug', element: <ProductDetail /> },
      { path: '/faq', element: <Faq /> },
      { path: '/contact', element: <Contact /> },
      { path: '/privacy', element: <Privacy /> },
      { path: '/terms', element: <Terms /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/admin/*',
    errorElement: <RouteError />,
    element: (
      <Suspense fallback={<LoadingState label="Loading dashboard…" />}>
        <AdminApp />
      </Suspense>
    ),
  },
]);

export default function App() {
  return (
    <SiteDataProvider>
      <RouterProvider router={router} />
    </SiteDataProvider>
  );
}
