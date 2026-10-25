import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import ScrollProgress from './components/ScrollProgress/ScrollProgress';
import Category from './pages/Category';
import Application from './pages/Application';
import Applications from './pages/Applications';
import Contacts from './pages/Contacts';
import Home from './pages/Home';
import Product from './pages/Product';
import Video from './pages/Video';
import Services from './pages/Services';
import Placeholder from './pages/Placeholder';
import Admin from './pages/Admin';
import siteData from './data/site.json';
import type { NavLink } from './models/navigation';

const TITLE_KEYS: Record<string, string> = {
  Products: 'nav.products',
  Applications: 'nav.applications',
  Video: 'nav.video',
  'Services and support': 'nav.services',
  Contacts: 'nav.contacts',
};

function collectRoutes() {
  const routes: { label: string; to: string }[] = [];
  const push = (label: string, to: string) => {
    if (!routes.some((r) => r.to === to)) routes.push({ label, to });
  };
  (siteData.header.topBar as NavLink[]).forEach((l) => push(l.label, l.to));
  (siteData.header.mainNav as NavLink[]).forEach((l) => {
    push(l.label, l.to);
    l.children?.forEach((c) => push(c.label, c.to));
  });
  return routes;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const { t } = useTranslation();
  const routes = collectRoutes();
  const routeTitle = (label: string) =>
    t(TITLE_KEYS[label] ?? label, { defaultValue: label });
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products/:slug" element={<Category />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/applications/:slug" element={<Application />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/video" element={<Video />} />
          <Route path="/services-and-support" element={<Services />} />
          <Route path="/contacts" element={<Contacts />} />
          {routes
            .filter(
              (r) =>
                r.to !== '/contacts' &&
                r.to !== '/video' &&
                r.to !== '/services-and-support' &&
                r.to !== '/applications',
            )
            .map((r) => (
              <Route key={r.to} path={r.to} element={<Placeholder title={routeTitle(r.label)} />} />
            ))}
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Placeholder title={t('placeholder.notFound')} />} />
        </Routes>
      </main>
      <Footer />
      <ScrollProgress />
    </BrowserRouter>
  );
}
