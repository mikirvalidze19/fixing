import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ServiceCard,
  ServiceCardIcon,
  ServiceCardLinkOverlay,
  ServiceCardTitle,
} from '../components/ServiceCard/ServiceCard';
import { TecfiChemicalCalcIcon, TecfiDownloadIcon } from '../components/ServiceCard/TecfiIcons';
import styles from './Services.module.css';

/* Static destinations hoisted to module level — no fetch, no waterfall.
 * Buttons navigate to the live tecfi.it pages (open in a new tab). */
const TECFI_BASE = 'https://www.tecfi.it/en/services-and-support';

const EXTERNAL = {
  download: `${TECFI_BASE}/download`,
  calculation: `${TECFI_BASE}/chemical-fixing-calculation`,
} as const;

/* Explicit variants — one component per service instead of
 * <ServiceCard type="download" /> boolean/mode props. */

function DownloadServiceCard({ title }: { title: string }) {
  return (
    <ServiceCard name="download">
      <ServiceCardLinkOverlay href={EXTERNAL.download} label={`${title} — tecfi.it`} />
      <ServiceCardTitle>{title}</ServiceCardTitle>
      <ServiceCardIcon label={title}>
        <TecfiDownloadIcon />
      </ServiceCardIcon>
    </ServiceCard>
  );
}

function CalculationServiceCard({ title }: { title: string }) {
  return (
    <ServiceCard name="calculation">
      <ServiceCardLinkOverlay href={EXTERNAL.calculation} label={`${title} — tecfi.it`} />
      <ServiceCardTitle>{title}</ServiceCardTitle>
      <ServiceCardIcon label={title}>
        <TecfiChemicalCalcIcon />
      </ServiceCardIcon>
    </ServiceCard>
  );
}

export default function Services() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <nav className={styles.crumbs} aria-label={t('common.breadcrumb')}>
        <Link to="/">{t('common.home')}</Link>
        <span aria-hidden="true">|</span>
        <span aria-current="page">{t('nav.services')}</span>
      </nav>

      <h1 className={styles.title}>
        {t('services.title', { defaultValue: 'Services & support' })}
      </h1>
      <p className={styles.lead}>
        {t('services.lead', {
          defaultValue: 'The services and support we provide to our customers for our products',
        })}
      </p>

      <div className={styles.grid}>
        <DownloadServiceCard
          title={t('services.download', { defaultValue: 'Download' })}
        />
        <CalculationServiceCard
          title={t('services.calculation', { defaultValue: 'Chemical fixing calculation' })}
        />
      </div>
    </div>
  );
}
