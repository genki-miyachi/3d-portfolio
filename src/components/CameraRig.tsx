import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const cameraPositions: [number, number, number][] = [
  [0, 2, 24],    // Hero: 正面やや上
  [10, 0, 21],   // About: 右にドリフト
  [16, -2, 16],  // Skills: さらに右、近づく
  [12, 3, 12],   // Experience: 少し上、近い
  [4, -1, 18],   // Works: 正面方向に戻りつつ引く
  [0, 0, 15],    // Contact: 正面、近め
];

interface CameraRigProps {
  activeSection: number;
}

export default function CameraRig({ activeSection }: CameraRigProps) {
  const { camera } = useThree();
  const lookAtTarget = useRef(new THREE.Vector3());
  const targetPos = useRef(new THREE.Vector3());

  useFrame((_state, delta) => {
    const pos = cameraPositions[activeSection] ?? cameraPositions[0];
    targetPos.current.set(...pos);

    const lerpFactor = 1 - Math.exp(-3 * delta);

    camera.position.lerp(targetPos.current, lerpFactor);
    lookAtTarget.current.lerp(new THREE.Vector3(0, 0, 0), lerpFactor);
    camera.lookAt(lookAtTarget.current);
  });

  return null;
}
