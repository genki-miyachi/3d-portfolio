import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sectionLookOffsets } from './CameraRig';

const GRID_STEP = 5;
const FLOOR_Y = -12;

const sectionCells = sectionLookOffsets.slice(1).map(([x, , z]) => ({
  x: Math.floor(x / GRID_STEP) * GRID_STEP + GRID_STEP / 2,
  z: Math.floor(z / GRID_STEP) * GRID_STEP + GRID_STEP / 2,
}));

// 装飾用セル（遷移先でない、鈍く光るだけ）
const decoCells = [
  { x: 37.5, z: 42.5 },
  { x: -32.5, z: 47.5 },
  { x: 52.5, z: -22.5 },
  { x: -47.5, z: -37.5 },
  { x: 27.5, z: -52.5 },
  { x: -57.5, z: 22.5 },
  { x: 62.5, z: 32.5 },
  { x: -42.5, z: -57.5 },
  { x: 47.5, z: -42.5 },
  { x: -52.5, z: 37.5 },
  { x: 42.5, z: -12.5 },
  { x: -27.5, z: -47.5 },
  { x: 57.5, z: 17.5 },
  { x: -62.5, z: -12.5 },
  { x: 32.5, z: 57.5 },
  { x: -37.5, z: 52.5 },
  { x: 22.5, z: -42.5 },
  { x: -47.5, z: 47.5 },
];

const CELL_COLOR = new THREE.Color(0, 2, 0.5);
const DECO_COLOR = new THREE.Color(0, 1.2, 0.3);

// カメラ方向に応じた水平スリットの潰し軸
const slitAxis: ('x' | 'y')[] = ['y', 'x', 'y', 'x'];

interface SectionPanelsProps {
  activeSection: number | null;
  cameraReady: boolean;
}

export default function SectionPanels({
  activeSection,
  cameraReady,
}: SectionPanelsProps) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const decoRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // セクションセル
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const sectionIndex = i + 1;
      const isActive = activeSection === sectionIndex;
      const isClosing = isActive && cameraReady;

      const axis = slitAxis[i];
      if (isClosing) {
        const closeFactor = 1 - Math.exp(-12 * delta);
        mesh.scale[axis] = THREE.MathUtils.lerp(mesh.scale[axis], 0, closeFactor);
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, 1 - Math.exp(-10 * delta));
      } else {
        const restoreFactor = 1 - Math.exp(-5 * delta);
        mesh.scale.x = THREE.MathUtils.lerp(mesh.scale.x, 1, restoreFactor);
        mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, 1, restoreFactor);
        const baseOpacity = isActive ? 0.6 : 0.35;
        const pulseAmp = isActive ? 0.2 : 0.15;
        mat.opacity = baseOpacity + pulseAmp * Math.sin(t * 1.8 + i * 1.2);
      }
    });

    // 装飾セル（鈍いパルス + ランダムグリッチ）
    decoRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const base = 0.1 + 0.06 * Math.sin(t * 1.0 + i * 2.3);

      // 疑似ランダム周期でグリッチ窓を生成（セルごとにずらす）
      const cycle = (t * 0.7 + i * 5.3) % (4.5 + (i % 3) * 1.5);
      const isGlitching = cycle < 0.11;

      if (isGlitching) {
        // 電気信号グリッチ: 水平スリットに潰れて明るくフラッシュ
        mesh.scale.x = 1.3;
        mesh.scale.y = 0.03;
        mat.opacity = 0.6 + 0.3 * Math.sin(t * 80);
      } else {
        mat.opacity = base;
        const restoreFactor = 1 - Math.exp(-10 * delta);
        mesh.scale.x = THREE.MathUtils.lerp(mesh.scale.x, 1, restoreFactor);
        mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, 1, restoreFactor);
      }
    });
  });

  return (
    <group>
      {sectionCells.map((cell, i) => (
        <mesh
          key={`s${i}`}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          position={[cell.x, FLOOR_Y, cell.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[GRID_STEP, GRID_STEP]} />
          <meshBasicMaterial
            color={CELL_COLOR}
            transparent
            opacity={0.4}
            toneMapped={false}
            fog={false}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {decoCells.map((cell, i) => (
        <mesh
          key={`d${i}`}
          ref={(el) => {
            decoRefs.current[i] = el;
          }}
          position={[cell.x, FLOOR_Y, cell.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[GRID_STEP, GRID_STEP]} />
          <meshBasicMaterial
            color={DECO_COLOR}
            transparent
            opacity={0.1}
            toneMapped={false}
            fog={false}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
