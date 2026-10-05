import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import CopyButton from '../components/CopyButton/CopyButton';
import styles from './Contacts.module.css';

const { company } = companyData;
const embedSrc =
  'https://www.google.com/maps?q=Georgian-American+Friendship+Street+33+Tbilisi&output=embed';
const tel = (p: string) => `tel:${p.replace(/[^+\d]/g, '')}`;

export default function Contacts() {
  const { t, i18n } = useTranslation();
  const isKa = i18n.language === 'ka';
  const address = isKa ? company.addressKa : company.addressEn;

  const perks = [
    { icon: PackageCheck, title: t('contacts.perkStock'), text: t('contacts.perkStockText') },
    { icon: Headset, title: t('contacts.perkHelp'), text: t('contacts.perkHelpText') },
    { icon: BadgeCheck, title: t('contacts.perkCertified'), text: t('contacts.perkCertifiedText') },
  ];

  return (
    <div className={styles.page}>
      {/* ── HERO — dark industrial band, same language as Slider/Stats ── */}
      <section className={styles.hero}>
        <span className={styles.ghost} aria-hidden="true">
          CONTACTS
        </span>
        <div className={styles.heroInner}>
          <nav className={styles.crumbs} aria-label={t('common.breadcrumb')}>
            <Link to="/">{t('common.home')}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{t('contacts.title')}</span>
          </nav>
          <p className={styles.eyebrow}>{t('contacts.eyebrow')}</p>
          <h1 className={styles.title}>
            {t('contacts.title')}<span className={styles.dot}>.</span>
          </h1>
          <p className={styles.lead}>
            {t('contacts.lead')}
          </p>
          <div className={styles.heroActions}>
            <a className={styles.cta} href={tel(company.phones[0])}>
              <Phone size={17} strokeWidth={2.2} aria-hidden="true" />
              {t('contacts.callNow')}
            </a>
            <a
              className={styles.ctaGhost}
              href={`mailto:${company.email}?subject=Enquiry%20from%20website`}
            >
              <Mail size={17} strokeWidth={2} aria-hidden="true" />
              {t('contacts.sendEmail')}
            </a>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        {/* ── 1 · ABOUT ── */}
        <section className={styles.about} aria-labelledby="about-heading">
          <div className={styles.aboutMain}>
            <p className={styles.sectionEyebrow}>{t('contacts.whoWeAre')}</p>
            <h2 id="about-heading" className={styles.sectionTitle}>
              {t('contacts.aboutUs')}
            </h2>
            <p className={styles.aboutText}>
              {t('contacts.aboutText', { nameEn: company.nameEn, nameKa: company.nameKa })}
            </p>
            <p className={styles.aboutNote}>
              {t('contacts.aboutNote')}
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
            <p className={styles.sectionEyebrowDark}>{t('contacts.directLines')}</p>
            <h2 id="contact-heading" className={styles.contactTitle}>
              {t('contacts.contactInfo')}
            </h2>
          </div>
          <address className={styles.rows}>
            <div className={styles.row}>
              <span className={styles.rowIcon} aria-hidden="true">
                <MapPin size={19} strokeWidth={2} />
              </span>
              <span className={styles.rowText}>
                <span className={styles.rowLabel}>{t('contacts.visitUs')}</span>
                <span className={styles.rowValue}>{address}</span>
              </span>
              <CopyButton
                value={address}
                label={t('footer.copyAddress')}
                className={styles.copyBtn}
              />
            </div>
            {company.phones.map((phone) => (
              <div key={phone} className={styles.rowLink}>
                <a className={styles.rowMain} href={tel(phone)}>
                  <span className={styles.rowIcon} aria-hidden="true">
                    <Phone size={19} strokeWidth={2} />
                  </span>
                  <span className={styles.rowText}>
                    <span className={styles.rowLabel}>{t('contacts.callUs')}</span>
                    <span className={styles.rowValueStrong}>{phone}</span>
                  </span>
                  <ArrowUpRight
                    size={18}
                    aria-hidden="true"
                    className={styles.rowArrow}
                  />
                </a>
                <CopyButton
                  value={phone.replace(/[^+\d]/g, '')}
                  label={`Copy ${phone}`}
                  className={styles.copyBtn}
                />
              </div>
            ))}
            <div className={styles.rowLink}>
              <a
                className={styles.rowMain}
                href={`mailto:${company.email}`}
              >
                <span className={styles.rowIcon} aria-hidden="true">
                  <Mail size={19} strokeWidth={2} />
                </span>
                <span className={styles.rowText}>
                  <span className={styles.rowLabel}>{t('contacts.emailUs')}</span>
                  <span className={styles.rowValueStrong}>{company.email}</span>
                </span>
                <ArrowUpRight
                  size={18}
                  aria-hidden="true"
                  className={styles.rowArrow}
                />
              </a>
              <CopyButton
                value={company.email}
                label={`Copy ${company.email}`}
                className={styles.copyBtn}
              />
            </div>
          </address>
        </section>

        {/* ── 3 · MAP ── */}
        <section className={styles.map} aria-labelledby="map-heading">
          <div className={styles.mapHead}>
            <p className={styles.sectionEyebrow}>{t('contacts.findUs')}</p>
            <h2 id="map-heading" className={styles.sectionTitle}>
              {t('contacts.ourLocation')}
            </h2>
            <p className={styles.mapSub}>
              {t('contacts.nearEmbassy', { address })}
            </p>
          </div>
          <div className={styles.mapFrame}>
            <iframe
              title={`Map — ${address}`}
              src={embedSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-scripts"
              allowFullScreen
            />
            <div className={styles.mapCard}>
              <p className={styles.mapCardLabel}>
                <MapPin size={15} strokeWidth={2.2} aria-hidden="true" />
                {t('contacts.brandName')}
              </p>
              <p className={styles.mapCardAddr}>{address}</p>
              <a
                className={styles.directions}
                href={company.mapUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Navigation size={15} strokeWidth={2.2} aria-hidden="true" />
                {t('contacts.getDirections')}
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
