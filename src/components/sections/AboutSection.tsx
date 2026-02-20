import { about } from '../../data/portfolio';
import SectionTitle from '../ui/SectionTitle';
import styles from './AboutSection.module.css';

export default function AboutSection() {
  return (
    <section className={styles.section}>
      <SectionTitle number="01" title="ABOUT" id="section-about-title" />
      <div className={styles.content}>
        {about.lines.map((line, i) => (
          <p key={i} className={styles.text}>
            {line}
          </p>
        ))}
      </div>
    </section>
  );
}
