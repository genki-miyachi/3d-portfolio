import { usePortfolio } from '../../../data/portfolio';
import type { Skill } from '../../../data/portfolio';
import styles from './SkillsGlitchBars.module.css';

const CAT_COLORS: Record<string, string> = {
  frontend: '#00ff41',
  backend: '#41b0ff',
  infra: '#ff6b41',
  other: '#c084fc',
};

const CAT_LABELS: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  infra: 'Infrastructure',
  other: 'Other',
};

const TIER_WIDTH: Record<Skill['tier'], number> = {
  expert: 90,
  proficient: 60,
  familiar: 30,
};

const CATS = ['frontend', 'backend', 'infra', 'other'] as const;

export default function SkillsGlitchBars() {
  const { skills } = usePortfolio();
  let idx = 0;

  return (
    <div className={styles.root}>
      {CATS.map((cat) => {
        const items = skills.filter((s) => s.category === cat);
        if (items.length === 0) return null;
        const color = CAT_COLORS[cat];
        return (
          <div key={cat} className={styles.category}>
            <div className={styles.catHeader} data-text={CAT_LABELS[cat]}>
              {CAT_LABELS[cat]}
            </div>
            {items.map((skill) => {
              const w = TIER_WIDTH[skill.tier];
              const i = idx++;
              return (
                <div
                  key={skill.name}
                  className={styles.row}
                  style={{ '--delay': `${i * 80}ms` } as React.CSSProperties}
                >
                  <span className={styles.name}>{skill.name}</span>
                  <div className={styles.barTrack}>
                    <div className={styles.scanlines} />
                    <div
                      className={styles.barFill}
                      style={
                        {
                          '--bar-width': `${w}%`,
                          '--bar-color': color,
                        } as React.CSSProperties
                      }
                    />
                    <div
                      className={styles.glitchTip}
                      style={
                        {
                          '--bar-width': `${w}%`,
                          '--bar-color': color,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                  <span className={styles.tier}>{skill.tier}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
