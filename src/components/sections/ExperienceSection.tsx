import { experiences } from '../../data/portfolio';
import SectionTitle from '../ui/SectionTitle';
import styles from './ExperienceSection.module.css';

export default function ExperienceSection() {
  return (
    <section className={styles.section}>
      <SectionTitle number="03" title="EXPERIENCE" />
      <div className={styles.timeline}>
        {experiences.map((exp, i) => (
          <div key={i} className={styles.item}>
            <div className={styles.company}>{exp.company}</div>
            <div className={styles.meta}>
              <span className={styles.role}>{exp.role}</span>
              <span className={styles.period}>{exp.period}</span>
            </div>
            <p className={styles.description}>{exp.description}</p>
            <div className={styles.techs}>
              {exp.techs.map((tech) => (
                <span key={tech} className={styles.tag}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
