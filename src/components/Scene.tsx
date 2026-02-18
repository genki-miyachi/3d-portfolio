import { useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, PerformanceMonitor } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import CameraRig from './CameraRig';
import ParticleField from './ParticleField';
import HeroSection from './sections/HeroSection';
import AboutSection from './sections/AboutSection';
import SkillsSection from './sections/SkillsSection';
import ExperienceSection from './sections/ExperienceSection';
import WorksSection from './sections/WorksSection';
import ContactSection from './sections/ContactSection';
import Navigation from './ui/Navigation';

// [fadeInStart, fullyVisible, fadeOutEnd]
const sectionRanges: [number, number, number][] = [
  [-0.01, 0, 0.12],
  [0.1, 0.18, 0.3],
  [0.28, 0.38, 0.5],
  [0.48, 0.58, 0.7],
  [0.68, 0.78, 0.88],
  [0.85, 0.95, 1.01],
];

function calcFade(
  offset: number,
  [start, peak, end]: [number, number, number],
) {
  if (offset <= start) return { opacity: 0, translateY: 40 };
  if (offset <= peak) {
    const t = (offset - start) / (peak - start);
    return { opacity: t, translateY: 40 * (1 - t) };
  }
  if (offset <= end) {
    const t = (offset - peak) / (end - peak);
    return { opacity: 1 - t, translateY: -30 * t };
  }
  return { opacity: 0, translateY: -30 };
}

function SceneContent({
  onScrollOffset,
}: {
  onScrollOffset: (offset: number) => void;
}) {
  return (
    <>
      <PerformanceMonitor>
        <ScrollControls pages={6} damping={0.3}>
          <CameraRig onScrollOffset={onScrollOffset} />
          <ParticleField />
        </ScrollControls>
      </PerformanceMonitor>

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={0.8}
        />
      </EffectComposer>

      <ambientLight intensity={0.5} />
      <color attach="background" args={['#0a0a0a']} />
    </>
  );
}

const baseSectionStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '0 8vw',
  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
  zIndex: 10,
  pointerEvents: 'none',
  willChange: 'opacity, transform',
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(10, 10, 10, 0.65)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(42, 42, 42, 0.6)',
  borderRadius: '8px',
  padding: '2.5rem',
  pointerEvents: 'auto',
  width: 'min(520px, 80vw)',
};

// Hero: 中央、それ以降: 左右交互
const sectionAligns: ('center' | 'flex-start' | 'flex-end')[] = [
  'center',     // Hero
  'flex-start',  // About — 左
  'flex-end',    // Skills — 右
  'flex-start',  // Experience — 左
  'flex-end',    // Works — 右
  'flex-start',  // Contact — 左
];

export default function Scene() {
  const sectionEls = useRef<(HTMLDivElement | null)[]>([]);
  const navDotsRef = useRef<(HTMLElement | null)[]>([]);
  const offsetRef = useRef(0);

  // rAF loop — DOM 直接操作、setState しない
  useEffect(() => {
    let rafId: number;
    let prevActive = -1;

    const update = () => {
      const offset = offsetRef.current;

      // セクション fade
      for (let i = 0; i < sectionRanges.length; i++) {
        const el = sectionEls.current[i];
        if (!el) continue;
        const { opacity, translateY } = calcFade(offset, sectionRanges[i]);
        const visible = opacity > 0.01;
        el.style.opacity = String(opacity);
        el.style.transform = `translateY(${translateY}px)`;
        el.style.visibility = visible ? 'visible' : 'hidden';
      }

      // Navigation active dot
      let best = 0;
      let bestOp = 0;
      for (let i = 0; i < sectionRanges.length; i++) {
        const { opacity } = calcFade(offset, sectionRanges[i]);
        if (opacity > bestOp) {
          bestOp = opacity;
          best = i;
        }
      }
      if (best !== prevActive) {
        navDotsRef.current[prevActive]?.removeAttribute('data-active');
        navDotsRef.current[best]?.setAttribute('data-active', '');
        prevActive = best;
      }

      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleScrollOffset = useCallback((offset: number) => {
    offsetRef.current = offset;
  }, []);

  const setSectionRef = (i: number) => (el: HTMLDivElement | null) => {
    sectionEls.current[i] = el;
  };

  const sections = [
    <HeroSection key="hero" />,
    <AboutSection key="about" />,
    <SkillsSection key="skills" />,
    <ExperienceSection key="experience" />,
    <WorksSection key="works" />,
    <ContactSection key="contact" />,
  ];

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
          camera={{ fov: 60, near: 0.1, far: 200 }}
        >
          <SceneContent onScrollOffset={handleScrollOffset} />
        </Canvas>
      </div>

      {sections.map((section, i) => (
        <div
          key={i}
          ref={setSectionRef(i)}
          style={{ ...baseSectionStyle, alignItems: sectionAligns[i] }}
        >
          {i === 0 ? (
            section
          ) : (
            <div style={cardStyle}>{section}</div>
          )}
        </div>
      ))}

      <Navigation navDotsRef={navDotsRef} />
    </>
  );
}
