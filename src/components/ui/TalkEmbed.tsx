import { useState } from 'react';
import type { Talk } from '../../data/portfolio';
import { useLocale } from '../../contexts/LocaleContext';
import styles from './TalkEmbed.module.css';

interface Props {
  talk: Talk;
}

export default function TalkEmbed({ talk }: Props) {
  const { locale } = useLocale();
  const [playing, setPlaying] = useState(false);
  // maxres は動画によっては存在しないため hqdefault にフォールバックする
  const [thumbSrc, setThumbSrc] = useState(
    `https://i.ytimg.com/vi/${talk.videoId}/maxresdefault.jpg`,
  );

  const playLabel =
    locale === 'ja' ? `${talk.title} を再生` : `Play: ${talk.title}`;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.badge}>TALK</span>
        <span className={styles.event}>{talk.event}</span>
        <span className={styles.date}>{talk.date}</span>
      </div>

      <p className={styles.title}>{talk.title}</p>

      <div className={styles.frame}>
        {playing ? (
          <iframe
            className={styles.iframe}
            src={`https://www.youtube-nocookie.com/embed/${talk.videoId}?autoplay=1&rel=0`}
            title={talk.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className={styles.poster}
            onClick={() => setPlaying(true)}
            aria-label={playLabel}
          >
            <img
              className={styles.thumb}
              src={thumbSrc}
              alt=""
              loading="lazy"
              draggable={false}
              onError={() =>
                setThumbSrc(
                  `https://i.ytimg.com/vi/${talk.videoId}/hqdefault.jpg`,
                )
              }
            />
            <span className={styles.scanlines} aria-hidden="true" />
            <span className={styles.play} aria-hidden="true" />
          </button>
        )}
      </div>

      <a
        className={styles.link}
        href={talk.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        youtube.com/watch?v={talk.videoId} ↗
      </a>
    </div>
  );
}
