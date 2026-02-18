import { useState, useEffect, useCallback, useRef } from 'react';
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
import WorksSection from './sections/WorksSection';
import ContactSection from './sections/ContactSection';
import MenuScroller from './ui/MenuScroller';

const sectionComponents = [
  null, // 0 = Hero (not in modal)
  <AboutSection key="about" />,
  <SkillsSection key="skills" />,
  <ExperienceSection key="experience" />,
  <WorksSection key="works" />,
  <ContactSection key="contact" />,
];

const heroStyle: React.CSSProperties = {
  position: 'fixed',
  left: 0,
  top: 0,
  bottom: 0,
  width: '60vw',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '0 6vw',
  zIndex: 10,
  pointerEvents: 'none',
  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
  transition: 'opacity 0.4s ease',
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 30,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2rem',
  transition: 'opacity 0.4s ease',
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(10, 10, 10, 0.8)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(42, 42, 42, 0.6)',
  borderRadius: '8px',
  padding: '2.5rem',
  width: 'min(560px, 85vw)',
  maxHeight: 'calc(100vh - 6rem)',
  overflowY: 'auto',
  position: 'relative',
  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
  transition: 'transform 0.4s ease',
};

const closeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  color: 'var(--text-secondary)',
  fontSize: '1rem',
  width: '2rem',
  height: '2rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-mono)',
  transition: 'color 0.2s, border-color 0.2s',
};

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
      if (e.key === 'Escape') setActiveSection(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* 3D Canvas */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
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
      <div style={{ ...heroStyle, opacity: activeSection === null ? 1 : 0.15 }}>
        <HeroSection onTypingDone={handleTypingDone} />
      </div>

      {/* 右側の無限スクロールメニュー */}
      {introDone && activeSection === null && (
        <MenuScroller
          onHover={handleHover}
          onSelect={handleSelect}
          activeSection={activeSection}
        />
      )}

      {/* Modal overlay */}
      {sectionComponents.map((component, i) => {
        if (i === 0 || !component) return null;
        const isActive = activeSection === i;
        return (
          <div
            key={i}
            style={{
              ...overlayStyle,
              opacity: isActive ? 1 : 0,
              pointerEvents: isActive ? 'auto' : 'none',
            }}
            onClick={handleClose}
          >
            <div
              style={{
                ...cardStyle,
                transform: isActive ? 'translateY(0)' : 'translateY(20px)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                style={closeButtonStyle}
                onClick={handleClose}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--accent)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
                aria-label="Close"
              >
                ×
              </button>
              {component}
            </div>
          </div>
        );
      })}
    </>
  );
}
