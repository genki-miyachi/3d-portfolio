import { useMemo } from 'react';
import * as THREE from 'three';

interface RingConfig {
  radius: number;
  rotation: [number, number, number];
  opacity: number;
}

const rings: RingConfig[] = [
  { radius: 30, rotation: [0.3, 0, 0], opacity: 0.08 },
  { radius: 45, rotation: [0.8, 0.4, 0], opacity: 0.05 },
  { radius: 55, rotation: [-0.2, 0.9, 0.3], opacity: 0.04 },
  { radius: 70, rotation: [1.2, 0.2, 0.6], opacity: 0.03 },
];

function Ring({ radius, rotation, opacity }: RingConfig) {
  const line = useMemo(() => {
    const segments = 128;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius,
        ),
      );
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: '#00ff41', // --accent
      transparent: true,
      opacity,
      depthWrite: false,
    });
    return new THREE.Line(geometry, material);
  }, [radius, opacity]);

  return <primitive object={line} rotation={rotation} />;
}

export default function BackgroundDust() {
  return (
    <group>
      {rings.map((ring, i) => (
        <Ring key={i} {...ring} />
      ))}
    </group>
  );
}
