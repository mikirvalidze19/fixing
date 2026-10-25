import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Globe, Menu, Search, X } from "lucide-react";
import logoPng from "../../assets/fixing-systems-logo.webp";
import siteData from "../../data/site.json";
import { categories } from "../../data/catalog";
import type { NavItem, NavLink as NavLinkType } from "../../models/navigation";
import SearchPanel from "../SearchPanel/SearchPanel";
import styles from "./Header.module.css";

const mainNav = siteData.header.mainNav as NavItem[];
const topBar = siteData.header.topBar as NavLinkType[];

/* English nav labels → locale keys. Unknown labels fall back to themselves. */
const NAV_KEYS: Record<string, string> = {
  Products: "nav.products",
  Applications: "nav.applications",
  Video: "nav.video",
  "Services and support": "nav.services",
  Contacts: "nav.contacts",
};

const LANG_CODES = ["en", "ka"] as const;

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
  const { t } = useTranslation();

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
        {LANG_CODES.map((code) => {
          const active = code === lang;
          return (
            <li key={code} role="option" aria-selected={active}>
              <button
                type="button"
                className={active ? styles.langOptionActive : styles.langOption}
                onClick={() => {
                  onChange(code);
                  setOpen(false);
                }}
              >
                <span className={styles.langCode}>{code}</span>
                <span className={styles.langLabel}>{t(`languages.${code}`, { defaultValue: code })}</span>
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
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "ka" ? "ka" : "en";
  const changeLang = (code: string) => void i18n.changeLanguage(code);
  const navLabel = (label: string) =>
    t(NAV_KEYS[label] ?? label, { defaultValue: label });
  const categoryLabel = (slug: string, fallback: string) =>
    t(`categories.${slug}.label`, { defaultValue: fallback });
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const { header } = siteData;
  const productsActive = location.pathname.startsWith("/products");
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setMegaOpen(false);
        setSearchOpen(false);
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
    document.addEventListener("touchstart", onOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, [mobileOpen]);

  /* close search panel on outside tap/click */
  useEffect(() => {
    if (!searchOpen) return;
    const onOutside = (e: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, [searchOpen]);

  /* close mega panel and search on navigation — derived during render instead
     of synced in an effect (no cascading render after navigation commits) */
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setMegaOpen(false);
    setSearchOpen(false);
  }

  const toggleSearch = () => {
    setSearchOpen((open) => !open);
    setMegaOpen(false);
    setMobileOpen(false);
  };

  const toggleMega = () => {
    setMegaOpen((open) => !open);
    setSearchOpen(false);
  };

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
                <nav className={styles.topNav} aria-label={t("nav.top")}>
                  <ul>
                    {topBar.map((item) => (
                      <li key={item.label}>
                        <NavLink to={item.to}>{navLabel(item.label)}</NavLink>
                      </li>
                    ))}
                  </ul>
                </nav>

                <div className={styles.topIcons}>
                  <LangSwitcher
                    lang={lang}
                    onChange={changeLang}
                    label={t("nav.language")}
                  />

                  <button
                    type="button"
                    className={`${styles.searchBtn} ${searchOpen ? styles.searchBtnActive : ""}`}
                    aria-label={t("nav.search")}
                    aria-expanded={searchOpen}
                    aria-controls={searchOpen ? "site-search-panel" : undefined}
                    onClick={toggleSearch}
                  >
                    <Search size={20} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* BOTTOM ROW — main nav (Products opens mega dropdown, not a page) */}
              <div className={styles.bottomRow}>
                <nav className={styles.mainNav} aria-label={t("nav.primary")}>
                  <ul>
                    {mainNav.map((item) =>
                      item.menu === "mega" ? (
                        <li key={item.label}>
                          <button
                            type="button"
                            className={`${styles.megaButton} ${productsActive || megaOpen ? styles.megaButtonActive : ""}`}
                            aria-expanded={megaOpen}
                            aria-haspopup="true"
                            onMouseEnter={() => {
                              setMegaOpen(true);
                              setSearchOpen(false);
                            }}
                            onFocus={() => {
                              setMegaOpen(true);
                              setSearchOpen(false);
                            }}
                            onClick={toggleMega}
                          >
                            {navLabel(item.label)}
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
                            {navLabel(item.label)}
                          </NavLink>
                          {item.children && (
                            <ul className={styles.subMenu}>
                              {item.children.map((child) => (
                                <li key={child.label}>
                                  <Link to={child.to}>{navLabel(child.label)}</Link>
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
            <LangSwitcher lang={lang} onChange={changeLang} label={t("nav.language")} />
            <button
              type="button"
              className={styles.burger}
              aria-label={t("nav.search")}
              aria-expanded={searchOpen}
              aria-controls={searchOpen ? "site-search-panel" : undefined}
              onClick={toggleSearch}
            >
              <Search size={22} strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.burger}
              aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
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

      {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}

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
              <span className={styles.megaLabel}>{categoryLabel(cat.slug, cat.label)}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* mobile drawer */}
      <div
        className={`${styles.drawer} ${mobileOpen ? styles.drawerOpen : ""}`}
      >
        <nav aria-label={t("nav.mobile")}>
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
                    <span>{navLabel(item.label)}</span>
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
                          <span>{categoryLabel(cat.slug, cat.label)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={item.label}>
                  <Link to={item.to} onClick={() => setMobileOpen(false)}>
                    {navLabel(item.label)}
                  </Link>
                  {item.children && (
                    <ul className={styles.drawerSub}>
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <Link
                            to={child.to}
                            onClick={() => setMobileOpen(false)}
                          >
                            {navLabel(child.label)}
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
                  {navLabel(item.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
