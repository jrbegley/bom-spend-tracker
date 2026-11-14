import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { DataProvider } from './lib/data';
import Overview from './pages/Overview';
import Products from './pages/Products';
import LevelPage from './pages/LevelPage';
import PartDetail from './pages/PartDetail';
import Opportunities from './pages/Opportunities';
import Vendors from './pages/Vendors';
import MatchReview from './pages/MatchReview';
import DevPage from './pages/DevPage';

function NotFound() {
  return (
    <>
      <h1 className="text-[24px] font-semibold">Page not found</h1>
      <Link to="/" className="text-accent hover:text-accent-hover">Back to Overview</Link>
    </>
  );
}

export function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:productId/*" element={<LevelPage />} />
        <Route path="/parts/:partId" element={<PartDetail />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/match-review" element={<MatchReview />} />
        <Route path="/dev" element={<DevPage />} />
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
