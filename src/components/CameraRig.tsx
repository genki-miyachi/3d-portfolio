import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';

// 各セクションの peak offset（Scene.tsx の sectionRanges[i][1] と一致させる）
const sectionPeakOffsets = [0, 0.18, 0.38, 0.58, 0.78, 0.95];

interface Keyframe {
  offset: number;
  position: [number, number, number];
  lookAt: [number, number, number];
}

// カメラがパーティクル球体の周りをオービット
// lookAt は全て原点 → 常にパーティクルを見る
// ゆるく右回りにオービット → 最後に正面に戻る
const keyframes: Keyframe[] = [
  { offset: 0.0, position: [0, 2, 24], lookAt: [0, 0, 0] },    // Hero: 正面やや上
  { offset: 0.18, position: [10, 0, 21], lookAt: [0, 0, 0] },   // About: 右にドリフト
  { offset: 0.38, position: [16, -2, 16], lookAt: [0, 0, 0] },  // Skills: さらに右、近づく
  { offset: 0.58, position: [12, 3, 12], lookAt: [0, 0, 0] },   // Experience: 少し上、近い
  { offset: 0.78, position: [4, -1, 18], lookAt: [0, 0, 0] },   // Works: 正面方向に戻りつつ引く
  { offset: 0.95, position: [0, 0, 15], lookAt: [0, 0, 0] },    // Contact: 正面、近め
];

function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

function getInterpolated(
  offset: number,
): { position: THREE.Vector3; lookAt: THREE.Vector3 } {
  const t = Math.max(0, Math.min(1, offset));

  let lower = keyframes[0];
  let upper = keyframes[keyframes.length - 1];

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (t >= keyframes[i].offset && t <= keyframes[i + 1].offset) {
      lower = keyframes[i];
      upper = keyframes[i + 1];
      break;
    }
  }

  const progress = smoothstep(lower.offset, upper.offset, t);

  const position = new THREE.Vector3().lerpVectors(
    new THREE.Vector3(...lower.position),
    new THREE.Vector3(...upper.position),
    progress,
  );

  const lookAt = new THREE.Vector3().lerpVectors(
    new THREE.Vector3(...lower.lookAt),
    new THREE.Vector3(...upper.lookAt),
    progress,
  );

  return { position, lookAt };
}

interface CameraRigProps {
  onScrollOffset?: (offset: number) => void;
}

export default function CameraRig({ onScrollOffset }: CameraRigProps) {
  const scroll = useScroll();
  const { camera } = useThree();
  const lookAtTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const { index } = (e as CustomEvent<{ index: number }>).detail;
      const targetOffset = sectionPeakOffsets[index] ?? 0;
      const el = scroll.el;
      el.scrollTop = targetOffset * (el.scrollHeight - el.clientHeight);
    };

    window.addEventListener('navigate-to-section', handleNavigate);
    return () =>
      window.removeEventListener('navigate-to-section', handleNavigate);
  }, [scroll]);

  useFrame((_state, delta) => {
    const { position, lookAt } = getInterpolated(scroll.offset);

    const lerpFactor = 1 - Math.exp(-3 * delta);

    camera.position.lerp(position, lerpFactor);
    lookAtTarget.current.lerp(lookAt, lerpFactor);
    camera.lookAt(lookAtTarget.current);

    onScrollOffset?.(scroll.offset);
  });

  return null;
}
