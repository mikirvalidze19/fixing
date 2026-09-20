import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BadgeCheck,
  Headset,
  Mail,
  MapPin,
  Navigation,
  PackageCheck,
  Phone,
} from 'lucide-react';
import companyData from '../data/data.json';
import styles from './Contacts.module.css';

const { company } = companyData;
const embedSrc =
  'https://www.google.com/maps?q=Georgian-American+Friendship+Street+33+Tbilisi&output=embed';
const tel = (p: string) => `tel:${p.replace(/[^+\d]/g, '')}`;

const perks = [
  { icon: PackageCheck, title: 'Local stock', text: 'Tbilisi warehouse' },
  { icon: Headset, title: 'Technical help', text: 'Sizing & application' },
  { icon: BadgeCheck, title: 'Certified range', text: 'Professional systems' },
];

export default function Contacts() {
  return (
    <div className={styles.page}>
      {/* ── HERO — dark industrial band, same language as Slider/Stats ── */}
      <section className={styles.hero}>
        <span className={styles.ghost} aria-hidden="true">
          CONTACTS
        </span>
        <div className={styles.heroInner}>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Contacts</span>
          </nav>
          <p className={styles.eyebrow}>Get in touch</p>
          <h1 className={styles.title}>
            Contacts<span className={styles.dot}>.</span>
          </h1>
          <p className={styles.lead}>
            Talk to our team — we help you pick the right fixing solution and
            answer technical questions fast.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.cta} href={tel(company.phones[0])}>
              <Phone size={17} strokeWidth={2.2} aria-hidden="true" />
              Call now
            </a>
            <a
              className={styles.ctaGhost}
              href={`mailto:${company.email}?subject=Enquiry%20from%20website`}
            >
              <Mail size={17} strokeWidth={2} aria-hidden="true" />
              Send email
            </a>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        {/* ── 1 · ABOUT ── */}
        <section className={styles.about} aria-labelledby="about-heading">
          <div className={styles.aboutMain}>
            <p className={styles.sectionEyebrow}>Who we are</p>
            <h2 id="about-heading" className={styles.sectionTitle}>
              About us
            </h2>
            <p className={styles.aboutText}>
              <strong>{company.nameEn}</strong> ({company.nameKa}) is a
              Georgia-based importer of professional fixing systems — certified
              anchors, screws and anchoring solutions for contractors,
              technical buyers and engineers, with local stock and support in
              Tbilisi.
            </p>
            <p className={styles.aboutNote}>
              Catalogue &amp; enquiry website — no online checkout. For prices
              or technical help, call or email and we will respond promptly.
            </p>
          </div>
          <ul className={styles.perks}>
            {perks.map(({ icon: Icon, title, text }) => (
              <li key={title} className={styles.perk}>
                <span className={styles.perkIcon} aria-hidden="true">
                  <Icon size={20} strokeWidth={2} />
                </span>
                <span className={styles.perkText}>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── 2 · CONTACT INFO — dark panel ── */}
        <section className={styles.contact} aria-labelledby="contact-heading">
          <div className={styles.contactHead}>
            <p className={styles.sectionEyebrowDark}>Direct lines</p>
            <h2 id="contact-heading" className={styles.contactTitle}>
              Contact info
            </h2>
          </div>
          <address className={styles.rows}>
            <div className={styles.row}>
              <span className={styles.rowIcon} aria-hidden="true">
                <MapPin size={19} strokeWidth={2} />
              </span>
              <span className={styles.rowText}>
                <span className={styles.rowLabel}>Visit us</span>
                <span className={styles.rowValue}>{company.addressEn}</span>
              </span>
            </div>
            {company.phones.map((phone) => (
              <a key={phone} className={styles.rowLink} href={tel(phone)}>
                <span className={styles.rowIcon} aria-hidden="true">
                  <Phone size={19} strokeWidth={2} />
                </span>
                <span className={styles.rowText}>
                  <span className={styles.rowLabel}>Call us</span>
                  <span className={styles.rowValueStrong}>{phone}</span>
                </span>
                <ArrowUpRight
                  size={18}
                  aria-hidden="true"
                  className={styles.rowArrow}
                />
              </a>
            ))}
            <a
              className={styles.rowLink}
              href={`mailto:${company.email}`}
            >
              <span className={styles.rowIcon} aria-hidden="true">
                <Mail size={19} strokeWidth={2} />
              </span>
              <span className={styles.rowText}>
                <span className={styles.rowLabel}>Email us</span>
                <span className={styles.rowValueStrong}>{company.email}</span>
              </span>
              <ArrowUpRight
                size={18}
                aria-hidden="true"
                className={styles.rowArrow}
              />
            </a>
          </address>
        </section>

        {/* ── 3 · MAP ── */}
        <section className={styles.map} aria-labelledby="map-heading">
          <div className={styles.mapHead}>
            <p className={styles.sectionEyebrow}>Find us</p>
            <h2 id="map-heading" className={styles.sectionTitle}>
              Our location
            </h2>
            <p className={styles.mapSub}>
              {company.addressEn} — near the US Embassy.
            </p>
          </div>
          <div className={styles.mapFrame}>
            <iframe
              title={`Map — ${company.addressEn}`}
              src={embedSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className={styles.mapCard}>
              <p className={styles.mapCardLabel}>
                <MapPin size={15} strokeWidth={2.2} aria-hidden="true" />
                Fixing Systems LLC
              </p>
              <p className={styles.mapCardAddr}>{company.addressEn}</p>
              <a
                className={styles.directions}
                href={company.mapUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Navigation size={15} strokeWidth={2.2} aria-hidden="true" />
                Get directions
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
