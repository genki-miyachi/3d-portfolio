import { skills } from '../../data/portfolio';
import type { Skill } from '../../data/portfolio';
import SectionTitle from '../ui/SectionTitle';
import styles from './SkillsSection.module.css';

const categories: { key: Skill['category']; label: string }[] = [
  { key: 'frontend', label: 'Frontend' },
  { key: 'backend', label: 'Backend' },
  { key: 'infra', label: 'Infrastructure' },
  { key: 'other', label: 'Other' },
];

export default function SkillsSection() {
  const grouped = categories
    .map((cat) => ({
      ...cat,
      items: skills.filter((s) => s.category === cat.key),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <section className={styles.section}>
      <SectionTitle number="02" title="SKILLS" />
      <div className={styles.grid}>
        {grouped.map((cat) => (
          <div key={cat.key} className={styles.category}>
            <div className={styles.categoryHeader}>{cat.label}</div>
            {cat.items.map((skill) => (
              <div key={skill.name} className={styles.skillItem}>
                <div className={styles.skillInfo}>
                  <span className={styles.skillName}>{skill.name}</span>
                  <span className={styles.skillLevel}>{skill.level}%</span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
