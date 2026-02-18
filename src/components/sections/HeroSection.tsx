import styles from './HeroSection.module.css';

export default function HeroSection() {
  return (
    <section className={styles.section}>
      <h1 className={styles.name}>Genki Miyachi</h1>
      <p className={styles.subtitle}>
        <span className={styles.accent}>/</span> Engineer
      </p>
      <div className={styles.scrollHint}>scroll</div>
    </section>
  );
}
