import { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import CameraRig from './CameraRig';
import ParticleField from './ParticleField';
import GridFloor from './GridFloor';
import HeroSection from './sections/HeroSection';
import AboutSection from './sections/AboutSection';
import SkillsSection from './sections/SkillsSection';
import ExperienceSection from './sections/ExperienceSection';
import ContactSection from './sections/ContactSection';
import MenuScroller from './ui/MenuScroller';
import styles from './Scene.module.css';

const sectionComponents = [
  null, // 0 = Hero (not in modal)
  { component: <AboutSection key="about" />, labelledBy: 'section-about-title' },
  { component: <SkillsSection key="skills" />, labelledBy: 'section-skills-title' },
  { component: <ExperienceSection key="experience" />, labelledBy: 'section-experience-title' },
  { component: <ContactSection key="contact" />, labelledBy: 'section-contact-title' },
];

export default function Scene() {
  // hoveredSection: メニュースクローラーの中央アイテム（3Dシーン連動）
  // activeSection: モーダルで開いているセクション
  const [introDone, setIntroDone] = useState(false);
  const [hoveredSection, setHoveredSection] = useState(1);
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const sceneSection = activeSection ?? hoveredSection;

  const handleHover = useCallback((index: number) => {
    setHoveredSection(index);
  }, []);

  const handleSelect = useCallback((index: number) => {
    setActiveSection((prev) => (prev === index ? null : index));
  }, []);

  const handleTypingDone = useCallback(() => {
    setIntroDone(true);
  }, []);

  const handleClose = useCallback(() => {
    setActiveSection(null);
  }, []);

  // Escape キーで閉じる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'h') setActiveSection(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* 3D Canvas */}
      <div className={styles.canvasWrapper} role="img" aria-label="4次元多胞体のインタラクティブパーティクルアニメーション">
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
          camera={{ fov: 60, near: 0.1, far: 200 }}
        >
          <PerformanceMonitor>
            <CameraRig activeSection={sceneSection} />
            {introDone && <ParticleField activeSection={sceneSection} />}
            <GridFloor />
          </PerformanceMonitor>

          <EffectComposer>
            <Bloom
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              intensity={0.8}
            />
          </EffectComposer>

          <fogExp2 attach="fog" args={['#0a0a0a', 0.018]} />
          <ambientLight intensity={0.5} />
          <color attach="background" args={['#0a0a0a']} />
        </Canvas>
      </div>

      {/* Hero — 左側に常時表示 */}
      <div
        className={styles.hero}
        style={{ opacity: activeSection === null ? 1 : 0.15 }}
      >
        <HeroSection onTypingDone={handleTypingDone} />
      </div>

      {/* 右側の無限スクロールメニュー（アンマウントせず隠してスクロール位置を保持） */}
      {introDone && (
        <div
          style={{
            visibility: activeSection === null ? 'visible' : 'hidden',
            pointerEvents: activeSection === null ? 'auto' : 'none',
          }}
        >
          <MenuScroller
            onHover={handleHover}
            onSelect={handleSelect}
            activeSection={activeSection}
          />
        </div>
      )}

      {/* Modal overlay */}
      {sectionComponents.map((entry, i) => {
        if (!entry) return null;
        const isActive = activeSection === i;
        return (
          <div
            key={i}
            className={styles.overlay}
            style={{
              opacity: isActive ? 1 : 0,
              pointerEvents: isActive ? 'auto' : 'none',
            }}
            aria-hidden={!isActive}
            onClick={handleClose}
          >
            <div
              className={styles.card}
              style={{
                transform: isActive ? 'translateY(0)' : 'translateY(20px)',
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={entry.labelledBy}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.closeButton}
                onClick={handleClose}
                aria-label="閉じる"
              >
                ×
              </button>
              {entry.component}
            </div>
          </div>
        );
      })}
    </>
  );
}
