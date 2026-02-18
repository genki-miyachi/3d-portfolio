import { useMemo } from 'react';
import styles from './ScrollFadeSection.module.css';

interface ScrollFadeSectionProps {
  offset: number;
  /** [fadeInStart, fullyVisible, fadeOutEnd] — 0-1 の scroll offset */
  range: [number, number, number];
  children: React.ReactNode;
}

export default function ScrollFadeSection({
  offset,
  range,
  children,
}: ScrollFadeSectionProps) {
  const [start, peak, end] = range;

  const { opacity, translateY } = useMemo(() => {
    if (offset <= start) {
      return { opacity: 0, translateY: 40 };
    }
    if (offset <= peak) {
      const t = (offset - start) / (peak - start);
      return { opacity: t, translateY: 40 * (1 - t) };
    }
    if (offset <= end) {
      const t = (offset - peak) / (end - peak);
      return { opacity: 1 - t, translateY: -30 * t };
    }
    return { opacity: 0, translateY: -30 };
  }, [offset, start, peak, end]);

  const visible = opacity > 0.01;

  return (
    <div
      className={styles.root}
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        visibility: visible ? 'visible' : 'hidden',
      }}
    >
      {children}
    </div>
  );
}
