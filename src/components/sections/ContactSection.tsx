import { contactLinks } from '../../data/portfolio';
import SectionTitle from '../ui/SectionTitle';
import styles from './ContactSection.module.css';

export default function ContactSection() {
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
      <div className={styles.divider} />
      <p className={styles.footer}>Built with Astro + React Three Fiber</p>
    </section>
  );
}
