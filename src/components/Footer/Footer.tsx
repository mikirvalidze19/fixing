import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, MapPin, Phone } from "lucide-react";
import CopyButton from "../CopyButton/CopyButton";
import logoPng from "../../assets/fixing-systems-logo.webp";
import siteData from "../../data/site.json";
import realData from "../../data/data.json";
import styles from "./Footer.module.css";

const SITEMAP_KEYS: Record<string, string> = {
  "/applications": "nav.applications",
  "/services-and-support": "nav.services",
  "/contacts": "nav.contacts",
};

export default function Footer() {
  const { t, i18n } = useTranslation();
  const { company, footer } = realData;
  const isKa = i18n.language === "ka";
  const companyName = isKa ? company.nameKa : company.nameEn;
  const address = isKa ? company.addressKa : company.addressEn;

  return (
    <footer className={styles.footer}>
      <div className={styles.wrap}>
        {/* Brand */}
        <div className={styles.col}>
          <Link to="/" className={styles.logoBox} aria-label={companyName}>
            <img src={logoPng} alt={companyName} />
          </Link>
          <p className={styles.copy}>{footer.copyright}</p>
          <p className={styles.companyKa}>{company.nameKa}</p>
        </div>

        {/* Contact — real data from data.json */}
        <div className={styles.col}>
          <h5 className={styles.heading}>{t("footer.contact", { defaultValue: footer.contactTitle })}</h5>
          <address className={styles.address}>
            <p>
              <MapPin size={15} aria-hidden="true" />
              <span>{address}</span>
              <CopyButton value={address} label={t("footer.copyAddress")} />
            </p>
            {company.phones.map((phone) => (
              <p key={phone}>
                <Phone size={15} aria-hidden="true" />
                <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a>
                <CopyButton value={phone.replace(/[^+\d]/g, "")} label={`Copy ${phone}`} />
              </p>
            ))}
            <p>
              <Mail size={15} aria-hidden="true" />
              <a href={`mailto:${company.email}`}>{company.email}</a>
              <CopyButton value={company.email} label={`Copy ${company.email}`} />
            </p>
          </address>
          <a
            href={company.mapUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.mapBtn}
          >
            {t("footer.maps", { defaultValue: "Maps" })}
          </a>
        </div>

        {/* Sitemap */}
        <div className={styles.col}>
          <h5 className={styles.heading}>{t("footer.sitemap", { defaultValue: footer.sitemapTitle })}</h5>
          <ul className={styles.sitemap}>
            {siteData.footer.sitemap.map((item) => (
              <li key={item.label}>
                <Link to={item.to}>{t(SITEMAP_KEYS[item.to] ?? item.to, { defaultValue: item.label })}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
