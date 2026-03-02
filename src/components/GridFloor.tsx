import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const GRID_SIZE = 400;
const GRID_DIVISIONS = 80;
const GRID_STEP = GRID_SIZE / GRID_DIVISIONS;

const OPACITY_IDLE = 0.06;
const OPACITY_ACTIVE = 0.18;

interface GridFloorProps {
  sectionActive?: boolean;
}

export default function GridFloor({ sectionActive = false }: GridFloorProps) {
  const ref = useRef<THREE.LineSegments>(null);
  const { camera } = useThree();

  const grid = useMemo(() => {
    const half = GRID_SIZE / 2;
    const points: number[] = [];

    for (let i = 0; i <= GRID_DIVISIONS; i++) {
      const z = -half + i * GRID_STEP;
      points.push(-half, 0, z, half, 0, z);
    }
    for (let i = 0; i <= GRID_DIVISIONS; i++) {
      const x = -half + i * GRID_STEP;
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
      opacity: OPACITY_IDLE,
      depthWrite: false,
      fog: true,
    });
    return { geometry, material };
  }, []);

  useEffect(() => {
    return () => {
      grid.geometry.dispose();
      grid.material.dispose();
    };
  }, [grid]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    // グリッドをカメラのXZ位置にスナップして端を見せない
    ref.current.position.x =
      Math.round(camera.position.x / GRID_STEP) * GRID_STEP;
    ref.current.position.z =
      Math.round(camera.position.z / GRID_STEP) * GRID_STEP;

    // セクション表示時にグリッドを明るく（フレームレート非依存）
    const target = sectionActive ? OPACITY_ACTIVE : OPACITY_IDLE;
    grid.material.opacity = THREE.MathUtils.lerp(
      grid.material.opacity,
      target,
      1 - Math.exp(-5 * delta),
    );
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
