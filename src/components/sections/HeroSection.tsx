import { useState, useEffect } from "react";
import { hero } from "../../data/portfolio";
import styles from "./HeroSection.module.css";

const TYPE_SPEED = 70; // ms per char
const SUBTITLE_DELAY = 300; // ms after name finishes

interface HeroSectionProps {
  onTypingDone?: () => void;
}

export default function HeroSection({ onTypingDone }: HeroSectionProps) {
  const [nameLen, setNameLen] = useState(0);
  const [subLen, setSubLen] = useState(0);
  const [phase, setPhase] = useState<"name" | "pause" | "sub" | "done">(
    "name",
  );

  useEffect(() => {
    if (phase === "name") {
      if (nameLen < hero.name.length) {
        const id = setTimeout(() => setNameLen((n) => n + 1), TYPE_SPEED);
        return () => clearTimeout(id);
      }
      setPhase("pause");
    } else if (phase === "pause") {
      const id = setTimeout(() => setPhase("sub"), SUBTITLE_DELAY);
      return () => clearTimeout(id);
    } else if (phase === "sub") {
      if (subLen < hero.subtitle.length) {
        const id = setTimeout(() => setSubLen((n) => n + 1), TYPE_SPEED);
        return () => clearTimeout(id);
      }
      setPhase("done");
      onTypingDone?.();
    }
  }, [phase, nameLen, subLen]);

  const showCursorOnName = phase === "name";
  const showCursorOnSub = phase === "sub" || phase === "pause";

  return (
    <section className={styles.section}>
      <h1 className={styles.name}>
        {hero.name.slice(0, nameLen)}
        {showCursorOnName && <span className={styles.cursor}>|</span>}
      </h1>
      <p className={styles.subtitle}>
        {phase !== "name" && (
          <>
            <span className={styles.accent}>
              {hero.subtitle.slice(0, 1)}
            </span>
            {hero.subtitle.slice(1, subLen)}
            {showCursorOnSub && <span className={styles.cursor}>|</span>}
          </>
        )}
      </p>
      {phase === "done" && (
        <div className={styles.scrollHint}>scroll</div>
      )}
    </section>
  );
}
