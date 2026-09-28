import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy } from 'lucide-react';
import styles from './CopyButton.module.css';

type Props = {
  value: string;
  label: string;
  className?: string;
};

/* Only the most recently copied button shows the checkmark —
   when one button copies, all others reset immediately. */
const resetListeners = new Set<(activeId: string) => void>();

function announceCopy(activeId: string) {
  resetListeners.forEach((fn) => fn(activeId));
}

async function copyText(value: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export default function CopyButton({ value, label, className }: Props) {
  const { t } = useTranslation();
  const id = useId();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const resetIfNotActive = (activeId: string) => {
      if (activeId !== id) {
        setCopied(false);
        if (timer.current) window.clearTimeout(timer.current);
      }
    };
    resetListeners.add(resetIfNotActive);
    return () => {
      resetListeners.delete(resetIfNotActive);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [id]);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(true);
    announceCopy(id);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      className={className ? `${styles.btn} ${className}` : styles.btn}
      onClick={onClick}
      aria-label={label}
      title={copied ? t('copy.copied') : label}
    >
      {copied ? (
        <Check size={15} strokeWidth={2.4} aria-hidden="true" />
      ) : (
        <Copy size={15} strokeWidth={2} aria-hidden="true" />
      )}
      <span className={styles.tip} aria-hidden="true">
        {copied ? t('copy.copied') : t('copy.copy')}
      </span>
    </button>
  );
}
