import { usePortfolio } from '../../data/portfolio';
import type { Skill } from '../../data/portfolio';
import SectionTitle from '../ui/SectionTitle';
import styles from './SkillsSection.module.css';

const categories: { key: Skill['category']; label: string; color: string }[] = [
  { key: 'frontend', color: '#00ff41', label: 'Frontend' },
  { key: 'backend', color: '#41b0ff', label: 'Backend' },
  { key: 'infra', color: '#ff6b41', label: 'Infrastructure' },
  { key: 'other', color: '#c084fc', label: 'Other' },
];

export default function SkillsSection() {
  const { skills } = usePortfolio();
  const grouped = categories
    .map((cat) => ({
      ...cat,
      items: skills.filter((s) => s.category === cat.key),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <section className={styles.section}>
      <SectionTitle number="02" title="SKILLS" id="section-skills-title" />
      <div className={styles.grid}>
        {grouped.map((cat) => (
          <div
            key={cat.key}
            className={styles.category}
            style={{ '--cat-color': cat.color } as React.CSSProperties}
          >
            <div className={styles.categoryHeader}>{cat.label}</div>
            {cat.items.map((skill, i) => (
              <div key={skill.name} className={styles.skillItem}>
                <div className={styles.skillInfo}>
                  <span className={styles.skillName}>{skill.name}</span>
                  <span className={styles.skillLevel}>{skill.level}%</span>
                </div>
                <div
                  className={styles.barTrack}
                  role="progressbar"
                  aria-label={skill.name}
                  aria-valuenow={skill.level}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${skill.level}%`,
                      '--delay': `${i * 0.06}s`,
                    } as React.CSSProperties}
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
