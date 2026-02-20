import styles from './SectionTitle.module.css';

interface SectionTitleProps {
  number: string;
  title: string;
  id?: string;
}

export default function SectionTitle({ number, title, id }: SectionTitleProps) {
  return (
    <h2 className={styles.root} id={id}>
      <span className={styles.number}>{number}</span>
      <span className={styles.separator}>//</span>
      <span className={styles.title}>{title}</span>
    </h2>
  );
}
