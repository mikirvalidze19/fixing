import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Category from './pages/Category';
import Application from './pages/Application';
import Applications from './pages/Applications';
import Contacts from './pages/Contacts';
import Home from './pages/Home';
import Product from './pages/Product';
import Video from './pages/Video';
import Placeholder from './pages/Placeholder';
import siteData from './data/site.json';

type NavRoute = { label: string; to: string; children?: NavRoute[] };

function collectRoutes() {
  const routes: { label: string; to: string }[] = [];
  const push = (label: string, to: string) => {
    if (!routes.some((r) => r.to === to)) routes.push({ label, to });
  };
  (siteData.header.topBar as NavRoute[]).forEach((l) => push(l.label, l.to));
  (siteData.header.mainNav as NavRoute[]).forEach((l) => {
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
  const routes = collectRoutes();
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
          <Route path="/contacts" element={<Contacts />} />
          {routes
            .filter(
              (r) =>
                r.to !== '/contacts' &&
                r.to !== '/video' &&
                r.to !== '/applications',
            )
            .map((r) => (
              <Route key={r.to} path={r.to} element={<Placeholder title={r.label} />} />
            ))}
          <Route path="*" element={<Placeholder title="Page not found" />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
