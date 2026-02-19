import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const GRID_SIZE = 400;
const GRID_DIVISIONS = 80;
const GRID_STEP = GRID_SIZE / GRID_DIVISIONS;

export default function GridFloor() {
  const ref = useRef<THREE.LineSegments>(null);
  const { camera } = useThree();

  const grid = useMemo(() => {
    const step = GRID_STEP;
    const half = GRID_SIZE / 2;
    const points: number[] = [];

    for (let i = 0; i <= GRID_DIVISIONS; i++) {
      const z = -half + i * step;
      points.push(-half, 0, z, half, 0, z);
    }
    for (let i = 0; i <= GRID_DIVISIONS; i++) {
      const x = -half + i * step;
      points.push(x, 0, -half, x, 0, half);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(points, 3),
    );
    const material = new THREE.LineBasicMaterial({
      color: '#00ff41', // --accent
      transparent: true,
      opacity: 0.06,
      depthWrite: false,
      fog: true,
    });
    return { geometry, material };
  }, []);

  // グリッドをカメラのXZ位置にスナップ（グリッド間隔単位）して端を見せない
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.x =
      Math.round(camera.position.x / GRID_STEP) * GRID_STEP;
    ref.current.position.z =
      Math.round(camera.position.z / GRID_STEP) * GRID_STEP;
  });

  return (
    <lineSegments
      ref={ref}
      geometry={grid.geometry}
      material={grid.material}
      position={[0, -12, 0]}
    />
  );
}
