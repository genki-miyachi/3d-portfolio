import { useState, useEffect, useRef } from 'react';
import { usePortfolio } from '../../../data/portfolio';
import type { Skill } from '../../../data/portfolio';
import styles from './SkillsTerminal.module.css';

const CAT_LABELS: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  infra: 'Infrastructure',
  ai: 'AI Agent',
  other: 'Other',
};

const TIER_BAR: Record<Skill['tier'], string> = {
  expert: '████████░░',
  proficient: '█████░░░░░',
  familiar: '███░░░░░░░',
};

const TIER_LABEL: Record<Skill['tier'], string> = {
  expert: 'Expert',
  proficient: 'Proficient',
  familiar: 'Familiar',
};

function buildLines(skills: Skill[]): string[] {
  const lines: string[] = ['$ skills --list --verbose', ''];
  const cats = ['frontend', 'backend', 'infra', 'ai', 'other'] as const;

  for (const cat of cats) {
    const items = skills.filter((s) => s.category === cat);
    if (items.length === 0) continue;
    lines.push(`--- ${CAT_LABELS[cat]} ---`);
    for (const s of items) {
      const name = s.name.padEnd(16);
      const bar = TIER_BAR[s.tier];
      const label = TIER_LABEL[s.tier];
      lines.push(`  ${name}[${bar}]  ${label}`);
    }
    lines.push('');
  }
  lines.push(`✓ Done. ${skills.length} skills loaded.`);
  return lines;
}

export default function SkillsTerminal() {
  const { skills } = usePortfolio();
  const [visibleLines, setVisibleLines] = useState(0);
  const allLines = useRef(buildLines(skills));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const total = allLines.current.length;
    if (visibleLines >= total) return;
    const delay = visibleLines === 0 ? 300 : 40;
    const id = setTimeout(() => setVisibleLines((v) => v + 1), delay);
    return () => clearTimeout(id);
  }, [visibleLines]);

  useEffect(() => {
    containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);
  }, [visibleLines]);

  return (
    <div className={styles.root} ref={containerRef}>
      <div className={styles.titleBar}>
        <span className={styles.dot} style={{ background: '#ff5f57' }} />
        <span className={styles.dot} style={{ background: '#ffbd2e' }} />
        <span className={styles.dot} style={{ background: '#28c840' }} />
        <span className={styles.titleText}>skills.sh</span>
      </div>
      <pre className={styles.output}>
        {allLines.current.slice(0, visibleLines).map((line, i) => (
          <div key={i} className={styles.line}>
            {line.startsWith('---') ? (
              <span className={styles.catHeader}>{line}</span>
            ) : line.includes('Expert') ? (
              <span className={styles.expert}>{line}</span>
            ) : line.includes('Proficient') ? (
              <span className={styles.proficient}>{line}</span>
            ) : line.includes('Familiar') ? (
              <span className={styles.familiar}>{line}</span>
            ) : (
              <span>{line}</span>
            )}
          </div>
        ))}
        {visibleLines < allLines.current.length && (
          <span className={styles.cursor}>▌</span>
        )}
      </pre>
    </div>
  );
}
