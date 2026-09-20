import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Check, ChevronDown, Globe, Menu, Search, X } from "lucide-react";
import logoPng from "../../assets/fixing-systems-logo.webp";
import siteData from "../../data/site.json";
import categories from "../../data/product-categories.json";
import styles from "./Header.module.css";

type ChildLink = { label: string; to: string };
type NavItem = {
  label: string;
  to: string;
  menu?: string;
  children?: ChildLink[];
};

const mainNav = siteData.header.mainNav as NavItem[];
const topBar = siteData.header.topBar as ChildLink[];

/* tecfi category icons bundled locally (downloaded with permission) */
const categoryIconUrls = import.meta.glob("../../assets/categories/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

function categoryIcon(file: string): string {
  const entry = Object.entries(categoryIconUrls).find(([path]) =>
    path.endsWith(`/${file}`),
  );
  return entry ? entry[1] : "";
}

function LangSwitcher({
  lang,
  onChange,
  label,
}: {
  lang: string;
  onChange: (code: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { header } = siteData;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`${styles.langSwitcher} ${open ? styles.open : ""}`}
    >
      <button
        type="button"
        className={styles.langButton}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        <Globe size={16} strokeWidth={1.6} aria-hidden="true" />
        <span className={styles.langSlug}>{lang}</span>
        <span className={styles.langDivider} />
        <ChevronDown
          size={12}
          strokeWidth={2}
          className={styles.langArrow}
          aria-hidden="true"
        />
      </button>
      <ul className={styles.langMenu} role="listbox" aria-label={label}>
        {header.languages.options.map((opt) => {
          const active = opt.code === lang;
          return (
            <li key={opt.code} role="option" aria-selected={active}>
              <button
                type="button"
                className={active ? styles.langOptionActive : styles.langOption}
                onClick={() => {
                  onChange(opt.code);
                  setOpen(false);
                }}
              >
                <span className={styles.langCode}>{opt.code}</span>
                <span className={styles.langLabel}>{opt.label}</span>
                {active && (
                  <Check
                    size={14}
                    strokeWidth={2.2}
                    aria-hidden="true"
                    className={styles.langCheck}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang, setLang] = useState(siteData.header.languages.current);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false);
  const location = useLocation();
  const { header } = siteData;
  const productsActive = location.pathname.startsWith("/products");
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setMegaOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /* close mobile drawer on outside tap */
  useEffect(() => {
    if (!mobileOpen) return;
    const onOutside = (e: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, [mobileOpen]);

  /* close mega panel on navigation */
  useEffect(() => {
    setMegaOpen(false);
  }, [location.pathname]);

  return (
    <header
      ref={headerRef}
      className={styles.header}
      onMouseLeave={() => setMegaOpen(false)}
    >
      <div className={styles.breakout}>
        <div className={styles.container}>
          {/* LEFT — logo */}
          <div className={styles.left}>
            <Link
              to={header.logo.link}
              className={styles.logoBox}
              aria-label={header.logo.alt}
            >
              <img
                src={logoPng}
                alt={header.logo.alt}
                width={header.logo.width}
              />
            </Link>
          </div>

          {/* RIGHT */}
          <div className={styles.right}>
            <div className={styles.rightInner}>
              {/* TOP ROW — News / Contacts / lang / search / account */}
              <div className={styles.topRow}>
                <nav className={styles.topNav} aria-label="Top">
                  <ul>
                    {topBar.map((item) => (
                      <li key={item.label}>
                        <NavLink to={item.to}>{item.label}</NavLink>
                      </li>
                    ))}
                  </ul>
                </nav>

                <div className={styles.topIcons}>
                  <LangSwitcher
                    lang={lang}
                    onChange={setLang}
                    label="Language"
                  />

                  <button
                    type="button"
                    className={styles.searchBtn}
                    aria-label="Search"
                  >
                    <Search size={20} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* BOTTOM ROW — main nav (Products opens mega dropdown, not a page) */}
              <div className={styles.bottomRow}>
                <nav className={styles.mainNav} aria-label="Primary">
                  <ul>
                    {mainNav.map((item) =>
                      item.menu === "mega" ? (
                        <li key={item.label}>
                          <button
                            type="button"
                            className={`${styles.megaButton} ${productsActive || megaOpen ? styles.megaButtonActive : ""}`}
                            aria-expanded={megaOpen}
                            aria-haspopup="true"
                            onMouseEnter={() => setMegaOpen(true)}
                            onFocus={() => setMegaOpen(true)}
                            onClick={() => setMegaOpen((v) => !v)}
                          >
                            {item.label}
                          </button>
                        </li>
                      ) : (
                        <li
                          key={item.label}
                          className={item.children ? styles.hasChildren : ""}
                        >
                          <NavLink
                            to={item.to}
                            className={({ isActive }) =>
                              isActive ? styles.active : ""
                            }
                          >
                            {item.label}
                          </NavLink>
                          {item.children && (
                            <ul className={styles.subMenu}>
                              {item.children.map((child) => (
                                <li key={child.label}>
                                  <Link to={child.to}>{child.label}</Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ),
                    )}
                  </ul>
                </nav>
              </div>
            </div>
          </div>

          {/* MOBILE — lang pill + hamburger (mobile-first base, hidden on desktop) */}
          <div className={styles.mobileControls}>
            <LangSwitcher lang={lang} onChange={setLang} label="Language" />
            <button
              type="button"
              className={styles.burger}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? (
                <X size={26} strokeWidth={2} />
              ) : (
                <Menu size={26} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* PRODUCTS mega dropdown — same 15 categories + tecfi icons */}
      <div
        className={`${styles.megaPanel} ${megaOpen ? styles.megaPanelOpen : ""}`}
        aria-hidden={!megaOpen}
      >
        <div className={styles.megaInner}>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products/${cat.slug}`}
              className={styles.megaItem}
              tabIndex={megaOpen ? 0 : -1}
              onClick={() => setMegaOpen(false)}
            >
              <span className={styles.megaIcon}>
                <img
                  src={categoryIcon(cat.icon)}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                />
              </span>
              <span className={styles.megaLabel}>{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* mobile drawer */}
      <div
        className={`${styles.drawer} ${mobileOpen ? styles.drawerOpen : ""}`}
      >
        <nav aria-label="Mobile">
          <ul>
            {mainNav.map((item) =>
              item.menu === "mega" ? (
                <li key={item.label}>
                  <button
                    type="button"
                    className={styles.drawerToggle}
                    aria-expanded={mobileCatsOpen}
                    onClick={() => setMobileCatsOpen((v) => !v)}
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      size={18}
                      className={`${styles.drawerChevron} ${mobileCatsOpen ? styles.drawerChevronOpen : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  <ul
                    className={`${styles.mobileCats} ${mobileCatsOpen ? styles.mobileCatsOpen : ""}`}
                  >
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          to={`/products/${cat.slug}`}
                          className={styles.mobileCatItem}
                          onClick={() => setMobileOpen(false)}
                        >
                          <img
                            src={categoryIcon(cat.icon)}
                            alt=""
                            aria-hidden="true"
                            loading="lazy"
                          />
                          <span>{cat.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={item.label}>
                  <Link to={item.to} onClick={() => setMobileOpen(false)}>
                    {item.label}
                  </Link>
                  {item.children && (
                    <ul className={styles.drawerSub}>
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <Link
                            to={child.to}
                            onClick={() => setMobileOpen(false)}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ),
            )}
          </ul>
          <ul className={styles.drawerTop}>
            {topBar.map((item) => (
              <li key={item.label}>
                <Link to={item.to} onClick={() => setMobileOpen(false)}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
