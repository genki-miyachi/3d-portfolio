import SectionTitle from '../ui/SectionTitle';
import styles from './AboutSection.module.css';

const lines = [
  'Web技術を軸に、フロントエンドからインフラまで幅広くカバーするフルスタックエンジニア。',
  'パフォーマンスとUXに強いこだわりを持ち、ユーザーにとって本当に価値のあるプロダクトを追求しています。',
  '新しい技術やアプローチを積極的に取り入れ、チームの開発体験と生産性の向上にも注力しています。',
];

export default function AboutSection() {
  return (
    <section className={styles.section}>
      <SectionTitle number="01" title="ABOUT" />
      <div className={styles.content}>
        {lines.map((line, i) => (
          <p key={i} className={styles.text}>
            {line}
          </p>
        ))}
      </div>
    </section>
  );
}
