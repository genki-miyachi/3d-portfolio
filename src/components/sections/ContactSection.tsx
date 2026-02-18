import SectionTitle from '../ui/SectionTitle';
import styles from './ContactSection.module.css';

const contacts = [
  {
    label: 'Email',
    href: 'mailto:hello@example.com',
    text: 'hello@example.com',
  },
  {
    label: 'GitHub',
    href: 'https://github.com/username',
    text: 'github.com/username',
  },
  {
    label: 'X',
    href: 'https://x.com/username',
    text: '@username',
  },
];

export default function ContactSection() {
  return (
    <section className={styles.section}>
      <SectionTitle number="05" title="CONTACT" />
      <div className={styles.list}>
        {contacts.map((c) => (
          <div key={c.label} className={styles.item}>
            <span className={styles.label}>{c.label}</span>
            <a
              href={c.href}
              className={styles.link}
              target="_blank"
              rel="noopener noreferrer"
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
