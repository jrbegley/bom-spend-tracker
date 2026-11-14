import { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { shouldScrollTop } from './lib/scroll';
import { AppShell } from './components/AppShell';
import { DataProvider } from './lib/data';
import Overview from './pages/Overview';
import Products from './pages/Products';
import LevelPage from './pages/LevelPage';
import PartDetail from './pages/PartDetail';
import Opportunities from './pages/Opportunities';
import Vendors from './pages/Vendors';
import MatchReview from './pages/MatchReview';

// The component test page exists only in dev builds; production drops it entirely.
const DevPage = import.meta.env.DEV ? lazy(() => import('./pages/DevPage')) : null;

function NotFound() {
  return (
    <>
      <h1 className="text-[24px] font-semibold">Page not found</h1>
      <Link to="/" className="text-primary hover:text-primary/80">Back to Product costs</Link>
    </>
  );
}

/**
 * Scrolls to the top when a link or redirect opens a new path. It renders before <Routes> so its
 * effect runs before the page's own effects (the Vendors highlight scroll must win).
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const prev = useRef<string | null>(null);
  useEffect(() => {
    if (shouldScrollTop(prev.current, pathname, navType)) window.scrollTo(0, 0);
    prev.current = pathname;
  }, [pathname, navType]);
  return null;
}

export function AppRoutes() {
  return (
    <AppShell>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:productId/*" element={<LevelPage />} />
        <Route path="/parts/:partId" element={<PartDetail />} />
        <Route path="/savings" element={<Opportunities title="Savings" />} />
        <Route path="/opportunities" element={<Navigate to="/savings" replace />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/match-review" element={<MatchReview />} />
        {DevPage && <Route path="/dev" element={<Suspense fallback={<p>Loading…</p>}><DevPage /></Suspense>} />}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <AppRoutes />
      </DataProvider>
    </BrowserRouter>
  );
}
