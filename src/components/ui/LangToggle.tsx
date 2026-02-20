import { useLocale } from '../../contexts/LocaleContext';
import type { Locale } from '../../contexts/LocaleContext';
import styles from './LangToggle.module.css';

const options: { value: Locale; label: string }[] = [
  { value: 'ja', label: 'JA' },
  { value: 'en', label: 'EN' },
];

export default function LangToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div className={styles.root} role="radiogroup" aria-label="Language">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`${styles.btn} ${locale === opt.value ? styles.active : ''}`}
          onClick={() => setLocale(opt.value)}
          role="radio"
          aria-checked={locale === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
