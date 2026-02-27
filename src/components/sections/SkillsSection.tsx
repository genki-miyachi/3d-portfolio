import SectionTitle from '../ui/SectionTitle';
import SkillsTerminal from './skills/SkillsTerminal';
import SkillsGlitchBars from './skills/SkillsGlitchBars';
import styles from './SkillsSection.module.css';

const designs = [
  { label: '1. Terminal CLI（ターミナル出力）', Component: SkillsTerminal },
  { label: '2. Glitch Bars（グリッチバー）', Component: SkillsGlitchBars },
];

export default function SkillsSection() {
  return (
    <section className={styles.section}>
      <SectionTitle number="02" title="SKILLS" id="section-skills-title" />
      <div className={styles.showcase}>
        {designs.map(({ label, Component }) => (
          <div key={label} className={styles.designBlock}>
            <h3 className={styles.designLabel}>{label}</h3>
            <div className={styles.designContent}>
              <Component />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
