import { usePortfolio } from '../../data/portfolio';
import SectionTitle from '../ui/SectionTitle';
import styles from './ContactSection.module.css';

export default function ContactSection() {
  const { contactLinks } = usePortfolio();
  return (
    <section className={styles.section}>
      <SectionTitle number="04" title="CONTACT" id="section-contact-title" />
      <div className={styles.list}>
        {contactLinks.map((c) => (
          <div key={c.label} className={styles.item}>
            <span className={styles.label}>{c.label}</span>
            <a
              href={c.href}
              className={styles.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${c.text} (新しいタブで開く)`}
            >
              {c.text}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
