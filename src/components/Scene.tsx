import { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { LocaleProvider } from '../contexts/LocaleContext';
import CameraRig from './CameraRig';
import ParticleField from './ParticleField';
import GridFloor from './GridFloor';
import SectionPanels from './SectionPanels';
import HeroSection from './sections/HeroSection';
import AboutSection from './sections/AboutSection';
import SkillsSection from './sections/SkillsSection';
import ExperienceSection from './sections/ExperienceSection';
import ContactSection from './sections/ContactSection';
import MenuScroller from './ui/MenuScroller';
import LangToggle from './ui/LangToggle';
import styles from './Scene.module.css';

const CLOSE_ANIM_MS = 400;

const sectionEntries = [
  null, // 0 = Hero
  { Component: AboutSection, label: 'section-about-title' },
  { Component: SkillsSection, label: 'section-skills-title' },
  { Component: ExperienceSection, label: 'section-experience-title' },
  { Component: ContactSection, label: 'section-contact-title' },
];

export default function Scene() {
  const [introDone, setIntroDone] = useState(false);
  const [hoveredSection, setHoveredSection] = useState(1);
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const modalTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const sceneSection = activeSection ?? hoveredSection;

  // モーダル・カメラ状態のクリーンアップ（activeSection は触らない）
  const clearModalState = useCallback(() => {
    setCameraReady(false);
    setModalVisible(false);
    setModalClosing(false);
    clearTimeout(modalTimerRef.current);
    clearTimeout(closeTimerRef.current);
  }, []);

  // モーダル・カメラ状態を一括リセット
  const resetModal = useCallback(() => {
    setActiveSection(null);
    clearModalState();
  }, [clearModalState]);

  const handleHover = useCallback((index: number) => {
    setHoveredSection(index);
  }, []);

  const handleSelect = useCallback((index: number) => {
    setActiveSection((prev) => (prev === index ? null : index));
    clearModalState();
  }, [clearModalState]);

  const handleTypingDone = useCallback(() => {
    setIntroDone(true);
  }, []);

  const handleClose = useCallback(() => {
    if (!modalVisible || modalClosing) {
      resetModal();
      return;
    }
    // 閉じアニメーション開始
    setModalClosing(true);
    closeTimerRef.current = setTimeout(resetModal, CLOSE_ANIM_MS);
  }, [modalVisible, modalClosing, resetModal]);

  const handleCameraReady = useCallback(() => {
    setCameraReady(true);
  }, []);

  // cameraReady → 200ms 後にモーダル表示（グリッド消灯の猶予）
  useEffect(() => {
    if (cameraReady && activeSection !== null) {
      modalTimerRef.current = setTimeout(() => setModalVisible(true), 200);
    }
    return () => clearTimeout(modalTimerRef.current);
  }, [cameraReady, activeSection]);

  // Escape キーで閉じる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'h') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  const entry = activeSection !== null ? sectionEntries[activeSection] : null;

  return (
    <LocaleProvider>
      <LangToggle />
      {/* 3D Canvas */}
      <div className={styles.canvasWrapper} role="img" aria-label="4次元多胞体のインタラクティブパーティクルアニメーション">
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
          camera={{ fov: 60, near: 0.1, far: 200 }}
          onPointerMissed={handleClose}
        >
          <PerformanceMonitor>
            <CameraRig activeSection={sceneSection} sectionActive={activeSection !== null} onTransitionComplete={handleCameraReady} />
            {introDone && <ParticleField activeSection={sceneSection} />}
            <GridFloor sectionActive={activeSection !== null} />
            <SectionPanels activeSection={activeSection} cameraReady={cameraReady} />
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

      {/* 右側の無限スクロールメニュー */}
      {introDone && (
        <div className={activeSection === null ? styles.menu : styles.menuHidden}>
          <MenuScroller
            onHover={handleHover}
            onSelect={handleSelect}
            activeSection={activeSection}
          />
        </div>
      )}

      {/* セクションモーダル */}
      {modalVisible && entry && (
        <div className={styles.overlay} onClick={handleClose}>
          <div
            className={`${styles.card} ${modalClosing ? styles.cardClosing : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={entry.label}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeButton}
              onClick={handleClose}
              aria-label="閉じる"
            >
              ×
            </button>
            <entry.Component />
          </div>
        </div>
      )}
    </LocaleProvider>
  );
}
