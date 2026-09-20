import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import logoPng from "../../assets/fixing-systems-logo.webp";
import siteData from "../../data/site.json";
import realData from "../../data/data.json";
import styles from "./Footer.module.css";

export default function Footer() {
  const { company, footer } = realData;

  return (
    <footer className={styles.footer}>
      <div className={styles.wrap}>
        {/* Brand */}
        <div className={styles.col}>
          <Link to="/" className={styles.logoBox} aria-label={company.nameEn}>
            <img src={logoPng} alt={company.nameEn} />
          </Link>
          <p className={styles.copy}>{footer.copyright}</p>
          <p className={styles.companyKa}>{company.nameKa}</p>
        </div>

        {/* Contact — real data from data.json */}
        <div className={styles.col}>
          <h5 className={styles.heading}>{footer.contactTitle}</h5>
          <address className={styles.address}>
            <p>
              <MapPin size={15} aria-hidden="true" />
              <span>{company.addressEn}</span>
            </p>
            {company.phones.map((phone) => (
              <p key={phone}>
                <Phone size={15} aria-hidden="true" />
                <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a>
              </p>
            ))}
            <p>
              <Mail size={15} aria-hidden="true" />
              <a href={`mailto:${company.email}`}>{company.email}</a>
            </p>
          </address>
          <a
            href={company.mapUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.mapBtn}
          >
            Maps
          </a>
        </div>

        {/* Sitemap */}
        <div className={styles.col}>
          <h5 className={styles.heading}>{footer.sitemapTitle}</h5>
          <ul className={styles.sitemap}>
            {siteData.footer.sitemap.map((item) => (
              <li key={item.label}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
