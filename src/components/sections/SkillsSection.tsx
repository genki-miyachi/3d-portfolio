import SectionTitle from '../ui/SectionTitle';
import SkillsGlitchBars from './skills/SkillsGlitchBars';
import styles from './SkillsSection.module.css';

export default function SkillsSection() {
  return (
    <section className={styles.section}>
      <SectionTitle number="02" title="SKILLS" id="section-skills-title" />
      <SkillsGlitchBars />
    </section>
  );
}
