import { useRef, useEffect, useCallback } from 'react';
import styles from './MenuScroller.module.css';

const items = ['About', 'Skills', 'Experience', 'Contact'];
const ITEM_COUNT = items.length;
const tripled = [...items, ...items, ...items];
const FRICTION = 0.93;
const SNAP_THRESHOLD = 0.4;
const SNAP_LERP = 0.12;

interface MenuScrollerProps {
  onHover: (sectionIndex: number) => void;
  onSelect: (sectionIndex: number) => void;
  activeSection: number | null;
}

export default function MenuScroller({
  onHover,
  onSelect,
  activeSection,
}: MenuScrollerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemEls = useRef<(HTMLButtonElement | null)[]>([]);
  const prevCenter = useRef(-1);
  const scrollToRef = useRef<number | null>(null);
  const centerIndexRef = useRef(-1);
  const activeSectionRef = useRef(activeSection);
  activeSectionRef.current = activeSection;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // ネイティブスクロール無効、自前で制御
    el.style.overflow = 'hidden';

    const singleHeight = el.scrollHeight / 3;
    const itemHeight = singleHeight / ITEM_COUNT;
    // 中央コピーの About（先頭アイテム）を画面中央に配置
    let pos = singleHeight + itemHeight / 2 - el.clientHeight / 2;
    let vel = 0;
    let touching = false;
    let lastTouchY = 0;

    // --- イベントハンドラ ---
    const onWheel = (e: WheelEvent) => {
      vel += e.deltaY * 0.4;
    };

    const onTouchStart = (e: TouchEvent) => {
      touching = true;
      lastTouchY = e.touches[0].clientY;
      vel = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const delta = lastTouchY - y;
      lastTouchY = y;
      pos += delta;
      vel = delta;
    };

    const onTouchEnd = () => {
      touching = false;
    };

    // snap target: 最寄りアイテムを中央に配置する scrollTop
    const findSnapTarget = (): number => {
      const containerCenter = pos + el.clientHeight / 2;
      let closestCenter = 0;
      let closestDist = Infinity;

      for (let i = 0; i < tripled.length; i++) {
        const item = itemEls.current[i];
        if (!item) continue;
        const itemCenter = item.offsetTop + item.offsetHeight / 2;
        const dist = Math.abs(containerCenter - itemCenter);
        if (dist < closestDist) {
          closestDist = dist;
          closestCenter = itemCenter;
        }
      }

      return closestCenter - el.clientHeight / 2;
    };

    // --- rAF ループ ---
    let rafId: number;

    const update = () => {
      // クリックによるスクロール先指定
      if (scrollToRef.current !== null) {
        const targetItem = itemEls.current[scrollToRef.current];
        if (targetItem) {
          const targetCenter =
            targetItem.offsetTop + targetItem.offsetHeight / 2;
          const containerCenter = pos + el.clientHeight / 2;
          vel = (targetCenter - containerCenter) * (1 - FRICTION);
        }
        scrollToRef.current = null;
      }

      // 物理演算（タッチ中は finger-follow なので不要）
      if (!touching) {
        pos += vel;
        vel *= FRICTION;

        // 速度が十分落ちたらスナップ
        if (Math.abs(vel) < SNAP_THRESHOLD) {
          vel = 0;
          const target = findSnapTarget();
          const diff = target - pos;
          if (Math.abs(diff) > 0.5) {
            pos += diff * SNAP_LERP;
          } else {
            pos = target;
          }
        }
      }

      // 無限ループ
      const sH = el.scrollHeight / 3;
      if (pos < sH * 0.3) {
        pos += sH;
      } else if (pos > sH * 1.7) {
        pos -= sH;
      }

      el.scrollTop = pos;

      // 各アイテムのスタイル更新
      const containerCenter = pos + el.clientHeight / 2;
      let closestIdx = 0;
      let closestDist = Infinity;

      for (let i = 0; i < tripled.length; i++) {
        const item = itemEls.current[i];
        if (!item) continue;
        const itemCenter = item.offsetTop + item.offsetHeight / 2;
        const dist = Math.abs(containerCenter - itemCenter);
        const maxDist = el.clientHeight / 2;
        const t = Math.max(0, 1 - dist / maxDist);

        item.style.opacity = String(0.08 + t * 0.92);
        item.style.transform = `scale(${0.35 + t * 0.65})`;
        item.style.filter = t > 0.85 ? 'none' : `blur(${(1 - t) * 3}px)`;
        item.style.color = t > 0.8 ? 'var(--accent)' : 'var(--text-primary)';
        item.style.pointerEvents = 'auto';

        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      }

      centerIndexRef.current = closestIdx;

      // 3Dシーン連動
      const sectionIndex = (closestIdx % ITEM_COUNT) + 1;
      if (sectionIndex !== prevCenter.current) {
        prevCenter.current = sectionIndex;
        onHover(sectionIndex);
      }

      // active 表示
      for (let i = 0; i < tripled.length; i++) {
        const item = itemEls.current[i];
        if (!item) continue;
        const idx = (i % ITEM_COUNT) + 1;
        if (idx === activeSectionRef.current) {
          item.classList.add(styles.active);
        } else {
          item.classList.remove(styles.active);
        }
      }

      rafId = requestAnimationFrame(update);
    };

    // 矢印キー / vim キーで1アイテムずつ移動
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowRight' ||
        e.key === 'j'
      ) {
        e.preventDefault();
        scrollToRef.current = centerIndexRef.current + 1;
      } else if (
        e.key === 'ArrowUp' ||
        e.key === 'ArrowLeft' ||
        e.key === 'k'
      ) {
        e.preventDefault();
        scrollToRef.current = centerIndexRef.current - 1;
      } else if (e.key === 'Enter' || e.key === 'l') {
        const idx = centerIndexRef.current;
        if (idx >= 0) {
          const sectionIndex = (idx % ITEM_COUNT) + 1;
          onSelect(sectionIndex);
        }
      }
    };

    // --- リスナー登録 ---
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('keydown', onKeyDown);

    rafId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onHover, onSelect]);

  const handleClick = useCallback(
    (i: number) => {
      if (i === centerIndexRef.current) {
        const sectionIndex = (i % ITEM_COUNT) + 1;
        onSelect(sectionIndex);
      } else {
        scrollToRef.current = i;
      }
    },
    [onSelect],
  );

  return (
    <div ref={containerRef} className={styles.root} role="navigation" aria-label="セクションメニュー">
      {tripled.map((label, i) => (
        <button
          key={i}
          ref={(el) => {
            itemEls.current[i] = el;
          }}
          className={styles.item}
          onClick={() => handleClick(i)}
        >
          <span className={styles.number}>
            {String((i % ITEM_COUNT) + 1).padStart(2, '0')}
          </span>
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </div>
  );
}
