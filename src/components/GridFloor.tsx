import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const RADIUS = 120;
const VERT_LINES = 60;

// 元の可視範囲からリングステップを算出（正方形セル）
const ORIG_BOTTOM = -40;
const ORIG_TOP = 60;
const ARC_LENGTH = (2 * Math.PI * RADIUS) / VERT_LINES;
const ORIG_RINGS = Math.round((ORIG_TOP - ORIG_BOTTOM) / ARC_LENGTH) + 1; // 9
const RING_STEP = (ORIG_TOP - ORIG_BOTTOM) / (ORIG_RINGS - 1); // 12.5

// リングステップの整数倍で延長（元のリング位置を保持）
const EXTEND_CELLS = 21;
const BOTTOM = ORIG_BOTTOM - EXTEND_CELLS * RING_STEP; // -302.5
const TOP = ORIG_TOP + EXTEND_CELLS * RING_STEP; // 322.5
const HORIZ_RINGS = ORIG_RINGS + 2 * EXTEND_CELLS; // 51

const OPACITY_IDLE = 0.15;
const OPACITY_ACTIVE = 0.35;

interface GridFloorProps {
  sectionActive?: boolean;
}

export default function GridFloor({ sectionActive = false }: GridFloorProps) {
  const ref = useRef<THREE.LineSegments>(null);

  const grid = useMemo(() => {
    const points: number[] = [];

    // 縦線: 半ステップずらして、セクション角(0°,90°…)がセル中心に来るようにする
    for (let i = 0; i < VERT_LINES; i++) {
      const theta = ((i + 0.5) / VERT_LINES) * Math.PI * 2;
      const x = RADIUS * Math.sin(theta);
      const z = RADIUS * Math.cos(theta);
      points.push(x, BOTTOM, z, x, TOP, z);
    }

    // 横リング: 半ステップずらす（RING_STEP はモジュールスコープで算出済み）
    for (let j = 0; j < HORIZ_RINGS; j++) {
      const y = BOTTOM + (j + 0.5) * RING_STEP;
      for (let i = 0; i < VERT_LINES; i++) {
        const theta1 = ((i + 0.5) / VERT_LINES) * Math.PI * 2;
        const theta2 = ((i + 1.5) / VERT_LINES) * Math.PI * 2;
        points.push(
          RADIUS * Math.sin(theta1),
          y,
          RADIUS * Math.cos(theta1),
          RADIUS * Math.sin(theta2),
          y,
          RADIUS * Math.cos(theta2),
        );
      }
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
    />
  );
}
