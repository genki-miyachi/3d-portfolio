import styles from './SectionTitle.module.css';

interface SectionTitleProps {
  number: string;
  title: string;
}

export default function SectionTitle({ number, title }: SectionTitleProps) {
  return (
    <h2 className={styles.root}>
      <span className={styles.number}>{number}</span>
      <span className={styles.separator}>//</span>
      <span className={styles.title}>{title}</span>
    </h2>
  );
}
