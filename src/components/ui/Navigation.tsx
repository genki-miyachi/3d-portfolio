import styles from './Navigation.module.css';

const sections = [
  { label: 'About', number: '01' },
  { label: 'Skills', number: '02' },
  { label: 'Experience', number: '03' },
  { label: 'Contact', number: '04' },
];

interface NavigationProps {
  activeSection: number | null;
  onSelect: (index: number) => void;
}

export default function Navigation({ activeSection, onSelect }: NavigationProps) {
  return (
    <nav className={styles.root}>
      {sections.map((section, i) => {
        const sectionIndex = i + 1;
        const isActive = activeSection === sectionIndex;
        return (
          <button
            key={section.number}
            className={`${styles.item} ${isActive ? styles.active : ''}`}
            aria-label={section.label}
            onClick={() => onSelect(sectionIndex)}
          >
            <span className={styles.dot} />
            <span className={styles.label}>{section.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
