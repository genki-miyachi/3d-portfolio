import type { MutableRefObject } from 'react';
import styles from './Navigation.module.css';

interface NavigationProps {
  navDotsRef: MutableRefObject<(HTMLElement | null)[]>;
}

const sections = [
  { label: 'Hero', number: '00' },
  { label: 'About', number: '01' },
  { label: 'Skills', number: '02' },
  { label: 'Experience', number: '03' },
  { label: 'Works', number: '04' },
  { label: 'Contact', number: '05' },
];

export default function Navigation({ navDotsRef }: NavigationProps) {
  return (
    <nav className={styles.root}>
      {sections.map((section, i) => (
        <button
          key={section.number}
          className={styles.item}
          ref={(el) => {
            navDotsRef.current[i] = el;
          }}
          aria-label={`Navigate to ${section.label}`}
        >
          <span className={styles.dot} />
          <span className={styles.label}>{section.label}</span>
        </button>
      ))}
    </nav>
  );
}
