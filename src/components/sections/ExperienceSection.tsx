import { experiences } from '../../data/portfolio';
import SectionTitle from '../ui/SectionTitle';
import styles from './ExperienceSection.module.css';

export default function ExperienceSection() {
  return (
    <section className={styles.section}>
      <SectionTitle number="03" title="EXPERIENCE" />
      <div className={styles.timeline}>
        {experiences.map((exp) => (
          <div key={`${exp.company}-${exp.period}`} className={styles.item}>
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

            {exp.projects && exp.projects.length > 0 && (
              <div className={styles.projects}>
                {exp.projects.map((proj) => (
                  <div key={proj.title} className={styles.project}>
                    <div className={styles.projectHeader}>
                      <span className={styles.projectTitle}>{proj.title}</span>
                      <span className={styles.projectPeriod}>
                        {proj.period}
                      </span>
                    </div>
                    <div className={styles.projectMeta}>
                      <span>{proj.role}</span>
                      <span>{proj.teamSize}</span>
                    </div>
                    <ul className={styles.achievements}>
                      {proj.achievements.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                    <div className={styles.techs}>
                      {proj.techs.map((tech) => (
                        <span key={tech} className={styles.tagSm}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
