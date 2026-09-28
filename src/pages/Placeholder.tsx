import { useTranslation } from 'react-i18next';
import styles from './Placeholder.module.css';

export default function Placeholder({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <div className={styles.wrap}>
      <h1>{title}</h1>
      <p>{t('placeholder.body')}</p>
    </div>
  );
}
