import { works } from '../../data/portfolio';
import SectionTitle from '../ui/SectionTitle';
import styles from './WorksSection.module.css';

export default function WorksSection() {
  return (
    <section className={styles.section}>
      <SectionTitle number="04" title="WORKS" />
      <div className={styles.grid}>
        {works.map((work, i) => (
          <div key={i} className={styles.card}>
            <h3 className={styles.cardTitle}>{work.title}</h3>
            <p className={styles.cardDescription}>{work.description}</p>
            <div className={styles.techs}>
              {work.techs.map((tech) => (
                <span key={tech} className={styles.tag}>
                  {tech}
                </span>
              ))}
            </div>
            <div className={styles.links}>
              {work.url && (
                <a
                  href={work.url}
                  className={styles.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Live
                </a>
              )}
              {work.github && (
                <a
                  href={work.github}
                  className={styles.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
