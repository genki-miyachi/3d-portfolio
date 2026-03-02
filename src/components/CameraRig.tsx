import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const cameraPositions: [number, number, number][] = [
  [0, 4, 30], // Hero: 正面、引き気味で全体俯瞰
  [18, -3, 22], // About: 大きく右、少し下
  [-12, 8, 14], // Skills: 左上から接近
  [20, 6, 10], // Experience: 右上、かなり近い
  [0, -2, 12], // Contact: 正面、最も近い
];

// セクション表示時: パーティクル(原点)を中心に 90° ずつ4方向に配置
const DIST = 80;  // 原点からの距離
const CAM_H = 30; // カメラ高さ（大きめパネルが収まるように）
const sectionCamPositions: [number, number, number][] = [
  [0, 20, -40],           // 0: Hero (未使用)
  [0, CAM_H, DIST],       // 1: About — 前方 (0°)
  [DIST, CAM_H, 0],       // 2: Skills — 右 (90°)
  [0, CAM_H, -DIST],      // 3: Experience — 後方 (180°)
  [-DIST, CAM_H, 0],      // 4: Contact — 左 (270°)
];
const LOOK_DIST = 70; // lookAt の原点からの距離
export const sectionLookOffsets: [number, number, number][] = [
  [0, -12, 0],                // 0: Hero
  [0, -12, LOOK_DIST],        // 1: About — 前方
  [LOOK_DIST, -12, 0],        // 2: Skills — 右
  [0, -12, -LOOK_DIST],       // 3: Experience — 後方
  [-LOOK_DIST, -12, 0],       // 4: Contact — 左
];

const Y_AXIS = new THREE.Vector3(0, 1, 0);

interface CameraRigProps {
  activeSection: number;
  sectionActive: boolean;
  onTransitionComplete?: () => void;
}

/** ease-in-out quadratic: ゆっくり→加速→ゆっくり */
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

const TRANSITION_DURATION = 1.8; // 秒

export default function CameraRig({ activeSection, sectionActive, onTransitionComplete }: CameraRigProps) {
  const { camera, size } = useThree();
  const lookAtTarget = useRef(new THREE.Vector3());
  const orbitAngle = useRef(0);
  const smoothPointer = useRef(new THREE.Vector2());
  // useFrame 内のオブジェクト生成を避けるためキャッシュ
  const _sectionPos = useRef(new THREE.Vector3());
  const _sectionLookAt = useRef(new THREE.Vector3());
  const _normalPos = useRef(new THREE.Vector3());
  const _normalLookAt = useRef(new THREE.Vector3());

  // トランジション用 state
  const transitionProgress = useRef(0); // 0=通常, 1=セクション表示
  const prevSectionActive = useRef(false);
  const prevActiveSection = useRef(activeSection);
  const fromPos = useRef(new THREE.Vector3());
  const fromLookAt = useRef(new THREE.Vector3());
  const firedComplete = useRef(false);

  useFrame((state, delta) => {
    const { pointer } = state;
    smoothPointer.current.lerp(pointer, 1 - Math.exp(-2.5 * delta));

    const px = smoothPointer.current.x;
    const py = smoothPointer.current.y;

    // トランジション開始検出: 切り替わった瞬間 or セクション変更時に現在位置を記録
    const sectionChanged = sectionActive && activeSection !== prevActiveSection.current;
    if (sectionActive !== prevSectionActive.current || sectionChanged) {
      prevSectionActive.current = sectionActive;
      prevActiveSection.current = activeSection;
      fromPos.current.copy(camera.position);
      fromLookAt.current.copy(lookAtTarget.current);
      transitionProgress.current = 0;
      firedComplete.current = false;
    }

    // progress を 0→1 に進める
    if (transitionProgress.current < 1) {
      transitionProgress.current = Math.min(
        1,
        transitionProgress.current + delta / TRANSITION_DURATION,
      );
    }

    // カメラ到着通知
    if (transitionProgress.current >= 1 && sectionActive && !firedComplete.current) {
      firedComplete.current = true;
      onTransitionComplete?.();
    }

    const easedT = easeInOutQuad(transitionProgress.current);

    // セクション表示の目標（セクション毎に異なる位置）
    const sCamPos = sectionCamPositions[activeSection] ?? sectionCamPositions[0];
    const sLookAt = sectionLookOffsets[activeSection] ?? sectionLookOffsets[0];

    const sectionPos = _sectionPos.current.set(...sCamPos);
    sectionPos.x += px * 1.5;
    sectionPos.y += py * 0.8;

    const sectionLookAt = _sectionLookAt.current.set(...sLookAt);
    sectionLookAt.x += px * -1;
    sectionLookAt.y += py * -0.5;

    // 通常カメラの目標
    if (!sectionActive) {
      orbitAngle.current += delta * 0.06;
    }
    const pos = cameraPositions[activeSection] ?? cameraPositions[0];
    const mobileScale = THREE.MathUtils.lerp(
      1.8,
      1,
      THREE.MathUtils.clamp(size.width / 768, 0, 1),
    );
    const normalPos = _normalPos.current.set(...pos).multiplyScalar(mobileScale);
    normalPos.applyAxisAngle(Y_AXIS, orbitAngle.current);
    normalPos.x += px * 8;
    normalPos.y += py * 5;

    const normalLookAt = _normalLookAt.current.set(px * -3, py * -2, 0);

    if (transitionProgress.current < 1) {
      // トランジション中: from → to を easeInOutQuad で補間
      const toPos = sectionActive ? sectionPos : normalPos;
      const toLookAt = sectionActive ? sectionLookAt : normalLookAt;

      camera.position.lerpVectors(fromPos.current, toPos, easedT);
      lookAtTarget.current.lerpVectors(fromLookAt.current, toLookAt, easedT);
    } else if (sectionActive) {
      // セクション表示中（トランジション完了後）
      camera.position.lerp(sectionPos, 1 - Math.exp(-4 * delta));
      lookAtTarget.current.lerp(sectionLookAt, 1 - Math.exp(-4 * delta));
    } else {
      // 通常（トランジション完了後）
      const lerpFactor = 1 - Math.exp(-3 * delta);
      camera.position.lerp(normalPos, lerpFactor);
      lookAtTarget.current.lerp(normalLookAt, lerpFactor);
    }

    camera.lookAt(lookAtTarget.current);
  });

  return null;
}
